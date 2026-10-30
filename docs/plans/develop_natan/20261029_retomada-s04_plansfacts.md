# Retomada — S03 encerrado, próxima ação é o S04
Criado em 2026-10-29 · Branch `develop_natan` · **Para execução em 2026-10-30**
Este arquivo existe para continuar o trabalho sem depender da conversa anterior. Leia `CLAUDE.md` antes de agir: ele prevalece sobre tudo o que está aqui.

## 1. Primeira mensagem de amanhã (copiar e colar)

> Leia `CLAUDE.md` e `docs/plans/develop_natan/20261029_retomada-s04_plansfacts.md`. Confirme o estado do repositório e execute **apenas o S04** descrito na seção 4. Pare ao final e peça o `gitpr`.

## 2. O que foi feito na última ação (S03 — encerrado)

| Item | Estado |
|---|---|
| Gerador | `spikes/s03-splitter.mjs` — tokenizador por estado + corpus de 28 casos (novo, 21,9 kB) |
| Evidência | `docs/spikes/20261029_s03-sql-splitting-evidence.md` — 10.030 caracteres, 28 casos, 38 execuções, **0 falhas** (novo) |
| Decisão | `docs/adr/0013-splitter-e-fallback.md` — status **proposto** (novo) |
| Docs atualizados | `docs/04-pendencias.md` (P03), `docs/06-backlog.md`, `docs/survey/20261029_etapa0_surveyfacts.md` (§11), `docs/plans/main/20261029_etapa0_plansfacts.md` |
| Verificação | `node spikes/s03-splitter.mjs` → exit 0 · `npm run lint` → exit 0 · senha não aparece em arquivo algum |
| Commit/PR | **pendente do usuário** — executar `gitpr` se ainda não foi feito |

Resultado que importa para o S04: o driver recusa lotes (`ER_PARSE_ERROR/1064`) e a divisão é nossa; segurança é **por lote**; `unbalanced-string`, `unbalanced-comment`, `routine-body` e `delimiter-command` bloqueiam o lote inteiro; o splitter depende do `sql_mode` da sessão.

### Conferir antes de começar
```powershell
git branch --show-current        # esperado: develop_natan
git log --oneline -3             # deve conter o commit do S03, se o gitpr já rodou
git status --short               # não deve haver trabalho do S03 solto
```

## 3. Pendências que continuam abertas (não são do S04)
1. Revisão humana dos **ADRs 0011, 0012 e 0013** — todos **propostos**.
2. Revisão do **lockfile** pelo usuário — bloqueia `npm ci` integral.
3. **B-01**: 9.7 LTS e 8.0.46 seguem sem ambiente; nenhum ADR é definitivo.
4. Pasta do plano antigo está em `docs/plans/main/` (histórico); esta retomada está em `docs/plans/develop_natan/`.

## 4. Próxima ação — T02 / S04 (sessão, cancelamento e estado `unknown`)

**Gate (`docs/05-spikes.md`):** *"não repetir escrita nem alegar rollback global; estado unknown explícito quando necessário."*

### 4.1 Ambiente
- MySQL **8.4.13** em `127.0.0.1:3307`, schema descartável **`seshat_spike`** (já existe, com `vol` de 2.000.000 de linhas e `s03_probe`).
- Senha **somente** pela variável `SESHAT_DB_PASSWORD` — nunca em arquivo, log ou commit.
- Gerador novo: `spikes/s04-sessao.mjs`, relatório em `docs/spikes/20261029_s04-session-cancel-evidence.md` (UTF-8; o console do PowerShell 5.1 corrompe acentos).
- Duas conexões: **principal** (sessão de trabalho) e **auxiliar** (só controle/cancelamento) — permitido pelo `CLAUDE.md`. A auxiliar **não** serve para contar dados dependentes da sessão principal sem demonstrar a semântica.

### 4.2 O que medir (cada item vira uma seção da evidência)
| # | Experimento | Resultado esperado / o que registrar |
|---|---|---|
| 1 | `SELECT CONNECTION_ID()` nas duas conexões | id de thread da principal para o `KILL` |
| 2 | `KILL QUERY <id>` durante `SELECT SLEEP(30)` | erro do cliente (`ER_QUERY_INTERRUPTED/1317`?), tempo até retornar, **se a conexão continua utilizável** |
| 3 | Após o `KILL QUERY`, a transação continua aberta? | testar com `BEGIN; INSERT;` + `KILL QUERY` + `ROLLBACK`/`COMMIT`; descobrir **como** verificar transação aberta (candidatos: `information_schema.INNODB_TRX`, `@@in_transaction` se existir na 8.4 — **verificar**, não supor) |
| 4 | `KILL CONNECTION <id>` | cliente vê `ECONNRESET`/2013? o servidor desfaz a transação? confirmar pelos dados, não pela doc |
| 5 | DDL dentro de transação | `BEGIN; INSERT; CREATE TABLE t2 (...); ROLLBACK;` → o `INSERT` **persiste** (commit implícito). Repetir com `TRUNCATE`, `ALTER`, `RENAME` |
| 6 | `LOCK TABLES` / `UNLOCK TABLES` | commit implícito igual ao DDL? |
| 7 | Queda de rede no meio da escrita (`conn.destroy()`) | erro observado; **não** repetir o SQL; registrar que o estado é **unknown** quando não há resposta |
| 8 | Queda durante um `COMMIT` | o caso mais importante: sem `OK`, o commit **pode** ter ocorrido — registrar explicitamente "unknown, nunca repetir" |
| 9 | Cancelar a contagem (ADR 0012) | `KILL QUERY` numa contagem lenta (`vol` com filtro) sem afetar a sessão |
| 10 | Permissões | se a instância permitir, usuário restrito: consegue cancelar a própria thread? `KILL` de outra exige `CONNECTION_ADMIN`/`PROCESS`? |

### 4.3 Critérios de aceite
- Evidência com **comandos, resultados e erros reais** — nenhuma afirmação baseada só em documentação.
- Distinguir claramente: **cancelar ≠ rollback**; **desconectar** desfaz a transação; **DDL commita**; **commit sem resposta = unknown**.
- ADR 0014 (cancelamento e estado de transação) escrito, status **proposto**.
- Nada aplicado em `src/`; só o spike.

### 4.4 Riscos e condições de parada
- **Parar** se precisar de `SUPER`/`CONNECTION_ADMIN` que a instância não tenha — registrar a limitação em vez de contornar.
- **Parar** antes de qualquer teste destrutivo fora de `seshat_spike`; nunca tocar perfis reais do usuário.
- Não repetir SQL após falha de rede (regra do `CLAUDE.md`), nem mesmo "só para confirmar".
- Não prometer rollback de DDL nem rollback global após cancelamento.
- Uma etapa por vez: **não** iniciar S05 nem T03.

### 4.5 Documentos a atualizar ao final
`docs/survey/20261029_etapa0_surveyfacts.md` (§12 S04) · `docs/plans/main/20261029_etapa0_plansfacts.md` (seção S04 + cabeçalho) · `docs/06-backlog.md` (status T02) · `docs/04-pendencias.md` (P02/P06 conforme o medido) · `docs/adr/0014-cancelamento-e-sessao.md` · `spikes/s04-sessao.mjs` · `docs/spikes/20261029_s04-session-cancel-evidence.md`.

### 4.6 Encerramento
Relatório no modelo do `CLAUDE.md` (objetivo, dependências, critérios, testes, riscos, parada, diff, comandos/resultados, pendências, docs) e **pedido para o usuário executar `gitpr`**. Git continua somente leitura para o agente.
