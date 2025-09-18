/**
 * Pedro Tiago Contabilidade - Monitor de Sistemas em Tempo Real
 * Script executável para monitoramento contínuo dos sistemas contábeis
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const SystemMonitor = require('../utils/system-monitor');
const Logger = require('../config/logger-config');

class RealTimeSystemMonitor {
    constructor() {
        this.logger = new Logger('RealTimeMonitor');
        this.monitor = new SystemMonitor();
        this.isRunning = false;

        // Configurar eventos do monitor
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Alertas em tempo real
        this.monitor.on('alert', (alert) => {
            this.handleAlert(alert);
        });

        // Status de inicialização
        this.monitor.on('initialized', () => {
            this.logger.info('✅ Monitor de sistemas inicializado');
            this.displayDashboard();
        });

        // Status de monitoramento
        this.monitor.on('monitoring-started', () => {
            this.logger.info('🔄 Monitoramento em tempo real iniciado');
        });

        this.monitor.on('monitoring-stopped', () => {
            this.logger.info('⏹️ Monitoramento em tempo real parado');
        });

        // Capturar sinais de sistema para limpeza
        process.on('SIGINT', () => this.gracefulShutdown());
        process.on('SIGTERM', () => this.gracefulShutdown());
    }

    handleAlert(alert) {
        const emoji = this.getAlertEmoji(alert.type);
        const severity = alert.severity || 'medium';

        let logMethod = 'info';
        if (severity === 'high') logMethod = 'error';
        else if (severity === 'medium') logMethod = 'warn';

        this.logger[logMethod](`${emoji} ALERTA ${severity.toUpperCase()}: ${alert.type}`, alert);

        // Exibir no console em tempo real
        console.log(`\n🚨 ${new Date().toLocaleString('pt-BR')} - ALERTA ${severity.toUpperCase()}`);
        console.log(`   Tipo: ${alert.type}`);
        console.log(`   Sistema: ${alert.system || 'Geral'}`);
        console.log(`   Mensagem: ${alert.message || 'Sem detalhes'}`);

        // Enviar notificações se configurado
        this.sendNotification(alert);
    }

    getAlertEmoji(alertType) {
        const emojis = {
            'system-offline': '🔴',
            'slow-response': '🟡',
            'high-cpu': '💻',
            'high-memory': '🧠',
            'claude-offline': '🤖',
            'network-error': '🌐',
            'backup-failed': '💾'
        };

        return emojis[alertType] || '⚠️';
    }

    async sendNotification(alert) {
        try {
            // Implementar notificações (email, WhatsApp, etc.)
            // Por agora apenas log
            this.logger.info('Notificação de alerta enviada', {
                type: alert.type,
                system: alert.system,
                severity: alert.severity
            });
        } catch (error) {
            this.logger.error('Erro ao enviar notificação', error);
        }
    }

    async start() {
        try {
            console.log('\n🚀 Iniciando Monitor de Sistemas Pedro Tiago Contabilidade...\n');

            await this.monitor.initialize();
            this.monitor.startRealTimeMonitoring();

            this.isRunning = true;

            // Dashboard atualizado periodicamente
            setInterval(() => {
                if (this.isRunning) {
                    this.displayDashboard();
                }
            }, 60000); // A cada minuto

            console.log('\n✅ Monitor iniciado com sucesso!');
            console.log('📊 Pressione Ctrl+C para parar o monitoramento\n');

        } catch (error) {
            console.error('❌ Erro ao iniciar monitor:', error.message);
            process.exit(1);
        }
    }

    async displayDashboard() {
        try {
            const health = await this.monitor.getSystemHealth();
            const alerts = health.alerts || [];

            // Limpar tela (opcional)
            if (process.env.CLEAR_DASHBOARD === 'true') {
                console.clear();
            }

            console.log('\n' + '='.repeat(80));
            console.log('🏢 PEDRO TIAGO CONTABILIDADE - DASHBOARD DE SISTEMAS');
            console.log(`📅 ${new Date().toLocaleString('pt-BR')}`);
            console.log('='.repeat(80));

            // Status geral
            const statusEmoji = this.getStatusEmoji(health.overall);
            console.log(`\n📊 STATUS GERAL: ${statusEmoji} ${health.overall.toUpperCase()}`);

            // Status dos sistemas
            console.log('\n🖥️  SISTEMAS CONTÁBEIS:');
            console.log('┌─────────────┬──────────┬─────────────┬──────────────┐');
            console.log('│ Sistema     │ Status   │ Resposta    │ Última Verif.│');
            console.log('├─────────────┼──────────┼─────────────┼──────────────┤');

            const systems = ['calima', 'makrosystem', 'claude'];
            systems.forEach(system => {
                const metrics = health.systems[system];
                const status = metrics.status || 'unknown';
                const responseTime = metrics.responseTime ? `${metrics.responseTime}ms` : 'N/A';
                const lastCheck = metrics.lastCheck ?
                    new Date(metrics.lastCheck).toLocaleTimeString('pt-BR') : 'Nunca';

                const statusIcon = status === 'online' ? '🟢' : status === 'offline' ? '🔴' : '🟡';

                console.log(`│ ${system.padEnd(11)} │ ${statusIcon} ${status.padEnd(6)} │ ${responseTime.padEnd(11)} │ ${lastCheck.padEnd(12)} │`);
            });

            console.log('└─────────────┴──────────┴─────────────┴──────────────┘');

            // Recursos do sistema
            if (health.systems.system) {
                const sys = health.systems.system;
                console.log('\n💻 RECURSOS DO SISTEMA:');
                console.log(`   CPU: ${sys.cpu || 'N/A'}% | Memória: ${sys.memory || 'N/A'}% | Uptime: ${Math.floor(health.uptime / 3600)}h`);
            }

            // Alertas ativos
            if (alerts.length > 0) {
                console.log('\n🚨 ALERTAS ATIVOS:');
                alerts.slice(0, 5).forEach((alert, index) => {
                    const emoji = this.getAlertEmoji(alert.type);
                    const time = new Date(alert.timestamp).toLocaleTimeString('pt-BR');
                    console.log(`   ${emoji} [${time}] ${alert.message}`);
                });

                if (alerts.length > 5) {
                    console.log(`   ... e mais ${alerts.length - 5} alertas`);
                }
            } else {
                console.log('\n✅ Nenhum alerta ativo');
            }

            // Estatísticas rápidas
            const stats = this.monitor.calculateStatistics();
            if (stats.total > 0) {
                console.log('\n📈 ESTATÍSTICAS (24h):');
                console.log(`   Total de verificações: ${stats.total}`);
                console.log(`   Erros: ${stats.byStatus.offline || 0} | Sucessos: ${stats.byStatus.online || 0}`);

                if (Object.keys(stats.averageResponseTimes).length > 0) {
                    console.log('   Tempo médio de resposta:');
                    Object.entries(stats.averageResponseTimes).forEach(([system, times]) => {
                        console.log(`     ${system}: ${Math.round(times.average)}ms (min: ${times.min}ms, max: ${times.max}ms)`);
                    });
                }
            }

            console.log('\n' + '='.repeat(80));
            console.log(`💡 Próxima atualização em 60 segundos...`);

        } catch (error) {
            console.error('❌ Erro ao exibir dashboard:', error.message);
        }
    }

    getStatusEmoji(status) {
        const emojis = {
            'healthy': '🟢',
            'degraded': '🟡',
            'warning': '🟠',
            'critical': '🔴',
            'unknown': '⚪'
        };

        return emojis[status] || '⚪';
    }

    async generateReport() {
        try {
            console.log('\n📊 Gerando relatório de monitoramento...');

            const detailedStatus = await this.monitor.getDetailedStatus();
            const logReport = await this.logger.generateLogReport('last-week');

            const report = {
                ...detailedStatus,
                logs: logReport,
                generatedAt: new Date().toISOString(),
                company: process.env.COMPANY_NAME,
                crc: process.env.CRC_NUMBER
            };

            // Salvar relatório
            const fs = require('fs-extra');
            const path = require('path');
            const moment = require('moment');

            const reportsDir = path.join(__dirname, '../reports/monitoring');
            await fs.ensureDir(reportsDir);

            const reportFile = path.join(reportsDir, `monitoring-report-${moment().format('YYYY-MM-DD-HH-mm')}.json`);
            await fs.writeJson(reportFile, report, { spaces: 2 });

            console.log(`✅ Relatório salvo: ${reportFile}`);
            return reportFile;

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
            throw error;
        }
    }

    async gracefulShutdown() {
        console.log('\n\n🛑 Iniciando desligamento do monitor...');

        this.isRunning = false;

        try {
            // Parar monitoramento
            this.monitor.stopRealTimeMonitoring();

            // Salvar dados finais
            await this.monitor.cleanup();

            console.log('✅ Monitor finalizado com segurança');
            process.exit(0);

        } catch (error) {
            console.error('❌ Erro durante desligamento:', error.message);
            process.exit(1);
        }
    }
}

// Execução direta do script
if (require.main === module) {
    const monitor = new RealTimeSystemMonitor();

    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'start':
            monitor.start().catch(error => {
                console.error('❌ Erro fatal:', error.message);
                process.exit(1);
            });
            break;

        case 'status':
            (async () => {
                try {
                    await monitor.monitor.initialize();
                    await monitor.displayDashboard();
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Erro:', error.message);
                    process.exit(1);
                }
            })();
            break;

        case 'report':
            (async () => {
                try {
                    await monitor.monitor.initialize();
                    const reportFile = await monitor.generateReport();
                    console.log(`📊 Relatório gerado: ${reportFile}`);
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Erro:', error.message);
                    process.exit(1);
                }
            })();
            break;

        default:
            console.log(`
🔧 Pedro Tiago Contabilidade - Monitor de Sistemas

Comandos disponíveis:
  node system-monitor.js start    # Iniciar monitoramento em tempo real
  node system-monitor.js status   # Exibir status atual dos sistemas
  node system-monitor.js report   # Gerar relatório detalhado

Exemplos:
  node system-monitor.js start
  node system-monitor.js status
  node system-monitor.js report

Variáveis de ambiente úteis:
  CLEAR_DASHBOARD=true  # Limpar tela a cada atualização do dashboard

Contato: pedrotiago@pedrotiagocontabilidade.com.br
WhatsApp: 62999948445
            `);
            process.exit(0);
    }
}

module.exports = RealTimeSystemMonitor;