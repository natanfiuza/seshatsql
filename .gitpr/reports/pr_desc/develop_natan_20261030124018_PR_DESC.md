# 🚀 Sugestão de Pull Request

**Mensagem de Commit Recomendada:**
```text
test: adiciona spike de sessão, cancelamento e estado unknown
```

---

## 🎯 Summary

Antes de implementar a etapa de sessão e cancelamento (S04), o time precisa de fatos medidos — e não de suposições — sobre o que o MySQL faz quando um comando é cancelado, quando a conexão cai e quando um DDL aparece no meio de uma transação. O cliente não pode afirmar sucesso nem falha sobre um `COMMIT` interrompido, então as decisões D-S04-01 a D-S04-04 precisam de evidência reproduzível.

Este PR adiciona o spike executável que produz essa evidência, o relatório gerado por ele, a ADR 0014 que consolida as decisões, e ajustes de tooling (branch base do PR e tradução das mensagens do linter).

## 🛠️ Technical Changes

- **`spikes/s04-sessao.mjs`**: script Node + `mysql2` com 12 experimentos — `KILL QUERY` com e sem transação aberta, visibilidade em `INNODB_TRX`, `KILL CONNECTION`, commit implícito por `CREATE`/`ALTER`/`TRUNCATE`/`RENAME`, comportamento de `LOCK TABLES`/`UNLOCK TABLES`, `destroy()` com comando em voo e ocioso, queda durante o `COMMIT`, cancelamento de contagem lenta, comandos concorrentes na mesma conexão e matriz de privilégios com usuário temporário.
- **Verificações com asserção**: cada experimento compara o resultado esperado com o obtido; o script grava o relatório Markdown e termina com código 1 quando alguma verificação falha.
- **Correções de método descobertas na execução**: `SELECT SLEEP(n)` não serve como alvo de cancelamento (interrompido, devolve sucesso com `1`); leitura de `INNODB_TRX` é repetida até duas amostras consecutivas concordarem por causa de defasagem; consulta lenta sobre `vol` é redimensionada quando a máquina termina antes do kill.
- **Documentação**: ADR 0014 (cancelamento e sessão), plano da etapa, survey facts, relatório de evidência do spike, atualização de `docs/04-pendencias.md` e `docs/06-backlog.md`, além de `CLAUDE.md` e `GEMINI.md`.
- **Tooling**: `.gitpr/conf/gitpr.config.yml` define `base_branch: main` e `.gitpr/skill/.gitpr.linter.yml` passa a ter comentários e mensagens em inglês.

## ⚠️ Impact/Warnings

- **Sem alteração de runtime**: nenhum código de aplicação ou dependência de produção foi modificado; o spike é ferramenta de investigação.
- **Ambiente exigido**: a execução requer `SESHAT_DB_PASSWORD` e uma instância MySQL em `127.0.0.1:3307` com schema descartável `seshat_spike`. O script cria e remove tabelas, faz `TRUNCATE` e cria/derruba o usuário temporário `seshat_s04_ro` (senha aleatória em memória, nunca impressa nem gravada). Ação destrutiva limitada ao schema de trabalho.
- **Dependência opcional**: os experimentos de cancelamento dependem da tabela `vol` gerada no S02; quando ela não existe, são pulados e o relatório fica parcial.
- **Risco para a D-S04-02**: ler `INNODB_TRX` exige `PROCESS`/`CONNECTION_ADMIN`. Usuário de aplicação com apenas `SELECT` não consegue usar o servidor como fonte da verdade — o plano precisa prever rastreio no cliente com estado `unknown`.
- **Evidência incompleta**: a corrida de queda durante o `COMMIT` foi tentada e não reproduzida; o estado `unknown` está registrado como hipótese, não como medição.
- **Consequências de engenharia já fixadas**: `destroy()` não interrompe comando em voo (é preciso conexão auxiliar com `KILL CONNECTION`) e o `mysql2` enfileira comandos concorrentes — "uma execução ativa por conexão" deve ser imposta pela aplicação.
- **Tooling**: mensagens do linter local agora em inglês, sem mudança de regras; PRs passam a ter `main` como base padrão.

close #11

---

[![GitPR](https://img.shields.io/badge/GitPR-1_error_%C2%B7_1_warning-red)](https://gitpr.natanfiuza.dev.br/)