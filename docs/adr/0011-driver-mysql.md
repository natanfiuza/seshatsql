# ADR 0011 — Driver MySQL (mysql2)
Status: **proposto**. Evidência do spike S01 registrada; a escolha definitiva é decisão humana e ainda depende de S02–S04.

## Contexto
`docs/05-spikes.md` S01 exige, para cada linha alvo de MySQL, evidência de autenticação, Unicode, NULL/vazio, BIGINT/DECIMAL sem coerção, datas/fuso, BLOB, múltiplos conjuntos de `CALL` e protocolo de erro. O spike foi executado contra **MySQL Community 8.4.13** em `127.0.0.1:3307` (evidência em `docs/spikes/20261029_s01-driver-evidence.md`). As linhas 9.7 LTS e 8.0.46 ainda não têm ambiente, então o ADR cobre hoje só a linha 8.4.

## Evidência (resumo do que foi medido)
- `mysql2` 3.24.6 conecta com `caching_sha2_password` sobre TCP, sem configuração extra.
- **BIGINT acima de 2^53 perde precisão** com as opções padrão: `9007199254740993` volta como `number 9007199254740992`. Com `supportBigNumbers: true` + `bigNumberStrings: true` volta como `"9007199254740993"`.
- `DECIMAL(65,30)` volta como **string** exata nas duas configurações — não há coerção silenciosa.
- `DATETIME`/`TIMESTAMP`/`DATE` voltam como `Date` interpretado no fuso do processo Node (`America/Sao_Paulo`); o texto original `13:45:10` virou `16:45:10.000Z`. Com `dateStrings: true` voltam literais (`"2026-10-29 13:45:10.123456"`).
- `TIME` volta sempre string. `BLOB`/`VARBINARY`/`BIT` voltam `Buffer`. `JSON` volta objeto já desserializado.
- `NULL`, `''`, `0`, `' '` e `'NULL'` são distinguíveis; nenhum vira o outro.
- Unicode em `utf8mb4` (emoji, CJK, acento) faz round-trip íntegro.
- `CALL` devolve array com **um elemento por conjunto de resultados** mais um `OkPacket` final; `ROW_COUNT()` depois do `CALL` é `-1`.
- Erros trazem `code`, `errno`, `sqlState` e `sqlMessage` — suficiente para a UI distinguir erro de sintaxe, tabela inexistente, duplicidade, FK e acesso negado.
- Com `multipleStatements: false` (padrão), o driver **recusa** um lote de statements em vez de executá-lo parcialmente.
- Parâmetros de `execute()` passados como número JS sofrem a mesma perda de precisão de BIGINT.

## Decisão proposta
Adotar `mysql2` (3.24.6, MIT) como driver único, criando conexões **sempre** com:

```
supportBigNumbers: true
bigNumberStrings: true
dateStrings: true
multipleStatements: false
```

`multipleStatements: false` é obrigatório: sem ele o driver executaria lote em uma chamada única, contrariando a regra de snapshot imutável e confirmação por lote.

## Consequências
- **BIGINT e DECIMAL chegam como string.** A camada `infrastructure` não converte para `number`; a exibição usa o texto e qualquer cálculo numérico precisa ser decidido explicitamente, não herdado do driver.
- **Datas chegam como texto do servidor.** Formatação e ordenação passam a ser responsabilidade nossa, e o fuso deixa de ser reinterpretado pelo processo Node — o que também significa que a UI deve deixar claro o fuso da sessão.
- Parâmetros enviados ao servidor também não podem ser `number` para valores grandes: a camada de execução precisa mandá-los como string.
- `CALL` exige tratar "N conjuntos + OkPacket" e não pode usar `ROW_COUNT()` como contagem.
- **S02 confirmou** o desenho de volume: 2.000.000 de linhas em streaming drenam em 1,6 s com heap estável, reter só 1.000 linhas mantém a memória plana e `COUNT(*)` exato custa 64–182 ms — ver `docs/spikes/20261029_s02-volume-evidence.md` e o ADR 0012.
- Continuam **sem evidência** (pendentes de S03–S04): cancelamento (`KILL QUERY` vs. destruir conexão), estado de transação após falha de rede, permissões e o splitter/parser. O ADR não deve ser aceito como definitivo antes disso.

## Alternativas
`mariadb` (não suporta a linha 8.4 com fidelidade) e drivers nativos por linha (custo de manutenção alto para o MVP). Nenhuma foi testada; registradas para não parecer que a escolha foi por omissão.
