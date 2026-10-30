# SeshatSQL — Contrato de Execução do Agente (Gemini / Antigravity)

> **Fonte Única de Verdade (Single Source of Truth - SSOT):**
> Este arquivo integra-se formalmente com o [CLAUDE.md](./CLAUDE.md), que é a autoridade canônica para todas as diretrizes de governança, restrições arquiteturais, limites de escopo e execução de tarefas neste repositório.
> Qualquer atualização ou alteração nas regras e contratos de execução deve ser realizada diretamente no `CLAUDE.md`.

---

## 1. Diretriz de Execução e Delegação Canônica
Todos os agentes e assistentes (incluindo Gemini CLI, Google Antigravity e modelos da família Gemini) devem carregar, respeitar e aplicar integralmente as regras estabelecidas no arquivo [`CLAUDE.md`](./CLAUDE.md).

Em caso de divergência ou ambiguidade, o conteúdo de `CLAUDE.md` prevalece sem exceções.

---

## 2. Síntese do Contrato Canônico (Espelho de Governança)

### Autoridade e Revisão
- Os requisitos aceitos decorrem das rodadas 1–6 consolidadas. Propostas e pendências não constituem autorizações.
- O usuário deve revisar cada etapa individualmente; nunca iniciar a etapa seguinte de forma automática.
- Nunca alegar aprovação de testes ou build sem apresentar os comandos executados, seus respectivos resultados e evidências concretas.
- Nome vigente do projeto: **SeshatSQL**. Não inventar `appId`, contas GitHub ou caminhos novos. A mudança de diretório depende de P01.
- Não consultar nem sobrepor documentação legada na baseline sem registro explícito de conflito.
- **Git é estritamente somente leitura para o agente**: `git commit` e `git push` são categoricamente proibidos. Nenhuma operação remota no GitHub deve ser executada pelo agente. Ao término de cada tarefa, solicite formalmente ao usuário que execute o commit e o pull request através da ferramenta CLI `gitpr`.

### Limites do MVP
- **Stack**: Electron + TypeScript + Vue 3; alvo prioritário Windows 11 x64; banco de dados MySQL.
- **Escopo restrito**: Não adicionar backend web, exportação/importação, sistema de extensões, IA, colaboração em tempo real, suporte a outros SGBDs ou editor de grid de dados.
- **Licenciamento**: Licença MPL-2.0. Incluir texto original oficial e avisos correspondentes antes de publicar.
- **Propriedade intelectual**: Proibido copiar ou traduzir implementações ou assets do HeidiSQL.

### Regras Técnicas Arquiteturais
- **Segurança de Processos**: Renderer sem Node.js, com sandbox ativo e `contextIsolation: true`. Preload estritamente mínimo; canais IPC validados e autorizados. Dados SQL renderizados exclusivamente como texto. Proibido expor `invoke` genérico, instâncias de driver ou credenciais ao renderer.
- **Separação de Camadas**: Manter segregação nítida entre Domain, Application, Infrastructure e UI, sem acoplamento desnecessário.
- **Sessão e Conexões**: Uma única sessão de trabalho compartilhada com uma execução ativa por vez. Conexão auxiliar permitida exclusivamente para controle e cancelamento de queries. Não utilizar a conexão auxiliar para aferição de dados com dependência de estado da sessão principal.
- **Manipulação de SQL**: Proibido uso ingênuo de `split(';')`. Proibido reexecutar queries arbitrárias para contagem de registros; proibido alterar cláusulas `LIMIT` silenciosamente; proibido o uso de `SQL_CALC_FOUND_ROWS`. Medir uso de memória e transferência real de dados.
- **Transações e Lotes**: Lote aprovado é um snapshot imutável de SQL e contexto de execução; qualquer alteração demanda nova análise e confirmação. Parser inconclusivo emite aviso e requer confirmação do usuário.
- **Resiliência e Erros**: Não repetir execução de SQL após queda de rede. Proibido executar `COMMIT` silencioso. Cancelamento de query não equivale a rollback global. Nunca prometer rollback para instruções DDL.
- **Segurança de Credenciais**: Senhas armazenadas exclusivamente cifradas via API nativa do SO, sem fallback em texto claro. Queries legíveis em YAML são permitidas; proibido logar queries e dados sensíveis por padrão.

### Tarefas e Critérios de Encerramento
- Cada tarefa deve especificar com precisão: objetivo, dependências, critérios de aceitação, testes aplicados, riscos identificados e condições de parada.
- Qualquer alteração em dependências exige registro formal de licença e versão. Comandos `npm ci` são permitidos apenas após aprovação e validação do lockfile.
- Testes destrutivos devem ocorrer única e exclusivamente em banco de dados descartável autorizado. Nunca interagir com perfis ou bases reais do usuário.
- **Entrega**: Apresentar diff unificado, comandos executados e seus respectivos resultados/evidências, lista de pendências e documentação atualizada, aguardando em seguida a revisão do usuário.
