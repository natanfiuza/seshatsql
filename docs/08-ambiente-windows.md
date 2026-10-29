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
## Fontes
https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites ; https://releases.electronjs.org/?channel=stable ; https://electron-vite.org/guide/ ; https://www.electron.build/docs/nsis/ .
