# Backlog para Claude Code
Todos os itens começam NÃO INICIADO. Executar somente item/etapa autorizada. Antes de cada tarefa: ler baseline, resolver bloqueadores, informar arquivos reais após inspecionar repositório. Depois: diff, testes reais, limitações e revisão humana.
| ID | Objetivo | Depende | Critério de saída |
|---|---|---|---|
| T00 | Fixar toolchain/dependências e mapa de licenças | aprovação; P05 parcial | versões, compatibilidade, comandos e plano de lockfile revisados |
| T01 | Scaffold Electron/Vue/TS e scripts | T00 | janela local abre; typecheck/test/lint básicos; sem API privilegiada ampla |
| T02 | Executar S01–S04, definir driver/parser/limites | T01; banco teste | evidências reais e ADR técnico atualizado; decisão humana |
| T03 | Executar S05/S06 e validar pacote | T01; P01 | workers/idiomas/persistência/Windows demonstrados |
| T04 | Perfis, preferências, DPAPI e YAML | T02/T03; P01 | salvar/reabrir sem senha clara; perfis com cor/ambiente |
| T05 | Conectar/desconectar e sessão compartilhada | T04; P02 | uma sessão trabalho, auxiliar controle; transação/falhas corretas |
| T06 | Árvore e estrutura | T05 | bancos/tabelas/colunas/índices/FKs/CREATE; erros de permissão tratados |
| T07 | Abas/editor e persistência | T04; T03 | 500 ms debounce, texto/restauração; startup sem conexão/execução |
| T08 | Pipeline prepare/confirm/run/cancel | T02/T05/T07 | snapshot imutável, F9, confirmação pré-lote, stop-on-error |
| T09 | Resultados e totais | T08 | <=1000 por grid, outcomes/CALL, contagens/indisponível com motivo |
| T10 | Ações tabela, F5 e contexto | T06/T09 | dados/estrutura/SELECT gerado; refresh sem repetir escrita |
| T11 | Temas/i18n/acessibilidade básica | incremental desde T01 | cinco idiomas e contexto não só por cor; componentes testados |
| T12 | Regressão/recuperação/segurança | T04–T11 | matriz testes e evidências Windows/MySQL |
| T13 | Instalador por usuário e manual | T12; P05 | instalação não admin, sem auto-update, retenção de dados definida |
| T14 | Revisão release/documentação/licenças | T13 | checklist auditado e aceite humano; não publicar automaticamente |
## Modelo de tarefa
Objetivo; requisitos Rxx; dependências/pendências; escopo/exclusões; arquivos reais; passos; testes positivos/negativos; evidência; riscos/condição de parada; docs alterados. Não implementar mais de uma etapa autorizada para adiantar trabalho.
