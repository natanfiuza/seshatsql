# Survey — T04: perfis, preferências, DPAPI e YAML
Data: 2026-10-31 · Branch `develop_natan` · Fonte: `/grill-with-docs` e exploração do repositório
Plano correspondente: `docs/plans/develop_natan/20261031_t04_profiles_preferences_dpapi_plansfacts.md`

## 1. Contexto da tarefa

O S06 foi concluído e verificado com 153 testes unitários/componente, 18 e2e e pacote Windows: três arquivos YAML, senha somente DPAPI, escrita atômica, migração genérica, quarentena e handshake de fechamento. Ainda não há UI de perfis. O T04 deve entregar o CRUD de perfis, fechando R03, R04, R18, R19, A02 e A12, sem iniciar T05 (conexão), T07 (abas/editor), T11 (Preferências completas) ou T13 (instalador).

## 2. Estado do repositório no início

- `HEAD` = `fd472a7`; branch `develop_natan`.
- Runtime: Electron 45.1.0, electron-vite 6.0.0, Vite 8.3.5, TypeScript 6.0.3, Vue 3.5.44, vue-i18n 11.4.16, Monaco 0.57.0, AG Grid 36.2.0.
- Dependências de persistência: `yaml` 2.9.1 (ISC), `zod` 4.6.7 (MIT); `mysql2` 3.24.6 presente, ainda sem uso em `src`.
- Persistência: `~/.seshatsql/data` com `preferences.yml`, `tabs_states.yml` e `connections.yml`; schemaVersion 1; `PublicConnection` com `hasPassword`; sem ciphertext no renderer.
- UI: shell denso `S05Lab` com menu, toolbar, árvore, abas, Monaco, AG Grid, log e status; não há componente de modal/diálogo nem `Teleport`; o único padrão de confirmação é inline em `PersistenceBanner.vue`.
- Entradas existentes de menu/toolbar são inertes (`aria-disabled`, tooltip único); Ferramentas só tem Preferências; a barra de status é somente exibição.
- i18n: catálogos en-US, pt-BR, pt-PT, fr e es com teste de paridade; todo texto visível vem dos catálogos.

## 3. Contratos e pontos de inserção levantados

### 3.1 Domínio
- `src/domain/persistence/types.ts`: `PERSISTENCE_SCHEMA_VERSION = 1`, `PersistedConnection` com `environment: string` e `color: string` sem regra, `ConnectionsV1`, `PublicConnection` sem rótulo, `EMPTY_CONNECTIONS` v1.
- `src/domain/persistence/schemas.ts`: `parseVersioned` usa a versão global; schema de conexões tolera cor/ambiente amplos; `connectionsSchema` exige literal 1. Sem parametrizar a versão, um arquivo v2 seria classificado como futuro.
- `src/domain/persistence/redaction.ts`: `toPublicConnection` copia id, nome, cor, ambiente, host, porta e usuário + `hasPassword`.

### 3.2 Aplicação e main
- `ConnectionsService.save` faz upsert por `input.id`, sem geração de id, trim, unicidade ou distinção criação/edição.
- `connectionInputSchema` exige id, aceita usuário vazio, cor e ambiente amplos.
- `src/main/persistence.ts` compõe os três stores; o de conexões não registra `migrations`.
- Canais existentes: `connections:list`, `connections:save`, `connections:delete`; nenhum canal de teste/conexão.
- `YamlFileStore` já implementa `migrations`, revalidação, aviso `migrated` e backup `.bak` do original antes do rename; teste existente em `tests/unit/yaml-file-store.test.ts` comprova o padrão.

### 3.3 Renderer
- `menu.ts` define apenas `id`/`labelKey`, todos inertes; `AppMenuBar.vue` trata todos como `aria-disabled` e não emite ação.
- `AppToolbar.vue` tem 10 botões inertes e dois combos funcionais.
- `S05Lab.vue` compõe o shell, restaura/grava abas, persiste tema/idioma e envia cópias planas no IPC; não usa conexões.
- `PersistenceBanner.vue` serve de referência para confirmação inline em duas etapas.

## 4. Lacunas identificadas

- Não há layout de diálogo, gestão de foco, `aria-modal`, Escape ou retorno de foco.
- Não há validação de formulário de perfil, test-connection, lista de preferências nem formato de cor.
- Não há unicidade de nome nem id garantido pelo main.
- Não há distinção entre criar e editar, nem erro `not-found`.
- Não há campo textual para ambiente personalizado (R04 exige quatro ambientes).
- O schema v1 não comporta rótulo nem enum sem migração.
- Testes existentes de conexões, S06 e shell assumem v1, ids fixos e todos os itens inertes; precisarão ser ajustados.

## 5. Decisões das rodadas

### Rodada 1
- CRUD sem conectar.
- Modal “Conexões” (menu Ferramentas + toolbar); tema/idioma permanecem nos combos.
- Ambiente inicialmente dev/test/prod, corrigido na rodada seguinte.
- Senha write-only com opção de remover.

### Rodada 2
- Quatro ambientes (`development|staging|production|custom`) com rótulo obrigatório no personalizado (R04).
- Paleta fixa de 8 hex.
- Main gera UUID; edição exige id existente (`not-found`); nome único (`duplicate-name`).
- Modal mestre-detalhe lista + formulário.

### Rodada 3
- `connections.yml` schemaVersion 2 com migração v1→v2.
- Exclusão em duas etapas com aviso D7-04; abas intocadas.
- Obrigatórios + senha opcional; trim exceto senha; erros inline e foco; dica DPAPI.
- Entrada por menu + toolbar; status somente exibição; Preferências inerte.
- Menu HTML e combos de tema/idioma inalterados.

### Rodada 4 (fechamento)
- Fechar o app com rascunho sujo descarta o rascunho (handshake só de abas).
- Após salvar, diálogo permanece aberto, seleciona o salvo e limpa a senha.
- Lista ordenada por nome case-insensitive; YAML preserva a ordem de criação.

## 6. Fatos técnicos que condicionam a implementação

- Proxies reativos da Vue não são clonáveis pelo IPC; o formulário deve enviar objeto plano.
- `randomUUID` é nativo do Node/Electron; não há dependência nova.
- O store já oferece migração e backup; a migração de conexões só precisa ser registrada em `src/main/persistence.ts`.
- Um arquivo v2 sem `parseVersioned` parametrizado seria lido como futuro e bloquearia a escrita.
- A versão 1 de preferências/abas não deve ser alterada; só conexões passa a 2.
- O renderer não pode receber senha nem ciphertext; a UI vê apenas `hasPassword` e o rótulo de ambiente.
- O contrato de fechamento atual só pergunta ao renderer sobre abas; incluir rascunho exigiria ampliar o handshake e os testes e2e, o que foi descartado.
- O layout mínimo da janela é 865×480; o modal não pode criar rolagem de página.
- O catálogo i18n tem teste de paridade nos cinco idiomas.

## 7. Riscos levantados

1. Migração quarentenar v1 válido, perder ciphertext ou gerar `.corrupt-*`.
2. Builds antigas interpretarem v2 como futuro após rollback.
3. Legado com nome duplicado, usuário vazio ou `custom` sem rótulo carregar, mas falhar ao salvar sem mensagem clara.
4. Unicidade fora da fila serializada permitir corrida.
5. Edição com id desconhecido fazer upsert silencioso.
6. Falha DPAPI gravar ou apagar ciphertext.
7. Foco preso/ARIA/Escape incorretos ou modal estourar 865×480 em fr/es.
8. Cores da paleta com contraste ruim em tema claro/escuro.
9. Reintroduzir o defeito de encerramento no coordenador.
10. Testes existentes de S06/shell quebrarem por contagens e schemas.
11. Enviar proxy Vue pelo IPC e falhar silenciosamente.
12. Mensagens fixas no código em vez de i18n.
13. Escopo crescer para conexão/teste, abas ou Preferências.
14. Regressão de abas/SQL ao excluir perfil.
15. Escrita de v2 em arquivo legado sem backup verificável.
16. Perda de `id` legado como `local` ao exigir UUID no schema.
17. Cor fora da paleta em arquivo editado à mão impedir a edição.
18. Exclusão sem aviso D7-04 induzir perda de contexto da aba.

## 8. Condições de parada registradas

Parar e reportar se migração válida for quarentenada, se houver senha em claro em arquivo/log/renderer, se falha DPAPI ainda gravar, se v2 for sobrescrito como futuro, se a unicidade não for serializada, se edição desconhecida fizer upsert, se ARIA/foco falhar, se houver regressão S05/S06 sem decisão do usuário ou se for necessária dependência/escopo novo. Nenhum commit/push; ao final pedir `gitpr`.
