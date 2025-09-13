/**
 * Pedro Tiago Contabilidade - Configuração de Logging
 * Sistema avançado de logs para auditoria e monitoramento
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

class LoggerConfig {
    constructor(moduleName = 'System') {
        this.moduleName = moduleName;
        this.logsDir = path.join(__dirname, '../logs');
        this.ensureLogsDirectory();
        this.logger = this.createLogger();
    }

    ensureLogsDirectory() {
        fs.ensureDirSync(this.logsDir);
        fs.ensureDirSync(path.join(this.logsDir, 'archive'));
        fs.ensureDirSync(path.join(this.logsDir, 'errors'));
        fs.ensureDirSync(path.join(this.logsDir, 'audit'));
    }

    createLogger() {
        const logFormat = winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return JSON.stringify({
                    timestamp,
                    level: level.toUpperCase(),
                    module: this.moduleName,
                    message,
                    company: process.env.COMPANY_NAME,
                    crc: process.env.CRC_NUMBER,
                    ...meta
                });
            })
        );

        const logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            defaultMeta: {
                service: 'pedro-tiago-claude-integration',
                module: this.moduleName
            },
            transports: [
                // Log geral (todos os níveis)
                new winston.transports.File({
                    filename: path.join(this.logsDir, 'application.log'),
                    maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760, // 10MB
                    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
                    tailable: true
                }),

                // Log de erros
                new winston.transports.File({
                    filename: path.join(this.logsDir, 'errors', 'errors.log'),
                    level: 'error',
                    maxsize: 10485760,
                    maxFiles: 10,
                    tailable: true
                }),

                // Log de auditoria (info e acima)
                new winston.transports.File({
                    filename: path.join(this.logsDir, 'audit', 'audit.log'),
                    level: 'info',
                    maxsize: 20971520, // 20MB
                    maxFiles: 15,
                    tailable: true,
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.printf(({ timestamp, level, message, ...meta }) => {
                            return JSON.stringify({
                                timestamp,
                                level: level.toUpperCase(),
                                module: this.moduleName,
                                action: meta.action || 'general',
                                user: meta.user || 'system',
                                client: meta.client || null,
                                message,
                                details: meta.details || null,
                                ip: meta.ip || null
                            });
                        })
                    )
                })
            ]
        });

        // Adicionar console em desenvolvimento
        if (process.env.NODE_ENV !== 'production') {
            logger.add(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp({
                        format: 'HH:mm:ss'
                    }),
                    winston.format.printf(({ timestamp, level, message, module }) => {
                        return `${timestamp} [${module}] ${level}: ${message}`;
                    })
                )
            }));
        }

        return logger;
    }

    // Métodos de logging específicos para contabilidade
    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    error(message, error = null, meta = {}) {
        const errorMeta = {
            ...meta,
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null
        };
        this.logger.error(message, errorMeta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    // Logs específicos para auditoria contábil
    auditLog(action, details = {}) {
        this.logger.info(`AUDIT: ${action}`, {
            action,
            details,
            timestamp: moment().toISOString(),
            source: 'audit'
        });
    }

    // Log de acesso aos sistemas
    systemAccess(system, action, user = 'system', details = {}) {
        this.auditLog(`${system.toUpperCase()}_ACCESS`, {
            system,
            action,
            user,
            ...details
        });
    }

    // Log de processamento de documentos
    documentProcessing(documentId, action, result = 'success', details = {}) {
        this.auditLog('DOCUMENT_PROCESSING', {
            documentId,
            action,
            result,
            ...details
        });
    }

    // Log de sincronização entre sistemas
    syncOperation(systems, operation, result = 'success', details = {}) {
        this.auditLog('SYNC_OPERATION', {
            systems,
            operation,
            result,
            ...details
        });
    }

    // Log de operações do Claude AI
    claudeOperation(operation, tokens = 0, model = '', details = {}) {
        this.auditLog('CLAUDE_OPERATION', {
            operation,
            tokens,
            model,
            cost: this.calculateClaudeCost(tokens, model),
            ...details
        });
    }

    // Log de backup
    backupOperation(type, status, details = {}) {
        this.auditLog('BACKUP_OPERATION', {
            type,
            status,
            ...details
        });
    }

    // Log de relatórios
    reportGeneration(reportType, client = null, format = 'json', details = {}) {
        this.auditLog('REPORT_GENERATION', {
            reportType,
            client,
            format,
            ...details
        });
    }

    // Log de alertas de compliance
    complianceAlert(alertType, severity = 'medium', details = {}) {
        const logLevel = severity === 'high' ? 'error' : 'warn';
        this.logger[logLevel](`COMPLIANCE ALERT: ${alertType}`, {
            alertType,
            severity,
            compliance: true,
            ...details
        });
    }

    // Calcular custo estimado do Claude (valores aproximados)
    calculateClaudeCost(tokens, model) {
        const rates = {
            'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 }, // por 1K tokens
            'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
            'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
        };

        const rate = rates[model] || rates['claude-3-sonnet-20240229'];
        return {
            inputCost: (tokens / 1000) * rate.input,
            outputCost: (tokens / 1000) * rate.output,
            currency: 'USD'
        };
    }

    // Método para buscar logs
    async searchLogs(criteria) {
        const fs = require('fs');
        const readline = require('readline');

        const logFiles = [
            path.join(this.logsDir, 'application.log'),
            path.join(this.logsDir, 'audit', 'audit.log')
        ];

        const results = [];

        for (const file of logFiles) {
            if (fs.existsSync(file)) {
                const fileStream = fs.createReadStream(file);
                const rl = readline.createInterface({
                    input: fileStream,
                    crlfDelay: Infinity
                });

                for await (const line of rl) {
                    try {
                        const logEntry = JSON.parse(line);

                        // Aplicar critérios de busca
                        let match = true;

                        if (criteria.level && logEntry.level !== criteria.level.toUpperCase()) {
                            match = false;
                        }

                        if (criteria.module && logEntry.module !== criteria.module) {
                            match = false;
                        }

                        if (criteria.startDate && moment(logEntry.timestamp).isBefore(criteria.startDate)) {
                            match = false;
                        }

                        if (criteria.endDate && moment(logEntry.timestamp).isAfter(criteria.endDate)) {
                            match = false;
                        }

                        if (criteria.message && !logEntry.message.includes(criteria.message)) {
                            match = false;
                        }

                        if (match) {
                            results.push(logEntry);
                        }
                    } catch (error) {
                        // Ignorar linhas mal formatadas
                    }
                }
            }
        }

        return results.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));
    }

    // Método para gerar relatório de logs
    async generateLogReport(period = 'last-week') {
        const endDate = moment();
        let startDate;

        switch (period) {
            case 'today':
                startDate = moment().startOf('day');
                break;
            case 'yesterday':
                startDate = moment().subtract(1, 'day').startOf('day');
                endDate.subtract(1, 'day').endOf('day');
                break;
            case 'last-week':
                startDate = moment().subtract(1, 'week').startOf('day');
                break;
            case 'last-month':
                startDate = moment().subtract(1, 'month').startOf('day');
                break;
            default:
                startDate = moment().subtract(1, 'week').startOf('day');
        }

        const logs = await this.searchLogs({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        const report = {
            period: {
                start: startDate.format('DD/MM/YYYY HH:mm:ss'),
                end: endDate.format('DD/MM/YYYY HH:mm:ss')
            },
            summary: {
                total: logs.length,
                byLevel: {},
                byModule: {},
                errors: 0,
                warnings: 0
            },
            details: logs.slice(0, 100), // Primeiros 100 logs
            generatedAt: moment().toISOString()
        };

        // Calcular estatísticas
        logs.forEach(log => {
            report.summary.byLevel[log.level] = (report.summary.byLevel[log.level] || 0) + 1;
            report.summary.byModule[log.module] = (report.summary.byModule[log.module] || 0) + 1;

            if (log.level === 'ERROR') report.summary.errors++;
            if (log.level === 'WARN') report.summary.warnings++;
        });

        return report;
    }

    // Limpeza automática de logs antigos
    async cleanupOldLogs() {
        const retentionDays = 30;
        const cutoffDate = moment().subtract(retentionDays, 'days');

        const archiveDir = path.join(this.logsDir, 'archive');

        // Mover logs antigos para arquivo
        const logFiles = await fs.readdir(this.logsDir);

        for (const file of logFiles) {
            const filePath = path.join(this.logsDir, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile() && moment(stats.mtime).isBefore(cutoffDate)) {
                const archivePath = path.join(archiveDir, `${moment().format('YYYY-MM-DD')}-${file}`);
                await fs.move(filePath, archivePath);
                this.info(`Log file archived: ${file}`);
            }
        }
    }
}

module.exports = LoggerConfig;