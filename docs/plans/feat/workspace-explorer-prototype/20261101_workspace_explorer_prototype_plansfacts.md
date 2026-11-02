# Plano — protótipo do workspace explorer (conexão, bancos, objetos e dados)

Criado em 2026-11-01 · Branch `feat/workspace-explorer-prototype` · Base `develop_natan` `4556f3c`

## 1. Contexto e objetivo

O protótipo S05 mostra uma árvore fixa de tabelas/views, uma única consulta e o status “Desconectado”. Esta etapa aproxima a navegação do modelo funcional do HeidiSQL, sem implementar backend:

- árvore **Conexão ativa → banco de dados → Tabelas | Views | Eventos**;
- abas da conexão com bancos, variáveis, status, processos e estatísticas de comandos;
- aba de banco com inventário de objetos e metadados;
- abas de consulta com “+” sempre visível e persistência pelo caminho atual;
- estrutura de tabela/view/evento no modelo do HeidiSQL e aba de dados separada;
- tudo com dados fictícios em memória, somente leitura, sem IPC/MySQL/credenciais.

O objetivo é revisar a experiência antes de planejar a implementação real. **Não iniciar T05/T07.** Parar para revisão ao final.

## 2. Decisões fechadas

1. Protótipo de UI agora; sem backend, sem conexão real, sem persistência nova.
2. Conexão simulada fixa **“Seshat Lab”**, sem conectar/desconectar.
3. Faixa única de abas no workspace da direita; árvore à esquerda.
4. Raiz da árvore com nome da conexão e selo **“Ativa”**; grupos Tabelas/Views/Eventos; sem colunas.
5. Clique em conexão/banco/objeto abre aba; grupos só expandem/recolhem.
6. Abas da conexão: Bancos de dados (n), Variáveis (n), Status (n), Processos (n), Estatísticas de comandos (n).
7. Aba **“Banco de dados: <nome>”** com Nome, Registros, Tamanho, Criado em, Atualizado em, Motor, Comentário, Tipo. Clique simples abre estrutura; duplo clique abre Dados.
8. Tabela: Básico, Opções, Índices, Chaves estrangeiras, Restrições CHECK, Partições, Código CREATE, Código ALTER; Dados em aba de topo separada e botão “Abrir dados”.
9. View: Básico, Opções, Código CREATE, Código ALTER + Dados. Evento: as quatro abas de estrutura, sem Dados.
10. Consultas são as únicas abas persistidas, usando `PersistedTab`/`TabsStateV1` existentes. Metadados são efêmeros.
11. Fechar a última consulta recria e persiste uma “Consulta 1” localizada.
12. Conteúdo estático rico; formulários desabilitados; grids reais; CREATE/ALTER em Monaco somente leitura.
13. Status: “Conectado (simulação)” + nome da conexão + “Dados de exemplo”.
14. Rótulos nos cinco catálogos, sem texto visível fixo no código.
15. Branch `feat/workspace-explorer-prototype` criada de `4556f3c`; sem commit/push pelo agente.

## 3. Arquitetura

### 3.1 Catálogo fictício

Novo diretório `src/renderer/src/ui/workspace/`:

- `catalog/types.ts` — `ObjectKind`, `WorkspaceTarget`, `MockConnection`, `MockDatabase`, `MockObjectBase`, `MockTable`, `MockView`, `MockEvent`, `MockField`, `MockGrid`.
- `catalog/connection.ts` — conexão e painéis (bancos, variáveis, status, processos, estatísticas).
- `catalog/seshat-lab.ts`, `analytics.ts`, `archive.ts` — objetos e detalhes.
- `catalog/data-samples.ts` — amostras de dados de tabelas/views.
- `catalog/index.ts` — `CONNECTION`, `DATABASES`, `findDatabase`, `findObject`, `objectsOfDatabase`, `connectionPanels`, `dataSampleFor`.

Catálogo:
| Banco | Tabelas | Views | Eventos |
|---|---|---|---|
| `seshat_lab` | `customers`, `orders`, `order_items` | `v_customer_totals` | `ev_purge_sessions` |
| `analytics` | `daily_metrics`, `funnel_events` | `v_weekly_revenue` | — |
| `archive` | `audit_log` | — | — |

Cada objeto tem metadados, fields de Básico/Opções, grids de índices/FKs/CHECK/partições quando aplicável, SQL CREATE/ALTER e amostra de dados quando tabela/view. Eventos não têm Dados. Nomes técnicos, SQL e comentários são dados, não i18n.

`sample-data.ts` continua dono de `SAMPLE_SQL`, `SAMPLE_COLUMNS`, `SAMPLE_ROWS` da consulta de exemplo.

### 3.2 Modelo de abas

Novo `workspace-tabs.ts` (puro) e `useWorkspace.ts` (orquestração reativa, sem IPC):

```ts
type EphemeralTab =
  | { id: string; kind: 'connection' }
  | { id: string; kind: 'database'; database: string }
  | { id: string; kind: 'table' | 'view' | 'event'; database: string; object: string }
  | { id: string; kind: 'data'; database: string; object: string; objectKind: 'table' | 'view' }
```

IDs:
- `connection:<connectionId>`
- `database:<database>`
- `<kind>:<encodedDatabase>/<encodedObject>`
- `data:<objectKind>:<encodedDatabase>/<encodedObject>`

Estados:
- `tabs` (consultas persistidas), `activeId` (consulta ativa persistida);
- `ephemeralTabs`, `workspaceActiveId` (aba visível), `subtabByTabId`.

Invariantes:
1. Sempre existe ao menos uma consulta.
2. `activeId` sempre aponta para consulta.
3. `tabs_states.yml` contém apenas consultas.
4. Abrir/selecionar/fechar metadados não altera `activeId`.
5. Fechar metadado ativo volta para `activeId`.
6. Startup restaura a última consulta ativa; nenhum metadado é restaurado.
7. Ativar não reordena; inserção acrescenta ao grupo.

Transições:
- criar consulta: flush do debounce, append, ambos os IDs ativos, salvar;
- fechar consulta: flush, remover, escolher vizinha; se última, criar “Consulta 1” vazia; normalizar `order`; salvar;
- abrir metadado: ativar existente ou append; não salvar;
- fechar metadado: remover; se ativo, voltar para `activeId`; não salvar;
- trocar locale: regerar títulos automáticos das consultas e agendar save.

### 3.3 Árvore

- `tree.ts`: `TreeSourceNode`/`TreeRow` ganham `nodeKind` e `badge` opcionais, preservados por `filterTree`/`flattenTree`.
- `ObjectTree.vue`: emite `activate(id)`; clique/Enter/Espaço em nó acionável; grupos só alternam; selo “Ativa” visível; `aria-selected` controlado.
- `LabObjectTree.vue`: monta a árvore do catálogo; raiz “Seshat Lab” + selo; bancos; grupos com contagem; folhas; expansão inicial de conexão, bancos e grupos.

### 3.4 Faixa de abas

`AppTabStrip.vue`:
- props `closable`, `addable`, `variant`, `ariaLabel`;
- emite `close(id)`/`add`;
- “+” sempre visível fora da lista rolável;
- sub-abas sem “+”/“×”;
- rolagem horizontal interna; altura 24 px;
- teclado: setas/Home/End com roving tabindex; Delete fecha aba focada quando `closable`.

### 3.5 Views

- `WorkspaceShell.vue`: faixa global + conteúdo; consulta `v-show`, metadado `v-if`.
- `QueryWorkspace.vue`: split editor/resultados/log; sem faixa de abas interna.
- `ConnectionWorkspace.vue`: cinco sub-abas e grids.
  - Bancos: Nome, Tabelas, Views, Tamanho, Collation.
  - Variáveis: Variável, Valor, Escopo.
  - Status: Variável, Valor.
  - Processos: ID, Usuário, Host, Banco, Comando, Tempo, Estado, Info.
  - Estatísticas: Comando, Total, Por hora, Por segundo.
- `DatabaseWorkspace.vue`: grade com Nome, Registros, Tamanho, Criado em, Atualizado em, Motor, Comentário, Tipo. Timer de 250 ms discrimina clique simples/duplo; limpar no unmount.
- `ObjectWorkspace.vue`: matriz de sub-abas por tipo; Básico/Opções em campos desabilitados; Índices/FKs/CHECK/Partições em grids; CREATE/ALTER em Monaco `readOnly`; botão “Abrir dados” para tabela/view; selo “Demonstração — somente leitura”.
- `DataWorkspace.vue`: grade de amostra, somente leitura.
- `WorkspaceMissing.vue`: estado de objeto ausente.

### 3.6 Reutilização

- `ResultGrid.vue`: props `showRowNumbers`, `testId`; emite `rowClick`/`rowDoubleClick`; Enter/Shift+Enter opcionais; copiar/TSV intactos.
- `MonacoEditor.vue`: `readOnly`, `ariaLabel`, `testId`; opções `readOnly` e `domReadOnly`; sem `change` em read-only.
- `AppStatusBar.vue`: `connectionName`; “Conectado (simulação)” + nome; detalhe dinâmico; marca “Dados de exemplo · SeshatSQL”.
- `AppToolbar.vue`: “Nova consulta” habilitado (`new-query`); demais inertes.
- `menu.ts`: `ShellAction` ganha `new-query`; menus inalterados.
- `LabEditorPane.vue`: remove abas/props; mantém editor e painel auxiliar.
- `LabResultsPane.vue`: sub-aba “Resultado 1” sem “+”.
- `S05Lab.vue`: integra `useWorkspace`, árvore, toolbar, status, diálogo e persistência existente.

### 3.7 Layout

```
main.lab
├─ AppMenuBar
├─ AppToolbar
├─ PersistenceBanner
├─ div.lab__body
│  └─ AppSplit vertical 270
│     ├─ start: LabObjectTree
│     └─ end: WorkspaceShell
│        ├─ AppTabStrip (global)
│        └─ QueryWorkspace | Connection/Database/Object/DataWorkspace
├─ AppStatusBar
└─ ConnectionsDialog
```

Consulta mantém splits 100/80 e largura da árvore 270. Metadados ocupam o painel inteiro. Sem rolagem de página em 865×480; faixas rolam internamente.

### 3.8 i18n e formatação

Grupos novos em `shell.*`: workspace/tabs, tree (selo, grupos), status, painéis de conexão, banco, objeto, unidades, sim/não, tipos. Os cinco catálogos e `types.ts` em paridade. Nomes de objetos/SQL não são traduzidos.

`format.ts`:
- números e estimativas com `Intl.NumberFormat`;
- bytes em B/KB/MB/GB com unidade localizada;
- datas com `Intl.DateTimeFormat` em UTC;
- tipo de objeto, escopo e sim/não traduzidos;
- nulo → “não disponível”.

## 4. Testes

### Unitários
- `workspace-tabs.test.ts`: IDs, dedup, transições, invariantes, numeração e títulos.
- `workspace-catalog.test.ts`: contagens, objetos, dados, SQL, painéis, unicidade.
- `workspace-format.test.ts`: bytes/datas/números/nulos em locale.
- `tree.test.ts`: metadados preservados no filtro/flatten.
- paridade i18n existente.

### Componentes
- `AppTabStrip`: variantes, emits, teclado, “+” sempre visível.
- `ObjectTree`: activate, grupos, selo, foco/filtro.
- `ConnectionWorkspace`, `DatabaseWorkspace`, `ObjectWorkspace`, `DataWorkspace`.
- `S05Lab`: árvore, faixa, abas, persistência, status.
- `shell-chrome`: toolbar, tabstrip, status.
- `MonacoEditor`/`ResultGrid`: novas props/emits.

### E2E
Novo `tests/e2e/workspace-explorer.spec.ts`:
1. árvore e filtro;
2. conexão com cinco grids;
3. banco com oito colunas; clique/duplo clique;
4. oito sub-abas de tabela; grids; CREATE/ALTER read-only; abrir dados;
5. view/evento com matriz correta;
6. criar/fechar consultas, persistir e reiniciar sem metadados;
7. status simulado, temas, 865×480;
8. capturas de evidência.

Atualizar `s05-ui`, `t04-connections`, `s06-persistence`, `shell-chrome`, `s05-lab` e `visual-evidence`. A mudança de “Desconectado” para “Conectado (simulação)” é visual; não há conexão real.

## 5. Implementação futura (documentar, não implementar)

### Fontes MySQL
- Catálogo: `information_schema.SCHEMATA`, `TABLES`, `VIEWS`, `EVENTS`; uma consulta agrupada por banco.
- Estrutura: `COLUMNS`, `STATISTICS`, `KEY_COLUMN_USAGE`, `REFERENTIAL_CONSTRAINTS`, `CHECK_CONSTRAINTS`, `PARTITIONS`, `SHOW CREATE TABLE/VIEW/EVENT`, `SHOW TABLE STATUS`.
- Conexão: `SHOW GLOBAL/SESSION VARIABLES`, `SHOW GLOBAL STATUS`, `SHOW FULL PROCESSLIST`, `Com_%` + `Uptime`.
- Registros: `TABLE_ROWS` é estimativa; não executar `COUNT(*)` automático; exibir “~”.
- Tamanho: `DATA_LENGTH + INDEX_LENGTH`.
- Processos: exige `PROCESS`; `Info` pode conter SQL sensível; truncar/redigir e não logar.
- Permissões: `SHOW VIEW`, `EVENT`, visibilidade por schema; mapear 1044/1045/1142/1143/1146/1227 para erros localizados por seção.

### Arquitetura
- Canais IPC nomeados e validados (`workspace:catalog:load`, `workspace:connection:section`, `workspace:object:detail`, `workspace:object:data`, `workspace:refresh`), sem SQL vindo do renderer e sem invoke genérico.
- Cache por conexão com `fetchedAt` e TTL; refresh manual/ativação; invalidar após DDL próprio; sem polling agressivo.
- Limites P04/A09: 1.000 linhas, 64 MB por resultado, 64 KB por célula, BLOB sob demanda; processos e definições truncados.
- Abas de metadados efêmeras; consultas no schema atual.

### Matriz futura
- Tabela: 8 seções + Dados; edição de estrutura fica fora do MVP.
- View: 4 seções + Dados somente leitura.
- Evento: 4 seções, sem Dados; sem `ALTER EVENT` sem confirmação; ADR 0013 continua bloqueando rotinas/`DELIMITER`.
- Conexão: 5 seções, com permissões e KILL confirmado.

### Riscos e mapeamento
- T05 sessão real; T06 catálogo/estrutura; T07 abas/editor; T10 ações/refresh; T12 regressão/segurança.
- Requisitos atuais não cobrem abas de conexão/banco, views/eventos e ALTER; implementação real exigirá emenda e autorização.
- Riscos: permissões, custo de `information_schema`, estimativas, SQL sensível, eventos desabilitados, versões MySQL/MariaDB e diferença entre simulação e sessão real.

## 6. Verificação

```text
npm run typecheck
npm run lint
npm test
npm run build
npx playwright test tests/e2e/workspace-explorer.spec.ts
npx playwright test tests/e2e/s05-ui.spec.ts
npx playwright test tests/e2e/t04-connections.spec.ts
npx playwright test tests/e2e/s06-persistence.spec.ts
npm run test:e2e
npm run pack:win
npx playwright test tests/e2e/packaged.spec.ts
```

Sem dependências novas. Registrar comandos, resultados, capturas e limitações.

## 7. Ordem e condições de parada

1. Plano/survey.
2. Catálogo/formatação/modelo de abas + testes.
3. Primitivas (tree, tabstrip, grid, Monaco, status).
4. Views e i18n.
5. Integração no S05Lab e persistência de consultas.
6. Testes, e2e e evidência.
7. Relatório, retomada e parada.

Parar se: houver gravação de metadados em YAML; `activeTabId` deixar de ser consulta; duplo clique abrir estrutura e dados; layout estourar 865×480; faltar i18n; houver IPC/MySQL/conexão real; testes existentes exigirem mudança semântica além do status. Não iniciar T05/T07. Ao final, pedir `gitpr`.

## 8. Resultado da execução (2026-11-02)

Protótipo entregue na branch `feat/workspace-explorer-prototype`, sem commit/push pelo agente. Nenhuma condição de parada foi acionada.

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | aprovado |
| `npm run lint` | aprovado |
| `npm test` | 36 arquivos, 257 testes aprovados |
| `npm run build` | aprovado |
| `npx playwright test tests/e2e/workspace-explorer.spec.ts` | 8/8 aprovados |
| Suítes S05/T04/S06 | 25/25 aprovadas |
| `npm run test:e2e` | 35/35 aprovados, 2,1 min |
| `npm run pack:win` + `packaged.spec.ts` | empacotado; 1/1 aprovado |

- Catálogo, formatação e modelo de abas implementados em `src/renderer/src/ui/workspace/`.
- Views de conexão, banco, estrutura, dados e shell global implementadas.
- Árvore, `AppTabStrip`, `ResultGrid`, `MonacoEditor` e `AppStatusBar` estendidos sem dependências novas.
- Persistência preservada: metadados são efêmeros; `activeTabId` permanece consulta; fechar a última consulta recria e salva “Consulta 1”.
- Evidências em `docs/spikes/20261101_workspace-explorer-evidence.md` e capturas em `docs/spikes/evidence/20261101_workspace-explorer/`.

### Pendências fora desta entrega

- Revisão humana do protótipo e do diff.
- T05/T06/T07/T10 continuam não autorizados; a implementação real exige emenda de requisitos.
- ADR 0017 e auditoria de contraste da paleta do T04 continuam pendentes de revisão.
- Limpeza manual dos processos `electron.exe` órfãos.
