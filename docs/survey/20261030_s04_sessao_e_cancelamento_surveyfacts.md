# Survey — T02 / S04: sessão, cancelamento e estado `unknown`
Data: 2026-10-30 · Branch `develop_natan` · Fonte: sessão de grill sobre `docs/plans/develop_natan/20261029_retomada-s04_plansfacts.md`
Plano correspondente: `docs/plans/develop_natan/20261030_s04_sessao_e_cancelamento_plansfacts.md`

## 1. Contexto da tarefa
Último estágio do T02. S01 (driver), S02 (volume/contagem) e S03 (splitter/fallback) estão medidos contra MySQL 8.4.13; falta provar o que acontece com a **sessão de trabalho** quando o usuário cancela, quando a conexão cai e quando um DDL aparece no meio de uma transação.

O `CLAUDE.md` fixa as regras que o estágio tem de respeitar: uma sessão de trabalho compartilhada e **uma execução ativa**; conexão auxiliar permitida **só** para controle/cancelamento; não repetir SQL após falha de rede; não COMMIT silencioso; cancelar não equivale a rollback global; não prometer rollback de DDL; parser inconclusivo gera aviso e confirmação.

## 2. Estado do repositório no início da sessão
- `HEAD` = `443c81a` ("chore: adiciona spike de volume e streaming do MySQL"); os arquivos do S03 estão **staged** (`git status`: `A`/`M`), sem commit.
- Ou seja: o `gitpr` do S03 foi iniciado pelo usuário, mas o commit ainda não existe.
- Nenhuma alteração do agente em Git; o agente só leu.

## 3. Fatos medidos antes das perguntas
Comandos de leitura executados contra `127.0.0.1:3307` (senha só por variável de ambiente):

| Consulta | Resultado |
|---|---|
| `SELECT VERSION()` | `8.4.13` |
| `SELECT @@autocommit, @@transaction_isolation` | `1`, `REPEATABLE-READ` |
| `SELECT CURRENT_USER()` | `root@localhost` |
| `SHOW GRANTS` | `SUPER`, `PROCESS`, `CONNECTION_ADMIN`, `CREATE USER`, entre outros |
| `SELECT @@in_transaction` | **erro** `ER_UNKNOWN_SYSTEM_VARIABLE` — a variável não existe no MySQL (é do MariaDB) |
| `SELECT COUNT(*) FROM information_schema.PROCESSLIST` | 2 sessões |

Consequência direta: a seção 4.2 do arquivo de retomada listava `@@in_transaction` como candidato; **fica descartado**. A observação de transação aberta dependerá de `information_schema.INNODB_TRX` (a validar no experimento 4) e do rastreio no cliente.

## 4. Decisões da rodada (todas confirmadas pelo usuário)

| # | Pergunta | Decisão |
|---|---|---|
| Q1 | O que "cancelar" faz com a conexão? | **Manter** a conexão após `KILL QUERY` e informar que a transação continua aberta. Descartar só se o protocolo se mostrar inconsistente, com mensagem explícita. Sem confirmação em **5 s** → "cancelamento não confirmado". Cancelar nunca é apresentado como rollback. |
| Q2 | Qual a fonte da verdade do estado transacional? | **Servidor** (`INNODB_TRX` por `CONNECTION_ID()`) como verdade; rastreio do cliente como desempate; divergência ou servidor inalcançável → **`unknown`**. Consulta em três momentos (confirmação de lote, após erro, após cancelar), não em polling. |
| Q3 | O que a UI faz com `unknown`? | **Bloqueia escrita e DDL** até decisão explícita; leitura só em conexão nova; nunca reenvia SQL; a mensagem diz que o comando **pode** ter sido aplicado. |
| Q4 | DDL em transação aberta? | **Aviso + confirmação** de commit implícito. Estado `unknown` → não executa. |
| Q5 | Medir permissões com usuário temporário? | **Sim**: criar `seshat_s04_ro`, medir e derrubar; senha do usuário temporário só em memória. |

## 5. Vocabulário fixado
- **Cancelar** — interromper o comando em execução (`KILL QUERY`). Não encerra a sessão nem desfaz a transação.
- **Encerrar conexão** — derrubar a sessão (`KILL CONNECTION` ou perda de rede). O servidor desfaz a transação.
- **`unknown`** — não houve resposta; não se pode afirmar sucesso nem falha. É um estado de primeira classe, não um erro genérico.

## 6. Perguntas que ficaram fora (e por quê)
- **Cadência de consulta ao estado transacional** — decisão técnica, não de produto; fixada no plano (três momentos).
- **O que a UI oferece depois de `unknown`** — a única saída honesta é reconectar em conexão nova e dizer que o destino da transação é desconhecido; não é escolha.
- **`max_execution_time` como timeout automático** — alternativa ao botão cancelar; contraria a prioridade do usuário ("total exato com demora e botão cancelar") e fica registrada no ADR 0014 como não adotada.
- **Suporte a rotinas/`DELIMITER`** — já decidido no ADR 0013 (fora do MVP).

## 7. Riscos identificados no grill
1. **`KILL CONNECTION` silencioso disfarçado de cancelamento** desfaria a transação sem o usuário pedir. É o principal motivo da D-S04-01.
2. **`INNODB_TRX` pode não enxergar transação só-leitura** — se não enxergar, o rastreio do cliente deixa de ser desempate e vira fonte primária numa classe de casos; o experimento 4 decide.
3. **Experimental 9 (queda durante `COMMIT`) não é determinístico** — o resultado é `unknown` por definição; registrar como tentado, não como medido.
4. **`mysql2` pode enfileirar** o segundo comando em vez de recusá-lo, o que enfraquece "uma execução ativa" se o app não bloquear por conta própria (experimento 11).
5. Linha 8.4 apenas; 9.7 LTS e 8.0.46 seguem sem ambiente (B-01).

## 8. Próximo passo
Executar o plano `20261030_s04_sessao_e_cancelamento_plansfacts.md` após confirmação do usuário — uma etapa, com parada ao final e pedido de `gitpr`.
