# 🚀 Sugestão de Pull Request

**Mensagem de Commit Recomendada:**
```text
chore: padroniza comentários e mensagens do código em inglês
```

---

## 🎯 Summary

O projeto adota o inglês como idioma padrão de tudo que é código: comentários, JSDoc, títulos de teste e mensagens de log/erro. Antes, o código misturava português (comentários e saídas de console) com identificadores em inglês, o que gerava inconsistência para contribuidores externos e para o repositório open-source. Esta mudança não altera comportamento — apenas uniformiza a linguagem do que é lido por quem mantém o projeto, mantendo o português para documentação de produto/planejamento.

## 🛠️ Technical Changes

- Tradução de comentários e blocos JSDoc em `electron.vite.config.ts`, `eslint.config.mjs`, `src/domain/app-info.ts`, `src/main/index.ts`, `src/preload/api.ts`, `src/renderer/src/i18n/index.ts` e `src/renderer/src/i18n/types.ts`.
- Tradução de cabeçalhos, comentários de seção e mensagens de console/erro dos spikes `s01-driver.mjs`, `s02-volume.mjs`, `s03-splitter.mjs` e `s04-sessao.mjs` (incluindo mensagens de falha e de relatório gravado).
- Tradução de nomes de testes em `tests/e2e/app.spec.ts`, `tests/unit/app-info.test.ts` e `tests/unit/i18n-catalog.test.ts`.
- Inclusão/atualização da diretriz de padrão de código em inglês em `CLAUDE.md`, `GEMINI.md` e no relatório `docs/claude-code/reports/develop_natan/20261030_english_code_standard.md`.
- Atualização do PR desc em `.gitpr/reports/pr_desc/develop_natan_20261030124018_PR_DESC.md`.

## ⚠️ Impact/Warnings

- Sem alteração de comportamento, contratos, schema de banco ou dependências; nenhuma migração ou variável de ambiente nova.
- Mensagens de saída dos spikes (`stdout`/`stderr`) agora são em inglês — scripts ou documentação que façam parsing dessas strings precisam ser ajustados.
- Textos de interface (i18n) **não** foram alterados; apenas comentários e tipos relacionados.
- Títulos de teste alterados podem impactar relatórios históricos de execução que referenciem o nome antigo.

close #13

---

[![GitPR](https://img.shields.io/badge/GitPR-no_issues-brightgreen)](https://gitpr.natanfiuza.dev.br/)