# Relatório — referência funcional do HeidiSQL

Data: 2026-10-30 · Branch: `develop_natan` · Autor da execução: Claude Code

## Objetivo
Registrar a cópia local do código-fonte do HeidiSQL indicada pelo usuário como **referência funcional** para as próximas etapas, resolvendo o conflito com a regra de licença já registrada.

## Dependências
- Nenhuma. Documentação apenas.

## Critérios de aceite
| Critério | Situação |
|---|---|
| Caminho da cópia registrado | atendido — `C:\Users\nataniel\projetos\pessoal\seshatsql_projeto\HeidiSQL`, fora do repositório |
| Licença identificada | atendido — `LICENSE` da cópia é GPL-2.0 |
| Conflito com MPL-2.0 registrado | atendido — `docs/09-licenca-e-proveniencia.md` |
| Limites de uso explícitos | atendido — referência de comportamento permitida; código, SQL, assets, ícones, textos e testes proibidos |
| Nenhum arquivo do HeidiSQL copiado para o repositório | atendido — nada foi lido para produção de código |

## Testes
Não aplicável: nenhuma alteração de código, dependência ou build. Nenhum comando de teste executado.

## Riscos
- Tratar "base no código-fonte" como autorização de cópia quebraria a MPL-2.0 do projeto (GPL-2.0 é copyleft forte). O registro em `docs/09` fixa a interpretação compatível com o `CLAUDE.md`.
- A cópia local não é versionada; caminho absoluto em `docs/11` pode variar entre máquinas.

## Condições de parada
- Nenhuma etapa iniciada além do registro.
- S05/S06 ainda não planejados nem executados.

## Diff
```
docs/09-licenca-e-proveniencia.md | +1
docs/11-fontes.md                  | +1
```

## Comandos/resultados
- Listagem de `HeidiSQL/` e leitura das 25 primeiras linhas do `LICENSE`: GPL-2.0 confirmado.
- Busca por "HeidiSQL" nos documentos: `CLAUDE.md`, `GEMINI.md`, `docs/08`, `docs/09`, `docs/11`, ADR 0001 — todos tratam o projeto como referência funcional, sem cópia.

## Pendências
- Planejar S05/S06: o comando `/grill-with-docs` é reservado ao usuário; ele precisa ser executado por você.
- Revisão humana dos ADRs 0011–0014 e decisão de P01 continuam abertas.

## Documentos atualizados
- `docs/09-licenca-e-proveniencia.md`
- `docs/11-fontes.md`
- Este relatório.
