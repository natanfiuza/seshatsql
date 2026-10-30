# SeshatSQL — contrato de execução do agente
## Autoridade e revisão
Os requisitos aceitos vêm das rodadas 1–6 consolidadas. Propostas e pendências não são autorizações. Usuário revisa cada etapa; não iniciar a seguinte automaticamente. Nunca alegar testes/build aprovados sem comandos, resultados e evidências.
Nome vigente SeshatSQL; não inventar appId, conta GitHub ou caminhos novos. A mudança de diretório depende de P01. Não consultar/copiar documentação antiga por cima da baseline sem registrar conflito.
Git é somente leitura para o agente: `git commit` e `git push` são proibidos sem exceção, e nenhuma operação GitHub é executada pelo agente. Ao final de cada tarefa, solicitar ao usuário que execute o commit e o pull request com a ferramenta `gitpr`.
## Limites do MVP
Electron + TypeScript + Vue 3; Windows 11 x64; MySQL. Não adicionar backend web, exportação/importação, extensões, IA, colaboração, outros bancos ou editor de grid. MPL-2.0 escolhida; incluir texto original oficial e avisos corretos antes de publicar. Não copiar/traduzir implementações/assets do HeidiSQL.
## Regras técnicas
Renderer sem Node, sandbox e contextIsolation; preload mínimo; IPC validado e autorizado; dados SQL renderizados como texto. Não expor invoke genérico, objetos de driver ou credenciais ao renderer.
Separar domain/application/infrastructure e UI sem burocracia desnecessária. Interface interna de adaptador não equivale a SDK público de extensão.
Uma sessão de trabalho compartilhada, uma execução ativa. Conexão auxiliar permitida para controle/cancelamento. Não usar essa sessão auxiliar para contar dados dependentes de estado da sessão de trabalho sem demonstrar semântica correta.
Não usar split(';'). Não reexecutar SQL arbitrário para contar; não alterar LIMIT silenciosamente; não usar SQL_CALC_FOUND_ROWS. Resultado limitado não implica memória/transferência limitada: medir.
Lote aprovado é snapshot imutável de SQL e contexto; alteração exige nova análise/confirmação. Parser inconclusivo gera aviso e confirmação, sem falsa garantia de segurança.
Não repetir SQL após falha de rede. Não COMMIT silencioso. Cancelar não equivale a rollback global. Não prometer rollback de DDL.
Senhas só cifradas pelo SO, sem fallback em claro. SQL legível no YAML permitido, não em logs por padrão. YAML validado, versionado, recuperação sem descarte silencioso.
Todo código gerado é escrito em inglês: identificadores (variáveis, funções, classes, tipos), comentários, doc comments e nomes de teste. Texto exibido ao usuário vem dos catálogos de i18n (en-US padrão, pt-BR, pt-PT, fr, es), nunca fixo no código. Documentação, evidências e mensagens de produto em português permanecem em português.

## Tarefas e encerramento
Cada tarefa informa objetivo, dependências, critérios de aceite, testes, riscos e condições de parada. Mudança em dependência exige licença/versão registradas. npm ci só depois de lockfile aprovado.
Teste destrutivo apenas em banco descartável autorizado; nunca usar perfis reais do usuário. Entregar diff, comandos/resultados, pendências e documentos atualizados, então aguardar revisão.
- Ao finalizar qualquer tarefa, gerar relatório detalhado em `docs/claude-code/reports/{branch}/{dataatual}_{taskname}.md`, onde {dataatual} deve ser substituida pelo data atual, e onde {branch} deve ser substituida pela branch atual, onde {taskname} deve ser uma descricao curta da tarefa, sem espaços ou caracteres especiais, apenas letras minusculas, separados por underscore.
