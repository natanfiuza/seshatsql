# ADR 0016 — Persistência local em YAML, DPAPI, recuperação e fechamento (S06)

Status: **proposto**. Sustentado por medição real em `docs/spikes/20261031_s06-persistence-evidence.md` (testes unitários, e2e no app compilado, DPAPI real, reinício e pacote `win-unpacked`). As decisões foram aprovadas antes da implementação em `docs/plans/develop_natan/20261030_s05_s06_ui_persistencia_plansfacts.md` (D-S05/S06-08..13, 16, 19, 21). Não substitui a revisão humana.

Atualização T04 (2026-10-31): `connections.yml` passou a `schemaVersion: 2` com migração v1→v2 (ADR 0017); `preferences.yml` e `tabs_states.yml` permanecem na versão 1. Onde este ADR diz “versão 1” ou “futuro > 1” para conexões, vale a versão corrente por codec.

## Contexto
O S06 exige persistência real de preferências, abas e perfis de conexão nos três arquivos aprovados, com senha apenas cifrada pelo sistema operacional, YAML validado e versionado, escrita que nunca deixe o arquivo principal truncado, recuperação sem descarte silencioso e fechamento que não perca edições. O S05 não tinha persistência alguma; o S06 precisava provar tudo isso em Windows 11 com Electron 45.

## Decisões

### D-S06-01 — Local, arquivos e formato
| # | Regra | Por quê |
|---|---|---|
| 1 | Diretório `%USERPROFILE%\.seshatsql\data` (resolvido por `app.getPath('home')`), com override `SESHAT_DATA_DIR` somente de teste | caminho estável e fora do perfil Electron; o override nunca chega ao renderer |
| 2 | Três arquivos: `preferences.yml`, `tabs_states.yml`, `connections.yml` | separam dados de vida longa, estado de sessão e segredos |
| 3 | YAML com `schemaVersion` no topo (1 em preferências/abas; 2 em conexões desde o T04) e schema Zod `.strictObject()` | campo desconhecido ou tipo errado é corrupção, não "quase válido" |
| 4 | Gravação sempre regenera o documento completo a partir do objeto validado | nenhuma mutação parcial de arquivo |

### D-S06-02 — Validação e versionamento
| # | Regra | Por quê |
|---|---|---|
| 1 | `ParseOutcome` distingue `valid`, `future`, `older` e `invalid` | cada caso tem política própria |
| 2 | Versão **futura** (acima da versão corrente do codec: > 1 em preferências/abas, > 2 em conexões) nunca é gravada e produz aviso com a versão; o arquivo permanece intacto | uma versão nova pode ter campos que esta build apagaria |
| 3 | Versão **antiga** é migrada em memória e regravada somente depois de preservar o original em backup | requisito do plano (`migrated`) |
| 4 | `invalid` dispara a cadeia de recuperação de D-S06-03 | nunca se assume que o arquivo pode ser descartado |
| 5 | A UI recebe apenas códigos e caminhos (`PersistenceWarning`), nunca conteúdo de arquivo | o main não monta texto; o renderer traduz nos cinco catálogos |

### D-S06-03 — Recuperação: primário → backup → quarentena
| # | Regra | Por quê |
|---|---|---|
| 1 | Ordem fixa: arquivo principal válido → `.bak` válido → padrões | resgata o máximo possível antes de perder estado |
| 2 | Todo arquivo recusado é movido para `<nome>.corrupt-<timestamp>-<seq>`, nunca apagado | preserva evidência para inspeção manual |
| 3 | Falha ao mover para quarentena gera `quarantine-failed` e é informada | não se finge que o arquivo foi preservado |
| 4 | O banner de recuperação é não bloqueante, lista os caminhos e pode ser dispensado | informa sem impedir o trabalho |
| 5 | Ausência de arquivo é estado normal ("primeiro uso"), não corrupção | evita banner falso na primeira execução |

### D-S06-04 — Escrita atômica e backup válido
| # | Regra | Por quê |
|---|---|---|
| 1 | Escreve `tmp` no mesmo diretório → `fsync` → copia o arquivo atual reconhecido (válido ou versão antiga) para `.bak` → `rename(tmp, principal)` | só o rename é atômico; o backup precisa ser de um conteúdo que já foi aceito |
| 2 | `rename` tenta novamente em `EPERM`/`EBUSY` com pausas de 0/15/40/100 ms | antivírus e indexador do Windows seguram o arquivo por instantes |
| 3 | Se o rename continuar falhando, a gravação **aborta** e informa erro; não há escrita direta "de emergência" | escrita direta pode truncar o arquivo se o processo cair |
| 4 | Operações são serializadas por arquivo | duas gravações concorrentes não podem intercalar tmp/bak/rename |
| 5 | Arquivo maior que **1 MiB** é gravado íntegro com aviso `large-file`; acima de **16 MiB** a leitura e a escrita são recusadas (`file-too-large`) | SQL grande é legítimo; um arquivo patológico é tratado sem OOM |

### D-S06-05 — Senhas somente DPAPI
| # | Regra | Por quê |
|---|---|---|
| 1 | `SecretProtector` é uma interface; a implementação de produção usa `safeStorage` (DPAPI no Windows) | testável e substituível sem tocar no caso de uso |
| 2 | Formato persistido: `{ scheme: 'dpapi', data: <base64> }`; texto em claro é rejeitado pelo schema | um YAML editado à mão não injeta senha em claro |
| 3 | Protetor indisponível ou falha de cifragem → `{ok:false, reason:'encryption-unavailable'}` e **nenhuma** gravação | nunca há fallback em claro |
| 4 | Senha omitida na edição preserva o ciphertext existente; senha `null` limpa | editar metadados não exige redecifrar o segredo |
| 5 | Ciphertext corrompido produz erro e **não** apaga o valor | o usuário pode recuperar o perfil manualmente |
| 6 | O renderer recebe `PublicConnection` com `hasPassword`; nem senha nem ciphertext cru atravessam o IPC | regra do `CLAUDE.md` |

### D-S06-06 — Debounce, flush e fechamento
| # | Regra | Por quê |
|---|---|---|
| 1 | Edições de abas são agrupadas por 500 ms; troca de aba e fechamento fazem flush imediato | menos I/O sem perder o contrato |
| 2 | O fechamento é um handshake: o main pede `flush`, o renderer responde `{ok:true}`, `{ok:false}` ou `{ok:true, discard:true}` | o main não pode saber se há edição pendente |
| 3 | Falha de flush mantém a janela aberta com aviso; saída sem salvar exige confirmação em duas etapas | nunca se descarta trabalho silenciosamente |
| 4 | Sem resposta em 3 s, o main envia `app:close-failed` e mantém a janela | um renderer travado não derruba a janela |
| 5 | A fila de gravação do renderer sobrevive a uma promise rejeitada e o estado é enviado como cópia plana | `Proxy` da Vue não é clonável pelo IPC do Electron |
| 6 | O coordenador de fechamento guarda a referência de `webContents` na criação e a usa em `dispose()` | **medido**: acessar `window.webContents` em `closed` lança `Object has been destroyed`, abre diálogo de erro e trava o processo |

### D-S06-07 — IPC nomeado, validado e restrito à origem
| # | Regra | Por quê |
|---|---|---|
| 1 | Canais nomeados no contrato compartilhado (`channels.ts`, sem `zod` nem Node, importável pelo preload sandboxed) | o preload não pode carregar dependências pesadas |
| 2 | Entradas validadas por Zod no main; entrada inválida devolve `{ok:false, reason:'invalid'}` | IPC não confia no renderer |
| 3 | Eventos só são aceitos da janela principal e de `event.senderFrame === mainFrame`; invokes também exigem URL confiável (`app://seshat` ou origem de dev configurada) | um iframe ou origem estranha não alcança a persistência |
| 4 | Nenhum `invoke` genérico; cada operação tem canal e resposta tipados | evita virar ponte arbitrária para o main |

### D-S06-08 — Empacotamento das dependências do main
| # | Regra | Por quê |
|---|---|---|
| 1 | `yaml` 2.9.1 (ISC) e `zod` 4.6.7 (MIT) vão no bundle do main via `externalizeDepsPlugin({ exclude: ['yaml', 'zod'] })` | o asar exclui `node_modules`; sem isso o pacote não iniciaria |
| 2 | Nenhuma versão de dependência mudou no S06 | ambas já constavam da matriz do T00 |

## Alternativas registradas e não adotadas
- **JSON em vez de YAML** — rejeitado: o plano aprovado fixa YAML legível e editável.
- **Escrever direto no arquivo principal** — mesmo com backup, pode truncar o principal numa queda; o rename atômico é o único passo atômico disponível.
- **Apagar arquivo corrompido e usar padrões** — descarte silencioso, proibido pelo plano.
- **Fallback de senha em claro/base64** — proibido pelo `CLAUDE.md`.
- **Cifrar com chave própria** — o requisito é cifragem pelo SO; uma chave embutida não protege nada.
- **SQLite** — dependência nativa e formato opaco; o plano fixa YAML.
- **Fechamento síncrono sem handshake** — não existe forma de o main ler o estado pendente do renderer.
- **`app.exit(0)` como muleta de encerramento** — testado e descartado: o problema real era a exceção em `dispose()`, não a lentidão do `quit`.

## Consequências
- Senhas ficam atreladas ao usuário do Windows; copiar o diretório para outra conta/máquina não permite decifrar. Isso é esperado, mas precisa ser comunicado quando houver UI de perfis (T04).
- O backup `.bak` é a geração anterior aceita; um arquivo muito editado e depois corrompido perde no máximo as últimas gravações desde o backup.
- Arquivos ilegíveis se acumulam como `.corrupt-*`; a limpeza é manual e intencional.
- O handshake de fechamento adiciona até 3 s ao fechamento quando o renderer não responde.
- Qualquer dependência futura do main precisa de decisão explícita de empacotamento.
- A persistência entre três arquivos não é transacional; uma gravação pode ter sucesso e outra falhar, e o aviso é por arquivo.
- DPAPI entre usuários/máquinas permanece **limitação raciocinada, não medida**.
