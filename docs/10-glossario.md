# Glossário consolidado
SeshatSQL: nome vigente do produto; SQLSeshat é nome histórico.
Perfil: parâmetros persistidos de acesso com nome/cor/ambiente.
Conexão lógica: contexto ativo de trabalho do usuário.
Sessão MySQL: conexão física com estado próprio, USE/SET/temp tables/transação.
Sessão auxiliar: conexão do mesmo perfil para controle; não enxerga automaticamente estado local de outra sessão.
Aba de consulta: editor persistente; não tem transação isolada no MVP.
Aba de resultado: visualização de conjunto de resultado.
Instrução: unidade SQL; pode produzir zero/um/vários resultados.
Snapshot de execução: SQL e contexto capturados, imutáveis entre confirmação e envio.
Total retornado: linhas produzidas pela instrução respeitando LIMIT.
Total sem LIMIT: contagem de conjunto equivalente sem limitação; só quando seguro/demonstrado.
Estimativa: estatística aproximada explicitamente identificada.
Linhas afetadas: resumo de escrita conforme servidor/driver; não é total retornado.
Cancelar: solicitar interrupção; distinto de rollback e de confirmação de interrupção.
Retomada: restaurar interface/texto, sem reabrir sessão nem repetir SQL.
Debounce: agrupar mudanças por intervalo antes de gravar.
DPAPI: mecanismo Windows usado pelo safeStorage para proteção local.
IPC: comunicação entre processos; precisa validação e autorização.
i18n: organização de idiomas; não traduz objetos SQL nem erro original servidor.
Spike: experimento limitado com critério de saída para reduzir incerteza.
Homologação: compatibilidade demonstrada em versão/patch registrados.
MPL-2.0: licença escolhida, copyleft por arquivo sob suas condições.
Extensão: pacote futuro que implementa API pública ainda não definida.
Devtools: ferramenta externa do usuário com processamento IA; contrato futuro.
