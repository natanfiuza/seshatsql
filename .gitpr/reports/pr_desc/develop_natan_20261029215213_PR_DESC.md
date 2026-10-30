# 🚀 Sugestão de Pull Request

**Mensagem de Commit Recomendada:**
```text
test: adiciona spike s02 de volume e streaming mysql
```

---

## 🎯 Resumo
Adiciona o spike S02 para medir, com dados sintéticos, o comportamento do MySQL e do driver em cenários de volume: memória de resultados bufferizados, streaming e drain, reuso de conexão após `destroy()`, custo de contagem, BLOB grande e linha larga. O objetivo é gerar evidência técnica para decisões de arquitetura e limites da P04, sem tocar dados de produção.

## 🛠️ Mudanças Técnicas
- Cria `spikes/s02-volume.mjs`, executável com Node e `--expose-gc`, usando `mysql2`.
- Usa schema descartável `seshat_spike` e variáveis `SESHAT_DB_*`; a senha vem apenas de `SESHAT_DB_PASSWORD`.
- Gera tabela sintética `vol` com volume configurável por `SESHAT_S02_ROWS` (padrão 2.000.000).
- Mede baseline de memória, versão do servidor, `max_allowed_packet` e `innodb_buffer_pool_size`.
- Compara fetch bufferizado, streaming completo, parada precoce com `destroy()`, drain com reuso da conexão e estratégias de contagem.
- Testa BLOB de 1 MB, 8 MB e 70 MB, incluindo cenário acima de `max_allowed_packet`, e linha larga com 40 colunas.
- Grava relatório Markdown no caminho informado (padrão `docs/spikes/20261029_s02-volume-evidence.md`).
- Atualiza documentação correlata do spike (evidências, ADRs, pendências, backlog, plano e survey).

## ⚠️ Impacto/Avisos
- Requer MySQL acessível e `SESHAT_DB_PASSWORD`; sem a variável o script encerra.
- Requer `node --expose-gc`; sem isso a medição de memória é bloqueada.
- Cria schema/tabelas descartáveis (`seshat_spike.vol`, `blob_probe`, `wide_probe`) e pode inserir milhões de linhas; consome disco, CPU, memória e I/O.
- O teste de BLOB de 70 MB pode exceder `max_allowed_packet` e provocar `ECONNRESET`/warning no stderr; é isolado em conexão própria.
- Não há migração, alteração de schema produtivo ou dependência nova declarada; usa `mysql2` e APIs nativas do Node.
- A execução deve ser feita apenas em ambiente controlado, nunca apontando para base produtiva.

close #7

---

[![GitPR](https://img.shields.io/badge/GitPR-0_errors_%C2%B7_1_warning-yellow)](https://gitpr.natanfiuza.dev.br/)