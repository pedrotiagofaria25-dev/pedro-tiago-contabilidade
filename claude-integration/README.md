# Pedro Tiago Contabilidade - Integração Claude Code

## Sobre o Projeto

Sistema de integração avançada com Claude Code para automação completa dos processos contábeis da **Pedro Tiago Contabilidade** (CRC GO-027770/O). Esta solução oferece automação inteligente para sistemas contábeis, análise de dados e otimização de workflows.

### Sistemas Integrados
- **Calima Web** - Sistema contábil principal
- **Makrosystem Web** - Sistema contábil secundário
- **Site Principal** - www.pedrotiagocontabilidade.com.br

## Instalação

### Pré-requisitos
- Node.js 18+
- NPM 9+
- Chave API da Anthropic Claude

### Configuração Inicial

```bash
# Clone e navegue para o diretório
cd C:\Users\pedro\GitHub\pedro-tiago-contabilidade\claude-integration

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

### Variáveis de Ambiente Necessárias

```env
# API Claude
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-sonnet-20240229

# Dados da Empresa
COMPANY_NAME=Pedro Tiago Contabilidade
CRC_NUMBER=GO-027770/O
WHATSAPP=62999948445
EMAIL=pedrotiago@pedrotiagocontabilidade.com.br

# URLs dos Sistemas
CALIMA_URL=https://calima.web.url
MAKRO_URL=https://makrosystem.web.url
SITE_URL=https://www.pedrotiagocontabilidade.com.br
```

## Scripts Disponíveis

### Comandos Principais

```bash
# Iniciar sistema principal
npm start

# Modo desenvolvimento
npm run dev

# Executar testes
npm test

# Formatação de código
npm run format
```

### Comandos Específicos por Sistema

```bash
# Integração Calima Web
npm run calima

# Integração Makrosystem
npm run makro

# Backup automático
npm run backup

# Monitoramento de sistemas
npm run monitor

# Sincronização de dados
npm run sync
```

## Estrutura do Projeto

```
claude-integration/
├── index.js                 # Ponto de entrada principal
├── package.json             # Configurações e dependências
├── .env.example            # Template de variáveis de ambiente
├── README.md               # Esta documentação
├── config/                 # Arquivos de configuração
│   ├── claude-config.js    # Configurações Claude Code
│   ├── systems-config.js   # Configurações dos sistemas contábeis
│   └── logger-config.js    # Configurações de logging
├── utils/                  # Utilitários
│   ├── api-client.js       # Cliente para APIs
│   ├── data-processor.js   # Processamento de dados
│   ├── backup-manager.js   # Gerenciamento de backups
│   └── system-monitor.js   # Monitor de sistemas
└── examples/               # Scripts de exemplo
    ├── calima-integration.js      # Automação Calima
    ├── makrosystem-integration.js # Automação Makrosystem
    ├── backup-automation.js      # Backup automático
    ├── system-monitor.js         # Monitoramento
    ├── data-sync.js             # Sincronização
    └── report-generator.js       # Geração de relatórios
```

## Exemplos de Uso

### 1. Automação Calima Web

```javascript
const { CalimaIntegration } = require('./examples/calima-integration');

const calima = new CalimaIntegration();
await calima.processMonthlyReports('2024-01');
```

### 2. Sincronização de Dados

```javascript
const { DataSync } = require('./examples/data-sync');

const sync = new DataSync();
await sync.syncBetweenSystems();
```

### 3. Monitoramento Automático

```javascript
const { SystemMonitor } = require('./examples/system-monitor');

const monitor = new SystemMonitor();
monitor.startRealTimeMonitoring();
```

## Funcionalidades Principais

### 🤖 Automação Inteligente
- Processamento automático de documentos contábeis
- Análise e categorização de transações
- Geração automática de relatórios

### 📊 Integração de Sistemas
- Sincronização bidirecional Calima ↔ Makrosystem
- Backup automático de dados críticos
- Monitoramento contínuo de performance

### 📈 Análise Avançada
- Dashboard em tempo real
- Alertas proativos de irregularidades
- Relatórios personalizados por cliente

### 🔒 Segurança
- Criptografia de dados sensíveis
- Logs auditáveis de todas as operações
- Backup automático com versionamento

## Comandos CLI Personalizados

### Gestão de Clientes
```bash
# Listar todos os clientes
node index.js --list-clients

# Processar cliente específico
node index.js --process-client "Nome do Cliente"

# Gerar relatório mensal
node index.js --monthly-report 2024-01
```

### Monitoramento
```bash
# Status dos sistemas
node index.js --system-status

# Verificar integridade dos dados
node index.js --data-integrity

# Executar backup completo
node index.js --full-backup
```

## Configuração Avançada

### Agendamento de Tarefas

O sistema suporta agendamento automático via cron:

```javascript
// Backup diário às 2h da manhã
'0 2 * * *': () => backupManager.dailyBackup(),

// Sincronização a cada 4 horas
'0 */4 * * *': () => dataSync.syncSystems(),

// Relatórios mensais no dia 1
'0 9 1 * *': () => reportGenerator.monthlyReports()
```

### Notificações

Configure notificações via:
- WhatsApp (62999948445)
- Email (pedrotiago@pedrotiagocontabilidade.com.br)
- Dashboard web

## Troubleshooting

### Problemas Comuns

**Erro de API Key:**
```bash
Error: CLAUDE_API_KEY não encontrada
Solução: Verifique o arquivo .env
```

**Falha na conexão com sistemas:**
```bash
Error: Connection timeout
Solução: Verifique URLs e credenciais dos sistemas
```

**Problemas de permissão:**
```bash
Error: Access denied
Solução: Execute como administrador no Windows
```

## Suporte e Contato

- **Desenvolvedor**: Pedro Tiago
- **CRC**: GO-027770/O
- **WhatsApp**: 62999948445
- **Email**: pedrotiago@pedrotiagocontabilidade.com.br
- **Site**: www.pedrotiagocontabilidade.com.br

## Contribuição

Este é um sistema proprietário da Pedro Tiago Contabilidade. Para sugestões ou melhorias, entre em contato através dos canais oficiais.

## Licença

MIT License - Uso interno Pedro Tiago Contabilidade

---

**Última atualização**: Setembro 2024
**Versão do Claude Code**: Compatível com versões mais recentes
**Status**: Produção ativa ✅