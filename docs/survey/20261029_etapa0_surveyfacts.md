# Survey — Etapa 0 (preparação técnica controlada)
Data: 2026-10-29 · Branch: `main` · Status: Etapa 0 entregue; **T00, T01, S01 e S02 executados** (§7–§10); revisão do lockfile pendente; S03–S04 não iniciados

## 0. Alteração de estado durante a sessão

No início da sessão o diretório **não** era repositório Git (`git rev-parse --is-inside-work-tree` → `fatal: not a git repository`, e `Get-ChildItem -Force` não mostrava `.git`). Durante a sessão — entre a inspeção inicial e a gravação destes documentos — o diretório passou a ser repositório, **sem ação do agente**:

- commit inicial `a44d40b` ("first commit", 29 arquivos), criado em 2026-10-29 19:55:30 (-03:00);
- branch renomeada de `master` para `main` às 19:55:36;
- remoto `origin` = `https://github.com/natanfiuza/seshatsql.git`, configurado às 19:55:50;
- `git ls-remote origin` confirma que o repositório remoto **existe e é acessível**: `refs/heads/main` e `HEAD` = `a44d40b`;
- local e remoto sincronizados (`git rev-list --left-right --count origin/main...main` → `0 0`), ou seja, o commit inicial já está publicado;
- `.git/gk` presente — artefato de cliente gráfico (provavelmente GitKraken).

Isso **contradiz** a premissa do `PROMPT-ETAPA-0.md` ("não suponha que o repositório natanfiuza/seshatsql já existe ou que temos acesso") e a decisão D-04 da rodada 1. O agente não executou `git init`, `commit`, `remote add` nem `push`. O fato é registrado por verificação; como proceder é decisão do usuário.

## 1. Contexto da tarefa

`PROMPT-ETAPA-0.md` pede apenas preparação técnica: inspecionar o workspace, verificar o ambiente real, montar matriz de versões/licenças com fontes, apontar riscos, propor o scaffold exato e os comandos — **sem** gerar aplicação, instalar dependências, criar/publicar repositório, conectar a bancos reais ou alterar configurações globais. O próprio `docs/plano-etapa0.md` define a pausa para revisão antes de T01.

Autoridade: `CLAUDE.md` + baseline v1.0-draft + complemento v1.1, com as decisões da rodada 7 prevalecendo nos pontos alterados.

## 2. Decisões tomadas nas rodadas de entrevista

### Rodada 1

| # | Pergunta | Decisão do usuário | Recomendação do agente |
|---|---|---|---|
| Q1 | Node de build | **Adotar 22.18.0** (o da máquina), `engines >=22.12.0` | igual — adotada |
| Q2 | Par electron-vite + Vite | **electron-vite 6.0.0 + Vite 8.3.5** | 5.0.0 + Vite 7.3.7 — **usuário escolheu o par mais novo** |
| Q3 | TypeScript | **6.0.3** | igual — adotada |
| Q4 | Scaffold e Git | **Na raiz, sem `git init`** | raiz + `git init main` — **usuário dispensou o Git** (decisão tomada antes de o repositório ser criado externamente; ver §0) |

### Rodada 2

| # | Pergunta | Decisão do usuário |
|---|---|---|
| Q5 | Layout de camadas | **Camadas na raiz**: `src/domain`, `src/application`, `src/infrastructure` + `main/preload/renderer` finos |
| Q6 | Ambiente MySQL descartável | **Adiar para T02**, registrando o bloqueio (naquele momento não havia Docker nem servidor MySQL local — só MariaDB/XAMPP). Superseded por D-09 |
| Q7 | Caminho dos docs da sessão | **`docs/plans/local/`** e `docs/survey/` (`local` no lugar de `{branch}`) — depois **movido para `docs/plans/main/`**, pois a branch passou a existir (ver §0) |
| Q8 | Atualizar baseline | **Sim** — `docs/03` e `docs/08` registram as versões decididas sem apagar o texto anterior |

### Decisões adicionais (2026-10-29, após a entrega)

| # | Tema | Decisão |
|---|---|---|
| D-09 | Banco de testes | **MySQL Community 8.4.13** na porta **3307**, separado do MariaDB/XAMPP — instalado pelo usuário em 2026-10-29, banco `seshatsql` criado |
| D-10 | appId | **`br.com.natanfiuza.seshatsql`** |
| D-11 | Assinatura de código | **Sem certificado no MVP**; instalador NSIS não assinado, com o aviso do SmartScreen documentado como limitação conhecida |
| D-12 | Git | Agente proibido de `commit`/`push` e de qualquer operação GitHub; ao fim de cada tarefa, solicitar ao usuário que rode commit e PR com `gitpr` |

### Consequências diretas das decisões

- `electron-vite 6.0.0` **substitui explicitamente** o 5.0.0 citado na baseline — mudança autorizada, não substituição silenciosa por "latest".
- Com a decisão original de não inicializar Git, não havia branch; após a criação externa do repositório, os documentos foram movidos de `docs/plans/local/` para `docs/plans/main/`.
- Vite 8 só é permitido pelo electron-vite 6 (`peerDependencies: vite ^6 || ^7 || ^8`); o par é indivisível.
- TypeScript 7.0.2 (latest) **não** será usado: API programática só estabiliza em 7.1.

## 3. Fatos levantados

### 3.1 Workspace (verificado)

| Item | Situação |
|---|---|
| Raiz | `C:\Users\nataniel\projetos\pessoal\seshatsql_projeto\seshatsql` |
| Arquivos raiz | `CLAUDE.md`, `PROMPT-ETAPA-0.md`, `README.md` |
| `docs/` | 26 arquivos: `01`–`11`, `adr/0001`–`0010`, `glossario-adicoes.md`, `plano-etapa0.md`, `rodada7-decisoes.md`, `matriz-rastreabilidade.csv`, `testes-adicionais.csv` |
| Código / `package.json` / lockfile / `node_modules` | inexistentes |
| Git | **repositório criado durante a sessão** — branch `main`, commit `a44d40b`, remoto `origin` = `natanfiuza/seshatsql`, sincronizado com o remoto (ver §0) |
| Diretório pai | dois zips da especificação (`v1.0-draft`, `fechamento-descoberta-v1.1`) |
| `~/.seshatsql/data/` | ausente |
| `~/.sqlseshat/data/` | ausente → nenhuma migração pendente, nada a apagar |

### 3.2 Ambiente (verificado por execução)

| Item | Valor |
|---|---|
| SO | Windows 11 Pro, 10.0.26300, build 26300 |
| Arquitetura | 64 bits (AMD64) |
| Git | 2.55.0.windows.5 — `C:\Program Files\Git\cmd\git.exe` |
| Node | **v22.18.0** — `C:\Program Files\nodejs\node.exe` |
| npm / npx | 11.5.2 / 11.5.2 |
| corepack | 0.33.0 |
| pnpm / yarn | presentes (globais; não serão usados) |
| Python | 3.13 |
| Docker | **ausente** |
| cliente `mysql` | ausente no PATH; existe em `C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe` (Ver 8.4.13) e o cliente **MariaDB 10.4.32** em `C:\xampp\mysql\bin\mysql.exe` |
| Servidor local | **MariaDB 11.4.2** (XAMPP), serviço `MariaDB` ativo, `127.0.0.1:3306`, banco `seshatsql` (usuário `root`, sem senha) — **não é MySQL** |
| Servidor MySQL | **MySQL Community Server 8.4.13**, serviço `MySQL84`, `127.0.0.1:3307`, banco `seshatsql`, `root@localhost` com `caching_sha2_password`; `utf8mb4` / `utf8mb4_0900_ai_ci`, `lower_case_table_names=1`, `max_allowed_packet` 67.108.864 |
| `gh` | **ausente** |
| VS Code | presente |
| Registro npm | `https://registry.npmjs.org/`, `strict-ssl=true`, sem `.npmrc` de usuário, sem token |
| Rede | alcançável — `npm view` e fontes oficiais responderam |

### 3.3 Metadados do registro npm (consulta 2026-10-29)

| Pacote | Versão | engines | peerDependencies | Licença |
|---|---|---|---|---|
| electron | 45.1.0 | node >= 22.12.0 | — | MIT |
| electron-vite | 6.0.0 (latest) · 5.0.0 existe | ^20.19.0 \|\| >=22.12.0 | vite ^6\|\|^7\|\|^8 (@swc/core opcional) — no 5.0.0: vite ^5\|\|^6\|\|^7 | MIT |
| vite | 8.3.5 (7.x termina em 7.3.7) | ^20.19.0 \|\| >=22.12.0 | — | MIT |
| vue | 3.5.44 | — | — | MIT |
| @vitejs/plugin-vue | 6.0.10 | ^20.19.0 \|\| >=22.12.0 | vue ^3.2.25\|\|^3.6.0-rc.10; vite ^5\|\|^6\|\|^7\|\|^8 | MIT |
| typescript | 7.0.2 (latest) · 6.0.3 · 5.9.3 | >=16.20.0 | — | Apache-2.0 |
| vue-tsc | 3.3.14 | — | typescript >=5.0.0 | MIT |
| @types/node | 26.6.6 (latest) · 24.19.2 (linha 24) | — | — | MIT |
| mysql2 | 3.24.6 | node >= 8 | @types/node >= 8 | MIT |
| monaco-editor | 0.57.0 | — | — | MIT |
| ag-grid-community | 36.2.0 | — | — | MIT |
| ag-grid-vue3 | 36.2.0 | — | vue ^3.5.32 | MIT |
| vue-i18n | 11.4.16 | node >= 22 | vue ^3.0.0 | MIT |
| zod | 4.6.7 | — | — | MIT |
| yaml | 2.9.1 | node >= 14.6 | — | **ISC** |
| vitest | 5.0.5 | ^22.12 \|\| ^24 \|\| >=26 | vite ^6.4\|\|^7\|\|^8 | MIT |
| @playwright/test | 1.64.1 | node >= 20 | — | **Apache-2.0** |
| electron-builder | 26.18.0 | node >= 14 | — | MIT |
| eslint | 10.13.0 | ^20.19 \|\| ^22.13 \|\| >=24 | jiti | MIT |
| eslint-plugin-vue | 10.12.0 | ^18.18 \|\| ^20.9 \|\| >=21.1 | eslint ^8.57\|\|^9\|\|^10 | MIT |
| @swc/core | 1.16.20 | — | — | Apache-2.0 |

Dependências internas relevantes: `electron-vite@6.0.0` → `rolldown ~1.2.10`, `cac ^7`, `@babel/core ^7.29.7`.

### 3.4 Versões de runtime embutidas

- Fonte publicada (página de releases): Electron 45 → Chromium 156.0.8078.48, Node 24.22.0, V8 15.6.
- **Verificado no binário instalado por T00** (`process.versions`): electron **45.1.0**, node **24.22.1**, chrome **156.0.8078.49**, v8 **15.6.75.19-electron.0**. O binário instalado é a autoridade; os dois rasters diferem apenas em patch.
- Node.js 24.22.2 "Krypton" é LTS (publicado 2026-10-28), mas **não está instalado** nesta máquina como Node de sistema; existe apenas embutido no Electron.

### 3.5 Fontes consultadas

- https://nodejs.org/en/blog/release/v24.22.2
- https://www.electronjs.org/blog/electron-45-0
- https://electron-vite.org/guide/
- Registro npm via `npm view` (versão, engines, peers, licença, dependências)
- Busca web sobre TypeScript 7 (reescrita Go/"Corsa"; API programática estabiliza em 7.1)

## 4. Divergências registradas contra a baseline

1. **Node**: baseline documenta 24.22.2; ambiente tem 22.18.0. Todas as engines aceitam 22.18.0.
2. **electron-vite**: baseline cita 5.0.0 (site ainda desatualizado); registro publica 6.0.0 desde 2026-10-14. Decisão D-02 autoriza o 6.0.0.
3. **Vite**: 8.3.5 exige electron-vite 6 — o par foi decidido em conjunto.
4. **TypeScript**: latest é 7.0.2; `npm install typescript` sem pin puxaria a versão errada.
5. **Licenças não-MIT**: `yaml` (ISC) e `@playwright/test` + `@swc/core` (Apache-2.0) exigem entrada própria no inventário futuro.

## 5. Bloqueios identificados (não contornados)

| ID | Bloqueio | Afeta |
|---|---|---|
| B-01 | **parcialmente resolvido** — MySQL 8.4.13 disponível em `127.0.0.1:3307` (D-09 executada pelo usuário). Falta **9.7 LTS** e **8.0.46 legado** para fechar R25 | S01–S04, T02 |
| B-02 | Nenhuma operação GitHub pelo agente; `gh` ausente. Commit e pull request são executados pelo usuário via `gitpr` ao fim de cada tarefa (D-12) | P05, publicação |
| B-03 | appId **definido** (`br.com.natanfiuza.seshatsql`, D-10); publisher fica indefinido porque não haverá certificado no MVP (D-11); `electron-builder.yml` entra em T13 | `electron-builder.yml`, T13 |
| B-04 | **resolvido em 2026-10-29** — `LICENSE` criado com o texto oficial da MPL-2.0 (16.726 bytes, 373 linhas, verificado por seções) | — |

## 6. O que NÃO foi feito na Etapa 0 (antes de T00)

- Nenhum pacote instalado ou atualizado.
- Nenhum `package.json`, lockfile ou código criado.
- Nenhum repositório criado pelo agente, nenhum `git init`, nenhum commit, nenhum push. (O repositório passou a existir durante a sessão por ação externa — ver §0.)
- Nenhuma conexão a banco durante a Etapa 0. Após a entrega, com autorização do usuário, foi executado apenas `SELECT VERSION()` e `SHOW DATABASES` no servidor local — sem DDL, DML ou leitura de dados de usuário.
- Nenhuma configuração global (ExecutionPolicy, npm config) alterada.

## 7. T00 — execução (2026-10-29)

Autorizada pelo usuário na revisão da Etapa 0 ("continue"). Escopo: criar `package.json`, `.npmrc`, `.gitignore` e o lockfile com as versões exatas da matriz. **T01 não foi iniciado.**

| Verificação | Comando | Resultado |
|---|---|---|
| Pré-condições | `node -v`, `npm -v`, `Test-Path` | Node v22.18.0, npm 11.5.2, sem `package.json`/`node_modules`/`.npmrc` |
| Versões existem no registro | `npm view <pkg>@<ver> version` (5 críticos) | 45.1.0, 6.0.0, 8.3.5, 6.0.3, 5.0.5 — todas confirmadas |
| Instalação runtime | `npm install --save-exact` | exit 0 · 64 pacotes |
| Instalação tooling | `npm install --save-dev --save-exact` | exit 0 · 437 adicionados, 2 movidos |
| Árvore instalada | `npm ls --depth=0` | 20 pacotes de topo, todos na versão exata |
| Lockfile | `package-lock.json` | `lockfileVersion 3`, 500 entradas, 8 deps + 12 devDeps na raiz |
| Sincronia | `npm ci --dry-run` | **exit 0** |
| Binário Electron | `node_modules/electron/dist/electron.exe` | presente, 356,8 MB, `process.versions` conforme §3.4 |
| Tamanho instalado | — | 684,4 MB em `node_modules` |

### 7.1 Desvios em relação ao plano aprovado

1. **`electron`, `electron-vite` e `vite` foram para `devDependencies`**, não para `dependencies`. O plano os listava no primeiro comando. Motivo: são exclusivamente de build/runtime empacotado; em `dependencies`, o `electron-builder` os copiaria para o pacote (T13) e o `externalizeDepsPlugin` do electron-vite os marcaria como externos. O npm confirmou a reclassificação do `electron` (`Removing dependencies.electron in favor of devDependencies.electron`). **Nenhuma versão mudou.**
2. `main` foi fixado em `./out/main/index.js` (convenção do electron-vite, ainda não validada em execução — a validação é T01).
3. `version` ficou `0.0.0` (placeholder) e `author` foi omitido: nenhum dos dois foi decidido pelo usuário e `author` alimenta o publisher do electron-builder, que depende de B-03/T13.

### 7.2 Inventário de licenças do que está instalado

| Licença | Pacotes |
|---|---|
| MIT | 361 |
| ISC | 45 |
| Apache-2.0 | 27 |
| BSD-2-Clause | 12 |
| BSD-3-Clause | 11 |
| BlueOak-1.0.0 | 8 |
| MPL-2.0 | 2 (`lightningcss`, `lightningcss-win32-x64-msvc`) |
| MPL-2.0 \|\| Apache-2.0 | 1 (`dompurify`) |
| CC-BY-4.0 | 1 (`caniuse-lite`) |
| Python-2.0, 0BSD, WTFPL (e variantes OR) | 4 |

- **Nenhuma licença GPL/AGPL/LGPL/CC-BY-SA/EUPL/CDDL** na árvore instalada — varredura por padrão em todos os `package.json`. Compatível com distribuição sob MPL-2.0.
- 25 entradas do lockfile não têm campo `license` legível **porque não são instaladas nesta plataforma** (bindings de `rolldown`/`lightningcss` para darwin/linux/android, `fsevents`). Nenhum pacote efetivamente instalado carece de declaração.
- `dompurify` entra por `monaco-editor` e é empacotado no renderer: **D-13 — exercer a opção Apache-2.0**, evitando obrigação de liberar fonte de arquivo MPL no bundle.
- `lightningcss` vem de `vite` e é só de build: não é distribuído no aplicativo.
- `caniuse-lite` (CC-BY-4.0) é dado de build via `browserslist`, não distribuído; se isso mudar, exige atribuição em `THIRD-PARTY-NOTICES`.

### 7.3 Risco novo de ambiente

- `ELECTRON_RUN_AS_NODE=1` está definido **no processo** herdado por este shell (não em `User` nem em `Machine`). Com ele ativo, `electron.exe` se comporta como Node puro e `--version` imprime a versão do Node (foi o que apareceu: `v24.22.1`), e `electron-vite dev` não abriria janela. Ao rodar T01, executar em shell sem essa variável.
- O postinstall do `electron` não extraiu o binário durante o `npm install` (pasta `dist/` ausente), mas `node node_modules/electron/install.js` o extraiu a partir do cache com exit 0. Registrar como peculiaridade do ambiente; se reaparecer em `npm ci`, repetir esse passo.

## 7. Riscos que seguem para T01

1. electron-vite 6.0.0 tem ~2 semanas de vida — validar `npm ci` + `dev` antes de qualquer funcionalidade.
2. Electron 45 removeu shims de Node no preload sandboxed (`Buffer`, `events`, `timers`, `url`, `setImmediate`) — o preload deve usar apenas `contextBridge`/`ipcRenderer`.
3. electron-builder 26 não declara suporte a Electron 45.
4. Monaco workers + CSP sob Vite 8/rolldown ainda não demonstrados (gate S05).

## 8. T01 — scaffold Electron/Vue/TS (2026-10-29)

Autorizado pelo usuário na revisão de T00 ("continue"). Escopo: configuração, scaffold mínimo e scripts. **Nenhuma funcionalidade de produto** foi implementada — sem banco, sem IPC de consulta, sem Monaco, sem grid.

### 8.1 Arquivos criados

| Arquivo | Papel |
|---|---|
| `electron.vite.config.ts` | `externalizeDepsPlugin` em main/preload; plugin Vue no renderer; layout padrão (`src/main`, `src/preload`, `src/renderer`) |
| `tsconfig.json` / `tsconfig.node.json` / `tsconfig.web.json` | dois projetos separados; `typecheck` usa `-p` explícito (nunca `tsc -b`) |
| `eslint.config.mjs` | flat config: `typescript-eslint` + `eslint-plugin-vue` (`flat/recommended`) |
| `vitest.config.mts` | unitários em `tests/unit`, ambiente `node` |
| `playwright.config.ts` | e2e em `tests/e2e`, 1 worker |
| `src/domain/app-info.ts` | `PRODUCT_NAME` puro, sem Node/Electron/Vue |
| `src/main/index.ts` | `BrowserWindow` com `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`; bloqueia `window.open` e navegação |
| `src/preload/index.ts` + `api.ts` | `contextBridge` expondo apenas `{ productName }` congelado; sem `invoke` genérico |
| `src/renderer/index.html` | CSP provisória + `<div id="app">` |
| `src/renderer/src/{main.ts, env.d.ts, styles/base.css}` | bootstrap do Vue |
| `src/renderer/src/ui/App.vue` | placeholder localizado |
| `src/renderer/src/i18n/**` | `vue-i18n` com os cinco idiomas de R22: en-US (padrão), pt-BR, pt-PT, fr, es |
| `tests/unit/{app-info,i18n-catalog}.test.ts` | smoke de domínio + paridade de chaves entre os catálogos |
| `tests/e2e/app.spec.ts` | abre o app compilado e confere o título |

### 8.2 Decisões tomadas em T01

1. **Main/preload em CJS** — `package.json` sem `"type": "module"`. Verificado no próprio `electron-vite@6.0.0` (`lib-DoUt4oMD.js:348`): `format = pkg.type === 'module' && supportESM() ? 'es' : 'cjs'`. Preload sandboxed do Electron não aceita ESM, então CJS é obrigatório aqui. Confirmado no artefato: `out/main/index.js` e `out/preload/index.js` usam `require`.
2. **`typescript-eslint@8.72.1` adicionado** (MIT; peer `typescript >=4.8.4 <6.1.0`, satisfeito pelo 6.0.3). Motivo: o ESLint 10.13.0 só traz o parser JavaScript (`lib/languages/js`); `eslint .` sobre `.ts` falharia sem esse pacote. **É a única dependência fora da matriz aprovada** — registrada em `docs/03`.
3. **`Messages` é alias de tipo, não `interface`** — o `vue-i18n` exige assinatura de índice implícita, que o TypeScript só infere para aliases. Foi o único erro de tipo encontrado (`TS2769`).
4. **CSP provisória** em `index.html`: `default-src 'self'`, `style-src 'self' 'unsafe-inline'`, `connect-src 'self' ws://localhost:*`. O `ws://localhost:*` existe só para o HMR do dev server; o endurecimento definitivo depende do S05 (Monaco workers).
5. `vitest.config.ts` renomeado para **`.mts`**: o Vite 8 avisou que ESM em arquivo carregado como CJS quebrará com `configLoader: 'native'`.

### 8.3 Verificação executada

| Verificação | Comando | Resultado |
|---|---|---|
| Tipos (main/preload/domínio/testes) | `npm run typecheck:node` | **exit 0** |
| Tipos (renderer/Vue) | `npm run typecheck:web` | **exit 0** (após corrigir §8.2-3) |
| Lint | `npm run lint` | **exit 0** — 0 erros, 0 avisos |
| Unitários | `npm run test` | **2 arquivos, 6 testes, todos passando** |
| Build | `npm run build` | **exit 0** — `out/main/index.js` 1,31 kB · `out/preload/index.js` 0,17 kB · `out/renderer/assets/index-*.js` 287,61 kB · CSS 0,42 kB |
| E2E | `npm run test:e2e` | **1 teste, 1 passed (4,5 s)** — app compilado abre e o `h1` renderiza "SeshatSQL" |
| Dev | `npm run dev` | servidor em `http://localhost:5173`; janela Electron com título **SeshatSQL** aberta; nenhum erro no log; processos encerrados após o teste |
| Lockfile em sincronia | `npm ci --dry-run` | **exit 0** |

`ELECTRON_RUN_AS_NODE` foi removido do ambiente de todas essas execuções (ver §7.3). Sem isso o Electron roda como Node e a janela não abre.

### 8.4 Limitações conhecidas

- `dist:win` **não foi executado** e não pode ser: depende de `electron-builder.yml`, que depende de publisher/B-03 e entra em T13.
- `npm ci` integral **não foi executado**; só `--dry-run`. O lockfile mudou depois da aprovação de T00 (entrada do `typescript-eslint`), então a revisão do lockfile continua pendente.
- Não há IPC de consulta, driver, parser, Monaco nem grid. `preload` expõe apenas uma constante.
- A janela não tem menu customizado, tema nem persistência — T11 e adiante.

## 9. T02 — spike S01 do driver (2026-10-30)

Autorizado pelo usuário ("continue"). Escopo: apenas S01 — comportamento do `mysql2` contra a linha **8.4**. Nada de aplicação, IPC ou feature.

### 9.1 Ambiente do spike

- Servidor: **MySQL Community 8.4.13** (`MySQL Community Server - GPL`) em `127.0.0.1:3307`, instalado pelo usuário.
- Autenticação: `caching_sha2_password` sobre TCP, sem opção extra no cliente.
- Schema descartável criado pelo spike: **`seshat_spike`** (mantido de propósito para reuso em S02). Nenhum schema de usuário foi tocado.
- Processo Node em `America/Sao_Paulo`; sessão em `time_zone = SYSTEM` (`system_time_zone = "Hora oficial do Brasil"`), ou seja, UTC−3.
- Gerador: `spikes/s01-driver.mjs` (fora de `src/`, não entra no build). Grava relatório UTF-8 em arquivo para não depender do console do PowerShell 5.1, que corrompe acentos e emoji.
- Evidência bruta: `docs/spikes/20261029_s01-driver-evidence.md` (6080 caracteres, 11 seções).

### 9.2 O que foi medido (fatos, não documentação)

| Aspecto | Resultado observado |
|---|---|
| BIGINT > 2^53 | padrão: `number 9007199254740992` (perdeu o `3`); com `supportBigNumbers`+`bigNumberStrings`: `"9007199254740993"` |
| DECIMAL(65,30) | string exata nas duas configurações — sem coerção |
| DATETIME / TIMESTAMP / DATE | padrão: `Date` no fuso do processo (`13:45:10` → `16:45:10Z`); com `dateStrings`: literais `"2026-10-29 13:45:10.123456"` / `"2026-10-29"` |
| TIME | string nas duas configurações |
| BLOB / VARBINARY / BIT | `Buffer` nas duas configurações |
| JSON | objeto já desserializado |
| NULL vs `''` vs `0` vs `' '` vs `'NULL'` | todos distinguíveis |
| Unicode | `Olá, 世界 😀 'quote'` íntegro; 17 caracteres, 25 bytes; `acai = açaí` sob `utf8mb4_0900_ai_ci` |
| `CALL` | array de 3: dois conjuntos de linhas + `OkPacket`; parâmetro `OUT` chega em `ok`; `ROW_COUNT()` depois do `CALL` = `-1` |
| Erros | `code`/`errno`/`sqlState`/`sqlMessage` presentes em sintaxe (1064/42000), tabela (1146/42S02), coluna (1054/42S22), duplicidade (1062/23000), FK (1451/23000) e senha inválida (1045/28000) |
| Lote de 3 statements | recusado pelo driver (1064) — `multipleStatements` é `false` por padrão |
| `execute()` com parâmetro numérico grande | mesma perda de precisão na **entrada** (`9007199254740993` → `9007199254740992`) |
| Metadados de coluna | `columnType`, `flags`, `columnLength`, `decimals` disponíveis por coluna em `fields` |

### 9.3 Decisão proposta (ADR 0011)

`docs/adr/0011-driver-mysql.md`, status **proposto** — decisão humana pendente. Propõe `mysql2` 3.24.6 fixo com `supportBigNumbers: true`, `bigNumberStrings: true`, `dateStrings: true`, `multipleStatements: false`. Consequência central: BIGINT/DECIMAL e datas chegam como texto, e o parse/format é nosso.

### 9.4 Riscos e limitações

- Só a linha **8.4** foi medida. Sem ambiente para **9.7 LTS** e **8.0.46** (B-01 parcialmente aberto) — o ADR não pode ser dado como definitivo.
- Não medido em S01 (fica para S02–S04): volume/memória/streaming, cancelamento, estado de transação após falha de rede, permissões.
- O schema `seshat_spike` permanece no servidor; é descartável e contém apenas dados sintéticos. A senha usada veio por variável de ambiente e **não** foi gravada em arquivo algum (verificado).
- `npm run lint` passou a cobrir `spikes/` e acusou 5 variáveis não usadas no gerador. Foram corrigidas, o lint voltou a **exit 0** e o spike foi reexecutado com a versão final (exit 0; saída idêntica, 6080 caracteres — só mudou o instante da execução).

## 10. T02 — spike S02 de volume/contagem (2026-10-30)

Autorizado pelo usuário ("continue"). Escopo: volume, memória, streaming/drain, contagem exata e tamanho de célula — sem cancelamento (S04) e sem parser (S03).

### 10.1 Ambiente e método

- Mesmo servidor do S01: MySQL **8.4.13** em `127.0.0.1:3307`, schema descartável `seshat_spike`.
- Gerador: `spikes/s02-volume.mjs`, executado com `node --expose-gc` para medir memória **após GC forçado**.
- Dados: tabela sintética `vol` com **2.000.000** de linhas (BIGINT PK, INT, VARCHAR(120)), 130,7 MB em disco. A geração é reaproveitada quando a tabela já tem o total pedido; variável `SESHAT_S02_ROWS` reduz o volume em testes.
- Evidência: `docs/spikes/20261029_s02-volume-evidence.md`.

### 10.2 Resultados medidos

| Medida | Resultado |
|---|---|
| Inserção de 2.000.000 de linhas (10 lotes de 200 mil) | 32,1 s no total |
| Bufferizar 10 mil / 100 mil / 300 mil linhas | 28 / 88 / 255 ms · Δheap 1,4 / 13,2 / 39,6 MB |
| Custo por linha retida (bufferizado) | **~130–196 B** |
| Streaming drenando 2.000.000 de linhas | **1,57 s** · primeira linha em 1 ms · Δheap 0,2 MB · pico de rss 121 MB (lixo de GC) |
| Streaming retendo 1.000 e drenando o resto | **1,30 s** · Δheap 0,2 MB |
| Pausar o stream em 1.000 linhas | 9 ms · rss 116 MB com backpressure ativo |
| `destroy()` no stream e reutilizar a conexão | `SELECT 1` e `COUNT(*)` corretos — **não é garantia contratual**, é comportamento observado do driver |
| `COUNT(*)` em 2 M linhas | 64–182 ms |
| `COUNT(*)` com filtro não indexado | 447–561 ms |
| `LIMIT 1001` | 2 ms |
| Linha larga: 40 colunas, 10 mil linhas | 3.604 B retidos por linha (payload 2.360 B, overhead 1,53×) |
| BLOB de 8 MB | fetch em 21–27 ms |
| BLOB de 70 MB | `ER_NET_PACKET_TOO_LARGE`; servidor encerra a conexão (`ECONNRESET`) |

O aviso `Warning: got packets out of order` no stderr foi **reproduzido isoladamente** e vem apenas da conexão do teste de 70 MB, encerrada pelo servidor — não da conexão principal nem do `destroy()`.

### 10.3 Consequência para o desenho

O que protege a memória não é o número de linhas, é o **total de bytes retidos**: 1.000 linhas largas custam ~3,6 MB, mas 1.000 células de 1 MB custariam 1 GB. Daí o ADR 0012 propor orçamento de **64 MB retidos por conjunto** além do teto de 1.000 linhas.

### 10.4 Decisão proposta (ADR 0012)

`docs/adr/0012-limites-p04.md` — status **proposto**. Valores: 1.000 linhas, 64 MB por conjunto, texto 64 KB por célula, BLOB não renderizado acima de 1 MB (carregado sob demanda até 16 MB), SQL de 1 MB por aba, conexão com timeout de 10 s, execução sem timeout automático, contagem por consulta separada e cancelável.

### 10.5 Limitações

- Só a linha 8.4 foi medida; 9.7 LTS e 8.0.46 continuam sem ambiente (B-01).
- Cancelamento, `KILL QUERY` e estado de transação após cancelamento **não** foram testados — S04.
- Os números de tempo dependem do buffer pool (128 MB) e do disco da máquina; servem como ordem de grandeza, não como SLAs.
- Nenhum valor proposto foi aplicado em código.
