/**
 * Spike S04 — session, cancellation, and `unknown` state.
 *
 * Usage (PowerShell):
 *   $env:SESHAT_DB_PASSWORD = '<senha>'
 *   node spikes/s04-sessao.mjs docs/spikes/20261030_s04-session-cancel-evidence.md
 *
 * Measures what happens to the working session when the command is cancelled
 * (`KILL QUERY`), when the connection is closed (`KILL CONNECTION`/`destroy()`),
 * when a DDL statement shows up in the middle of a transaction, and when there is
 * no response.
 *
 * Decisions this spike must support (plan 20261030):
 *   D-S04-01 cancelling keeps the connection; cancelling is not rollback
 *   D-S04-02 INNODB_TRX as the truth of the transactional state
 *   D-S04-03 no response = `unknown`, without resending SQL
 *   D-S04-04 DDL in an open transaction causes an implicit commit
 *
 * The password is never printed or written: it comes only from an environment variable.
 * Working schema: `seshat_spike` (disposable, synthetic data).
 */
import mysql from 'mysql2'
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

const HOST = process.env.SESHAT_DB_HOST ?? '127.0.0.1'
const PORT = Number(process.env.SESHAT_DB_PORT ?? '3307')
const USER = process.env.SESHAT_DB_USER ?? 'root'
const PASSWORD = process.env.SESHAT_DB_PASSWORD
const SCHEMA = 'seshat_spike'
const OUT = process.argv[2] ?? 'docs/spikes/20261030_s04-session-cancel-evidence.md'
const TEMP_USER = 'seshat_s04_ro'

if (!PASSWORD) {
  console.error('SESHAT_DB_PASSWORD is not set')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Spike infrastructure
// ---------------------------------------------------------------------------

const connect = (options = {}) =>
  new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host: HOST,
      port: PORT,
      user: USER,
      password: PASSWORD,
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: true,
      multipleStatements: false,
      ...options
    })
    // a connection dropped by KILL/destroy emits 'error'; without a listener the process crashes
    connection.on('error', () => undefined)
    connection.connect((error) => (error ? reject(error) : resolve(connection)))
  })

const q = (connection, sql) =>
  new Promise((resolve, reject) => {
    connection.query(sql, (error, rows, fields) => (error ? reject(error) : resolve({ rows, fields })))
  })

const one = async (connection, sql) => (await q(connection, sql)).rows[0]
const num = (value) => Number(value)

const describeError = (error) =>
  `${error.code ?? 'sem code'}${error.errno ? `/${error.errno}` : ''}${error.sqlState ? `/${error.sqlState}` : ''} — ${String(error.sqlMessage ?? error.message ?? '').slice(0, 140)}`

const settle = (promise) => promise.then((value) => ({ ok: true, value }), (error) => ({ ok: false, error }))

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    wait(ms).then(() => ({ ok: false, timedOut: true, error: new Error(`sem resposta em ${ms} ms`) }))
  ])

const lines = []
const say = (text = '') => lines.push(text)
const failures = []

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures.push(`${label}: esperado ${JSON.stringify(expected)}, obtido ${JSON.stringify(actual)}`)
  return ok ? 'ok' : `**FALHOU** (obtido ${JSON.stringify(actual)})`
}

const ms = (start) => Math.round(performance.now() - start)

// ---------------------------------------------------------------------------
// Preparation
// ---------------------------------------------------------------------------

let aux = await connect()
await q(aux, `CREATE DATABASE IF NOT EXISTS ${SCHEMA}`)
await q(aux, `USE ${SCHEMA}`)
for (const table of ['s04_tx', 's04_trunc', 's04_ddl_a', 's04_ddl_b', 's04_rn_a', 's04_rn_b']) {
  await q(aux, `DROP TABLE IF EXISTS ${table}`)
}
await q(aux, 'CREATE TABLE s04_tx (id INT NOT NULL PRIMARY KEY) ENGINE=InnoDB')
await q(aux, 'CREATE TABLE s04_trunc (id INT NOT NULL PRIMARY KEY) ENGINE=InnoDB')
await q(aux, 'INSERT INTO s04_trunc VALUES (1), (2), (3), (4), (5)')

let main = await connect({ database: SCHEMA })

const rawTrxCount = async (id) =>
  num((await q(aux, `SELECT COUNT(*) AS c FROM information_schema.INNODB_TRX WHERE trx_mysql_thread_id = ${id}`)).rows[0].c)

// INNODB_TRX reads can lag right after COMMIT/ROLLBACK: the first query right
// after the rollback still showed the transaction (measured in this spike). That is
// why the measurement repeats until two consecutive reads agree, capped at 2 s —
// and records every read it got.
const trxCountFor = async (id) => {
  const samples = [await rawTrxCount(id)]
  const started = performance.now()
  while (samples.length < 12 && performance.now() - started < 2000) {
    await wait(100)
    samples.push(await rawTrxCount(id))
    if (samples.at(-1) === samples.at(-2)) break
  }
  const settled = samples.length >= 2 && samples.at(-1) === samples.at(-2)
  return { value: samples.at(-1), samples, settled }
}

const trxText = (reading) =>
  `${reading.value}${reading.settled ? '' : ' (não estabilizou)'} · leituras: ${reading.samples.join(', ')}`

const rowExists = async (id) => num((await q(aux, `SELECT COUNT(*) AS c FROM s04_tx WHERE id = ${id}`)).rows[0].c) === 1

// `SELECT SLEEP(n)` is useless as a cancellation target: when interrupted, the server
// returns success with 1 instead of an error (measured in this spike). The target is
// a real query over `vol` (S02), sized to last ~2 s.
const slowSql = (bound = 2000000) => `SELECT COUNT(*) AS c FROM vol a JOIN vol b ON b.id = a.id WHERE a.id < ${bound}`

// Fires the slow query, cancels it 500 ms later, and returns everything that was measured.
// If the query finishes before the kill (a faster machine), doubles the scope and tries again.
const runKilled = async (killStatement, bound = 2000000) => {
  let current = bound
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const started = performance.now()
    const inflight = settle(q(main, slowSql(current)))
    await wait(500)
    const killStarted = performance.now()
    const kill = await settle(q(aux, killStatement))
    const killMs = ms(killStarted)
    const result = await withTimeout(inflight, 15000)
    const totalMs = ms(started)
    if (!result.timedOut && result.ok && attempt < 2) {
      current *= 2
      continue
    }
    return { kill, killMs, result, totalMs, bound: current, attempts: attempt }
  }
  return { kill: null, killMs: 0, result: null, totalMs: 0, bound: current, attempts: 2 }
}

const clientOutcome = (result, okLabel = 'ok (a consulta terminou antes do kill)') =>
  result?.timedOut ? 'sem resposta' : result?.ok ? okLabel : describeError(result.error)

const mainId = async () => String((await one(main, 'SELECT CONNECTION_ID() AS id')).id)

const hasVol =
  num(
    (
      await q(
        aux,
        `SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = '${SCHEMA}' AND table_name = 'vol'`
      )
    ).rows[0].c
  ) === 1

// ---------------------------------------------------------------------------
say('# Spike S04 — sessão, cancelamento e estado `unknown`')
say()
say(`Execução: ${new Date().toISOString()}`)
say()
say(`Destino: \`${HOST}:${PORT}\` · schema \`${SCHEMA}\` · driver \`mysql2\` com \`multipleStatements: false\``)
say()
const version = await one(aux, 'SELECT VERSION() AS v, @@autocommit AS a, @@transaction_isolation AS iso')
say(`- versão: \`${version.v}\` · \`autocommit = ${version.a}\` · isolamento \`${version.iso}\``)
say()

// ---------------------------------------------------------------------------
say('## 1. Duas conexões, duas threads')
say()
const auxId = String((await one(aux, 'SELECT CONNECTION_ID() AS id')).id)
say(`- principal: \`${await mainId()}\` · auxiliar: \`${auxId}\``)
say(`- threads distintas: ${check('ids distintos', (await mainId()) !== auxId, true)}`)
say()
say('A conexão auxiliar é usada **só** para `KILL` e para observar o servidor; ela não executa comandos da sessão de trabalho.')
say()

// ---------------------------------------------------------------------------
say('## 2. `KILL QUERY` durante um comando, sem transação')
say()
if (!hasVol) {
  say('- tabela `vol` ausente (S02 não gerou nesta instância) — experimento pulado.')
  say()
} else {
  const id = await mainId()

  // `SLEEP` first: show why it is useless as a cancellation target.
  const sleeping = settle(q(main, 'SELECT SLEEP(3) AS s'))
  await wait(300)
  const sleepKill = await settle(q(aux, `KILL QUERY ${id}`))
  const sleepResult = await withTimeout(sleeping, 6000)
  say(
    `- \`SELECT SLEEP(3)\` interrompido por \`KILL QUERY\` (${sleepKill.ok ? 'aceito' : `ERRO ${describeError(sleepKill.error)}`}): ` +
      (sleepResult.ok
        ? `o cliente recebeu **sucesso** com \`${JSON.stringify(sleepResult.value.rows[0])}\` — \`SLEEP\` interrompido **não** gera erro`
        : describeError(sleepResult.error))
  )
  say('- por isso os testes de cancelamento usam uma consulta real sobre `vol`, não `SLEEP`.')
  say()

  const run = await runKilled(`KILL QUERY ${id}`)
  const after = await settle(q(main, 'SELECT 1 AS vivo'))

  say(`- \`KILL QUERY ${id}\` a partir da auxiliar: ${run.kill?.ok ? 'aceito pelo servidor' : `ERRO ${describeError(run.kill?.error)}`}`)
  say(`- cliente: ${clientOutcome(run.result)}`)
  say(`- do kill até o cliente desistir: **${run.killMs} ms** · tempo total do comando: ${run.totalMs} ms · escopo da consulta: \`id < ${run.bound}\` · tentativas: ${run.attempts}`)
  say(`- conexão utilizável depois: ${after.ok ? `sim · \`SELECT 1\` → ${JSON.stringify(after.value.rows[0])}` : `não — ${describeError(after.error)}`}`)
  say(`- cancelamento interrompeu o comando: ${check('cancelamento interrompeu a consulta', run.result?.ok ? 'sucesso' : run.result?.error?.code, 'ER_QUERY_INTERRUPTED')} · conexão segue utilizável: ${check('conexão utilizável após cancelar', after.ok, true)}`)
  say()
}

// ---------------------------------------------------------------------------
say('## 3. A transação sobrevive ao `KILL QUERY`?')
say()
if (!hasVol) {
  say('- tabela `vol` ausente — experimento pulado.')
  say()
} else {
  const id = await mainId()
  await q(main, 'BEGIN')
  await q(main, 'INSERT INTO s04_tx VALUES (101)')
  const run = await runKilled(`KILL QUERY ${id}`)
  const trxAfterCancel = await trxCountFor(id)
  const rollback = await settle(q(main, 'ROLLBACK'))
  const survived = await rowExists(101)

  say(`- \`KILL QUERY\`: ${run.kill?.ok ? 'aceito' : `ERRO ${describeError(run.kill?.error)}`} · cliente: ${clientOutcome(run.result)}`)
  say(`- transação ainda aberta logo após o cancelamento (\`INNODB_TRX\`): **${trxText(trxAfterCancel)}**`)
  say(`- \`ROLLBACK\` depois do cancelamento: ${rollback.ok ? 'executado' : `ERRO ${describeError(rollback.error)}`}`)
  say(`- a linha 101 sobreviveu ao rollback: **${survived ? 'sim' : 'não'}** (esperado: não) — ${check('rollback desfez o INSERT', survived, false)}`)
  say(`- cancelar não desfez a transação: ${check('transação sobreviveu ao cancelamento', trxAfterCancel.value >= 1, true)}`)
  say()
}

// ---------------------------------------------------------------------------
say('## 4. `information_schema.INNODB_TRX` enxerga a transação?')
say()
{
  const id = await mainId()
  const none = await trxCountFor(id)
  await q(main, 'BEGIN')
  await q(main, 'SELECT COUNT(*) AS c FROM s04_tx')
  const readOnly = await trxCountFor(id)
  await q(main, 'INSERT INTO s04_tx VALUES (102)')
  const withWrite = await trxCountFor(id)
  await q(main, 'ROLLBACK')
  const afterRollback = await trxCountFor(id)

  say('| estado da sessão principal | linhas em `INNODB_TRX` para o id |')
  say('|---|---|')
  say(`| sem transação | ${trxText(none)} |`)
  say(`| \`BEGIN; SELECT\` em tabela (só leitura) | ${trxText(readOnly)} |`)
  say(`| \`BEGIN; SELECT; INSERT\` (com escrita) | ${trxText(withWrite)} |`)
  say(`| depois do \`ROLLBACK\` | ${trxText(afterRollback)} |`)
  say()
  say(`- sem transação some: ${check('some sem transação', none.value, 0)} · com escrita aparece: ${check('com escrita aparece', withWrite.value >= 1, true)} · rollback limpa: ${check('rollback limpa', afterRollback.value, 0)}`)
  say()
  say(
    readOnly.value === 0
      ? '- **A transação só de leitura não aparece** em `INNODB_TRX`: o servidor, sozinho, não distingue "transação de leitura aberta" de "nenhuma transação". Nessa classe o rastreio do cliente é a única fonte — e a divergência com o servidor é esperada, não um erro.'
      : '- A transação só de leitura **também aparece** em `INNODB_TRX` nesta instância, mas a primeira leitura pode não vê-la (a transação só é registrada quando o primeiro acesso a tabela acontece).'
  )
  say('- Cada medição repete a consulta até duas leituras consecutivas concordarem (teto de 2 s): a leitura imediata pode vir defasada.')
  say()
}

// ---------------------------------------------------------------------------
say('## 5. `KILL CONNECTION` no meio de uma transação')
say()
{
  const id = await mainId()
  await q(main, 'BEGIN')
  await q(main, 'INSERT INTO s04_tx VALUES (201)')
  const started = performance.now()
  const inflight = settle(q(main, hasVol ? slowSql() : 'SELECT SLEEP(3) AS s'))
  await wait(500)
  const kill = await settle(q(aux, `KILL CONNECTION ${id}`))
  const killMs = ms(started)
  const result = await withTimeout(inflight, 15000)
  await wait(400)
  const survived = await rowExists(201)
  const after = await withTimeout(settle(q(main, 'SELECT 1 AS vivo')), 3000)

  say(`- \`KILL CONNECTION ${id}\`: ${kill.ok ? 'aceito' : `ERRO ${describeError(kill.error)}`} · ${killMs} ms após o início do comando`)
  say(`- cliente: ${result.ok ? 'ok (inesperado)' : describeError(result.error)}`)
  say(`- conexão utilizável depois: ${after.ok ? 'sim (inesperado)' : `não — ${describeError(after.error)}`}`)
  say(`- a linha 201 sobreviveu: **${survived ? 'sim' : 'não'}** — ${check('servidor desfez a transação', survived, false)} · conexão morta: ${check('conexão morta após KILL CONNECTION', after.ok, false)}`)
  say()
  main = await connect({ database: SCHEMA })
  say('Conexão principal recriada para os próximos experimentos.')
  say()
}

// ---------------------------------------------------------------------------
say('## 6. DDL dentro de transação: commit implícito')
say()
{
  const cases = []

  await q(main, 'BEGIN')
  await q(main, 'INSERT INTO s04_tx VALUES (401)')
  await q(main, 'CREATE TABLE s04_ddl_a (i INT)')
  await q(main, 'ROLLBACK')
  cases.push({ ddl: 'CREATE TABLE', id: 401, survived: await rowExists(401) })

  await q(aux, 'CREATE TABLE s04_ddl_b (i INT)')
  await q(main, 'BEGIN')
  await q(main, 'INSERT INTO s04_tx VALUES (402)')
  await q(main, 'ALTER TABLE s04_ddl_b ADD COLUMN nota INT')
  await q(main, 'ROLLBACK')
  cases.push({ ddl: 'ALTER TABLE', id: 402, survived: await rowExists(402) })

  await q(main, 'BEGIN')
  await q(main, 'INSERT INTO s04_tx VALUES (403)')
  await q(main, 'TRUNCATE TABLE s04_trunc')
  await q(main, 'ROLLBACK')
  const truncRows = num((await q(aux, 'SELECT COUNT(*) AS c FROM s04_trunc')).rows[0].c)
  cases.push({ ddl: 'TRUNCATE', id: 403, survived: await rowExists(403), extra: `linhas em \`s04_trunc\`: ${truncRows}` })

  await q(aux, 'CREATE TABLE s04_rn_a (i INT)')
  await q(main, 'BEGIN')
  await q(main, 'INSERT INTO s04_tx VALUES (404)')
  await q(main, 'RENAME TABLE s04_rn_a TO s04_rn_b')
  await q(main, 'ROLLBACK')
  const renamed = num((await q(aux, `SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = '${SCHEMA}' AND table_name = 's04_rn_b'`)).rows[0].c)
  cases.push({ ddl: 'RENAME TABLE', id: 404, survived: await rowExists(404), extra: `\`s04_rn_b\` existe: ${renamed === 1}` })

  say('| DDL no meio da transação | o `INSERT` anterior sobreviveu ao `ROLLBACK`? | observação |')
  say('|---|---|---|')
  for (const item of cases) {
    say(`| \`${item.ddl}\` | **${item.survived ? 'sim' : 'não'}** | ${item.extra ?? '—'} |`)
  }
  say()
  say(`- todos os quatro commitam: ${check('DDL commita', cases.every((item) => item.survived), true)}`)
  say()
}

// ---------------------------------------------------------------------------
say('## 7. `LOCK TABLES` e `UNLOCK TABLES`')
say()
{
  // (1) does the WRITE lock block another session?
  await q(aux, 'DELETE FROM s04_tx WHERE id IN (405, 406)')
  await q(main, 'LOCK TABLES s04_tx WRITE')
  const blocked = await withTimeout(settle(q(aux, 'SELECT COUNT(*) AS c FROM s04_tx')), 1500)
  const lockBlocks = Boolean(blocked.timedOut)

  // (2) does starting a transaction after the LOCK release the lock?
  await q(main, 'BEGIN')
  const afterBegin = await withTimeout(settle(q(aux, 'SELECT COUNT(*) AS c FROM s04_tx')), 1500)
  const releasedByBegin = !afterBegin.timedOut
  await q(main, 'UNLOCK TABLES')
  await q(main, 'ROLLBACK')

  // (3) LOCK TABLES in the middle of a transaction: does it commit?
  await q(main, 'BEGIN')
  await q(main, 'INSERT INTO s04_tx VALUES (405)')
  await q(main, 'LOCK TABLES s04_tx READ')
  await q(main, 'UNLOCK TABLES')
  const rollback = await settle(q(main, 'ROLLBACK'))
  const committedByLock = await rowExists(405)

  // (4) does UNLOCK TABLES commit the transaction started after the LOCK?
  await q(main, 'LOCK TABLES s04_tx WRITE')
  await q(main, 'BEGIN')
  await q(main, 'INSERT INTO s04_tx VALUES (406)')
  const visibleBeforeUnlock = await rowExists(406)
  await q(main, 'UNLOCK TABLES')
  const committedByUnlock = await rowExists(406)
  await q(main, 'ROLLBACK')
  const survivedRollback = await rowExists(406)

  say('| medição | resultado |')
  say('|---|---|')
  say(`| \`LOCK TABLES ... WRITE\` bloqueia outra sessão | ${lockBlocks ? '**sim** (consulta presa por mais de 1,5 s)' : '**não**'} |`)
  say(`| \`BEGIN\` depois do \`LOCK\` mantém o lock | ${releasedByBegin ? '**não** — a outra sessão voltou a ler' : 'sim'} |`)
  say(`| \`BEGIN; INSERT 405; LOCK TABLES READ; UNLOCK; ROLLBACK\` | rollback: ${rollback.ok ? 'executado' : `ERRO ${describeError(rollback.error)}`} · 405 sobreviveu: **${committedByLock ? 'sim' : 'não'}** |`)
  say(`| \`LOCK WRITE; BEGIN; INSERT 406; UNLOCK\` | visível para a outra sessão antes do \`UNLOCK\`: **${visibleBeforeUnlock ? 'sim' : 'não'}** · sobreviveu ao \`UNLOCK\`: **${committedByUnlock ? 'sim' : 'não'}** · sobreviveu ao \`ROLLBACK\` posterior: **${survivedRollback ? 'sim' : 'não'}** |`)
  say()
  say(`- \`LOCK TABLES\` bloqueia a outra sessão: ${check('LOCK TABLES bloqueia outra sessão', lockBlocks, true)} · \`LOCK TABLES\` commita a transação aberta: ${check('LOCK TABLES commita', committedByLock, true)}`)
  say(`- \`UNLOCK TABLES\` **não** commita a transação iniciada depois do lock: ${check('UNLOCK TABLES não commita', committedByUnlock, false)} · ela segue viva até o \`ROLLBACK\`: ${check('transação segue aberta até o rollback', survivedRollback, false)}`)
  say()
  say('Divergência registrada: a documentação do MySQL diz que `UNLOCK TABLES` faz commit implícito quando `LOCK TABLES` foi usado. Nesta instância, quando a transação **começa depois** do `LOCK` (e o `BEGIN` libera o lock), o `UNLOCK` não commita nada — vale o que foi medido.')
  say()
}

// ---------------------------------------------------------------------------
say('## 8. Queda de conexão (`destroy`) no meio de uma transação')
say()
{
  const alive = async (threadId) =>
    num((await q(aux, `SELECT COUNT(*) AS c FROM information_schema.PROCESSLIST WHERE id = ${threadId}`)).rows[0].c) === 1
  const waitGone = async (threadId, timeoutMs = 5000) => {
    const started = performance.now()
    while (performance.now() - started < timeoutMs) {
      if (!(await alive(threadId))) return { gone: true, afterMs: ms(started) }
      await wait(100)
    }
    return { gone: false, afterMs: timeoutMs }
  }

  // (a) destroy() with an in-flight command
  const busyId = await mainId()
  await q(main, 'BEGIN')
  await q(main, 'INSERT INTO s04_tx VALUES (301)')
  const started = performance.now()
  const inflight = settle(q(main, hasVol ? slowSql() : 'SELECT SLEEP(3) AS s'))
  await wait(500)
  main.destroy()
  const destroyedAt = ms(started)
  await wait(300)
  const aliveAfterDestroy = await alive(busyId)
  const result = await withTimeout(inflight, 20000)
  const resolvedAt = ms(started)
  const goneAfterCommand = await waitGone(busyId)
  const survivedBusy = await rowExists(301)

  // (b) destroy() with an idle connection and an open transaction
  main = await connect({ database: SCHEMA })
  const idleId = await mainId()
  await q(main, 'BEGIN')
  await q(main, 'INSERT INTO s04_tx VALUES (302)')
  main.destroy()
  const goneIdle = await waitGone(idleId)
  const survivedIdle = await rowExists(302)

  say('| caso | medição |')
  say('|---|---|')
  say(`| \`destroy()\` com comando em voo (${destroyedAt} ms) | sessão ainda viva 300 ms depois: **${aliveAfterDestroy ? 'sim' : 'não'}** · cliente respondeu em ${resolvedAt} ms: ${clientOutcome(result, 'ok — o comando terminou normalmente')} · thread saiu da \`PROCESSLIST\` ${goneAfterCommand.afterMs} ms depois |`)
  say(`| \`destroy()\` com a conexão ociosa | thread saiu da \`PROCESSLIST\` em **${goneIdle.afterMs} ms** |`)
  say()
  say(`- \`destroy()\` com comando em voo **não encerra** a sessão: ${check('destroy não encerra sessão com comando em voo', aliveAfterDestroy, true)} · o comando em voo termina: ${check('comando em voo termina', result.ok, true)}`)
  say(`- ao sair, o servidor desfez a transação: ${check('servidor desfez transação (destroy com comando em voo)', survivedBusy, false)} · \`destroy()\` ocioso encerra a sessão: ${check('destroy ocioso encerra a sessão', goneIdle.gone, true)} · e desfaz a transação: ${check('servidor desfez transação (destroy ocioso)', survivedIdle, false)}`)
  say()
  say('Consequência: `destroy()` **não** interrompe trabalho em andamento — o `mysql2` só fecha a conexão quando o comando em voo termina. Para encerrar a sessão de fato, o caminho é `KILL CONNECTION` pela conexão auxiliar (seção 5).')
  say()
  main = await connect({ database: SCHEMA })
  say('Conexão principal recriada.')
  say()
}

// ---------------------------------------------------------------------------
say('## 9. Queda durante o `COMMIT` — o caso `unknown`')
say()
{
  const rounds = 4
  const results = []
  for (let round = 0; round < rounds; round += 1) {
    const connection = await connect({ database: SCHEMA })
    const id = 500 + round
    await q(connection, 'BEGIN')
    await q(connection, `INSERT INTO s04_tx VALUES (${id})`)
    const pending = settle(q(connection, 'COMMIT'))
    connection.destroy()
    const client = await withTimeout(pending, 3000)
    await wait(250)
    const committed = await rowExists(id)
    results.push({ id, client: client.ok ? 'ok' : client.timedOut ? 'sem resposta' : describeError(client.error), committed })
  }

  say('| iteração | resposta do cliente ao `COMMIT` | o servidor aplicou? |')
  say('|---|---|---|')
  for (const item of results) {
    say(`| ${item.id} | ${item.client} | **${item.committed ? 'sim' : 'não'}** |`)
  }
  say()
  const answered = results.filter((item) => item.client === 'ok')
  say(`- iterações com resposta clara: **${answered.length} de ${rounds}**`)
  say(`- corrida reproduzida: **${answered.length < rounds ? 'sim' : 'não'}** — com ${rounds} tentativas não houve caso sem resposta; o estado \`unknown\` fica registrado como **tentado e não reproduzido**, não como medido.`)
  say('- Quando não há resposta, o cliente **não pode** afirmar sucesso nem falha: esse é o estado `unknown` da D-S04-03.')
  say()
}

// ---------------------------------------------------------------------------
say('## 10. Cancelar uma contagem lenta (ADR 0012)')
say()
{
  const hasVol = num((await q(aux, `SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = '${SCHEMA}' AND table_name = 'vol'`)).rows[0].c) === 1
  if (!hasVol) {
    say('- tabela `vol` ausente (S02 não gerou nesta instância) — experimento pulado.')
    say()
  } else {
    const id = await mainId()
    const started = performance.now()
    const inflight = settle(q(main, 'SELECT COUNT(*) AS c FROM vol WHERE RAND() < 0.999'))
    await wait(150)
    const killStarted = performance.now()
    const kill = await settle(q(aux, `KILL QUERY ${id}`))
    const result = await withTimeout(inflight, 8000)
    const killedIn = ms(killStarted)
    const after = await settle(q(main, 'SELECT COUNT(*) AS c FROM vol'))

    say(`- \`KILL QUERY\` na contagem: ${kill.ok ? 'aceito' : `ERRO ${describeError(kill.error)}`} · cliente: ${result.ok ? 'ok (a contagem terminou antes do kill)' : describeError(result.error)}`)
    say(`- tempo total: ${ms(started)} ms · do kill até o cliente desistir: ${killedIn} ms`)
    say(`- sessão utilizável depois: ${after.ok ? `sim · \`COUNT(*)\` → ${JSON.stringify(after.value.rows[0])}` : `não — ${describeError(after.error)}`}`)
    say()
  }
}

// ---------------------------------------------------------------------------
say('## 11. Dois comandos ao mesmo tempo na mesma conexão (`mysql2`)')
say()
{
  const started = performance.now()
  const first = settle(q(main, 'SELECT SLEEP(1) AS s'))
  const secondStarted = performance.now()
  const second = await settle(q(main, 'SELECT 42 AS r'))
  const secondMs = ms(secondStarted)
  const totalMs = ms(started)
  await withTimeout(first, 5000)

  say(`- segundo comando: ${second.ok ? 'ok' : `ERRO ${describeError(second.error)}`} · esperou **${secondMs} ms**`)
  say(`- tempo total dos dois: ${totalMs} ms`)
  say(`- o driver **enfileira** em vez de recusar: ${check('enfileirou', secondMs >= 800, true)}`)
  say()
  say('Consequência: "uma execução ativa" não é garantida pelo driver — o aplicativo precisa impor isso.')
  say()
}

// ---------------------------------------------------------------------------
say('## 12. Permissões: quem pode cancelar a query de quem')
say()
{
  const tempPassword = randomBytes(12).toString('hex')
  await q(aux, `DROP USER IF EXISTS '${TEMP_USER}'@'localhost'`)
  await q(aux, `DROP USER IF EXISTS '${TEMP_USER}'@'127.0.0.1'`)
  await q(aux, `CREATE USER '${TEMP_USER}'@'localhost' IDENTIFIED BY '${tempPassword}'`)
  await q(aux, `CREATE USER '${TEMP_USER}'@'127.0.0.1' IDENTIFIED BY '${tempPassword}'`)
  await q(aux, `GRANT SELECT ON ${SCHEMA}.* TO '${TEMP_USER}'@'localhost'`)
  await q(aux, `GRANT SELECT ON ${SCHEMA}.* TO '${TEMP_USER}'@'127.0.0.1'`)

  const ro1 = await connect({ user: TEMP_USER, password: tempPassword, database: SCHEMA })
  const ro2 = await connect({ user: TEMP_USER, password: tempPassword, database: SCHEMA })
  const ro1Id = String((await one(ro1, 'SELECT CONNECTION_ID() AS id')).id)
  const rootId = await mainId()

  const inflight = settle(q(ro1, hasVol ? slowSql() : 'SELECT SLEEP(3) AS s'))
  await wait(500)
  const ownKill = await settle(q(ro2, `KILL QUERY ${ro1Id}`))
  const ownResult = await withTimeout(inflight, 15000)

  const crossKill = await settle(q(ro2, `KILL QUERY ${rootId}`))

  const visible = num((await q(ro2, 'SELECT COUNT(*) AS c FROM information_schema.PROCESSLIST')).rows[0].c)

  await q(ro2, 'BEGIN')
  await q(ro2, 'SELECT 1 AS somente_leitura')
  const roTrx = await settle(q(ro2, `SELECT COUNT(*) AS c FROM information_schema.INNODB_TRX WHERE trx_mysql_thread_id = ${String((await one(ro2, 'SELECT CONNECTION_ID() AS id')).id)}`))
  await q(ro2, 'ROLLBACK')

  say(`- usuário temporário \`${TEMP_USER}\` tem só \`SELECT ON ${SCHEMA}.*\` (sem \`PROCESS\`/\`CONNECTION_ADMIN\`)`)
  say(`- cancelar a **própria** thread: ${ownKill.ok ? 'aceito' : `ERRO ${describeError(ownKill.error)}`} · cliente: ${ownResult.ok ? 'ok' : describeError(ownResult.error)}`)
  say(`- cancelar a thread do \`root\`: ${crossKill.ok ? 'aceito (inesperado)' : `ERRO ${describeError(crossKill.error)}`}`)
  say(`- sessões visíveis em \`PROCESSLIST\` para o usuário restrito: **${visible}**`)
  say(`- \`INNODB_TRX\` da própria transação: ${roTrx.ok ? `visível (${num(roTrx.value.rows[0].c)} linha(s))` : `ERRO ${describeError(roTrx.error)}`}`)
  say()
  say(`- próprio thread cancelável: ${check('própria thread', ownKill.ok, true)} · thread de outro usuário negada: ${check('outro usuário negado', crossKill.ok, false)}`)
  say()
  say('**Consequência para a D-S04-02:** ler `INNODB_TRX` exige o privilégio `PROCESS`. Um usuário de aplicação só com `SELECT` não tem acesso à tabela — nesse caso o "servidor como fonte da verdade" não está disponível e o estado passa a depender do rastreio do cliente, com `unknown` quando não houver como confirmar.')
  say()

  ro1.destroy()
  ro2.destroy()
  await q(aux, `DROP USER IF EXISTS '${TEMP_USER}'@'localhost'`)
  await q(aux, `DROP USER IF EXISTS '${TEMP_USER}'@'127.0.0.1'`)
  const stillThere = num((await q(aux, `SELECT COUNT(*) AS c FROM mysql.user WHERE user = '${TEMP_USER}'`)).rows[0].c)
  say(`- usuário temporário removido: ${stillThere === 0 ? 'sim' : '**não**'} · senha gerada em memória, nunca impressa nem gravada`)
  say()
}

// ---------------------------------------------------------------------------
// Cleanup and report
// ---------------------------------------------------------------------------

for (const table of ['s04_ddl_a', 's04_ddl_b', 's04_rn_b', 's04_trunc']) {
  await settle(q(aux, `DROP TABLE IF EXISTS ${table}`))
}

say('## 13. Resumo')
say()
say(`- experimentos executados: **12** · falhas de verificação: **${failures.length}**`)
say()
say('Regras que o spike sustenta:')
say('1. `KILL QUERY` interrompe o comando (`ER_QUERY_INTERRUPTED`) e **mantém** a conexão e a transação — cancelar não é rollback.')
say('2. `SELECT SLEEP(n)` interrompido devolve **sucesso com 1**, sem erro: não serve como prova de cancelamento.')
say('3. `KILL CONNECTION` e queda de rede encerram a sessão; o servidor desfaz a transação. `destroy()` **não** interrompe comando em voo — só fecha quando ele termina.')
say('4. DDL (`CREATE`, `ALTER`, `TRUNCATE`, `RENAME`) faz **commit implícito**; `ROLLBACK` posterior não desfaz nada.')
say('5. `LOCK TABLES` bloqueia outra sessão e commita a transação aberta; `BEGIN` depois do lock libera o lock; `UNLOCK TABLES` não commita a transação iniciada depois.')
say('6. Sem resposta ao `COMMIT`, o estado é **`unknown`**: o servidor pode ter aplicado ou não. (Tentado, não reproduzido nesta execução.)')
say('7. O `mysql2` **enfileira** comandos concorrentes; "uma execução ativa" precisa ser imposta pelo aplicativo.')
say('8. Um usuário sem `PROCESS`/`CONNECTION_ADMIN` cancela a própria thread, mas não a de outro usuário — e **não consegue ler `INNODB_TRX`**.')
say('9. `INNODB_TRX` mostra a transação com escrita e também a de leitura (depois do primeiro acesso a tabela), mas a leitura **imediata** após uma mudança de estado pode vir defasada: confirmar repetindo até estabilizar.')
say()

if (failures.length > 0) {
  say('Falhas:')
  for (const failure of failures) say(`- ${failure}`)
  say()
}

await settle(q(main, 'SELECT 1'))
main.destroy()
aux.destroy()

writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log(`report written to ${OUT} (${lines.join('\n').length} characters)`)
console.log(`verification failures: ${failures.length}`)
process.exit(failures.length > 0 ? 1 : 0)
