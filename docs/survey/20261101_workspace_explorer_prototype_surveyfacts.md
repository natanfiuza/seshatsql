# Survey — protótipo do workspace explorer

Data: 2026-11-01 · Branch de implementação: `feat/workspace-explorer-prototype` · Base: `develop_natan` `4556f3c`
Sessão de grill com o usuário; nenhuma implementação de backend foi autorizada.

## 1. Pedido original

O usuário pediu uma alteração no protótipo para trocar a árvore fixa de tabelas/campos por **Conexão ativa → Banco de dados → tabelas | views | eventos**, com:

- abas da conexão: nome salvo e sub-abas Bancos de dados, Variáveis, Status, Processos e Estatísticas de comandos, todas com quantidade;
- aba “Banco de dados: <nome>” listando tabelas/views/eventos com Nome, Registros, Tamanho, Criado em, Atualizado em, Motor, Comentário e Tipo;
- abas de consulta com opção de adicionar outras sempre visível;
- abas de tabela com Básico, Opções, Índices, Chaves estrangeiras, Restrições CHECK, Partições, Código CREATE e Código ALTER (modelo funcional do HeidiSQL);
- aba Dados separada, como no HeidiSQL;
- views e eventos no mesmo modelo, com planejamento para implementação futura;
- continuidade do plano de retomada pós-T04.

## 2. Decisões das rodadas

### Escopo e entrega
| Decisão | Resposta |
|---|---|
| O que entregar agora | Protótipo de UI com dados fictícios em memória |
| Backend | Sem IPC, MySQL, credenciais, sessão ou schema novo |
| Persistência | Apenas consultas, pelo caminho existente; metadados efêmeros |
| Depois da entrega | Parar para revisão; não iniciar T05 nem T07 |
| Branch | `feat/workspace-explorer-prototype`, de `4556f3c` |
| Git | Agente cria a branch; não faz commit nem push; usuário executa `gitpr` |

### Layout e navegação
| Decisão | Resposta |
|---|---|
| Faixa de abas | Uma faixa única no topo do workspace da direita |
| Consultas | Mantêm editor, resultados e log atuais |
| Metadados | Ocupam o workspace inteiro |
| Árvore | Raiz “Seshat Lab” com selo “Ativa”; bancos; grupos Tabelas/Views/Eventos; sem colunas |
| Clique na árvore | Conexão/banco/objeto abre aba; grupos só expandem/recolhem |
| Conexão simulada | Fixa; sem conectar/desconectar |
| Status | “Conectado (simulação)” + nome + “Dados de exemplo” |

### Abas e conteúdo
| Decisão | Resposta |
|---|---|
| Aba da conexão | Cinco sub-abas com contagens |
| Colunas de Bancos | Nome, Tabelas, Views, Tamanho, Collation |
| Colunas de Variáveis | Variável, Valor, Escopo |
| Colunas de Status | Variável, Valor |
| Colunas de Processos | ID, Usuário, Host, Banco, Comando, Tempo, Estado, Info |
| Colunas de Estatísticas | Comando, Total, Por hora, Por segundo |
| Aba de banco | Uma grade única com as oito colunas pedidas |
| Clique simples/duplo na grade | Simples abre estrutura; duplo abre Dados |
| Tabela | 8 sub-abas + aba de topo “Dados: <nome>” |
| View | 4 sub-abas + Dados |
| Evento | 4 sub-abas, sem Dados |
| Abrir dados | Botão na estrutura + duplo clique na grade do banco |
| Rótulos | Canônicos e traduzidos nos cinco catálogos |

### Consultas
| Decisão | Resposta |
|---|---|
| Criar consulta | “+” e botão “Nova consulta” da toolbar |
| Persistência | Consultas novas/alteradas usam o caminho atual de `tabs_states.yml` |
| Fechar consulta | “×” fecha e persiste |
| Última consulta | Recriar “Consulta 1” vazia e persistir imediatamente |
| `activeTabId` | Sempre uma consulta; metadados não o alteram |
| Startup | Restaura a última consulta ativa; nenhum metadado |
| Títulos | Localizados; metadados efêmeros |

### Catálogo e fidelidade
| Decisão | Resposta |
|---|---|
| Conexão | “Seshat Lab” |
| Bancos | `seshat_lab`, `analytics`, `archive` |
| `seshat_lab` | `customers`, `orders`, `order_items`; `v_customer_totals`; `ev_purge_sessions` |
| `analytics` | `daily_metrics`, `funnel_events`; `v_weekly_revenue` |
| `archive` | `audit_log` |
| Conteúdo | Estático rico: formulários, grids, SQL e amostras |
| Controles | Inertes/somente leitura, com aviso de demonstração |
| HeidiSQL | Referência funcional; sem copiar código/assets/textos |

## 3. Fatos do repositório

### Estado inicial
- Branch `develop_natan`, HEAD `4556f3c`.
- `S05Lab.vue` é o shell provisório com árvore fixa, uma consulta e status “Desconectado”.
- `LabObjectTree.vue` usa `SAMPLE_TABLES`/`SAMPLE_VIEWS`.
- `ObjectTree.vue` tem filtro, expansão, foco móvel e seleção interna; não emite abertura.
- `AppTabStrip.vue` tem “×” e “+” deliberadamente inertes.
- `LabEditorPane.vue` contém a faixa de abas acima do Monaco.
- `LabResultsPane.vue` tem uma sub-aba estática “Resultado 1”.
- `ResultGrid.vue` não emite clique/duplo clique de linha.
- `MonacoEditor.vue` não tem modo somente leitura.
- `AppStatusBar.vue` fixa “Desconectado”.
- `AppToolbar.vue` tem 10 botões; 9 inertes e o de conexões habilitado.
- Persistência de abas: `PersistedTab`/`TabsStateV1`, debounce 500 ms, fila de save, flush no fechamento/troca, `restoreTabs`, padrão `query-1`.
- i18n: en-US, pt-BR, pt-PT, fr, es; `types.ts` tipado; teste de paridade exige mesmas chaves e valores não vazios.
- Testes existentes impõem contratos de geometria/CSS/ARIA; a mudança exigirá atualização.
- `t04-connections.spec.ts`, `s06-persistence.spec.ts` e `s05-lab.test.ts` esperam “Disconnected/Desconectado”.
- `shell-chrome.test.ts` espera “+”/“×” inertes e 9 botões inertes.

### Documentos e limites
- `CLAUDE.md`: renderer sem Node; IPC mínimo e validado; sem driver/credencial no renderer; senhas só DPAPI; YAML validado/versionado; sem `split(';')`; uma sessão de trabalho; sem COMMIT silencioso; código em inglês; UI só via i18n; docs/evidências em português; git somente leitura; relatório por branch.
- `docs/06-backlog.md`: T04 concluído; T05 depende de T04/P02; T06 árvore/estrutura; T07 abas/editor; T10 ações tabela/F5.
- `docs/01-requisitos.md`: cobre R07/R08 (árvore/estrutura), não as novas abas de conexão/banco, views/eventos e ALTER.
- ADR 0013: rotinas/eventos com `DELIMITER` bloqueados; eventos devem ser somente exibição/administração na implementação futura.
- ADR 0012: limites de resultados (1.000 linhas, 64 MB, célula 64 KB).
- Licença do projeto: MPL-2.0. HeidiSQL é referência funcional GPL-2.0 fora do repositório; não copiar código/assets.
- Nenhuma dependência nova é necessária.

### Testes/verificação disponíveis
```text
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run pack:win
npx playwright test tests/e2e/packaged.spec.ts
```
O T04 registrou 215 testes unitários/componente e 27 e2e aprovados antes desta mudança.

## 4. Planejamento futuro levantado

### Dados reais
- Catálogo e árvore via `information_schema.SCHEMATA`, `TABLES`, `VIEWS`, `EVENTS`.
- Estrutura via `COLUMNS`, `STATISTICS`, `KEY_COLUMN_USAGE`, `REFERENTIAL_CONSTRAINTS`, `CHECK_CONSTRAINTS`, `PARTITIONS` e `SHOW CREATE TABLE/VIEW/EVENT`.
- Conexão via `SHOW GLOBAL/SESSION VARIABLES`, `SHOW GLOBAL STATUS`, `SHOW FULL PROCESSLIST` e `Com_%`/`Uptime`.
- Registros são estimativa (`TABLE_ROWS`); não executar `COUNT(*)` automaticamente.
- Tamanho = `DATA_LENGTH + INDEX_LENGTH`.
- Permissões: `PROCESS`, `SHOW VIEW`, `EVENT` e visibilidade por schema; erros localizados por seção.
- Processos podem conter SQL sensível; truncar/redigir e não logar.
- Estatísticas são acumuladas; “por hora/segundo” derivadas do uptime, não taxa instantânea.

### Arquitetura futura
- IPC nomeado/validado por seção; sem SQL de introspecção vindo do renderer; sem invoke genérico.
- Cache por conexão com `fetchedAt`/TTL; refresh manual e ao ativar; invalidação após DDL.
- Reutilizar limites P04/A09; sem N+1 de metadados; uma consulta agrupada por seção.
- Abas de metadados efêmeras; consultas no schema atual.
- T05 sessão real; T06 catálogo/estrutura; T07 abas/editor; T10 ações/refresh; T12 regressão/segurança.
- Requisitos precisam de emenda e autorização antes da implementação real.

## 5. Riscos identificados

- Layout de 865×480 com oito sub-abas: rolagem interna obrigatória, sem rolagem da página.
- Duplo clique dispara clique antes; usar timer curto e testar.
- Alterar o status quebra e2e de T04/S06; atualizar e documentar que não há conexão real.
- `v-show` da consulta mantém Monaco/AG Grid montados; validar relayout.
- Títulos de consulta gerados por ID podem sobrescrever títulos restaurados; sem rename nesta fase.
- Datas/tamanhos pré-formatados ordenam lexicograficamente; aceitável no protótipo.
- Não copiar texto/assets do HeidiSQL; usar apenas comportamento funcional e rótulos técnicos.
- 104 processos `electron.exe` órfãos de execuções anteriores; limpar manualmente antes de e2e pesado.

## 6. Entrega (2026-11-02)

O protótipo foi implementado conforme as decisões acima, sem backend nem persistência nova. `npm run typecheck`, `npm run lint`, `npm test` (36 arquivos/257 testes), `npm run build`, `npm run test:e2e` (35/35) e `npm run pack:win` passaram; o e2e empacotado fechou 1/1. Evidência e limitações em `docs/spikes/20261101_workspace-explorer-evidence.md`. T05/T06/T07/T10 permanecem não autorizados; a implementação real depende de emenda de requisitos e novo plano.
