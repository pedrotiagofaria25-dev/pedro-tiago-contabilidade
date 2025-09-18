/**
 * Pedro Tiago Contabilidade - Monitor de Sistemas
 * Monitoramento avançado dos sistemas contábeis e infraestrutura
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const EventEmitter = require('events');

const Logger = require('../config/logger-config');
const SystemsConfig = require('../config/systems-config');

class SystemMonitor extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('SystemMonitor');
        this.config = new SystemsConfig();

        this.monitoringActive = false;
        this.intervals = [];
        this.metrics = {
            calima: { status: 'unknown', lastCheck: null, responseTime: null, errors: [] },
            makrosystem: { status: 'unknown', lastCheck: null, responseTime: null, errors: [] },
            claude: { status: 'unknown', lastCheck: null, responseTime: null, errors: [] },
            system: { cpu: null, memory: null, disk: null, uptime: null }
        };

        this.alertThresholds = {
            responseTime: 5000, // 5 segundos
            errorRate: 0.1, // 10% de erro
            consecutiveFailures: 3
        };

        this.healthHistory = [];
        this.maxHistoryEntries = 1000;
    }

    async initialize() {
        try {
            this.logger.info('Inicializando Sistema Monitor...');

            // Criar diretórios necessários
            await this.ensureDirectories();

            // Carregar histórico anterior se existir
            await this.loadHistoryFromFile();

            // Verificação inicial
            await this.performInitialCheck();

            this.logger.info('Sistema Monitor inicializado com sucesso');
            this.emit('initialized');

        } catch (error) {
            this.logger.error('Erro na inicialização do Sistema Monitor', error);
            throw error;
        }
    }

    async ensureDirectories() {
        const dirs = [
            path.join(__dirname, '../data'),
            path.join(__dirname, '../data/monitoring'),
            path.join(__dirname, '../logs/monitoring')
        ];

        for (const dir of dirs) {
            await fs.ensureDir(dir);
        }
    }

    async performInitialCheck() {
        this.logger.info('Executando verificação inicial dos sistemas...');

        const checks = [
            this.checkCalimaHealth(),
            this.checkMakrosystemHealth(),
            this.checkClaudeHealth(),
            this.checkSystemResources()
        ];

        await Promise.allSettled(checks);
        await this.saveHealthSnapshot();
    }

    startRealTimeMonitoring() {
        if (this.monitoringActive) {
            this.logger.warn('Monitoramento já está ativo');
            return;
        }

        this.logger.info('Iniciando monitoramento em tempo real...');
        this.monitoringActive = true;

        // Monitoramento de sistemas contábeis (a cada 5 minutos)
        this.intervals.push(setInterval(async () => {
            try {
                await this.checkCalimaHealth();
                await this.checkMakrosystemHealth();
            } catch (error) {
                this.logger.error('Erro no monitoramento de sistemas contábeis', error);
            }
        }, 5 * 60 * 1000));

        // Monitoramento de Claude API (a cada 10 minutos)
        this.intervals.push(setInterval(async () => {
            try {
                await this.checkClaudeHealth();
            } catch (error) {
                this.logger.error('Erro no monitoramento Claude API', error);
            }
        }, 10 * 60 * 1000));

        // Monitoramento de recursos do sistema (a cada minuto)
        this.intervals.push(setInterval(async () => {
            try {
                await this.checkSystemResources();
            } catch (error) {
                this.logger.error('Erro no monitoramento de recursos', error);
            }
        }, 60 * 1000));

        // Salvamento periódico do histórico (a cada 30 minutos)
        this.intervals.push(setInterval(async () => {
            try {
                await this.saveHistoryToFile();
                await this.saveHealthSnapshot();
            } catch (error) {
                this.logger.error('Erro ao salvar histórico de monitoramento', error);
            }
        }, 30 * 60 * 1000));

        this.emit('monitoring-started');
        this.logger.info('Monitoramento em tempo real iniciado');
    }

    stopRealTimeMonitoring() {
        if (!this.monitoringActive) {
            this.logger.warn('Monitoramento não está ativo');
            return;
        }

        this.logger.info('Parando monitoramento em tempo real...');
        this.monitoringActive = false;

        // Limpar todos os intervals
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];

        this.emit('monitoring-stopped');
        this.logger.info('Monitoramento em tempo real parado');
    }

    async checkCalimaHealth() {
        const startTime = Date.now();

        try {
            const calimaConfig = this.config.calimaConfig;

            if (!calimaConfig.url) {
                this.updateMetrics('calima', 'unconfigured', null, 'URL não configurada');
                return;
            }

            // Fazer request HTTP simples para verificar disponibilidade
            const response = await axios.get(calimaConfig.url, {
                timeout: 10000,
                validateStatus: status => status < 500 // Aceitar até 4xx como "disponível"
            });

            const responseTime = Date.now() - startTime;

            this.updateMetrics('calima', 'online', responseTime);

            if (responseTime > this.alertThresholds.responseTime) {
                this.emit('alert', {
                    type: 'slow-response',
                    system: 'calima',
                    responseTime,
                    threshold: this.alertThresholds.responseTime
                });
            }

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateMetrics('calima', 'offline', responseTime, error.message);

            this.emit('alert', {
                type: 'system-offline',
                system: 'calima',
                error: error.message
            });

            this.logger.warn('Calima health check failed', { error: error.message, responseTime });
        }
    }

    async checkMakrosystemHealth() {
        const startTime = Date.now();

        try {
            const makroConfig = this.config.makrosystemConfig;

            if (!makroConfig.url) {
                this.updateMetrics('makrosystem', 'unconfigured', null, 'URL não configurada');
                return;
            }

            const response = await axios.get(makroConfig.url, {
                timeout: 10000,
                validateStatus: status => status < 500
            });

            const responseTime = Date.now() - startTime;
            this.updateMetrics('makrosystem', 'online', responseTime);

            if (responseTime > this.alertThresholds.responseTime) {
                this.emit('alert', {
                    type: 'slow-response',
                    system: 'makrosystem',
                    responseTime,
                    threshold: this.alertThresholds.responseTime
                });
            }

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateMetrics('makrosystem', 'offline', responseTime, error.message);

            this.emit('alert', {
                type: 'system-offline',
                system: 'makrosystem',
                error: error.message
            });

            this.logger.warn('Makrosystem health check failed', { error: error.message, responseTime });
        }
    }

    async checkClaudeHealth() {
        const startTime = Date.now();

        try {
            // Teste simples de conectividade Claude
            const ApiClient = require('./api-client');
            const apiClient = new ApiClient();

            await apiClient.testConnection();

            const responseTime = Date.now() - startTime;
            this.updateMetrics('claude', 'online', responseTime);

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateMetrics('claude', 'offline', responseTime, error.message);

            this.emit('alert', {
                type: 'claude-offline',
                system: 'claude',
                error: error.message
            });

            this.logger.warn('Claude health check failed', { error: error.message, responseTime });
        }
    }

    async checkSystemResources() {
        try {
            const os = require('os');

            // CPU Usage (aproximado)
            const cpus = os.cpus();
            let totalTick = 0;
            let idleTick = 0;

            for (let cpu of cpus) {
                for (let type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                idleTick += cpu.times.idle;
            }

            const cpuUsage = 100 - (100 * idleTick / totalTick);

            // Memory Usage
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

            // System Uptime
            const uptime = os.uptime();

            // Disk Space (apenas se disponível)
            let diskUsage = null;
            try {
                const stats = await fs.statSync(process.cwd());
                // Simplificado - em produção usaria uma lib específica
                diskUsage = { available: true };
            } catch (error) {
                diskUsage = { available: false, error: error.message };
            }

            this.metrics.system = {
                cpu: cpuUsage.toFixed(2),
                memory: memoryUsage.toFixed(2),
                disk: diskUsage,
                uptime: uptime,
                lastCheck: moment().toISOString()
            };

            // Alertas de recursos
            if (cpuUsage > 80) {
                this.emit('alert', {
                    type: 'high-cpu',
                    value: cpuUsage,
                    threshold: 80
                });
            }

            if (memoryUsage > 85) {
                this.emit('alert', {
                    type: 'high-memory',
                    value: memoryUsage,
                    threshold: 85
                });
            }

        } catch (error) {
            this.logger.error('Erro ao verificar recursos do sistema', error);
        }
    }

    updateMetrics(system, status, responseTime = null, error = null) {
        const now = moment().toISOString();

        this.metrics[system] = {
            status,
            lastCheck: now,
            responseTime,
            errors: error ? [...(this.metrics[system].errors || []).slice(-4), { timestamp: now, message: error }] : (this.metrics[system].errors || [])
        };

        // Adicionar ao histórico
        this.healthHistory.push({
            timestamp: now,
            system,
            status,
            responseTime,
            error
        });

        // Manter apenas as últimas entradas
        if (this.healthHistory.length > this.maxHistoryEntries) {
            this.healthHistory = this.healthHistory.slice(-this.maxHistoryEntries);
        }
    }

    async getSystemHealth() {
        return {
            timestamp: moment().toISOString(),
            overall: this.getOverallStatus(),
            systems: this.metrics,
            alerts: this.getActiveAlerts(),
            uptime: process.uptime()
        };
    }

    async getDetailedStatus() {
        const health = await this.getSystemHealth();

        return {
            ...health,
            history: this.getRecentHistory(24), // Últimas 24 horas
            statistics: this.calculateStatistics(),
            recommendations: this.generateRecommendations()
        };
    }

    getOverallStatus() {
        const systems = ['calima', 'makrosystem', 'claude'];
        const statuses = systems.map(s => this.metrics[s].status);

        if (statuses.every(s => s === 'online')) return 'healthy';
        if (statuses.some(s => s === 'offline')) return 'degraded';
        if (statuses.some(s => s === 'unconfigured')) return 'warning';

        return 'unknown';
    }

    getActiveAlerts() {
        const alerts = [];

        // Verificar sistemas offline
        for (const [system, metrics] of Object.entries(this.metrics)) {
            if (system === 'system') continue;

            if (metrics.status === 'offline') {
                alerts.push({
                    type: 'system-offline',
                    system,
                    severity: 'high',
                    message: `Sistema ${system} está offline`,
                    timestamp: metrics.lastCheck
                });
            }

            if (metrics.responseTime && metrics.responseTime > this.alertThresholds.responseTime) {
                alerts.push({
                    type: 'slow-response',
                    system,
                    severity: 'medium',
                    message: `Sistema ${system} com resposta lenta (${metrics.responseTime}ms)`,
                    timestamp: metrics.lastCheck
                });
            }
        }

        // Verificar recursos do sistema
        const systemMetrics = this.metrics.system;
        if (systemMetrics.cpu && parseFloat(systemMetrics.cpu) > 80) {
            alerts.push({
                type: 'high-cpu',
                severity: 'medium',
                message: `Uso de CPU alto: ${systemMetrics.cpu}%`,
                timestamp: systemMetrics.lastCheck
            });
        }

        if (systemMetrics.memory && parseFloat(systemMetrics.memory) > 85) {
            alerts.push({
                type: 'high-memory',
                severity: 'medium',
                message: `Uso de memória alto: ${systemMetrics.memory}%`,
                timestamp: systemMetrics.lastCheck
            });
        }

        return alerts;
    }

    getRecentHistory(hours = 24) {
        const cutoff = moment().subtract(hours, 'hours');

        return this.healthHistory.filter(entry =>
            moment(entry.timestamp).isAfter(cutoff)
        );
    }

    calculateStatistics() {
        const recent = this.getRecentHistory(24);

        const stats = {
            total: recent.length,
            bySystem: {},
            byStatus: {},
            averageResponseTimes: {}
        };

        recent.forEach(entry => {
            // Por sistema
            if (!stats.bySystem[entry.system]) {
                stats.bySystem[entry.system] = 0;
            }
            stats.bySystem[entry.system]++;

            // Por status
            if (!stats.byStatus[entry.status]) {
                stats.byStatus[entry.status] = 0;
            }
            stats.byStatus[entry.status]++;

            // Tempos de resposta
            if (entry.responseTime) {
                if (!stats.averageResponseTimes[entry.system]) {
                    stats.averageResponseTimes[entry.system] = [];
                }
                stats.averageResponseTimes[entry.system].push(entry.responseTime);
            }
        });

        // Calcular médias
        for (const [system, times] of Object.entries(stats.averageResponseTimes)) {
            stats.averageResponseTimes[system] = {
                average: times.reduce((a, b) => a + b, 0) / times.length,
                min: Math.min(...times),
                max: Math.max(...times),
                count: times.length
            };
        }

        return stats;
    }

    generateRecommendations() {
        const recommendations = [];
        const alerts = this.getActiveAlerts();

        // Recomendações baseadas em alertas ativos
        if (alerts.some(a => a.type === 'system-offline')) {
            recommendations.push({
                type: 'critical',
                message: 'Verificar conectividade com sistemas contábeis',
                action: 'Verifique URLs, credenciais e status dos serviços'
            });
        }

        if (alerts.some(a => a.type === 'slow-response')) {
            recommendations.push({
                type: 'performance',
                message: 'Otimizar performance dos sistemas',
                action: 'Considere aumentar timeouts ou verificar latência de rede'
            });
        }

        if (alerts.some(a => a.type === 'high-cpu' || a.type === 'high-memory')) {
            recommendations.push({
                type: 'resources',
                message: 'Monitorar recursos do sistema',
                action: 'Considere otimizar processos ou expandir recursos'
            });
        }

        // Recomendações preventivas
        const stats = this.calculateStatistics();
        const offlineRate = (stats.byStatus.offline || 0) / stats.total;

        if (offlineRate > 0.1) {
            recommendations.push({
                type: 'reliability',
                message: 'Taxa de falhas elevada detectada',
                action: 'Investigue causas recorrentes de indisponibilidade'
            });
        }

        return recommendations;
    }

    async saveHealthSnapshot() {
        try {
            const snapshot = {
                timestamp: moment().toISOString(),
                health: await this.getSystemHealth(),
                statistics: this.calculateStatistics()
            };

            const snapshotPath = path.join(__dirname, '../data/monitoring', `snapshot-${moment().format('YYYY-MM-DD')}.json`);
            await fs.writeJson(snapshotPath, snapshot, { spaces: 2 });

        } catch (error) {
            this.logger.error('Erro ao salvar snapshot de saúde', error);
        }
    }

    async saveHistoryToFile() {
        try {
            const historyPath = path.join(__dirname, '../data/monitoring/health-history.json');
            await fs.writeJson(historyPath, {
                lastUpdated: moment().toISOString(),
                entries: this.healthHistory
            }, { spaces: 2 });

        } catch (error) {
            this.logger.error('Erro ao salvar histórico de saúde', error);
        }
    }

    async loadHistoryFromFile() {
        try {
            const historyPath = path.join(__dirname, '../data/monitoring/health-history.json');

            if (await fs.pathExists(historyPath)) {
                const data = await fs.readJson(historyPath);
                this.healthHistory = data.entries || [];

                this.logger.info(`Histórico de saúde carregado: ${this.healthHistory.length} entradas`);
            }

        } catch (error) {
            this.logger.warn('Não foi possível carregar histórico anterior', { error: error.message });
            this.healthHistory = [];
        }
    }

    async cleanup() {
        this.stopRealTimeMonitoring();
        await this.saveHistoryToFile();
        await this.saveHealthSnapshot();

        this.logger.info('SystemMonitor cleanup concluído');
    }
}

module.exports = SystemMonitor;