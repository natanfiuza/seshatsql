# ADR 0003-sessao-execucao
Status: Aceito.

## Contexto
Decisões das entrevistas 1–6; ver requisitos consolidados.

## Decisão
Sessão compartilhada, uma execução, controle auxiliar permitido; F9 seleção/inteiro; erro interrompe lote; cancelar incluído.

## Consequências e limites
USE/SET/transações globais às abas. Não repetir SQL, nem prometer rollback global.

## Evidência
Aprovação do usuário na conversa; implementação e testes ainda não executados.
