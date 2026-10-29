# ADR 0005-salvaguardas
Status: Aceito.

## Contexto
Decisões das entrevistas 1–6; ver requisitos consolidados.

## Decisão
Confirmar comandos destrutivos antes de lote inteiro; análise inconclusiva avisa/confirma; snapshot imutável. Autocommit e controle explícito, sem commit silencioso.

## Consequências e limites
Classificador não é prova de segurança; fechamento transacional depende P02; DDL pode commit implícito.

## Evidência
Aprovação do usuário na conversa; implementação e testes ainda não executados.
