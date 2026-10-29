# Requisitos funcionais — baseline
| ID | Requisito aceito |
|---|---|
| R01 | Electron, TypeScript, Vue 3; Windows 11 x64. |
| R02 | Nome SeshatSQL; produto aberto/gratuito inicial; MPL-2.0. Recursos pagos futuros indefinidos. |
| R03 | Host IP/nome, porta separada, usuário/senha; sem URI completa nem configuração TLS no MVP. Não enfraquecer TLS silenciosamente. |
| R04 | Perfis múltiplos com nome, cor e ambiente desenvolvimento/homologação/produção/personalizado. Uma conexão lógica ativa. |
| R05 | Sessão MySQL compartilhada por abas; uma execução ativa; USE/SET/transações compartilhados; banco atual visível. |
| R06 | Conexão auxiliar do mesmo perfil permitida para controle/cancelamento. |
| R07 | Árvore de bancos/tabelas; tabela oferece dados/estrutura e ação de gerar SELECT sem executar. |
| R08 | Estrutura: colunas, tipos, nulabilidade, defaults, PK, índices, FKs e CREATE TABLE. Grid somente leitura. |
| R09 | Editor com várias abas; SQL digitado/colado; seleção tem prioridade, sem seleção executa editor inteiro; F9. |
| R10 | Múltiplas instruções válidas; resultados separados; erro interrompe lote; nunca repetir automaticamente. |
| R11 | SELECT grid; escrita resumo/afetadas; outros comandos mensagem; erro associado à instrução. CALL pode gerar múltiplos resultados. |
| R12 | Escrita permitida: INSERT/UPDATE/DELETE/CREATE, ALTER/DROP/TRUNCATE/USE/SET/transações/CALL. Definir rotinas/DELIMITER depois. |
| R13 | Confirmar DROP/TRUNCATE/DELETE sem WHERE/UPDATE sem WHERE/ALTER destrutivo antes do lote inteiro. Análise inconclusiva: aviso e confirmação. |
| R14 | Autocommit padrão; respeitar controle explícito; indicador transacional; pedir decisão ao desconectar/trocar perfil com transação aberta; nunca commit silencioso. |
| R15 | Botão cancelar; estado real, sem prometer cancelamento instantâneo/rollback de lote. |
| R16 | Até 1000 linhas por grid; total tabela estimado rotulado; retornado exato e total sem LIMIT quando seguro, aceitando demora. Indisponível com motivo permitido. |
| R17 | F5 contextual: árvore/estrutura/dados atualizam; editor não executa SQL. |
| R18 | connections.yml, preferences.yml e tabs_states.yml no diretório de dados; nome do diretório novo pendente P01. |
| R19 | Senha protegida pelo SO; texto SQL legível em YAML permitido. |
| R20 | Salvar abas com debounce 500 ms; restaurar texto/título/ordem/ativa/conexão/banco/cursor/seleção. Sem restaurar resultados nem executar. |
| R21 | Inicialização restaura interface e aguarda usuário conectar. |
| R22 | en-US padrão, pt-BR, pt-PT, fr, es; contexto traduzido e erro original MySQL preservado. |
| R23 | Tema claro/escuro e inicial pelo sistema; contexto nome/cor/ambiente sempre visível, sem depender apenas de cor. |
| R24 | Instalador por usuário, sem atualização automática no MVP. |
| R25 | Homologação alvo MySQL 8.4/9.7 LTS e 8.0.46 legado; patches LTS a fixar. Ainda não testado. |
## Exclusões
Importação/exportação; edição de grid; runtime/SDK/marketplace de extensões; integração Devtools/IA; backend central/equipes; outros bancos; macOS/Linux; múltiplas conexões lógicas de trabalho; portable; auto-update.
## Roadmap não contratual
Extensões de terceiros inspiradas no VS Code, sem compatibilidade VSIX prometida; API Devtools/IA com política de dados a definir; MariaDB/PostgreSQL/SQLite/SQL Server/Firebird/InterBase; equipes e colaboração; edição, importação/exportação; plataformas adicionais.
