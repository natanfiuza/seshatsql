# Survey — S05 (UI/pacote) e S06 (persistência)
Data: 2026-10-30 · Branch `develop_natan` · Fonte: sessão de grill `/grill-with-docs`
Plano correspondente: `docs/plans/develop_natan/20261030_s05_s06_ui_persistencia_plansfacts.md`

## 1. Contexto da tarefa

O T02 fechou S01–S04 com medições reais contra MySQL 8.4.13 e quatro ADRs propostos (0011–0014). O próximo item do backlog é o T03: **executar S05/S06 e validar o pacote**. S05 prova a camada de UI (Monaco sob CSP, grid Community, temas, cinco idiomas, offline); S06 prova a persistência (DPAPI, YAML corrompido, flush/debounce, recuperação e reinício sem conexão/SQL).

A tarefa desta sessão foi **planejar** os dois estágios por entrevista, sem implementar, até esgotar a fronteira de decisões.

## 2. Estado do repositório no início da sessão

- `HEAD` = `fd472a7` ("docs: padroniza comentários e testes em inglês"); três arquivos não commitados (`docs/09-licenca-e-proveniencia.md`, `docs/11-fontes.md` modificados; relatório `20261030_heidi_reference.md` e descrição de PR não rastreados) — nenhum relacionado a S05/S06.
- Código existente: apenas o scaffold T01 (main/preload/renderer mínimos, i18n com duas chaves, CSP meta provisória, e2e que só verifica o `h1`).
- `yaml`, `zod`, `monaco-editor`, `ag-grid-*` estão instalados, mas **nunca importados**; não há `src/application` nem `src/infrastructure`; não há `electron-builder.yml`.
- Nenhuma alteração do agente em Git; o agente só leu.

## 3. Fatos levantados (não perguntados ao usuário)

| Item | Fato |
|---|---|
| Diretório de dados | P01 **encerrada** por D7-01: `~/.seshatsql/data/` (`docs/rodada7-decisoes.md:2`, ADR 0010). `docs/04-pendencias.md:2` estava desatualizado. |
| Diretórios existentes | Nem `~/.sqlseshat` nem `~/.seshatsql` existem nesta máquina — sem migração a executar. |
| Monaco NLS | `es` e `fr`: 2.138 mensagens traduzidas. `pt-br`: 2.153 entradas, **todas `null`**. Não existe `pt-pt`. |
| Monaco workers | Caminho padrão usa bootstrap **blob**; README afirma que `file://` não cria workers. Existe `MonacoEnvironment.getWorker`; há `editor.worker.js`, `editor.api.js`, `languages/definitions/sql/register.js` e `.../mysql/register.js`. |
| AG Grid 36.2.0 | Sem arquivos de locale no pacote; `themeQuartz` em Community; `LocaleText` é mapa aberto; `enableCellTextSelection` em Community; `ClipboardModule`/range são Enterprise. |
| Toolchain | Node de build 22.18.0; Electron 45.1.0; electron-vite 6.0.0; Vite 8.3.5; electron-builder 26.18.0 (suporte ao Electron 45 não verificado). |
| jsdom | `30.x` exige Node `^22.22.2`; incompatível com o Node 22.18.0 congelado. `29.1.1` é a mais recente compatível. |
| ADRs 0011–0014 | Seguem em status **proposto**; usuário confirmou que S05/S06 não dependem da revisão deles. |

## 4. Decisões da rodada (todas confirmadas pelo usuário)

| # | Decisão |
|---|---|
| D-S05/S06-01 | S05/S06 independentes da revisão dos ADRs 0011–0014. |
| D-S05/S06-02 | Renderer empacotado em **`app://`**, não `file://`. |
| D-S05/S06-03 | Pacote de S05 é **win-unpacked** (`electron-builder --dir`, asar); NSIS fica no T13. |
| D-S05/S06-04 | Monaco em **inglês para pt-BR/pt-PT**; UI e grid traduzidos; limitação documentada. |
| D-S05/S06-05 | Cópia Community própria (Ctrl+C → TSV com cabeçalhos + linhas selecionadas; sem seleção, célula focada). |
| D-S05/S06-06 | Tema **system/light/dark com live-follow** do SO. |
| D-S05/S06-07 | UI/grid ao vivo; **Monaco na inicialização** (reiniciar para aplicar). |
| D-S05/S06-08 | S06 implementa **infraestrutura real dos três YAMLs**, sem UI de perfis. |
| D-S05/S06-09 | Recuperação **primário → `.bak` → quarentena**; versão futura recusa gravação; nunca descarte silencioso. |
| D-S05/S06-10 | Falha de flush no fechamento **mantém a janela aberta** com erro; sair sem salvar exige confirmação. |
| D-S05/S06-11 | **Duas etapas autorizadas**, com parada entre S05 e S06. |
| D-S05/S06-12 | **ADR 0015** e **ADR 0016**, ambos propostos. |
| D-S05/S06-13 | `SecretProtector` + testes simulados + **DPAPI real medido**. |
| D-S05/S06-14 | i18n do AG Grid apenas nas **chaves usadas**, com teste de paridade. |
| D-S05/S06-15 | Offline: **log de requisições** (env-gated) + execução do pacote; checagem com rede desligada pelo usuário. |
| D-S05/S06-16 | S06 persiste **tema e idioma**; UI de perfis, conexão, single-instance, transação e histórico ficam fora. |
| D-S05/S06-17 | S05 entrega **tela de laboratório provisória** (`S05Lab`), substituída em T07/T09. |
| D-S05/S06-18 | Adicionar **@vue/test-utils 2.4.6 + jsdom 29.1.1** (MIT, exatas). Revisada de 2.5.1 para 2.4.6 após `EBADENGINE` medido (`js-beautify@2.0.3` → `nopt@10.0.1` exige Node `^22.22.2`; Node de build é 22.18.0 com `engine-strict=true`). |
| D-S05/S06-19 | SQL grande: **salvar íntegro e avisar acima de 1 MB**; sem truncamento. |
| D-S05/S06-20 | Diálogo de abertura de `.sql` ("iniciar direto / carregar no editor / cancelar") é **fora do MVP**, registrado como ideia futura. |
| D-S05/S06-21 | Aviso de recuperação: **banner não bloqueante com caminhos**. |

## 5. Vocabulário fixado

- **`app://`** — esquema privilegiado que serve o renderer empacotado; substituto de `file://`, necessário para workers e origem segura. Não confundir com servidor de desenvolvimento.
- **win-unpacked** — saída do electron-builder sem instalador (`--dir`); prova o gate do S05 sem puxar NSIS/T13.
- **live-follow** — quando a preferência de tema é `system`, a UI acompanha a mudança do SO em tempo real.
- **quarentena** — cópia do arquivo inválido em `.corrupt-<timestamp>` preservada para inspeção; nunca substitui a leitura do `.bak` antes de esgotar a recuperação.
- **flush** — gravação imediata e confirmada do estado pendente (troca de aba, fechamento), distinta da gravação por debounce (500 ms).
- **banner de recuperação** — aviso não bloqueante que informa qual arquivo foi corrompido, qual backup foi usado e qual caminho foi preservado.
- **`SecretProtector`** — interface de cifragem de senha; a implementação real usa `safeStorage`/DPAPI; a fake simula indisponibilidade e falhas nos testes.

## 6. Perguntas que ficaram fora (e por quê)

- **Abertura de arquivos `.sql`** — fora do MVP (R09 só cobre SQL digitado/colado; exclusões vedam importação). O usuário pediu registro como ideia futura.
- **NSIS, publisher e certificado** — T13; win-unpacked basta para o gate do S05.
- **UI de perfis** — T04; S06 só prova a infraestrutura e o schema.
- **Traduções próprias do Monaco para pt-BR/pt-PT** — implicaria traduzir 2.153 strings e manter fork; usuário aceitou inglês.
- **Cobertura i18n completa do AG Grid** — só as chaves usadas, com teste de paridade; o restante usa o inglês embutido.
- **DPAPI entre usuários/máquinas** — não há segunda conta para medir; fica como limitação raciocinada.

## 7. Riscos identificados no grill

1. **electron-builder 26 com Electron 45** — suporte não verificado; primeira falha de empacotamento é condição de parada, não de troca de versão.
2. **Vite 8/rolldown com `?worker` e Monaco 0.57** — combinação nova; se não empacotar, parar antes de mudar a stack.
3. **`app://` sob asar** — servir módulos e workers de dentro do asar é o ponto mais delicado; não cair para `file://` sem autorização.
4. **CSP e workers do Monaco** — o caminho padrão exige `blob:`; o override por `MonacoEnvironment` é a aposta, e relaxar `worker-src` exige aprovação.
5. **jsdom 29 + Vitest 5** — compatibilidade não medida; falha é condição de parada.
6. **Fechamento coordenado** — renderer ocupado pode atrasar o flush; timeout deixa a janela aberta, nunca fecha perdendo estado.
7. **Rename no Windows com antivírus** — pode falhar de forma não recuperável; nunca cair para escrita direta.
8. **YAML hostil/grande** — opções defensivas do `yaml` e limite de aviso; nenhum arquivo é descartado.
9. **Superfície de IPC nova no S06** — cada handler valida remetente e payload; testes negativos obrigatórios.

## 8. Próximo passo

Executar o passo 0 do plano (documentos, correção de P01, registro e instalação das duas devDependencies) e então a etapa **S05**, parando para revisão antes de S06.
