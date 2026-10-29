# Rodada 7 — decisões aceitas
D7-01 Diretório vigente: ~/.seshatsql/data/. Substitui o diretório anteriormente especificado ~/.sqlseshat/data/.
D7-02 Fechamento com transação aberta: oferecer voltar ao aplicativo, executar ROLLBACK e sair, ou executar COMMIT e sair por ação e confirmação explícitas. Se a operação falhar ou seu estado não puder ser confirmado, manter janela aberta e informar o problema. Nunca fazer COMMIT silencioso.
D7-03 Fechamento com execução ativa: pedir confirmação para solicitar cancelamento, aguardar resposta e só então prosseguir no fluxo de fechamento. Não apresentar cancelamento como garantia de rollback global.
D7-04 Excluir perfil preserva SQL de suas abas, marcando conexão indisponível e permitindo associar outro perfil depois. Não reinterpretar exclusão de perfil como autorização para descartar transação ativa.
D7-05 Destino indicado: natanfiuza/seshatsql. Não implica repositório existente/criado, acesso GitHub, propriedade de marca ou publicação autorizada.
D7-06 Desinstalar preserva dados do usuário. Excluir o diretório de dados exige ação separada, explícita e confirmada.
## Aplicação sobre a baseline
P01 encerrada: novo diretório aceito. P02 encerrada no comportamento de produto; validação técnica de detecção transacional/cancelamento permanece em spike. P05 parcialmente encerrada: conta e nome do repositório definidos; appId, publisher, certificado, acesso e criação/publicação não definidos nem executados. P07 encerrada quanto à exclusão de perfil; histórico adicional/troca de banco continuam sujeitos à especificação e revisão.
Não há autorização automática para migrar arquivos que eventualmente existam no diretório antigo. Investigar existência, conflitos e plano de migração antes de escrita; não apagar origem silenciosamente.
