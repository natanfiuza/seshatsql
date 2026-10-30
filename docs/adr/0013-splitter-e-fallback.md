# ADR 0013 — Divisão de SQL e política de fallback (P03) propostas a partir do S03
Status: **proposto**. Sustentado por medição real (`docs/spikes/20261029_s03-sql-splitting-evidence.md`); a escolha é decisão humana. Não substitui `docs/04-pendencias.md` P03 até ser aceito.

## Contexto
O driver é `mysql2` com `multipleStatements: false` (ADR 0011) e o pode ser provado: lotes crus como `SELECT 1; SELECT 2;` voltam `ER_PARSE_ERROR/1064/42000`. Ou seja, **dividir o texto é responsabilidade nossa** — e o `CLAUDE.md` proíbe `split(';')`. A P03 aceita "parser inconclusivo gera aviso e confirmação", mas ainda exige saber **quando** o parser é inconclusivo e o que fazer nesse caso.

## Medições que sustentam a proposta
| Medida | Resultado |
|---|---|
| Corpus do S03 | **28 casos**, 38 execuções individuais, **0 falhas** de verificação |
| `split(';')` ingênuo | erra a contagem em **11 de 28** casos (string, comentário, backtick, string não terminada) |
| `--` sem espaço | **não** é comentário: `SELECT 1--2` → `3` |
| `/*!` e `/*+` | comentário **executável**/dica, não descartável: `/*!40101 SET @x = 1 */;` muda sessão |
| `NO_BACKSLASH_ESCAPES` | `'it\'s'` vira string não terminada — o servidor também recusa (1064) |
| `ANSI_QUOTES` | `"a;b"` deixa de ser string e vira identificador (1054/42S22) |
| Rotina dividida pelo splitter | `CREATE PROCEDURE ... BEGIN SELECT 1; SELECT 2; END` → **3 fragmentos** (`ddl, read, unknown`) |
| Rotina enviada inteira | **aceita como um único comando**, apesar dos `;` internos; `CALL` devolveu 3 conjuntos |
| `DELIMITER` | é comando **de cliente**; o servidor não o conhece e o lote cru é recusado |

## Proposta
| # | Regra | Por quê |
|---|---|---|
| 1 | Tokenizador próprio por estado (`normal`, `'...'`, `"..."`, `` `...` ``, comentário de linha, comentário de bloco), nunca `split(';')` | 11/28 casos erram na divisão ingênua |
| 2 | Cada comando recebe classe: `read`, `write`, `ddl`, `session`, `routine`, `transaction`, `unknown` | permite confirmação pré-lote e aviso de efeito |
| 3 | Problemas de **lote** — `unbalanced-string`, `unbalanced-comment`, `routine-body`, `delimiter-command` — bloqueiam o lote inteiro: nada é executado, com aviso explícito | dividir um corpo de rotina produziria 3 fragmentos inválidos; executar metade é pior que não executar |
| 4 | O splitter recebe o `sql_mode` da sessão (`NO_BACKSLASH_ESCAPES`, `ANSI_QUOTES`); se um `SET sql_mode` aparece no lote, os comandos seguintes são reanalisados | o mesmo texto tem divisão diferente conforme o modo |
| 5 | Modo indeterminado → aviso + confirmação explícita, **nunca** "seguro por construção" | regra do `CLAUDE.md` para parser inconclusivo |
| 6 | Comandos executados **um a um**, na ordem, parando no primeiro erro, relatando quais rodaram | não reexecutar SQL, não repetir escrita |
| 7 | Lote aprovado é **snapshot imutável** de texto + `sql_mode` + conexão | já no `CLAUDE.md`; a análise não pode envelhecer |
| 8 | `unknown` é executado assim mesmo (o servidor decide); `;` vazios e lotes só de comentário são descartados | o erro real do servidor é melhor que um erro inventado |

### Rotinas no MVP: recusar, não adivinhar
O S03 provou que **enviar o corpo inteiro funciona** — `CREATE PROCEDURE p_whole() BEGIN ... END` passa como um comando único. Ainda assim a proposta do MVP é **recusar** (`routine-body`), porque:

- decidir onde o corpo termina exige conhecer o delimitador vigente (normalmente `$$` definido por `DELIMITER`, que é comando de cliente);
- um lote pode ter texto antes/depois da rotina, tornando "o resto é o corpo" uma adivinhação;
- aceitar rotinas é feature nova (editor com `DELIMITER`, confirmação de DDL de rotina), fora do MVP.

**Alternativa registrada para depois do MVP:** honrar `DELIMITER` no cliente e enviar a rotina como comando único, já comprovado no S03. Trocar isso é decisão humana, não silenciosa.

## Consequências
- Criar/alterar procedimento, função, trigger ou evento pelo editor fica **bloqueado** no MVP; a UI precisa dizer isso e sugerir outra ferramenta, não fingir que tentou.
- `DELIMITER` digitado é recusado com aviso; não é suportado.
- A confirmação pré-lote passa a mostrar a classe de cada comando, não só a contagem.
- Um erro no meio do lote deixa o estado da transação indefinido — resolver isso é S04, não este ADR.
- Nenhuma dessas regras foi aplicada em código; hoje só o spike as demonstra.

## Pendente
- S04: o que acontece com a transação após erro/cancelamento e como representar `unknown`.
- Decisão sobre suportar rotinas (alternativa acima) e `DELIMITER`.
- Linhas 9.7 LTS e 8.0.46 sem ambiente: diferenças de `sql_mode`/gramática podem mudar a classificação.
