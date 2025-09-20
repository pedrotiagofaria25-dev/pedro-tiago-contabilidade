@echo off
echo 🚀 DEPLOY RÁPIDO - Pedro Tiago Contabilidade
echo ============================================

cd /d "C:\PedroTiago\02_Desenvolvimento\Projetos\Site_Principal"

echo 🔨 Executando build...
call npm run build

echo 🌐 Fazendo deploy...
call "%USERPROFILE%\AppData\Roaming\npm\vercel.cmd" --prod --yes

echo ✅ Deploy concluído!
echo 🌐 Site: https://www.pedrotiagocontabilidade.com.br

pause