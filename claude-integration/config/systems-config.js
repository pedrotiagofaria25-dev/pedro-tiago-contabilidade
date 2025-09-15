/**
 * Pedro Tiago Contabilidade - Configuração dos Sistemas Contábeis
 * Configurações centralizadas para Calima Web e Makrosystem Web
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const dotenv = require('dotenv');
dotenv.config();

class SystemsConfig {
    constructor() {
        this.validateConfig();
    }

    validateConfig() {
        const requiredCalima = ['CALIMA_URL', 'CALIMA_USERNAME', 'CALIMA_PASSWORD'];
        const requiredMakro = ['MAKRO_URL', 'MAKRO_USERNAME', 'MAKRO_PASSWORD'];

        const missingCalima = requiredCalima.filter(key => !process.env[key]);
        const missingMakro = requiredMakro.filter(key => !process.env[key]);

        if (missingCalima.length > 0) {
            console.warn(`⚠️ Configurações do Calima não encontradas: ${missingCalima.join(', ')}`);
        }

        if (missingMakro.length > 0) {
            console.warn(`⚠️ Configurações do Makrosystem não encontradas: ${missingMakro.join(', ')}`);
        }
    }

    get calimaConfig() {
        return {
            name: 'Calima Web',
            url: process.env.CALIMA_URL,
            credentials: {
                username: process.env.CALIMA_USERNAME,
                password: process.env.CALIMA_PASSWORD,
                apiKey: process.env.CALIMA_API_KEY
            },
            settings: {
                timeout: parseInt(process.env.CALIMA_TIMEOUT) || 30000,
                retryAttempts: 3,
                headless: process.env.NODE_ENV === 'production',
                waitForNavigation: 'networkidle0',
                defaultViewport: { width: 1920, height: 1080 }
            },
            selectors: {
                login: {
                    username: '#username',
                    password: '#password',
                    submitButton: '#login-button'
                },
                navigation: {
                    clientsMenu: '#menu-clientes',
                    documentsTab: '#tab-documentos',
                    reportsMenu: '#menu-relatorios'
                },
                clients: {
                    searchField: '#search-cliente',
                    clientList: '.clients-list',
                    clientItem: '.client-item'
                },
                documents: {
                    pendingList: '.documents-pending',
                    documentItem: '.document-item',
                    editButton: '.edit-button',
                    saveButton: '#save-document'
                }
            },
            endpoints: {
                api: process.env.CALIMA_API_URL || 'https://api.calima.com.br/v1',
                clients: '/clients',
                documents: '/documents',
                reports: '/reports'
            }
        };
    }

    get makrosystemConfig() {
        return {
            name: 'Makrosystem Web',
            url: process.env.MAKRO_URL,
            credentials: {
                username: process.env.MAKRO_USERNAME,
                password: process.env.MAKRO_PASSWORD,
                apiKey: process.env.MAKRO_API_KEY
            },
            settings: {
                timeout: parseInt(process.env.MAKRO_TIMEOUT) || 30000,
                retryAttempts: 3,
                headless: process.env.NODE_ENV === 'production',
                waitForNavigation: 'networkidle0',
                defaultViewport: { width: 1920, height: 1080 }
            },
            selectors: {
                login: {
                    username: 'input[name="usuario"]',
                    password: 'input[name="senha"]',
                    submitButton: 'button[type="submit"]'
                },
                navigation: {
                    clientsMenu: '#menu-clientes',
                    fiscalMenu: '#menu-fiscal',
                    reportsMenu: '#menu-relatorios'
                },
                clients: {
                    searchField: '#search-cliente',
                    clientList: '.clientes-list',
                    clientItem: '.cliente-item'
                },
                documents: {
                    fiscalTab: '#tab-documentos-fiscais',
                    documentsList: '.documentos-fiscais-list',
                    documentItem: '.documento-fiscal-item'
                },
                banking: {
                    bankingTab: '#tab-movimentacao-bancaria',
                    movementsList: '.movimentacao-bancaria-list',
                    movementItem: '.movimentacao-item'
                }
            },
            endpoints: {
                api: process.env.MAKRO_API_URL || 'https://api.makrosystem.com.br/v1',
                clients: '/clientes',
                fiscal: '/fiscal',
                banking: '/movimentacao'
            }
        };
    }

    get syncConfig() {
        return {
            enabled: process.env.SYNC_ENABLED !== 'false',
            interval: parseInt(process.env.SYNC_INTERVAL) || 240, // minutos
            batchSize: parseInt(process.env.SYNC_BATCH_SIZE) || 100,
            timeout: parseInt(process.env.SYNC_TIMEOUT) || 300000,
            conflictResolution: process.env.SYNC_CONFLICT_RESOLUTION || 'claude',
            retryAttempts: 3,
            backupBeforeSync: true
        };
    }

    get mappings() {
        return {
            // Mapeamento de campos entre sistemas
            clientFields: {
                calima: {
                    id: 'clientId',
                    name: 'clientName',
                    cnpj: 'clientCnpj',
                    status: 'clientStatus'
                },
                makrosystem: {
                    id: 'clienteId',
                    name: 'clienteNome',
                    cnpj: 'clienteCnpj',
                    status: 'clienteStatus'
                }
            },
            documentFields: {
                calima: {
                    id: 'documentId',
                    type: 'docType',
                    number: 'docNumber',
                    date: 'docDate',
                    value: 'docValue'
                },
                makrosystem: {
                    id: 'documentoId',
                    type: 'docTipo',
                    number: 'docNumero',
                    date: 'docData',
                    value: 'docValor'
                }
            },
            // Mapeamento de plano de contas
            accountsPlan: {
                '1.1.1.01.001': 'Caixa Geral',
                '1.1.2.01.001': 'Banco Conta Movimento',
                '2.1.1.01.001': 'Fornecedores Nacionais',
                '3.1.1.01.001': 'Capital Social',
                '4.1.1.01.001': 'Receita de Vendas'
            },
            // Mapeamento de centros de custo
            costCenters: {
                '001': 'Administração',
                '002': 'Comercial',
                '003': 'Financeiro',
                '004': 'Operacional'
            }
        };
    }

    get monitoringConfig() {
        return {
            enabled: process.env.MONITOR_ENABLED !== 'false',
            interval: parseInt(process.env.MONITOR_INTERVAL) || 300000, // 5 minutos
            timeout: parseInt(process.env.MONITOR_TIMEOUT) || 10000,
            retryAttempts: parseInt(process.env.MONITOR_RETRY_ATTEMPTS) || 3,
            healthCheck: {
                interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000, // 1 minuto
                endpoints: [
                    { name: 'Calima', url: process.env.CALIMA_URL },
                    { name: 'Makrosystem', url: process.env.MAKRO_URL }
                ]
            },
            alerts: {
                email: process.env.ALERT_EMAIL_ENABLED === 'true',
                whatsapp: process.env.ALERT_WHATSAPP_ENABLED === 'true',
                telegram: process.env.ALERT_TELEGRAM_ENABLED === 'true'
            }
        };
    }

    get backupConfig() {
        return {
            enabled: true,
            path: process.env.BACKUP_PATH || 'C:/Organizados/Backups/claude-integration',
            schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // 2h da manhã
            retention: {
                days: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
                maxFiles: 50
            },
            compression: process.env.BACKUP_COMPRESSION || 'gzip',
            cloud: {
                enabled: process.env.BACKUP_CLOUD_PROVIDER === 'aws',
                provider: process.env.BACKUP_CLOUD_PROVIDER,
                bucket: process.env.BACKUP_CLOUD_BUCKET,
                region: process.env.BACKUP_CLOUD_REGION
            }
        };
    }

    get securityConfig() {
        return {
            encryption: {
                enabled: true,
                algorithm: 'aes-256-gcm',
                key: process.env.ENCRYPTION_KEY
            },
            jwt: {
                secret: process.env.JWT_SECRET,
                expiresIn: process.env.JWT_EXPIRES_IN || '24h'
            },
            rateLimiting: {
                windowMs: 15 * 60 * 1000, // 15 minutos
                maxRequests: parseInt(process.env.API_RATE_LIMIT) || 100
            },
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                credentials: true
            }
        };
    }

    // Método para obter configuração específica do sistema
    getSystemConfig(systemName) {
        switch (systemName.toLowerCase()) {
            case 'calima':
                return this.calimaConfig;
            case 'makrosystem':
            case 'makro':
                return this.makrosystemConfig;
            default:
                throw new Error(`Sistema não reconhecido: ${systemName}`);
        }
    }

    // Método para validar conectividade com os sistemas
    async validateConnectivity() {
        const results = {
            calima: false,
            makrosystem: false,
            errors: []
        };

        try {
            // Teste básico de conectividade (ping)
            const axios = require('axios');

            // Testar Calima
            try {
                await axios.get(this.calimaConfig.url, { timeout: 5000 });
                results.calima = true;
            } catch (error) {
                results.errors.push(`Calima: ${error.message}`);
            }

            // Testar Makrosystem
            try {
                await axios.get(this.makrosystemConfig.url, { timeout: 5000 });
                results.makrosystem = true;
            } catch (error) {
                results.errors.push(`Makrosystem: ${error.message}`);
            }

        } catch (error) {
            results.errors.push(`Erro geral de conectividade: ${error.message}`);
        }

        return results;
    }
}

module.exports = SystemsConfig;