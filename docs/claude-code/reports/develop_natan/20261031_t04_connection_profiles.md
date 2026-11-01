# Relatório — T04: perfis de conexão, DPAPI e migração v2

Data: 2026-10-31 · Branch: `develop_natan` · Autor da execução: Claude Code
Plano aprovado: `docs/plans/develop_natan/20261031_t04_profiles_preferences_dpapi_plansfacts.md` · Autorização do usuário: “User has approved your plan. You can now start coding.”

## Objetivo
Entregar o CRUD de perfis de conexão com modal mestre-detalhe, quatro ambientes, paleta fixa de cores, nome único, id gerado pelo main, senha write-only em DPAPI e `connections.yml` schemaVersion 2 com migração v1 — sem conectar/testar (T05), sem alterar abas/editor (T07), sem Preferências completas (T11) e sem instalador (T13).

## Dependências
- S06 concluído e verificado (persistência YAML, DPAPI, recuperação, escrita atômica).
- `yaml 2.9.1` (ISC), `zod 4.6.7` (MIT), Vue 3.5.44 e vue-i18n 11.4.16 já fixados; **nenhuma dependência nova ou versão alterada**.
- `randomUUID` e `safeStorage` são nativos do runtime.
- Nenhum serviço externo, rede ou banco de dados foi usado nos testes.

## Critérios de aceite e situação
| Critério | Situação |
|---|---|
| CRUD de perfis sem conectar nem testar | atendido — e2e cria, edita, lista e exclui; status segue `Disconnected` |
| Modal aberto por Ferramentas > Conexões… e pelo botão da toolbar | atendido — e2e usa as duas entradas |
| Quatro ambientes com rótulo obrigatório em `custom` | atendido — schema, IPC, migração, formulário e validação |
| Cor da paleta de oito valores, canônica e acessível sem depender só de cor | atendido — schema normaliza, UI mostra swatch + nome/ambiente |
| Criação sem id, UUID gerado pelo main | atendido — e2e verifica UUID no YAML |
| Edição exige id existente; `not-found` sem upsert | atendido — unitários do serviço |
| Nome único case-insensitive com trim | atendido — unitário + e2e com `  local  ` vs `Local` |
| Senha write-only, ciphertext preservado ao editar e removível | atendido — e2e compara o ciphertext byte a byte e decifra no main |
| Senha nunca em claro no YAML, renderer só recebe `hasPassword` | atendido — e2e e redaction |
| Migração v1→v2 com `.bak` igual ao original e sem quarentena de arquivo válido | atendido — e2e com aliases, cor inválida, usuário vazio e nomes duplicados |
| Arquivo corrompido preservado, com aviso localizado | atendido — e2e de quarentena |
| v3 futuro não é sobrescrito; Novo/Salvar/Excluir bloqueados | atendido — bytes finais idênticos |
| Exclusão em duas etapas com aviso D7-04; abas intactas | atendido — `tabs_states.yml` idêntico byte a byte e SQL restaurado |
| Validação inline com foco no primeiro inválido | atendido — e2e de obrigatórios, porta e rótulo custom |
| Diálogo com ARIA, foco preso, Escape e retorno de foco | atendido — testes de componente e e2e |
| Após salvar, permanece aberto, seleciona o salvo e limpa a senha | atendido — componente e e2e |

## Arquivos

### Novos — domínio e aplicação
- `src/domain/persistence/connection-palette.ts` — oito cores, cor padrão e guard.
- `src/domain/persistence/connections-migration.ts` — schema v1 tolerante e migração v1→v2.
- `src/renderer/src/ui/connections/ConnectionForm.vue` — formulário, paleta, senha, validação e payload plano.
- `src/renderer/src/ui/connections/ConnectionsDialog.vue` — lista mestre-detalhe, carga, guarda de rascunho, exclusão e avisos.
- `src/renderer/src/ui/connections/validation.ts` — códigos/ordem de validação e trim.
- `src/renderer/src/ui/connections/presentation.ts` — ordenação, chaves i18n e mensagens de falha.
- `src/renderer/src/ui/shell/AppDialog.vue` — primitiva de modal com `Teleport`, ARIA, foco e Escape.

### Alterados — domínio, aplicação e main
- `src/domain/persistence/types.ts` — `CONNECTIONS_SCHEMA_VERSION = 2`, ambientes, `environmentLabel`, legado v1.
- `src/domain/persistence/schemas.ts` — schema v2 estrito, `parseVersioned` por codec, normalização de cor e diagnóstico sem valores.
- `src/domain/persistence/redaction.ts` — `environmentLabel` no `PublicConnection`, sem segredo.
- `src/application/persistence/connections-service.ts` — id gerado, `not-found`, `duplicate-name`, trim/normalização e senha omitida/`null`/string.
- `src/application/persistence/ipc-contract.ts` — entrada de criação/edição e validação do rótulo custom.
- `src/main/persistence.ts` — migração v1→v2 registrada no store de conexões.
- `src/renderer/src/ui/shell/{menu.ts,AppMenuBar.vue,AppToolbar.vue}` — itens com ação; Conexões habilitado; demais inertes.
- `src/renderer/src/ui/S05Lab.vue` — estado do diálogo, entradas de menu/toolbar, retorno de foco e fechamento.
- Catálogos i18n (`en-US`, `pt-BR`, `pt-PT`, `fr`, `es`) e `types.ts` — `connections.*`, menu e toolbar, com paridade.

### Testes
- Novos unitários: `connection-palette.test.ts`, `connections-migration.test.ts`, `connections-ipc-contract.test.ts`, `connection-form.test.ts`.
- Novos componentes: `app-dialog.test.ts`, `connection-form.test.ts`, `connections-dialog.test.ts`.
- Novo e2e: `t04-connections.spec.ts` (9 cenários).
- Ajustados: `connections-service.test.ts`, `persistence-schemas.test.ts`, `yaml-file-store.test.ts`, `app-menu-bar.test.ts`, `shell-chrome.test.ts`, `s05-lab.test.ts`, `s06-persistence.spec.ts`.

## Comandos e resultados
| Comando | Resultado |
|---|---|
| `npm run typecheck` | aprovado, sem erros |
| `npm run lint` | aprovado, sem erros (após corrigir template em `ConnectionsDialog.vue`) |
| `npm test` | **32 arquivos, 215 testes aprovados** |
| `npm run build` | aprovado; `out/main/index.js` 441.805 bytes |
| `npx playwright test tests/e2e/t04-connections.spec.ts` | **9/9 aprovados**, 55,7 s |
| `npx playwright test tests/e2e/s06-persistence.spec.ts` | **7/7 aprovados**, 58,1 s |
| `npm run test:e2e` | **27/27 aprovados**, 1,9 min |
| `npm run pack:win` | aprovado; `dist/win-unpacked`, Electron 45.1.0 x64, asar 9.022.224 bytes (8,6 MiB) |
| `npx playwright test tests/e2e/packaged.spec.ts` | **1/1 aprovado** |

Evidência detalhada: `docs/spikes/20261031_t04-connections-evidence.md`.

## Defeito real encontrado e corrigido
Os e2e de criação mostraram que o botão Salvar não fazia nada. O diagnóstico capturou `TypeError: values.port.trim is not a function` em `validateConnectionForm` e `port.value.trim is not a function` em `buildInput`: o `v-model` de `<input type="number">` convertia `port` de string para número após a edição. Correção: `String(port.value)` na validação e no snapshot de dirty, e `Number(String(port.value).trim())` no payload. Foi acrescentado o teste de regressão “accepts a port edited through the numeric input”; a suíte T04 passou de 8 falhas para 9/9 após a correção.

## Comportamentos observados e limitações
- Avisos de **migração** e **quarentena** são gerados na carga de inicialização e aparecem no **banner do shell**; quando o diálogo chama `list()`, o arquivo já está válido e não há novo aviso. Os e2e foram ajustados para essa realidade.
- Com lista vazia, o foco inicial do modal fica no painel, porque o `AppDialog` foca no momento da abertura e a lista chega de forma assíncrona; o foco permanece contido no diálogo e o Tab alcança os campos após a carga.
- O jsdom não propaga `<fieldset disabled>` aos inputs filhos; o teste verifica o fieldset e o campo de senha, e o comportamento real é coberto pelos e2e de escrita bloqueada.
- Fechar o aplicativo com rascunho sujo descarta o rascunho (D-T04-12); o handshake de fechamento continua tratando apenas abas.
- Builds anteriores leem `schemaVersion: 2` como futuro e recusam gravar conexões; restaurar o `.bak` sobre `connections.yml` desfaz a migração.
- Legado com nomes duplicados, usuário vazio ou `custom` sem rótulo carrega, mas exige correção para salvar.
- DPAPI entre usuários/máquinas é limitação raciocinada, não medida; a dica na UI informa.
- A paleta não recebeu auditoria formal de contraste WCAG; a revisão visual humana permanece necessária.
- A máquina acumulou **104 processos `electron.exe` órfãos** de execuções e2e anteriores; a limpeza automática foi negada pela política de permissões e deve ser feita manualmente.
- Fora deste T04: conectar/testar (T05), abas/editor (T07), Preferências completas (T11), instalador (T13), histórico e instância única.

## Documentos atualizados
- `docs/spikes/20261031_t04-connections-evidence.md` (novo).
- `docs/adr/0017-perfis-conexao-ui-migracao-v2.md` (novo, status **proposto**).
- `docs/06-backlog.md` — T04 concluído com evidência e pendência de revisão.
- `docs/01-requisitos.md` — R04 com quatro ambientes canônicos e rótulo custom; R18 sem a pendência obsoleta de P01.
- `docs/04-pendencias.md` — P07 parcialmente resolvida (exclusão de perfil preserva abas/SQL).
- `docs/adr/0016-persistencia-yaml-dpapi.md` — nota de atualização para `connections.yml` v2 e leitura por codec.
- `docs/03-dependencias-e-versoes.md` — seção T04: nenhuma dependência nova.

## Diff (resumo)
```text
novos: src/domain/persistence/{connection-palette,connections-migration}.ts,
       src/renderer/src/ui/connections/{ConnectionForm.vue,ConnectionsDialog.vue,validation.ts,presentation.ts},
       src/renderer/src/ui/shell/AppDialog.vue,
       tests/unit/{connection-palette,connections-migration,connections-ipc-contract,connection-form}.test.ts,
       tests/component/{app-dialog,connection-form,connections-dialog}.test.ts,
       tests/e2e/t04-connections.spec.ts, ADR 0017, evidência T04
alterados: src/domain/persistence/{types,schemas,redaction}.ts,
           src/application/persistence/{connections-service,ipc-contract}.ts,
           src/main/persistence.ts,
           src/renderer/src/ui/{S05Lab.vue,shell/menu.ts,shell/AppMenuBar.vue,shell/AppToolbar.vue},
           i18n (5 catálogos + types),
           tests/unit/{connections-service,persistence-schemas,yaml-file-store}.test.ts,
           tests/component/{app-menu-bar,shell-chrome,s05-lab}.test.ts,
           tests/e2e/s06-persistence.spec.ts,
           docs de requisitos, pendências, backlog, dependências e ADR 0016
```

## Condições de parada
- T04 concluído e verificado; **nenhum commit ou push foi executado** (git é somente leitura para o agente).
- Nenhuma etapa seguinte (T05, T07, T11 ou T13) foi iniciada.
- Aguardando revisão humana do diff, do ADR 0017 (proposto) e da evidência. Ao revisar, executar `gitpr` para commit e pull request.
