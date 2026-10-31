# Relatório — S06: persistência YAML, DPAPI, recuperação e reinício

Data: 2026-10-31 · Branch: `develop_natan` · Autor da execução: Claude Code
Plano aprovado: `docs/plans/develop_natan/20261030_s05_s06_ui_persistencia_plansfacts.md` §6 · Autorização do usuário: “aprovado, pode continuar”.

## Objetivo
Implementar a persistência real do S06 nos três arquivos aprovados, com senha somente em DPAPI, YAML validado/versionado, escrita atômica com backup válido, quarentena sem descarte silencioso, debounce de 500 ms, flush no fechamento e reinício sem conexão nem execução de SQL.

## Dependências
- `yaml 2.9.1` (ISC) e `zod 4.6.7` (MIT): já instaladas na matriz do T00; nenhuma versão mudou.
- S05 aprovado pelo usuário (visual HeidiSQL) como base da UI.
- Nenhum serviço externo, rede ou banco de dados.

## Critérios de aceite e situação
| Critério | Situação |
|---|---|
| Preferências, abas e conexões persistidas nos três YAML | atendido — e2e “first run” cria `preferences.yml`, `tabs_states.yml`, `connections.yml` |
| Tema/idioma restaurados antes da UI montar | atendido — e2e de reinício (`dark`, `pt-BR`) |
| Abas restauradas sem conectar nem executar SQL | atendido — e2e verifica `Desconectado` e `Nenhuma consulta executada.` |
| Senha somente em ciphertext DPAPI; sem fallback em claro | atendido — e2e com DPAPI real; unitários com protetor simulado (indisponível/falha/corrompido) |
| Renderer nunca recebe senha nem ciphertext | atendido — `PublicConnection.hasPassword`; e2e confirma ausência de `e2e-secret` |
| Escrita atômica tmp→fsync→bak→rename com retry | atendido — `yaml-file-store` e seus testes |
| Falha de rename aborta a gravação | atendido — teste unitário dedicado |
| Corrupção: principal → `.bak` → quarentena, com banner | atendido — dois e2e de recuperação (1 e 2 arquivos em quarentena) |
| Versão futura recusa gravar e preserva o arquivo | atendido — e2e compara bytes finais idênticos |
| Debounce de 500 ms e flush no fechamento | atendido — unitário/componente + e2e de reinício e de morte abrupta |
| Falha de flush mantém a janela; saída sem salvar exige confirmação | atendido — e2e em duas etapas |
| Reinício após `kill()` restaura a última gravação | atendido — e2e `-- crash_marker` |
| `yaml`/`zod` presentes no pacote sem `node_modules` | atendido — asar 8,6 MB; e2e do pacote aprovado |

## Arquivos

### Novos — domain/application/infrastructure
- `src/domain/persistence/types.ts` — versões, tipos dos três documentos, `PublicConnection`, códigos de aviso, `ParseOutcome`, `LoadedPersistence`.
- `src/domain/persistence/schemas.ts` — Zod estrito, codecs com `valid/future/older/invalid`, entrada de preferências e conexões.
- `src/domain/persistence/redaction.ts` — conversão para `PublicConnection`.
- `src/application/persistence/secret-protector.ts` — interface e erros tipados.
- `src/application/persistence/store.ts` — contrato `PersistenceStore<T>`.
- `src/application/persistence/connections-service.ts` — cifra ao salvar, preserva ciphertext ao editar, limpa com `null`, nunca grava sem protetor.
- `src/application/persistence/debounce-scheduler.ts` — debounce de 500 ms com `flush`/`cancel`.
- `src/application/persistence/ipc-contract.ts` e `channels.ts` — canais nomeados e validação das entradas; `channels.ts` sem `zod`/Node para uso no preload sandboxed.
- `src/infrastructure/persistence/yaml-file-store.ts` — leitura defensiva, quarentena, tmp→fsync→bak→rename, retry, fila por arquivo, limites de 1 MiB/16 MiB.
- `src/infrastructure/persistence/electron-secret-protector.ts` — `safeStorage` (DPAPI).
- `src/infrastructure/persistence/data-directory.ts` — `~/.seshatsql/data`, caminho legado e nomes dos arquivos.
- `src/main/persistence.ts` — composição dos três stores, estado inicial, IPC validado e restrito à janela/origem.
- `src/main/close-coordinator.ts` — handshake de fechamento com timeout de 3 s.
- `src/main/ipc-guard.ts` — verificação de origem confiável.
- `src/renderer/src/persistence/presentation.ts` — tradução de códigos de aviso e deduplicação.
- `src/renderer/src/ui/persistence/PersistenceBanner.vue` — banner com caminhos, dispensa e ações de saída.

### Alterados
- `src/main/index.ts` — runtime de persistência antes da janela; `SESHAT_USER_DATA_DIR` somente para testes; IPC removido no `will-quit`.
- `src/preload/index.ts` e `api.ts` — API nomeada de startup/preferências/abas/conexões/fechamento.
- `src/main/close-coordinator.ts` — correção do defeito de encerramento (ver abaixo).
- `src/renderer/src/main.ts`, `App.vue`, `S05Lab.vue` — estado inicial antes da montagem; restauração/gravação de abas; tema e idioma persistidos; cópia plana para o IPC; fila de gravação resiliente; aviso de falha.
- Catálogos `i18n` (5 idiomas) e `types.ts` — chaves do banner e mensagens de falha.
- `electron.vite.config.ts` — `yaml`/`zod` empacotadas no main.
- `tests/e2e/launch.ts` — `SESHAT_USER_DATA_DIR` temporário por execução.

### Testes novos
- `tests/unit/yaml-file-store.test.ts`, `persistence-schemas.test.ts`, `connections-service.test.ts`, `debounce-scheduler.test.ts`, `persistence-paths.test.ts`, `persistence-presentation.test.ts`.
- `tests/e2e/s06-persistence.spec.ts` (7 cenários).
- `tests/component/s05-lab.test.ts` — novo caso de invoke rejeitado e retomada de gravação.

## Comandos e resultados
| Comando | Resultado |
|---|---|
| `npm run typecheck` | aprovado, sem erros |
| `npm run lint` | aprovado, sem erros |
| `npm test` | 25 arquivos, **153 testes aprovados**, 12,98 s |
| `npm run build` | aprovado; `out/main/index.js` 426 kB |
| `npx playwright test tests/e2e/s06-persistence.spec.ts` | **7/7 aprovados**, 55,4 s |
| `npm run test:e2e` | **18/18 aprovados**, 1,1 min (pacote, S05, S06, captura visual) |
| `npm run pack:win` | aprovado; `dist/win-unpacked`, asar 8,6 MB |
| `npx playwright test tests/e2e/packaged.spec.ts` | **1/1 aprovado**, 3,4 s |

Evidência detalhada: `docs/spikes/20261031_s06-persistence-evidence.md`.

## Defeito real encontrado e corrigido
O encerramento do app travava após emitir `quit`: o diálogo nativo `A JavaScript error occurred in the main process` mostrava `TypeError: Object has been destroyed at BrowserWindow.dispose`. O `dispose()` do coordenador acessava `window.webContents` no evento `closed`, quando a janela já foi destruída. O coordenador agora guarda a referência de `webContents` na criação. Antes: suíte S06 com 6 aprovados, 1 falha e dois teardowns de 60 s; depois: 7/7 em 55 s e 18/18 na suíte completa. O defeito também foi reproduzido fora do Playwright (`electron .` + `CloseMainWindow` → processo vivo e diálogo de erro).

Também ficaram corrigidos nesta etapa: envio de proxies reativos da Vue pelo IPC (structured clone rejeitava e toda gravação falhava silenciosamente) e envenenamento da fila de gravação após uma promise rejeitada.

## Riscos e limitações
- **DPAPI entre usuários/máquinas**: limitação raciocinada, não medida. Em outra conta/máquina a decifragem falha; o app informa e não apaga o ciphertext.
- **Não transacional** entre os três arquivos: uma gravação pode ter sucesso e outra falhar; o aviso é por arquivo.
- **Instância única, histórico e UI de perfis** permanecem fora do S06 (D-S05/S06-16).
- Arquivos `.corrupt-*` são preservados indefinidamente; limpeza manual.
- O ambiente da máquina ficou com processos `electron.exe` órfãos das execuções travadas pelo defeito acima; a limpeza automática foi negada pela política de permissões desta sessão. Recomenda-se fechá-los manualmente.

## Documentos atualizados
- `docs/spikes/20261031_s06-persistence-evidence.md` (novo).
- `docs/adr/0016-persistencia-yaml-dpapi.md` (novo, status **proposto**).
- `docs/03-dependencias-e-versoes.md` — seção S06 (empacotamento de `yaml`/`zod`, sem mudança de versão).
- Plano aprovado em `docs/plans/develop_natan/20261030_s05_s06_ui_persistencia_plansfacts.md` §6 executado integralmente.

## Diff (resumo)
```
novos: src/{domain/persistence,application/persistence,infrastructure/persistence}/,
       src/main/{persistence,close-coordinator,ipc-guard}.ts,
       src/renderer/src/{persistence,ui/persistence}/,
       tests/unit/*persistence*, tests/unit/{connections-service,debounce-scheduler,yaml-file-store}.test.ts,
       tests/e2e/s06-persistence.spec.ts, ADR 0016, spike S06
alterados: src/main/index.ts, src/preload/{index,api}.ts, src/renderer/src/ui/S05Lab.vue,
           src/renderer/src/main.ts, App.vue, i18n (5 catálogos + types),
           electron.vite.config.ts, tests/e2e/launch.ts, tests/component/s05-lab.test.ts
```

## Condições de parada
- S06 concluído e verificado; **nenhum commit ou push foi executado** (git é somente leitura para o agente).
- Nenhuma etapa seguinte (T04/UI de perfis ou conexão) foi iniciada.
- Aguardando revisão do usuário. Ao revisar, executar `gitpr` para commit e pull request.
