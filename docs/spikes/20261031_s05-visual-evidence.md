# Spike S05 — revisão visual do shell (evidência)

Execução: 2026-10-31, entre 13:36 e 13:49 (horário local, UTC−3), nesta máquina (Windows 11 Pro 10.0.26300, x64). Comandos e resultados abaixo foram capturados nesta execução.

Escopo medido: densidade do shell estilo desktop, regiões do layout, splitters, árvore, grid, temas, cinco idiomas, evidência de tela e pacote `win-unpacked` com o visual novo. Nada foi copiado do HeidiSQL (GPL-2.0); a referência foi apenas comportamental/geométrica.

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

## 2. Comandos e resultados

| Comando | Resultado |
|---|---|
| `npm run typecheck` | `typecheck:node` e `typecheck:web` sem erros |
| `npm run lint` | sem erros/avisos |
| `npm test` | 19 arquivos, **101 testes** aprovados (14,2 s) |
| `npm run build` | `out/main/index.js` 7,76 kB; `out/preload/index.js` 0,17 kB; `out/renderer` com `index-*.css` 14,56 kB, chunk do Monaco sob demanda, `index-*.js` 2.442,10 kB, `editor.api-*.js` 4.966,00 kB |
| `npm run test:e2e` | **11 testes** aprovados (19,9 s): 1 de pacote, 9 de UI/S05 e 1 de evidência visual |
| `npm run pack:win` | `dist/win-unpacked/SeshatSQL.exe` 249.798.656 bytes; `resources/app.asar` **8.483.713 bytes** (≈ 8,1 MiB); 365 MiB no diretório por causa do runtime Electron |
| `npx playwright test tests/e2e/packaged.spec.ts` | aprovado contra o pacote recém-gerado |

## 3. Geometria medida no app

Medidas do e2e (`tests/e2e/s05-ui.spec.ts`), com a janela em 950×600:

| Região | Medido |
|---|---|
| Menu | 22 px |
| Toolbar | 26 px |
| Abas | 24 px |
| Status | 20 px |
| Cabeçalho do grid | 24 px |
| Linha do grid | 20 px |
| Árvore | 270 px |
| Splitter vertical | 4 px de largura |
| Splitter horizontal | 4 px de altura |
| Editor | 100 px |
| Resultados (inicial) | ≈ 161 px |
| Log SQL | 80 px |

Viewport real: **934×561** para a janela de 950×600 e **849×441** para a mínima de 865×480 (a moldura do SO fica fora do `contentRect`). Não há rolagem de página em nenhum dos dois tamanhos; a rolagem fica dentro de árvore/editor/grid/log.

## 4. Comportamento verificado

- Janela abre em 950×600, mínimo 865×480, sem menu nativo (`Menu.getApplicationMenu()` = `null`).
- Splitters respondem a setas (passo 8), Home/End e clamp pelos mínimos; o log parte de 80 px e volta a 80 px após o teste.
- Tema escuro: `body` `rgb(32, 32, 32)`, árvore `rgb(30, 30, 30)`, superfície do grid `rgb(30, 30, 30)`, `--ag-header-background-color` `#2d2d2d` e camada pintada do cabeçalho `rgb(45, 45, 45)`; `color-scheme` acompanha.
- Francês ao vivo: menu `Fichier`, árvore `Tables (3)`, status `Déconnecté` / `Lignes : 4`, tooltip do idioma, `lang="fr"` e região viva do grid traduzida.
- Ctrl+C: TSV com cabeçalhos, **sem** “#”, LF convertido em CRLF pelo clipboard do Windows; o aviso de cópia some após 2,5 s e a contagem volta.
- Monaco aceita entrada com o worker sob `worker-src 'self'`; nenhum erro de console/página.
- Log de requisições: todas as linhas casam `^app://seshat/`; CSP do pacote inalterada.

## 5. Capturas de evidência

Diretório: `docs/spikes/evidence/20261031_s05-visual/`.

| Arquivo | Viewport | Tamanho |
|---|---|---|
| `en-US_light_950x600.png` | 934×561 | 35.228 bytes |
| `en-US_dark_950x600.png` | 934×561 | 35.706 bytes |
| `en-US_light_865x480.png` | 849×441 | 33.574 bytes |
| `en-US_dark_865x480.png` | 849×441 | 33.675 bytes |
| `fr_light_950x600.png` | 934×561 | 36.144 bytes |

As capturas são geradas por `tests/e2e/visual-evidence.spec.ts`, que fixa `en-US`, alterna tema/tamanho/idioma e move o ponteiro para `(0, 0)` antes de cada foto para não registrar um splitter em `:hover`.

## 6. Observações técnicas que mudaram o código/teste

- **Split aninhado**: o split do log (dimensionado pelo painel final, 80 px) usava a extensão transitória do pai (161 px) como posição inicial. Agora um split segue o tamanho configurado até o usuário ajustá-lo (`customized`), reaplicando o valor a cada medição; depois só aplica clamp.
- **Cabeçalho do AG Grid**: `.ag-header` e `.ag-header-row` computam fundo transparente; a pintura é feita pelo `::after` de `.ag-header-row` com `--ag-header-background-color`. O e2e passou a verificar a variável e a camada pintada.
- **Monaco 0.57**: o foco de edição é `div.native-edit-context` (EditContext); o `textarea` é `ime-text-area`, oculto e não focável. O `scroll-decoration` intercepta cliques nas linhas; o e2e foca o EditContext.
- **Densidade do editor**: a 100 px, o painel do Monaco exibe ~5 linhas e a decoração cobre a área de texto; é a densidade pretendida, mas cliques automatizados precisam do alvo correto.
- **Ícone de executar**: `Shuffle-Play-Arrow` lia como “embaralhar”; foi trocado por `Media` (tela com triângulo). A atribuição foi atualizada e continua com 16 arquivos.
- **Ponteiro físico**: um splitter sob o cursor real do usuário pode aparecer com a cor de destaque; o spec de evidência neutraliza o hover com `page.mouse.move(0, 0)`.
- **Aviso de cópia**: passou a ser transitório (2,5 s) para não substituir permanentemente a contagem de linhas; teste de componente com timers falsos e e2e cobrem o retorno.

## 7. Limitações e pendências

- Sem mnemônicos Alt no menu HTML; créditos visíveis dos ícones adiados para T13.
- Monaco em inglês para pt-BR/pt-PT (limitação de NLS).
- O conjunto gratuito não tem pasta nem play isolado; escolhas semânticas registradas.
- A checagem offline com a rede fisicamente desligada continua manual e pendente com o usuário, como no spike anterior.
- O S06 (YAML/DPAPI/flush/recovery) não foi iniciado.
