# Plano — S05 (UI/pacote) e S06 (persistência), com parada entre as etapas
Data: 2026-10-30 · Branch `develop_natan` · Origem: sessão de grill `/grill-with-docs`
Survey correspondente: `docs/survey/20261030_s05_s06_ui_persistencia_surveyfacts.md`

## 1. Contexto

O T02 terminou com S01–S04 medidos contra MySQL 8.4.13 e ADRs 0011–0014 em status **proposto**. O T03 do backlog (`docs/06-backlog.md:8`) manda executar **S05/S06 e validar o pacote**, mas ainda não existia plano, survey, ADR nem evidência para esses dois estágios. Este documento é o plano aprovado; a implementação começa pelo passo 0 e para para revisão ao final de S05.

Gates (`docs/05-spikes.md:7-8`):
- **S05**: Monaco workers/CSP/locales/models; grid Community copiar dados; temas; cinco idiomas; offline depois de instalar. Gate: pacote Windows abre editor/grid sem servidor dev.
- **S06**: DPAPI, cifragem indisponível, YAML corrompido, flush/debounce, recovery e restart sem conexão/SQL. Gate: evidências sem segredos.

Restrições vigentes: `CLAUDE.md` (código/comentários/testes em inglês; texto de UI só nos catálogos i18n; uma etapa por vez; sem `git commit`/`git push`; evidência real), `docs/02-arquitetura.md`, `docs/07-testes-e-aceite.md` (A01, A02, A12, A15, A16) e `docs/rodada7-decisoes.md`.

## 2. Fatos verificados antes das perguntas (não supostos)

- **P01 está encerrada**: D7-01 fixa `~/.seshatsql/data/` (`docs/rodada7-decisoes.md:2`, `docs/adr/0010-ciclo-de-vida-e-dados.md:6`). `docs/04-pendencias.md:2` estava obsoleto e foi corrigido no passo 0. Nem `~/.sqlseshat` nem `~/.seshatsql` existem nesta máquina (verificado), então não há migração a executar.
- **Monaco 0.57.0**: `es` e `fr` trazem 2.138 mensagens traduzidas; `pt-br` existe com **2.153 entradas, todas `null`**; **não há `pt-pt`**. O caminho padrão de worker usa bootstrap *blob* (`esm/vs/platform/webWorker/browser/webWorkerServiceImpl.js`) e o README diz que `file://` não cria workers. Há override em `MonacoEnvironment.getWorker`; workers em `esm/vs/editor/editor.worker.js`; `editor.api.js`, `languages/definitions/sql/register.js` e `.../mysql/register.js` existem.
- **AG Grid 36.2.0 Community**: sem arquivos de locale no pacote (forneceremos `localeText`); `themeQuartz` disponível em Community; `LocaleText` é mapa aberto (fallback inglês); `enableCellTextSelection` é Community; `ClipboardModule`/range são Enterprise.
- **Estado atual**: apenas scaffold T01. Sem Monaco/grid/tema/persistência; `yaml`, `zod` e `safeStorage` nunca usados; `src/application` e `src/infrastructure` não existem; sem `electron-builder.yml`; `dist:win` não roda.
- **Toolchain**: Node de build 22.18.0; Electron 45.1.0; electron-vite 6.0.0/Vite 8.3.5; electron-builder 26.18.0 (suporte ao Electron 45 não verificado).
- **Dependências de teste escolhidas**: `@vue/test-utils 2.4.6` (MIT) e `jsdom 29.1.1` (MIT). `jsdom 30.x` exige Node `^22.22.2` e é incompatível com o Node 22.18.0 congelado. A tentativa inicial com `@vue/test-utils 2.5.1` falhou com `EBADENGINE` (`js-beautify@2.0.3` → `nopt@10.0.1`, que exige Node `^22.22.2`); a **2.4.6** usa `js-beautify ^1.14.9` e instala sob `engine-strict`.

## 3. Decisões da sessão de grill (confirmadas pelo usuário)

| # | Decisão |
|---|---|
| D-S05/S06-01 | S05/S06 são **independentes** da revisão dos ADRs 0011–0014; a revisão segue em trilha separada. |
| D-S05/S06-02 | Renderer empacotado usa **`app://`** (scheme privilegiado), não `file://`. |
| D-S05/S06-03 | Pacote exigido no S05 é **win-unpacked** (electron-builder `--dir`, asar). NSIS fica no T13. |
| D-S05/S06-04 | Monaco fica em **inglês para pt-BR e pt-PT** (pacote pt-br vazio; sem pt-pt). UI própria e AG Grid traduzidos; limitação registrada em ADR/docs e no aceite A15. |
| D-S05/S06-05 | Cópia do grid: **Ctrl+C próprio** grava TSV com cabeçalhos + linhas selecionadas; sem seleção, célula focada; `enableCellTextSelection` para seleção livre; nenhum recurso Enterprise. |
| D-S05/S06-06 | Tema **system/light/dark com live-follow** do SO; tokens CSS, Monaco e AG Grid sincronizados; preferência persistida no S06. |
| D-S05/S06-07 | Troca de idioma: **UI e AG Grid ao vivo; Monaco na inicialização** (reiniciar para aplicar); locale inicial do SO, senão en-US. |
| D-S05/S06-08 | S06 implementa **infraestrutura real dos três YAMLs** (inclui `connections.yml` com senha cifrada), sem UI de perfis (T04). |
| D-S05/S06-09 | Corrupção: **primário → `.bak` → quarentena `.corrupt-<timestamp>`**; versão futura recusa gravar e avisa; versão antiga migra em memória e grava após backup; nunca apaga sozinho. |
| D-S05/S06-10 | Falha de flush ao fechar: **mantém janela aberta e mostra erro**; sair sem salvar só com confirmação explícita. |
| D-S05/S06-11 | Execução em **duas etapas autorizadas**, com parada e revisão entre S05 e S06. |
| D-S05/S06-12 | **ADR 0015** (UI/pacote) e **ADR 0016** (persistência), ambos status **proposto**. |
| D-S05/S06-13 | Evidência de cifragem: **abstração `SecretProtector` + testes simulados** (indisponível, falha de cifrar/decifrar) + **DPAPI real medido**, com evidência distinguindo medido de simulado. |
| D-S05/S06-14 | i18n do AG Grid: **somente chaves usadas**, com teste de paridade nos cinco catálogos; restante cai no inglês do AG Grid. |
| D-S05/S06-15 | Offline: **log de requisições** no main (só URLs, ligado por variável de ambiente) + execução do pacote; checagem manual com rede desligada feita pelo usuário ao final. |
| D-S05/S06-16 | S06 persiste **tema e idioma** em `preferences.yml`; ficam fora: UI de perfis, tentativa de conexão, single-instance, fechamento transacional e histórico. |
| D-S05/S06-17 | S05 entrega **tela de laboratório temporária** (componentes reutilizáveis + tela `S05Lab`), que é a tela principal do pacote para cumprir o gate e será substituída em T07/T09. |
| D-S05/S06-18 | **Adicionar @vue/test-utils 2.4.6 + jsdom 29.1.1** (dev, exatas, MIT), registrar versão/licença e atualizar o lockfile para revisão. Revisada de 2.5.1 para 2.4.6 em 2026-10-30 após `EBADENGINE` medido (`js-beautify@2.0.3` → `nopt@10.0.1` exige Node `^22.22.2`). |
| D-S05/S06-19 | SQL grande: **salvar íntegro e avisar acima de 1 MB** (limite proposto no ADR 0012, não aplicado como truncamento). |
| D-S05/S06-20 | Diálogo "Iniciar arquivo(s) diretamente / Carregar arquivo(s) no editor / Cancelar" é **abertura de `.sql`, fora do MVP**; registrado como pendência futura, **não implementado**. |
| D-S05/S06-21 | Aviso de recuperação/quarentena: **banner não bloqueante com os caminhos preservados**. |

## 4. Passo 0 — após aprovação, antes do S05

1. Criar `docs/plans/develop_natan/20261030_s05_s06_ui_persistencia_plansfacts.md` (este arquivo).
2. Criar `docs/survey/20261030_s05_s06_ui_persistencia_surveyfacts.md`.
3. Corrigir `docs/04-pendencias.md:2` para registrar P01 encerrada por D7-01, sem apagar o histórico.
4. Registrar em `docs/03-dependencias-e-versoes.md` as duas devDependencies, versões exatas e licença MIT antes de instalar.
5. Instalar apenas essas devDependencies (`npm install --save-dev --save-exact ...`), nunca `npm ci` integral; validar `npm ls --depth=0` e `npm ci --dry-run`; entregar o diff do lockfile para revisão.

## 5. S05 — UI, workers/CSP, grid, temas, idiomas, pacote

### 5.1 Objetivo
Provar, em pacote Windows executável sem dev server, Monaco com worker, SQL/MySQL, models/view states/dispose; grid Community com cópia; tema system/light/dark; cinco idiomas na UI e no grid; ausência de requisições externas.

### 5.2 Dependências e arquivos
- Novas devDependencies: `@vue/test-utils@2.4.6`, `jsdom@29.1.1`.
- Novos: `src/main/protocol/app-protocol.ts`, `src/main/request-log.ts`, `electron-builder.yml`, `src/renderer/src/theme/*`, `src/renderer/src/editor/*`, `src/renderer/src/grid/*`, `src/renderer/src/ui/S05Lab.vue`.
- Alterados: `src/main/index.ts`, `src/renderer/index.html`, `src/renderer/src/main.ts`, `src/renderer/src/ui/App.vue`, `src/renderer/src/i18n/index.ts` e catálogos, `src/renderer/src/styles/base.css`, `electron.vite.config.ts`, `package.json` (script `pack:win`).
- Preload **não** ganha API no S05 (tema via `prefers-color-scheme`; sem IPC novo).

### 5.3 Passos
1. **Scheme `app://`**: `protocol.registerSchemesAsPrivileged` (standard, secure, supportFetchAPI, corsEnabled, stream) antes de `app.whenReady`; `protocol.handle('app', …)` servindo somente o diretório do renderer, com normalização de caminho, bloqueio de path traversal, `/`→`index.html`, MIME por extensão e 404. CSP como **header** na resposta HTML: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'` (sem `ws`, sem `blob`, sem `eval`). `style-src 'unsafe-inline'` é residual aceito para Monaco/AG Grid.
2. **Carga do renderer**: pacote carrega `app://seshat/index.html`; dev continua `ELECTRON_RENDERER_URL`. Manter `setWindowOpenHandler` deny e `will-navigate` deny.
3. **CSP de dev**: plugin Vite `transformIndexHtml` em `electron.vite.config.ts` gera a meta CSP com `ws://localhost:*` apenas em dev; produção não contém `ws`.
4. **Monaco**: bootstrap que carrega NLS antes do editor (`es` e `fr`; pt-BR/pt-PT/en-US em inglês) e importa dinamicamente `monaco-editor/editor/editor.api` + `languages/definitions/sql/register` e `mysql/register`. `MonacoEnvironment.getWorker` retorna worker Vite (`monaco-editor/editor/editor.worker?worker`), sem blob. Se o override não bastar, medir e registrar antes de relaxar; nunca relaxar `script-src`.
5. **MonacoEditor.vue**: modelo `inmemory://seshat/tab/<id>` com linguagem `mysql`, `getViewState`/`setViewState`, tema `vs`/`vs-dark` sincronizado, `dispose()` de editor e modelo.
6. **ResultGrid.vue**: `AgGridVue` Community, dados sintéticos (NULL, Unicode, texto longo, número), colunas somente leitura, `enableCellTextSelection: true`, sem filtro/range Enterprise. Handler Ctrl+C: seleção de linhas → TSV com cabeçalhos; sem seleção → valor da célula focada; `navigator.clipboard.writeText`; fallback com mensagem i18n. Tema via `themeQuartz.withParams`; `localeText` derivado de catálogo próprio, atualizado por `setGridOption`.
7. **Tema**: `styles/tokens.css` com tokens claros e escuros; `theme.ts` puro (`resolveTheme(preference, systemDark)`, `applyTheme`) e listener de `matchMedia('(prefers-color-scheme: dark)')` para live-follow quando preferência = system. Controle system/light/dark na tela.
8. **i18n**: detecção inicial `navigator.languages` → `pt-BR`, `pt-PT`, `es`, `fr`, senão `en-US`; troca ao vivo com Vue I18n e grid. Aviso i18n de que o idioma do Monaco aplica na próxima inicialização. Ampliar catálogos com todas as chaves da tela, grid e avisos.
9. **S05Lab.vue** (tela principal provisória): título, seletor de tema, seletor de idioma, aviso de reinício do editor, MonacoEditor com SQL de exemplo, ResultGrid com linhas sintéticas, dica de cópia. Sem conexão, sem execução, sem resultados reais. Comentário registra substituição em T07/T09.
10. **Pacote**: `electron-builder.yml` mínimo (`appId br.com.natanfiuza.seshatsql`, `productName SeshatSQL`, `directories.output dist`, `asar: true`, arquivos `out/**` + `package.json`); script `pack:win`: `electron-builder --win --x64 --dir`. Manter `dist:win` NSIS intocado para T13.
11. **Log de requisições (offline)**: quando `SESHAT_REQUEST_LOG` estiver definido, `session.webRequest.onBeforeRequest` grava apenas URL/método; desligado por padrão; nunca grava corpo.
12. **Evidência** `docs/spikes/20261030_s05-ui-package-evidence.md` e **ADR 0015** proposto.

### 5.4 Testes do S05
- **Unit (Vitest/node)**: `resolveTheme`/`applyTheme`; mapeamento de locale; serialização TSV; seleção de NLS; paridade de chaves i18n + chaves de grid usadas.
- **Componente (jsdom + @vue/test-utils)**: S05Lab aplica tema; troca de idioma atualiza textos; Ctrl+C com clipboard mockado; ciclo de vida do MonacoEditor com Monaco mockado.
- **E2E (Playwright, app compilado e win-unpacked)**: carrega `app://`; editor visível com linguagem `mysql`; worker sem erro no console; grid renderiza; Ctrl+C copia TSV com cabeçalhos; troca de tema/idioma; log contém apenas `app://`; sem servidor dev.
- **Manual**: abrir `dist/win-unpacked/SeshatSQL.exe`; checagem final com rede desligada feita pelo usuário.

### 5.5 Critérios de aceite do S05
- Pacote win-unpacked abre editor e grid sem dev server e sem rede.
- Workers do Monaco carregam sob CSP estrita; nenhuma diretiva global de script relaxada.
- Cópia Community reproduz dados + cabeçalhos sem recurso Enterprise.
- Tema claro/escuro com inicial e live-follow do sistema.
- Cinco idiomas na UI e no grid; Monaco em inglês para pt-BR/pt-PT com limitação documentada.
- Comandos e saídas registrados; diff entregue; parada para revisão.

### 5.6 Riscos/condições de parada do S05
- electron-builder 26 incompatível com Electron 45 → **parar**, registrar e pedir decisão.
- Vite 8/rolldown não empacotar `?worker`/Monaco 0.57 → **parar** e registrar alternativa.
- `app://` não servir módulos/workers sob asar → **parar**; não cair para `file://` sem autorização.
- Monaco exigir `worker-src blob:` apesar do override → medir e registrar; relaxar só com aprovação.
- AG Grid Theming API/localeText divergirem do esperado → registrar e ajustar dentro do Community.
- jsdom 29 não funcionar com Vitest 5 → **parar** antes de mudar versões.
- Novo lockfile só após revisão do usuário; nenhum `npm ci` integral.

## 6. S06 — DPAPI, YAML, flush, recuperação e reinício

### 6.1 Objetivo
Provar persistência real nos três YAMLs no diretório aprovado: senha só cifrada (DPAPI quando disponível; indisponibilidade sem claro), YAML validado/versionado, escrita atômica com backup válido, corrupção com quarentena e banner, debounce 500 ms, flush no fechamento e reinício sem conexão/SQL.

### 6.2 Arquitetura e arquivos
- `src/domain/persistence/`: tipos, schemas Zod (`schemaVersion: 1`), validação/migração pura, regras de recuperação e redação.
- `src/application/persistence/`: `SecretProtector` (interface), casos de uso, agendador de debounce, fila serializada por arquivo, resultados tipados (`recovered`, `quarantined`, `readonly-newer`, `password-unavailable`, `encryption-unavailable`).
- `src/infrastructure/persistence/`: `yaml-file-store` (leitura, parse, backup, quarentena, escrita atômica), implementação Electron de `SecretProtector` (`safeStorage`), resolução de caminho (`app.getPath('home')` + `.seshatsql/data`).
- `src/main/`: wiring, IPC nomeado e validado, handshake de fechamento, banner de recuperação via estado inicial.
- `src/preload/api.ts`/`index.ts`: apenas métodos nomeados (`preferences.get/set`, `tabs.load/save/flush`, `connections.list/save/delete`, `app.onCloseRequested/replyClose`), sem invoke genérico, sem credenciais em retorno.
- `src/renderer/src/ui/App.vue`/`S05Lab.vue`: carregar preferências antes de montar, restaurar abas no editor, banner de recuperação, flush coordenado.

### 6.3 Formatos propostos (ADR 0016, revisáveis no T04/T07)
- `preferences.yml`: `{ schemaVersion: 1, theme: 'system'|'light'|'dark', locale: <um dos cinco> }`.
- `tabs_states.yml`: `{ schemaVersion: 1, activeTabId: string|null, tabs: [{ id, title, text, connectionId: string|null, database: string|null, order: number, cursor: {lineNumber,column}|null, selection: {startLineNumber,startColumn,endLineNumber,endColumn}|null }] }`; IDs estáveis; duplicidade = inválido.
- `connections.yml`: `{ schemaVersion: 1, profiles: [{ id, name, color, environment, host, port, user, password: {scheme:'dpapi', data:<base64>}|null }] }`; senha em texto puro é rejeitada pelo schema; sem UI de perfis neste estágio.
- Cada arquivo tem `schemaVersion` próprio; schema `.strict()`; versão futura = recusa de gravação + aviso, arquivo intacto; versão anterior = migração em memória e gravação após backup.

### 6.4 Passos
1. Schemas e validação pura (Zod), incluindo rejeição de senha em claro, ordem/IDs, cursor/seleção e limites de sanidade.
2. `yaml-file-store`: leitura com opções defensivas; recuperação principal → `.bak` → quarentena; escrita tmp no mesmo diretório → `fsync` → copia atual para `.bak` → `rename`; retry limitado em `EPERM/EBUSY`; fila serializada por arquivo; arquivo > 1 MB gera aviso, sem truncar.
3. `SecretProtector`: interface + implementação Electron (`safeStorage.encryptString/decryptString`, base64); indisponível/falha de decifrar → erro tipado, ciphertext preservado; fake para testes simulados.
4. Dados em `app.getPath('home') + .seshatsql/data`; criar diretório só quando houver gravação; verificar legado `~/.sqlseshat/data` sem migrar nem apagar.
5. `preferences`: carga antes do mount; tema e idioma aplicados; troca persiste via IPC; reabrir restaura.
6. `tabs`: debounce 500 ms; flush imediato na troca de aba e no fechamento; restauração cria modelos Monaco com texto/cursor/seleção, sem executar e sem conectar.
7. Fechamento coordenado: interceptar `close`, pedir flush ao renderer; sucesso → fecha; falha → mantém janela aberta, banner com tentar novamente e saída sem salvar só após confirmação explícita.
8. `connections`: store + IPC + cifragem; sem UI; teste salva perfil descartável com senha vinda de variável de ambiente, verifica YAML sem claro, decifra de volta, corrompe ciphertext e confirma erro tipado preservando o valor.
9. Banner de recuperação: estado inicial com avisos (`kind`, arquivo, caminho preservado); renderer mostra banner não bloqueante e dispensável.
10. Evidência sem segredos: nenhum log de SQL/senha/ciphertext; evidência usa hash/bytes.
11. **Evidência** `docs/spikes/20261030_s06-persistence-evidence.md` e **ADR 0016** proposto.

### 6.5 Testes do S06
- **Unit (node, diretórios temporários)**: escrita atômica e ordem tmp→bak→rename; falha de rename com retry e original intacto; recuperação principal→bak; ambos inválidos→quarentena+defaults+aviso; versão futura→recusa de gravar; versão antiga→migração; IDs duplicados; cursor/seleção; rejeição de senha em claro; redação; aviso > 1 MB; resolução de caminho com `USERPROFILE` temporário; `SecretProtector` indisponível/falhas/corrupção.
- **Componente (jsdom)**: banner de recuperação com caminhos; preferências aplicadas antes do editor; troca de tema/idioma persiste.
- **E2E (Playwright)**: primeira execução cria os três arquivos; digitar SQL, aguardar 500 ms, fechar e reabrir restaura sem conexão/SQL; `preferences.yml` restaura tema/idioma; `tabs_states.yml` corrompido → banner + `.bak`/quarentena; `taskkill /F` após flush; perfil descartável sem senha clara; DPAPI real medido.

### 6.6 Critérios de aceite do S06
- Três YAMLs no diretório aprovado, validados e versionados.
- Senha só em ciphertext DPAPI; indisponibilidade e corrupção sem claro e sem apagar ciphertext.
- Escrita atômica com último backup válido e quarentena sem descarte silencioso.
- Debounce 500 ms, flush no fechamento e falha tratada sem fechar.
- Reinício restaura abas/tema/idioma sem conectar nem executar SQL.
- Evidência sem segredos; comandos e saídas registrados; diff entregue; parada para revisão.

### 6.7 Riscos/condições de parada do S06
- DPAPI entre usuários/máquinas não é reproduzível aqui → limitação **raciocinada, não medida**.
- Rename/antivírus no Windows pode falhar de forma não recuperável → parar; não cair para escrita direta.
- Handshake de fechamento pode travar com renderer ocupado → timeout e janela permanece aberta.
- YAML hostil/grande pode consumir memória → opções defensivas e limite registrados; não descartar arquivo.
- IPC novo amplia superfície → validar remetente/origem e payload; testes negativos.
- jsdom não cobre editor/worker reais → Monaco/grid só no Playwright.
- `connections.yml` é schema **proposto**; T04 pode refiná-lo.

## 7. Verificação final (ambas as etapas)

Rodar, na ordem, e registrar comando + saída real:
1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. `npm run test:e2e` (sem `ELECTRON_RUN_AS_NODE=1`)
6. `npm run pack:win`
7. e2e do pacote (`dist/win-unpacked/SeshatSQL.exe`) com `SESHAT_REQUEST_LOG`
8. execução manual do pacote pelo usuário; checagem com rede desligada
9. `git status`/`git diff --stat` para o diff entregue

Sem alegar aprovação sem saída; se algum comando falhar, registrar e parar.

Relatórios exigidos por etapa (data real na execução):
- S05: `docs/claude-code/reports/develop_natan/20261030_s05_ui_pacote.md`
- S06: `docs/claude-code/reports/develop_natan/20261030_s06_persistencia.md`

Nenhum `git commit`/`git push` pelo agente; ao final de cada etapa, pedir que o usuário rode o `gitpr`.

## 8. Pendências que permanecem (não viram decisão silenciosa)
- Revisão humana dos ADRs 0011–0014.
- Abertura de `.sql` com "iniciar direto / carregar no editor / cancelar": ideia registrada, **fora do MVP**, exige autorização própria.
- Monaco em inglês para pt-BR/pt-PT (limitação aceita).
- Cobertura i18n do AG Grid limitada às chaves usadas.
- Sem NSIS/publisher/certificado (T13); suporte do electron-builder 26 ao Electron 45 a medir.
- Sem UI de perfis, single-instance, fechamento transacional ou histórico (T04/T07/T12).
- MySQL 9.7 LTS e 8.0.46 seguem sem ambiente (B-01).
- DPAPI entre usuários/máquinas não medido.
