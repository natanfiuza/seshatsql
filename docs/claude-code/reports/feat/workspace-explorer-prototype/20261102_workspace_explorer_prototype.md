# Relatório — protótipo do workspace explorer

Data: 2026-11-02 · Branch: `feat/workspace-explorer-prototype` · Autor da execução: Claude Code
Plano aprovado: `docs/plans/feat/workspace-explorer-prototype/20261101_workspace_explorer_prototype_plansfacts.md` · Survey: `docs/survey/20261101_workspace_explorer_prototype_surveyfacts.md` · Evidência: `docs/spikes/20261101_workspace-explorer-evidence.md`

## Objetivo

Substituir a árvore fixa de tabelas/campos do protótipo S05 por **Conexão ativa → banco → Tabelas | Views | Eventos**, com abas da conexão, aba de banco, estrutura de tabela/view/evento no modelo funcional do HeidiSQL, aba de dados separada e uma faixa global de abas de consulta com “+”. Tudo com dados fictícios em memória, **sem IPC, MySQL, credenciais, sessão real ou schema de persistência novo**.

## Dependências

- T04 concluído em `4556f3c` (perfis, DPAPI, `connections.yml` v2).
- Persistência de abas existente (`PersistedTab`/`TabsStateV1`, debounce de 500 ms, fila de save, `flushTabs`).
- Vue 3.5.44, vue-i18n 11.4.16, Monaco 0.57.0 e AG Grid Community 36.2.0 já fixados; **nenhuma dependência nova ou versão alterada**.
- Nenhum banco, rede ou serviço externo foi usado.

## Critérios de aceite e situação

| Critério | Situação |
| --- | --- |
| Árvore conexão → banco → grupos Tabelas/Views/Eventos, sem colunas | atendido — e2e verifica raiz, selo “Active” e grupos contados |
| Raiz “Seshat Lab” com selo “Ativa” e clique simples abrindo a aba | atendido — componente e e2e |
| Cinco sub-abas da conexão com contagens | atendido — Databases (3), Variables (7), Status (6), Processes (4), Command statistics (6) |
| Colunas de bancos, variáveis, status, processos e estatísticas | atendido — grades verificadas no DOM |
| Aba “Banco de dados: `<nome>`” com as oito colunas | atendido — e2e verifica as oito colunas e 5 objetos |
| Clique simples abre estrutura; duplo clique abre Dados | atendido — timer de 250 ms com teste de componente e e2e |
| Tabela com oito sub-abas e aba de topo “Dados: `<nome>`” | atendido — e2e percorre todas e abre dados |
| View com quatro sub-abas + Dados; evento com quatro sub-abas e sem Dados | atendido — e2e e componente |
| CREATE/ALTER em Monaco somente leitura | atendido — tentativa de digitação não altera o conteúdo |
| “+”, “Nova consulta” e “×” funcionais | atendido — e2e cria/fecha três consultas |
| Fechar a última consulta recria e persiste “Consulta 1” | atendido — e2e |
| Metadados efêmeros; `activeTabId` permanece consulta | atendido — e2e de reinício e testes de componente |
| Status “Conectado (simulação)” + conexão + “Dados de exemplo” | atendido — e2e e atualização das suítes T04/S05/S06 |
| Sem rolagem de página em 865×480 e tema escuro | atendido — e2e mede `scrollWidth/scrollHeight` |
| Rótulos nos cinco catálogos, sem texto visível fixo | atendido — paridade i18n e revisão de código |

## Arquivos

### Novos — protótipo do workspace

- `src/renderer/src/ui/workspace/catalog.ts` — conexão, três bancos, dez objetos, painéis da conexão, SQL e amostras.
- `src/renderer/src/ui/workspace/format.ts` — números, estimativas, bytes, datas e tipos localizados.
- `src/renderer/src/ui/workspace/workspace-tabs.ts` — IDs determinísticos, deduplicação, sub-abas e numeração de consultas.
- `src/renderer/src/ui/workspace/WorkspaceShell.vue` — faixa global e área de conteúdo.
- `src/renderer/src/ui/workspace/ConnectionWorkspace.vue` — cinco sub-abas e grids.
- `src/renderer/src/ui/workspace/DatabaseWorkspace.vue` — grade de oito colunas e discriminador de clique.
- `src/renderer/src/ui/workspace/ObjectWorkspace.vue` — matriz de estrutura por tipo e SQL read-only.
- `src/renderer/src/ui/workspace/DataWorkspace.vue` — amostra de dados somente leitura.
- `src/renderer/src/ui/workspace/MetadataGrid.vue` — wrapper de `ResultGrid` com formatação por coluna.
- `docs/plans/feat/workspace-explorer-prototype/20261101_workspace_explorer_prototype_plansfacts.md`
- `docs/survey/20261101_workspace_explorer_prototype_surveyfacts.md`
- `docs/spikes/20261101_workspace-explorer-evidence.md`
- `docs/spikes/evidence/20261101_workspace-explorer/` — nove capturas.

### Alterados

- `src/renderer/src/ui/S05Lab.vue` — integração do workspace, dois IDs ativos, criação/fechamento de consultas e status.
- `src/renderer/src/ui/lab/LabObjectTree.vue` — árvore montada a partir do catálogo, com conexão, bancos, grupos e folhas.
- `src/renderer/src/ui/lab/LabEditorPane.vue` — faixa de abas removida; editor ligado à consulta ativa.
- `src/renderer/src/ui/shell/ObjectTree.vue` e `tree.ts` — ativação por nó, `nodeKind`/`badge` preservados e grupos apenas expandindo.
- `src/renderer/src/ui/shell/AppTabStrip.vue` — `closable`, `addable`, variantes, “+” fora da área rolável e teclado.
- `src/renderer/src/grid/ResultGrid.vue` — eventos opcionais `rowClick` e `rowDoubleClick`, sem alterar cópia/TSV.
- `src/renderer/src/editor/MonacoEditor.vue` — `readOnly`, `ariaLabel` e `testId`.
- `src/renderer/src/ui/shell/AppStatusBar.vue` — conexão simulada e nome.
- `src/renderer/src/ui/shell/AppToolbar.vue` e `menu.ts` — “Nova consulta” com ação.
- Catálogos i18n (`en-US`, `pt-BR`, `pt-PT`, `fr`, `es`) e `types.ts` — grupos do workspace, árvore, abas e status, em paridade.
- `docs/plans/develop_natan/20261101_retomada_pos_t04_plansfacts.md` — estado atualizado.

### Testes

- Novos unitários: `workspace-tabs.test.ts`, `workspace-catalog.test.ts`, `workspace-format.test.ts`.
- Novo componente: `workspace-views.test.ts`.
- Novo e2e: `workspace-explorer.spec.ts` (8 cenários).
- Ajustados: `tree.test.ts`, `object-tree.test.ts`, `s05-lab.test.ts`, `shell-chrome.test.ts`, `s05-ui.spec.ts`, `s06-persistence.spec.ts`, `t04-connections.spec.ts`.

## Comandos e resultados

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | aprovado, sem erros |
| `npm run lint` | aprovado, sem erros |
| `npm test` | **36 arquivos, 257 testes aprovados** |
| `npm run build` | aprovado |
| `npx playwright test tests/e2e/workspace-explorer.spec.ts` | **8/8 aprovados** |
| `npx playwright test tests/e2e/s05-ui.spec.ts tests/e2e/t04-connections.spec.ts tests/e2e/s06-persistence.spec.ts` | **25/25 aprovados** |
| `npm run test:e2e` | **35/35 aprovados**, 2,1 min |
| `npm run pack:win` | aprovado; `dist/win-unpacked`, asar com 8,8 MiB |
| `npx playwright test tests/e2e/packaged.spec.ts` | **1/1 aprovado**, 5,4 s |

## Decisões e defeitos corrigidos durante a execução

- **Dois IDs ativos**: `activeId` é sempre a consulta persistida; `activeWorkspaceId` é a aba visível. Fechar metadado ativo volta para a consulta ativa.
- **Títulos**: a primeira consulta continua seguindo o idioma da interface; novas consultas recebem título localizado com número sequencial.
- **Clique simples × duplo**: timer de 250 ms cancela a abertura da estrutura quando chega o duplo clique; o timer é limpo no unmount.
- **Tipagem de união**: o template do `S05Lab` precisou estreitar por `target.kind` em vez de `kind`, e o rótulo de metadados passou a usar um mapa `TITLE_KEYS` para evitar narrowing para `never`.
- **Testes legados**: `ResultGrid` passou a usar `addEventListener?.` para não quebrar mocks antigos; testes de shell/tree foram atualizados para a nova semântica funcional.

## Riscos e limitações

- **Não há conexão real**; o status é apenas visual. Qualquer implementação real depende de T05/T06/T07/T10 e de emenda de requisitos.
- Registros são estimativas fictícias; datas e tamanhos são pré-formatados e ordenam lexicograficamente.
- Eventos são somente exibição, consistente com o ADR 0013; nenhuma ação de ALTER foi implementada.
- A consulta ativa é desmontada ao abrir metadados; não foi observado relayout pendente, mas Monaco/AG Grid são remontados a cada retorno.
- A revisão humana do layout e do diff permanece pendente.
- Processos `electron.exe` órfãos de execuções anteriores continuam exigindo limpeza manual.

## Pendências

- Revisão do protótipo e do diff.
- Aceite humano do ADR 0017: a revisão técnica de 2026-11-02 não encontrou divergências.
- Auditoria de contraste da paleta concluída em `docs/spikes/20261102_t04-palette-contrast-evidence.md`, sem falha bloqueante; o anel de alto contraste é melhoria opcional.
- Decisão sobre artefatos `.gitpr` não rastreados.
- T05/T06/T07/T10 não autorizados.

## Git

O agente **não executou commit nem push**. A branch `feat/workspace-explorer-prototype` foi criada a partir de `4556f3c`; as alterações permanecem no working tree. O usuário deve revisar e executar o commit e o pull request com `gitpr`.
