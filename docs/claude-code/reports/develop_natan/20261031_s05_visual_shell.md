# Relatório — revisão visual do preview S05 (shell estilo HeidiSQL)

Data: 2026-10-31 · Branch: `develop_natan` · Autor da execução: Claude Code

## 1. Objetivo

Substituir a tela provisória `S05Lab` (layout de cartões) por um **shell denso de janela desktop** no estilo do HeidiSQL, usando a cópia local `../HeidiSQL` apenas como referência de comportamento e geometria. Preservar exatamente os recursos do S05: editor Monaco, grid AG Grid Community, cópia TSV, temas claro/escuro, cinco idiomas e o pacote `win-unpacked`.

**Parada obrigatória:** o S06 não foi iniciado; o trabalho aguarda revisão visual do usuário.

## 2. Dependências e limites

- Nenhuma dependência nova; nenhum IPC novo; nenhuma persistência; nenhuma conexão/execução de SQL.
- **Licença:** HeidiSQL é GPL-2.0 e o projeto é MPL-2.0. Nada do HeidiSQL foi copiado/portado/traduzido — apenas observação de janela e medidas. A cópia local continua fora do repositório e não é referenciada por build/testes.
- **SQL:** a autorização do usuário para reaproveitar sintaxe/listas de funções fica registrada para etapas futuras; nesta etapa não há parser. Código do parser, textos e comentários do HeidiSQL continuam fora do projeto.
- **Ícones:** 16 SVGs Streamline Nova Line – Free (CC BY 4.0), fornecidos pelo usuário, copiados sem alteração, atribuição registrada.

## 3. Critérios de aceite

| Critério | Situação |
|---|---|
| Shell completo: menu, toolbar, árvore, abas, editor, resultados, log, status | atendido |
| Menu HTML na janela; menu nativo removido | atendido — `Menu.setApplicationMenu(null)` |
| Ações inexistentes desabilitadas com tooltip i18n | atendido — `aria-disabled` + `shell.disabledHint` |
| Densidade de referência (22/26/24/20/4 px; árvore 270; editor 100; log 80) | atendido e medido no e2e |
| Temas claro/escuro em chrome, árvore, abas, status e grid | atendido e medido |
| Cinco idiomas ao vivo na UI/grid; Monaco na inicialização | atendido |
| Cópia Ctrl+C → TSV com cabeçalhos, sem “#” | atendido; teste de clipboard verde |
| Sem rolagem de página em 950×600 e 865×480 | atendido |
| Nenhuma requisição externa; CSP estrita | atendido — log só `app://seshat/` |
| Pacote Windows abre editor/grid sem servidor dev | atendido — `win-unpacked` testado |
| Sem cópia de código/assets/textos do HeidiSQL | atendido |
| Atribuição CC BY 4.0 dos ícones registrada | atendido |

## 4. O que foi entregue

### Shell reutilizável (`src/renderer/src/ui/shell/`)

- `AppIcon.vue` — ícone por `mask-image`, 16 px, `aria-hidden`.
- `AppMenuBar.vue` — seis menus, dropdowns inertes, roving tabindex, setas/Home/End/Escape, clique fora.
- `AppToolbar.vue` — 10 ações inertes em grupos + tema/idioma funcionais à direita.
- `AppSplit.vue` — divisor de 4 px com arraste e teclado; segue o tamanho configurado até o usuário ajustar.
- `AppTabStrip.vue` — abas de 24 px, seleção, “+” e “×” inertes.
- `AppStatusBar.vue` — conexão, detalhe (`role="status"`, `aria-live`) e marca.
- `ObjectTree.vue` — árvore acessível com filtro local, expansão e teclado.
- `split.ts`, `tree.ts`, `menu.ts`, `icons.ts` — lógica pura e modelo tipado.

### Laboratório (`src/renderer/src/ui/lab/`)

- `LabObjectTree.vue`, `LabEditorPane.vue` (Monaco + “Histórico”), `LabHelpersPanel.vue`, `LabResultsPane.vue`, `LabSqlLog.vue`, `sample-data.ts`.

### Assets, tema, grid e editor

- `src/renderer/src/assets/icons/nova-line/` — 16 SVGs + `ATTRIBUTION.md`.
- `src/renderer/src/theme/palette.ts` — paleta única sincronizada com `tokens.css` por teste.
- `styles/tokens.css`, `styles/base.css` — paleta desktop, densidade, Tahoma/Consolas, `overflow:hidden`.
- `grid/grid-theme.ts`, `grid/ResultGrid.vue` — linhas 20 px, cabeçalho 24 px, grade nos dois eixos, coluna “#” manual, alinhamento numérico.
- `grid/tsv.ts` — metadado opcional de alinhamento; serialização intacta.
- `editor/MonacoEditor.vue` — 12 px/16 px, minimapa desligado.
- `ui/S05Lab.vue` — composição do shell.
- `src/main/index.ts` — janela 950×600, mínimo 865×480, menu nativo removido, atalhos de DevTools só em dev.
- `i18n/types.ts` + 5 catálogos — grupos `shell.*` e remoção de chaves `lab.*` não usadas.
- Testes novos: `split`, `tree`, `palette` (unit); `app-menu-bar`, `app-split`, `object-tree`, `shell-chrome` (componente); `visual-evidence` (e2e). Atualizados: `s05-lab`, `result-grid`, `s05-ui`, `packaged`.

## 5. Comandos e resultados

Executados em 2026-10-31 nesta máquina (Windows 11 Pro 10.0.26300, x64):

| Comando | Resultado |
|---|---|
| `npm run typecheck` | sem erros (node + web) |
| `npm run lint` | sem erros/avisos |
| `npm test` | **19 arquivos, 101 testes aprovados** |
| `npm run build` | main 7,76 kB; preload 0,17 kB; renderer com CSS 14,56 kB e Monaco sob demanda |
| `npm run test:e2e` | **11 testes aprovados** (19,9 s) |
| `npm run pack:win` | `dist/win-unpacked/SeshatSQL.exe`; `app.asar` **8.483.713 bytes** |
| `npx playwright test tests/e2e/packaged.spec.ts` | aprovado com o pacote recém-gerado |

Detalhes e medidas: `docs/spikes/20261031_s05-visual-evidence.md`.

## 6. Diff de código e testes (working tree, não commitado)

```text
 src/main/index.ts                        |  41 ++-
 src/renderer/src/editor/MonacoEditor.vue |  20 +-
 src/renderer/src/grid/ResultGrid.vue     |  49 +++-
 src/renderer/src/grid/grid-theme.ts      |  53 ++--
 src/renderer/src/grid/tsv.ts             |   2 +
 src/renderer/src/i18n/locales/*.ts       | 690 +++++++++++++++++-----
 src/renderer/src/i18n/types.ts           | 131 +++++++--
 src/renderer/src/styles/base.css         |  38 ++-
 src/renderer/src/styles/tokens.css       | 100 ++++---
 src/renderer/src/ui/S05Lab.vue           | 443 +++++++++----------------------
 tests/component/result-grid.test.ts      |  24 +-
 tests/component/s05-lab.test.ts          |  73 ++++-
 tests/e2e/packaged.spec.ts               |   2 +-
 tests/e2e/s05-ui.spec.ts                 | 188 ++++++++++++-
 18 arquivos rastreados, 1.257 inserções / 597 remoções
```

Novos (não rastreados): `docs/spikes/evidence/20261031_s05-visual/` (5 PNGs), `src/renderer/src/assets/` (ícones + atribuição), `src/renderer/src/theme/palette.ts`, `src/renderer/src/ui/lab/`, `src/renderer/src/ui/shell/`, 7 testes novos e `tests/e2e/visual-evidence.spec.ts`. Documentos novos: plano, survey, spike e este relatório; ADR 0015, `docs/09` e `docs/11` atualizados.

Observação: `.gitpr/reports/pr_desc/develop_natan_*.md` já estava não rastreado antes desta tarefa (gerado pelo `gitpr` do usuário); não foi criado nem alterado pelo agente.

## 7. Testes — cobertura relevante

- **Unit (novos):** clamp/teclado do splitter; filtro de árvore (case-insensitive, ancestrais, subárvore); sincronia `palette.ts` × `tokens.css`.
- **Componente (novos):** menu abre/fecha/foco/Escape/clique fora; split posiciona e limita; árvore expande/filtra/navega/seleciona; toolbar inerte com tooltips, combos emitem tema/idioma, abas e status acessíveis.
- **Componente (atualizados):** `S05Lab` em pt-BR, tema, francês ao vivo, aviso de cópia transitório, contagem/marca, menu inerte, árvore; grid com coluna “#”, alinhamento e tema escuro.
- **E2E (ampliados):** janela/título/menu nativo, densidade, ausência de rolagem, splitters por teclado, menu inerte, Monaco sob CSP, Ctrl+C/TSV, temas, francês, requisições `app://`, zero erros; captura de evidência em 5 variantes; pacote.
- **Não executado:** teste manual com a rede fisicamente desligada (continua pendente com o usuário) e testes destrutivos de banco (fora do escopo desta etapa).

## 8. Desvios

- **Aviso de cópia transitório (2,5 s):** o aviso agora devolve a contagem de linhas; coberto por teste com timers falsos e por e2e.
- **Ícone de executar:** troca de `Shuffle-Play-Arrow` por `Media` (tela com triângulo), por legibilidade a 16 px; atribuição atualizada, ainda 16 arquivos.
- **Split aninhado:** correção de inicialização para o log permanecer em 80 px enquanto o pai se estabiliza.
- **Teste do Monaco:** foco no `div.native-edit-context` (EditContext do Monaco 0.57) em vez de clique nas linhas cobertas pela decoração.
- **Teste do tema do grid:** verificação da variável e do `::after` pintado, não do `background` transparente do `.ag-header`.

## 9. Riscos e limitações

- Sem mnemônicos Alt no menu HTML (`accesskey`); não há requisito de atalho de menu no MVP.
- Créditos visíveis dos ícones ficam para T13; a atribuição atual está nos documentos e no `ATTRIBUTION.md`.
- Monaco permanece em inglês para pt-BR/pt-PT (limitação de NLS, D-S05/S06-04).
- O conjunto gratuito não tem pasta/play isolados; escolhas semânticas registradas.
- A 865 px, o grid rola horizontalmente **dentro** do painel; a página não rola.
- O pacote é `win-unpacked`, sem ícone próprio e sem assinatura; não é artefato de release.
- O S06 (YAML validado, DPAPI, flush/recovery, banner de recuperação) continua pendente e **não** foi iniciado.

## 10. Documentos atualizados

- `docs/plans/develop_natan/20261031_s05_visual_shell_plansfacts.md`
- `docs/survey/20261031_s05_visual_shell_surveyfacts.md`
- `docs/adr/0015-ui-workers-csp-pacote.md` (D-S05-09 a D-S05-12; status **proposto**)
- `docs/09-licenca-e-proveniencia.md` (atribuição Streamline/CC BY 4.0)
- `docs/11-fontes.md` (fontes dos ícones)
- `docs/spikes/20261031_s05-visual-evidence.md`
- `docs/spikes/evidence/20261031_s05-visual/` (5 capturas)
- Este relatório

## 11. Estado para revisão e próximo passo

O visual novo está no working tree, verificado e com capturas em `docs/spikes/evidence/20261031_s05-visual/`. **Nada foi commitado ou enviado ao GitHub.** O agente não executa `git commit`/`git push`.

Ao revisar, confira principalmente as capturas claro/escuro e o tamanho mínimo 865×480. Após a aprovação, o próximo passo é o **S06** conforme o plano aprovado (schemas YAML, DPAPI, flush, recuperação e reinício) — somente depois da revisão visual.

Quando estiver de acordo, execute o commit e o pull request com a ferramenta `gitpr`.
