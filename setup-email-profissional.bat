@echo off
echo ===============================================
echo CONFIGURAÇÃO EMAIL PROFISSIONAL
echo Pedro Tiago Contabilidade
echo pedrotiago@pedrotiagocontabilidade.com.br
echo ===============================================

echo.
echo [INFO] Abrindo provedores de email profissional...

echo [1] Google Workspace (Recomendado - $6/mês)
start "https://workspace.google.com/pricing/"
timeout 2 >nul 2>&1

echo [2] Zoho Mail (Econômico - $1/mês)
start "https://www.zoho.com/mail/zohomail-pricing.html"
timeout 2 >nul 2>&1

echo [3] Microsoft 365 (Empresarial - $6/mês)
start "https://www.microsoft.com/pt-br/microsoft-365/business/compare-all-microsoft-365-business-products"
timeout 2 >nul 2>&1

echo.
echo ===============================================
echo RECOMENDAÇÃO:
echo 1. Google Workspace Business Starter ($6/mês)
echo    - Gmail profissional
echo    - 30GB armazenamento
echo    - Google Drive, Docs, Sheets
echo    - Suporte 24/7
echo.
echo 2. Configurar DNS no registro.br:
echo    MX 1 aspmx.l.google.com
echo    MX 5 alt1.aspmx.l.google.com
echo    MX 5 alt2.aspmx.l.google.com
echo    MX 10 alt3.aspmx.l.google.com
echo    MX 10 alt4.aspmx.l.google.com
echo ===============================================

pause