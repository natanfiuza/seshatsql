# ADR 0014 — Cancelamento, sessão e estado `unknown` (P02) propostos a partir do S04
Status: **proposto**. Sustentado por medição real (`docs/spikes/20261030_s04-session-cancel-evidence.md`, 12 experimentos, 0 falhas de verificação). Não substitui `docs/04-pendencias.md` P02 até ser aceito pela revisão humana.

## Contexto
O `CLAUDE.md` fixa quatro regras que o S04 precisava provar no servidor, não supor: (1) uma sessão de trabalho compartilhada e **uma execução ativa**; (2) conexão auxiliar só para controle/cancelamento; (3) **não** repetir SQL após falha de rede; (4) cancelar **não** é rollback global, e rollback de DDL não é prometido. Faltava decidir o que a aplicação faz com a conexão depois de cancelar, de onde vem a verdade sobre o estado transacional e como representar "não houve resposta".

Todas as medições abaixo saíram do MySQL Community 8.4.13 em `127.0.0.1:3307`, schema descartável `seshat_spike`, com `mysql2` (`multipleStatements: false`) e `autocommit = 1`, `REPEATABLE-READ`.

## Medições que sustentam a proposta
| Medida | Resultado |
|---|---|
| `KILL QUERY` durante consulta real | cliente recebe `ER_QUERY_INTERRUPTED/1317/70100` em **1 ms**; conexão segue utilizável |
| Transação depois do `KILL QUERY` | continua **aberta** (`INNODB_TRX` = 1); `ROLLBACK` posterior desfaz o `INSERT` |
| `KILL CONNECTION` | `PROTOCOL_CONNECTION_LOST`; conexão morta; servidor desfaz a transação |
| `destroy()` com comando em voo | sessão **continua viva**; o comando termina (cliente recebe sucesso) e só então a conexão fecha |
| `destroy()` com a conexão ociosa | thread sai da `PROCESSLIST` em 1 ms; transação desfeita |
| `INNODB_TRX` — leitura de estado | mostra a transação com escrita e a de leitura; **leitura imediata pode vir defasada** (`1, 0, 0` depois do rollback; `0, 1, 1` ao abrir a de leitura) |
| `INNODB_TRX` com usuário restrito | `ER_SPECIFIC_ACCESS_DENIED_ERROR/1227/42000` — exige `PROCESS` |
| DDL no meio da transação | `CREATE`, `ALTER`, `TRUNCATE`, `RENAME` fizeram **commit implícito** nos 4 casos |
| `LOCK TABLES ... WRITE` | bloqueia outra sessão; `LOCK TABLES` commita a transação aberta; `BEGIN` depois do lock **libera** o lock; `UNLOCK TABLES` **não** commita a transação iniciada depois |
| Dois comandos na mesma conexão | o `mysql2` **enfileira** (segundo esperou 1010 ms) — não recusa |
| `SELECT SLEEP(n)` interrompido | devolve **sucesso com 1**, sem erro — não serve como prova de cancelamento |
| Queda durante o `COMMIT` | corrida **não reproduzida** em 4 tentativas; registrado como tentado, não como medido |
| Permissões | usuário só com `SELECT` cancela a própria thread, mas recebe `ER_KILL_DENIED_ERROR/1095/HY000` na thread de outro usuário |

## Proposta

### D-S04-01 — Cancelar mantém a conexão
| # | Regra | Por quê |
|---|---|---|
| 1 | **Cancelar** = `KILL QUERY <id da conexão de trabalho>`, enviado pela **conexão auxiliar** | é o único caminho que interrompe o comando sem encerrar a sessão |
| 2 | Depois do cancelamento a conexão **permanece**, e a UI informa que **a transação continua aberta** | medido: `INNODB_TRX` segue com 1 linha e o `ROLLBACK` posterior desfaz |
| 3 | Descartar a conexão só quando o protocolo se mostrar inconsistente, sempre com mensagem explícita ("conexão encerrada; o servidor desfaz a transação") | nunca como efeito silencioso |
| 4 | `KILL` não confirmado em **5 s** → "cancelamento não confirmado"; o app não afirma que cancelou | resposta perdida é `unknown`, não sucesso |
| 5 | "Cancelar e desfazer" **não** existe como ação só | cancelar ≠ rollback |

### D-S04-02 — Fonte da verdade do estado transacional
| # | Regra | Por quê |
|---|---|---|
| 1 | **Servidor como verdade**: `SELECT COUNT(*) FROM information_schema.INNODB_TRX WHERE trx_mysql_thread_id = CONNECTION_ID()`, consultada em **três momentos** (antes de confirmar um lote, depois de qualquer erro, depois de cancelar) — nunca em polling | medido: a tabela reflete a transação |
| 2 | A leitura só vale **estável**: repetir até duas leituras consecutivas concordarem (teto de 2 s) | medido: a leitura imediata pode vir defasada logo após `COMMIT`/`ROLLBACK` |
| 3 | **Rastreio no cliente** (sabemos se enviamos `BEGIN`/`START TRANSACTION`, se `autocommit` foi desligado, se houve escrita) desempata | a transação de leitura só entra em `INNODB_TRX` quando acontece o primeiro acesso a tabela |
| 4 | **Sem `PROCESS`** o servidor não responde a essa consulta: o app registra a limitação no perfil e passa a decidir **só** pelo rastreio do cliente, declarando `unknown` quando não houver como confirmar | medido: `ER_SPECIFIC_ACCESS_DENIED_ERROR/1227/42000` |
| 5 | Divergência entre servidor e cliente, ou servidor inalcançável → **`unknown`** | não escolher um dos dois lados por conveniência |

### D-S04-03 — `unknown` bloqueia escrita
| # | Regra | Por quê |
|---|---|---|
| 1 | `unknown` **bloqueia escrita e DDL** até decisão explícita do usuário; **nada é reenviado** | regra do `CLAUDE.md`: não repetir SQL após falha de rede |
| 2 | Leitura só volta em **conexão nova**; a conexão suspeita não volta a ser usada | o estado dela é indefinido |
| 3 | A mensagem diz o que se sabe e o que não se sabe: "não houve resposta; o comando **pode** ter sido aplicado" | é um estado de primeira classe, não um erro genérico |
| 4 | Encerrar a sessão de verdade é `KILL CONNECTION` pela auxiliar — **não** `destroy()` | medido: `destroy()` com comando em voo não encerra nada e ainda entrega o resultado |

### D-S04-04 — DDL e `LOCK TABLES` em transação aberta pedem confirmação
| # | Regra | Por quê |
|---|---|---|
| 1 | Comando da classe `ddl` (ADR 0013) com transação aberta → **aviso + confirmação** de que o servidor fará commit implícito | medido nos 4 DDLs |
| 2 | `LOCK TABLES`/`UNLOCK TABLES` entram no mesmo aviso | `LOCK TABLES` commita; `UNLOCK TABLES` depois de `BEGIN` não commita, e o lock já foi liberado pelo `BEGIN` |
| 3 | Estado `unknown` → o DDL **não** é executado | cai em D-S04-03 |

### D-S04-05 — Uma execução ativa é imposta pelo aplicativo
| # | Regra | Por quê |
|---|---|---|
| 1 | O app mantém **uma** execução por sessão; o segundo comando é recusado na aplicação | medido: o `mysql2` enfileira em vez de recusar (segundo comando esperou 1010 ms) |
| 2 | A auxiliar **só** cancela e observa; nunca executa comandos da sessão de trabalho | já no `CLAUDE.md` |

## Alternativas registradas e não adotadas
- **`max_execution_time` como timeout automático** — interromperia o comando sem o usuário pedir e mudaria o resultado de contagens; a prioridade registrada é "total exato, com demora e botão cancelar".
- **Encerrar a conexão como forma de cancelar** — desfaria a transação sem o usuário pedir; é o risco que a D-S04-01 existe para evitar.
- **Usar `destroy()` como equivalente de queda de rede** — medido como não confiável: a conexão só fecha quando o comando em voo termina.
- **Tratar `INNODB_TRX` como leitura instantânea** — medido defasado; exigiria decisões erradas logo após um rollback.
- **Exigir `PROCESS` do usuário do aplicativo** — amplia privilégio além do necessário; a proposta é degradar para rastreio do cliente + `unknown`, informando a limitação no perfil.

## Consequências
- A UI precisa de um estado explícito `unknown` (não confundir com erro) e de um bloqueio de escrita que o usuário possa resolver por decisão própria.
- O perfil de conexão passa a registrar se o usuário pode ler `INNODB_TRX`; sem isso a promessa "servidor como verdade" seria falsa.
- O botão cancelar não pode oferecer "cancelar e desfazer" como uma coisa só.
- O app não pode confiar no driver para serializar comandos nem para encerrar a sessão.
- Nenhuma dessas regras foi aplicada em código; hoje só o spike as demonstra.

## Pendente
- Reproduzir a corrida "queda durante o `COMMIT`" em ambiente com latência controlada: hoje o estado `unknown` é política, não medição.
- Confirmar se o comportamento de `destroy()` é do `mysql2` 3.24.6 ou do protocolo (repetir em outra versão do driver).
- Linhas 9.7 LTS e 8.0.46 sem ambiente (B-01): `INNODB_TRX`, privilégio `PROCESS` e semântica de `LOCK TABLES` podem divergir.
- Revisão humana do ADR e da P02 em `docs/04-pendencias.md`.
