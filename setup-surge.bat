@echo off
echo ===============================================
echo CONFIGURACAO SURGE.SH - DEPLOY AUTOMATIZADO
echo Pedro Tiago Contabilidade
echo ===============================================

echo.
echo [1] Instalando Surge.sh...
npm install -g surge

echo.
echo [2] Fazendo login no Surge.sh...
echo IMPORTANTE: Use seu email: pedrotiagofaria25@gmail.com
surge login

echo.
echo [3] Configurando dominio customizado...
echo Dominio configurado: www.pedrotiagocontabilidade.com.br
echo Arquivo CNAME criado automaticamente

echo.
echo [4] Fazendo primeiro deploy...
npm run build
surge ./dist www.pedrotiagocontabilidade.com.br

echo.
echo [5] Configuracao concluida!
echo ===============================================
echo Proximos deploys: execute deploy-platforms-automated.bat
echo URL: https://www.pedrotiagocontabilidade.com.br
echo ===============================================
pause