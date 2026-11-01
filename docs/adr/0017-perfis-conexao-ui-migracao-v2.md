# ADR 0017 — Perfis de conexão, modal de CRUD e migração de connections.yml para v2 (T04)

Status: **proposto**. Sustentado por execução real em `docs/spikes/20261031_t04-connections-evidence.md` (215 testes unitários/componente, 27 e2e, DPAPI real, reinício, pacote `win-unpacked`). As decisões foram aprovadas antes da implementação em `docs/plans/develop_natan/20261031_t04_profiles_preferences_dpapi_plansfacts.md` (D-T04-01..12). Não substitui a revisão humana nem altera ADR 0016.

## Contexto
O S06 entregou persistência real de `connections.yml`, cifragem DPAPI e recuperação, mas sem UI de perfis e com schemaVersion 1 de formato livre para ambiente e cor. O T04 precisa fechar o critério “salvar/reabrir sem senha clara; perfis com cor/ambiente” (R03, R04, R18, R19, A02, A12) **sem** conectar/testar (T05), sem alterar abas/editor (T07), sem Preferências completas (T11) e sem instalador (T13). O desafio é acrescentar um contrato mais forte sem perder os arquivos existentes e sem expor segredos ao renderer.

## Decisões

### D-T04-01 — Identidade, criação e unicidade
| # | Regra | Por quê |
|---|---|---|
| 1 | Na criação o renderer **não envia id**; o main gera `crypto.randomUUID()` | o renderer não escolhe identidade nem reutiliza id por engano |
| 2 | Na edição o id é obrigatório; id inexistente devolve `not-found` e **não** faz upsert | evita ressuscitar perfil excluído por uma edição atrasada |
| 3 | Nome é obrigatório (1–100), comparado após trim e `toLowerCase()`; colisão devolve `duplicate-name` antes de cifrar ou gravar | a unicidade é regra de gravação, verificada dentro da fila serializada |
| 4 | Renomear mudando apenas a caixa é permitido, porque o próprio id é excluído da comparação | não se impede a correção de caixa do nome |
| 5 | Id no schema aceita 1–128 caracteres, não exige UUID | ids legados como `local` continuam carregáveis/editáveis |

### D-T04-02 — `connections.yml` schemaVersion 2 e migração
| # | Regra | Por quê |
|---|---|---|
| 1 | `CONNECTIONS_SCHEMA_VERSION = 2`; preferências e abas permanecem na versão 1 | cada documento tem contrato próprio; não se força bump global |
| 2 | `parseVersioned` recebe a versão corrente por codec | sem isso, um arquivo v2 seria classificado como futuro e a escrita ficaria bloqueada |
| 3 | Migração v1→v2 ocorre em memória; o store revalida, copia o **texto v1 original** para `.bak` e só então regrava | recuperação verificável sem quarentenar arquivo válido |
| 4 | v1 inválido **lança** e segue a quarentena existente; o arquivo nunca é descartado em silêncio | preserva a política do ADR 0016 |
| 5 | A migração preserva id, nome, host, porta, usuário (inclusive vazio), ciphertext e nomes duplicados | não “corrige” dados do usuário; o reparo só ocorre ao salvar pela UI |
| 6 | Ids duplicados continuam inválidos; nomes duplicados são tolerados no **arquivo** | ids são chave; nomes são regra de gravação, e arquivos legados podem tê-los duplicados |

### D-T04-03 — Ambiente e rótulo
| # | Regra | Por quê |
|---|---|---|
| 1 | Quatro valores canônicos: `development`, `staging`, `production`, `custom` | R04 com semântica estável e traduções apenas na UI |
| 2 | `custom` exige `environmentLabel` de 1–32 após trim; rótulo é proibido fora de `custom` | “personalizado” sem descrição não informa o contexto |
| 3 | Na migração, `dev|development|desenvolvimento` → development; `test|staging|homologacao|homologação` → staging; `prod|production|producao|produção` → production; vazio/desconhecido → custom | aproveita o texto livre do S06 sem perder informação |
| 4 | Normalização remove espaços, caixa e acentos; o rótulo custom preserva o texto original aparado | reconhece variantes sem alterar o rótulo escolhido |
| 5 | `custom` com rótulo `null` é tolerado no **schema persistido**, mas o IPC e o formulário exigem rótulo | permite carregar legado e exige reparo ao salvar |

### D-T04-04 — Cor
| # | Regra | Por quê |
|---|---|---|
| 1 | Paleta fixa de oito cores: `#2563eb`, `#16a34a`, `#d97706`, `#dc2626`, `#7c3aed`, `#0d9488`, `#db2777`, `#4b5563`; padrão `#2563eb` | conjunto único em schema, IPC, migração e UI |
| 2 | Persistência usa `#rrggbb` canônico em minúsculas; leitura aceita qualquer caixa e normaliza | comparação e serialização estáveis |
| 3 | Cor fora da paleta no arquivo é aceita na leitura como hex válido, mas o formulário cai na cor padrão; o IPC e o formulário exigem a paleta | arquivo editado à mão não impede abrir; a UI não inventa cor inválida |
| 4 | A lista sempre mostra amostra **e** nome/ambiente, com rótulo acessível composto | R23: contexto nunca depende só de cor |

### D-T04-05 — Senha write-only
| # | Regra | Por quê |
|---|---|---|
| 1 | Campo de senha sempre inicia vazio, mesmo em edição | a UI não redesenha nem decifra o segredo |
| 2 | Senha omitida preserva o ciphertext; string nova cifra via DPAPI; `null` remove | editar metadados não exige redigitar a senha |
| 3 | “Remover senha salva” só aparece com `hasPassword`; marcar limpa/desabilita o campo e envia `null` | ação explícita, sem ambiguidade entre vazio e remover |
| 4 | Falha do protetor devolve `encryption-unavailable` e não grava | mantém a regra sem fallback em claro |
| 5 | Renderer recebe apenas `PublicConnection` com `hasPassword`; senha e ciphertext nunca atravessam o IPC | contrato de segurança do `CLAUDE.md` |
| 6 | Dica fixa: DPAPI protege para o usuário/máquina atual; copiar o diretório para outra conta/máquina não revela a senha | comunica a limitação no local da decisão |

### D-T04-06 — Exclusão e abas
| # | Regra | Por quê |
|---|---|---|
| 1 | Exclusão em duas etapas, com o nome do perfil e o aviso D7-04 | evita perda acidental de contexto |
| 2 | O aviso diz que as abas e o SQL são mantidos e que a referência ao perfil fica indisponível até reatribuição | preserva trabalho sem prometer cascata inexistente |
| 3 | `connections.delete` não toca em `tabs_states.yml` | medido: arquivo de abas idêntico byte a byte no e2e |
| 4 | `not-found` ao excluir recarrega a lista | a UI converge para o estado real do arquivo |

### D-T04-07 — Diálogo, entradas e fluxo
| # | Regra | Por quê |
|---|---|---|
| 1 | Modal mestre-detalhe “Conexões”, aberto por **Ferramentas > Conexões…** e pelo botão “Desconectado” da toolbar | entrada pelo menu e atalho visual; status continua só exibição |
| 2 | Preferências e os demais itens inertes continuam inertes; Arquivo, combos de tema/idioma e editor não mudam | escopo T04 respeitado |
| 3 | `AppDialog` usa `Teleport`, `role="dialog"`, `aria-modal`, título por `aria-labelledby`, foco inicial, armadilha de Tab/Shift+Tab, `focusin` redirecionado, Escape emitindo `request-close` e clique no fundo sem fechar | acessibilidade básica sem segundo modal |
| 4 | O pai decide fechar; se houver rascunho sujo, mostra confirmação inline “Descartar alterações?” antes de fechar, trocar de perfil ou iniciar Novo | o diálogo não fecha nem perde dados por engano |
| 5 | Após salvar, o diálogo **permanece aberto**, recarrega, seleciona o salvo e limpa a senha | permite conferência e edições encadeadas |
| 6 | Lista ordenada por nome sem diferenciar caixa; o YAML preserva a ordem de criação | previsibilidade na UI sem reescrever a ordem no arquivo |
| 7 | Fechar o aplicativo com rascunho sujo descarta o rascunho; o handshake de fechamento continua tratando só abas | ampliar o handshake ficaria fora do T04; a limitação fica registrada |
| 8 | Avisos de versão futura, leitura falha ou arquivo grande bloqueiam Novo/Salvar/Excluir e explicam o motivo | não se grava sobre estado que esta build não compreende |

### D-T04-08 — Contrato IPC e erros
| # | Regra | Por quê |
|---|---|---|
| 1 | Nenhum canal novo: `connections:list`, `connections:save`, `connections:delete` | superfície mínima |
| 2 | Entrada validada por Zod: trim em nome/host/usuário/rótulo, nunca na senha; porta inteira 1–65535; cor da paleta; ambiente enum; senha até 4096/`null`/omitida | o main não confia no renderer |
| 3 | Falhas tipadas: `invalid`, `duplicate-name`, `not-found`, `encryption-unavailable`, `readonly-newer`, `io-error`, `internal` | a UI traduz por código, sem texto do main |
| 4 | `formatIssues` devolve apenas caminho e código | um YAML malformado pode conter senha em campo errado; nada disso ecoa |
| 5 | Erros de formulário são inline com `aria-invalid`, `aria-describedby`, `role="alert"` e foco no primeiro campo inválido | acessível e deterministicamente corrigível |

## Alternativas registradas e não adotadas
- **Upsert por id no `save`** — rejeitado: edição atrasada recriaria um perfil excluído; `not-found` é mais seguro.
- **Exigir UUID no schema persistido** — rejeitado: quebraria ids legados como `local` sem ganho.
- **Gerar id no renderer** — rejeitado: a identidade deve pertencer ao main.
- **Bump global de `schemaVersion` para 2** — rejeitado: preferências e abas não mudaram; a versão é por codec.
- **Quarentenar v1 válido durante a migração** — rejeitado: é migração normal, não corrupção; o original fica em `.bak`.
- **Cor livre/color picker** — rejeitado: oito cores fixas mantêm consistência e contraste previsível; o preço é menos personalização.
- **Apagar abas ao excluir o perfil** — rejeitado: perda de SQL; a referência fica indisponível até reatribuição.
- **Modal separado para confirmação de exclusão/descarte** — rejeitado: confirmação inline evita empilhamento e mantém o foco.
- **Ampliar o handshake de fechamento para rascunhos** — adiado: exigiria mudar coordenação e e2e de fechamento; decisão D-T04-12 aceitou descartar o rascunho ao fechar o app.
- **Decifrar a senha para o renderer mostrar/testar** — rejeitado: viola o contrato; testar conexão é T05 e não precisa expor o segredo.

## Consequências
- **Rollback:** builds anteriores leem `schemaVersion: 2` como versão futura e recusam gravar conexões. Restaurar o `.bak` sobre `connections.yml` desfaz a migração; o arquivo original foi comparado byte a byte no e2e.
- **Legado reparado ao salvar:** nomes duplicados, usuário vazio e `custom` sem rótulo carregam, mas não podem ser salvos sem correção. Isso é intencional e precisa de mensagem clara na UI.
- **Unicidade só na gravação:** o schema persistido tolera nomes duplicados; a UI e o serviço impedem novos. Um arquivo editado à mão ainda pode mostrar duplicatas até o próximo salvamento.
- **Ordem de lista ≠ ordem do YAML:** a UI ordena alfabeticamente; o arquivo mantém a ordem de criação.
- **Avisos de migração/quarentena na inicialização** aparecem no banner do shell; a leitura posterior do diálogo já vê arquivo válido. Isso decorre do carregamento no startup e está registrado na evidência.
- **Foco inicial em lista vazia** pode ficar no painel até o `list()` assíncrono concluir; não há roubo de foco depois, por decisão de não deslocar o usuário durante a digitação.
- **DPAPI entre usuários/máquinas** continua limitação raciocinada, não medida; a UI a comunica.
- **Tela e escopo:** sem conexão/teste, sem Preferências completas, sem histórico, sem instância única e sem dependências novas. `randomUUID` e `safeStorage` são nativos.

## Referências
- Plano aprovado: `docs/plans/develop_natan/20261031_t04_profiles_preferences_dpapi_plansfacts.md`.
- Survey: `docs/survey/20261031_t04_profiles_preferences_dpapi_surveyfacts.md`.
- Evidência: `docs/spikes/20261031_t04-connections-evidence.md`.
- Base de persistência: `docs/adr/0016-persistencia-yaml-dpapi.md`.
