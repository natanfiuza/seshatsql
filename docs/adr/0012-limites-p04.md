# ADR 0012 — Limites não funcionais (P04) propostos a partir do S02
Status: **proposto**. Números derivados de medição real; a escolha é decisão humana. Não substitui `docs/04-pendencias.md` P04 até ser aceito.

## Contexto
P04 pede valores para bytes por célula/BLOB/SQL, memória do processo e timeouts, "sem exigir aceitar query/arquivo arbitrariamente grande". O usuário já prioriza **total exato com demora e botão cancelar**. O S02 mediu volume, streaming, contagem e célula grande em MySQL 8.4.13 (`docs/spikes/20261029_s02-volume-evidence.md`).

## Medições que sustentam a proposta
| Medida | Resultado |
|---|---|
| 300.000 linhas bufferizadas | 45 MB de rss, 255 ms — **~157 B/linha** |
| 2.000.000 linhas em streaming, drenando tudo | 1,6 s, Δheap 0,2 MB, pico de rss 121 MB (lixo do GC, não retenção) |
| 2.000.000 linhas retendo apenas 1.000 | 1,3 s, Δheap 0,2 MB |
| Linha larga (40 colunas, 2,3 kB de payload) | **3.604 B/linha retida** — 1,53× o payload |
| `COUNT(*)` em 2.000.000 linhas | 64–182 ms (varia com o buffer pool) |
| `COUNT` com filtro não indexado | 447–561 ms |
| `LIMIT 1001` (estratégia "tem mais?") | 2 ms |
| BLOB de 8 MB | fetch em 21–27 ms |
| Inserts com mais de `max_allowed_packet` (64 MB) | recusados; conexão encerrada pelo servidor |

Consequência aritmética: 1.000 linhas retidas custam ~3,6 MB em linhas largas típicas, mas 1.000 células de 1 MB custariam 1 GB. O limite que protege a memória **não é o número de linhas**, é o **total de bytes retidos**.

## Proposta
| Parâmetro | Valor proposto | Justificativa |
|---|---|---|
| Linhas retidas por conjunto | **1.000** | já na baseline; 3,6 MB em linhas largas |
| Orçamento de memória por conjunto | **64 MB retidos** | atingido o teto, para de reter e marca "truncado por memória" |
| Texto exibido por célula | **64 KB**, com indicação de tamanho real e ação explícita para ver o resto | 1.000 × 64 KB = 64 MB no pior caso |
| BLOB exibido na grade | **não renderizado acima de 1 MB**; mostra tamanho e tipo | evita Buffer gigante na UI |
| BLOB carregado sob demanda | teto de **16 MB** por valor | acima disso, oferecer salvar/abrir externo (fora do MVP) |
| Texto SQL no editor | **1 MB** por aba; aviso acima de 256 KB | acima disso o custo é do parser, não do servidor |
| Timeout de conexão | **10 s** | padrão do mysql2 (`connectTimeout`) é 10 s |
| Timeout de execução | **sem timeout automático** | usuário prioriza demora com cancelamento; cancelar é S04 |
| Contagem | `COUNT(*)` em **consulta separada e cancelável** | medido; nunca reescrever o SQL nem usar `SQL_CALC_FOUND_ROWS` |
| Streaming | **obrigatório** para resultados de usuário; drenar o resto após reter 1.000 | drenar 2 M custou 1,3 s com heap estável |
| Descartar conexão após cancelar | **sim** | estado do protocolo fica indefinido; ver S04 |

## Consequências
- O grid nunca cresce com o total de linhas: memória depende do orçamento de 64 MB, não do volume.
- "Retornou 1.000 linhas" e "existem N linhas" passam a ser **duas** operações com estados distintos na UI.
- Células acima de 64 KB precisam de UI própria (abrir/ver tamanho), o que é escopo novo — hoje só existe a grade.
- Os valores são propostas; nenhum foi aplicado em código.

## Pendente
- S04 precisa provar cancelamento e o que acontece com a transação depois dele.
- 9.7 LTS e 8.0.46 continuam sem ambiente: números podem mudar entre linhas.
