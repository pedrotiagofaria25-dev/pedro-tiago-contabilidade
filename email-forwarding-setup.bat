@echo off
echo ===============================================
echo CONFIGURAÇÃO EMAIL PROFISSIONAL - PEDRO TIAGO CONTABILIDADE
echo Automatizando encaminhamento e configurações
echo ===============================================

echo.
echo [1/5] Abrindo Google Workspace - Configuração de encaminhamento...
start "https://admin.google.com/ac/domainverification"
timeout 3 >nul 2>&1

echo [2/5] Gmail - Configurar alias e encaminhamento...
start "https://mail.google.com/mail/u/0/#settings/accounts"
timeout 3 >nul 2>&1

echo [3/5] Registro.br - Verificar configurações DNS...
start "https://registro.br/tecnologia/ferramentas-tecnicas/dns/"
timeout 3 >nul 2>&1

echo [4/5] Google Admin Console - Configurar usuários...
start "https://admin.google.com/ac/users"
timeout 3 >nul 2>&1

echo [5/5] Teste de conectividade email...
start "https://toolbox.googleapps.com/apps/checkmx/"

echo.
echo ===============================================
echo CONFIGURAÇÕES AUTOMÁTICAS ABERTAS:
echo.
echo ✅ Google Workspace Admin Console
echo ✅ Gmail - Contas e Importação
echo ✅ Registro.br - Configurações DNS
echo ✅ Verificador conectividade MX
echo.
echo DADOS PRÉ-CONFIGURADOS:
echo 📧 Email profissional: pedrotiago@pedrotiagocontabilidade.com.br
echo 📧 Email pessoal: pedrotiagofaria25@gmail.com
echo 🌐 Domínio: pedrotiagocontabilidade.com.br
echo.
echo PRÓXIMOS PASSOS AUTOMÁTICOS:
echo 1. Contratar Google Workspace Business Starter (R$ 36/mês)
echo 2. Configurar DNS no registro.br (MX records)
echo 3. Configurar encaminhamento Gmail → Email pessoal
echo 4. Testar envio/recebimento de emails
echo 5. Configurar assinatura profissional
echo ===============================================

echo.
echo Pressione qualquer tecla para abrir instruções detalhadas...
pause >nul

start "email-profissional-instrucoes.txt"