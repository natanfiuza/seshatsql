# Plano — T04: perfis de conexão, preferências, DPAPI e YAML
Data: 2026-10-31 · Branch `develop_natan` · Origem: `/grill-with-docs` e decisões do usuário
Survey correspondente: `docs/survey/20261031_t04_profiles_preferences_dpapi_surveyfacts.md`

## 1. Contexto

O S06 entregou a persistência real (três YAML, DPAPI, validação/versionamento, escrita atômica, recuperação e handshake de fechamento), mas não existe UI de perfis. O T04 fecha o critério de saída “salvar/reabrir sem senha clara; perfis com cor/ambiente” (`docs/06-backlog.md:9`), cobrindo R03, R04, R18, R19, A02 e A12. Ficam fora T05 (conectar/desconectar), T07 (abas/editor), T11 (Preferências/temas/i18n completos) e T13 (instalador).

## 2. Decisões confirmadas pelo usuário

| # | Decisão |
|---|---|
| D-T04-01 | T04 = CRUD de perfis; sem testar nem conectar. |
| D-T04-02 | Modal mestre-detalhe “Conexões”, aberto por Ferramentas > Conexões… e pelo botão “Desconectado” da toolbar. Status só exibe; Preferências segue inerte; tema/idioma seguem nos combos. |
| D-T04-03 | Ambiente `development | staging | production | custom`; `custom` exige rótulo 1–32 com trim. |
| D-T04-04 | Cor = paleta fixa de 8 hex, armazenada `#rrggbb` minúsculo, obrigatória; lista mostra amostra + nome + ambiente, nunca só cor. |
| D-T04-05 | Criação sem id; main gera `randomUUID()`. Edição exige id existente; id desconhecido = `not-found`, sem upsert. Nome único case-insensitive com trim (`duplicate-name`). |
| D-T04-06 | Senha write-only: campo vazio preserva o ciphertext; digitar substitui; “Remover senha salva” envia `null`; dica DPAPI sempre visível; sem novo canal de disponibilidade. |
| D-T04-07 | `connections.yml` passa a schemaVersion 2, com migração v1→v2 em memória; original em `.bak`, sem quarentena de arquivo válido. |
| D-T04-08 | Obrigatórios: nome, host, porta (3306 padrão, 1–65535), usuário, ambiente, cor e rótulo quando `custom`. Trim em texto, nunca na senha; erros inline com foco no primeiro. |
| D-T04-09 | Exclusão em duas etapas com aviso D7-04 (SQL das abas preservado; referência fica indisponível); abas não são tocadas. |
| D-T04-10 | Lista ordenada por nome (case-insensitive); o YAML preserva a ordem de criação. Diálogo com foco preso, Escape, `aria-modal`, foco devolvido e clique no fundo sem fechar. |
| D-T04-11 | Após salvar, o diálogo permanece aberto, recarrega, seleciona o perfil salvo e limpa a senha. |
| D-T04-12 | Fechar o aplicativo com rascunho sujo descarta o rascunho; fechar o diálogo, trocar de perfil ou iniciar Novo pede confirmação de descarte. |

## 3. Modelo e migração

### 3.1 Tipos
- `PERSISTENCE_SCHEMA_VERSION = 1` permanece para preferências e abas.
- `CONNECTIONS_SCHEMA_VERSION = 2`; `CONNECTION_ENVIRONMENTS` com os quatro valores.
- `ConnectionsV2` e `PersistedConnection` com `environment` e `environmentLabel`.
- Tipos legados `ConnectionsV1`/`PersistedConnectionV1` restritos à migração e aos testes.
- `PublicConnection` ganha `environmentLabel`; `EMPTY_CONNECTIONS` passa a v2; `ConnectionFailureReason` ganha `duplicate-name`.

### 3.2 Paleta
`src/domain/persistence/connection-palette.ts` é fonte única para schema, IPC, migração e UI:
`#2563eb`, `#16a34a`, `#d97706`, `#dc2626`, `#7c3aed`, `#0d9488`, `#db2777`, `#4b5563`.
`DEFAULT_CONNECTION_COLOR = '#2563eb'`; guard `isConnectionColor()`; cada cor tem nome i18n.

### 3.3 Schema e migração
- `parseVersioned(raw, schema, currentVersion)` parametrizado: preferências/abas usam 1; conexões usam 2.
- Schema v2 estrito: id 1–128 (sem exigir UUID), nome 1–100, host 1–253, porta 1–65535, usuário 0–128 no arquivo, cor `#RRGGBB` normalizada para minúsculas, ambiente enum, `environmentLabel` 1–32 apenas com `custom`, senha DPAPI anulável, ids duplicados inválidos e nomes duplicados tolerados.
- `custom` + rótulo `null` é tolerado no schema persistido somente para carregar legado; IPC e formulário exigem rótulo.
- `migrateConnectionsV1ToV2(raw)` valida v1 e lança se inválido; mapeia ambiente (trim, lowercase, sem acentos):
  - `dev|development|desenvolvimento` → `development`;
  - `test|staging|homologacao|homologação` → `staging`;
  - `prod|production|producao|produção` → `production`;
  - vazio/desconhecido → `custom`, com o texto original aparado como rótulo ou `null`.
- Ambiente reconhecido recebe rótulo `null`; cor válida normaliza para minúsculas e cor inválida vira `#2563eb`; id, nome, host, porta, usuário e ciphertext são preservados.
- `YamlFileStore` já migra, revalida, emite `migrated` e copia o original para `.bak` antes do rename.

### 3.4 IPC e serviço
- `connectionInputSchema`: id opcional; nome/host/usuário com trim e limites; porta inteira; cor da paleta; ambiente enum; rótulo obrigatório em `custom` e proibido fora; senha até 4096, `null` ou omitida.
- Nenhum canal novo.
- `ConnectionsService` recebe `generateId` injetável (padrão `randomUUID`). `save` na fila serializada: carrega; cria sem id ou retorna `not-found` para id inexistente; verifica nome único antes de cifrar; senha omitida preserva, `null` limpa, string cifra; grava v2 e devolve `PublicConnection`.
- `delete`, `resolvePassword` e `list` permanecem; redaction nunca inclui segredo.

## 4. UI

### 4.1 `AppDialog`
`src/renderer/src/ui/shell/AppDialog.vue`: `Teleport to body`, backdrop sem clique, `role="dialog"`, `aria-modal`, `aria-labelledby`; foco inicial, armadilha de Tab/Shift+Tab recalculada, `focusin` redirecionado, Escape emite `request-close`; foco devolvido ao fechar com fallback; tokens existentes; cabe em 865×480.

### 4.2 `ConnectionsDialog`
`src/renderer/src/ui/connections/ConnectionsDialog.vue`: recarrega `list()` a cada abertura, após salvar e após excluir; lista ordenada com cor, nome, ambiente/rótulo e `host:porta`; modos criação/seleção; Novo limpa o rascunho; guarda de alterações inline; exclusão em duas etapas com aviso D7-04; avisos de escrita bloqueada (`future-version`, `read-failed`, `file-too-large`); erros tipados no formulário; após salvar mantém aberto e seleciona o salvo.

### 4.3 `ConnectionForm`
`src/renderer/src/ui/connections/ConnectionForm.vue`: nome, host, porta, usuário, senha, remover senha, ambiente, rótulo custom e paleta de 8 cores com nome. Senha sempre vazia ao abrir; placeholder conforme `hasPassword`; digitar desmarca remover e marcar remove limpa o campo. Payload plano, id só em edição, rótulo `null` fora de custom, senha omitida/`null`/string. Módulos puros `validation.ts` e `presentation.ts`; erros inline com `aria-invalid`, `aria-describedby`, `role="alert"` e foco no primeiro.

### 4.4 Shell e i18n
- `menu.ts`: itens com `enabled`/`action`; Ferramentas tem Conexões… habilitado e Preferências inerte.
- `AppMenuBar.vue`: item habilitado emite `activate` por clique/Enter/Espaço e fecha; inertes mantêm `aria-disabled` e tooltip.
- `AppToolbar.vue`: botão Desconectado vira entrada de conexões (`data-testid="connections-trigger"`); os outros 9 continuam inertes.
- `S05Lab.vue`: `connectionsOpen`, captura síncrona do foco e handlers; fechamento do app descarta rascunho; abas/SQL intactos.
- `types.ts` e cinco catálogos recebem `connections.*`, `shell.menu.toolsConnections` e `shell.toolbar.connections`, com paridade obrigatória.

## 5. Testes

### Unitários
Paleta; schemas v2 e classificação de versões; migração (aliases, cor, rótulo, ciphertext, v1 inválido); `YamlFileStore` com `.bak` e `migrated`; serviço (id, not-found, duplicidade, senha, concorrência, redaction); validação/presentation da UI; paridade i18n.

### Componentes
`AppDialog` (ARIA, foco, Escape, backdrop); `ConnectionForm` (payload e validação); `ConnectionsDialog` (carga, criação, edição, senha, duplicidade, exclusão, guarda, bloqueio, pós-salvar); menu, toolbar e S05Lab.

### E2E
Novo `tests/e2e/t04-connections.spec.ts` cobre criação/restart sem conectar, edição preservando ciphertext, remoção de senha, nome duplicado, exclusão com D7-04 e abas intactas, migração v1 com `.bak`, arquivo corrompido, v3 futuro imutável e validação de campos.

Ajustes: `tests/e2e/s06-persistence.spec.ts` (v2, criação sem id, ambiente canônico), unitários de serviço/schemas/store, componentes de menu/toolbar/lab.

## 6. Comandos de verificação

```text
npm run typecheck
npm run lint
npm test
npm run build
npx playwright test tests/e2e/t04-connections.spec.ts
npx playwright test tests/e2e/s06-persistence.spec.ts
npm run test:e2e
npm run pack:win
npx playwright test tests/e2e/packaged.spec.ts
```

Sem dependências novas; `randomUUID` é nativo.

## 7. Documentos previstos

ADR 0017 (proposto), atualizações em backlog/requisitos/pendências/ADR 0016/dependências, evidência `docs/spikes/20261031_t04-connections-evidence.md` e relatório `docs/claude-code/reports/develop_natan/20261031_t04_connection_profiles.md`.

## 8. Ordem de execução

1. Tipos, paleta, schema v2 e migração com testes.
2. Serviço e IPC com testes negativos.
3. `AppDialog`, validação/presentation, formulário, diálogo e i18n.
4. Menu/toolbar/S05Lab e ajuste dos testes existentes.
5. E2E novo e S06, build e pacote.
6. Evidência, ADR, documentos e relatório; parar para revisão.

## 9. Riscos e condições de parada

- Migração válida nunca é quarentenada, não perde ciphertext e não gera `.corrupt-*`; caso contrário, parar.
- Builds antigas tratam v2 como futuro e recusam gravar; rollback restaura o `.bak`.
- Legado com nomes duplicados, usuário vazio ou `custom` sem rótulo carrega, mas exige correção ao salvar.
- Falha DPAPI nunca grava em claro nem apaga ciphertext.
- Foco/Escape/ARIA ou layout 865×480 reprovados em fr/es: parar e revisar.
- Cores da paleta precisam funcionar nos dois temas; ajustar mantendo 8 e registrar.
- Sem conexão, abas, Preferências, instância única, histórico, importação/exportação ou dependências novas.
- Nenhum commit/push; ao final, pedir ao usuário que rode `gitpr`.
