# Experimentos e gates
S00 Dependências: inspecionar versões/engines/peer deps/licenças; matriz aprovada e lockfile reproduzível. Sem versão inventada. Gate: npm ci e import básico Windows.
S01 Driver: cada MySQL alvo, banco descartável; auth necessária, Unicode, NULL/vazio, BIGINT/DECIMAL sem coerção, datas/timezone, BLOB, múltiplos conjuntos CALL e protocolo de erro. Gate: evidência dos limites e tipos.
S02 Volume/contagem: milhões de linhas sintéticas e resultados amplos; manter até 1000 linhas por grid, medir memória, streaming/drain, cancelamento e total retornado; total sem LIMIT seguro/indisponível. Gate: relatório e limites propostos P04, sem reexecução de SQL com efeitos.
S03 SQL: semicolons em strings/comentários, backticks, SQL modes, CTE, UNION, variáveis USE/SET, instrução inválida, rotinas excluídas, múltiplos resultados. Gate: parser/splitter e política de fallback demonstrados.
S04 Sessão/cancelar: transação compartilhada, controle auxiliar, permissões, commit implícito, falha de rede e conexão perdida. Gate: não repetir escrita nem alegar rollback global; estado unknown explícito quando necessário.
S05 UI pacote: Monaco workers/CSP/locales/models; grid Community copiar dados; temas; cinco idiomas; offline depois de instalar. Gate: pacote Windows abre editor/grid sem servidor dev.
S06 Persistência: DPAPI, cifragem indisponível, YAML corrompido, flush/debounce, recovery e restart sem conexão/SQL. Gate: evidências sem segredos.
Spikes podem falhar; registrar alternativas e pedir aprovação antes de trocar stack/escopo.
