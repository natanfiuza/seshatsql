# Etapa 0 — preparação técnica controlada
Estado: pronta para autorização; não iniciada.
## Objetivo
Verificar ambiente e metadados de dependências, propor versões exatas e preparar um plano reproduzível antes da geração de aplicação.
## Pré-condições
Baseline v1.0-draft e este complemento disponíveis; diretório/repositório real de trabalho informado ou inspecionado; comandos que alterem ambiente e ações externas autorizados quando necessário. Não presumir que natanfiuza/seshatsql existe.
## Atividades
1. Inspecionar workspace e arquivos existentes sem sobrescrever. Relatar branch/status se houver Git.
2. Verificar Windows/arquitetura, Git, Node e npm reais. Distinguir documentação consultada de execução local.
3. Consultar registro/documentação oficial para engines, peers, versões, licenças e avisos transitivos de Electron/TypeScript/Vue, mysql2, Monaco, AG Grid Community, Vue I18n, Zod, yaml, Vitest, Playwright, electron-vite e electron-builder. Parser SQL permanece spike próprio.
4. Revalidar baseline candidata Node 24.22.2, Electron 45.1.0 e electron-vite 5.0.0 antes de congelar. Não substituir por latest silenciosamente.
5. Propor matriz de versões exatas, estrutura inicial, scripts e política de lockfile. Registrar incompatibilidades, alternativas e perguntas.
6. Propor ambientes MySQL descartáveis 8.4/9.7 LTS e legado 8.0.46, sem instalar/subir nada nesta etapa de inspeção.
## Exclusões
Não criar/publicar repositório, não instalar pacotes globalmente, não gerar aplicação, não acessar banco real, não migrar/apagar dados, não alterar ExecutionPolicy, não gerar instalador nem implementar funcionalidades. Não alegar que esta autorização já foi dada.
## Aceite
Relatório factual do ambiente; matriz de dependências com fonte/versão/licença/compatibilidade; plano de scaffold e scripts; bloqueadores; nenhum segredo exposto; nenhuma alteração não autorizada. Pausar para revisão antes de T01.
