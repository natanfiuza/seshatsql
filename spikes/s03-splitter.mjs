/**
 * Spike S03 — splitter de SQL e política de fallback.
 *
 * Uso (PowerShell):
 *   $env:SESHAT_DB_PASSWORD = '<senha>'
 *   node spikes/s03-splitter.mjs docs/spikes/20261029_s03-sql-splitting-evidence.md
 *
 * Regra do projeto: NUNCA usar split(';'). Este spike implementa um tokenizador
 * mínimo (strings, comentários, backticks) e mede onde ele é confiável e onde
 * precisa recusar. Nada aqui vira código de produção sem decisão humana (ADR 0013).
 *
 * A senha nunca é impressa nem gravada: vem só de variável de ambiente.
 * Schema de trabalho: `seshat_spike` (descartável, dados sintéticos).
 */
import mysql from 'mysql2'
import { writeFileSync } from 'node:fs'

const HOST = process.env.SESHAT_DB_HOST ?? '127.0.0.1'
const PORT = Number(process.env.SESHAT_DB_PORT ?? '3307')
const USER = process.env.SESHAT_DB_USER ?? 'root'
const PASSWORD = process.env.SESHAT_DB_PASSWORD
const SCHEMA = 'seshat_spike'
const OUT = process.argv[2] ?? 'docs/spikes/20261029_s03-sql-splitting-evidence.md'

if (!PASSWORD) {
  console.error('SESHAT_DB_PASSWORD não definido')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Splitter — máquina de estados por caractere
// ---------------------------------------------------------------------------

const hasMode = (sqlMode, name) => new RegExp(`(^|,)${name}(,|$)`, 'i').test(sqlMode ?? '')

const isDashCommentStart = (next) => next === undefined || /[\s\x00-\x1f]/.test(next)

function stripLeadingComments(text) {
  let rest = text
  for (;;) {
    rest = rest.replace(/^\s+/, '')
    if (rest.startsWith('#')) {
      const nl = rest.indexOf('\n')
      rest = nl === -1 ? '' : rest.slice(nl + 1)
      continue
    }
    if (rest.startsWith('--') && isDashCommentStart(rest[2])) {
      const nl = rest.indexOf('\n')
      rest = nl === -1 ? '' : rest.slice(nl + 1)
      continue
    }
    if (rest.startsWith('/*!') || rest.startsWith('/*+')) return rest
    if (rest.startsWith('/*')) {
      const end = rest.indexOf('*/')
      rest = end === -1 ? '' : rest.slice(end + 2)
      continue
    }
    return rest
  }
}

const KIND_BY_KEYWORD = new Map([
  ['SELECT', 'read'],
  ['WITH', 'read'],
  ['SHOW', 'read'],
  ['DESCRIBE', 'read'],
  ['DESC', 'read'],
  ['EXPLAIN', 'read'],
  ['INSERT', 'write'],
  ['UPDATE', 'write'],
  ['DELETE', 'write'],
  ['REPLACE', 'write'],
  ['LOAD', 'write'],
  ['CREATE', 'ddl'],
  ['ALTER', 'ddl'],
  ['DROP', 'ddl'],
  ['TRUNCATE', 'ddl'],
  ['RENAME', 'ddl'],
  ['USE', 'session'],
  ['SET', 'session'],
  ['CALL', 'routine'],
  ['COMMIT', 'transaction'],
  ['ROLLBACK', 'transaction'],
  ['START', 'transaction'],
  ['BEGIN', 'transaction'],
  ['SAVEPOINT', 'transaction'],
  ['RELEASE', 'transaction']
])

const ROUTINE_DDL =
  /^(CREATE|ALTER|DROP)\s+(DEFINER\s*=\s*(?:\S+|`[^`]*`)(?:@(?:\S+|`[^`]*`))?\s+)?(PROCEDURE|FUNCTION|TRIGGER|EVENT)\b/i

function classify(text) {
  let head = stripLeadingComments(text).trim()
  // Comentário executável: classifica pelo conteúdo interno, não pelo wrapper.
  const executable = head.match(/^\/\*!\d*\s*([\s\S]*?)\*\/\s*/)
  if (executable) head = executable[1].trim()
  const word = (head.match(/^[A-Za-z]+/) ?? [])[0]
  if (!word) return { kind: 'unknown', routineDdl: false }
  const kind = KIND_BY_KEYWORD.get(word.toUpperCase()) ?? 'unknown'
  return { kind, routineDdl: ROUTINE_DDL.test(head) }
}

function splitSql(text, options = {}) {
  const sqlMode = options.sqlMode ?? ''
  const backslashEscapes = !hasMode(sqlMode, 'NO_BACKSLASH_ESCAPES')
  const ansiQuotes = hasMode(sqlMode, 'ANSI_QUOTES')

  const statements = []
  const problems = []
  let i = 0
  let start = 0
  let state = 'normal'
  let sawContent = false

  const push = (end) => {
    const raw = text.slice(start, end)
    if (sawContent) {
      const trimmedOffset = raw.length - raw.trimStart().length
      const value = raw.trim()
      const { kind } = classify(value)
      const statement = { text: value, offset: start + trimmedOffset, kind }
      const own = []
      const executable = value.match(/\/\*![^*]*\*\//g) ?? []
      if (executable.some((chunk) => chunk.includes(';'))) {
        own.push('executable-comment-with-semicolon')
      }
      statement.problems = own
      statements.push(statement)
    }
    start = end + 1
    sawContent = false
  }

  while (i < text.length) {
    const c = text[i]
    if (state === 'normal') {
      if (c === "'") {
        state = 'single'
        sawContent = true
        i += 1
      } else if (c === '"') {
        state = ansiQuotes ? 'identDouble' : 'double'
        sawContent = true
        i += 1
      } else if (c === '`') {
        state = 'backtick'
        sawContent = true
        i += 1
      } else if (c === '#') {
        state = 'lineComment'
        i += 1
      } else if (c === '-' && text[i + 1] === '-' && isDashCommentStart(text[i + 2])) {
        state = 'lineComment'
        i += 2
      } else if (c === '/' && text[i + 1] === '*') {
        // /*! ... */ é comentário executável e /*+ ... */ é hint: contam como
        // conteúdo, porque o servidor executa o que está dentro.
        if (text[i + 2] === '!' || text[i + 2] === '+') sawContent = true
        state = 'blockComment'
        i += 2
      } else if (c === ';') {
        push(i)
        i += 1
      } else {
        if (!/\s/.test(c)) sawContent = true
        i += 1
      }
    } else if (state === 'single' || state === 'double') {
      const quote = state === 'single' ? "'" : '"'
      if (backslashEscapes && c === '\\') {
        i += 2
      } else if (c === quote) {
        if (text[i + 1] === quote) {
          i += 2
        } else {
          state = 'normal'
          i += 1
        }
      } else {
        i += 1
      }
    } else if (state === 'identDouble' || state === 'backtick') {
      const quote = state === 'identDouble' ? '"' : '`'
      if (c === quote) {
        if (text[i + 1] === quote) {
          i += 2
        } else {
          state = 'normal'
          i += 1
        }
      } else {
        i += 1
      }
    } else if (state === 'lineComment') {
      if (c === '\n') state = 'normal'
      i += 1
    } else if (state === 'blockComment') {
      if (c === '*' && text[i + 1] === '/') {
        state = 'normal'
        i += 2
      } else {
        i += 1
      }
    }
  }

  if (i > start) push(i)

  const openState = { single: 'string', double: 'string', identDouble: 'identifier', backtick: 'identifier' }[state]
  if (openState) problems.push(`unbalanced-${openState}`)
  if (state === 'blockComment') problems.push('unbalanced-comment')

  // Problemas de lote: tornam o lote inteiro inexecutável, não só um pedaço.
  if (statements.some((s) => /^DELIMITER\b/i.test(stripLeadingComments(s.text).trim()))) {
    problems.push('delimiter-command')
  }
  // Definição de rotina é excluída do MVP. A detecção é textual e conservadora:
  // falso positivo bloqueia o lote com aviso, nunca executa às cegas.
  if (/(CREATE|ALTER)\s+(DEFINER\s*=\s*(?:\S+|`[^`]*`)(?:@(?:\S+|`[^`]*`))?\s+)?(PROCEDURE|FUNCTION|TRIGGER|EVENT)\b/i.test(text)) {
    problems.push('routine-body')
  }

  return { statements, problems }
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

const lines = []
const say = (text = '') => lines.push(text)
const failures = []

function check(label, actual, expected) {
  const ok = actual === expected
  if (!ok) failures.push(`${label}: esperado ${expected}, obtido ${actual}`)
  return ok ? 'ok' : '**FALHOU**'
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
conn.on('error', (error) => console.error(`conexão reportou erro: ${error.code ?? error.message}`))

const q = (sql) =>
  new Promise((resolve, reject) => {
    conn.query(sql, (err, rows, fields) => (err ? reject(err) : resolve({ rows, fields })))
  })

const describeError = (error) =>
  `${error.code ?? 'sem code'}${error.errno ? `/${error.errno}` : ''}${error.sqlState ? `/${error.sqlState}` : ''}`

async function runStatement(statement) {
  try {
    const result = await q(statement.text)
    const rowsets = Array.isArray(result.rows) ? (Array.isArray(result.rows[0]) ? result.rows.length : 1) : 0
    const sample =
      result.rows && Array.isArray(result.rows) && !Array.isArray(result.rows[0]) && result.rows.length
        ? JSON.stringify(result.rows[0])
        : ''
    return `ok · ${rowsets} conjunto(s)${sample ? ` · ${sample.slice(0, 60)}` : ''}`
  } catch (error) {
    return `ERRO ${describeError(error)}`
  }
}

say('# Spike S03 — splitter de SQL e política de fallback')
say()
say(`Execução: ${new Date().toISOString()}`)
say()
say(`Destino: \`${HOST}:${PORT}\` · schema \`${SCHEMA}\` · driver \`mysql2\` com \`multipleStatements: false\``)
say()

const { rows: modeRows } = await q('SELECT @@sql_mode AS m, VERSION() AS v')
const sqlMode = String(modeRows[0].m)
say('## 1. Ambiente')
say()
say(`- versão: \`${modeRows[0].v}\``)
say(`- \`sql_mode\` da sessão: \`${sqlMode}\``)
say(`- \`NO_BACKSLASH_ESCAPES\` ativo: **${hasMode(sqlMode, 'NO_BACKSLASH_ESCAPES')}** → barra invertida ${hasMode(sqlMode, 'NO_BACKSLASH_ESCAPES') ? 'NÃO' : ''}escapa dentro de string`)
say(`- \`ANSI_QUOTES\` ativo: **${hasMode(sqlMode, 'ANSI_QUOTES')}** → aspas duplas ${hasMode(sqlMode, 'ANSI_QUOTES') ? 'são identificador' : 'são string'}`)
say()

// preparação idempotente do schema
await q(`CREATE DATABASE IF NOT EXISTS ${SCHEMA}`)
await q(`USE ${SCHEMA}`)
await q('CREATE TABLE IF NOT EXISTS s03_probe (id INT NOT NULL PRIMARY KEY) ENGINE=InnoDB')
const { rows: procRows } = await q(
  `SELECT COUNT(*) AS c FROM information_schema.routines
   WHERE routine_schema = '${SCHEMA}' AND routine_name = 'p_multi'`
)
if (Number(procRows[0].c) === 0) {
  await q('CREATE PROCEDURE p_multi(OUT total INT) BEGIN SELECT 1 AS primeiro; SELECT 2 AS segundo; SET total = 42; END')
  say('- procedimento `p_multi` criado para o teste de `CALL`')
  say()
}

// ---------------------------------------------------------------------------
say('## 2. Corpus de entrada × saída do splitter × execução no servidor')
say()
say('Cada linha mostra o texto de entrada, quantos comandos o splitter reconhece, a classificação, os')
say('avisos e o que o servidor responde ao executar os comandos separadamente (nunca o lote inteiro).')
say()

const corpus = [
  {
    name: 'dois comandos simples',
    sql: 'SELECT 1 AS a; SELECT 2 AS b;',
    expect: { statements: 2, kinds: ['read', 'read'], problems: [] }
  },
  {
    name: 'ponto e vírgula dentro de string simples',
    sql: "SELECT 'a;b' AS v;",
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'aspas simples duplicadas',
    sql: "SELECT 'it''s' AS v;",
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'barra invertida escapando aspas',
    sql: "SELECT 'it\\'s' AS v;",
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'aspas duplas como string (modo padrão)',
    sql: 'SELECT "a;b" AS v;',
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'backtick com ponto e vírgula',
    sql: 'SELECT 1 AS `a;b`;',
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'backtick duplicado',
    sql: 'SELECT 1 AS `a``;b`;',
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'comentário -- com aspas e ponto e vírgula',
    sql: "SELECT 1 AS a; -- don't split ; here\nSELECT 2 AS b;",
    expect: { statements: 2, kinds: ['read', 'read'], problems: [] }
  },
  {
    name: '-- sem espaço NÃO é comentário',
    sql: 'SELECT 1--2 AS v;',
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'comentário # com ponto e vírgula',
    sql: '# nada ; aqui\nSELECT 1 AS v;',
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'comentário de bloco com ; e aspas',
    sql: "/* don't ; split */ SELECT 1 AS v;",
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'CTE',
    sql: 'WITH x AS (SELECT 1 AS n) SELECT n FROM x;',
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'UNION',
    sql: 'SELECT 1 AS n UNION ALL SELECT 2;',
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'subconsulta com string contendo ;',
    sql: "SELECT (SELECT ';') AS v;",
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'JSON com ; na string',
    sql: 'SELECT \'{"a":";"}\' AS v;',
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'SET seguido de SELECT (estado de sessão)',
    sql: 'SET @x = 1; SELECT @x AS v;',
    expect: { statements: 2, kinds: ['session', 'read'], problems: [] }
  },
  {
    name: 'USE (muda o banco da sessão)',
    sql: `USE ${SCHEMA}; SELECT 1 AS v;`,
    expect: { statements: 2, kinds: ['session', 'read'], problems: [] }
  },
  {
    name: 'INSERT (escrita) em tabela descartável',
    sql: 'REPLACE INTO s03_probe (id) VALUES (1);',
    expect: { statements: 1, kinds: ['write'], problems: [] }
  },
  {
    name: 'CALL (rotina) com múltiplos conjuntos',
    sql: 'CALL p_multi(@total);',
    expect: { statements: 1, kinds: ['routine'], problems: [] }
  },
  {
    name: 'barra invertida escapando aspas no meio da string',
    sql: "SELECT 'a\\';b' AS v;",
    expect: { statements: 1, kinds: ['read'], problems: [] }
  },
  {
    name: 'barra invertida dupla (par) não escapa a aspa final',
    sql: "SELECT '\\\\'; SELECT 2 AS b;",
    expect: { statements: 2, kinds: ['read', 'read'], problems: [] }
  },
  {
    name: 'comentário de bloco não terminado',
    sql: 'SELECT 1 /* sem fim',
    expect: { statements: 1, kinds: ['read'], problems: ['unbalanced-comment'] }
  },
  {
    name: 'comentário executável /*! ... */',
    sql: '/*!40101 SET @x = 1 */;',
    expect: { statements: 1, kinds: ['session'], problems: [] }
  },
  {
    name: 'instrução inválida',
    sql: 'SELEC 1;',
    expect: { statements: 1, kinds: ['unknown'], problems: [] }
  },
  {
    name: 'somente comentários e ;',
    sql: '-- nada\n/* nada */\n;;;',
    expect: { statements: 0, kinds: [], problems: [] }
  },
  {
    name: 'rotina com corpo BEGIN/END',
    sql: 'CREATE PROCEDURE p_tmp() BEGIN SELECT 1; SELECT 2; END',
    expect: { statements: 3, kinds: ['ddl', 'read', 'unknown'], problems: ['routine-body'] }
  },
  {
    name: 'comando DELIMITER',
    sql: 'DELIMITER $$\nCREATE PROCEDURE p_tmp2() BEGIN SELECT 1; END$$',
    expect: { statements: 2, kinds: ['unknown', 'unknown'], problems: ['delimiter-command', 'routine-body'] }
  },
  {
    name: 'string não terminada',
    sql: "SELECT 'abc;",
    expect: { statements: 1, kinds: ['read'], problems: ['unbalanced-string'] }
  }
]

let execChecks = 0
for (const testCase of corpus) {
  const split = splitSql(testCase.sql, { sqlMode })
  const kinds = split.statements.map((s) => s.kind)
  const statementProblems = split.statements.flatMap((s) => s.problems)
  const problems = [...split.problems, ...statementProblems]
  const counts = check(`${testCase.name} (n)`, split.statements.length, testCase.expect.statements)
  const kindCheck = check(
    `${testCase.name} (kind)`,
    kinds.join(','),
    testCase.expect.kinds.join(',')
  )
  const problemsCheck = check(
    `${testCase.name} (problemas)`,
    problems.join(','),
    testCase.expect.problems.join(',')
  )

  const executions = []
  if (split.problems.length > 0) {
    executions.push(`**lote bloqueado** (${split.problems.join(', ')}) — nada foi executado`)
  } else {
    for (const statement of split.statements) {
      if (statement.problems.length > 0) {
        executions.push(`**não executado** (${statement.problems.join(', ')})`)
        continue
      }
      executions.push(await runStatement(statement))
    }
  }

  say(`### ${testCase.name}`)
  say()
  say('```sql')
  say(testCase.sql.replace(/\n/g, '⏎'))
  say('```')
  say()
  say(`- comandos: **${split.statements.length}** · classificação: \`${kinds.join(', ') || '—'}\` · avisos: \`${problems.join(', ') || 'nenhum'}\``)
  say(`- verificação do splitter: ${counts} / ${kindCheck} / ${problemsCheck}`)
  for (const [index, execution] of executions.entries()) {
    say(`- execução ${index + 1}: ${execution}`)
    execChecks += 1
  }
  say()
}

// ---------------------------------------------------------------------------
say('## 3. O servidor realmente recusa o lote não dividido?')
say()
for (const batch of ['SELECT 1 AS a; SELECT 2 AS b;', 'SET @x = 1; SELECT @x AS v;']) {
  try {
    const result = await q(batch)
    say(`- \`${batch.replace(/\n/g, ' ')}\` → **aceito** (${JSON.stringify(result.rows).slice(0, 80)}) — inesperado`)
  } catch (error) {
    say(`- \`${batch.replace(/\n/g, ' ')}\` → ${describeError(error)} — o driver recusa o lote`)
  }
}
say()
say('Conclusão: o driver com `multipleStatements: false` não executa lotes. A divisão é nossa, e por')
say('isso precisa ser conservadora: onde não houver certeza, recusar com aviso.')
say()

say('### Corpo de rotina enviado inteiro, sem dividir')
say()
await q('DROP PROCEDURE IF EXISTS p_whole')
const wholeRoutine = 'CREATE PROCEDURE p_whole() BEGIN SELECT 1 AS a; SELECT 2 AS b; END'
try {
  await q(wholeRoutine)
  const { rows: called } = await q('CALL p_whole()')
  say(`- \`${wholeRoutine}\``)
  say(`  → **aceito como um único comando**, apesar dos \`;\` internos; \`CALL\` devolveu ${Array.isArray(called) ? called.length : 0} conjuntos`)
  await q('DROP PROCEDURE p_whole')
} catch (error) {
  say(`- \`${wholeRoutine}\` → ${describeError(error)} — o corpo não passa como comando único`)
}
say()

// ---------------------------------------------------------------------------
say('## 4. `sql_mode` muda a leitura do texto')
say()
const modeCases = [
  { name: 'string com barra invertida', sql: "SELECT 'it\\'s' AS v;" },
  { name: 'aspas duplas', sql: 'SELECT "a;b" AS v;' }
]
say('| entrada | modo | comandos | avisos | execução dividida | texto cru |')
say('|---|---|---|---|---|---|')
for (const testCase of modeCases) {
  for (const mode of ['', 'NO_BACKSLASH_ESCAPES', 'ANSI_QUOTES']) {
    const effectiveMode = mode || sqlMode
    await q(`SET SESSION sql_mode = '${effectiveMode}'`)
    const split = splitSql(testCase.sql, { sqlMode: effectiveMode })
    const problems = [...split.problems, ...split.statements.flatMap((s) => s.problems)]
    let divided = '—'
    if (problems.length === 0 && split.statements.length > 0) {
      const results = []
      for (const statement of split.statements) results.push(await runStatement(statement))
      divided = results.join(' | ')
    }
    let raw = '—'
    try {
      const result = await q(testCase.sql)
      raw = `aceito · ${JSON.stringify(result.rows).slice(0, 50)}`
    } catch (error) {
      raw = describeError(error)
    }
    say(
      `| \`${testCase.sql.replace(/\n/g, ' ') || 'vazio'}\` | ${mode || '(padrão)'} | ${split.statements.length} | ${problems.join(', ') || 'nenhum'} | ${divided} | ${raw} |`
    )
    execChecks += 1
  }
}
await q(`SET SESSION sql_mode = '${sqlMode}'`)
say()
say('O splitter não pode ser "um algoritmo fixo": ele depende do `sql_mode` da sessão. Se o modo mudar')
say('no meio do lote (`SET sql_mode=...`), a classificação das instruções seguintes precisa ser refeita.')
say()

// ---------------------------------------------------------------------------
say('## 5. Valores que confirmam a semântica assumida')
say()
await q('SET @x = 7')
const semanticChecks = [
  ['SELECT 1--2 AS v', 'aritmética, não comentário', 'v'],
  ['SELECT @x AS v', 'estado de sessão do SET anterior', 'v']
]
for (const [sql, label, column] of semanticChecks) {
  try {
    const result = await q(sql)
    const value = result.rows?.[0]?.[column]
    say(`- \`${sql}\` (${label}) → \`${JSON.stringify(value)}\``)
  } catch (error) {
    say(`- \`${sql}\` (${label}) → ${describeError(error)}`)
  }
}
say()

// ---------------------------------------------------------------------------
say('## 6. Resumo')
say()
say(`- casos do corpus: **${corpus.length}**`)
say(`- execuções individuais registradas: **${execChecks}**`)
say(`- falhas de verificação do splitter: **${failures.length}**`)
if (failures.length > 0) {
  for (const failure of failures) say(`  - ${failure}`)
}
say()
say('Regras que o spike sustenta:')
say()
const naiveWrong = corpus.filter(
  (testCase) => testCase.sql.split(';').filter((piece) => piece.trim().length > 0).length !== testCase.expect.statements
)
say(
  `1. \`split(';')\` erra a contagem em **${naiveWrong.length} de ${corpus.length}** casos (string, comentário, backtick ou string não terminada).`
)
say('2. `--` só abre comentário quando seguido de espaço/controle; `1--2` é aritmética.')
say('3. Rotinas (`CREATE ... PROCEDURE/FUNCTION/TRIGGER/EVENT` com `BEGIN`) e `DELIMITER` não são')
say('   divisíveis sem conhecer o delimitador: o splitter recusa o lote. O corpo **inteiro**, porém,')
say('   é aceito pelo servidor como um comando único — alternativa fora do MVP (ADR 0013).')
say('4. O `sql_mode` da sessão altera a divisão; mudanças de modo no meio do lote exigem reanálise.')
say('5. O driver recusa o lote inteiro; a divisão correta é condição para executar qualquer lote.')

writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log(`relatório gravado em ${OUT} (${lines.join('\n').length} caracteres)`)
console.log(`falhas de verificação: ${failures.length}`)

await conn.end()
process.exit(failures.length > 0 ? 1 : 0)
