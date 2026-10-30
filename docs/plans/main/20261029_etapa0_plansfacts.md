# Plano — Etapa 0 (preparação técnica controlada)
Data: 2026-10-29 · Branch: `main` · Pasta: `main` (movido de `local` após a criação do repositório) · Status: **T00, T01 e S01 executados** — typecheck, lint, unitários, build, e2e e dev verificados com exit 0; lockfile **aguardando aprovação** (mudou com `typescript-eslint`); S01 medido contra MySQL 8.4.13 (ADR 0011 proposto); S02–S04 **não** iniciados

> **Nota:** o diretório virou repositório Git durante a sessão (commit `a44d40b`, branch `main`, remoto `natanfiuza/seshatsql`, sincronizado), sem ação do agente. Ver §0 do survey.

## Contexto

O workspace contém apenas documentação — sem código, `package.json`, lockfile ou `.git`. A Etapa 0 (`docs/plano-etapa0.md`) pede inventário do ambiente, matriz de versões/licenças com fontes, riscos, plano exato de scaffold e comandos propostos, **sem gerar aplicação, instalar dependências, criar repositório ou acessar bancos**. A execução (T00/T01) só começa após nova aprovação.

Marcação: **[V]** verificado nesta sessão · **[P]** proposto · **[B]** bloqueado.

## Decisões aprovadas

| # | Decisão | Efeito |
|---|---|---|
| D-01 | Node de build **22.18.0**; `engines >=22.12.0` | Nenhuma instalação; 24.22.2 vira alvo futuro |
| D-02 | **electron-vite 6.0.0 + Vite 8.3.5** | Substitui explicitamente o 5.0.0 da baseline |
| D-03 | **TypeScript 6.0.3** | Evita a API instável do TS 7 (Go) |
| D-04 | Scaffold **na raiz, sem `git init`** | Decisão tomada antes de o repositório existir; o agente não inicializou Git. Ver nota do cabeçalho |
| D-05 | Camadas **na raiz** (`src/domain`, `src/application`, `src/infrastructure`) + `main/preload/renderer` finos | Separação exigida sem duplicar código |
| D-06 | MySQL descartável **adiado para T02**, bloqueio registrado | Etapa 0 não instala nada |
| D-07 | Docs da sessão em `docs/plans/local/` e `docs/survey/` | `local` no lugar de `{branch}` |
| D-08 | Atualizar `docs/03` e `docs/08` com as versões decididas | Registra a divergência sem apagar o texto anterior |
| D-09 | MySQL 8.4 LTS na porta **3307** (o MariaDB local em 3306 não serve) | Instalação pendente de autorização de execução |
| D-10 | appId **`br.com.natanfiuza.seshatsql`** | Usado no `electron-builder.yml` em T13 |
| D-11 | **Sem certificado** de assinatura no MVP | Publisher indefinido; aviso do SmartScreen documentado |
| D-12 | Agente não faz commit/push nem operação GitHub; pedir `gitpr` ao fim de cada tarefa | Registrado em `CLAUDE.md` |
| D-13 | `dompurify` usado sob **Apache-2.0** (é `MPL-2.0 OR Apache-2.0`) | Evita obrigação MPL sobre o bundle do renderer |
| D-14 | `electron`, `electron-vite` e `vite` em **`devDependencies`** | Ferramentas de build não entram no pacote do `electron-builder`; desvio do plano registrado em §7.1 do survey |

## Matriz a congelar em T00 **[V]**

| Pacote | Versão | Licença |
|---|---|---|
| electron | 45.1.0 | MIT |
| electron-vite | 6.0.0 | MIT |
| vite | 8.3.5 | MIT |
| vue | 3.5.44 | MIT |
| @vitejs/plugin-vue | 6.0.10 | MIT |
| typescript | 6.0.3 | Apache-2.0 |
| vue-tsc | 3.3.14 | MIT |
| @types/node | 24.19.2 | MIT |
| mysql2 | 3.24.6 | MIT |
| monaco-editor | 0.57.0 | MIT |
| ag-grid-community / ag-grid-vue3 | 36.2.0 | MIT |
| vue-i18n | 11.4.16 | MIT |
| zod | 4.6.7 | MIT |
| yaml | 2.9.1 | **ISC** |
| vitest | 5.0.5 | MIT |
| @playwright/test | 1.64.1 | **Apache-2.0** |
| electron-builder | 26.18.0 | MIT |
| eslint | 10.13.0 | MIT |
| eslint-plugin-vue | 10.12.0 | MIT |

## Plano de scaffold **[P]**

```
/
├─ package.json            # versões exatas; "engines": { "node": ">=22.12.0" }
├─ package-lock.json       # gerado em T00, versionado
├─ .npmrc                  # save-exact=true, engine-strict=true
├─ .gitignore              # node_modules/, out/, dist/, *.log
├─ electron.vite.config.ts
├─ tsconfig.json / tsconfig.node.json / tsconfig.web.json
├─ docs/
├─ src/
│  ├─ domain/              # TS puro: perfis, abas, snapshot, outcomes
│  ├─ application/         # casos de uso e contratos de IPC tipados
│  ├─ infrastructure/      # mysql2, fs/YAML, safeStorage, logging (main)
│  ├─ main/                # janela, handlers IPC, validação/autorização
│  ├─ preload/             # contextBridge mínimo, métodos nomeados
│  └─ renderer/
│     ├─ index.html
│     └─ src/{ui,i18n}/
└─ tests/{unit,e2e}/
```

`electron-builder.yml` **não** entra em T01: o appId está definido (`br.com.natanfiuza.seshatsql`, D-10), mas publisher e empacotamento ficam para T13 (D-11).

Scripts de T01: `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `dist:win`.
Segurança: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, preload sem `invoke` genérico, CSP sem relaxamento global.
Lockfile: versionado; `npm ci` só após aprovação; versões exatas; `engine-strict=true`; sem atualização automática.

## Comandos propostos (não executados) **[P]**

```powershell
# T00 — após aprovação da matriz
npm.cmd install --save-exact electron@45.1.0 electron-vite@6.0.0 vite@8.3.5 vue@3.5.44 `
  mysql2@3.24.6 monaco-editor@0.57.0 ag-grid-community@36.2.0 ag-grid-vue3@36.2.0 `
  vue-i18n@11.4.16 zod@4.6.7 yaml@2.9.1
npm.cmd install --save-dev --save-exact typescript@6.0.3 vue-tsc@3.3.14 @vitejs/plugin-vue@6.0.10 `
  @types/node@24.19.2 vitest@5.0.5 @playwright/test@1.64.1 electron-builder@26.18.0 `
  eslint@10.13.0 eslint-plugin-vue@10.12.0

# T01 — após lockfile aprovado
npm.cmd ci ; npm.cmd run typecheck ; npm.cmd run lint ; npm.cmd run test ; npm.cmd run dev
```

Inventário de licenças: `npm ls --json` + campos do registro — **sem** adicionar ferramenta nova.

## Critérios de aceite do T00 — resultado

| # | Critério | Resultado |
|---|---|---|
| 1 | `package.json` com versões exatas e `engines` | **atendido** — 20 pacotes de topo, todos com versão exata; `engines.node >=22.12.0`; `.npmrc` com `save-exact=true` e `engine-strict=true` |
| 2 | `package-lock.json` gerado e revisado | **gerado** (`lockfileVersion 3`, 500 entradas) — **revisão do usuário pendente** |
| 3 | `npm ls` sem conflito de peer | **atendido** — exit 0, nenhum `invalid`/`UNMET` |
| 4 | Inventário de licenças com transitivas | **atendido** — survey §7.2; zero GPL/AGPL/LGPL; MPL só em `lightningcss`, `lightningcss-win32-x64-msvc` e `dompurify` |
| 5 | Nenhum segredo em arquivo versionado | **atendido** — única credencial conhecida não aparece em nenhum arquivo; não há `.env` |

Aceite completo exige a revisão do lockfile pelo usuário (critério 2). **T01 depende dela.**

Arquivos criados em T00: `package.json`, `package-lock.json`, `.npmrc`, `.gitignore`. `node_modules/` está no `.gitignore` e não deve ser versionado.

## T01 — scaffold (executado em 2026-10-29)

Criados: `electron.vite.config.ts`; `tsconfig.json`/`tsconfig.node.json`/`tsconfig.web.json`; `eslint.config.mjs`; `vitest.config.mts`; `playwright.config.ts`; `src/domain`, `src/main`, `src/preload`, `src/renderer`; `tests/unit` e `tests/e2e`.

| Critério de saída (docs/06) | Resultado |
|---|---|
| janela local abre | **atendido** — `npm run dev` abriu janela com título `SeshatSQL`; e2e abriu o app compilado |
| typecheck/test/lint básicos | **atendido** — os três com exit 0; 6 testes unitários + 1 e2e passando |
| sem API privilegiada ampla | **atendido** — preload expõe só `{ productName }` congelado; `contextIsolation` e `sandbox` ligados, `nodeIntegration` desligado; `window.open` e navegação bloqueados |

Desvios e decisões de T01 (detalhe no §8 do survey): main/preload em **CJS** porque o preload sandboxed não aceita ESM; **`typescript-eslint@8.72.1`** adicionado (o ESLint 10 não traz parser de TypeScript); CSP provisória pendente do S05.

**Não executado:** `npm run dist:win` (depende de `electron-builder.yml` → T13); `npm ci` integral (só `--dry-run`).

## T02 / S01 — spike do driver (executado em 2026-10-30)

| Item | Resultado |
|---|---|
| Gerador | `spikes/s01-driver.mjs` — fora de `src/`, não entra no build |
| Servidor | MySQL **8.4.13** em `127.0.0.1:3307`, `caching_sha2_password`, sessão `SYSTEM` (UTC−3) |
| Schema | `seshat_spike` (descartável, dados sintéticos, mantido para S02) |
| Evidência | `docs/spikes/20261029_s01-driver-evidence.md` — 11 seções, 6080 caracteres |
| Execução | exit 0; nenhuma exceção não tratada; senha só por variável de ambiente |
| Decisão proposta | `docs/adr/0011-driver-mysql.md` — status **proposto**, decisão humana pendente |

Fatos que mudam o desenho da camada de infraestrutura:

1. **BIGINT perde precisão por padrão** → exige `supportBigNumbers` + `bigNumberStrings`; o mesmo vale para parâmetros de `execute()`.
2. **Datas viram `Date` no fuso do processo** → exige `dateStrings: true` para não reinterpretar o valor do servidor.
3. **`multipleStatements` é `false` por padrão** — coerente com a regra de snapshot; deve ser fixado explicitamente para não ser afrouxado depois.
4. **`CALL` devolve N conjuntos + `OkPacket`** e `ROW_COUNT()` = `-1` — a contagem da confirmação de execução não pode vir daí.
5. Protocolo de erro é suficiente (`code`/`errno`/`sqlState`) para mapear mensagens, inclusive acesso negado (1045).

**Não medido em S01** (fica para S02–S04): volume/memória/streaming, cancelamento, estado de transação após falha de rede, permissões. S01 cobre só a linha 8.4 — 9.7 LTS e 8.0.46 seguem sem ambiente.

## Bloqueios **[B]**

- **B-01** **MySQL Community 8.4.13** disponível em `127.0.0.1:3307` (D-09 executada pelo usuário); S01 já medido nessa linha. Faltam **9.7 LTS** e **8.0.46 legado** para fechar R25; o ADR 0011 não pode ser aceito como definitivo antes disso.
- **B-02** Nenhuma operação GitHub pelo agente; commit e PR executados pelo usuário via `gitpr` ao fim de cada tarefa (D-12) → P05, publicação.
- **B-03** appId definido (D-10); publisher indefinido porque não haverá certificado no MVP (D-11) → `electron-builder.yml`, T13.
- **B-04** ~~`LICENSE` ausente~~ — **resolvido**: `LICENSE` com texto oficial MPL-2.0 criado em 2026-10-29.

## Verificação

| Etapa | Comando | Evidência |
|---|---|---|
| Lockfile sincronizado com `package.json` | `npm.cmd ci --dry-run` | **exit 0** (executado em 2026-10-29) |
| Lockfile reprodutível | `npm.cmd ci` | pendente — só após aprovação do lockfile |
| Tipos | `npm.cmd run typecheck` | exit 0 |
| Unitários | `npm.cmd run test` | relatório Vitest |
| App abre | `npm.cmd run dev` | janela Electron sem servidor externo |
| Build | `npm.cmd run build` | `out/` gerado |
| Pacote | `npm.cmd run dist:win` | NSIS x64 (T13) |
