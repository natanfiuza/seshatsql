# Plano — T02 / S04: sessão, cancelamento e estado `unknown`
Data: 2026-10-30 · Branch `develop_natan` · Status: **aprovado para execução** (5 decisões confirmadas pelo usuário nesta data)
Continua `docs/plans/develop_natan/20261029_retomada-s04_plansfacts.md`. O `CLAUDE.md` prevalece sobre este plano.

## 1. Gate (`docs/05-spikes.md`)
> S04 Sessão/cancelar: transação compartilhada, controle auxiliar, permissões, commit implícito, falha de rede e conexão perdida. Gate: não repetir escrita nem alegar rollback global; estado unknown explícito quando necessário.

## 2. Fatos medidos antes do plano (não são suposição)
| Fato | Comando | Resultado |
|---|---|---|
| Versão | `SELECT VERSION()` | `8.4.13` |
| `@@in_transaction` | `SELECT @@in_transaction` | **não existe** (`ER_UNKNOWN_SYSTEM_VARIABLE`) — é variável do MariaDB |
| Usuário do spike | `SHOW GRANTS` | `root@localhost` com `SUPER`, `PROCESS`, `CONNECTION_ADMIN`, `CREATE USER` |
| Sessão | `SELECT @@autocommit, @@transaction_isolation` | `1` · `REPEATABLE-READ` |

Consequência: observar transação aberta exige `information_schema.INNODB_TRX` por `CONNECTION_ID()` (ou rastreio no cliente) — a variável "óbvia" não serve.

## 3. Decisões da rodada de grill

### D-S04-01 — Cancelar mantém a conexão (Q1)
- Cancelar = `KILL QUERY <id da conexão de trabalho>`, enviado pela **conexão auxiliar**.
- Depois do cancelamento a conexão **permanece**; a UI informa que **a transação continua aberta**.
- Descartar a conexão só se o protocolo se mostrar inconsistente — e sempre como mensagem explícita ("conexão encerrada; o servidor desfaz a transação"), nunca como efeito silencioso.
- Se o `KILL` não for confirmado em **5 s**, o app reporta **"cancelamento não confirmado"** e não afirma que cancelou.
- Cancelar **não** é rollback: o app nunca oferece "cancelar e desfazer" como uma ação só.

### D-S04-02 — Fonte da verdade do estado transacional (Q2)
- **Servidor** como verdade: `SELECT COUNT(*) FROM information_schema.INNODB_TRX WHERE trx_mysql_thread_id = CONNECTION_ID()`.
- **Rastreio no cliente** (sabemos se enviamos `BEGIN`/`START TRANSACTION`, se `autocommit` foi desligado, e marcamos após escrita) serve de desempate.
- Divergência entre os dois, ou servidor inalcançável → estado **`unknown`**.
- Consultar em três momentos: antes da confirmação de um lote, depois de qualquer erro e depois de cancelar. Não é polling contínuo.

### D-S04-03 — `unknown` bloqueia escrita (Q3)
- Estado `unknown` **bloqueia escrita e DDL** até decisão explícita do usuário; nada é reenviado.
- Leitura só volta depois de reconectar (conexão nova), nunca na conexão suspeita.
- A mensagem precisa dizer o que se sabe e o que não se sabe: "não houve resposta; o comando **pode** ter sido aplicado".
- Nunca repetir SQL após falha de rede, nem "só para conferir".

### D-S04-04 — DDL em transação aberta pede confirmação (Q4)
- Classe `ddl` (ADR 0013) com transação aberta detectada → **aviso + confirmação** de que o servidor fará commit implícito.
- Estado `unknown` → não executa (cai em D-S04-03).

### D-S04-05 — Permissões medidas com usuário temporário (Q5)
- Criar `seshat_s04_ro` na instância descartável, medir, **derrubar ao final**, com criação e remoção registradas na evidência.
- A senha do usuário temporário é gerada no spike e usada só em memória; não vai para arquivo nem para o relatório.

## 4. Escopo e exclusões
**Dentro:** cancelamento por `KILL QUERY`, encerramento por `KILL CONNECTION`, estado transacional, commit implícito de DDL e `LOCK TABLES`, perda de conexão, `unknown`, permissões de `KILL`, concorrência de comandos no `mysql2`.
**Fora:** implementação em `src/`; UI; S05 (Monaco/grid/pacote); T03; suporte a rotinas/`DELIMITER` (ADR 0013); outros bancos.

## 5. Experimentos (cada um vira seção da evidência)

| # | Experimento | O que registrar |
|---|---|---|
| 1 | `SELECT CONNECTION_ID()` nas duas conexões | ids; confirmar que são threads distintas |
| 2 | `KILL QUERY` durante `SELECT SLEEP(30)` | código/errno/sqlState do cliente, latência até retornar, **se a conexão continua utilizável** (`SELECT 1` depois) |
| 3 | Transação após `KILL QUERY` | `BEGIN; INSERT;` + comando longo + `KILL QUERY` + `ROLLBACK` → o `INSERT` sumiu? A transação sobreviveu ao cancelamento? |
| 4 | Visibilidade em `INNODB_TRX` | transação só-leitura aparece? Transação com escrita ociosa aparece? Sem transação, a consulta volta 0? (base da D-S04-02) |
| 5 | `KILL CONNECTION` | erro no cliente; pela **segunda conexão**, confirmar que os dados da transação foram desfeitos |
| 6 | Commit implícito de DDL | `BEGIN; INSERT; CREATE TABLE …; ROLLBACK;` → o `INSERT` persiste. Repetir com `ALTER`, `TRUNCATE`, `RENAME` |
| 7 | `LOCK TABLES` | dispara commit implícito igual ao DDL? `UNLOCK TABLES` também? |
| 8 | `conn.destroy()` no meio de uma transação | erro observado; estado da linha visto pela outra conexão; registrar `unknown` quando não houve resposta |
| 9 | `destroy()` durante `COMMIT` | tentar a corrida: enviar `COMMIT` e destruir sem esperar resposta. Registrar que o resultado é **por definição unknown**; não afirmar sucesso nem falha |
| 10 | Cancelar a contagem (ADR 0012) | `KILL QUERY` na contagem lenta sobre `vol`; confirmar que a sessão de trabalho segue utilizável |
| 11 | Concorrência no `mysql2` | enviar um segundo comando enquanto o primeiro roda: **enfileira ou erra?** Isso define se o app precisa bloquear "uma execução ativa" por conta própria |
| 12 | Permissões com `seshat_s04_ro` | consegue `KILL` da própria thread? De outra sessão? `PROCESS`/`CONNECTION_ADMIN` fazem diferença? Registrar o erro exato |

## 6. Critérios de aceite
- Evidência com **comandos, resultados e erros reais** — nenhuma afirmação baseada só em documentação.
- Distinguir, com prova: **cancelar ≠ rollback** · **desconectar desfaz a transação** · **DDL commita** · **commit sem resposta = `unknown`**.
- As decisões D-S04-01…05 aparecem implementadas **na política** (texto do ADR), não em código de produção.
- ADR 0014 escrito, status **proposto**.
- `npm run lint` exit 0; senha ausente de todos os arquivos; usuário temporário derrubado.
- Nada em `src/` alterado.

## 7. Riscos e condições de parada
- **Parar** se algum experimento exigir privilégio que a instância não tem — registrar a limitação, não contornar.
- **Parar** antes de qualquer teste fora de `seshat_spike`; nunca tocar perfis reais do usuário.
- Experimento 9 pode não ser observável de forma determinística — registrar como "tentado, resultado inconclusivo" em vez de inventar.
- Não repetir SQL após falha de rede.
- Uma etapa por vez: não iniciar S05 nem T03.

## 8. Comandos previstos
```powershell
$env:SESHAT_DB_PASSWORD = '<senha>'      # só em memória
node spikes/s04-sessao.mjs               # relatório em docs/spikes/20261030_s04-session-cancel-evidence.md
npm run lint
grep -rl "<senha>" . --exclude-dir=node_modules --exclude-dir=.git   # deve não encontrar nada
```

## 9. Documentos a produzir/atualizar
- `spikes/s04-sessao.mjs` (novo)
- `docs/spikes/20261030_s04-session-cancel-evidence.md` (novo)
- `docs/adr/0014-cancelamento-e-sessao.md` (novo, **proposto**)
- `docs/survey/20261030_s04_sessao_e_cancelamento_surveyfacts.md` (fatos da sessão)
- `docs/survey/20261029_etapa0_surveyfacts.md` (§12 S04)
- `docs/plans/main/20261029_etapa0_plansfacts.md` (seção S04 + cabeçalho)
- `docs/06-backlog.md` (status T02), `docs/04-pendencias.md` (P02/P06 conforme o medido)

## 10. Encerramento
Relatório no modelo do `CLAUDE.md` — objetivo, dependências, critérios de aceite, testes, riscos e condições de parada, diff, comandos/resultados, pendências, documentos atualizados — e pedido para o usuário executar `gitpr`. Git continua somente leitura para o agente.
