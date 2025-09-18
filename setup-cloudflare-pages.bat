@echo off
echo ===============================================
echo CONFIGURACAO CLOUDFLARE PAGES
echo Pedro Tiago Contabilidade
echo ===============================================

echo.
echo [1] Instalando Wrangler CLI...
npm install -g @cloudflare/wrangler

echo.
echo [2] Fazendo login no Cloudflare...
npx wrangler login

echo.
echo [3] Criando projeto no Cloudflare Pages...
echo Acesse: https://dash.cloudflare.com/pages
echo Clique em "Create a project"
echo Conecte seu repositorio GitHub: pedro-tiago-contabilidade
echo Configuracoes de build:
echo - Framework preset: React
echo - Build command: npm run build
echo - Build output directory: dist

echo.
echo [4] Configurando dominio customizado...
echo No painel do Cloudflare Pages:
echo - Va em Custom domains
echo - Add custom domain: www.pedrotiagocontabilidade.com.br
echo - Siga as instrucoes para configurar DNS

echo.
echo [5] Deploy automatico configurado via GitHub!
echo ===============================================
echo Cada push no main ativa deploy automatico
echo URL: https://pedro-tiago-contabilidade.pages.dev
echo URL Customizada: https://www.pedrotiagocontabilidade.com.br
echo ===============================================
pause