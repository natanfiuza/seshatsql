# 🚀 Sugestão de Pull Request

**Mensagem de Commit Recomendada:**
```text
chore(spikes): adiciona spike do splitter SQL e política de fallback
```

---

## 🎯 Resumo

Antes de implementar execução de múltiplos comandos SQL na aplicação, era necessário saber com precisão onde um splitter textual é confiável e onde ele deve recusar o lote. Este spike (S03) implementa um tokenizador por máquina de estados, mede seu comportamento contra um corpus de 28 casos e confronta cada resultado com o que o servidor MySQL realmente faz. O objetivo é decidir com evidência — e não por intuição — a política de fallback registrada na ADR 0013. Nada aqui vira código de produção sem essa decisão humana.

## 🛠️ Mudanças Técnicas

- Adiciona `spikes/s03-splitter.mjs`, script descartável executado via `node`, com tokenizador que trata strings simples/duplas, identificadores com backtick, comentários `--`, `#` e `/* */`, comentário executável `/*! */` e hints `/*+ */`.
- Classifica cada comando em `read`, `write`, `ddl`, `session`, `routine`, `transaction` ou `unknown` e sinaliza riscos: string/identificador/comentário não terminado, corpo de rotina, comando `DELIMITER` e comentário executável com ponto e vírgula.
- Define corpus de 28 casos com verificação automática de contagem de comandos, classificação e avisos; qualquer divergência faz o script sair com código 1.
- Executa cada comando individualmente (nunca o lote inteiro) e registra a resposta do servidor, confirmando que o driver com `multipleStatements: false` recusa lotes.
- Mede a dependência de `sql_mode` (`NO_BACKSLASH_ESCAPES` e `ANSI_QUOTES`) na divisão e documenta que mudança de modo no meio do lote exige reanálise.
- Gera relatório de evidência em Markdown, por padrão em `docs/spikes/20261029_s03-sql-splitting-evidence.md`, com ambiente, tabela de casos, resultados de execução e conclusões.
- Documentação que acompanha a entrega: ADR 0013 (splitter e fallback), evidência do spike, atualização de pendências, backlog e planos das etapas.

## ⚠️ Impacto/Avisos

- **Sem impacto em produção**: o arquivo vive em `spikes/` e não é importado por nenhum código da aplicação; não altera build nem runtime.
- **Banco de dados**: o spike cria e usa o schema descartável `seshat_spike` (tabela `s03_probe` e procedures `p_multi`/`p_whole`) apenas no MySQL alvo, configurado por `SESHAT_DB_HOST`, `SESHAT_DB_PORT` (padrão `127.0.0.1:3307`) e `SESHAT_DB_USER`. Não deve ser apontado para ambientes compartilhados.
- **Nova variável de ambiente exigida para executar o spike**: `SESHAT_DB_PASSWORD`, obrigatória — o script aborta sem ela. A senha vem apenas do ambiente e nunca é impressa nem gravada no relatório.
- **Dependência**: usa `mysql2`, já presente no projeto; nenhuma dependência nova foi adicionada.
- **Restrições confirmadas que passam a valer para o projeto**: `split(';')` erra a contagem em casos com string, comentário ou backtick; `--` só abre comentário quando seguido de espaço ou caractere de controle; `DELIMITER` e corpos de rotina são recusados pelo splitter, embora o corpo inteiro seja aceito pelo servidor como comando único (alternativa fora do MVP).
- **Decisão pendente**: a política de fallback precisa de aprovação humana via ADR 0013 antes de qualquer implementação em código de produção.

close #9

---

[![GitPR](https://img.shields.io/badge/GitPR-0_errors_%C2%B7_1_warning-yellow)](https://gitpr.natanfiuza.dev.br/)