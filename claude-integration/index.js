#!/usr/bin/env node

/**
 * Pedro Tiago Contabilidade - Sistema de Integração Claude Code
 * Ponto de entrada principal para automação contábil avançada
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @version 1.0.0
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const fs = require('fs-extra');
const path = require('path');
const { program } = require('commander');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Carregar configurações de ambiente
dotenv.config();

// Importar módulos do sistema
const ClaudeConfig = require('./config/claude-config');
const SystemsConfig = require('./config/systems-config');
const Logger = require('./config/logger-config');
const ApiClient = require('./utils/api-client');
const SystemMonitor = require('./utils/system-monitor');
const BackupManager = require('./utils/backup-manager');

// Importar integrações específicas
const CalimaIntegration = require('./examples/calima-integration');
const MakrosystemIntegration = require('./examples/makrosystem-integration');
const DataSync = require('./examples/data-sync');
const ReportGenerator = require('./examples/report-generator');

class PedroTiagoClaudeIntegration {
    constructor() {
        this.logger = new Logger('Main');
        this.apiClient = new ApiClient();
        this.monitor = new SystemMonitor();
        this.backup = new BackupManager();
        this.app = express();

        this.initializeSystem();
    }

    async initializeSystem() {
        try {
            this.logger.info('Inicializando Sistema de Integração Claude Code');
            this.logger.info('Pedro Tiago Contabilidade - CRC GO-027770/O');

            // Verificar configurações essenciais
            await this.validateConfiguration();

            // Configurar Express.js
            this.setupExpress();

            // Inicializar monitoramento
            await this.monitor.initialize();

            // Configurar integrações
            this.setupIntegrations();

            this.logger.info('Sistema inicializado com sucesso');
        } catch (error) {
            this.logger.error('Erro na inicialização:', error);
            process.exit(1);
        }
    }

    async validateConfiguration() {
        const requiredEnvVars = [
            'CLAUDE_API_KEY',
            'COMPANY_NAME',
            'CRC_NUMBER',
            'EMAIL'
        ];

        const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

        if (missing.length > 0) {
            throw new Error(`Variáveis de ambiente obrigatórias não encontradas: ${missing.join(', ')}`);
        }

        // Verificar conectividade com Claude API
        try {
            await this.apiClient.testConnection();
            this.logger.info('Conexão com Claude API validada');
        } catch (error) {
            throw new Error(`Falha na conexão com Claude API: ${error.message}`);
        }
    }

    setupExpress() {
        // Middlewares de segurança
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('combined'));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Rotas principais
        this.setupRoutes();

        // Middleware de tratamento de erros
        this.app.use((err, req, res, next) => {
            this.logger.error('Erro no servidor:', err);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Entre em contato com o suporte'
            });
        });
    }

    setupRoutes() {
        // Rota de status
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'online',
                company: process.env.COMPANY_NAME,
                crc: process.env.CRC_NUMBER,
                version: require('./package.json').version,
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        });

        // Rota de saúde dos sistemas
        this.app.get('/api/health', async (req, res) => {
            try {
                const health = await this.monitor.getSystemHealth();
                res.json(health);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Rota para executar backup
        this.app.post('/api/backup', async (req, res) => {
            try {
                const result = await this.backup.executeBackup(req.body.type || 'full');
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Rota para sincronização
        this.app.post('/api/sync', async (req, res) => {
            try {
                const dataSync = new DataSync();
                const result = await dataSync.syncBetweenSystems();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Rota para geração de relatórios
        this.app.post('/api/reports', async (req, res) => {
            try {
                const generator = new ReportGenerator();
                const result = await generator.generateReport(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupIntegrations() {
        this.integrations = {
            calima: new CalimaIntegration(),
            makrosystem: new MakrosystemIntegration(),
            dataSync: new DataSync(),
            reportGenerator: new ReportGenerator()
        };
    }

    async startWebServer(port = process.env.PORT || 3000) {
        return new Promise((resolve, reject) => {
            this.app.listen(port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.logger.info(`Servidor web iniciado na porta ${port}`);
                    this.logger.info(`Acesse: http://localhost:${port}/api/status`);
                    resolve(port);
                }
            });
        });
    }

    // Comandos CLI
    async processClient(clientName) {
        this.logger.info(`Processando cliente: ${clientName}`);

        try {
            // Processar no Calima
            await this.integrations.calima.processClient(clientName);

            // Processar no Makrosystem
            await this.integrations.makrosystem.processClient(clientName);

            // Sincronizar dados
            await this.integrations.dataSync.syncClientData(clientName);

            this.logger.info(`Cliente ${clientName} processado com sucesso`);
        } catch (error) {
            this.logger.error(`Erro ao processar cliente ${clientName}:`, error);
            throw error;
        }
    }

    async generateMonthlyReport(period) {
        this.logger.info(`Gerando relatório mensal para ${period}`);

        try {
            const report = await this.integrations.reportGenerator.generateMonthlyReport(period);
            this.logger.info(`Relatório mensal gerado: ${report.filePath}`);
            return report;
        } catch (error) {
            this.logger.error(`Erro ao gerar relatório mensal:`, error);
            throw error;
        }
    }

    async getSystemStatus() {
        try {
            const status = await this.monitor.getDetailedStatus();
            console.table(status);
            return status;
        } catch (error) {
            this.logger.error('Erro ao obter status do sistema:', error);
            throw error;
        }
    }

    async executeFullBackup() {
        this.logger.info('Executando backup completo...');

        try {
            const result = await this.backup.fullBackup();
            this.logger.info(`Backup completo finalizado: ${result.filePath}`);
            return result;
        } catch (error) {
            this.logger.error('Erro no backup completo:', error);
            throw error;
        }
    }
}

// Configurar CLI com Commander.js
program
    .name('pedro-tiago-claude')
    .description('Sistema de Integração Claude Code - Pedro Tiago Contabilidade')
    .version(require('./package.json').version);

program
    .command('server')
    .description('Iniciar servidor web')
    .option('-p, --port <port>', 'Porta do servidor', '3000')
    .action(async (options) => {
        const integration = new PedroTiagoClaudeIntegration();
        await integration.startWebServer(options.port);
    });

program
    .command('process-client <name>')
    .description('Processar cliente específico')
    .action(async (name) => {
        const integration = new PedroTiagoClaudeIntegration();
        await integration.processClient(name);
        process.exit(0);
    });

program
    .command('monthly-report <period>')
    .description('Gerar relatório mensal (formato: YYYY-MM)')
    .action(async (period) => {
        const integration = new PedroTiagoClaudeIntegration();
        await integration.generateMonthlyReport(period);
        process.exit(0);
    });

program
    .command('system-status')
    .description('Verificar status dos sistemas')
    .action(async () => {
        const integration = new PedroTiagoClaudeIntegration();
        await integration.getSystemStatus();
        process.exit(0);
    });

program
    .command('full-backup')
    .description('Executar backup completo')
    .action(async () => {
        const integration = new PedroTiagoClaudeIntegration();
        await integration.executeFullBackup();
        process.exit(0);
    });

// Executar CLI ou servidor baseado nos argumentos
if (require.main === module) {
    if (process.argv.length <= 2) {
        // Iniciar servidor se não houver argumentos
        const integration = new PedroTiagoClaudeIntegration();
        integration.startWebServer().catch(console.error);
    } else {
        // Executar CLI
        program.parse();
    }
}

module.exports = PedroTiagoClaudeIntegration;