# Retomada — T04 concluído e protótipo do workspace explorer entregue

Criado em 2026-10-31 · Atualizado em 2026-11-02 · Branch atual `feat/workspace-explorer-prototype` (base `develop_natan` `4556f3c`)
Este arquivo existe para continuar o trabalho sem depender da conversa anterior. Leia `CLAUDE.md` antes de agir: ele prevalece sobre tudo o que está aqui. O T04 está concluído; o protótipo do workspace explorer foi implementado na branch da feature, **sem commit/push pelo agente**. Nenhuma etapa seguinte está autorizada.

## 1. Primeira mensagem de amanhã (copiar e colar)

> Leia `CLAUDE.md`, `docs/plans/develop_natan/20261101_retomada_pos_t04_plansfacts.md` e `docs/plans/feat/workspace-explorer-prototype/20261101_workspace_explorer_prototype_plansfacts.md`. Confirme o estado do repositório e revise o protótipo do workspace explorer. Não inicie T05/T06/T07/T10 sem minha autorização explícita; se eu autorizar, primeiro faça o grill/plano da etapa e aguarde aprovação. Ao final, peça o `gitpr`.

## 2. Estado do repositório

| Item | Estado em 2026-11-02 |
| --- | --- |
| Branch de trabalho | `feat/workspace-explorer-prototype` |
| Base | `develop_natan` `4556f3c` |
| HEAD da feature | `4556f3c` (nenhum commit do agente; alterações ainda não commitadas) |
| Commit/PR | Pendentes; o usuário executa com `gitpr` |
| T04 | Implementado, verificado e commitado em `4556f3c` |
| ADR 0017 | **Proposto** — aguarda revisão humana |
| Protótipo do workspace explorer | Implementado e verificado; aguarda revisão |
| T05/T06/T07/T10 | **Não iniciados e não autorizados** |

## 3. Última entrega — protótipo do workspace explorer (2026-11-02)

Plano: `docs/plans/feat/workspace-explorer-prototype/20261101_workspace_explorer_prototype_plansfacts.md`.
Survey: `docs/survey/20261101_workspace_explorer_prototype_surveyfacts.md`.
Evidência: `docs/spikes/20261101_workspace-explorer-evidence.md`.
Relatório: `docs/claude-code/reports/feat/workspace-explorer-prototype/20261102_workspace_explorer_prototype.md`.

### O que foi entregue

- Árvore **Conexão ativa → banco → Tabelas | Views | Eventos**, com raiz “Seshat Lab” e selo “Ativa”, sem colunas.
- Aba da conexão com cinco sub-abas contadas: Bancos de dados, Variáveis, Status, Processos e Estatísticas de comandos.
- Aba “Banco de dados: `<nome>`” com Nome, Registros, Tamanho, Criado em, Atualizado em, Motor, Comentário e Tipo; clique simples abre estrutura e duplo clique abre Dados.
- Tabela com Básico, Opções, Índices, Chaves estrangeiras, Restrições CHECK, Partições, Código CREATE e Código ALTER; aba de topo “Dados: `<nome>`” e botão “Abrir dados”.
- View com quatro sub-abas de estrutura + Dados; evento com quatro sub-abas e sem Dados.
- Faixa global de abas com “+” sempre visível; consultas criadas/fechadas pela faixa e pela toolbar; fechar a última recria e persiste “Consulta 1”.
- Status “Conectado (simulação)” + “Seshat Lab” + “Dados de exemplo”.
- Tudo com dados fictícios em memória: sem IPC novo, MySQL, credenciais, sessão real ou schema de persistência novo. Metadados são efêmeros; apenas consultas vão para `tabs_states.yml`.

### Verificação executada

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | aprovado |
| `npm run lint` | aprovado |
| `npm test` | 36 arquivos, 257 testes aprovados |
| `npm run build` | aprovado |
| `npx playwright test tests/e2e/workspace-explorer.spec.ts` | 8/8 aprovados |
| Suítes S05/T04/S06 | 25/25 aprovadas |
| `npm run test:e2e` | 35/35 aprovados, 2,1 min |
| `npm run pack:win` + `packaged.spec.ts` | empacotado; 1/1 aprovado |

### Pontos de atenção na revisão

- O status “Conectado (simulação)” é apenas visual; **não há conexão real**.
- Datas e tamanhos são pré-formatados; a ordenação dessas colunas é lexicográfica no protótipo.
- Eventos são somente exibição; nenhuma ação de administração/ALTER foi implementada.
- Nenhum código, asset ou texto do HeidiSQL foi copiado; apenas o comportamento funcional foi usado como referência.
- A implementação real de catálogo/estrutura/dados exige autorização de T05/T06/T07/T10 e emenda de requisitos.

## 4. O que foi entregue no T04

- CRUD de perfis de conexão **sem conectar nem testar**, em modal mestre-detalhe aberto por **Ferramentas > Conexões…** e pelo botão da toolbar.
- Quatro ambientes canônicos: `development`, `staging`, `production`, `custom`; `custom` exige rótulo de 1–32 caracteres.
- Paleta fixa de oito cores, armazenada `#rrggbb` em minúsculas; a lista mostra cor, nome e ambiente, sem depender só de cor.
- Criação sem id; o main gera UUID. Edição exige id existente (`not-found`, sem upsert); nome único após trim e sem diferenciar caixa (`duplicate-name`).
- Senha write-only em DPAPI: omitir preserva o ciphertext byte a byte, digitar substitui, “Remover senha salva” grava `null`; o renderer recebe apenas `hasPassword`.
- `connections.yml` em `schemaVersion: 2`, com migração v1→v2 em memória, `.bak` igual ao texto original e sem quarentenar arquivo válido. v3 futuro continua bloqueado e intacto.
- Exclusão em duas etapas com aviso D7-04; `tabs_states.yml` não é tocado e o SQL das abas sobrevive.
- Defeito corrigido: o `v-model` numérico convertia a porta para `number` e quebrava `.trim()`; a validação e o payload agora normalizam com `String(...)` e há teste de regressão.

## 5. Pontos abertos e próximos passos

### 5.1 Revisão do protótipo

1. Revisar o diff da branch `feat/workspace-explorer-prototype` e as capturas em `docs/spikes/evidence/20261101_workspace-explorer/`.
2. Confirmar layout em 865×480, tema escuro e comportamento de clique simples/duplo na grade do banco.
3. Confirmar que o status simulado e os dados fictícios são aceitáveis para revisão.
4. Executar `gitpr` para commit e pull request.

### 5.2 Revisão do T04

1. Revisar o diff do commit `4556f3c`.
2. Revisar o **ADR 0017** (`docs/adr/0017-perfis-conexao-ui-migracao-v2.md`), ainda proposto.
3. Confirmar a política de rascunho e os avisos de migração no banner do shell.
4. A paleta ainda não teve auditoria formal de contraste WCAG.

### 5.3 Próxima etapa possível: T05 — conectar/desconectar e sessão compartilhada

O backlog define T05 como “uma sessão de trabalho, auxiliar de controle; transação/falhas corretas” (depende de T04 e P02). **Não implementar sem autorização.**

Antes do T05:

- Resolver ou registrar P02: fechar com transação/execução ativa exige decisão concreta; não pode haver commit silencioso.
- Planejar a conexão real com `mysql2 3.24.6`, incluindo uma sessão de trabalho compartilhada e uma auxiliar apenas para controle/cancelamento.
- Manter credenciais e ciphertext no main; nenhum driver, senha ou invoke genérico no renderer.
- Não repetir SQL após falha de rede; estado `unknown` deve ser explícito.
- Se usar banco real, usar apenas MySQL descartável autorizado; nunca perfis reais do usuário. O ambiente histórico dos spikes era MySQL 8.4.13 em `127.0.0.1:3307`, schema `seshat_spike`, com senha somente em `SESHAT_DB_PASSWORD` — confirmar que ele ainda existe antes de usar.
- T06/T07/T10 (catálogo real, abas/editor, ações/refresh) exigem emenda de requisitos para as abas de conexão/banco, views/eventos e ALTER.
- T11 (Preferências completas) e T13 (instalador) continuam fora de escopo.

### 5.4 Limpeza manual pendente

A máquina acumulou processos `electron.exe` órfãos de execuções e2e anteriores. A limpeza automática foi negada pela política de permissões; fechar manualmente os processos remanescentes antes de novas execuções pesadas.

## 6. Observações do repositório

- O commit do T04 incluiu um relatório `.gitpr/reports/pr_desc/develop_natan_20261031193604_PR_DESC.md`.
- Restam não rastreados artefatos `.gitpr` de execuções anteriores; decidir com o usuário se devem ser removidos ou ignorados. Não apagar sem essa decisão.
- O `package-lock.json` e as versões do T00 permanecem válidos; nem o T04 nem o protótipo adicionaram dependências.

## 7. Documentos para ler antes de agir

- `CLAUDE.md` — contrato de execução e limites.
- `docs/plans/feat/workspace-explorer-prototype/20261101_workspace_explorer_prototype_plansfacts.md` — plano e resultado do protótipo.
- `docs/survey/20261101_workspace_explorer_prototype_surveyfacts.md` — decisões e fatos levantados.
- `docs/spikes/20261101_workspace-explorer-evidence.md` — comandos, resultados, capturas e limitações.
- `docs/claude-code/reports/feat/workspace-explorer-prototype/20261102_workspace_explorer_prototype.md` — relatório final da entrega.
- `docs/claude-code/reports/develop_natan/20261031_t04_connection_profiles.md` — relatório final do T04.
- `docs/adr/0017-perfis-conexao-ui-migracao-v2.md` — decisões do T04, ainda propostas.
- `docs/adr/0016-persistencia-yaml-dpapi.md` — base de persistência e nota de atualização v2.
- `docs/06-backlog.md`, `docs/04-pendencias.md` e `docs/01-requisitos.md` — T05, P02 e requisitos vigentes.

## 8. Encerramento

- Git é somente leitura para o agente: não executar `git commit` nem `git push`; nenhuma operação GitHub.
- Ao final de qualquer etapa, entregar diff, comandos/resultados, riscos, pendências e documentos atualizados, então **aguardar revisão**.
- Pedir ao usuário que execute `gitpr` para commit e pull request.
- Uma etapa por vez: não iniciar T05/T06/T07/T10 por conta própria.
