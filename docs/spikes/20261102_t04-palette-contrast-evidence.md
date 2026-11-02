# Evidência — auditoria de contraste da paleta de conexões (T04)

Data: 2026-11-02 · Escopo: oito cores fixas de `src/domain/persistence/connection-palette.ts` usadas no formulário e na lista de perfis.
Método: contraste WCAG 2.2 calculado pela luminância relativa sRGB, sem amostragem visual. Valores arredondados para duas casas.

## Superfícies de referência

| Superfície | Token | Valor |
| --- | --- | --- |
| Fundo claro do painel | `--surface` | `#ffffff` |
| Chrome claro | `--chrome-bg` | `#f0f0f0` |
| Fundo escuro do painel | `--surface` | `#1e1e1e` |
| Chrome escuro | `--chrome-bg` | `#202020` |
| Item selecionado claro | `--selected-bg` | `#0078d7` |
| Item selecionado escuro | `--selected-bg` | `#264f78` |

## Contraste da amostra contra superfícies neutras

| Cor | Claro `#ffffff` | Chrome claro `#f0f0f0` | Escuro `#1e1e1e` | Chrome escuro `#202020` |
| --- | ---: | ---: | ---: | ---: |
| `#2563eb` | 5,17 | 4,54 | 3,23 | 3,15 |
| `#16a34a` | 3,30 | 2,89 | 5,06 | 4,94 |
| `#d97706` | 3,19 | 2,80 | 5,23 | 5,11 |
| `#dc2626` | 4,83 | 4,24 | 3,45 | 3,37 |
| `#7c3aed` | 5,70 | 5,00 | 2,93 | 2,86 |
| `#0d9488` | 3,74 | 3,29 | 4,45 | 4,35 |
| `#db2777` | 4,60 | 4,03 | 3,63 | 3,54 |
| `#4b5563` | 7,56 | 6,63 | 2,21 | 2,16 |

## Contraste da amostra contra o item selecionado

| Cor | Claro `#0078d7` | Escuro `#264f78` |
| --- | ---: | ---: |
| `#2563eb` | 1,15 | 1,64 |
| `#16a34a` | 1,37 | 2,58 |
| `#d97706` | 1,41 | 2,67 |
| `#dc2626` | 1,07 | 1,76 |
| `#7c3aed` | 1,27 | 1,49 |
| `#0d9488` | 1,20 | 2,27 |
| `#db2777` | 1,02 | 1,85 |
| `#4b5563` | 1,68 | 1,12 |

## Borda atual da amostra

A amostra de 10×10 px usa `border: 1px solid var(--border)`:

| Borda | Fundo | Contraste |
| --- | --- | ---: |
| `#a0a0a0` | claro `#ffffff` | 2,61 |
| `#a0a0a0` | chrome claro `#f0f0f0` | 2,29 |
| `#4a4a4a` | escuro `#1e1e1e` | 1,88 |
| `#4a4a4a` | chrome escuro `#202020` | 1,84 |

## Conclusão WCAG

- **1.4.1 Uso da cor:** passa. A amostra tem `aria-hidden="true"` e sempre aparece ao lado do nome traduzido da cor e, na lista, do ambiente e host; nenhuma informação depende apenas da cor.
- **1.4.3 Contraste de texto:** não se aplica à amostra; os rótulos usam `--text` e não foram alterados.
- **1.4.11 Contraste de elementos não textuais:** **não há falha bloqueante**, porque a amostra é redundante e não é o único meio de identificar a cor. Há, porém, baixa visibilidade em três situações:
  1. `#4b5563` (2,21) e `#7c3aed` (2,93) ficam abaixo de 3:1 no fundo escuro;
  2. `#16a34a` (2,89) e `#d97706` (2,80) ficam abaixo de 3:1 sobre o chrome claro;
  3. todas as amostras ficam entre 1,02 e 2,67 sobre o item selecionado azul, embora o texto branco do item continue legível.

## Recomendação

Manter a paleta e o formato de armazenamento — alterar cores exigiria migração e não resolve a causa. Para reforçar a percepção visual sem depender da cor, a próxima passagem visual pode trocar a borda da amostra por um anel de alto contraste com `var(--text)`:

```css
.form__swatch,
.connections__swatch {
  outline: 1px solid var(--text);
  outline-offset: 1px;
}
```

O anel atinge 17,40:1 no claro, 13,61:1 no escuro e 3,87:1/6,93:1 sobre o item selecionado. A mudança é apenas visual, não altera schema, IPC, testes de dados ou nomes. **Não foi aplicada nesta auditoria**; fica registrada como melhoria opcional para a revisão visual humana.

## Limitações

- O cálculo é determinístico, mas não substitui inspeção visual em monitores, escalas e temas reais.
- Não foi feita auditoria formal por terceiros nem teste com usuários.
- A amostra de 10×10 px é decorativa; a leitura principal continua sendo o rótulo textual.
