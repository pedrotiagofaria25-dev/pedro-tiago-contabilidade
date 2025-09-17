@echo off
cd /d "%~dp0"
echo ======================================================
echo    SERVIDOR DE DESENVOLVIMENTO - PEDRO TIAGO
echo ======================================================
echo.

echo 🚀 Iniciando servidor de desenvolvimento...
echo 📍 URL: http://localhost:3000
echo.
echo ⚠️  Pressione Ctrl+C para parar o servidor
echo.

call npm run dev

pause