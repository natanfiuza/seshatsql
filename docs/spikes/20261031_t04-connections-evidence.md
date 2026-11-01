# Evidência T04 — perfis de conexão, DPAPI e migração v2 (2026-10-31)

Escopo conforme o plano aprovado em `docs/plans/develop_natan/20261031_t04_profiles_preferences_dpapi_plansfacts.md`: CRUD de perfis sem conectar nem testar; modal mestre-detalhe aberto por Ferramentas > Conexões… e pelo botão da toolbar; quatro ambientes com rótulo obrigatório em `custom`; paleta fixa de oito cores; id gerado pelo main; nome único; senha write-only em DPAPI; `connections.yml` schemaVersion 2 com migração de v1; exclusão com aviso D7-04 e abas intactas.

Ambiente: Windows 11 Pro 10.0.26300, Node de build 22.18.0, Electron 45.1.0, aplicativo compilado em `out/` e pacote `dist/win-unpacked`. Toda execução e2e usa `SESHAT_DATA_DIR` e `SESHAT_USER_DATA_DIR` temporários — nenhum perfil real do usuário foi lido ou escrito.

## Comandos e resultados

| Comando | Resultado em 2026-10-31 |
|---|---|
| `npm run typecheck` | sem saída de erro (`tsc` node + `vue-tsc` web) |
| `npm run lint` | sem saída de erro (`eslint .`), após ajuste de template em `ConnectionsDialog.vue` |
| `npm test` | **32 arquivos, 215 testes aprovados** |
| `npm run build` | concluído; `out/main/index.js` com 441.805 bytes |
| `npx playwright test tests/e2e/t04-connections.spec.ts` | **9/9 aprovados**, 55,7 s |
| `npx playwright test tests/e2e/s06-persistence.spec.ts` | **7/7 aprovados**, 58,1 s |
| `npm run test:e2e` (todas as suítes) | **27/27 aprovados**, 1,9 min (pacote, S05, S06, T04 e captura visual) |
| `npm run pack:win` | concluído; `dist/win-unpacked`, Electron 45.1.0 x64; asar com 9.022.224 bytes (8,6 MiB) |
| `npx playwright test tests/e2e/packaged.spec.ts` | **1/1 aprovado** |

A suíte T04 é executada no aplicativo compilado, com DPAPI real e reinícios de processo; não usa simuladores para o caminho de senha.

## Medições funcionais (e2e real)

1. **Criação e reinício sem conectar** — perfil criado por **Ferramentas > Conexões…** com ambiente `staging`, cor `#16a34a` e senha. `connections.yml` fica em `schemaVersion: 2`, recebe um id UUID gerado pelo main, porta numérica e ciphertext `{scheme: dpapi, data: …}`; o texto da senha não aparece no arquivo. Após reiniciar e abrir pela toolbar, a lista mostra o perfil, o status continua `Disconnected` e o log continua `No queries executed.`
2. **Edição preserva o ciphertext** — renomear um perfil sem tocar no campo de senha mantém o objeto DPAPI **byte a byte**. `safeStorage.decryptString` no processo main devolve a senha original. A serialização de `connections.list()` no renderer contém `"hasPassword":true` e não contém a senha em claro.
3. **Remoção de senha** — marcar “Remover senha salva” grava `password: null`; a dica de senha salva desaparece e, ao reabrir, o checkbox e a dica não existem.
4. **Nome duplicado** — `  local  ` é comparado com `Local` após trim e sem diferenciar caixa; a gravação é recusada com mensagem localizada e o arquivo continua com um único perfil.
5. **Exclusão em duas etapas** — a primeira etapa mostra “Delete “Discardable”?” e o aviso de que as abas são mantidas; “Keep connection” preserva o perfil. Confirmar remove o perfil do arquivo e da lista. `tabs_states.yml` permanece **idêntico byte a byte** e o SQL da aba (`-- t04_delete_marker`) sobrevive ao reinício, sem aviso de recuperação.
6. **Migração v1 → v2** — arquivo v1 preparado antes do launch com aliases de ambiente, cor `#AABBCC`, cor vazia, usuário vazio e dois nomes iguais. O app regrava em v2; `Desenvolvimento` vira `development`, `Laboratório` vira `custom` com rótulo, as cores ficam `#aabbcc` e `#2563eb`, o usuário vazio é preservado e nenhum arquivo `.corrupt-*` é criado. `${connectionsPath}.bak` é **igual ao texto v1 original**. O aviso de migração aparece no banner do shell, carregado na inicialização; o diálogo abre com os dois perfis.
7. **Arquivo corrompido** — `connections.yml` inválido é preservado em quarentena (`*.corrupt-*`), o banner do shell informa o caminho e o diálogo abre com o estado vazio recuperado.
8. **Versão futura** — arquivo `schemaVersion: 3` não é sobrescrito (bytes finais idênticos), não é quarentenado e o diálogo informa a versão (v3); Novo e Salvar ficam desabilitados, com a explicação de que os perfis não podem ser alterados.
9. **Validação inline** — três campos obrigatórios vazios produzem três mensagens “Required.” e o foco vai para o nome; porta `0` exibe “Use a port from 1 to 65535.” com foco na porta; `custom` sem rótulo exige o rótulo e foca o campo; os dados só são gravados após a correção.

## Cobertura unitária e de componentes

- **Paleta** (`connection-palette.test.ts`): exatamente oito cores válidas, cor padrão e guard rejeitando valores fora da paleta.
- **Schema v2** (`persistence-schemas.test.ts`): ambiente, rótulo, cor, porta, ids duplicados, senha em claro e ausência de valores sensíveis em `formatIssues`; classificação `valid/older/future/invalid` com a versão corrente parametrizada.
- **Migração** (`connections-migration.test.ts`): aliases, ambiente desconhecido/vazio, cor inválida, usuário vazio, nomes duplicados, ciphertext e v1 inválido.
- **Store** (`yaml-file-store.test.ts`): migração v1→v2, `.bak` com o original, sem quarentena de arquivo válido e aviso `migrated`.
- **Serviço** (`connections-service.test.ts`): id gerado, edição com id desconhecido sem upsert, duplicidade por caixa/trim, renomear mudando só a caixa, senha manter/trocar/limpar, falha do protetor sem gravação e redaction.
- **Diálogo e formulário** (`app-dialog.test.ts`, `connection-form.test.ts`, `connections-dialog.test.ts`): ARIA, foco preso/restaurado, Escape, clique no fundo, payloads, validação, guarda de rascunho, duas etapas de exclusão e bloqueio por versão futura.
- **Shell** (`app-menu-bar`, `shell-chrome`, `s05-lab`): Conexões habilitado no menu e na toolbar, Preferências e Arquivo inertes, abertura/fechamento com retorno de foco e status inalterado.

## Defeito real encontrado e corrigido durante a verificação

Os testes e2e de criação falharam porque **Salvar não fazia nada**. Um teste de diagnóstico capturou:

```text
TypeError: values.port.trim is not a function
    at validateConnectionForm (...)
TypeError: port.value.trim is not a function
    at buildInput (...)
```

Causa: o `v-model` em `<input type="number">` converte o valor para `number`; `port` começava como string e passava a número após qualquer edição, quebrando `.trim()` na validação e no payload. Correção em `ConnectionForm.vue`: normalizar com `String(port.value)` na validação e no snapshot de “dirty”, e converter para número no payload com `Number(String(port.value).trim())`. Foi acrescentado o teste de regressão “accepts a port edited through the numeric input” em `tests/component/connection-form.test.ts`. Depois da correção, a criação passou e a suíte T04 fechou 9/9.

## Comportamentos observados que condicionam a UI

- **Avisos de migração e quarentena aparecem no banner do shell**, não dentro do diálogo: a carga que recupera/migra ocorre na inicialização, e a leitura posterior de `connections.list()` já encontra um arquivo válido e sem aviso. A divisão foi validada nos e2e de migração e de arquivo corrompido.
- **Foco inicial em lista vazia**: o `AppDialog` foca o conteúdo no momento da abertura, antes do `connections.list()` assíncrono terminar. Com a lista vazia, o foco inicial fica no painel do diálogo, não no campo nome; os testes de componente verificam que o foco está contido no painel e que a navegação por Tab alcança os campos depois da carga.
- **Limitação do jsdom**: `<fieldset disabled>` não propaga `disabled` aos inputs filhos no jsdom. O teste do formulário desabilitado verificava o atributo do fieldset e o `disabled` explícito do campo de senha; o comportamento real foi verificado nos e2e que bloqueiam a escrita.
- **Rascunho e fechamento do app**: fechar o aplicativo com rascunho sujo descarta o rascunho, porque o handshake de fechamento continua tratando apenas abas (decisão D-T04-12). Fechar o diálogo, trocar de perfil ou iniciar Novo pede confirmação.

## Limitações e pendências registradas

- T04 não conecta nem testa conexão; isso é T05. A barra de status continua somente exibição e Preferências continua inerte (T11).
- O schema v2 é um contrato novo: uma build anterior lê `schemaVersion: 2` como versão futura e recusa gravar conexões. Restaurar o `.bak` sobre `connections.yml` desfaz a migração; o `.bak` foi comparado byte a byte no e2e.
- Legado é tolerado na leitura: nomes duplicados, usuário vazio e `custom` sem rótulo carregam; salvar exige correção e o IPC exige rótulo em `custom`.
- DPAPI entre usuários/máquinas continua **limitação raciocinada, não medida**; a UI informa que a senha é cifrada para o usuário/máquina atual.
- A paleta não recebeu auditoria formal de contraste WCAG; a revisão visual humana continua necessária.
- A máquina de desenvolvimento acumulou **104 processos `electron.exe` órfãos** de execuções e2e anteriores; a limpeza automática foi negada pela política de permissões e deve ser feita manualmente.
- Nenhuma dependência nova foi adicionada: `randomUUID` e `safeStorage` já pertencem ao runtime; a licença/versão do conjunto não mudou.
