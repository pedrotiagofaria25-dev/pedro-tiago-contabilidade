/**
 * Pedro Tiago Contabilidade - Integração Sistema Calima Web
 * Automação completa para processamento contábil no sistema Calima
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const { ClaudeCode } = require('@anthropic-ai/claude-code');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class CalimaIntegration {
    constructor() {
        this.claude = new ClaudeCode({
            apiKey: process.env.CLAUDE_API_KEY,
            model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229'
        });

        this.config = {
            url: process.env.CALIMA_URL,
            username: process.env.CALIMA_USERNAME,
            password: process.env.CALIMA_PASSWORD,
            timeout: parseInt(process.env.CALIMA_TIMEOUT) || 30000
        };

        this.browser = null;
        this.page = null;
    }

    async initialize() {
        try {
            console.log('🚀 Inicializando integração Calima Web...');

            // Configurar Puppeteer
            this.browser = await puppeteer.launch({
                headless: process.env.NODE_ENV === 'production',
                defaultViewport: { width: 1920, height: 1080 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            this.page = await this.browser.newPage();

            // Configurar timeouts
            this.page.setDefaultTimeout(this.config.timeout);

            console.log('✅ Integração Calima Web inicializada com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização Calima:', error);
            throw error;
        }
    }

    async login() {
        try {
            console.log('🔐 Fazendo login no Calima Web...');

            await this.page.goto(this.config.url);

            // Aguardar elementos de login
            await this.page.waitForSelector('#username');
            await this.page.waitForSelector('#password');

            // Preencher credenciais
            await this.page.type('#username', this.config.username);
            await this.page.type('#password', this.config.password);

            // Submeter formulário
            await this.page.click('#login-button');

            // Aguardar redirecionamento
            await this.page.waitForNavigation();

            console.log('✅ Login realizado com sucesso');
        } catch (error) {
            console.error('❌ Erro no login Calima:', error);
            throw error;
        }
    }

    async processClient(clientName) {
        try {
            console.log(`📊 Processando cliente: ${clientName}`);

            await this.initialize();
            await this.login();

            // Navegar para o cliente
            await this.navigateToClient(clientName);

            // Processar documentos pendentes
            const documents = await this.getDocumentsPending();

            const results = [];
            for (const doc of documents) {
                const processed = await this.processDocumentWithClaude(doc);
                results.push(processed);
            }

            // Gerar relatório do processamento
            const report = await this.generateProcessingReport(clientName, results);

            await this.cleanup();

            return {
                client: clientName,
                documentsProcessed: results.length,
                report: report,
                timestamp: moment().toISOString()
            };

        } catch (error) {
            console.error(`❌ Erro ao processar cliente ${clientName}:`, error);
            await this.cleanup();
            throw error;
        }
    }

    async navigateToClient(clientName) {
        try {
            // Buscar cliente
            await this.page.waitForSelector('#client-search');
            await this.page.type('#client-search', clientName);
            await this.page.keyboard.press('Enter');

            // Aguardar resultados
            await this.page.waitForSelector('.client-list');

            // Selecionar primeiro resultado
            await this.page.click('.client-list .client-item:first-child');

            // Aguardar carregar dados do cliente
            await this.page.waitForSelector('.client-dashboard');

            console.log(`✅ Navegado para cliente: ${clientName}`);
        } catch (error) {
            console.error(`❌ Erro ao navegar para cliente ${clientName}:`, error);
            throw error;
        }
    }

    async getDocumentsPending() {
        try {
            // Navegar para documentos pendentes
            await this.page.click('#documents-tab');
            await this.page.waitForSelector('.documents-pending');

            // Extrair lista de documentos
            const documents = await this.page.evaluate(() => {
                const docElements = document.querySelectorAll('.document-item');
                return Array.from(docElements).map(el => ({
                    id: el.dataset.documentId,
                    type: el.querySelector('.doc-type').textContent.trim(),
                    date: el.querySelector('.doc-date').textContent.trim(),
                    value: el.querySelector('.doc-value').textContent.trim(),
                    description: el.querySelector('.doc-description').textContent.trim(),
                    status: el.querySelector('.doc-status').textContent.trim()
                }));
            });

            console.log(`📋 Encontrados ${documents.length} documentos pendentes`);
            return documents;

        } catch (error) {
            console.error('❌ Erro ao obter documentos pendentes:', error);
            throw error;
        }
    }

    async processDocumentWithClaude(document) {
        try {
            console.log(`🤖 Processando documento ${document.id} com Claude...`);

            // Preparar contexto para Claude
            const context = {
                company: process.env.COMPANY_NAME,
                crc: process.env.CRC_NUMBER,
                document: document,
                system: 'Calima Web'
            };

            // Prompt especializado para análise contábil
            const prompt = `
Você é um assistente contábil especializado para ${context.company} (CRC ${context.crc}).

Analise o seguinte documento contábil do sistema ${context.system}:

Tipo: ${document.type}
Data: ${document.date}
Valor: ${document.value}
Descrição: ${document.description}
Status: ${document.status}

Forneça:
1. Classificação contábil apropriada
2. Plano de contas sugerido
3. Centro de custo recomendado
4. Histórico padrão
5. Observações importantes
6. Ações recomendadas

Responda em formato JSON estruturado para automação.
            `;

            const analysis = await this.claude.analyze(prompt, {
                maxTokens: 1000,
                temperature: 0.3
            });

            // Aplicar classificação no sistema
            await this.applyClassification(document.id, analysis);

            return {
                documentId: document.id,
                originalDocument: document,
                claudeAnalysis: analysis,
                processed: true,
                timestamp: moment().toISOString()
            };

        } catch (error) {
            console.error(`❌ Erro ao processar documento ${document.id}:`, error);
            return {
                documentId: document.id,
                originalDocument: document,
                processed: false,
                error: error.message,
                timestamp: moment().toISOString()
            };
        }
    }

    async applyClassification(documentId, analysis) {
        try {
            // Abrir documento para edição
            await this.page.click(`[data-document-id="${documentId}"] .edit-button`);
            await this.page.waitForSelector('.document-edit-form');

            // Aplicar classificação baseada na análise do Claude
            if (analysis.planoContas) {
                await this.page.select('#plano-contas', analysis.planoContas);
            }

            if (analysis.centroCusto) {
                await this.page.select('#centro-custo', analysis.centroCusto);
            }

            if (analysis.historico) {
                await this.page.fill('#historico', analysis.historico);
            }

            // Salvar alterações
            await this.page.click('#save-document');
            await this.page.waitForSelector('.success-message');

            console.log(`✅ Classificação aplicada ao documento ${documentId}`);

        } catch (error) {
            console.error(`❌ Erro ao aplicar classificação no documento ${documentId}:`, error);
            throw error;
        }
    }

    async generateProcessingReport(clientName, results) {
        const successful = results.filter(r => r.processed);
        const failed = results.filter(r => !r.processed);

        const report = {
            client: clientName,
            processedAt: moment().format('DD/MM/YYYY HH:mm:ss'),
            summary: {
                total: results.length,
                successful: successful.length,
                failed: failed.length,
                successRate: `${((successful.length / results.length) * 100).toFixed(2)}%`
            },
            details: {
                successful: successful,
                failed: failed
            }
        };

        // Salvar relatório
        const reportsDir = path.join(__dirname, '../reports');
        await fs.ensureDir(reportsDir);

        const reportFile = path.join(
            reportsDir,
            `calima-${clientName.replace(/\s+/g, '-')}-${moment().format('YYYY-MM-DD-HH-mm')}.json`
        );

        await fs.writeJson(reportFile, report, { spaces: 2 });

        console.log(`📊 Relatório salvo: ${reportFile}`);
        return report;
    }

    async processMonthlyReports(period) {
        try {
            console.log(`📅 Processando relatórios mensais para ${period}...`);

            await this.initialize();
            await this.login();

            // Navegar para relatórios
            await this.page.click('#reports-menu');
            await this.page.waitForSelector('#monthly-reports');

            // Selecionar período
            await this.page.select('#report-period', period);

            // Gerar relatório
            await this.page.click('#generate-report');
            await this.page.waitForSelector('.report-content');

            // Extrair dados do relatório
            const reportData = await this.page.evaluate(() => {
                // Extrair dados da tabela de relatórios
                const tables = document.querySelectorAll('.report-table');
                const data = {};

                tables.forEach(table => {
                    const title = table.querySelector('h3').textContent;
                    const rows = Array.from(table.querySelectorAll('tbody tr'));

                    data[title] = rows.map(row => {
                        const cells = row.querySelectorAll('td');
                        return Array.from(cells).map(cell => cell.textContent.trim());
                    });
                });

                return data;
            });

            // Processar com Claude para insights
            const insights = await this.generateInsightsWithClaude(reportData, period);

            await this.cleanup();

            return {
                period: period,
                data: reportData,
                insights: insights,
                processedAt: moment().toISOString()
            };

        } catch (error) {
            console.error(`❌ Erro ao processar relatórios mensais:`, error);
            await this.cleanup();
            throw error;
        }
    }

    async generateInsightsWithClaude(reportData, period) {
        const prompt = `
Como contador especializado da ${process.env.COMPANY_NAME}, analise os relatórios mensais de ${period}:

${JSON.stringify(reportData, null, 2)}

Forneça insights profissionais sobre:
1. Performance financeira
2. Principais variações
3. Oportunidades de otimização
4. Alertas importantes
5. Recomendações estratégicas

Mantenha foco na gestão contábil eficiente.
        `;

        return await this.claude.analyze(prompt, {
            maxTokens: 2000,
            temperature: 0.4
        });
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            console.log('🧹 Limpeza da sessão Calima concluída');
        }
    }
}

// Exportar para uso em outros módulos
module.exports = CalimaIntegration;

// Permitir execução direta do script
if (require.main === module) {
    const integration = new CalimaIntegration();

    const args = process.argv.slice(2);
    const command = args[0];
    const parameter = args[1];

    switch (command) {
        case 'process-client':
            if (!parameter) {
                console.error('❌ Nome do cliente é obrigatório');
                process.exit(1);
            }
            integration.processClient(parameter)
                .then(result => {
                    console.log('✅ Processamento concluído:', result);
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Erro no processamento:', error);
                    process.exit(1);
                });
            break;

        case 'monthly-reports':
            if (!parameter) {
                console.error('❌ Período é obrigatório (formato: YYYY-MM)');
                process.exit(1);
            }
            integration.processMonthlyReports(parameter)
                .then(result => {
                    console.log('✅ Relatórios mensais processados:', result);
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Erro nos relatórios mensais:', error);
                    process.exit(1);
                });
            break;

        default:
            console.log(`
🔧 Pedro Tiago Contabilidade - Integração Calima Web

Comandos disponíveis:
  node calima-integration.js process-client "Nome do Cliente"
  node calima-integration.js monthly-reports "2024-01"

Exemplos:
  node calima-integration.js process-client "Empresa ABC Ltda"
  node calima-integration.js monthly-reports "2024-01"

Contato: pedrotiago@pedrotiagocontabilidade.com.br
WhatsApp: 62999948445
            `);
            process.exit(0);
    }
}