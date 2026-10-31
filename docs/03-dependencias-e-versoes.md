# Dependências e baseline
## Candidatas aprovadas para experimentar, não homologadas
mysql2; Monaco Editor; AG Grid Community (sem Enterprise); Vue I18n; Zod; yaml; Vitest; Playwright; electron-vite + electron-builder. Parser/tokenizador MySQL não escolhido.
## Versões verificadas em documentação, não executadas
Consulta 2026-10-29: Node.js 24.22.2 LTS publicado 2026-10-28; Electron 45.1.0 estável publicado 2026-10-27; site electron-vite anuncia 5.0.0. Esses números são baseline candidata, não prova de integração. Documentação electron-vite declara Node 20.19+/22.12+ e Vite 5+; validar engines/peerDependencies exatos do conjunto antes de instalar.
Fontes: https://nodejs.org/en/blog/release/v24.22.2 ; https://releases.electronjs.org/?channel=stable ; https://electron-vite.org/ ; https://electron-vite.org/guide/ . Não confundir electron-vite com outro projeto chamado vite-plugin-electron.
Não congelar todas dependências por suposição. T00 inspeciona metadados do registro, escolhe versões exatas compatíveis, registra engines/avisos, cria lockfile e inventário de licenças após aprovação. npm ci exige lockfile existente. Node local de build é distinto de Node embutido no Electron.
## Restrições por componente
mysql2: validar streaming/backpressure/precisão/session status/CALL/cancelamento; Promise API não garante memória limitada.
Monaco: workers empacotados, CSP, SQL syntax, models/view states/dispose, localização nos cinco idiomas; não é parser SQL seguro nem API de extensões VS Code.
AG Grid: Community apenas; provar copiar dados e cabeçalhos com recursos permitidos; não exigir clipboard/range selection Enterprise. Sem importação/exportação de arquivos.
Vue I18n: chaves sem texto hardcoded, fallback e cobertura; nomes de objetos e SQL não traduzidos.
Vitest/Playwright: validar versões e API Electron; testes smoke em Windows e sem servidor dev.
MPL escolhida para próprio código não substitui obrigações das dependências. Verificar transitivas, avisos e assets antes de publicar.
## Decisões da Etapa 0 (2026-10-29)
Registro de decisão do usuário após inspeção do registro npm. O texto acima permanece como baseline original; onde houver divergência, prevalecem os valores abaixo.
Divergências autorizadas: Node de build 22.18.0 (não 24.22.2; todas as engines aceitam, `engines >=22.12.0`); electron-vite 6.0.0 com Vite 8.3.5 (o site ainda documenta 5.0.0, e o 5.0.0 não aceita Vite 8); TypeScript 6.0.3 (o latest 7.0.2 é a reescrita em Go, com API programática instável até 7.1 e risco para vue-tsc/eslint).
Versões a congelar em T00: electron 45.1.0; electron-vite 6.0.0; vite 8.3.5; vue 3.5.44; @vitejs/plugin-vue 6.0.10; typescript 6.0.3; vue-tsc 3.3.14; @types/node 24.19.2; mysql2 3.24.6; monaco-editor 0.57.0; ag-grid-community 36.2.0; ag-grid-vue3 36.2.0; vue-i18n 11.4.16; zod 4.6.7; yaml 2.9.1; vitest 5.0.5; @playwright/test 1.64.1; electron-builder 26.18.0; eslint 10.13.0; eslint-plugin-vue 10.12.0.
Licenças não-MIT a registrar: yaml (ISC); @playwright/test e @swc/core (Apache-2.0).
Ainda não congelado: patches exatos após instalação, inventário de transitivas e suporte declarado do electron-builder ao Electron 45. Nenhuma dependência foi instalada.
## T00 executado — versões efetivamente instaladas (2026-10-29)
As versões acima foram instaladas com `--save-exact` e estão congeladas em `package.json` e `package-lock.json` (`lockfileVersion 3`). `npm ls --depth=0` sai com código 0 e sem conflito de peer dependency; `npm ci --dry-run` sai com código 0.
`electron`, `electron-vite` e `vite` ficam em `devDependencies` (decisão D-14): são ferramentas de build e não devem entrar no pacote do `electron-builder`. As demais bibliotecas de runtime ficam em `dependencies`.
Rasters do binário Electron 45.1.0 instalado, obtidos por `process.versions` (não por documentação): node 24.22.1, chrome 156.0.8078.49, v8 15.6.75.19-electron.0.
Inventário de licenças das dependências instaladas: MIT 361, ISC 45, Apache-2.0 27, BSD-2-Clause 12, BSD-3-Clause 11, BlueOak-1.0.0 8, MPL-2.0 2 (`lightningcss`, `lightningcss-win32-x64-msvc`), `MPL-2.0 OR Apache-2.0` 1 (`dompurify`), CC-BY-4.0 1 (`caniuse-lite`), Python-2.0/0BSD/WTFPL 4. Nenhuma licença GPL, AGPL, LGPL, CC-BY-SA, EUPL, OSL ou CDDL.
`dompurify` (via `monaco-editor`) é usado sob Apache-2.0 por decisão D-13, evitando obrigação de liberar fonte de arquivo MPL dentro do bundle do renderer. `lightningcss` é dependência de build do Vite e não é distribuída. `caniuse-lite` é dado de build via `browserslist`; se passar a ser distribuída, exige atribuição.
Pendente: revisão do lockfile pelo usuário antes de qualquer `npm ci` integral e antes de T01; suporte declarado do electron-builder ao Electron 45 continua não verificado (T13).
## T01 — scaffold e scripts (2026-10-29)
Acrescentada uma dependência fora da matriz aprovada: **typescript-eslint 8.72.1** (MIT; peer `eslint ^8.57 || ^9 || ^10` e `typescript >=4.8.4 <6.1.0`, ambos satisfeitos). Motivo: o ESLint 10.13.0 embute apenas o parser JavaScript (`lib/languages/js`), então `eslint .` em arquivos `.ts` falha sem esse pacote. É a única adição; todas as demais versões continuam as de T00.
Scripts criados no `package.json`: `dev`, `build`, `preview`, `typecheck` (`typecheck:node` com `tsc -p tsconfig.node.json`, `typecheck:web` com `vue-tsc -p tsconfig.web.json`), `lint`, `test`, `test:e2e`, `dist:win`. O `typecheck` usa `-p` explícito e nunca `tsc -b`; o `tsconfig.json` da raiz tem apenas `references`, para editores.
Main e preload são compilados como **CommonJS** porque o `package.json` não declara `"type": "module"` e o preload sandboxed do Electron não aceita ESM. O renderer é empacotado como ESM pelo Vite.
`dist:win` existe como script planejado, mas não pode rodar antes de `electron-builder.yml` (T13, depende do publisher/B-03).
## S01 — comportamento do mysql2 3.24.6 (2026-10-30)
Medido contra MySQL 8.4.13 em `127.0.0.1:3307`; evidência em `docs/spikes/20261029_s01-driver-evidence.md`. A versão instalada (3.24.6) é a mesma da matriz de T00 — nenhuma dependência mudou.
As opções de conexão propostas (ADR 0011, status *proposto*) são `supportBigNumbers: true`, `bigNumberStrings: true`, `dateStrings: true` e `multipleStatements: false`. Sem as três primeiras, BIGINT acima de 2^53 perde precisão e datas são reinterpretadas no fuso do processo Node; sem a última, tolera-se que o padrão seja afrouxado mais tarde.
Resta não medido nesta dependência: streaming/backpressure, memória com volume, cancelamento e estado de transação após falha de rede — S02–S04.

## S05 — dependências de teste de componente (2026-10-30)

Adicionadas duas devDependencies fora da matriz original, ambas exigidas para testar componentes Vue sem editor real: **@vue/test-utils 2.4.6** (MIT) e **jsdom 29.1.1** (MIT). Motivo: `@vue/test-utils` é o utilitário oficial de montagem de componentes Vue 3, e o Vitest 5 usa jsdom como ambiente de DOM. As duas ficam em `devDependencies` com versão exata e não entram no pacote do electron-builder.

Duas restrições de engine medidas, não supostas, com o Node de build congelado em **22.18.0** e `.npmrc` com `engine-strict=true`:

- `jsdom@30.x` exige `node ^22.22.2`; a **29.1.1** (`^20.19.0 || ^22.13.0 || >=24.0.0`) é a mais recente compatível.
- `@vue/test-utils@2.5.1` dependia de `js-beautify ^2.0.0` → `2.0.3` → `nopt@10.0.1` (`node ^22.22.2 || ^24.15.0 || >=26.0.0`) e **abortava a instalação**. A **2.4.6** usa `js-beautify ^1.14.9` (resolvido em 1.15.4, MIT, `node >=14`) e instala com `engine-strict`. `@vue/test-utils@2.5.1` foi descartada por essa razão com aprovação do usuário (D-S05/S06-18 revisada em 2026-10-30: 2.4.6 em vez de 2.5.1).
- `npm ls --depth=0` e `npm ci --dry-run` passam após a instalação. A instalação emite aviso de depreciação de `glob@10.5.0` (transitiva de `js-beautify`, apenas dev) e o `npm audit` reporta um advisory **crítico pré-existente** em `dompurify@3.4.15` via `monaco-editor@0.57.0`, fora do escopo desta mudança e registrado como risco — a correção sugerida pelo audit (`monaco-editor@0.56.0`) é um downgrade e não será feita sem decisão do usuário.
O teste de componente cobre apenas componentes próprios com Monaco mockado; Monaco, worker e AG Grid reais continuam cobertos só pelo Playwright.

## S06 — `yaml` e `zod` empacotados no main (2026-10-31)

Nenhuma dependência nova e nenhuma versão alterada: `yaml 2.9.1` (ISC) e `zod 4.6.7` (MIT) já constavam da matriz do T00. O S06 apenas as usa em tempo de execução no processo main.
Como `electron-builder.yml` exclui `node_modules` do asar, as duas precisam ser empacotadas pelo Vite: `electron.vite.config.ts` usa `externalizeDepsPlugin({ exclude: ['yaml', 'zod'] })`. Medição: `out/main/index.js` com 426 kB e asar do pacote com 8,6 MB (8,4 MB no S05); o app empacotado inicia, lê e grava a persistência sem `node_modules` ao lado.
`mysql2 3.24.6` continua em `dependencies` e será tratado da mesma forma quando entrar no main (T04/T05).
