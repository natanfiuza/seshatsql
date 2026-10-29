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
