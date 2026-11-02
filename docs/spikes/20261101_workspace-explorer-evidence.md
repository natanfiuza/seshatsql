# Evidência — protótipo do workspace explorer (2026-11-01/02)

Escopo conforme o plano aprovado em `docs/plans/feat/workspace-explorer-prototype/20261101_workspace_explorer_prototype_plansfacts.md`: árvore **Conexão ativa → banco → Tabelas | Views | Eventos**, abas da conexão, aba de banco com inventário, estrutura de tabela/view/evento no modelo funcional do HeidiSQL e aba de dados separada. Tudo com dados fictícios em memória: **sem IPC novo, MySQL, credenciais, sessão real ou schema de persistência novo**. Metadados são abas efêmeras; apenas consultas usam `tabs_states.yml`.

Ambiente: Windows 11 Pro 10.0.26300, Electron 45.1.0, aplicativo compilado em `out/` e pacote `dist/win-unpacked`. Todas as execuções e2e usam `SESHAT_DATA_DIR` e `SESHAT_USER_DATA_DIR` temporários — nenhum perfil real do usuário foi lido ou escrito.

## Comandos e resultados

| Comando | Resultado em 2026-11-02 |
|---|---|
| `npm run typecheck` | aprovado, sem erros |
| `npm run lint` | aprovado, sem erros (warnings de formatação corrigidos) |
| `npm test` | **36 arquivos, 257 testes aprovados** |
| `npm run build` | aprovado |
| `npx playwright test tests/e2e/workspace-explorer.spec.ts` | **8/8 aprovados** |
| `npx playwright test tests/e2e/s05-ui.spec.ts tests/e2e/t04-connections.spec.ts tests/e2e/s06-persistence.spec.ts` | **25/25 aprovados** |
| `npm run test:e2e` (todas as suítes) | **35/35 aprovados**, 2,1 min |
| `npm run pack:win` | concluído; `dist/win-unpacked` |
| `npx playwright test tests/e2e/packaged.spec.ts` | **1/1 aprovado** (incluído na suíte completa) |

## Capturas

Diretório `docs/spikes/evidence/20261101_workspace-explorer/`, capturadas pelo próprio e2e em `en-US`:

| Arquivo | Conteúdo |
|---|---|
| `connection_databases.png` | aba da conexão “Seshat Lab”, sub-abas com contagens e grade de bancos |
| `database_seshat_lab.png` | aba “Database: seshat_lab” com as oito colunas |
| `table_basic.png` | “Table: customers” com as oito sub-abas de estrutura |
| `table_indexes.png` | grade de índices da tabela |
| `table_create_code.png` | SQL CREATE em Monaco somente leitura |
| `data_customers.png` | aba de topo “Data: customers” com amostra |
| `view_structure.png` | “View: v_customer_totals” com quatro sub-abas e botão de dados |
| `event_structure.png` | “Event: ev_purge_sessions” com quatro sub-abas e sem dados |
| `query_dark_865x480.png` | faixa global e workspace em tema escuro no tamanho mínimo |

## Medições funcionais (e2e real)

1. **Árvore** — mostra “Seshat Lab” com o selo “Active”, os bancos `seshat_lab`, `analytics` e `archive`, grupos contados (“Tables (3)”) e respeita o filtro local. A conexão e os bancos/grupos já iniciam expandidos.
2. **Conexão** — o clique na raiz abre a aba “Seshat Lab” com cinco sub-abas: Databases (3), Variables (7), Status (6), Processes (4) e Command statistics (6). As colunas de bancos, variáveis e processos foram verificadas no DOM.
3. **Banco** — a aba “Database: seshat_lab” lista 5 objetos com Nome, Registros, Tamanho, Criado em, Atualizado em, Motor, Comentário e Tipo. Clique duplo abre “Data: customers” **sem** abrir a estrutura; clique simples abre “Table: customers”.
4. **Tabela** — as oito sub-abas aparecem na ordem esperada; Índices, Chaves estrangeiras, Restrições CHECK e Partições têm grades; CREATE e ALTER abrem Monaco somente leitura (tentativa de digitação não altera o conteúdo); “Abrir dados” cria a aba de dados com 4 linhas de amostra.
5. **View/evento** — a view tem quatro sub-abas e botão de dados; o evento tem quatro sub-abas e **nenhum** botão de dados.
6. **Consultas** — “+”, “Nova consulta” e “×” criam e fecham abas; fechar a última recria e persiste “Query 1”. Após reiniciar, apenas consultas são restauradas; a aba de metadados “Seshat Lab” não reaparece.
7. **Status e layout** — a barra mostra “Connected (simulation)” + “Seshat Lab” + “Sample data”; em 865×480 e tema escuro a faixa global e o “+” continuam visíveis e a página não rola.

## Cobertura unitária e de componentes

- **Modelo de abas** (`workspace-tabs.test.ts`): IDs determinísticos, deduplicação, abrir/fechar metadados, separação entre `activeId` persistido e `activeWorkspaceId`, preservação de sub-aba e numeração de consultas.
- **Catálogo** (`workspace-catalog.test.ts`): contagens por banco/grupo, objetos válidos, SQL/estrutura completos, tabelas/views com amostra e eventos sem dados.
- **Formatação** (`workspace-format.test.ts`): bytes, datas, números, estimativas e nulos nos locales cobertos.
- **Árvore** (`tree.test.ts`, `object-tree.test.ts`): `nodeKind`/selo preservados no filtro/flatten, ativação por conexão/banco/objeto, grupos apenas expandindo e selo “Ativa” exposto.
- **Views** (`workspace-views.test.ts`): cinco sub-abas contadas, colunas das grades, timer de 250 ms do clique simples contra duplo clique, limpeza do timer, matriz de 8/4 sub-abas, Monaco somente leitura e botão de dados condicionado ao tipo.
- **Shell** (`s05-lab.test.ts`, `shell-chrome.test.ts`): abertura pela árvore, faixa única, criação/fechamento de consultas, metadados sem gravação em `tabs_states.yml`, “Nova consulta” habilitada e status simulado.
- **i18n**: teste de paridade garante as mesmas chaves e valores não vazios nos cinco catálogos.

## Comportamentos observados que condicionam a UI

- **Dois IDs ativos**: `activeId` é sempre uma consulta e é o único gravado em `activeTabId`; `activeWorkspaceId` é a aba visível e pode ser um metadado. Fechar um metadado ativo volta para `activeId`.
- **Clique simples versus duplo**: a grade do banco usa um timer de 250 ms; o duplo clique cancela o agendamento e abre apenas Dados. O timer é limpo no unmount.
- **Persistência das consultas**: criar/fechar consultas continua passando pelo debounce, fila de save e `flushTabs`; metadados nunca alteram o YAML.
- **Consulta montada**: a consulta ativa permanece montada com `v-if` por aba; ao alternar para metadados, Monaco/AG Grid são desmontados e remontados, sem relayout pendente observado.
- **Títulos**: a primeira consulta continua seguindo o idioma da interface; as novas consultas usam título localizado com número sequencial.

## Limitações e pendências registradas

- **Não há conexão real**: o status “Connected (simulation)” é apenas visual. Nenhum IPC, driver, credencial, sessão, refresh ou edição foi implementado.
- **Dados estáticos**: registros são estimativas fictícias (`~`) e tamanhos/datas são pré-formatados; a ordenação dessas colunas é lexicográfica no protótipo.
- **Eventos**: exibição apenas; nenhuma ação de ALTER/administração, consistente com o ADR 0013 para implementação futura.
- **Sem edição**: formulários desabilitados, grids somente leitura e SQL CREATE/ALTER em Monaco `readOnly`, com aviso de demonstração.
- **HeidiSQL** foi usado apenas como referência funcional; nenhum código, asset ou texto foi copiado.
- A implementação real de catálogo/estrutura/dados depende de autorização de T05/T06/T07/T10 e de emenda de requisitos; as fontes MySQL e os riscos estão no plano/survey, não foram implementados.
- A máquina de desenvolvimento segue com processos `electron.exe` órfãos de execuções anteriores; a limpeza é manual.
- Nenhuma dependência nova foi adicionada.
