# 🚀 Sugestão de Pull Request

**Mensagem de Commit Recomendada:**
```text
test: adiciona spike de evidências do driver mysql2
```

---

## 🎯 Resumo

Adiciona o script de spike `spikes/s01-driver.mjs`, que executa uma bateria reproduzível de experimentos contra a instância MySQL alvo para levantar evidências concretas sobre os limites do driver `mysql2`. O objetivo não é entregar código de produto, mas subsidiar com dados observados a decisão registrada no ADR do driver (`docs/adr/0011-driver-mysql.md`) e os fatos documentados em `docs/spikes/` e no survey/plano da Etapa 0.

O script automatiza a coleta que antes seria manual, reduzindo o risco de decisões de persistência baseadas em suposições sobre conversão de tipos, precisão numérica, fuso horário e comportamento de erros.

## 🛠️ Mudanças Técnicas

- Cria `spikes/s01-driver.mjs` (script isolado, fora do código de produto), executável via `node spikes/s01-driver.mjs [arquivo-de-saida]`.
- Lê a configuração de conexão exclusivamente de variáveis de ambiente (`SESHAT_DB_HOST`, `SESHAT_DB_PORT`, `SESHAT_DB_USER`, `SESHAT_DB_PASSWORD`), abortando com código 2 quando a senha não é informada.
- Abre duas conexões em paralelo: uma com as opções padrão do driver e outra com `supportBigNumbers`, `bigNumberStrings` e `dateStrings`, permitindo comparação direta dos mesmos dados.
- Cobre 11 blocos de investigação: versão/charset/`sql_mode`/fuso do servidor e plugin de autenticação; fixtures de tipos; conversão de tipos com opções padrão vs estritas; `query()` (protocolo de texto) vs `execute()` (preparado); distinção entre `NULL`, string vazia, zero e literal `'NULL'`; Unicode/emoji e colação `utf8mb4_0900_ai_ci`; múltiplos result sets via `CALL` com parâmetro `OUT` e `ROW_COUNT()`; protocolo de erro (sintaxe, tabela/coluna inexistente, duplicidade, FK, divisão por zero, lote de statements) incluindo `SHOW WARNINGS`; datas e fuso (`DATETIME` vs `TIMESTAMP`); parâmetros em `execute()`; e metadados de coluna (`columnType`, `flags`, `columnLength`, `decimals`).
- Usa literais SQL nos `INSERT` para preservar exatidão de `BIGINT`/`DECIMAL(65,30)` que um número JS perderia.
- Gera relatório em Markdown; sem argumento escreve em `stdout`, com argumento grava o arquivo via `writeFileSync` em UTF-8.
- Nunca imprime nem grava a senha; erros são resumidos por `code`/`errno`/`sqlState`/mensagem.

## ⚠️ Impacto/Avisos

- **Banco de dados:** o script é destrutivo dentro do schema de trabalho `seshat_spike` — executa `CREATE DATABASE IF NOT EXISTS`, `DROP TABLE` e `DROP PROCEDURE` antes de recriar as fixtures. Não deve ser apontado para ambientes com dados reais; o uso esperado é uma instância local/descartável.
- **Privilégios:** exige permissões de `CREATE DATABASE`, `CREATE ROUTINE` e leitura em `mysql.user`, além de `USE` no schema de trabalho. Em credenciais restritas, os blocos correspondentes falharão.
- **Dependências:** requer `mysql2` instalado e um servidor MySQL 8+ (uso de `utf8mb4_0900_ai_ci`, coluna `plugin` em `mysql.user`, `DATETIME(6)`/`TIMESTAMP(6)`). Nenhuma dependência nova de produção é introduzida.
- **Ambiente:** a senha vem apenas de `SESHAT_DB_PASSWORD`; nada é versionado. A gravação em arquivo evita corrupção de emoji no console do PowerShell 5.1.
- **Escopo:** é código de evidência, não de produto — recomenda-se excluí-lo de build, lint de produção e cobertura, mantendo-o apenas como artefato reproduzível de investigação.
- **Documentação:** acompanha atualizações em `docs/adr/0011-driver-mysql.md`, `docs/03-dependencias-e-versoes.md`, `docs/06-backlog.md`, no plano e no survey da Etapa 0, e nos spikes de evidência.

close #5

---

[![GitPR](https://img.shields.io/badge/GitPR-0_errors_%C2%B7_2_warnings-yellow)](https://gitpr.natanfiuza.dev.br/)