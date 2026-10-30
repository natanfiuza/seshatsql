/**
 * Spike S01 — limites do driver mysql2 contra a instância MySQL alvo.
 *
 * Não é código de produto: existe só para produzir evidência para
 * docs/05-spikes.md (S01) e para o ADR do driver.
 *
 * Uso:
 *   $env:SESHAT_DB_PASSWORD = '<senha>'          (PowerShell)
 *   node spikes/s01-driver.mjs > saida.md
 *
 * A senha nunca é impressa nem gravada: vem só de variável de ambiente
 * e não aparece no relatório.
 */
import { writeFileSync } from 'node:fs'

import mysql from 'mysql2/promise'

const HOST = process.env.SESHAT_DB_HOST ?? '127.0.0.1'
const PORT = Number(process.env.SESHAT_DB_PORT ?? '3307')
const USER = process.env.SESHAT_DB_USER ?? 'root'
const PASSWORD = process.env.SESHAT_DB_PASSWORD
const SCHEMA = 'seshat_spike'

if (PASSWORD === undefined) {
  console.error('SESHAT_DB_PASSWORD não definido')
  process.exit(2)
}

const lines = []
const say = (text = '') => lines.push(text)

function describe(value) {
  if (value === null) return '`null`'
  if (value === undefined) return '`undefined`'
  if (Buffer.isBuffer(value)) return `Buffer(${value.length}) \`0x${value.toString('hex')}\``
  if (value instanceof Date) {
    return `Date \`${Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString()}\``
  }
  if (Array.isArray(value)) return `Array(${value.length})`
  if (typeof value === 'object') return `object ${JSON.stringify(value)}`
  if (typeof value === 'string') return `string ${JSON.stringify(value)}`
  return `${typeof value} \`${String(value)}\``
}

function describeError(error) {
  if (error === null || typeof error !== 'object') return String(error)
  return `code=${error.code} errno=${error.errno} sqlState=${error.sqlState} msg=${JSON.stringify(error.sqlMessage ?? error.message)}`
}

function rowOf(columns, row) {
  return columns.map((column, index) => `${column}=${describe(row[index])}`).join(' · ')
}

async function main() {
  say('# Spike S01 — driver mysql2')
  say()
  say(`Execução: ${new Date().toISOString()}`)
  say()
  say(`Destino: \`${HOST}:${PORT}\` · usuário \`${USER}\` · schema de trabalho \`${SCHEMA}\``)
  say(`Fuso do processo Node: \`${Intl.DateTimeFormat().resolvedOptions().timeZone}\``)
  say()

  const defaultConnection = await mysql.createConnection({ host: HOST, port: PORT, user: USER, password: PASSWORD })
  const strictConnection = await mysql.createConnection({
    host: HOST,
    port: PORT,
    user: USER,
    password: PASSWORD,
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: true
  })

  try {
    // ---- 1. Servidor e autenticação -------------------------------------
    say('## 1. Servidor e autenticação')
    say()
    const [serverRows] = await defaultConnection.query(
      `SELECT VERSION() AS versao,
              @@version_comment AS comentario,
              @@character_set_server AS charset_srv,
              @@collation_server AS collation_srv,
              @@lower_case_table_names AS lctn,
              @@sql_mode AS sql_mode,
              @@time_zone AS tz_sessao,
              @@system_time_zone AS tz_sistema,
              @@max_allowed_packet AS max_packet,
              CONNECTION_ID() AS conn_id`
    )
    const server = serverRows[0]
    for (const [key, value] of Object.entries(server)) {
      say(`- **${key}**: ${describe(value)}`)
    }
    const [authRows] = await defaultConnection.query(
      'SELECT plugin FROM mysql.user WHERE user = SUBSTRING_INDEX(CURRENT_USER(), "@", 1)'
    )
    say(`- **plugin de autenticação**: ${describe(authRows[0]?.plugin)}`)
    say()

    // ---- 2. Fixtures ------------------------------------------------------
    await defaultConnection.query(`CREATE DATABASE IF NOT EXISTS \`${SCHEMA}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`)
    await defaultConnection.query(`USE \`${SCHEMA}\``)
    await strictConnection.query(`USE \`${SCHEMA}\``)

    await defaultConnection.query('DROP PROCEDURE IF EXISTS p_multi')
    await defaultConnection.query('DROP TABLE IF EXISTS child_fk')
    await defaultConnection.query('DROP TABLE IF EXISTS parent_fk')
    await defaultConnection.query('DROP TABLE IF EXISTS types_probe')

    await defaultConnection.query(`
      CREATE TABLE types_probe (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        txt VARCHAR(100) NULL,
        vazio VARCHAR(10) NULL,
        big BIGINT NULL,
        decim DECIMAL(65,30) NULL,
        inteiro INT NULL,
        flt DOUBLE NULL,
        dt DATETIME(6) NULL,
        ts TIMESTAMP(6) NULL,
        d DATE NULL,
        t TIME(6) NULL,
        bin VARBINARY(16) NULL,
        blb BLOB NULL,
        bitcol BIT(8) NULL,
        js JSON NULL
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci
    `)

    // Literais SQL para preservar exatidão que um número JS perderia.
    await defaultConnection.query(`
      INSERT INTO types_probe
        (txt, vazio, big, decim, inteiro, flt, dt, ts, d, t, bin, blb, bitcol, js)
      VALUES
        ('Olá, 世界 😀 \\'quote\\'', '', 9007199254740993,
         12345678901234567890123456789012345.123456789012345678901234567890,
         42, 1.5,
         '2026-10-29 13:45:10.123456', '2026-10-29 13:45:10.123456',
         '2026-10-29', '13:45:10.123456',
         X'DEADBEEF', X'00010203FF', b'10101010',
         '{"a":1,"b":[true,null,"x"]}')
    `)

    // ---- 3. Tipos com opções padrão --------------------------------------
    say('## 2. Tipos com as opções padrão do mysql2')
    say()
    const [defaultRows, defaultFields] = await defaultConnection.query(
      'SELECT txt, vazio, big, decim, inteiro, flt, dt, ts, d, t, bin, blb, bitcol, js FROM types_probe'
    )
    say('| coluna | valor observado |')
    say('|---|---|')
    defaultFields.forEach((field) => {
      say(`| ${field.name} | ${describe(defaultRows[0][field.name])} |`)
    })
    say()

    say('## 3. Os mesmos dados com `supportBigNumbers` + `bigNumberStrings` + `dateStrings`')
    say()
    const [strictRows, strictFields] = await strictConnection.query(
      'SELECT txt, vazio, big, decim, inteiro, flt, dt, ts, d, t, bin, blb, bitcol, js FROM types_probe'
    )
    say('| coluna | valor observado |')
    say('|---|---|')
    strictFields.forEach((field) => {
      say(`| ${field.name} | ${describe(strictRows[0][field.name])} |`)
    })
    say()

    // ---- 4. query() vs execute() ----------------------------------------
    say('## 4. Protocolo de texto (`query`) vs preparado (`execute`)')
    say()
    const [qRows, qFields] = await defaultConnection.query('SELECT big, decim, inteiro, flt FROM types_probe')
    const [eRows] = await defaultConnection.execute('SELECT big, decim, inteiro, flt FROM types_probe')
    say('| coluna | `query()` | `execute()` |')
    say('|---|---|---|')
    qFields.forEach((field) => {
      say(`| ${field.name} | ${describe(qRows[0][field.name])} | ${describe(eRows[0][field.name])} |`)
    })
    say()

    // ---- 5. NULL vs vazio vs zero ---------------------------------------
    say('## 5. NULL, string vazia e zero')
    say()
    const [nullRows, nullFields] = await defaultConnection.query(
      "SELECT NULL AS nulo, '' AS vazio, 0 AS zero, ' ' AS espaco, 'NULL' AS literal_null"
    )
    say('| expressão | valor |')
    say('|---|---|')
    nullFields.forEach((field) => {
      say(`| ${field.name} | ${describe(nullRows[0][field.name])} |`)
    })
    say()

    // ---- 6. Unicode e colação -------------------------------------------
    say('## 6. Unicode, emoji e comparação com colação')
    say()
    const [unicodeRows] = await defaultConnection.query(
      "SELECT txt, CHAR_LENGTH(txt) AS caracteres, LENGTH(txt) AS bytes FROM types_probe"
    )
    say(`- texto: ${describe(unicodeRows[0].txt)} · caracteres=${unicodeRows[0].caracteres} · bytes=${unicodeRows[0].bytes}`)
    const [collationRows] = await strictConnection.query("SELECT 'acai' = 'açaí' COLLATE utf8mb4_0900_ai_ci AS igual")
    say(`- colação \`utf8mb4_0900_ai_ci\`: \`acai\` = \`açaí\` → ${describe(collationRows[0].igual)}`)
    say()

    // ---- 7. Múltiplos conjuntos de resultado via CALL -------------------
    say('## 7. Múltiplos conjuntos de resultado (`CALL`)')
    say()
    await defaultConnection.query(`
      CREATE PROCEDURE p_multi(OUT total INT)
      BEGIN
        SELECT 1 AS primeiro;
        SELECT 'a' AS col_a, 2 AS col_b UNION ALL SELECT 'b', 3;
        SET total = 42;
      END
    `)
    const [callResult, callFields] = await defaultConnection.query('CALL p_multi(@saida)')
    say(`- tipo do retorno de \`CALL\`: ${Array.isArray(callResult) ? `array de ${callResult.length} elemento(s)` : typeof callResult}`)
    say(`- \`fields\`: ${Array.isArray(callFields) ? `array de ${callFields.length} elemento(s)` : typeof callFields}`)
    if (Array.isArray(callResult)) {
      callResult.forEach((set, index) => {
        say(`  - conjunto ${index}: ${Array.isArray(set) ? `${set.length} linha(s) ${JSON.stringify(set)}` : describe(set)}`)
      })
    }
    const [outRows] = await defaultConnection.query('SELECT @saida AS out_param')
    say(`- parâmetro OUT: ${describe(outRows[0].out_param)}`)
    const [rcRows] = await defaultConnection.query('SELECT ROW_COUNT() AS row_count_apos_call')
    say(`- \`ROW_COUNT()\` depois do CALL: ${describe(rcRows[0].row_count_apos_call)}`)
    say()

    // ---- 8. Protocolo de erro -------------------------------------------
    say('## 8. Protocolo de erro')
    say()
    await defaultConnection.query('CREATE TABLE parent_fk (id INT PRIMARY KEY)')
    await defaultConnection.query('CREATE TABLE child_fk (id INT PRIMARY KEY, parent_id INT, CONSTRAINT fk_child FOREIGN KEY (parent_id) REFERENCES parent_fk(id))')
    await defaultConnection.query('INSERT INTO parent_fk VALUES (1)')
    await defaultConnection.query('INSERT INTO child_fk VALUES (10, 1)')

    const errorCases = [
      ['sintaxe inválida', 'SELECT FROM'],
      ['tabela inexistente', 'SELECT * FROM tabela_que_nao_existe'],
      ['coluna desconhecida', 'SELECT coluna_inexistente FROM parent_fk'],
      ['chave duplicada', 'INSERT INTO parent_fk VALUES (1)'],
      ['FK violada', 'DELETE FROM parent_fk WHERE id = 1'],
      ['divisão por zero (aviso)', 'SELECT 1/0 AS div_zero'],
      ['erro em lote de 3 statements', 'SELECT 1; SELECT * FROM nao_existe; SELECT 3']
    ]
    say('| caso | resultado |')
    say('|---|---|')
    for (const [label, sql] of errorCases) {
      try {
        const [rows] = await defaultConnection.query(sql)
        say(`| ${label} | sem erro · ${JSON.stringify(rows).slice(0, 120)} |`)
      } catch (error) {
        say(`| ${label} | ERRO · ${describeError(error)} |`)
      }
    }
    const [warnRows] = await defaultConnection.query('SHOW WARNINGS')
    say(`| \`SHOW WARNINGS\` após os casos | ${JSON.stringify(warnRows).slice(0, 200)} |`)
    say()

    // Credencial inválida em conexão separada.
    try {
      await mysql.createConnection({ host: HOST, port: PORT, user: USER, password: 'senha-invalida-proposital' })
      say('- conexão com senha inválida: **aceita** (inesperado)')
    } catch (error) {
      say(`- conexão com senha inválida: ERRO · ${describeError(error)}`)
    }
    say()

    // ---- 9. Datas e fuso ------------------------------------------------
    say('## 9. Datas e fuso horário')
    say()
    const [dateRows] = await defaultConnection.query(
      'SELECT dt, ts, d, t, @@session.time_zone AS tz_sessao, NOW() AS agora_sessao FROM types_probe'
    )
    for (const [key, value] of Object.entries(dateRows[0])) {
      say(`- **${key}**: ${describe(value)}`)
    }
    say('- DATETIME não carrega fuso: o driver o interpreta no fuso do processo Node.')
    say('- TIMESTAMP é convertido pelo servidor para o fuso da sessão antes de sair.')
    say()

    // ---- 10. Statement preparado: reutilização e tipos -------------------
    say('## 10. `execute()` com parâmetros')
    say()
    const [paramRows] = await defaultConnection.execute(
      'SELECT ? AS txt, ? AS num, ? AS nulo, ? AS data',
      ['Olá, 世界 😀', 9007199254740993, null, '2026-10-29 13:45:10.123456']
    )
    say(`- parâmetros devolvidos: ${rowOf(['txt', 'num', 'nulo', 'data'], [paramRows[0].txt, paramRows[0].num, paramRows[0].nulo, paramRows[0].data])}`)
    say()

    // ---- 11. Metadados de coluna ---------------------------------------
    say('## 11. Metadados de coluna')
    say()
    say('| coluna | type | flags | columnLength | decimals |')
    say('|---|---|---|---|---|')
    for (const field of defaultFields) {
      say(`| ${field.name} | ${field.columnType} | ${field.flags} | ${field.columnLength} | ${field.decimals} |`)
    }
    say()
  } finally {
    await defaultConnection.end()
    await strictConnection.end()
  }

  const report = `${lines.join('\n')}\n`
  const target = process.argv[2]
  if (target === undefined) {
    process.stdout.write(report)
  } else {
    // Grava em UTF-8 direto do Node: o console do PowerShell 5.1 corromperia emoji.
    writeFileSync(target, report, 'utf8')
    process.stdout.write(`relatório gravado em ${target} (${report.length} caracteres)\n`)
  }
}

main().catch((error) => {
  console.error('FALHA NO SPIKE:', describeError(error))
  process.exit(1)
})
