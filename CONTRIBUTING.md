# Guia de Contribuição - Pedro Tiago Contabilidade

Obrigado pelo seu interesse em contribuir com nossos projetos de soluções contábeis! Este guia irá ajudá-lo a contribuir de forma eficaz.

## 🎯 Código de Conduta

Este projeto segue um código de conduta. Ao participar, você deve manter um ambiente respeitoso e profissional.

## 🚀 Como Contribuir

### 1. Reportando Bugs
- Use o template de bug report
- Seja específico e detalhado
- Inclua passos para reproduzir
- Adicione screenshots se necessário

### 2. Sugerindo Funcionalidades
- Use o template de feature request
- Explique o problema que a funcionalidade resolve
- Descreva a solução proposta
- Considere alternativas

### 3. Contribuindo com Código

#### Preparando o Ambiente
```bash
# Clone o repositório
git clone https://github.com/pedrotiagofaria25-dev/pedro-tiago-contabilidade.git
cd pedro-tiago-contabilidade

# Crie um ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instale dependências
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

#### Padrões de Código
- Use **Black** para formatação: `black .`
- Use **isort** para imports: `isort .`
- Use **flake8** para linting: `flake8 .`
- Mantenha cobertura de testes acima de 80%

#### Processo de Desenvolvimento
1. **Fork** o repositório
2. Crie uma **branch** para sua feature: `git checkout -b feature/nova-funcionalidade`
3. **Commit** suas mudanças: `git commit -m "Add: nova funcionalidade"`
4. **Push** para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um **Pull Request**

#### Padrões de Commit
```
tipo: descrição curta

Descrição detalhada se necessário

- Add: nova funcionalidade
- Fix: correção de bug
- Update: atualização de funcionalidade existente
- Remove: remoção de código
- Docs: documentação
- Style: formatação
- Refactor: refatoração
- Test: testes
```

### 4. Documentação
- Documente funções complexas
- Mantenha README atualizado
- Use docstrings no formato Google

## 🧪 Testes

### Executando Testes
```bash
# Todos os testes
pytest

# Com cobertura
pytest --cov=./

# Testes específicos
pytest tests/test_specific.py
```

### Escrevendo Testes
- Use **pytest** como framework
- Testes unitários para lógica de negócio
- Testes de integração para APIs
- Mocks para dependências externas

## 📋 Checklist para Pull Requests

- [ ] Código formatado com Black
- [ ] Imports organizados com isort
- [ ] Sem warnings do flake8
- [ ] Testes passando
- [ ] Cobertura mantida/melhorada
- [ ] Documentação atualizada
- [ ] CHANGELOG.md atualizado

## 🏗️ Arquitetura do Projeto

```
pedro-tiago-contabilidade/
├── src/                    # Código fonte
│   ├── core/              # Lógica central
│   ├── api/               # APIs e endpoints
│   ├── models/            # Modelos de dados
│   └── utils/             # Utilitários
├── tests/                 # Testes
├── docs/                  # Documentação
├── scripts/               # Scripts de automação
└── config/                # Configurações
```

## 🔧 Configurações de Desenvolvimento

### VS Code
Configurações recomendadas (`.vscode/settings.json`):
```json
{
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "python.formatting.provider": "black",
    "editor.formatOnSave": true
}
```

### Git Hooks
Recomendamos usar pre-commit:
```bash
pip install pre-commit
pre-commit install
```

## 📞 Contato e Suporte

- **Email**: pedrotiago@pedrotiagocontabilidade.com.br
- **WhatsApp**: 62999948445
- **Issues**: Use o sistema de issues do GitHub

## 🎖️ Reconhecimento

Contribuidores serão reconhecidos no README e releases.

---

**Pedro Tiago Contabilidade - CRC GO-027770/O**
*Soluções Contábeis Inteligentes e Automatizadas*

Obrigado por contribuir para a inovação contábil no Brasil! 🚀