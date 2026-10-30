# Spike S02 — volume, memória, streaming e contagem

Execução: 2026-10-30T00:47:26.305Z

Destino: `127.0.0.1:3307` · usuário `root` · schema de trabalho `seshat_spike`

## 0. Linha de base do processo

- rss inicial: 42.8 MB · heapUsed: 7.6 MB · arrayBuffers: 0.0 MB
- Node: v22.18.0 · heap máximo disponível: 4144.0 MB

## 1. Servidor

- versão: `8.4.13`
- max_allowed_packet: 67,108,864 bytes (64.0 MB)
- innodb_buffer_pool_size: 134,217,728 bytes (128.0 MB)

## 2. Geração dos dados sintéticos

- tabela `vol` já contém 2,000,000 linhas: **geração reaproveitada** (nada foi inserido)

- tamanho em disco (dados + índice): 130.7 MB

## 3. Resultado inteiro em memória (`query` / `execute` bufferizado)

| linhas pedidas | linhas recebidas | tempo | Δrss | ΔheapUsed | ΔarrayBuffers | rss por linha |
|---|---|---|---|---|---|---|
| 10,000 | 10,000 | 28 ms | 1.9 MB | 1.4 MB | 0.1 MB | 196 B |
| 100,000 | 100,000 | 88 ms | 12.4 MB | 13.2 MB | 0.8 MB | 130 B |
| 300,000 | 300,000 | 255 ms | 44.8 MB | 39.6 MB | 2.1 MB | 157 B |

## 4. Streaming completo (`query(...).stream()`) — drenar tudo sem reter

- linhas drenadas: **2,000,000**
- tempo total: **1571 ms** · primeira linha em **1 ms**
- pico de rss durante o stream: 120.6 MB · Δrss ao final: 18.4 MB · Δheap: 0.2 MB
- bytes de payload trafegados: 58.1 MB
- rss por linha retida: 0.0 MB (deve tender a zero — nada é retido)

## 5. Parar o stream cedo (1.000 linhas) e destruir a conexão

- linhas lidas antes do pause: **1000** em **9 ms**
- rss com stream pausado: 116.4 MB (backpressure ativo)
- `SELECT 1` após `destroy()` na MESMA conexão: **funcionou** ({"ok":"1"})
- `COUNT(*)` após `destroy()`: 2,000,000 (esperado 2,000,000) — **íntegro**

## 6. Parar de reter (1.000 linhas), drenar o resto e reutilizar a conexão

- recebidas: **2,000,000** · retidas: **1,000** · tempo: **1299 ms**
- primeira: id=1 · última retida: id=1000
- pico de rss durante o drain: 121.2 MB · Δrss ao final: 0.7 MB · Δheap: 0.2 MB
- conexão reutilizada após drenar: **ok** ({"ok":"1"})

## 7. Contagem de linhas (total exato, sem reescrever o SQL)

| consulta | tempo | resultado |
|---|---|---|
| COUNT(*) na tabela inteira | 182 ms | 2000000 |
| COUNT(*) com filtro | 561 ms | 1000549 |
| MAX(id) (proxy de total em PK sequencial) | 1 ms | 2000000 |
| `LIMIT 1001` (estratégia "tem mais?") | 2 ms | 1001 linhas |

Observação: o total exato é obtido por consulta separada. Nenhuma contagem foi obtida
reescrevendo o SQL do usuário, alterando LIMIT ou usando SQL_CALC_FOUND_ROWS.

## 8. BLOB grande (limite de célula)

| tamanho | insert | fetch | observação |
|---|---|---|---|
| 1 MB | ok (52 ms) | 3 ms · 1.0 MB |  |
| 8 MB | ok (372 ms) | 27 ms · 8.0 MB |  |
| 70 MB | ERRO ER_NET_PACKET_TOO_LARGE (442 ms) | — | Got a packet bigger than 'max_allowed_packet' bytes |
Nota: o aviso `Warning: got packets out of order` no stderr vem do teste de 70 MB — o servidor
encerra a conexão (ECONNRESET) ao exceder `max_allowed_packet`. Reproduzido isoladamente;
as demais seções usam a conexão principal e não são afetadas.

## 9. Linha larga (40 colunas de texto) — 10.000 linhas bufferizadas

- inserção de 10,000 linhas em 437 ms
- payload aproximado por linha: 2,360 bytes (2.3 kB) · total 22.5 MB
- fetch bufferizado: 10,000 linhas em 140 ms
- ΔheapUsed: 34.4 MB → **3604 B por linha** (payload 2360 B; overhead 1.53×)
- Δrss no mesmo trecho: 1.0 MB (ruído de liberação de páginas das seções anteriores)

## 10. Processo ao final

- rss: 195.1 MB (linha de base 42.8 MB) · heapUsed: 43.7 MB

