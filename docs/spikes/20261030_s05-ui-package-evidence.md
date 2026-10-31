# Spike S05 — UI, workers/CSP, grid, temas, idiomas e pacote

Execução: 2026-10-30, entre 20:20 e 20:28 (horário local, UTC−3). Comandos e saídas abaixo foram capturados nesta máquina (Windows 11 Pro 10.0.26300, x64).

Escopo medido: renderer empacotado servido por `app://`, CSP estrita, Monaco com worker e NLS, AG Grid Community com cópia, temas claro/escuro, cinco idiomas, pacote `win-unpacked` e ausência de requisições externas.

## 1. Versões usadas

| Componente | Versão |
|---|---|
| Node (build/testes) | 22.18.0 |
| Electron | 45.1.0 |
| electron-vite / Vite | 6.0.0 / 8.3.5 |
| electron-builder | 26.18.0 |
| Monaco Editor | 0.57.0 |
| AG Grid Community / ag-grid-vue3 | 36.2.0 / 36.2.0 |
| Vue / vue-i18n | 3.5.44 / 11.4.16 |
| Vitest / Playwright | 5.0.5 / 1.64.1 |

Risco aberto do plano — “electron-builder 26 incompatível com Electron 45” — **não se confirmou**: empacotou e executou (seção 6).

## 2. Build de produção (`npm run build`)

```
out/main/index.js                               6.99 kB
out/preload/index.js                            0.17 kB
out/renderer/index.html                         0.70 kB
out/renderer/assets/editor.worker-*.js        597.84 kB
out/renderer/assets/index-*.css                 4.54 kB
out/renderer/assets/editor-*.css              132.60 kB
out/renderer/assets/_.contribution-*.js         1.49 kB
out/renderer/assets/sql-*.js                   13.04 kB
out/renderer/assets/mysql-*.js                 14.16 kB
out/renderer/assets/es-*.js                   139.43 kB
out/renderer/assets/fr-*.js                   148.23 kB
out/renderer/assets/index-*.js              2,371.99 kB
out/renderer/assets/editor.api-*.js         4,966.00 kB
```

Medida adicional de transferência (gzip -c | wc -c):

- `index-*.js`: **542.141 bytes** (≈ 529 kB)
- `editor.api-*.js`: **1.006.944 bytes** (≈ 983 kB)

O `editor.api` é carregado sob demanda pelo bootstrap do Monaco; o `editor.worker` é o módulo worker empacotado pelo Vite (`?worker`).

## 3. CSP efetiva

### 3.1 Produção — header HTTP no `app://` (medido no pacote)

O teste Playwright do pacote faz `fetch('app://seshat/index.html')` na página e lê o header:

```ts
const csp = await page.evaluate(async () => {
  const response = await fetch('app://seshat/index.html')
  return response.headers.get('content-security-policy')
})
```

Resultado (mesma string do `src/main/protocol/csp.ts` e da meta do HTML compilado):

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'
```

- sem `ws:`, sem `blob:`, sem `'unsafe-eval'`; `script-src` não relaxado.
- `style-src 'unsafe-inline'` permanece porque Monaco e AG Grid injetam folhas de estilo em tempo de execução (risco residual registrado no ADR 0015).
- O `out/renderer/index.html` gerado pelo build contém exatamente a mesma política na meta.

### 3.2 Desenvolvimento — plugin `transformIndexHtml` (medido)

`npm run dev` e leitura de `http://localhost:5173/`:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws://localhost:*; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'
```

Diferença única: `connect-src` ganha `ws://localhost:*`. O plugin tem `apply: 'serve'`, então o build de produção nunca contém `ws:`.

Nota de ambiente: o primeiro `npm run dev` falhou dentro deste shell porque `ELECTRON_RUN_AS_NODE=1` estava definido (Electron iniciou como Node puro e `protocol` ficou indefinido). Com a variável removida, o servidor e o app subiram normalmente. É a mesma armadilha tratada em `tests/e2e/launch.ts`; não é defeito do aplicativo.

## 4. Monaco — NLS, worker e modelo

### 4.1 Cobertura de tradução do pacote 0.57.0 (medido)

Lendo `node_modules/monaco-editor/esm/vs/nls/lang/*.js` e inspecionando `_VSCODE_NLS_MESSAGES`:

| Pacote | Entradas | Traduzidas | Nulas |
|---|---|---|---|
| `pt-br.js` | 2.153 | **0** | **2.153** |
| `fr.js` | 2.153 | 2.138 | 15 |
| `es.js` | 2.153 | 2.138 | 15 |

Não existe `pt-pt.js`. Por isso o bootstrap só importa `nls/lang/es` e `nls/lang/fr`; para `pt-BR`, `pt-PT` e `en-US` o Monaco fica em inglês (limitação aceita em D-S05/S06-04, registrada no ADR 0015 e no aceite A15).

O NLS é escolhido na inicialização: `loadMonaco(locale)` guarda a primeira promessa (`pending ??= bootstrap(locale)`). Trocar o idioma com o editor já aberto **não** reescreve o NLS do Monaco; a UI própria e o AG Grid trocam ao vivo.

### 4.2 Worker sob CSP estrita

`monaco.ts` faz `import EditorWorker from 'monaco-editor/editor/editor.worker?worker'` e define:

```ts
globalThis.MonacoEnvironment = {
  getWorker: () => new EditorWorker()
}
```

Evidência de que o worker roda sem `blob:`:

- o teste e2e digita ` -- worker ok` no editor e o texto aparece;
- o console da página não registra erro de worker nem de CSP (asserção `expect(consoleErrors).toEqual([])` no último teste da suíte);
- o log de requisições do pacote mostra apenas `app://` (seção 7); nenhum `blob:` foi necessário.

### 4.3 Modelo e ciclo de vida

O e2e verifica `data-model-uri="inmemory://seshat/tab/s05-lab"` e `data-language="mysql"` no host do editor. O teste de componente cobre criação do modelo, envio de valor, `onDidChangeModelContent`, ida e volta de `getViewState`/`setViewState` e `dispose()` de editor e modelo.

## 5. AG Grid Community 36.2.0 — módulos, idioma e cópia

### 5.1 Registro de módulos (achado que causou falha real)

No 36.2.0 o import raiz **não** registra os módulos de recurso; só `CommunityCoreModule` é registrado na criação do grid. Sem registro explícito, o console mostra `AG Grid: error #200 … missingModule` para:

- `Locale` → `localeText` ignorado (textos saíam em inglês);
- `RowSelection` → `enableClickSelection` ignorado;
- `SharedRowSelection` → `api.getSelectedRows` indefinido, causando `TypeError: Cannot read properties of undefined (reading 'length')` no `Ctrl+C`;
- tema via `themeQuartz` também não é aplicado.

Correção medida e aplicada em `src/renderer/src/grid/grid-setup.ts`, importado como efeito colateral por `ResultGrid.vue`:

```ts
ModuleRegistry.registerModules([AllCommunityModule])
```

Depois disso a suíte e2e passou a terminar com **zero** erros de console e de página, e a asserção final garante isso para toda a execução. Custo registrado: o bundle do renderer subiu para 2,37 MB (sem minificar), pois o pacote inteiro do Community entra no chunk.

### 5.2 Idioma do grid

`localeText` é opção **inicial** no AG Grid (`INITIAL_GRID_OPTION_KEYS`): `setGridOption('localeText', …)` não é aceito pelos tipos. Solução: o `AgGridVue` tem `:key="locale"`, então trocar o idioma remonta o grid. O teste de componente confirma duas montagens e o texto pt-BR; o e2e confirma o francês ao vivo no cabeçalho:

- texto localizado anunciado em `.ag-aria-description-container` (região viva) após clicar no cabeçalho;
- valor medido: `Appuyez sur Entrée pour trier` (chave `grid.ariaSortableColumn`).

`GRID_LOCALE_KEYS` cobre apenas `noRowsToShow` e `ariaSortableColumn`, com teste de paridade nos cinco catálogos; o restante cai no inglês nativo do AG Grid (D-S05/S06-14).

### 5.3 Cópia sem recurso Enterprise

Ctrl+C próprio em `ResultGrid.vue` + `copy.ts`:

- com linhas selecionadas → TSV com cabeçalhos;
- sem seleção, com célula focada → valor da célula;
- seleção de texto do navegador → deixada ao navegador;
- NULL vira campo vazio na cópia e `NULL` na exibição;
- campos com tab, quebra de linha ou aspas são citados (subconjunto de RFC 4180 aceito por planilhas).

Medição no pacote: `clipboard.readText()` no processo main devolveu

```
"id\tfull_name\tstatus\tnotes\tamount\r\n1\tAna Silva\tactive\t\t1250.5"
```

O serializador emite LF; o clipboard do Windows devolve CRLF. O teste e2e fixa esse comportamento de plataforma (comentário no teste). Nenhum `ClipboardModule`/range Enterprise foi usado.

## 6. Pacote Windows (`npm run pack:win`)

```
electron-builder version=26.18.0 electron=45.1.0 appOutDir=dist\win-unpacked
skipped dependencies rebuild reason=npmRebuild is set to false
default Electron icon is used reason=application icon is not set
no code signing certificate configured, signing is skipped
```

Resultado:

| Medida | Antes de excluir `node_modules` | Depois |
|---|---|---|
| `resources/app.asar` | 159.776.588 bytes (159,8 MB) | **8.402.802 bytes (8,4 MB)** |
| `dist/win-unpacked` | 510 MB | **365 MB** |

O `electron-builder.yml` agora exclui `node_modules/**/*`: renderer e main são empacotados pelo Vite, portanto as bibliotecas já estão dentro de `out/`. Conteúdo do asar verificado com `npx asar list`: apenas `out/main/index.js`, `out/preload/index.js`, `out/renderer/**` e `package.json`.

Pendências conhecidas do pacote nesta etapa: ícone padrão do Electron, sem assinatura, sem NSIS (T13).

## 7. Offline — log de requisições do pacote

Execução do `dist/win-unpacked/SeshatSQL.exe` com `SESHAT_REQUEST_LOG` apontando para um arquivo temporário, 8 s de janela aberta (o log é só URL e método):

```
2026-10-30T23:25:23.932Z GET app://seshat/index.html
2026-10-30T23:25:24.257Z GET app://seshat/assets/index-BwpnRPBA.js
2026-10-30T23:25:24.258Z GET app://seshat/assets/index-NBsDmoVy.css
2026-10-30T23:25:24.422Z GET app://seshat/assets/editor.api-BVWz_-MA.js
2026-10-30T23:25:24.422Z GET app://seshat/assets/editor-CXfYqUZ6.css
2026-10-30T23:25:25.220Z GET app://seshat/assets/register-B0TPLAMD.js
2026-10-30T23:25:25.220Z GET app://seshat/assets/_.contribution-XuGgYKkH.js
2026-10-30T23:25:25.235Z GET app://seshat/assets/register-DYoN2xQR.js
2026-10-30T23:25:25.474Z GET app://seshat/assets/mysql-BOwslTTg.js
---- total requests: 9
```

Nenhuma requisição fora de `app://seshat/`. O e2e repete a checagem automaticamente (todas as linhas do log precisam casar `^app://seshat/`) e o teste do pacote faz o mesmo com `SESHAT_REQUEST_LOG`.

A checagem com a rede fisicamente desligada continua sendo **manual, com o usuário** — não foi executada nesta máquina por este agente.

## 8. Testes executados

| Comando | Resultado |
|---|---|
| `npm run typecheck` | sem erros (`tsc` + `vue-tsc`) |
| `npm run lint` | sem avisos (`eslint .`) |
| `npm test` | **12 arquivos, 67 testes, todos passando** (8,60 s) |
| `npm run build` | sucesso (seção 2) |
| `npm run test:e2e` | **7 testes, 7 passando** (9,4 s), incluindo o pacote |
| `npm run pack:win` | sucesso (seção 6) |

O e2e executa o app compilado (`electron .`) e o `dist/win-unpacked/SeshatSQL.exe`, sem servidor dev. `tests/e2e/launch.ts` remove `ELECTRON_RUN_AS_NODE` do ambiente antes de lançar.

## 9. O que não foi medido

- Rede desligada de verdade — pendente de checagem manual do usuário.
- DPAPI, YAML, flush e recuperação — pertencem ao S06.
- NSIS, assinatura de código e ícone customizado — T13.
- DPAPI entre usuários/máquinas — sem segunda conta nesta máquina.
- jsdom não cobre Monaco/grid reais; esses caminhos são cobertos só pelo Playwright.
