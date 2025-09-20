@echo off
echo ===============================================
echo DEPLOY AUTOMATIZADO - MULTIPLAS PLATAFORMAS
echo Pedro Tiago Contabilidade
echo ===============================================

echo.
echo [1/7] Construindo projeto...
call npm run build
if %errorlevel% neq 0 (
    echo ERRO: Falha na construcao do projeto
    pause
    exit /b 1
)

echo.
echo [2/7] Fazendo commit das alteracoes...
git add .
git commit -m "Deploy automatizado multiplas plataformas - %date% %time%"

echo.
echo [3/7] Enviando para GitHub (GitHub Pages)...
git push origin main
if %errorlevel% neq 0 (
    echo AVISO: Falha no push para GitHub
)

echo.
echo [4/7] Enviando para GitLab (GitLab Pages)...
git push gitlab main
if %errorlevel% neq 0 (
    echo AVISO: Falha no push para GitLab
)

echo.
echo [5/7] Deploy via Surge.sh...
npx surge ./dist www.pedrotiagocontabilidade.com.br
if %errorlevel% neq 0 (
    echo AVISO: Falha no deploy Surge.sh
)

echo.
echo [6/7] Verificando status dos deploys...
timeout /t 30 /nobreak >nul
echo GitHub Pages: https://pedrotiagofaria25-dev.github.io/pedro-tiago-contabilidade/
echo GitLab Pages: https://pedrotiagofaria25.gitlab.io/pedro-tiago-contabilidade/
echo Surge.sh: https://www.pedrotiagocontabilidade.com.br/

echo.
echo [7/7] Deploy concluido!
echo ===============================================
echo Verifique os links acima para confirmar o sucesso
echo ===============================================
pause