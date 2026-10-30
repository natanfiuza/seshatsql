# Spike S03 — splitter de SQL e política de fallback

Execução: 2026-10-30T01:02:51.227Z

Destino: `127.0.0.1:3307` · schema `seshat_spike` · driver `mysql2` com `multipleStatements: false`

## 1. Ambiente

- versão: `8.4.13`
- `sql_mode` da sessão: `IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION`
- `NO_BACKSLASH_ESCAPES` ativo: **false** → barra invertida escapa dentro de string
- `ANSI_QUOTES` ativo: **false** → aspas duplas são string

## 2. Corpus de entrada × saída do splitter × execução no servidor

Cada linha mostra o texto de entrada, quantos comandos o splitter reconhece, a classificação, os
avisos e o que o servidor responde ao executar os comandos separadamente (nunca o lote inteiro).

### dois comandos simples

```sql
SELECT 1 AS a; SELECT 2 AS b;
```

- comandos: **2** · classificação: `read, read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"a":"1"}
- execução 2: ok · 1 conjunto(s) · {"b":"2"}

### ponto e vírgula dentro de string simples

```sql
SELECT 'a;b' AS v;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"v":"a;b"}

### aspas simples duplicadas

```sql
SELECT 'it''s' AS v;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"v":"it's"}

### barra invertida escapando aspas

```sql
SELECT 'it\'s' AS v;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"v":"it's"}

### aspas duplas como string (modo padrão)

```sql
SELECT "a;b" AS v;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"v":"a;b"}

### backtick com ponto e vírgula

```sql
SELECT 1 AS `a;b`;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"a;b":"1"}

### backtick duplicado

```sql
SELECT 1 AS `a``;b`;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"a`;b":"1"}

### comentário -- com aspas e ponto e vírgula

```sql
SELECT 1 AS a; -- don't split ; here⏎SELECT 2 AS b;
```

- comandos: **2** · classificação: `read, read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"a":"1"}
- execução 2: ok · 1 conjunto(s) · {"b":"2"}

### -- sem espaço NÃO é comentário

```sql
SELECT 1--2 AS v;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"v":"3"}

### comentário # com ponto e vírgula

```sql
# nada ; aqui⏎SELECT 1 AS v;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"v":"1"}

### comentário de bloco com ; e aspas

```sql
/* don't ; split */ SELECT 1 AS v;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"v":"1"}

### CTE

```sql
WITH x AS (SELECT 1 AS n) SELECT n FROM x;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"n":1}

### UNION

```sql
SELECT 1 AS n UNION ALL SELECT 2;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"n":"1"}

### subconsulta com string contendo ;

```sql
SELECT (SELECT ';') AS v;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"v":";"}

### JSON com ; na string

```sql
SELECT '{"a":";"}' AS v;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"v":"{\"a\":\";\"}"}

### SET seguido de SELECT (estado de sessão)

```sql
SET @x = 1; SELECT @x AS v;
```

- comandos: **2** · classificação: `session, read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 0 conjunto(s)
- execução 2: ok · 1 conjunto(s) · {"v":"1"}

### USE (muda o banco da sessão)

```sql
USE seshat_spike; SELECT 1 AS v;
```

- comandos: **2** · classificação: `session, read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 0 conjunto(s)
- execução 2: ok · 1 conjunto(s) · {"v":"1"}

### INSERT (escrita) em tabela descartável

```sql
REPLACE INTO s03_probe (id) VALUES (1);
```

- comandos: **1** · classificação: `write` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 0 conjunto(s)

### CALL (rotina) com múltiplos conjuntos

```sql
CALL p_multi(@total);
```

- comandos: **1** · classificação: `routine` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 3 conjunto(s)

### barra invertida escapando aspas no meio da string

```sql
SELECT 'a\';b' AS v;
```

- comandos: **1** · classificação: `read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"v":"a';b"}

### barra invertida dupla (par) não escapa a aspa final

```sql
SELECT '\\'; SELECT 2 AS b;
```

- comandos: **2** · classificação: `read, read` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 1 conjunto(s) · {"\\":"\\"}
- execução 2: ok · 1 conjunto(s) · {"b":"2"}

### comentário de bloco não terminado

```sql
SELECT 1 /* sem fim
```

- comandos: **1** · classificação: `read` · avisos: `unbalanced-comment`
- verificação do splitter: ok / ok / ok
- execução 1: **lote bloqueado** (unbalanced-comment) — nada foi executado

### comentário executável /*! ... */

```sql
/*!40101 SET @x = 1 */;
```

- comandos: **1** · classificação: `session` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ok · 0 conjunto(s)

### instrução inválida

```sql
SELEC 1;
```

- comandos: **1** · classificação: `unknown` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok
- execução 1: ERRO ER_PARSE_ERROR/1064/42000

### somente comentários e ;

```sql
-- nada⏎/* nada */⏎;;;
```

- comandos: **0** · classificação: `—` · avisos: `nenhum`
- verificação do splitter: ok / ok / ok

### rotina com corpo BEGIN/END

```sql
CREATE PROCEDURE p_tmp() BEGIN SELECT 1; SELECT 2; END
```

- comandos: **3** · classificação: `ddl, read, unknown` · avisos: `routine-body`
- verificação do splitter: ok / ok / ok
- execução 1: **lote bloqueado** (routine-body) — nada foi executado

### comando DELIMITER

```sql
DELIMITER $$⏎CREATE PROCEDURE p_tmp2() BEGIN SELECT 1; END$$
```

- comandos: **2** · classificação: `unknown, unknown` · avisos: `delimiter-command, routine-body`
- verificação do splitter: ok / ok / ok
- execução 1: **lote bloqueado** (delimiter-command, routine-body) — nada foi executado

### string não terminada

```sql
SELECT 'abc;
```

- comandos: **1** · classificação: `read` · avisos: `unbalanced-string`
- verificação do splitter: ok / ok / ok
- execução 1: **lote bloqueado** (unbalanced-string) — nada foi executado

## 3. O servidor realmente recusa o lote não dividido?

- `SELECT 1 AS a; SELECT 2 AS b;` → ER_PARSE_ERROR/1064/42000 — o driver recusa o lote
- `SET @x = 1; SELECT @x AS v;` → ER_PARSE_ERROR/1064/42000 — o driver recusa o lote

Conclusão: o driver com `multipleStatements: false` não executa lotes. A divisão é nossa, e por
isso precisa ser conservadora: onde não houver certeza, recusar com aviso.

### Corpo de rotina enviado inteiro, sem dividir

- `CREATE PROCEDURE p_whole() BEGIN SELECT 1 AS a; SELECT 2 AS b; END`
  → **aceito como um único comando**, apesar dos `;` internos; `CALL` devolveu 3 conjuntos

## 4. `sql_mode` muda a leitura do texto

| entrada | modo | comandos | avisos | execução dividida | texto cru |
|---|---|---|---|---|---|
| `SELECT 'it\'s' AS v;` | (padrão) | 1 | nenhum | ok · 1 conjunto(s) · {"v":"it's"} | aceito · [{"v":"it's"}] |
| `SELECT 'it\'s' AS v;` | NO_BACKSLASH_ESCAPES | 1 | unbalanced-string | — | ER_PARSE_ERROR/1064/42000 |
| `SELECT 'it\'s' AS v;` | ANSI_QUOTES | 1 | nenhum | ok · 1 conjunto(s) · {"v":"it's"} | aceito · [{"v":"it's"}] |
| `SELECT "a;b" AS v;` | (padrão) | 1 | nenhum | ok · 1 conjunto(s) · {"v":"a;b"} | aceito · [{"v":"a;b"}] |
| `SELECT "a;b" AS v;` | NO_BACKSLASH_ESCAPES | 1 | nenhum | ok · 1 conjunto(s) · {"v":"a;b"} | aceito · [{"v":"a;b"}] |
| `SELECT "a;b" AS v;` | ANSI_QUOTES | 1 | nenhum | ERRO ER_BAD_FIELD_ERROR/1054/42S22 | ER_BAD_FIELD_ERROR/1054/42S22 |

O splitter não pode ser "um algoritmo fixo": ele depende do `sql_mode` da sessão. Se o modo mudar
no meio do lote (`SET sql_mode=...`), a classificação das instruções seguintes precisa ser refeita.

## 5. Valores que confirmam a semântica assumida

- `SELECT 1--2 AS v` (aritmética, não comentário) → `"3"`
- `SELECT @x AS v` (estado de sessão do SET anterior) → `"7"`

## 6. Resumo

- casos do corpus: **28**
- execuções individuais registradas: **38**
- falhas de verificação do splitter: **0**

Regras que o spike sustenta:

1. `split(';')` erra a contagem em **11 de 28** casos (string, comentário, backtick ou string não terminada).
2. `--` só abre comentário quando seguido de espaço/controle; `1--2` é aritmética.
3. Rotinas (`CREATE ... PROCEDURE/FUNCTION/TRIGGER/EVENT` com `BEGIN`) e `DELIMITER` não são
   divisíveis sem conhecer o delimitador: o splitter recusa o lote. O corpo **inteiro**, porém,
   é aceito pelo servidor como um comando único — alternativa fora do MVP (ADR 0013).
4. O `sql_mode` da sessão altera a divisão; mudanças de modo no meio do lote exigem reanálise.
5. O driver recusa o lote inteiro; a divisão correta é condição para executar qualquer lote.
