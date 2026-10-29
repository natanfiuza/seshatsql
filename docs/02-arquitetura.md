# Arquitetura proposta
## Fluxo
Renderer Vue -> preload API tipada -> IPC validado -> serviços de aplicação -> adaptador MySQL -> sessão de trabalho/controle.
Core domain: perfis/abas/contexto, plano de execução/snapshot, mensagens/result sets, políticas de confirmação e limites. Infrastructure: driver, filesystem/YAML, safeStorage e logging. Main coordena janelas e serviços. Definir processo dedicado para engine após spike; worker/processo não garante sandbox contra código malicioso.
## Estados
Conexão: disconnected -> connecting -> connected -> disconnecting; failed/unknown explícitos. Execução: idle -> analysing -> awaiting_confirmation -> executing -> cancelling -> completed/failed/cancelled/unknown. Não permitir segunda execução ativa. UI pode editar outro buffer sem mudar snapshot em execução.
## Contratos de aplicação propostos
profiles.list/save/delete/test/connect/disconnect; schema.listDatabases/listTables/describe; tabs.save/load; execution.prepare/approveAndRun/cancel; preferences.get/set. Nomes ilustrativos, não API pronta. Mensagens carregam IDs estáveis e requestId, nunca senha em retorno. Limitar payload, filas e tamanho de valores.
PreparedExecution contém ID, snapshot SQL, conexão, banco inicial, hash/versão de contexto e instruções/riscos. Aprovação vincula exatamente ao snapshot. SQL USE/SET no lote exige rastrear contexto por instrução quando determinável; análise inconclusiva exige aviso.
## Resultados
Separar StatementOutcome de ResultSet. Uma instrução pode retornar zero/um/vários conjuntos. Máximo 1000 linhas retidas para visualização por conjunto; contagem retornada pode exigir drenar streaming sem reter excedentes. Tamanho de BLOB/célula precisa política P04, não carregar valor arbitrário.
Total sem LIMIT só para estratégias demonstradas seguras, considerando sessão, snapshot de dados, efeitos colaterais e sintaxe. Não reescrever com regex e não prometer equivalência sob concorrência. Cancelar contagem adicional deve preservar resultado original.
## Sessão e transações
Abas compartilham USE/SET/temp tables/transação. Atualizações automáticas e metadados precisam escalonamento e não podem intercalar SQL indevido. Auxiliar pode não enxergar dados não commitados/temp tables; não contornar isso silenciosamente. Consultas que causam commit implícito exigem indicador fiel ao servidor/driver. Parser não é única fonte da verdade.
## Persistência
Propor schemaVersion + IDs estáveis; home via app.getPath('home'). Gravação serializada, temporário no mesmo diretório, substituição validada Windows e último backup válido; schema validado; flush ao fechar. Perda de energia não tem garantia zero. Arquivos Chromium não devem ser misturados sem necessidade aos YAML de domínio.
## Segurança
Renderer sandboxed, contextIsolation true, nodeIntegration false; CSP sem relaxamento global por Monaco; validar IPC remetente/payload/autorização; URLs externas só permitidas explicitamente; nunca executar HTML de células/erros. SafeStorage no main, DPAPI Windows; indisponibilidade pede senha, sem claro. Segredos não transitam em logs. LOCAL INFILE e recursos extras do driver devem ficar desabilitados quando não requeridos; confirmar compatibilidade em spike.
