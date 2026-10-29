# Critérios de aceite e evidências
A01 Restaurar SQL/aba/contexto/seleção sem conectar nem executar.
A02 Perfis em arquivo no diretório aprovado, senha não clara; erro DPAPI não grava claro.
A03 Uma conexão lógica, sessão compartilhada, uma execução; USE/SET/transação coerentes entre abas.
A04 Dois SELECTs válidos produzem resultados separados; ';' em literal/comentário não divide incorretamente; CALL múltiplos conjuntos.
A05 Falha na segunda instrução impede terceira, sem repetir execução e sem alegar rollback das anteriores.
A06 Lote com INSERT anterior a DROP: cancelar confirmação impede INSERT. Alteração do SQL/contexto invalida confirmação.
A07 Parser inconclusivo requer aviso/confirmar; não afirma que ausência de alerta prova segurança.
A08 >1000 linhas mantém limite por grid; total retornado exato quando completado; memória medida e limitada conforme política aprovada. Total sem LIMIT falha com motivo sem invalidar resultado original.
A09 Tabela apresenta total estimado identificado; estrutura inclui todos campos aprovados; permissão negada não derruba conexão.
A10 Cancelar execução/contagem mostra estados reais; conexão perdida nunca repete escrita; fechamento transacional nunca commit silencioso.
A11 F5 não reexecuta conteúdo do editor nem escrita; F9 usa seleção ou inteiro.
A12 YAML inválido recebe recuperação e mensagem, não descarta SQL silenciosamente; backup validado.
A13 Células/erros com HTML/scripts exibidos como texto. IPC inválido/remetente não permitido recusados. Logs sem senhas/textos/resultados sensíveis por padrão.
A14 BIGINT/DECIMAL/NULL/binários/datas/Unicode não sofrem conversão silenciosa; limites por célula sinalizados.
A15 en-US/pt-BR/pt-PT/fr/es e tema claro/escuro, inclusive componentes; nomes SQL permanecem originais.
A16 Instalador Windows x64 por usuário; abre sem Node/MySQL local/servidor dev; depois de instalado operações básicas não exigem rede além do MySQL.
A17 MySQL 8.4/9.7 patches fixados e 8.0.46 legado com evidências; não chamar de homologado sem execução.
## Registro
Para cada cenário: ID, versão aplicativo/Electron/Node/Windows/MySQL, preparação, comando, esperado, obtido, status, evidência, defeito. Testes de escrita somente fixtures descartáveis. Nenhum cenário executado neste pacote.
