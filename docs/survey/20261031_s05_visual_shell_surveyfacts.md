# Survey — Revisão visual do preview S05 (shell estilo HeidiSQL)
Data: 2026-10-31 · Branch `develop_natan` · Fonte: solicitação do usuário e rodada de decisões
Plano correspondente: `docs/plans/develop_natan/20261031_s05_visual_shell_plansfacts.md`

## 1. Contexto da tarefa

O S05 tinha editor, grid, temas, idiomas e pacote funcionando, mas a tela provisória `S05Lab` usava um layout de cartões que o usuário considerou incompatível com uma ferramenta de banco de dados. O pedido foi refazer o visual como um shell de janela desktop denso, **no estilo do HeidiSQL**, usando a cópia local do código-fonte apenas como referência de comportamento e medidas.

O usuário também autorizou reaproveitar do HeidiSQL o conhecimento sobre **sintaxe SQL e listas de funções**, mas não o código do parser. Nesta etapa não há parser; o registro vale para etapas futuras.

## 2. Estado do repositório no início

- `HEAD` = `fd472a7` (“docs: padroniza comentários e testes em inglês”).
- S05 já implementado: `app://seshat`, CSP estrita, Monaco 0.57 com worker, AG Grid 36.2.0 Community, temas system/light/dark, catálogos em cinco idiomas, cópia TSV, pacote `win-unpacked`.
- `S05Lab.vue` era uma tela de cartões; havia 67 testes e 7 e2e.
- Nenhum IPC, dependência ou persistência nova era necessária para a revisão visual.

## 3. Decisões confirmadas na rodada

| # | Decisão |
|---|---|
| R-01 | Reimplementar a partir da observação; nada copiado do HeidiSQL (GPL-2.0). |
| R-02 | Shell completo: menu, toolbar, árvore, abas, editor, resultados, log e status. |
| R-03 | Parar para revisão ao fim; S06 somente depois. |
| R-04 | Menu HTML dentro da janela; menu nativo do Electron removido. |
| R-05 | Ações inexistentes desabilitadas com tooltip de i18n. |
| R-06 | Ícones gratuitos fornecidos em `assets/icons/nova_line` (Streamline Nova Line – Free, CC BY 4.0). |

## 4. Fatos levantados (medidos ou observados)

### 4.1 Referência visual

- Geometria observada na janela do HeidiSQL 12.22: menu 22 px, toolbar 26 px, botões 22×22, ícones 16×16, abas 24 px, árvore 270 px, splitters 4 px, editor ~100 px (mínimo 40), log 80 px, status 20 px, cabeçalho de grid 20–24 px, linhas 20 px.
- Tipografia observada: Tahoma 12 px no chrome, Tahoma 11 px nos dados, Consolas 12 px/16 px no editor.
- Nenhum arquivo, texto, ícone ou teste do HeidiSQL foi aberto para copiar; apenas a janela e o comportamento foram observados. A licença GPL-2.0 do HeidiSQL e a MPL-2.0 do projeto já estavam registradas em `docs/09`.

### 4.2 Conjunto de ícones

- `assets/icons/nova_line` contém **499 SVGs** 24×24, preenchidos em preto, da coleção **Nova Line – Free** (Streamline), **CC BY 4.0**.
- Não há ícone de pasta, triângulo “play” isolado nem “stop” dedicado. Foram escolhidos nomes semanticamente próximos: `File-Text-1` (nova consulta), `Book-Open` (abrir), `Floppy-Disk-1` (salvar), `Media` (executar), `Disable-Remove-Square-1` (parar), `Repeat-Track-Arrow` (atualizar), `Filter-1`, `Magnifier`, `Settings-Double-Cog`, `Cloud-Disable-Disconnected`, `Light-Mode-Brightness`, `Database`, `Graphic-Grid`, `Clock-Circle-1`, `Task-List-1`, `Eraser`.
- Os SVGs podem ser usados por `mask-image`; a CSP já permite `img-src 'self' data:` e o Vite inlina os pequenos como data URI.

### 4.3 Monaco 0.57

- O editor usa a API **EditContext**: o alvo focável é `div.native-edit-context`; o `textarea` presente é `ime-text-area`, com `tabindex="-1"` e `aria-hidden="true"`.
- O `scroll-decoration` cobre a área de linhas nesta densidade e intercepta cliques do Playwright; o e2e passou a focar `.native-edit-context` em vez de clicar em `.view-lines`.
- O worker continua empacotado por `?worker` e funciona sob `worker-src 'self'`.

### 4.4 AG Grid 36.2.0

- O plano de tema chega ao grid por variáveis CSS no `.ag-root-wrapper`; a superfície do cabeçalho é pintada pelo **`::after` de `.ag-header-row`** (`background-color: var(--ag-header-background-color)`), e não pelo `background` computado de `.ag-header`, que é transparente.
- O e2e verifica a superfície (`rgb(30, 30, 30)`), a variável (`#2d2d2d`) e a camada pintada (`rgb(45, 45, 45)`).
- A coluna “#” é manual e fixada à esquerda; o primeiro cabeçalho não é ordenável, então o teste de região viva clica no segundo.

### 4.5 Layout de splitters aninhados

- Um split aninhado mede primeiro a extensão transitória do pai. O split do log (dimensionado pelo painel final, 80 px) inicializava a partir dessa extensão e ficava com 224 px, em vez de 80 px.
- Correção: o split só deixa de seguir o tamanho configurado depois que o usuário o redimensiona (`customized`); a cada medição, o tamanho configurado é reaplicado e limitado pelos mínimos.
- O split da árvore segue em 270 px e o do editor em 100 px em qualquer tamanho de janela; o log permanece em 80 px até ser arrastado ou ajustado por teclado.

### 4.6 Ambiente e medições

- Janela lógica 950×600 → **viewport 934×561** (moldura do SO); mínimo 865×480 → viewport 849×441.
- As capturas de evidência foram feitas em `en-US` claro/escuro a 950×600 e 865×480, e em `fr` claro a 950×600.
- O ponteiro físico do usuário pode deixar um splitter em `:hover` (cor de destaque) durante uma captura; o spec de evidência agora move o ponteiro para `(0, 0)` antes de cada foto.
- O clipboard do Windows devolve CRLF mesmo com o serializador emitindo LF; comportamento já fixado no e2e.
- Aviso de cópia na barra de status: passa a sumir após 2,5 s para não esconder a contagem de linhas.

## 5. Vocabulário fixado

- **Shell** — moldura persistente da janela: menu, toolbar, status e regiões divisórias. Não é “tela de laboratório”.
- **Chrome** — partes não documentais da interface (menu, toolbar, abas, status). Não confundir com o navegador Chrome.
- **Splitter** — divisor de 4 px entre painéis, arrastável e ajustável por teclado; o valor ARIA é sempre a posição do painel inicial.
- **Árvore de objetos** — visão hierárquica de schema/tabelas/views; filtro local, sem consulta ao servidor nesta etapa.
- **Laboratório (`S05Lab`)** — tela provisória que cumpre o gate do S05 e será substituída em T07/T09.
- **Ação inerte** — botão/item desabilitado com `aria-disabled` e tooltip; não executa nada e não dispara IPC.

## 6. Limites e riscos registrados

- Sem mnemônicos Alt no menu HTML; créditos visíveis dos ícones adiados para T13.
- Monaco permanece em inglês para pt-BR/pt-PT (limitação de NLS já registrada).
- O conjunto de ícones não cobre todos os conceitos do HeidiSQL; escolhas semânticas estão documentadas.
- O grid rola horizontalmente dentro do próprio painel a 865 px; a página não rola.
- O S06 (YAML, DPAPI, flush/recovery) não foi iniciado.
