# 🚀 Sugestão de Pull Request

**Mensagem de Commit Recomendada:**
```text
feat: adiciona editor SQL, grade de resultados e empacotamento Windows
```

---

## 🎯 Summary

O objetivo é provar que a stack de UI planejada (editor SQL, grade de resultados, temas e idiomas) funciona no aplicativo **empacotado**, e não apenas no servidor de desenvolvimento. Para isso o renderer deixou de ser carregado via `file://` e passou a ser servido por um esquema privilegiado `app://` com CSP estrita, e o `electron-builder` passou a gerar um diretório Windows desempacotado (`asar`) que abre sem dev server. O ganho é reduzir retrabalho: as restrições reais de produção (CSP, workers, protocolo, empacotamento) são validadas agora, antes da construção do workspace definitivo.

## 🛠️ Technical Changes

- Registra o esquema privilegiado `app://seshat` (standard, secure, fetch, stream) e um handler que serve somente arquivos sob o diretório do renderer, com mapa de MIME, rejeição de host/scheme inválidos, NUL, barras invertidas e traversal, além de 404/405 explícitos.
- Centraliza a política de segurança em `src/main/protocol/csp.ts`: `PRODUCTION_CSP` (header nas respostas HTML) e `DEV_CSP`, que apenas acrescenta `ws://localhost:*`. Um plugin do Vite substitui a meta tag em modo *serve*, mantendo `ws:` fora do build de produção.
- Instala política de permissões no `session.defaultSession`: apenas `clipboard-sanitized-write` é concedido; request e check handlers negam todo o resto.
- Adiciona `electron-builder.yml` e o script `pack:win` (`--dir`) produzindo `dist/win-unpacked` com `asar`, sem `node_modules` duplicado e sem rebuild de módulos nativos.
- Cria `MonacoEditor.vue` + `monaco.ts`: carregamento tardio, worker como módulo empacotado (mantendo `worker-src 'self'`), registro de SQL/MySQL, NLS para `es`/`fr`, exposição de view state/focus e descarte correto de modelo e editor.
- Cria `ResultGrid.vue` com registro explícito do `AllCommunityModule`, tema Quartz espelhando os tokens CSS, remonte da grade na troca de idioma (`localeText` é opção inicial no AG Grid) e Ctrl+C copiando linhas selecionadas como TSV com cabeçalho ou a célula em foco.
- Adiciona serialização TSV própria (`tsv.ts`) com quoting no subconjunto RFC 4180 aceito por planilhas: `NULL` aparece como `NULL` na tela e como campo vazio na cópia.
- Introduz camada de tema (`tokens.css`, `theme.ts`, `useTheme.ts`): preferência `system | light | dark`, acompanhamento de `prefers-color-scheme` em tempo real e aplicação de `data-theme` + `colorScheme` no elemento raiz.
- Amplia i18n com detecção do idioma do sistema (normalização BCP 47, `pt` → `pt-BR`), cinco catálogos completos, chaves `lab.*`/`grid.*` e `setLocale` atualizando também `document.documentElement.lang`.
- Substitui a tela provisória de tagline por `S05Lab.vue`, que integra editor, grade, seletor de tema e seletor de idioma como bancada de validação.
- Inclui log opcional de requisições via `SESHAT_REQUEST_LOG` (grava apenas timestamp, método e URL) como evidência offline.
- Cobre o novo código com testes de componente (Monaco, grade, lab), testes unitários (resolução de caminho do protocolo, TSV, cópia, locale, tema) e e2e, incluindo o binário empacotado e a verificação de que só há requisições `app://`.
- Sobe `@vue/test-utils` e `jsdom` como devDependencies e habilita `.vue` no Vitest.

## ⚠️ Impact/Warnings

- **Nova variável de ambiente:** `SESHAT_REQUEST_LOG` (opt-in). Quando definida, grava URL e método de cada requisição em arquivo-texto; não aponte para caminhos compartilhados em produção. Desativada por padrão.
- **Novas devDependencies:** `@vue/test-utils` 2.4.6 e `jsdom` 29.1.1 (apenas desenvolvimento; não entram no pacote).
- **CSP mais rígida:** `script-src 'self'`, sem `eval` e sem worker `blob:`. Qualquer script inline, CDN ou worker via blob quebra o renderer. `style-src 'unsafe-inline'` permanece por causa do Monaco/AG Grid e o risco residual está registrado no ADR 0015.
- **Mudança de origem do renderer:** a entrada agora é `app://seshat/index.html`. Código que dependa de `file://`, de caminhos relativos do disco ou de `__dirname` dentro do renderer deixa de funcionar.
- **Empacotamento exclui `node_modules` do asar:** qualquer `require` de módulo Node no main que não esteja bundlado falhará no app empacotado. Com `npmRebuild: false`, adicionar módulo nativo exige revisitar a configuração.
- **Permissões:** câmera, microfone, notificações e demais permissões ficam negadas por padrão; liberar exige editar `ALLOWED_PERMISSIONS` no main.
- **Estado da grade:** a troca de idioma remonta a grade, perdendo ordenação e seleção. O idioma do editor (NLS do Monaco) só se aplica no próximo início.
- **E2E empacotado:** o teste é ignorado se `npm run pack:win` não tiver sido executado antes, então a CI precisa desse passo para a cobertura completa.
- **Volume de assets:** cerca de 500 ícones PNG (Streamline Freehand) entram no repositório, aumentando o tamanho do clone e exigindo atenção à licença/proveniência já registrada na documentação.