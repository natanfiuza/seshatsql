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
