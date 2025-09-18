@echo off
echo 🤖 DEPLOY AI-AUTOMATED - Pedro Tiago Contabilidade
echo ================================================
echo.
echo ✅ Sistema configurado para automacao total de agentes IA
echo 🚀 Executando deploy automatico...
echo.

cd /d "C:\PedroTiago\02_Desenvolvimento\Projetos\Site_Principal"

echo 🔨 Build automatico...
call npm run build

echo 🌐 Deploy Vercel automatico...
call "%USERPROFILE%\AppData\Roaming\npm\vercel.cmd" --prod --yes

echo 📤 Push para repositorios automatico...
git add .
git commit -m "🤖 Deploy automatico via AI-Automation - %DATE% %TIME%"
git push origin main

echo.
echo ✅ DEPLOY AI-AUTOMATED CONCLUIDO!
echo 🌐 Site: https://www.pedrotiagocontabilidade.com.br
echo 🤖 Sistema: 100% automatizavel para qualquer agente IA
echo.
pause