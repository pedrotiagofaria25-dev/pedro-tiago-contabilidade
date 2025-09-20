@echo off
echo ===============================================
echo CONFIGURACAO FIREBASE HOSTING
echo Pedro Tiago Contabilidade
echo ===============================================

echo.
echo [1] Instalando Firebase CLI...
npm install -g firebase-tools

echo.
echo [2] Fazendo login no Firebase...
echo IMPORTANTE: Use sua conta Google: pedrotiagofaria25@gmail.com
firebase login

echo.
echo [3] Inicializando projeto Firebase...
firebase init hosting
echo Selecione:
echo - Use an existing project: pedro-tiago-contabilidade
echo - Public directory: dist
echo - Configure as single-page app: Yes
echo - Set up automatic builds with GitHub: Yes

echo.
echo [4] Fazendo primeiro deploy...
npm run build
firebase deploy

echo.
echo [5] Configurando dominio customizado...
echo Acesse: https://console.firebase.google.com
echo Va em Hosting > Add custom domain
echo Digite: www.pedrotiagocontabilidade.com.br

echo.
echo Configuracao concluida!
echo ===============================================
echo URL Firebase: https://pedro-tiago-contabilidade.web.app
echo URL Customizada: https://www.pedrotiagocontabilidade.com.br
echo ===============================================
pause