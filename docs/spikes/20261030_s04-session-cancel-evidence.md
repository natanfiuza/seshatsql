# Spike S04 — sessão, cancelamento e estado `unknown`

Execução: 2026-10-30T13:48:12.670Z

Destino: `127.0.0.1:3307` · schema `seshat_spike` · driver `mysql2` com `multipleStatements: false`

- versão: `8.4.13` · `autocommit = 1` · isolamento `REPEATABLE-READ`

## 1. Duas conexões, duas threads

- principal: `167` · auxiliar: `166`
- threads distintas: ok

A conexão auxiliar é usada **só** para `KILL` e para observar o servidor; ela não executa comandos da sessão de trabalho.

## 2. `KILL QUERY` durante um comando, sem transação

- `SELECT SLEEP(3)` interrompido por `KILL QUERY` (aceito): o cliente recebeu **sucesso** com `{"s":"1"}` — `SLEEP` interrompido **não** gera erro
- por isso os testes de cancelamento usam uma consulta real sobre `vol`, não `SLEEP`.

- `KILL QUERY 167` a partir da auxiliar: aceito pelo servidor
- cliente: ER_QUERY_INTERRUPTED/1317/70100 — Query execution was interrupted
- do kill até o cliente desistir: **1 ms** · tempo total do comando: 512 ms · escopo da consulta: `id < 2000000` · tentativas: 1
- conexão utilizável depois: sim · `SELECT 1` → {"vivo":"1"}
- cancelamento interrompeu o comando: ok · conexão segue utilizável: ok

## 3. A transação sobrevive ao `KILL QUERY`?

- `KILL QUERY`: aceito · cliente: ER_QUERY_INTERRUPTED/1317/70100 — Query execution was interrupted
- transação ainda aberta logo após o cancelamento (`INNODB_TRX`): **1 · leituras: 1, 1**
- `ROLLBACK` depois do cancelamento: executado
- a linha 101 sobreviveu ao rollback: **não** (esperado: não) — ok
- cancelar não desfez a transação: ok

## 4. `information_schema.INNODB_TRX` enxerga a transação?

| estado da sessão principal | linhas em `INNODB_TRX` para o id |
|---|---|
| sem transação | 0 · leituras: 1, 0, 0 |
| `BEGIN; SELECT` em tabela (só leitura) | 1 · leituras: 0, 1, 1 |
| `BEGIN; SELECT; INSERT` (com escrita) | 1 · leituras: 1, 1 |
| depois do `ROLLBACK` | 0 · leituras: 1, 0, 0 |

- sem transação some: ok · com escrita aparece: ok · rollback limpa: ok

- A transação só de leitura **também aparece** em `INNODB_TRX` nesta instância, mas a primeira leitura pode não vê-la (a transação só é registrada quando o primeiro acesso a tabela acontece).
- Cada medição repete a consulta até duas leituras consecutivas concordarem (teto de 2 s): a leitura imediata pode vir defasada.

## 5. `KILL CONNECTION` no meio de uma transação

- `KILL CONNECTION 167`: aceito · 509 ms após o início do comando
- cliente: PROTOCOL_CONNECTION_LOST — Connection lost: The server closed the connection.
- conexão utilizável depois: não — sem code — Can't add new command when connection is in closed state
- a linha 201 sobreviveu: **não** — ok · conexão morta: ok

Conexão principal recriada para os próximos experimentos.

## 6. DDL dentro de transação: commit implícito

| DDL no meio da transação | o `INSERT` anterior sobreviveu ao `ROLLBACK`? | observação |
|---|---|---|
| `CREATE TABLE` | **sim** | — |
| `ALTER TABLE` | **sim** | — |
| `TRUNCATE` | **sim** | linhas em `s04_trunc`: 0 |
| `RENAME TABLE` | **sim** | `s04_rn_b` existe: true |

- todos os quatro commitam: ok

## 7. `LOCK TABLES` e `UNLOCK TABLES`

| medição | resultado |
|---|---|
| `LOCK TABLES ... WRITE` bloqueia outra sessão | **sim** (consulta presa por mais de 1,5 s) |
| `BEGIN` depois do `LOCK` mantém o lock | **não** — a outra sessão voltou a ler |
| `BEGIN; INSERT 405; LOCK TABLES READ; UNLOCK; ROLLBACK` | rollback: executado · 405 sobreviveu: **sim** |
| `LOCK WRITE; BEGIN; INSERT 406; UNLOCK` | visível para a outra sessão antes do `UNLOCK`: **não** · sobreviveu ao `UNLOCK`: **não** · sobreviveu ao `ROLLBACK` posterior: **não** |

- `LOCK TABLES` bloqueia a outra sessão: ok · `LOCK TABLES` commita a transação aberta: ok
- `UNLOCK TABLES` **não** commita a transação iniciada depois do lock: ok · ela segue viva até o `ROLLBACK`: ok

Divergência registrada: a documentação do MySQL diz que `UNLOCK TABLES` faz commit implícito quando `LOCK TABLES` foi usado. Nesta instância, quando a transação **começa depois** do `LOCK` (e o `BEGIN` libera o lock), o `UNLOCK` não commita nada — vale o que foi medido.

## 8. Queda de conexão (`destroy`) no meio de uma transação

| caso | medição |
|---|---|
| `destroy()` com comando em voo (502 ms) | sessão ainda viva 300 ms depois: **sim** · cliente respondeu em 4893 ms: ok — o comando terminou normalmente · thread saiu da `PROCESSLIST` 2 ms depois |
| `destroy()` com a conexão ociosa | thread saiu da `PROCESSLIST` em **1 ms** |

- `destroy()` com comando em voo **não encerra** a sessão: ok · o comando em voo termina: ok
- ao sair, o servidor desfez a transação: ok · `destroy()` ocioso encerra a sessão: ok · e desfaz a transação: ok

Consequência: `destroy()` **não** interrompe trabalho em andamento — o `mysql2` só fecha a conexão quando o comando em voo termina. Para encerrar a sessão de fato, o caminho é `KILL CONNECTION` pela conexão auxiliar (seção 5).

Conexão principal recriada.

## 9. Queda durante o `COMMIT` — o caso `unknown`

| iteração | resposta do cliente ao `COMMIT` | o servidor aplicou? |
|---|---|---|
| 500 | ok | **sim** |
| 501 | ok | **sim** |
| 502 | ok | **sim** |
| 503 | ok | **sim** |

- iterações com resposta clara: **4 de 4**
- corrida reproduzida: **não** — com 4 tentativas não houve caso sem resposta; o estado `unknown` fica registrado como **tentado e não reproduzido**, não como medido.
- Quando não há resposta, o cliente **não pode** afirmar sucesso nem falha: esse é o estado `unknown` da D-S04-03.

## 10. Cancelar uma contagem lenta (ADR 0012)

- `KILL QUERY` na contagem: aceito · cliente: ER_QUERY_INTERRUPTED/1317/70100 — Query execution was interrupted
- tempo total: 302 ms · do kill até o cliente desistir: 7 ms
- sessão utilizável depois: sim · `COUNT(*)` → {"c":"2000000"}

## 11. Dois comandos ao mesmo tempo na mesma conexão (`mysql2`)

- segundo comando: ok · esperou **1002 ms**
- tempo total dos dois: 1002 ms
- o driver **enfileira** em vez de recusar: ok

Consequência: "uma execução ativa" não é garantida pelo driver — o aplicativo precisa impor isso.

## 12. Permissões: quem pode cancelar a query de quem

- usuário temporário `seshat_s04_ro` tem só `SELECT ON seshat_spike.*` (sem `PROCESS`/`CONNECTION_ADMIN`)
- cancelar a **própria** thread: aceito · cliente: ER_QUERY_INTERRUPTED/1317/70100 — Query execution was interrupted
- cancelar a thread do `root`: ERRO ER_KILL_DENIED_ERROR/1095/HY000 — You are not owner of thread 170
- sessões visíveis em `PROCESSLIST` para o usuário restrito: **2**
- `INNODB_TRX` da própria transação: ERRO ER_SPECIFIC_ACCESS_DENIED_ERROR/1227/42000 — Access denied; you need (at least one of) the PROCESS privilege(s) for this operation

- próprio thread cancelável: ok · thread de outro usuário negada: ok

**Consequência para a D-S04-02:** ler `INNODB_TRX` exige o privilégio `PROCESS`. Um usuário de aplicação só com `SELECT` não tem acesso à tabela — nesse caso o "servidor como fonte da verdade" não está disponível e o estado passa a depender do rastreio do cliente, com `unknown` quando não houver como confirmar.

- usuário temporário removido: sim · senha gerada em memória, nunca impressa nem gravada

## 13. Resumo

- experimentos executados: **12** · falhas de verificação: **0**

Regras que o spike sustenta:
1. `KILL QUERY` interrompe o comando (`ER_QUERY_INTERRUPTED`) e **mantém** a conexão e a transação — cancelar não é rollback.
2. `SELECT SLEEP(n)` interrompido devolve **sucesso com 1**, sem erro: não serve como prova de cancelamento.
3. `KILL CONNECTION` e queda de rede encerram a sessão; o servidor desfaz a transação. `destroy()` **não** interrompe comando em voo — só fecha quando ele termina.
4. DDL (`CREATE`, `ALTER`, `TRUNCATE`, `RENAME`) faz **commit implícito**; `ROLLBACK` posterior não desfaz nada.
5. `LOCK TABLES` bloqueia outra sessão e commita a transação aberta; `BEGIN` depois do lock libera o lock; `UNLOCK TABLES` não commita a transação iniciada depois.
6. Sem resposta ao `COMMIT`, o estado é **`unknown`**: o servidor pode ter aplicado ou não. (Tentado, não reproduzido nesta execução.)
7. O `mysql2` **enfileira** comandos concorrentes; "uma execução ativa" precisa ser imposta pelo aplicativo.
8. Um usuário sem `PROCESS`/`CONNECTION_ADMIN` cancela a própria thread, mas não a de outro usuário — e **não consegue ler `INNODB_TRX`**.
9. `INNODB_TRX` mostra a transação com escrita e também a de leitura (depois do primeiro acesso a tabela), mas a leitura **imediata** após uma mudança de estado pode vir defasada: confirmar repetindo até estabilizar.

