# 🚀 Sugestão de Pull Request

**Mensagem de Commit Recomendada:**
```text
feat: implementa shell visual com menus, painéis e grade compacta
```

---

## 🎯 Summary

Estabelece a identidade visual da aplicação: substitui a tela de laboratório por um shell desktop com barra de menus, toolbar, árvore de objetos, abas de editor/resultado, painel de log e barra de status. O objetivo é validar densidade, temas e comportamento de layout numa janela realista (950×600, mínimo 865×480) antes do workspace definitivo, aproximando a experiência de referências desktop como o HeidiSQL.

Para que o chrome próprio funcione, o menu nativo do Electron é removido e o grid ganha numeração de linhas, alinhamento por coluna e paleta compartilhada, garantindo que tema e densidade não divirjam entre chrome e dados.

## 🛠️ Technical Changes

- Adiciona componentes de shell: `AppMenuBar` (navegação por teclado, itens inertes), `AppToolbar`, `AppTabStrip`, `AppStatusBar`, `AppSplit` (redimensionamento por ponteiro e teclado, com mínimos), `ObjectTree` (filtro local, navegação ARIA roving tabindex) e `AppIcon` (máscara CSS sobre ícones).
- Extrai lógica pura testável em `ui/shell/split.ts` e `ui/shell/tree.ts`, com testes unitários dedicados.
- Remove o menu nativo (`Menu.setApplicationMenu(null)`) e adiciona `installDevShortcuts` para manter F12 e Ctrl+Shift+I/R acessíveis em desenvolvimento.
- Ajusta a janela principal para 950×600 com mínimos 865×480.
- Cria `theme/palette.ts` como fonte única de cores (chrome + grid) e um teste que valida a sincronia com `styles/tokens.css`.
- Reformula tokens CSS (nova nomenclatura, densidade: menubar 22px, toolbar 26px, tabs 24px, status 20px, linhas de grade 20px) e base global (`overflow: hidden`, `::selection`, `.sr-only`).
- Grid: adiciona coluna fixa `#` com `valueGetter` (contorna a ausência de `RowNumbersModule` no AllCommunityModule 36.2.0), suporte a `align: 'right'` por coluna e destaque de texto selecionado. O serializador TSV ignora a coluna de número.
- Reorganiza `S05Lab` para compor o shell em painéis aninhados; dados de exemplo isolados em `lab/sample-data.ts`; painéis `LabEditorPane`, `LabObjectTree`, `LabResultsPane`, `LabSqlLog`, `LabHelpersPanel`.
- Migra i18n de `lab.*` para `shell.*` nos cinco locales, com `shell.disabledHint` para affordances ainda inertes.
- Ajusta Monaco (fonte Consolas 12px, line-height 16, sem folding/glyph margin, padding reduzido).
- Adiciona testes de componente (menu, split, árvore, chrome), unitários (split, tree, palette) e e2e de densidade, redimensionamento e evidência visual; inclui screenshots em `docs/spikes/evidence`.

## ⚠️ Impact/Warnings

- **Comportamento de janela:** tamanho padrão e mínimos mudaram; o menu nativo do Electron deixa de existir, então atalhos padrão do sistema (ex.: reload, DevTools) só funcionam via `installDevShortcuts` em builds não empacotados.
- **Atalhos:** em produção não há atalhos de DevTools nem menu de aplicação — usuários não conseguem recarregar ou abrir DevTools.
- **i18n:** a chave `app.tagline` e todo o namespace `lab.*` foram removidos; qualquer referência externa quebra.
- **Grid/cópia:** a coluna `#` é apenas visual e é ignorada na cópia TSV; consumidores que esperam a primeira coluna de dados como índice 0 precisam considerar o deslocamento.
- **Banco de dados/ambiente:** sem alterações de schema, migrações ou variáveis de ambiente.
- **Dependências:** nenhuma dependência nova; ícones Nova Line (CC BY 4.0) são adicionados como assets, com atribuição em `ATTRIBUTION.md`.
- **Acessibilidade:** itens de menu, botões da toolbar, abas e ações de split permanecem inertes nesta etapa (`aria-disabled` + tooltip), o que é intencional para a prévia.

close #17

---

[![GitPR](https://img.shields.io/badge/GitPR-no_issues-brightgreen)](https://gitpr.natanfiuza.dev.br/)