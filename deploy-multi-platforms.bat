@echo off
echo ===============================================
echo DEPLOY MULTI-PLATAFORMAS - PEDRO TIAGO CONTABILIDADE
echo Email: pedrotiagofaria25@gmail.com
echo Dominio: www.pedrotiagocontabilidade.com.br
echo ===============================================

cd /d "C:\PedroTiago\02_Desenvolvimento\Projetos\Site_Principal"

echo.
echo [INFO] Executando build do projeto...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Falha no build!
    pause
    exit /b 1
)

echo.
echo [INFO] Adicionando arquivos ao Git...
git add .

echo.
echo [INFO] Criando commit automatizado...
git commit -m "🚀 Deploy multi-plataformas automatizado - %DATE% %TIME%

- Build Vite atualizado
- Deploy GitHub Pages (principal)
- Deploy GitLab Pages (backup)
- Domínio customizado configurado
- Automação 100%% para AIs"

echo.
echo [INFO] Push para GitHub (GitHub Pages)...
git push origin main
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Problemas com push GitHub
) else (
    echo [SUCCESS] GitHub Pages atualizado!
)

echo.
echo [INFO] Push para GitLab (GitLab Pages)...
git push gitlab main
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Problemas com push GitLab
) else (
    echo [SUCCESS] GitLab Pages atualizado!
)

echo.
echo ===============================================
echo DEPLOY CONCLUÍDO!
echo.
echo URLs DISPONÍVEIS:
echo 🌐 Principal: https://www.pedrotiagocontabilidade.com.br
echo 📱 GitHub: https://pedrotiagofaria25-dev.github.io/pedro-tiago-contabilidade/
echo 🦊 GitLab: https://pedrotiagofaria25.gitlab.io/pedro-tiago-contabilidade/
echo.
echo Aguardando propagação DNS (pode levar até 48h)...
echo ===============================================

pause