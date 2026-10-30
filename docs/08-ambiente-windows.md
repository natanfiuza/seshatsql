# Tutorial de ambiente Windows — preparatório, não validado por execução
## 1 Pré-requisitos
Windows 11 x64. Instalar Git for Windows por fonte oficial https://git-scm.com/downloads/win e Node.js 24.22.2 x64 pela página oficial https://nodejs.org/en/blog/release/v24.22.2 . Verificar assinatura/checksum do instalador pelos procedimentos oficiais. Node escolhido é baseline candidata LTS; verificar compatibilidade final em T00. Editor à escolha; Claude Code conforme instalação oficial de sua versão. Delphi não é necessário.
Abrir novo PowerShell e executar:
```powershell
git --version
node --version
npm --version
```
Esperado Node v24.22.2 se essa baseline for mantida. Registrar versões reais. Não alterar ExecutionPolicy global para resolver npm.ps1; usar npm.cmd quando apropriado. Não há execução realizada pelo assistente.
## 2 Repositório
Conta/URL ainda pendentes: não existe comando git clone com destino inventado. Após receber URL real e revisão autorizada, clonar para pasta de desenvolvimento fora de diretórios de dados e entrar no projeto. Não criar fork do HeidiSQL: repositório novo.
## 3 Bootstrap controlado
T00 escolhe versões exatas de Electron 45.1.0 candidato, electron-vite 5.0.0 candidato, Vue/TS e demais bibliotecas, validando engines/peers/licenças. Agente gera package.json e lockfile após aprovação. Não usar scaffolder latest como receita reprodutível nem misturar electron-vite.org com vite-plugin-electron.
Sem package.json/lockfile, npm ci ainda não pode funcionar. Após scaffold e lockfile aprovados:
```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd run test
npm.cmd run dev
```
Esses scripts são contrato planejado: serão criados em T01, não existem neste pacote documental.
## 4 Banco de testes
Usar MySQL descartável acessível por host/porta; Docker opcional, nunca requisito do usuário final. Fixar patches/imagens em T02; criar usuário e fixtures exclusivos, sem credenciais reais no Git. Não apontar testes DDL/DML a produção. Cada linha alvo exige ambiente de teste próprio. Se Docker não disponível, instância de teste separada é alternativa, sem assumir privilégios.
## 5 Build planejado
Scripts a criar e testar: lint, typecheck, test, test:e2e, build, dist:win. Depois de implementados:
```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
npm.cmd run dist:win
```
Proposta NSIS: target Windows x64, oneClick true/perMachine false para instalação por usuário; auto-update fora do MVP. Validar schema atual electron-builder e teste em usuário padrão. AppId/publisher/certificado dependem de P05. Não prometer ausência de avisos Windows para pacote sem assinatura.
## 6 Prova de sucesso
Pacote instalado abre sem servidor dev; Monaco workers/locale carregam; cria perfil de teste, executa SQL e restaura abas. Usuário final não precisa Node instalado: runtime é embutido pelo Electron. Guardar logs de build sem segredos. Resultado só será considerado validado após execução em Windows.
## 7. Decisões da Etapa 0 (2026-10-29)
Ambiente verificado nesta máquina, por execução de `git --version`, `node --version` e `npm --version`: Windows 11 Pro build 26300 x64; Git 2.55.0.windows.5; Node v22.18.0; npm 11.5.2. Ausentes: Docker, cliente `mysql` no PATH e `gh`. Na inspeção inicial o diretório **não** era repositório Git; em 2026-10-29 o usuário criou o repositório local com remoto `natanfiuza/seshatsql` (commit inicial `a44d40b`, local e remoto sincronizados).
Adotar o Node 22.18.0 instalado como Node de build, com `engines >=22.12.0` no package.json. A baseline 24.22.2 (LTS "Krypton") permanece como alvo futuro, sem instalação nesta etapa. O esperado no §1 acima passa a ser Node v22.18.0 enquanto essa decisão vigorar.
Toolchain decidido: electron-vite 6.0.0 + Vite 8.3.5 + TypeScript 6.0.3. O §3 acima menciona electron-vite 5.0.0 e não fixa TypeScript; a decisão prevalece. Nenhum pacote foi instalado.
Git: o agente trata o repositório como somente leitura — `git commit` e `git push` são proibidos, e nenhuma operação GitHub é executada pelo agente (registrado em `CLAUDE.md`). Ao fim de cada tarefa o usuário executa commit e pull request com a ferramenta `gitpr`. O §2 acima (clone a partir de URL) não se aplica ao ambiente atual, onde o repositório já está criado localmente.
Banco de testes: Docker ausente. Há dois servidores locais: **MariaDB 11.4.2** (XAMPP, 127.0.0.1:3306, banco `seshatsql`, `root` sem senha) — **não é MySQL** e não serve como alvo; e **MySQL Community 8.4.13** (serviço `MySQL84`, 127.0.0.1:3307, banco `seshatsql`), instalado em 2026-10-29, que atende S01–S04 e T02 para a linha 8.4. **9.7 LTS e 8.0.46 legado continuam sem ambiente.**
## Fontes
https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites ; https://releases.electronjs.org/?channel=stable ; https://electron-vite.org/guide/ ; https://www.electron.build/docs/nsis/ .
