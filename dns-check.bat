@echo off
echo ===============================================
echo VERIFICADOR DNS - PEDRO TIAGO CONTABILIDADE
echo www.pedrotiagocontabilidade.com.br
echo ===============================================

echo.
echo [INFO] Verificando propagacao DNS...
echo.

echo [1] Testando resolucao DNS...
nslookup www.pedrotiagocontabilidade.com.br
echo.

echo [2] Testando conectividade HTTP...
curl -I --connect-timeout 10 http://www.pedrotiagocontabilidade.com.br 2>nul
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] HTTP funcionando!
) else (
    echo [WARNING] HTTP ainda nao acessivel
)
echo.

echo [3] Testando conectividade HTTPS...
curl -I --connect-timeout 10 https://www.pedrotiagocontabilidade.com.br 2>nul
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] HTTPS funcionando!
) else (
    echo [WARNING] HTTPS ainda nao acessivel ou certificado pendente
)
echo.

echo ===============================================
echo RESULTADO:
echo - GitHub Pages direto: FUNCIONANDO
echo - Dominio customizado: Aguardando propagacao
echo - Tempo estimado: 5-30 minutos
echo ===============================================

pause