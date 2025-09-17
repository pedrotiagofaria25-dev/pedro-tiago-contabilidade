@echo off
echo ======================================================
echo    SETUP COMPLETO - PEDRO TIAGO CONTABILIDADE
echo ======================================================
echo.

echo 🔑 PASSO 1: LOGIN NAS PLATAFORMAS
echo.
echo Executando logins automaticos...
echo.

echo 📡 Fazendo login no Vercel...
start /wait cmd /c "npx vercel login"

echo 🌐 Fazendo login no Netlify...
start /wait cmd /c "npx netlify login"

echo.
echo ✅ Logins concluídos!
echo.

echo 🔧 PASSO 2: CONFIGURANDO PROJETOS
echo.

echo 📦 Configurando projeto Vercel...
echo pedro-tiago-contabilidade | npx vercel --name pedro-tiago-contabilidade

echo 📦 Configurando projeto Netlify...
npx netlify init

echo.
echo ✅ Projetos configurados!
echo.

echo 🚀 PASSO 3: PRIMEIRO DEPLOY
echo.

echo 🏗️ Criando build otimizado...
npm run build

echo 📡 Deploy para Vercel (Produção)...
npx vercel --prod

echo 🌐 Deploy para Netlify (Staging)...
npx netlify deploy --prod --dir=dist

echo.
echo ======================================================
echo    ✅ SETUP COMPLETAMENTE FINALIZADO!
echo ======================================================
echo.
echo 🌐 Seus sites estão online:
echo   - Vercel: https://pedro-tiago-contabilidade.vercel.app
echo   - Netlify: https://pedro-tiago-contabilidade.netlify.app
echo.
echo 🚀 Para desenvolvimento: npm run dev
echo 📦 Para novo deploy: npm run build && npx vercel --prod
echo.
pause