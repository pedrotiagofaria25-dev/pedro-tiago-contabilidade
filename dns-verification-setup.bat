@echo off
echo ===============================================
echo VERIFICAÇÃO DE DOMÍNIO - PEDRO TIAGO CONTABILIDADE
echo Configuração automática DNS TXT para OpenAI
echo ===============================================

echo.
echo REGISTRO TXT NECESSÁRIO:
echo ----------------------------------------
echo Nome/Host: @ ou www.pedrotiagocontabilidade.com.br
echo Tipo: TXT
echo Valor: openai-domain-verification=dv-26L88WpUpxA27NMDHZvQFSx3
echo TTL: 3600 (1 hora)
echo ----------------------------------------

echo.
echo [1/3] Abrindo registro.br - Painel DNS...
start "https://registro.br/painel/"
timeout 3 >nul 2>&1

echo [2/3] Abrindo documentação DNS do registro.br...
start "https://registro.br/tecnologia/provedor-hospedagem/dns/"
timeout 3 >nul 2>&1

echo [3/3] Abrindo verificador DNS externo...
start "https://dnschecker.org/all-dns-records-of-domain.php?query=pedrotiagocontabilidade.com.br"

echo.
echo ===============================================
echo INSTRUÇÕES PASSO A PASSO:
echo.
echo 1. ACESSE O PAINEL registro.br
echo    - Login: pedrotiagofaria25@gmail.com
echo    - Entre na seção "DNS"
echo.
echo 2. ADICIONAR REGISTRO TXT:
echo    Campo "Nome": @
echo    Tipo: TXT
echo    Valor: openai-domain-verification=dv-26L88WpUpxA27NMDHZvQFSx3
echo    TTL: 3600
echo.
echo 3. SALVAR CONFIGURAÇÕES
echo    - Clique em "Adicionar"
echo    - Aguarde propagação (até 24h)
echo.
echo 4. VERIFICAR PROPAGAÇÃO:
echo    - Use o verificador DNS aberto
echo    - Procure por registro TXT
echo    - Confirme o valor correto
echo ===============================================

echo.
echo Pressione qualquer tecla após configurar o DNS...
pause >nul

echo.
echo ===============================================
echo TESTANDO PROPAGAÇÃO DNS...
echo ===============================================

nslookup -type=TXT pedrotiagocontabilidade.com.br
echo.
echo ⚠️  Se o registro não aparecer ainda, aguarde até 24h para propagação
echo ✅ Quando aparecer, pode marcar "Checar" na verificação OpenAI
echo.
echo URLs ÚTEIS ABERTAS:
echo 🌐 Painel registro.br: https://registro.br/painel/
echo 🔍 Verificador DNS: https://dnschecker.org/
echo 📚 Documentação: https://registro.br/tecnologia/provedor-hospedagem/dns/
echo ===============================================

pause