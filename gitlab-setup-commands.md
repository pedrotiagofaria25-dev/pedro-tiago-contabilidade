# Comandos para Configuração GitLab - Pedro Tiago Contabilidade

## 1. Configuração do Repositório Git
```bash
# Configurar usuário (se não estiver configurado)
git config user.name "Pedro Tiago"
git config user.email "pedrotiagofaria25@gmail.com"

# Adicionar remote GitLab (se não existir)
git remote add gitlab https://gitlab.com/pedrotiagofaria25/pedro-tiago-contabilidade.git

# Ou atualizar remote existente
git remote set-url gitlab https://gitlab.com/pedrotiagofaria25/pedro-tiago-contabilidade.git
```

## 2. Deploy Inicial para GitLab
```bash
# Verificar branch atual
git branch

# Adicionar arquivos modificados
git add .

# Commit das otimizações
git commit -m "feat: Otimização completa GitLab Pages e CI/CD

- Configuração otimizada de .gitlab-ci.yml
- Remoção da dependência problemática do Vercel
- Adição de cache e otimizações de performance
- Configuração de domínio customizado www.pedrotiagocontabilidade.com.br
- Templates de issues e merge requests
- Configuração completa para automação por AIs"

# Push para GitLab
git push gitlab main
```

## 3. Configurações no GitLab (Interface Web)

### 3.1. Configurar GitLab Pages
1. Acesse: https://gitlab.com/pedrotiagofaria25/pedro-tiago-contabilidade
2. Vá em Settings > Pages
3. Configure:
   - Source: Deploy from a job (pages)
   - Custom domain: www.pedrotiagocontabilidade.com.br
   - Force HTTPS: Enabled

### 3.2. Configurar Variables do CI/CD
1. Acesse: Settings > CI/CD > Variables
2. Adicionar variáveis necessárias (se houver)

### 3.3. Configurar Runners
1. Acesse: Settings > CI/CD > Runners
2. Verificar se shared runners estão habilitados

### 3.4. Configurar Notificações
1. Acesse: Settings > Integrations
2. Configure notificações por email para: pedrotiagofaria25@gmail.com

## 4. Configuração DNS (Para o Domínio)
```
# Configurar no seu provedor DNS:
CNAME www.pedrotiagocontabilidade.com.br -> pedrotiagofaria25.gitlab.io
```

## 5. Verificação Final
```bash
# Verificar se o pipeline está rodando
# Acessar: https://gitlab.com/pedrotiagofaria25/pedro-tiago-contabilidade/-/pipelines

# Verificar se o site está no ar
# Acessar: https://pedrotiagofaria25.gitlab.io/pedro-tiago-contabilidade
```

## 6. Comandos de Manutenção
```bash
# Forçar novo deploy
git commit --allow-empty -m "feat: Force redeploy"
git push gitlab main

# Verificar status
git status
git log --oneline -5

# Sync com GitHub (se necessário)
git push origin main
```

## URLs Importantes
- **Projeto GitLab**: https://gitlab.com/pedrotiagofaria25/pedro-tiago-contabilidade
- **GitLab Pages**: https://pedrotiagofaria25.gitlab.io/pedro-tiago-contabilidade
- **Domínio Customizado**: https://www.pedrotiagocontabilidade.com.br
- **Pipelines**: https://gitlab.com/pedrotiagofaria25/pedro-tiago-contabilidade/-/pipelines