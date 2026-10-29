# ADR-0010 — Ciclo de vida e preservação dos dados
Status: aceito pelo usuário na rodada 7.
## Contexto
Abas persistentes podem conter trabalho não executado; uma sessão de trabalho compartilhada pode ter execução ou transação ativa. O produto foi renomeado para SeshatSQL.
## Decisão
Diretório de domínio: ~/.seshatsql/data/. connections.yml, preferences.yml e tabs_states.yml mantêm seus nomes aprovados. Resolver home real; não usar ~ literalmente no filesystem.
Ao fechar durante execução, pedir confirmação para cancelar e aguardar resposta. Se ainda houver transação aberta, aplicar depois o diálogo transacional. Oferecer voltar, rollback e sair, ou commit e sair com confirmação explícita. Persistência das abas é independente da decisão transacional; SQL não deve desaparecer se a saída for cancelada.
Falha ou estado inconclusivo mantém janela aberta e informa o problema. Não usar botão de saída como oportunidade para repetir consulta/commit de resultado desconhecido.
Excluir perfil preserva texto das abas, indicando referência indisponível. Desinstalação preserva dados, inclusive consultas e credenciais cifradas. Exclusão de dados requer ação separada explicitamente confirmada.
## Consequências
Implementar fluxo de fechamento coordenado, sem race entre persistência, cancelamento e conexão. Um fechamento do aplicativo não equivale a um comando SQL simples. O sistema operacional pode encerrar um processo abruptamente: esta política descreve o fechamento controlado, sem garantir perda zero.
Repositório alvo: natanfiuza/seshatsql; ações externas requerem autorização específica.
## Evidências futuras
Testar em ambiente descartável: fechar enquanto executa; cancelar fechamento; rollback; commit explícito; falha/rede/estado desconhecido; preservação SQL ao excluir perfil; desinstalar/reinstalar mantendo dados. Nenhum desses testes foi executado.
