/**
 * Spike S02 — volume, memory, streaming/drain, counting, and cell size.
 *
 * Usage (PowerShell):
 *   $env:SESHAT_DB_PASSWORD = '<senha>'
 *   node --expose-gc spikes/s02-volume.mjs docs/spikes/20261029_s02-volume-evidence.md
 *
 * Variables: SESHAT_DB_HOST/PORT/USER/PASSWORD and SESHAT_S02_ROWS (default 2000000).
 *
 * The password is never printed or written: it comes only from an environment variable.
 * The working schema is `seshat_spike`, disposable, with synthetic data.
 * No statement with side effects is re-executed; only synthetic DDL/INSERT/TRUNCATE.
 */
import mysql from 'mysql2'
import { writeFileSync } from 'node:fs'
import { getHeapStatistics } from 'node:v8'

const HOST = process.env.SESHAT_DB_HOST ?? '127.0.0.1'
const PORT = Number(process.env.SESHAT_DB_PORT ?? '3307')
const USER = process.env.SESHAT_DB_USER ?? 'root'
const PASSWORD = process.env.SESHAT_DB_PASSWORD
const TOTAL_ROWS = Number(process.env.SESHAT_S02_ROWS ?? '2000000')
const SCHEMA = 'seshat_spike'
const OUT = process.argv[2] ?? 'docs/spikes/20261029_s02-volume-evidence.md'

if (!PASSWORD) {
  console.error('SESHAT_DB_PASSWORD is not set')
  process.exit(1)
}
if (!global.gc) {
  console.error('run with --expose-gc to measure memory honestly')
  process.exit(1)
}

const lines = []
const say = (text = '') => lines.push(text)
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`
const fmt = (n) => n.toLocaleString('en-US')
const ms = (t0) => Math.round(Number(process.hrtime.bigint() - t0) / 1e6)

function memNow() {
  global.gc()
  const m = process.memoryUsage()
  return { rss: m.rss, heap: m.heapUsed, ext: m.arrayBuffers }
}

function memDelta(before, after) {
  return {
    rss: after.rss - before.rss,
    heap: after.heap - before.heap,
    ext: after.ext - before.ext
  }
}

const conn = await mysql.createConnection({
  host: HOST,
  port: PORT,
  user: USER,
  password: PASSWORD,
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: true,
  multipleStatements: false
})

conn.on('error', (error) => {
  console.error(`connection reported an error: ${error.code ?? error.message}`)
})

const withTimeout = (promise, msWait) =>
  Promise.race([
    promise,
    new Promise((_resolve, reject) =>
      setTimeout(() => reject(Object.assign(new Error(`sem resposta em ${msWait} ms`), { code: 'TIMEOUT' })), msWait)
    )
  ])

const q = (sql, params) =>
  new Promise((resolve, reject) => {
    conn.query(sql, params, (err, rows, fields) => (err ? reject(err) : resolve({ rows, fields })))
  })

const describeError = (error) =>
  `ERRO · code=${error.code} errno=${error.errno} sqlState=${error.sqlState} msg="${String(error.message).slice(0, 180)}"`

say('# Spike S02 — volume, memória, streaming e contagem')
say()
say(`Execução: ${new Date().toISOString()}`)
say()
say(`Destino: \`${HOST}:${PORT}\` · usuário \`${USER}\` · schema de trabalho \`${SCHEMA}\``)
say()

const base = memNow()
say('## 0. Linha de base do processo')
say()
say(`- rss inicial: ${mb(base.rss)} · heapUsed: ${mb(base.heap)} · arrayBuffers: ${mb(base.ext)}`)
say(`- Node: ${process.version} · heap máximo disponível: ${mb(getHeapStatistics().heap_size_limit)}`)
say()

// ---------------------------------------------------------------- 1. environment
{
  const { rows } = await q(
    'SELECT VERSION() AS versao, @@max_allowed_packet AS max_packet, @@innodb_buffer_pool_size AS pool'
  )
  const r = rows[0]
  say('## 1. Servidor')
  say()
  say(`- versão: \`${r.versao}\``)
  say(`- max_allowed_packet: ${fmt(Number(r.max_packet))} bytes (${mb(Number(r.max_packet))})`)
  say(`- innodb_buffer_pool_size: ${fmt(Number(r.pool))} bytes (${mb(Number(r.pool))})`)
  say()
}

// ---------------------------------------------------------------- 2. generation
{
  say('## 2. Geração dos dados sintéticos')
  say()
  await q(`CREATE DATABASE IF NOT EXISTS ${SCHEMA}`)
  await q(`USE ${SCHEMA}`)
  await q(`CREATE TABLE IF NOT EXISTS vol (
    id BIGINT NOT NULL PRIMARY KEY,
    num INT NOT NULL,
    payload VARCHAR(120) NOT NULL
  ) ENGINE=InnoDB`)
  const { rows: existing } = await q('SELECT COUNT(*) AS c FROM vol')
  if (Number(existing[0].c) === TOTAL_ROWS) {
    say(`- tabela \`vol\` já contém ${fmt(TOTAL_ROWS)} linhas: **geração reaproveitada** (nada foi inserido)`)
    say()
    const { rows: size } = await q(
      `SELECT data_length + index_length AS bytes FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'vol'`,
      [SCHEMA]
    )
    say(`- tamanho em disco (dados + índice): ${mb(Number(size[0].bytes))}`)
    say()
  } else {
    await q('TRUNCATE TABLE vol')

    const chunk = 200000
    const d = '(SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9)'
    const combo = 'a.d + b.d*10 + c.d*100 + e.d*1000 + f.d*10000 + g.d*100000'
    const t0 = process.hrtime.bigint()
    let inserted = 0
    while (inserted < TOTAL_ROWS) {
      const n = Math.min(chunk, TOTAL_ROWS - inserted)
      const tChunk = process.hrtime.bigint()
      await q(
        `INSERT INTO vol (id, num, payload)
         SELECT ? + (${combo}) + 1,
                FLOOR(RAND() * 1000000),
                CONCAT('linha ', ? + (${combo}) + 1, ' payload sintético')
         FROM ${d} a, ${d} b, ${d} c, ${d} e, ${d} f, ${d} g
         ORDER BY (${combo})
         LIMIT ${n}`,
        [inserted, inserted]
      )
      inserted += n
      say(`- lote ${fmt(n)} linhas: ${ms(tChunk)} ms (acumulado ${fmt(inserted)})`)
    }
    await q('ANALYZE TABLE vol')
    const { rows } = await q('SELECT COUNT(*) AS c FROM vol')
    const { rows: size } = await q(
      `SELECT data_length + index_length AS bytes FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'vol'`,
      [SCHEMA]
    )
    say()
    say(`- total inserido: **${fmt(Number(rows[0].c))}** linhas em **${ms(t0)} ms**`)
    say(`- tamanho em disco (dados + índice): ${mb(Number(size[0].bytes))}`)
    say()
  }
}

// ------------------------------------------------------- 3. in-memory fetch
async function buffered(limit) {
  const before = memNow()
  const t0 = process.hrtime.bigint()
  const { rows } = await q(`SELECT id, num, payload FROM vol ORDER BY id LIMIT ${limit}`)
  const elapsed = ms(t0)
  const after = memNow()
  const d = memDelta(before, after)
  return { count: rows.length, elapsed, d }
}

{
  say('## 3. Resultado inteiro em memória (`query` / `execute` bufferizado)')
  say()
  say('| linhas pedidas | linhas recebidas | tempo | Δrss | ΔheapUsed | ΔarrayBuffers | rss por linha |')
  say('|---|---|---|---|---|---|---|')
  for (const limit of [10000, 100000, 300000]) {
    if (limit > TOTAL_ROWS) continue
    const r = await buffered(limit)
    say(
      `| ${fmt(limit)} | ${fmt(r.count)} | ${r.elapsed} ms | ${mb(r.d.rss)} | ${mb(r.d.heap)} | ${mb(r.d.ext)} | ${Math.round(r.d.rss / r.count)} B |`
    )
  }
  say()
}

// ------------------------------------------------------------- 4. streaming
function samplePeak() {
  const m0 = process.memoryUsage()
  const peak = { rss: m0.rss, heap: m0.heapUsed }
  const id = setInterval(() => {
    const m = process.memoryUsage()
    if (m.rss > peak.rss) peak.rss = m.rss
    if (m.heapUsed > peak.heap) peak.heap = m.heapUsed
  }, 50)
  return { peak, stop: () => clearInterval(id) }
}

{
  say('## 4. Streaming completo (`query(...).stream()`) — drenar tudo sem reter')
  say()
  const before = memNow()
  const sampler = samplePeak()
  const t0 = process.hrtime.bigint()
  let firstRow = null
  let count = 0
  let bytes = 0
  const stream = conn.query('SELECT id, num, payload FROM vol ORDER BY id').stream()
  stream.on('data', (row) => {
    if (firstRow === null) firstRow = ms(t0)
    count += 1
    bytes += row.payload.length
  })
  await new Promise((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
  })
  const elapsed = ms(t0)
  sampler.stop()
  const after = memNow()
  const d = memDelta(before, after)
  say(`- linhas drenadas: **${fmt(count)}**`)
  say(`- tempo total: **${elapsed} ms** · primeira linha em **${firstRow} ms**`)
  say(`- pico de rss durante o stream: ${mb(sampler.peak.rss)} · Δrss ao final: ${mb(d.rss)} · Δheap: ${mb(d.heap)}`)
  say(`- bytes de payload trafegados: ${mb(bytes)}`)
  say(`- rss por linha retida: ${mb(d.rss / count)} (deve tender a zero — nada é retido)`)
  say()
}

// -------------------------------------------------- 5. stop early + destroy
{
  say('## 5. Parar o stream cedo (1.000 linhas) e destruir a conexão')
  say()
  const stream = conn.query('SELECT id, num, payload FROM vol ORDER BY id').stream()
  let count = 0
  const t0 = process.hrtime.bigint()
  await new Promise((resolve) => {
    stream.on('data', () => {
      count += 1
      if (count === 1000) {
        stream.pause()
        resolve(null)
      }
    })
  })
  say(`- linhas lidas antes do pause: **${count}** em **${ms(t0)} ms**`)
  const memPaused = memNow()
  say(`- rss com stream pausado: ${mb(memPaused.rss)} (backpressure ativo)`)
  stream.destroy()
  await new Promise((resolve) => setTimeout(resolve, 100))
  try {
    const { rows } = await withTimeout(q('SELECT 1 AS ok'), 5000)
    say(`- \`SELECT 1\` após \`destroy()\` na MESMA conexão: **funcionou** (${JSON.stringify(rows[0])})`)
  } catch (error) {
    say(`- \`SELECT 1\` após \`destroy()\` na MESMA conexão: ${describeError(error)}`)
  }
  try {
    const { rows } = await withTimeout(q('SELECT COUNT(*) AS c FROM vol'), 5000)
    const got = Number(rows[0].c)
    const ok = got === TOTAL_ROWS
    say(
      `- \`COUNT(*)\` após \`destroy()\`: ${fmt(got)} (esperado ${fmt(TOTAL_ROWS)}) — **${ok ? 'íntegro' : 'RESULTADO ERRADO'}**`
    )
  } catch (error) {
    say(`- \`COUNT(*)\` após \`destroy()\`: ${describeError(error)}`)
  }
  say()
}

// ------------------------------------- 6. stop early + drain the rest (reuse)
{
  say('## 6. Parar de reter (1.000 linhas), drenar o resto e reutilizar a conexão')
  say()
  const sampler = samplePeak()
  const before = memNow()
  const stream = conn.query('SELECT id, num, payload FROM vol ORDER BY id').stream()
  let received = 0
  let retained = 0
  const first = []
  const t0 = process.hrtime.bigint()
  await new Promise((resolve, reject) => {
    stream.on('data', (row) => {
      received += 1
      if (retained < 1000) {
        first.push(row)
        retained += 1
      }
    })
    stream.on('end', resolve)
    stream.on('error', reject)
  })
  sampler.stop()
  const after = memNow()
  say(`- recebidas: **${fmt(received)}** · retidas: **${fmt(retained)}** · tempo: **${ms(t0)} ms**`)
  say(`- primeira: id=${first[0].id} · última retida: id=${first[retained - 1].id}`)
  say(
    `- pico de rss durante o drain: ${mb(sampler.peak.rss)} · Δrss ao final: ${mb(after.rss - before.rss)} · Δheap: ${mb(after.heap - before.heap)}`
  )
  try {
    const { rows } = await withTimeout(q('SELECT 1 AS ok'), 5000)
    say(`- conexão reutilizada após drenar: **ok** (${JSON.stringify(rows[0])})`)
  } catch (error) {
    say(`- conexão reutilizada após drenar: ${describeError(error)}`)
  }
  say()
}

// ------------------------------------------------------ 7. counting cost
{
  say('## 7. Contagem de linhas (total exato, sem reescrever o SQL)')
  say()
  const cases = [
    ['COUNT(*) na tabela inteira', 'SELECT COUNT(*) AS c FROM vol'],
    ['COUNT(*) com filtro', 'SELECT COUNT(*) AS c FROM vol WHERE num < 500000'],
    ['MAX(id) (proxy de total em PK sequencial)', 'SELECT MAX(id) AS m FROM vol']
  ]
  say('| consulta | tempo | resultado |')
  say('|---|---|---|')
  for (const [label, sql] of cases) {
    const t0 = process.hrtime.bigint()
    const { rows } = await q(sql)
    say(`| ${label} | ${ms(t0)} ms | ${Object.values(rows[0])[0]} |`)
  }
  const t1 = process.hrtime.bigint()
  const { rows: limited } = await q('SELECT id FROM vol ORDER BY id LIMIT 1001')
  say(`| \`LIMIT 1001\` (estratégia "tem mais?") | ${ms(t1)} ms | ${limited.length} linhas |`)
  say()
  say('Observação: o total exato é obtido por consulta separada. Nenhuma contagem foi obtida')
  say('reescrevendo o SQL do usuário, alterando LIMIT ou usando SQL_CALC_FOUND_ROWS.')
  say()
}

// ------------------------------------------------------- 8. very large cell
{
  say('## 8. BLOB grande (limite de célula)')
  say()
  await q('DROP TABLE IF EXISTS blob_probe')
  await q('CREATE TABLE blob_probe (id INT PRIMARY KEY, b LONGBLOB) ENGINE=InnoDB')
  say('| tamanho | insert | fetch | observação |')
  say('|---|---|---|---|')
  for (const sizeMb of [1, 8, 70]) {
    const buf = Buffer.alloc(sizeMb * 1024 * 1024, 0x61)
    // 70 MB exceeds max_allowed_packet (64 MB): use its own connection so it does not
    // take down the main connection if the server ends the protocol.
    const probe =
      sizeMb > 60
        ? mysql.createConnection({
            host: HOST,
            port: PORT,
            user: USER,
            password: PASSWORD,
            supportBigNumbers: true,
            bigNumberStrings: true,
            dateStrings: true
          })
        : null
    if (probe) probe.on('error', () => {})
    const target = probe ?? conn
    const run = (sql, params) =>
      new Promise((resolve, reject) => {
        target.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
      })
    let insert = 'ok'
    let fetch = '—'
    let note = ''
    const t0 = process.hrtime.bigint()
    try {
      await run('REPLACE INTO blob_probe (id, b) VALUES (?, ?)', [sizeMb, buf])
    } catch (error) {
      insert = `ERRO ${error.code ?? 'sem code'}`
      note = String(error.message).slice(0, 120)
    }
    const insertMs = ms(t0)
    if (insert === 'ok') {
      const t1 = process.hrtime.bigint()
      try {
        const rows = await run('SELECT b FROM blob_probe WHERE id = ?', [sizeMb])
        fetch = `${ms(t1)} ms · ${mb(rows[0].b.length)}`
      } catch (error) {
        fetch = `ERRO ${error.code ?? 'sem code'}`
        note = String(error.message).slice(0, 120)
      }
    }
    say(`| ${sizeMb} MB | ${insert} (${insertMs} ms) | ${fetch} | ${note} |`)
    if (probe) await new Promise((resolve) => probe.end(() => resolve(null)))
  }
  say('Nota: o aviso `Warning: got packets out of order` no stderr vem do teste de 70 MB — o servidor')
  say('encerra a conexão (ECONNRESET) ao exceder `max_allowed_packet`. Reproduzido isoladamente;')
  say('as demais seções usam a conexão principal e não são afetadas.')
  say()
}

// ------------------------------------------------------------ 9. wide row
{
  say('## 9. Linha larga (40 colunas de texto) — 10.000 linhas bufferizadas')
  say()
  const N_WIDE = 10000
  const cols = Array.from({ length: 40 }, (_, i) => `c${i} VARCHAR(80) NOT NULL`).join(', ')
  await q('DROP TABLE IF EXISTS wide_probe')
  await q(`CREATE TABLE wide_probe (id INT PRIMARY KEY, ${cols}) ENGINE=InnoDB`)
  const colList = Array.from({ length: 40 }, (_, i) => `c${i}`).join(', ')
  const colValues = Array.from({ length: 40 }, (_, i) => `'coluna ${i} ${'x'.repeat(50)}'`).join(', ')
  const d = '(SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9)'
  const combo = 'a.d + b.d*10 + c.d*100 + e.d*1000'
  const t0 = process.hrtime.bigint()
  await q(
    `INSERT INTO wide_probe (id, ${colList})
     SELECT (${combo}) + 1, ${colValues}
     FROM ${d} a, ${d} b, ${d} c, ${d} e
     ORDER BY (${combo})
     LIMIT ${N_WIDE}`
  )
  say(`- inserção de ${fmt(N_WIDE)} linhas em ${ms(t0)} ms`)
  const bytesPerRow = 40 * `coluna 0 ${'x'.repeat(50)}`.length
  say(`- payload aproximado por linha: ${fmt(bytesPerRow)} bytes (${(bytesPerRow / 1024).toFixed(1)} kB) · total ${mb(bytesPerRow * N_WIDE)}`)
  const before = memNow()
  const t1 = process.hrtime.bigint()
  const { rows } = await q('SELECT * FROM wide_probe ORDER BY id')
  const elapsed = ms(t1)
  const after = memNow()
  const dHeap = after.heap - before.heap
  say(`- fetch bufferizado: ${fmt(rows.length)} linhas em ${elapsed} ms`)
  say(
    `- ΔheapUsed: ${mb(dHeap)} → **${Math.round(dHeap / rows.length)} B por linha** (payload ${bytesPerRow} B; overhead ${(dHeap / rows.length / bytesPerRow).toFixed(2)}×)`
  )
  say(`- Δrss no mesmo trecho: ${mb(after.rss - before.rss)} (ruído de liberação de páginas das seções anteriores)`)
  say()
}

// ------------------------------------------------------------- 10. closing
{
  const end = memNow()
  say('## 10. Processo ao final')
  say()
  say(`- rss: ${mb(end.rss)} (linha de base ${mb(base.rss)}) · heapUsed: ${mb(end.heap)}`)
  say()
}

writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log(`report written to ${OUT} (${lines.join('\n').length} characters)`)
await conn.end()
