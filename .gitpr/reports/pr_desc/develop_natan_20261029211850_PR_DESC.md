# 🚀 Sugestão de Pull Request

**Mensagem de Commit Recomendada:**
```text
feat: inicializa app Electron com Vue, i18n e testes
```

---

## 🎯 Resumo

Estabelece a base executável do SeshatSQL, um cliente SQL desktop para MySQL: processo principal Electron, camada de ponte (preload) isolada, renderer Vue 3 com i18n em cinco idiomas e a infraestrutura de build, tipagem, lint e testes necessária para evoluir as próximas etapas com segurança. A decisão central é nascer com o modelo de segurança do Electron já fechado (sandbox, context isolation, sem integração Node no renderer e sem navegação/abertura de janelas pelo conteúdo), evitando retrabalho quando credenciais e conexões de banco entrarem em cena.

## 🛠️ Mudanças Técnicas

- Adiciona `electron.vite.config.ts` com os três alvos do electron-vite: main e preload em CJS (exigido pelo preload sandboxed) e renderer em ESM com plugin Vue.
- Cria o processo principal (`src/main/index.ts`) com janela de 1280x800, `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, bloqueio de `window.open` e de `will-navigate`; carrega `ELECTRON_RENDERER_URL` em desenvolvimento e o HTML empacotado em produção.
- Cria o preload (`src/preload/index.ts` + `api.ts`) expondo via `contextBridge` um objeto congelado `window.seshat` com apenas `productName`, sem `invoke` genérico, drivers ou credenciais.
- Cria a constante de domínio `PRODUCT_NAME` (`src/domain/app-info.ts`) isolada de Node, Electron e Vue.
- Estrutura o renderer (`src/renderer`) com `index.html` protegido por Content-Security-Policy, `main.ts`, `App.vue`, CSS base e declaração global de tipos em `env.d.ts`.
- Implementa i18n com `vue-i18n` (legacy desativado), locale padrão `en-US` e catálogos `pt-BR`, `pt-PT`, `fr` e `es` tipados por um alias `Messages` (exigência de assinatura de índice do vue-i18n).
- Adiciona scripts npm de `dev`, `build`, `preview`, `typecheck` (node e web), `lint`, `test`, `test:e2e` e `dist:win` (NSIS x64).
- Configura ESLint flat config com `typescript-eslint` e `eslint-plugin-vue`, exigindo parser TS nos arquivos `.vue`.
- Divide a tipagem em `tsconfig.node.json` e `tsconfig.web.json`, ambos em modo estrito com checagens extras (`noUncheckedIndexedAccess`, `noUnusedLocals`, `verbatimModuleSyntax`), referenciados pelo `tsconfig.json`.
- Adiciona testes unitários (Vitest) para `PRODUCT_NAME` e para a paridade de chaves/ausência de mensagens vazias nos catálogos de idioma, além de um teste E2E (Playwright) que abre a janela e valida o título exibido.
- Atualiza `.gitignore` para ignorar `test-results/` e `playwright-report/`.

## ⚠️ Impacto/Avisos

- **Dependências:** adiciona `typescript-eslint` como dependência de desenvolvimento; o build passa a depender de `electron-vite`, `vue-i18n` e `@playwright/test` estarem instalados.
- **Banco de dados:** nenhuma migração ou schema nesta alteração — não há acesso a MySQL ainda.
- **Ambiente:** novos comandos disponíveis (`dev`, `build`, `test`, `test:e2e`, `dist:win`); o teste E2E requer os binários do Playwright instalados na máquina/CI. A variável `ELECTRON_RENDERER_URL` é usada apenas fora do pacote empacotado.
- **Segurança:** a superfície exposta ao renderer é intencionalmente mínima; qualquer novo método precisa ser adicionado explicitamente à interface `SeshatApi`, nunca via canal genérico.
- **Compatibilidade:** o processo principal e o preload são emitidos como CJS porque `package.json` não declara `"type": "module"`; alterar isso quebra o preload sandboxed.

close #3

---

[![GitPR](https://img.shields.io/badge/GitPR-no_issues-brightgreen)](https://gitpr.natanfiuza.dev.br/)