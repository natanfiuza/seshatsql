# 🚀 Sugestão de Pull Request

**Mensagem de Commit Recomendada:**
```text
chore: inicializa projeto SeshatSQL com Electron, Vue 3 e TypeScript
```

---

## 🎯 Resumo

Estabelece o esqueleto inicial do **SeshatSQL**, um cliente SQL desktop para MySQL baseado em Electron + TypeScript + Vue 3. Este PR formaliza o ambiente de desenvolvimento (engines, dependências exatas), a política de licenciamento e as regras de qualidade que passam a valer para todo o time antes de qualquer código de produto ser escrito.

O objetivo é travar decisões estruturais cedo — versões, licença e higiene de repositório — evitando retrabalho e vazamento de credenciais nas etapas seguintes.

## 🛠️ Mudanças Técnicas

- Adiciona `.gitignore` cobrindo `node_modules/`, saídas do electron-vite/electron-builder (`out/`, `dist/`), logs, `*.tsbuildinfo` e arquivos `.env`/`.env.*`.
- Cria `package.json` com nome `seshatsql`, versão `0.0.0`, privado, entrypoint `./out/main/index.js` e `engines.node >= 22.12.0`.
- Declara dependências de runtime fixadas: `ag-grid-community`/`ag-grid-vue3` 36.2.0, `monaco-editor` 0.57.0, `mysql2` 3.24.6, `vue` 3.5.44, `vue-i18n` 11.4.16, `yaml` 2.9.1, `zod` 4.6.7.
- Declara devDependencies de toolchain: `electron` 45.1.0, `electron-vite` 6.0.0, `electron-builder` 26.18.0, `vite` 8.3.5, `typescript` 6.0.3, `vue-tsc` 3.3.14, `eslint` + `eslint-plugin-vue`, `vitest` 5.0.5, `@playwright/test` 1.64.1.
- Adiciona `.npmrc` com `save-exact=true` e `engine-strict=true` para impedir ranges flutuantes e barrar instalação em Node fora do intervalo suportado.
- Inclui `LICENSE` com Mozilla Public License 2.0, alinhando `license: "MPL-2.0"` no manifesto.
- Adiciona `.gitpr/skill/.gitpr.linter.yml` com regras estáticas locais: bloqueio de debug PHP (`dd`, `dump`, `var_dump`, `die`, `exit`), `console.log`/`debug`/`info` em JS/TS/Vue, `localhost`/`127.0.0.1` hardcoded e verbos em URIs de rotas; avisos para DocBlock e `TODO`/`FIXME`.
- Atualiza documentação de projeto (`CLAUDE.md`, `docs/03-dependencias-e-versoes.md`, `docs/04-pendencias.md`, `docs/08-ambiente-windows.md`, `docs/09-licenca-e-proveniencia.md`, planos e survey da Etapa 0) e os prompts de skill em `.gitpr/skill/`.

## ⚠️ Impacto/Avisos

- **Dependências:** todas as versões são exatas e o `engine-strict` está ativo. Node abaixo de `22.12.0` fará a instalação falhar — atualize o ambiente antes de rodar `npm install`.
- **Banco de dados:** sem impacto nesta etapa; `mysql2` é apenas declarado, nenhuma migração ou schema foi introduzido.
- **Variáveis de ambiente:** `.env` e `.env.*` passam a ser ignorados pelo Git. Credenciais de conexão MySQL nunca devem ser versionadas; quem já possuía arquivos locais precisa confirmar que não estão rastreados.
- **Licenciamento:** o projeto adota MPL-2.0. Contribuições externas passam a ser regidas por esses termos, incluindo a obrigação de disponibilizar o código-fonte modificado dos arquivos cobertos.
- **Qualidade/CI local:** o linter do GitPR bloqueia commits com `console.log` e `localhost` hardcoded, o que pode interromper fluxos de desenvolvimento já em andamento.
- **Windows:** o guia `docs/08-ambiente-windows.md` foi ajustado; desenvolvedores nessa plataforma devem revisar os passos antes de configurar o ambiente.
- Nenhum código de aplicação, build ou teste automatizado é entregue neste PR.


close #1

---

[![GitPR](https://img.shields.io/badge/GitPR-3_errors_%C2%B7_0_warnings-red)](https://gitpr.natanfiuza.dev.br/)