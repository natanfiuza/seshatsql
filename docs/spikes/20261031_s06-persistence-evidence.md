# Evidência S06 — persistência YAML, DPAPI, recuperação e reinício (2026-10-31)

Escopo do S06 conforme `docs/plans/develop_natan/20261030_s05_s06_ui_persistencia_plansfacts.md` (§6, D-S05/S06-08..13, 16, 19, 21): persistência real em `preferences.yml`, `tabs_states.yml` e `connections.yml`; senha somente em ciphertext DPAPI; YAML validado e versionado; escrita atômica com backup válido; corrupção com quarentena e banner; debounce de 500 ms; flush no fechamento; reinício sem conexão nem execução de SQL.

Ambiente: Windows 11 Pro 10.0.26300, Node de build 22.18.0, Electron 45.1.0, aplicativo compilado em `out/` e pacote `dist/win-unpacked`. Toda execução e2e usa `SESHAT_DATA_DIR` e `SESHAT_USER_DATA_DIR` temporários — nenhum perfil real do usuário é lido ou escrito.

## Comandos e resultados

| Comando | Resultado em 2026-10-31 |
|---|---|
| `npm run typecheck` | sem saída de erro (`tsc` node + `vue-tsc` web) |
| `npm run lint` | sem saída de erro (`eslint .`) |
| `npm test` | 25 arquivos, **153 testes** aprovados, 12,98 s |
| `npm run build` | concluído; `out/main/index.js` 426 kB |
| `npx playwright test tests/e2e/s06-persistence.spec.ts` | **7/7 aprovados**, 55,4 s, sem timeout de teardown |
| `npm run test:e2e` (todas as suítes) | **18/18 aprovados**, 1,1 min (pacote, S05, S06 e captura visual) |
| `npm run pack:win` | `dist/win-unpacked`, asar **8,6 MB** |
| `npx playwright test tests/e2e/packaged.spec.ts` | **1/1 aprovado**, 3,4 s |

## Medições funcionais (e2e real, não simuladas)

1. **Primeira execução** — os três arquivos são criados no diretório configurado. `preferences.yml` contém exatamente `{schemaVersion: 1, theme: system, locale: en-US}`; `connections.yml` contém `{schemaVersion: 1, profiles: []}`; `tabs_states.yml` recebe uma aba após o debounce. Nenhum banner é exibido.
2. **Reinício** — tema `dark` e idioma `pt-BR` são restaurados antes da montagem da UI; a UI abre em `Arquivo` / `Desconectado` / `Nenhuma consulta executada.`; o texto digitado (`-- persisted_marker`) e o cursor são restaurados. Nenhuma conexão é aberta e nenhum SQL é executado.
3. **Arquivo primário corrompido** — `tabs_states.yml` substituído por YAML inválido; o app restaura o conteúdo do `.bak` (`-- from_backup_marker`), move o primário para `tabs_states.yml.corrupt-<timestamp>-<seq>` (1 arquivo de quarentena medido), mostra o banner com o caminho e permite dispensá-lo.
4. **Primário e backup inválidos** — o app inicia com os padrões, **dois** arquivos de quarentena são medidos e o banner informa que os padrões estão em uso e que o arquivo danificado foi preservado.
5. **Versão futura** (`schemaVersion: 2`) — o arquivo **não é sobrescrito** (bytes finais idênticos ao original), nenhuma quarentena é criada, o banner oferece nova tentativa. A tentativa de fechar falha com `Could not save before closing. The window stays open.` e a janela permanece aberta. A saída sem salvar exige duas etapas (`Exit without saving` → `Exit`) e só então o processo encerra.
6. **DPAPI real** — via IPC interno do renderer (`window.seshat.connections.save`), um perfil com a senha `e2e-secret` é gravado. O arquivo YAML **não contém o texto em claro**, contém `password: {scheme: dpapi, data: ...}` e `safeStorage.decryptString` no processo main devolve `e2e-secret`. Reiniciado, o renderer continua vendo apenas `hasPassword: true`; nem a senha nem o ciphertext cru são expostos.
7. **Encerramento abrupto** — após digitar e aguardar 1 s (debounce de 500 ms já concluído), o processo é morto com `kill()`; o relançamento restaura `-- crash_marker`, sem conexão e sem SQL.

As falhas de cifragem, indisponibilidade do protetor, ciphertext corrompido e falha de gravação são cobertas com `SecretProtector` simulado nos testes unitários (`tests/unit/connections-service.test.ts`, 10 testes) porque não são reproduzíveis com DPAPI real de forma determinística.

## Defeito real encontrado e corrigido durante a verificação

O fechamento da janela travava o processo: o evento `quit` era emitido e o processo principal permanecia vivo, com um diálogo nativo intitulado **Error**:

```text
A JavaScript error occurred in the main process
Uncaught Exception:
TypeError: Object has been destroyed
    at BrowserWindow.dispose (.../out/main/index.js)
    at BrowserWindow.emit (node:events)
```

Causa: `dispose()` do `close-coordinator` era chamado no evento `closed` e, nesse momento, acessar `window.webContents` lança `Object has been destroyed`. A exceção não tratada abria o diálogo modal, que impedia o encerramento. Correção: o coordenador guarda a referência de `webContents` na criação e usa essa referência em `dispose()` (`src/main/close-coordinator.ts`).

Antes da correção, `npx playwright test tests/e2e/s06-persistence.spec.ts` terminou com 6 aprovados, 1 falha e dois timeouts de teardown (6,7 min); uma execução manual (`electron .` + `CloseMainWindow`) reproduziu o diálogo e o processo preso. Depois da correção, a suíte S06 passa 7/7 em 55,4 s, a suíte completa passa 18/18 em 1,1 min e o encerramento manual não deixa o processo vivo.

Também foi corrigido, antes desta rodada, o envio de `Proxy` reativos da Vue pelo IPC (rejeitados pelo structured clone do Electron) — `tabState()` agora produz cópias planas — e a fila de gravação agora sobrevive a uma promessa rejeitada.

## Isolamento de teste

`tests/e2e/launch.ts` passa `SESHAT_DATA_DIR` e, agora também, `SESHAT_USER_DATA_DIR` (diretórios temporários criados por execução). `src/main/index.ts` aplica `app.setPath('userData', …)` antes de `whenReady` quando a variável existe. Motivo: execuções e2e não podem compartilhar o perfil real do Electron nem o singleton de processo do Chromium entre instâncias concorrentes. A variável é somente de teste e não é exposta ao renderer.

## Tamanho e empacotamento

- `out/main/index.js`: 426 kB; `yaml` e `zod` são empacotados pelo Vite no bundle do main (`externalizeDepsPlugin({ exclude: ['yaml', 'zod'] })`), porque o `electron-builder.yml` exclui `node_modules` do asar.
- Asar do pacote: **8,6 MB** (era 8,4 MB no S05).
- `dist/win-unpacked/SeshatSQL.exe` executa e abre editor e grid sem servidor dev; a persistência funciona no pacote porque o bundle já contém as duas bibliotecas.

## Limitações e pendências registradas

- DPAPI entre usuários ou máquinas diferentes é **limitação raciocinada, não medida**: o ciphertext é protegido pelas credenciais do usuário do Windows; em outro usuário/máquina a decifragem falha e o app informa o erro sem apagar o ciphertext.
- Não há instância única, fechamento transacional entre os três arquivos nem histórico de abas — fora do S06 por decisão D-S05/S06-16.
- O ambiente da máquina de teste contém processos `electron.exe` órfãos de execuções anteriores travadas pelo defeito acima; a limpeza automática foi negada pela política de permissões desta sessão e deve ser feita manualmente pelo usuário (fechar os processos `SeshatSQL`/`electron` remanescentes).
- `SESHAT_REQUEST_LOG` (log de requisições só com URL e método) continua disponível para a checagem offline manual.
