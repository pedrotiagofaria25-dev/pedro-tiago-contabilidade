@echo off
cd /d "%~dp0"
echo ======================================================
echo    DEPLOY RÁPIDO - PEDRO TIAGO CONTABILIDADE
echo ======================================================
echo.

echo 🏗️ Criando build otimizado...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro no build! Verifique o código.
    pause
    exit /b 1
)

echo ✅ Build criado com sucesso!
echo.

echo 🚀 Fazendo deploys...
echo.

echo 📡 Deploy para Vercel (Produção)...
call npx vercel --prod

echo 🌐 Deploy para Netlify (Staging)...
call npx netlify deploy --prod --dir=dist

echo.
echo ✅ Deploys concluídos!
echo.
echo 🌐 Acesse seus sites:
echo   - Produção: https://pedro-tiago-contabilidade.vercel.app
echo   - Staging: https://pedro-tiago-contabilidade.netlify.app
echo.
pause