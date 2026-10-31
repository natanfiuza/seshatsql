# ADR 0015 — Renderer empacotado, CSP, workers, grid, temas e idiomas (S05)

Status: **proposto**. Sustentado por medição real em `docs/spikes/20261030_s05-ui-package-evidence.md` (build, pacote `win-unpacked`, e2e no app compilado e no executável, log de requisições). Não substitui a revisão humana nem altera os requisitos das rodadas 1–6.

## Contexto
O gate do S05 exige um pacote Windows que abra editor e grid **sem servidor dev** e **sem rede**, com workers do Monaco sob CSP estrita, cópia de dados com o AG Grid Community, temas claro/escuro, cinco idiomas e evidência de que nenhuma requisição externa acontece. O scaffold do T01 não tinha nada disso: sem `app://`, sem CSP, sem Monaco, sem grid, sem tema, sem catálogos completos e sem empacotamento.

As decisões abaixo foram tomadas antes da implementação (sessão de grill, D-S05/S06-01 a 21, em `docs/plans/develop_natan/20261030_s05_s06_ui_persistencia_plansfacts.md`) e medidas depois. Fatos que mudaram o plano original estão marcados como **medido**.

## Decisões

### D-S05-01 — Renderer servido por `app://seshat`
| # | Regra | Por quê |
|---|---|---|
| 1 | Scheme `app` registrado como privilegiado (`standard, secure, supportFetchAPI, corsEnabled, stream`) **antes** de `app.whenReady()` | sem `standard`/`secure` não há módulos ES, workers nem `fetch` confiável |
| 2 | `protocol.handle('app')` serve **somente** arquivos sob `out/renderer` (dev) ou o mesmo caminho relativo dentro do asar (pacote) | um servidor local seria superfície extra e exigiria rede |
| 3 | Apenas `GET`/`HEAD`; host diferente de `seshat`, caminho não resolvido, `..`, segments codificados perigosos, NUL, barras invertidas e leitura falha → **404**; método → **405** | path traversal e métodos não previstos ficam de fora |
| 4 | MIME por extensão, `x-content-type-options: nosniff`, `/` → `index.html` | evita sniffing e mantém URLs estáveis |
| 5 | CSP vai como **header** nas respostas HTML (além da meta do `index.html`) | o header vale mesmo se a meta for removida; a meta documenta a política no HTML |

### D-S05-02 — CSP estrita, sem afrouxar script
| # | Regra | Por quê |
|---|---|---|
| 1 | Produção: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'` | nada de script inline, remoto ou `eval`; nenhum `blob:` |
| 2 | `style-src 'unsafe-inline'` é **residual aceito**: Monaco e AG Grid injetam CSS em tempo de execução | remover exigiria nonce/hash por folha gerada pela biblioteca; risco menor que o de script |
| 3 | Dev adiciona **apenas** `ws://localhost:*` em `connect-src`, via plugin Vite com `apply: 'serve'` | HMR funciona no desenvolvimento sem que `ws:` chegue ao pacote |
| 4 | O plugin falha o build de dev se a meta CSP não existir no HTML | evita servir sem política por esquecimento |

### D-S05-03 — Monaco: NLS na partida, worker como módulo
| # | Regra | Por quê |
|---|---|---|
| 1 | NLS importado **antes** do editor: `nls/lang/es` e `nls/lang/fr` somente | **medido**: `pt-br.js` tem 2.153 entradas, **todas `null`**, e não existe `pt-pt.js`; carregar o pacote pt-br não traduziria nada |
| 2 | `pt-BR`, `pt-PT` e `en-US` mantêm o chrome do Monaco em inglês; UI própria e grid são traduzidos | limitação aceita em D-S05/S06-04 e registrada no aceite A15 |
| 3 | Worker via `monaco-editor/editor/editor.worker?worker` + `MonacoEnvironment.getWorker` | o caminho padrão do Monaco cria worker `blob:`; o override mantém `worker-src 'self'` |
| 4 | Imports mínimos: `editor/editor.api` + `languages/definitions/sql` + `languages/definitions/mysql` | evita o `editor.main` completo e deixa o chunk do Monaco sob demanda (≈ 4,97 MB, gzip ≈ 983 kB) |
| 5 | Modelo `inmemory://seshat/tab/<id>`, linguagem `mysql`, `dispose()` de editor e modelo | modelo identificável por URI e sem vazamento entre montagens |
| 6 | O idioma do Monaco é aplicado **na inicialização**; trocar o idioma com o editor aberto não reescreve o NLS | o NLS do Monaco é global e carregado uma vez; a UI avisa que a troca vale na próxima abertura |

### D-S05-04 — AG Grid Community: registro explícito, idioma por remontagem, cópia própria
| # | Regra | Por quê |
|---|---|---|
| 1 | `ModuleRegistry.registerModules([AllCommunityModule])` uma vez, num módulo de efeito colateral importado pelo `ResultGrid` | **medido**: no 36.2.0 o import raiz registra só `CommunityCoreModule`; sem isso, `Locale`, `RowSelection` e o tema falham com `error #200` e a cópia de linhas quebra com `TypeError` |
| 2 | Somente módulos Community; nenhum recurso Enterprise | limite do MVP |
| 3 | `localeText` é opção **inicial**: trocar idioma remonta o grid (`:key="locale"`) | `setGridOption('localeText', …)` não é aceito pelos tipos do AG Grid |
| 4 | A remontagem **perde ordenação, filtro e seleção** correntes; isso é aceito e documentado no componente | alternativa (recriar o grid internamente) teria o mesmo efeito; a troca de idioma é ação rara |
| 5 | Apenas as chaves usadas são traduzidas (`noRowsToShow`, `ariaSortableColumn`), com teste de paridade nos cinco catálogos; o resto cai no inglês do AG Grid | traduzir 1.000 chaves sem necessidade criaria manutenção falsa |
| 6 | Ctrl+C próprio: linhas selecionadas → TSV com cabeçalhos; sem seleção → célula focada; seleção de texto do navegador tem prioridade | o clipboard/range do AG Grid é Enterprise |
| 7 | Na cópia, NULL vira campo vazio; na exibição, `NULL`; tab/quebra/aspas são citados | preserva a distinção NULL × vazio no arquivo final, sem quebrar planilhas |
| 8 | O texto vai para `navigator.clipboard.writeText`; falha vira mensagem i18n, não exceção | o renderer não pode prometer cópia que não ocorreu |
| 9 | `enableCellTextSelection: true` mantém a seleção livre de texto; nenhum módulo de range | leitura confortável sem Enterprise |

**Medido**: o clipboard do Windows devolve `\r\n` mesmo quando o serializador emite `\n`; o teste e2e fixa esse comportamento de plataforma.

### D-S05-05 — Tema: tokens + preferência system/light/dark com live-follow
| # | Regra | Por quê |
|---|---|---|
| 1 | Tokens CSS em `styles/tokens.css`, aplicados por `data-theme` no `documentElement` | UI, editor e grid partem da mesma fonte |
| 2 | `resolveTheme(preference, systemDark)` é função pura e testável | a decisão não fica espalhada na UI |
| 3 | Preferência `system` segue `matchMedia('(prefers-color-scheme: dark)')` **ao vivo** | mudanças do SO aparecem sem reabrir |
| 4 | Grid troca de tema por `setGridOption('theme')`; Monaco por `setTheme('vs'|'vs-dark')` | APIs suportadas, sem remontar |
| 5 | A preferência é persistida no S06 (`preferences.yml`), não no S05 | separação de etapas |

### D-S05-06 — Cinco idiomas nos catálogos, texto de UI só por i18n
| # | Regra | Por quê |
|---|---|---|
| 1 | Catálogos `en-US`, `pt-BR`, `pt-PT`, `fr`, `es`; `en-US` é o padrão | regra do `CLAUDE.md` |
| 2 | Idioma inicial vem do SO (`navigator.languages`), senão `en-US` | primeira impressão correta |
| 3 | Troca ao vivo de UI e grid via Vue I18n; `documentElement.lang` acompanha | acessibilidade e coerência |
| 4 | SQL e nomes de objetos **não** são traduzidos | são dados, não texto de produto |
| 5 | Um teste de paridade garante que os cinco catálogos têm as mesmas chaves (incluindo as do grid) | evita chave órfã ou faltante |

### D-S05-07 — Pacote: `win-unpacked` com asar contendo só `out/`
| # | Regra | Por quê |
|---|---|---|
| 1 | `electron-builder --win --x64 --dir`, asar ativo | é o pacote que o gate exige; NSIS fica no T13 |
| 2 | `files`: `out/**/*`, `package.json` e `!node_modules/**/*` | **medido**: sem a exclusão o asar tinha 159,8 MB de dependências duplicadas; com ela, 8,4 MB, e o pacote continua executando |
| 3 | Ícone padrão e sem assinatura nesta etapa | identidade visual e assinatura são T13; ficam registrados como pendência |
| 4 | `npmRebuild: false` | nenhum módulo nativo é usado ainda |

Consequência para o futuro: qualquer dependência de runtime do processo main (ex.: `yaml`, `zod` no S06; `mysql2` em T04/T05) precisa ser **empacotada pelo Vite** no bundle do main ou explicitamente reincluída — não basta listá-la em `dependencies`.

### D-S05-08 — Evidência de offline pelo log de requisições
| # | Regra | Por quê |
|---|---|---|
| 1 | `SESHAT_REQUEST_LOG` liga o registro de `METHOD URL` das requisições do renderer | prova observável de “só `app://`” |
| 2 | Desligado por padrão; grava só URL e método, nunca corpo, header ou SQL | o log não pode virar vazamento |
| 3 | O e2e falha se qualquer linha não casar `^app://seshat/` | impede regressão silenciosa (CDN, telemetria, fonte remota) |

## Alternativas registradas e não adotadas
- **`file://` para o renderer** — não sustenta módulos ES, workers nem `fetch` com a semântica necessária; o próprio Monaco documenta que workers não funcionam em `file://`.
- **Servidor HTTP local** — superfície de rede e porta extra para um app offline.
- **Worker `blob:`** — exigiria `worker-src blob:` e abriria mão de uma diretiva estrita; o worker empacotado pelo Vite resolve com `'self'`.
- **Relaxar `script-src`** — nunca foi necessário; a evidência mostra o app funcionando com `'self'`.
- **`setGridOption('localeText')`** — rejeitado pelos tipos e pela semântica de opção inicial do AG Grid.
- **Traduzir o AG Grid inteiro** — sem ganho para o MVP, com custo de manutenção alto.
- **Copiar pelo módulo de clipboard do AG Grid** — Enterprise.
- **Carregar `nls/lang/pt-br`** — **medido** como inútil: 2.153 entradas nulas.
- **Incluir `node_modules` no asar** — duplicaria bibliotecas já empacotadas (159,8 MB → 8,4 MB).

## Consequências
- Trocar idioma remonta o grid e perde ordenação/seleção correntes; é aceitável porque a ação é rara, mas precisa ser explicado se virar reclamação.
- O renderer carrega 2,37 MB (sem minificar) + 4,97 MB do chunk do Monaco sob demanda; em disco local e sem rede isso é aceitável, mas deve ser reavaliado antes de qualquer distribuição por rede.
- Monaco fica em inglês para `pt-BR` e `pt-PT` até existir pacote NLS utilizável.
- O pacote atual é `win-unpacked`, sem ícone próprio e sem assinatura; não é artefato de release.
- Toda dependência de runtime do main passa a precisar de empacotamento explícito no Vite.
- O e2e depende de `ELECTRON_RUN_AS_NODE` não estar definido; `tests/e2e/launch.ts` remove a variável, e isso está documentado.
- A checagem offline com a rede desligada continua manual e pendente com o usuário.
