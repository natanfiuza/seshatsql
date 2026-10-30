# Spike S01 — driver mysql2

Execução: 2026-10-30T00:28:39.518Z

Destino: `127.0.0.1:3307` · usuário `root` · schema de trabalho `seshat_spike`
Fuso do processo Node: `America/Sao_Paulo`

## 1. Servidor e autenticação

- **versao**: string "8.4.13"
- **comentario**: string "MySQL Community Server - GPL"
- **charset_srv**: string "utf8mb4"
- **collation_srv**: string "utf8mb4_0900_ai_ci"
- **lctn**: number `1`
- **sql_mode**: string "IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION"
- **tz_sessao**: string "SYSTEM"
- **tz_sistema**: string "Hora oficial do Brasil"
- **max_packet**: number `67108864`
- **conn_id**: number `25`
- **plugin de autenticação**: string "caching_sha2_password"

## 2. Tipos com as opções padrão do mysql2

| coluna | valor observado |
|---|---|
| txt | string "Olá, 世界 😀 'quote'" |
| vazio | string "" |
| big | number `9007199254740992` |
| decim | string "12345678901234567890123456789012345.123456789012345678901234567890" |
| inteiro | number `42` |
| flt | number `1.5` |
| dt | Date `2026-10-29T16:45:10.123Z` |
| ts | Date `2026-10-29T16:45:10.123Z` |
| d | Date `2026-10-29T03:00:00.000Z` |
| t | string "13:45:10.123456" |
| bin | Buffer(4) `0xdeadbeef` |
| blb | Buffer(5) `0x00010203ff` |
| bitcol | Buffer(1) `0xaa` |
| js | object {"a":1,"b":[true,null,"x"]} |

## 3. Os mesmos dados com `supportBigNumbers` + `bigNumberStrings` + `dateStrings`

| coluna | valor observado |
|---|---|
| txt | string "Olá, 世界 😀 'quote'" |
| vazio | string "" |
| big | string "9007199254740993" |
| decim | string "12345678901234567890123456789012345.123456789012345678901234567890" |
| inteiro | number `42` |
| flt | number `1.5` |
| dt | string "2026-10-29 13:45:10.123456" |
| ts | string "2026-10-29 13:45:10.123456" |
| d | string "2026-10-29" |
| t | string "13:45:10.123456" |
| bin | Buffer(4) `0xdeadbeef` |
| blb | Buffer(5) `0x00010203ff` |
| bitcol | Buffer(1) `0xaa` |
| js | object {"a":1,"b":[true,null,"x"]} |

## 4. Protocolo de texto (`query`) vs preparado (`execute`)

| coluna | `query()` | `execute()` |
|---|---|---|
| big | number `9007199254740992` | number `9007199254740992` |
| decim | string "12345678901234567890123456789012345.123456789012345678901234567890" | string "12345678901234567890123456789012345.123456789012345678901234567890" |
| inteiro | number `42` | number `42` |
| flt | number `1.5` | number `1.5` |

## 5. NULL, string vazia e zero

| expressão | valor |
|---|---|
| nulo | `null` |
| vazio | string "" |
| zero | number `0` |
| espaco | string " " |
| literal_null | string "NULL" |

## 6. Unicode, emoji e comparação com colação

- texto: string "Olá, 世界 😀 'quote'" · caracteres=17 · bytes=25
- colação `utf8mb4_0900_ai_ci`: `acai` = `açaí` → string "1"

## 7. Múltiplos conjuntos de resultado (`CALL`)

- tipo do retorno de `CALL`: array de 3 elemento(s)
- `fields`: array de 3 elemento(s)
  - conjunto 0: 1 linha(s) [{"primeiro":1}]
  - conjunto 1: 2 linha(s) [{"col_a":"a","col_b":2},{"col_a":"b","col_b":3}]
  - conjunto 2: object {"fieldCount":0,"affectedRows":0,"insertId":0,"info":"","serverStatus":2,"warningStatus":0,"changedRows":0}
- parâmetro OUT: number `42`
- `ROW_COUNT()` depois do CALL: number `-1`

## 8. Protocolo de erro

| caso | resultado |
|---|---|
| sintaxe inválida | ERRO · code=ER_PARSE_ERROR errno=1064 sqlState=42000 msg="You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'FROM' at line 1" |
| tabela inexistente | ERRO · code=ER_NO_SUCH_TABLE errno=1146 sqlState=42S02 msg="Table 'seshat_spike.tabela_que_nao_existe' doesn't exist" |
| coluna desconhecida | ERRO · code=ER_BAD_FIELD_ERROR errno=1054 sqlState=42S22 msg="Unknown column 'coluna_inexistente' in 'field list'" |
| chave duplicada | ERRO · code=ER_DUP_ENTRY errno=1062 sqlState=23000 msg="Duplicate entry '1' for key 'parent_fk.PRIMARY'" |
| FK violada | ERRO · code=ER_ROW_IS_REFERENCED_2 errno=1451 sqlState=23000 msg="Cannot delete or update a parent row: a foreign key constraint fails (`seshat_spike`.`child_fk`, CONSTRAINT `fk_child` FOREIGN KEY (`parent_id`) REFERENCES `parent_fk` (`id`))" |
| divisão por zero (aviso) | sem erro · [{"div_zero":null}] |
| erro em lote de 3 statements | ERRO · code=ER_PARSE_ERROR errno=1064 sqlState=42000 msg="You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'SELECT * FROM nao_existe; SELECT 3' at line 1" |
| `SHOW WARNINGS` após os casos | [{"Level":"Error","Code":1064,"Message":"You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'SELECT * FROM nao_existe |

- conexão com senha inválida: ERRO · code=ER_ACCESS_DENIED_ERROR errno=1045 sqlState=28000 msg="Access denied for user 'root'@'localhost' (using password: YES)"

## 9. Datas e fuso horário

- **dt**: Date `2026-10-29T16:45:10.123Z`
- **ts**: Date `2026-10-29T16:45:10.123Z`
- **d**: Date `2026-10-29T03:00:00.000Z`
- **t**: string "13:45:10.123456"
- **tz_sessao**: string "SYSTEM"
- **agora_sessao**: Date `2026-10-30T00:28:39.000Z`
- DATETIME não carrega fuso: o driver o interpreta no fuso do processo Node.
- TIMESTAMP é convertido pelo servidor para o fuso da sessão antes de sair.

## 10. `execute()` com parâmetros

- parâmetros devolvidos: txt=string "Olá, 世界 😀" · num=number `9007199254740992` · nulo=`null` · data=string "2026-10-29 13:45:10.123456"

## 11. Metadados de coluna

| coluna | type | flags | columnLength | decimals |
|---|---|---|---|---|
| txt | 253 | 0 | 400 | 0 |
| vazio | 253 | 0 | 40 | 0 |
| big | 8 | 0 | 20 | 0 |
| decim | 246 | 0 | 67 | 30 |
| inteiro | 3 | 0 | 11 | 0 |
| flt | 5 | 0 | 22 | 31 |
| dt | 12 | 128 | 26 | 6 |
| ts | 7 | 128 | 26 | 6 |
| d | 10 | 128 | 10 | 0 |
| t | 11 | 128 | 17 | 6 |
| bin | 253 | 128 | 16 | 0 |
| blb | 252 | 144 | 65535 | 0 |
| bitcol | 16 | 32 | 8 | 0 |
| js | 245 | 144 | 4294967295 | 0 |

