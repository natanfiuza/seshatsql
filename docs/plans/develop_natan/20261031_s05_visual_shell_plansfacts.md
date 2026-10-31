# Plano — Revisão visual do preview S05 (shell estilo HeidiSQL)
Data: 2026-10-31 · Branch `develop_natan` · Origem: solicitação do usuário e rodada de decisões
Survey correspondente: `docs/survey/20261031_s05_visual_shell_surveyfacts.md`

## 1. Contexto

O S05 havia sido implementado e verificado (editor Monaco, AG Grid Community, temas, cinco idiomas, pacote `win-unpacked`), mas o usuário **rejeitou o visual** da tela provisória `S05Lab`: cartões web, tipografia do sistema e painéis simétricos não pareciam uma ferramenta de banco de dados. O pedido foi reimplementar a tela como um shell **denso de janela desktop**, no estilo do HeidiSQL, usando a cópia local em `../HeidiSQL` apenas como referência de comportamento e geometria.

O resultado mantém **exatamente** os recursos já entregues: tema claro/escuro, cinco idiomas, editor e grid funcionais, cópia TSV, nenhum IPC novo, nenhuma dependência nova, nenhuma persistência. O S06 **não** foi iniciado.

## 2. Limite de licença (inegociável)

- O HeidiSQL é **GPL-2.0**; o SeshatSQL é **MPL-2.0**. Nada de código Pascal/Delphi, DFM, assets, ícones, textos, testes ou SQL embutido foi copiado, portado ou traduzido.
- A cópia local serviu apenas para **observação de comportamento e medidas** (alturas, larguras, ordem das regiões, densidade). Nenhum arquivo do HeidiSQL é referenciado por build ou testes.
- **SQL**: o usuário autorizou reaproveitar o conhecimento sobre sintaxe e listas de funções. Nesta etapa não há interpretação de SQL. Para etapas futuras, palavras-chave e **nomes** de funções serão tratados como fatos da linguagem, derivados da documentação oficial do MySQL; o **código do parser** do HeidiSQL e seus comentários/descrições/ajuda continuam GPL-2.0 e não entram no projeto.
- **Ícones**: 16 SVGs da coleção gratuita **Streamline Nova Line – Free**, licenciados em **CC BY 4.0** pelo usuário em `assets/icons/nova_line`. Foram copiados sem alteração para o renderer e coloridos por máscara CSS. A atribuição está em `src/renderer/src/assets/icons/nova-line/ATTRIBUTION.md` e em `docs/09-licenca-e-proveniencia.md`; créditos visíveis no aplicativo ficam para T13.

## 3. Decisões confirmadas pelo usuário

| # | Decisão |
|---|---|
| R-01 | Reimplementar a partir da observação; não copiar o HeidiSQL. |
| R-02 | Shell completo estilo HeidiSQL: menu, toolbar, árvore, abas, editor, resultados, log e status. |
| R-03 | Parar e aguardar revisão ao fim do trabalho visual; S06 só depois. |
| R-04 | Menu HTML dentro da janela, com o menu nativo do Electron removido. |
| R-05 | Ações inexistentes desabilitadas, com tooltip único de i18n. |
| R-06 | Usar os SVGs gratuitos fornecidos pelo usuário em `assets/icons/nova_line`. |

## 4. Geometria observada (referência, não copiada)

| Região | Medida observada no HeidiSQL 12.22 |
|---|---|
| Janela | 950×600 na abertura; moldura clássica |
| Menu / toolbar | 22 px / 26 px; botões 22×22; ícones 16×16; separadores de 8 px |
| Árvore | 270 px; linhas de 20 px; indentação de 12 px |
| Splitters | 4 px |
| Abas | 24 px |
| Editor | ~100 px de altura, mínimo 40; painel auxiliar de ~200 px à direita |
| Log SQL | faixa de 80 px |
| Status | 20 px |
| Grid | cabeçalho 24 px, linhas 20 px, grade nos dois eixos, sem zebra, coluna fixa “#” |
| Tipografia | Tahoma 12 px no chrome, Tahoma 11 px nos dados, Consolas 12 px/16 px no editor |

## 5. Decisões desta revisão

| # | Decisão |
|---|---|
| V-01 | Chrome desktop: menu 22 px, toolbar 26 px, status 20 px, abas 24 px, splitters 4 px, raio 0. Tahoma 12/11 px; Consolas 12 px com linha de 16 px. Sem cartões, sombras ou degradês. |
| V-02 | Layout: árvore 270 px │ (editor ~100 px + painel auxiliar 200 px) sobre resultados sobre log de 80 px. Três splitters arrastáveis e redimensionáveis por teclado, com mínimos. |
| V-03 | Menu HTML: Arquivo, Editar, Consulta, Exibir, Ferramentas, Ajuda. Todos os itens inertes com `aria-disabled` e tooltip; navegação por setas, Home/End e Escape; menu nativo removido. |
| V-04 | Toolbar: 10 ações inertes + tema e idioma funcionais à direita, preservando `data-testid="theme-select"` e `data-testid="locale-select"`. |
| V-05 | Árvore: schema sintético `seshat_lab (exemplo)`; pastas e rótulos localizados, nomes de objetos não traduzidos; filtro local case-insensitive mantendo ancestrais; expansores “+/−” desenhados em CSS; teclado e `aria-expanded`. |
| V-06 | Splitters: arraste por ponteiro e teclado; clamp pelos mínimos; tamanhos não persistidos (S06 persiste tema/idioma). |
| V-07 | Ícones: 16 SVGs Nova Line – Free (CC BY 4.0), sem edição, exibidos por `mask-image` e `background-color: currentColor`. |
| V-08 | Grid: coluna “#” manual (Community 36.2.0 não tem `RowNumbersModule`), alinhamento numérico à direita, linhas/cabeçalho de 20/24 px, grade nos dois eixos, sem zebra; cópia Ctrl+C inalterada e sem “#”. |
| V-09 | Monaco: 12 px Consolas, `lineHeight` 16, minimapa desligado, `vs`/`vs-dark`; contrato e modelo `inmemory://seshat/tab/<id>` inalterados. |
| V-10 | Nenhum recurso novo: sem IPC, dependência, persistência, conexão, execução ou diálogos. |
| V-11 | Janela 950×600, mínimo 865×480; marca no título (`SeshatSQL`) e no segmento direito da barra de status. |
| V-12 | Todo texto visível vem dos cinco catálogos; a nota “idioma do editor vale na próxima inicialização” virou tooltip do combo de idioma. |

## 6. Estrutura entregue

**Shell reutilizável (`src/renderer/src/ui/shell/`)**
- `AppIcon.vue`, `AppMenuBar.vue`, `AppToolbar.vue`, `AppSplit.vue`, `AppTabStrip.vue`, `AppStatusBar.vue`, `ObjectTree.vue`
- `split.ts` (geometria pura), `tree.ts` (filtro/flatten puros), `menu.ts` (modelo tipado), `icons.ts` (mapa nome→URL)

**Laboratório (`src/renderer/src/ui/lab/`)**
- `LabObjectTree.vue`, `LabEditorPane.vue`, `LabHelpersPanel.vue`, `LabResultsPane.vue`, `LabSqlLog.vue`, `sample-data.ts`

**Assets e tema**
- `src/renderer/src/assets/icons/nova-line/` (16 SVGs + `ATTRIBUTION.md`)
- `src/renderer/src/theme/palette.ts` (paleta TS única, sincronizada com `tokens.css` por teste)

**Alterados**
- `styles/tokens.css`, `styles/base.css`, `grid/grid-theme.ts`, `grid/ResultGrid.vue`, `grid/tsv.ts`, `editor/MonacoEditor.vue`, `ui/S05Lab.vue`, `main/index.ts`, `i18n/types.ts` e os cinco catálogos, testes de componente e e2e.

## 7. Paleta e densidade

| Token | Claro | Escuro |
|---|---|---|
| `--chrome-bg` | `#f0f0f0` | `#202020` |
| `--surface` / `--surface-alt` | `#ffffff` / `#f7f7f7` | `#1e1e1e` / `#262626` |
| `--border` / `--border-soft` | `#a0a0a0` / `#d7d7d7` | `#4a4a4a` / `#333333` |
| `--text` / `--text-muted` | `#1a1a1a` / `#6b6b6b` | `#e8e8e8` / `#9a9a9a` |
| `--accent` / `--accent-text` | `#0078d7` / `#ffffff` | `#2563eb` / `#ffffff` |
| `--grid-header-bg` / `--grid-line` | `#f0f0f0` / `#d7d7d7` | `#2d2d2d` / `#3c3c3c` |
| `--selected-bg` / `--selected-text` | `#0078d7` / `#ffffff` | `#264f78` / `#ffffff` |
| `--gutter-bg` / `--splitter` / `--hover` | `#f5f5f5` / `#f0f0f0` / `#dcecfa` | `#252526` / `#2a2a2a` / `#333a44` |

Densidade: `--menubar-h 22`, `--toolbar-h 26`, `--control 22`, `--icon 16`, `--tabstrip-h 24`, `--tree-w 270`, `--editor-h 100`, `--editor-min 40`, `--results-min 120`, `--log-h 80`, `--splitter 4`, `--status-h 20`, linha de grid/árvore 20.

## 8. Conteúdo do preview

- **Menus**: Arquivo (Novo, Abrir, Salvar, Salvar como, Fechar, Sair), Editar (Desfazer, Refazer, Recortar, Copiar, Colar, Localizar, Substituir), Consulta (Executar, Executar seleção, Parar, Explicar), Exibir (Árvore de objetos, Log SQL, Painel auxiliar), Ferramentas (Preferências), Ajuda (Sobre) — todos inertes.
- **Toolbar**: novo, abrir, salvar │ executar, parar │ atualizar │ filtrar, localizar │ configurações │ desconectado; tema e idioma à direita.
- **Árvore**: `seshat_lab (exemplo)` → Tabelas (3), Views (1) → objetos; filtro no topo.
- **Editor**: aba “Consulta 1”, SQL de exemplo, painel “Histórico” com estado vazio honesto.
- **Resultados**: aba “Resultado 1” e as 4 linhas sintéticas atuais (NULL, Unicode, número).
- **Log SQL**: faixa com título e “Nenhuma consulta executada”.
- **Status**: `Desconectado` │ contagem de linhas / aviso de cópia │ `Dados de exemplo · SeshatSQL`.

## 9. Etapas executadas

1. Fundações sem mudança visível — tokens, `base.css`, `palette.ts`, chaves i18n.
2. Densidade do grid e do editor — tema, coluna “#”, alinhamento, fonte.
3. Primitivas do shell — ícones + atribuição, menu, toolbar, split, abas, status, árvore.
4. Regiões do laboratório — árvore, editor, auxiliar, resultados, log, dados sintéticos.
5. Composição — `S05Lab.vue` como raiz do shell e teste de componente atualizado.
6. Janela e e2e — tamanho/mínimo, remoção do menu nativo, atalhos de dev, suíte ampliada.
7. Evidência e parada — capturas, spike, ADR, licença, relatório.

## 10. Verificação executada (2026-10-31)

| Comando | Resultado |
|---|---|
| `npm run typecheck` (node + web) | sem erros |
| `npm run lint` | sem avisos/erros |
| `npm test` | 19 arquivos, **101 testes** aprovados |
| `npm run build` | main 7,76 kB, preload 0,17 kB, renderer com CSS 14,56 kB + chunk Monaco sob demanda |
| `npm run test:e2e` | **11 testes** aprovados (app compilado, visual evidence e pacote) |
| `npm run pack:win` | `dist/win-unpacked/SeshatSQL.exe`; `app.asar` **8.483.713 bytes** (≈ 8,1 MiB) |
| `npx playwright test tests/e2e/packaged.spec.ts` | aprovado com o pacote recém-gerado |

Cobertura relevante do e2e: URL `app://`, título, janela 950×600 e mínimo 865×480, ausência de menu nativo, densidade (22/26/24/20/24/20), árvore 270, splitter 4, ausência de rolagem de página em 950×600 e 865×480, redimensionamento por teclado, menu inerte, Monaco sob CSP, Ctrl+C → TSV CRLF sem “#”, tema escuro em chrome/árvore/grid, francês ao vivo, somente requisições `app://`, zero erros de console/página.

## 11. Desvios e limitações registrados

- **Aviso de cópia transitório**: o plano dizia “mensagem de cópia” na barra de status; na prática o aviso substituía a contagem de linhas para sempre. Foi limitado a **2,5 s**, retornando à contagem — comportamento coberto por teste de componente e e2e.
- **Ícone de executar**: o conjunto Nova Line não tem triângulo “play” isolado; foi usado `Media` (tela com triângulo), trocando `Shuffle-Play-Arrow`, que lia como “embaralhar”.
- **Menu sem mnemônicos Alt**: menu HTML não usa `accesskey`; registrado como limitação.
- **Sem créditos visíveis no app**: atribuição CC BY está nos documentos e no `ATTRIBUTION.md` da pasta; créditos na interface ficam para T13.
- **Monaco em inglês para pt-BR/pt-PT**: limitação herdada (D-S05/S06-04).
- **Grid a 865 px**: a rolagem horizontal ocorre **dentro** do grid; o documento não rola.
- **Foco/hover**: as capturas de evidência agora posicionam o ponteiro em um canto inerte para não registrar um splitter com cor de destaque.

## 12. Parada

O trabalho visual está concluído e verificado. O agente **não** inicia o S06 nem executa `git commit`/`git push`; ao final, o usuário deve revisar as capturas e rodar `gitpr`. O S06 só começa após aprovação explícita.
