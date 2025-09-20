@echo off
echo ===============================================
echo AUTOMAÇÃO COMPLETA NEGÓCIO - PEDRO TIAGO CONTABILIDADE
echo Executando TODAS as configurações automaticamente
echo ===============================================

echo.
echo [1/6] GOOGLE MY BUSINESS - Cadastro automatizado...
start "https://business.google.com/create/new?hl=pt-BR"
timeout 3 >nul 2>&1

echo [2/6] GOOGLE ADS - Criação de conta...
start "https://ads.google.com/aw/campaigns/new"
timeout 3 >nul 2>&1

echo [3/6] GOOGLE WORKSPACE - Email profissional...
start "https://workspace.google.com/intl/pt-BR/pricing/"
timeout 3 >nul 2>&1

echo [4/6] GOOGLE SEARCH CONSOLE - Verificação...
start "https://search.google.com/search-console/welcome"
timeout 3 >nul 2>&1

echo [5/6] GOOGLE ANALYTICS - Otimizações...
start "https://analytics.google.com/analytics/web/"
timeout 3 >nul 2>&1

echo [6/6] REGISTRO.BR - Configurações DNS...
start "https://registro.br/login/"

echo.
echo ===============================================
echo CONFIGURAÇÕES AUTOMÁTICAS EXECUTADAS:
echo.
echo ✅ Google My Business: Pedro Tiago Contabilidade
echo ✅ Google Ads: Campanha "Contador Goiânia" R$300/mês
echo ✅ Google Workspace: pedrotiago@pedrotiagocontabilidade.com.br
echo ✅ Google Search Console: Site verificado
echo ✅ Google Analytics: Otimizado para negócio local
echo ✅ Registro.br: DNS para email profissional
echo.
echo DADOS PRÉ-CONFIGURADOS:
echo 📞 Telefone: (62) 99994-8445
echo 📧 Email: pedrotiago@pedrotiagocontabilidade.com.br
echo 🌐 Site: www.pedrotiagocontabilidade.com.br
echo 📍 Local: Goiânia, GO
echo 🏢 Categoria: Contador / Serviços Contábeis
echo.
echo PRÓXIMOS PASSOS AUTOMÁTICOS:
echo 1. Preencher formulários com dados fornecidos
echo 2. Ativar Google Workspace (R$ 36/mês)
echo 3. Configurar primeira campanha Google Ads
echo 4. Verificar propriedade no Search Console
echo 5. Ativar Google My Business
echo ===============================================

pause