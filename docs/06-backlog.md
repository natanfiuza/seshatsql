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
## Status em 2026-10-29
T00 concluído: versões exatas fixadas, lockfile gerado, mapa de licenças levantado (zero copyleft).
T01 concluído: scaffold Electron/Vue/TS com scripts; typecheck, lint, 6 testes unitários, build, 1 teste e2e e a janela em modo dev verificados com exit 0. Preload expõe apenas uma constante; sem IPC de consulta.
T04 concluído em 2026-10-31: CRUD de perfis sem conectar; modal mestre-detalhe por Ferramentas > Conexões… e pela toolbar; quatro ambientes com rótulo custom; paleta de oito cores; id UUID gerado pelo main, nome único e `not-found` sem upsert; senha write-only em DPAPI; `connections.yml` schemaVersion 2 com migração v1 e `.bak`; exclusão em duas etapas sem tocar abas. Evidência em `docs/spikes/20261031_t04-connections-evidence.md`, ADR 0017 **proposto**. Verificação: 215 testes unitários/componente, 27 e2e, pacote `win-unpacked` e 1 e2e do pacote aprovados. Falta revisão humana.
T02 executado: **S01, S02, S03 e S04 medidos** contra MySQL 8.4.13 (127.0.0.1:3307), todos com 0 falhas de verificação. Evidências em `docs/spikes/20261029_s01-driver-evidence.md`, `20261029_s02-volume-evidence.md`, `20261029_s03-sql-splitting-evidence.md` e `20261030_s04-session-cancel-evidence.md`; ADR 0011 (driver mysql2 com `supportBigNumbers`, `bigNumberStrings`, `dateStrings`, `multipleStatements: false`), ADR 0012 (limites P04: 1.000 linhas e 64 MB por conjunto, célula 64 KB, BLOB sob demanda), ADR 0013 (tokenizador próprio, bloqueio de lote em rotina/DELIMITER/string não terminada, splitter ciente do `sql_mode`) e ADR 0014 (cancelar = `KILL QUERY` sem rollback, `INNODB_TRX` como verdade com leitura estabilizada e `PROCESS` exigido, `unknown` bloqueia escrita, DDL/`LOCK TABLES` pedem confirmação, `destroy()` não encerra sessão) **propostos**. Falta a revisão humana dos quatro ADRs; 9.7 LTS e 8.0.46 continuam sem ambiente, então os ADRs não são definitivos.
