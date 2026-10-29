# ADR 0004-totais
Status: Aceito funcional; técnica aberta.

## Contexto
Decisões das entrevistas 1–6; ver requisitos consolidados.

## Decisão
Grid até 1000 linhas; tabela estimada; retornado exato e sem LIMIT quando seguro; indisponível com motivo aceito.

## Consequências e limites
Spike de memória/streaming e equivalência. Não modificar/reexecutar SQL arbitrário para contar.

## Evidência
Aprovação do usuário na conversa; implementação e testes ainda não executados.
