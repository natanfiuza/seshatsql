# Pendências e regras de bloqueio
P01 Diretório: usuário renomeou produto, mas havia aprovado ~/.sqlseshat/data/. Proposta: ~/.seshatsql/data/. Não migrar/apagar silenciosamente. Não há arquivos criados por este planejamento; se existirem externos, pedir estratégia de migração.
P02 Fechar com transação/execução ativa: regra aceita de pedir decisão; opções concretas a aprovar. Proposta: cancelar fechamento; rollback e sair; commit e sair somente por ação explícita, com confirmação. Falha mantém janela aberta e mostra estado. Execução ativa: pedir cancelar e aguardar confirmação do servidor.
P03 Política após parser inconclusivo aceita (avisar/confirmar); biblioteca/gramática ainda exige spike. Contagem sem LIMIT tem subconjunto seguro a definir com evidência.
P04 Limites não funcionais: bytes por célula/BLOB/SQL, memória do processo, timeout conexão e timeout exec. Propor valores após medição, sem exigir aceitar query/arquivo arbitrariamente grande. Usuário já prioriza total exato com demora e botão cancelar.
P05 Identificadores de distribuição: conta/repositório, publisher/appId, certificado de assinatura, licença de recursos gráficos. Não inventar identidade. Nome de produto não implica disponibilidade de marca/domínio.
Atualização 2026-10-29: conta/repositório existem (`natanfiuza/seshatsql`); appId definido como `br.com.natanfiuza.seshatsql`; certificado dispensado no MVP (instalador não assinado, aviso do SmartScreen documentado como limitação); licença de recursos gráficos permanece aberta.
P06 Patches MySQL 8.4/9.7, conjunto npm e parser ainda não fixados. Bloqueiam homologação, não a documentação.
P07 Política de excluir perfil associado a abas; mudança do banco na árvore versus USE digitado; retenção de histórico fora das abas. Proposta: sem histórico extra no MVP; não apagar SQL ao excluir perfil, marcar referência indisponível; troca de banco explícita afeta sessão compartilhada.
Nenhuma dessas pendências deve virar decisão silenciosa do Claude Code.
