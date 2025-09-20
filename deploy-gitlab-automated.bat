@echo off
echo ===============================================
echo DEPLOY AUTOMATIZADO GITLAB - PEDRO TIAGO CONTABILIDADE
echo Email: pedrotiagofaria25@gmail.com
echo Dominio: www.pedrotiagocontabilidade.com.br
echo ===============================================

echo.
echo [INFO] Verificando configuracao Git...
git config user.name "Pedro Tiago"
git config user.email "pedrotiagofaria25@gmail.com"

echo.
echo [INFO] Verificando branch atual...
git branch

echo.
echo [INFO] Verificando status do repositorio...
git status

echo.
echo [INFO] Adicionando arquivos modificados...
git add .

echo.
echo [INFO] Criando commit automatizado...
set timestamp=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set timestamp=%timestamp: =0%
git commit -m "feat: Deploy automatizado GitLab Pages - %timestamp%

- Atualizacao automatica do site Pedro Tiago Contabilidade
- Deploy via GitLab CI/CD otimizado
- Configuracao para dominio www.pedrotiagocontabilidade.com.br
- Gerado automaticamente em: %timestamp%"

if %errorlevel% neq 0 (
    echo [WARNING] Nenhuma mudanca para commit ou erro no commit
    echo [INFO] Forcando redeploy...
    git commit --allow-empty -m "feat: Force redeploy GitLab Pages - %timestamp%"
)

echo.
echo [INFO] Fazendo push para GitLab...
git push gitlab main

if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo [SUCCESS] DEPLOY CONCLUIDO COM SUCESSO!
    echo ===============================================
    echo.
    echo URLs importantes:
    echo - Projeto GitLab: https://gitlab.com/pedrotiagofaria25/pedro-tiago-contabilidade
    echo - Pipeline: https://gitlab.com/pedrotiagofaria25/pedro-tiago-contabilidade/-/pipelines
    echo - GitLab Pages: https://pedrotiagofaria25.gitlab.io/pedro-tiago-contabilidade
    echo - Dominio customizado: https://www.pedrotiagocontabilidade.com.br
    echo.
    echo [INFO] Aguarde alguns minutos para o pipeline completar...
    echo [INFO] Responsavel: pedrotiagofaria25@gmail.com
    echo.
) else (
    echo.
    echo [ERROR] Falha no deploy para GitLab!
    echo [INFO] Verifique se o remote GitLab esta configurado:
    echo git remote -v
    echo.
    echo [INFO] Para configurar o remote:
    echo git remote add gitlab https://gitlab.com/pedrotiagofaria25/pedro-tiago-contabilidade.git
    echo.
)

echo.
echo [INFO] Pressione qualquer tecla para continuar...
pause >nul