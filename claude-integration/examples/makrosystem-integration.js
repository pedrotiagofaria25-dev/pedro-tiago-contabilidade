/**
 * Pedro Tiago Contabilidade - Integração Sistema Makrosystem Web
 * Automação avançada para processamento contábil no Makrosystem
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const { ClaudeCode } = require('@anthropic-ai/claude-code');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class MakrosystemIntegration {
    constructor() {
        this.claude = new ClaudeCode({
            apiKey: process.env.CLAUDE_API_KEY,
            model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229'
        });

        this.config = {
            url: process.env.MAKRO_URL,
            username: process.env.MAKRO_USERNAME,
            password: process.env.MAKRO_PASSWORD,
            timeout: parseInt(process.env.MAKRO_TIMEOUT) || 30000
        };

        this.browser = null;
        this.page = null;
    }

    async initialize() {
        try {
            console.log('🚀 Inicializando integração Makrosystem Web...');

            this.browser = await puppeteer.launch({
                headless: process.env.NODE_ENV === 'production',
                defaultViewport: { width: 1920, height: 1080 },
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });

            this.page = await this.browser.newPage();
            this.page.setDefaultTimeout(this.config.timeout);

            // Configurar interceptadores para otimização
            await this.page.setRequestInterception(true);
            this.page.on('request', (request) => {
                const resourceType = request.resourceType();
                if (['image', 'stylesheet', 'font'].includes(resourceType)) {
                    request.abort();
                } else {
                    request.continue();
                }
            });

            console.log('✅ Integração Makrosystem Web inicializada');
        } catch (error) {
            console.error('❌ Erro na inicialização Makrosystem:', error);
            throw error;
        }
    }

    async login() {
        try {
            console.log('🔐 Realizando login no Makrosystem...');

            await this.page.goto(this.config.url, { waitUntil: 'networkidle0' });

            // Aguardar e preencher formulário de login
            await this.page.waitForSelector('input[name="usuario"]', { timeout: 10000 });
            await this.page.type('input[name="usuario"]', this.config.username);

            await this.page.waitForSelector('input[name="senha"]');
            await this.page.type('input[name="senha"]', this.config.password);

            // Submeter login
            await Promise.all([
                this.page.click('button[type="submit"]'),
                this.page.waitForNavigation({ waitUntil: 'networkidle0' })
            ]);

            // Verificar se login foi bem-sucedido
            const isLoggedIn = await this.page.$('.dashboard-main') !== null;
            if (!isLoggedIn) {
                throw new Error('Falha na autenticação Makrosystem');
            }

            console.log('✅ Login Makrosystem realizado com sucesso');
        } catch (error) {
            console.error('❌ Erro no login Makrosystem:', error);
            throw error;
        }
    }

    async processClient(clientName) {
        try {
            console.log(`📊 Processando cliente no Makrosystem: ${clientName}`);

            await this.initialize();
            await this.login();

            // Navegar para o módulo de clientes
            await this.navigateToClientModule();

            // Buscar cliente específico
            const clientData = await this.findClient(clientName);
            if (!clientData) {
                throw new Error(`Cliente não encontrado: ${clientName}`);
            }

            // Processar documentos fiscais
            const fiscalDocs = await this.processFiscalDocuments(clientData.id);

            // Processar movimentação bancária
            const bankMovements = await this.processBankMovements(clientData.id);

            // Gerar análise com Claude
            const analysis = await this.generateClientAnalysis(clientName, {
                fiscalDocuments: fiscalDocs,
                bankMovements: bankMovements
            });

            const result = {
                client: clientName,
                clientId: clientData.id,
                fiscalDocuments: fiscalDocs,
                bankMovements: bankMovements,
                analysis: analysis,
                processedAt: moment().toISOString()
            };

            await this.saveProcessingResult(result);
            await this.cleanup();

            return result;

        } catch (error) {
            console.error(`❌ Erro ao processar cliente ${clientName}:`, error);
            await this.cleanup();
            throw error;
        }
    }

    async navigateToClientModule() {
        try {
            // Clicar no menu de clientes
            await this.page.waitForSelector('#menu-clientes');
            await this.page.click('#menu-clientes');

            // Aguardar carregar lista de clientes
            await this.page.waitForSelector('.clientes-list', { timeout: 10000 });

            console.log('✅ Navegado para módulo de clientes');
        } catch (error) {
            console.error('❌ Erro ao navegar para módulo de clientes:', error);
            throw error;
        }
    }

    async findClient(clientName) {
        try {
            // Usar campo de busca
            await this.page.waitForSelector('#search-cliente');
            await this.page.fill('#search-cliente', clientName);
            await this.page.keyboard.press('Enter');

            // Aguardar resultados
            await this.page.waitForTimeout(2000);

            // Verificar se encontrou cliente
            const clientElement = await this.page.$('.cliente-item:first-child');
            if (!clientElement) {
                return null;
            }

            // Extrair dados do cliente
            const clientData = await this.page.evaluate(() => {
                const item = document.querySelector('.cliente-item:first-child');
                return {
                    id: item.dataset.clienteId,
                    name: item.querySelector('.cliente-nome').textContent.trim(),
                    cnpj: item.querySelector('.cliente-cnpj').textContent.trim(),
                    status: item.querySelector('.cliente-status').textContent.trim()
                };
            });

            // Selecionar cliente
            await clientElement.click();
            await this.page.waitForSelector('.cliente-dashboard');

            console.log(`✅ Cliente encontrado: ${clientData.name} (ID: ${clientData.id})`);
            return clientData;

        } catch (error) {
            console.error(`❌ Erro ao buscar cliente ${clientName}:`, error);
            throw error;
        }
    }

    async processFiscalDocuments(clientId) {
        try {
            console.log('📄 Processando documentos fiscais...');

            // Navegar para aba de documentos fiscais
            await this.page.click('#tab-documentos-fiscais');
            await this.page.waitForSelector('.documentos-fiscais-list');

            // Obter lista de documentos pendentes
            const documents = await this.page.evaluate(() => {
                const docElements = document.querySelectorAll('.documento-fiscal-item');
                return Array.from(docElements).map(el => ({
                    id: el.dataset.documentoId,
                    tipo: el.querySelector('.doc-tipo').textContent.trim(),
                    numero: el.querySelector('.doc-numero').textContent.trim(),
                    data: el.querySelector('.doc-data').textContent.trim(),
                    valor: el.querySelector('.doc-valor').textContent.trim(),
                    status: el.querySelector('.doc-status').textContent.trim(),
                    fornecedor: el.querySelector('.doc-fornecedor')?.textContent.trim() || '',
                    cliente: el.querySelector('.doc-cliente')?.textContent.trim() || ''
                }));
            });

            // Processar cada documento com Claude
            const processedDocs = [];
            for (const doc of documents) {
                try {
                    const processed = await this.processDocumentWithClaude(doc);
                    processedDocs.push(processed);
                } catch (error) {
                    console.error(`❌ Erro ao processar documento ${doc.id}:`, error);
                    processedDocs.push({
                        ...doc,
                        processed: false,
                        error: error.message
                    });
                }
            }

            console.log(`✅ Processados ${processedDocs.length} documentos fiscais`);
            return processedDocs;

        } catch (error) {
            console.error('❌ Erro ao processar documentos fiscais:', error);
            throw error;
        }
    }

    async processBankMovements(clientId) {
        try {
            console.log('🏦 Processando movimentação bancária...');

            // Navegar para aba bancária
            await this.page.click('#tab-movimentacao-bancaria');
            await this.page.waitForSelector('.movimentacao-bancaria-list');

            // Obter movimentações
            const movements = await this.page.evaluate(() => {
                const movElements = document.querySelectorAll('.movimentacao-item');
                return Array.from(movElements).map(el => ({
                    id: el.dataset.movimentacaoId,
                    data: el.querySelector('.mov-data').textContent.trim(),
                    descricao: el.querySelector('.mov-descricao').textContent.trim(),
                    valor: el.querySelector('.mov-valor').textContent.trim(),
                    tipo: el.querySelector('.mov-tipo').textContent.trim(),
                    conta: el.querySelector('.mov-conta').textContent.trim(),
                    status: el.querySelector('.mov-status').textContent.trim()
                }));
            });

            // Processar movimentações com Claude
            const processedMovements = [];
            for (const movement of movements) {
                try {
                    const processed = await this.processMovementWithClaude(movement);
                    processedMovements.push(processed);
                } catch (error) {
                    console.error(`❌ Erro ao processar movimentação ${movement.id}:`, error);
                    processedMovements.push({
                        ...movement,
                        processed: false,
                        error: error.message
                    });
                }
            }

            console.log(`✅ Processadas ${processedMovements.length} movimentações bancárias`);
            return processedMovements;

        } catch (error) {
            console.error('❌ Erro ao processar movimentação bancária:', error);
            throw error;
        }
    }

    async processDocumentWithClaude(document) {
        const prompt = `
Como especialista contábil da ${process.env.COMPANY_NAME} (CRC ${process.env.CRC_NUMBER}),
analise este documento fiscal do sistema Makrosystem:

Tipo: ${document.tipo}
Número: ${document.numero}
Data: ${document.data}
Valor: ${document.valor}
Status: ${document.status}
Fornecedor: ${document.fornecedor}
Cliente: ${document.cliente}

Forneça análise detalhada incluindo:
1. Classificação contábil apropriada
2. Conta contábil sugerida
3. Centro de custo recomendado
4. Verificações de conformidade fiscal
5. Alertas ou observações importantes
6. Próximas ações recomendadas

Formato de resposta em JSON estruturado.
        `;

        const analysis = await this.claude.analyze(prompt, {
            maxTokens: 1200,
            temperature: 0.2
        });

        return {
            ...document,
            claudeAnalysis: analysis,
            processed: true,
            processedAt: moment().toISOString()
        };
    }

    async processMovementWithClaude(movement) {
        const prompt = `
Como contador da ${process.env.COMPANY_NAME}, analise esta movimentação bancária:

Data: ${movement.data}
Descrição: ${movement.descricao}
Valor: ${movement.valor}
Tipo: ${movement.tipo}
Conta: ${movement.conta}
Status: ${movement.status}

Providencie:
1. Classificação da movimentação
2. Conta contábil apropriada
3. Identificação de padrões
4. Alertas de compliance
5. Recomendações de conciliação

Resposta em JSON estruturado.
        `;

        const analysis = await this.claude.analyze(prompt, {
            maxTokens: 800,
            temperature: 0.2
        });

        return {
            ...movement,
            claudeAnalysis: analysis,
            processed: true,
            processedAt: moment().toISOString()
        };
    }

    async generateClientAnalysis(clientName, data) {
        const prompt = `
Como contador sênior da ${process.env.COMPANY_NAME}, gere análise executiva para o cliente ${clientName}:

DOCUMENTOS FISCAIS: ${data.fiscalDocuments.length} documentos
MOVIMENTAÇÕES BANCÁRIAS: ${data.bankMovements.length} movimentações

Dados detalhados:
${JSON.stringify(data, null, 2)}

Forneça análise executiva incluindo:
1. Resumo da situação contábil
2. Principais pontos de atenção
3. Oportunidades de otimização
4. Riscos identificados
5. Recomendações estratégicas
6. Próximos passos prioritários

Mantenha linguagem profissional e foco em valor agregado.
        `;

        return await this.claude.analyze(prompt, {
            maxTokens: 2000,
            temperature: 0.3
        });
    }

    async generateTaxReport(period) {
        try {
            console.log(`📋 Gerando relatório tributário para ${period}...`);

            await this.initialize();
            await this.login();

            // Navegar para módulo fiscal
            await this.page.click('#menu-fiscal');
            await this.page.waitForSelector('.fiscal-dashboard');

            // Selecionar período
            await this.page.select('#periodo-fiscal', period);

            // Gerar relatórios obrigatórios
            const reports = await this.generateObligatoryReports();

            // Análise com Claude
            const insights = await this.generateTaxInsights(reports, period);

            const result = {
                period: period,
                reports: reports,
                insights: insights,
                generatedAt: moment().toISOString()
            };

            await this.saveReportResult(result, 'tax');
            await this.cleanup();

            return result;

        } catch (error) {
            console.error('❌ Erro ao gerar relatório tributário:', error);
            await this.cleanup();
            throw error;
        }
    }

    async generateObligatoryReports() {
        const reports = {};

        try {
            // SPED Fiscal
            await this.page.click('#gerar-sped-fiscal');
            await this.page.waitForSelector('.sped-fiscal-result');
            reports.spedFiscal = await this.extractReportData('.sped-fiscal-result');

            // SPED Contábil
            await this.page.click('#gerar-sped-contabil');
            await this.page.waitForSelector('.sped-contabil-result');
            reports.spedContabil = await this.extractReportData('.sped-contabil-result');

            // ECF
            await this.page.click('#gerar-ecf');
            await this.page.waitForSelector('.ecf-result');
            reports.ecf = await this.extractReportData('.ecf-result');

            console.log('✅ Relatórios obrigatórios gerados');
            return reports;

        } catch (error) {
            console.error('❌ Erro ao gerar relatórios obrigatórios:', error);
            throw error;
        }
    }

    async extractReportData(selector) {
        return await this.page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (!element) return null;

            return {
                status: element.querySelector('.status')?.textContent.trim(),
                errors: Array.from(element.querySelectorAll('.error')).map(e => e.textContent.trim()),
                warnings: Array.from(element.querySelectorAll('.warning')).map(w => w.textContent.trim()),
                summary: element.querySelector('.summary')?.textContent.trim()
            };
        }, selector);
    }

    async generateTaxInsights(reports, period) {
        const prompt = `
Como especialista fiscal da ${process.env.COMPANY_NAME}, analise os relatórios tributários de ${period}:

${JSON.stringify(reports, null, 2)}

Forneça insights profissionais sobre:
1. Conformidade fiscal geral
2. Riscos tributários identificados
3. Oportunidades de economia
4. Alertas críticos
5. Planejamento tributário
6. Ações corretivas necessárias

Mantenha foco na gestão tributária eficiente e compliance.
        `;

        return await this.claude.analyze(prompt, {
            maxTokens: 2500,
            temperature: 0.3
        });
    }

    async saveProcessingResult(result) {
        const resultsDir = path.join(__dirname, '../results/makrosystem');
        await fs.ensureDir(resultsDir);

        const filename = `processing-${result.client.replace(/\s+/g, '-')}-${moment().format('YYYY-MM-DD-HH-mm')}.json`;
        const filepath = path.join(resultsDir, filename);

        await fs.writeJson(filepath, result, { spaces: 2 });
        console.log(`💾 Resultado salvo: ${filepath}`);
    }

    async saveReportResult(result, type) {
        const reportsDir = path.join(__dirname, '../reports/makrosystem');
        await fs.ensureDir(reportsDir);

        const filename = `${type}-report-${result.period}-${moment().format('YYYY-MM-DD-HH-mm')}.json`;
        const filepath = path.join(reportsDir, filename);

        await fs.writeJson(filepath, result, { spaces: 2 });
        console.log(`📊 Relatório salvo: ${filepath}`);
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            console.log('🧹 Sessão Makrosystem finalizada');
        }
    }
}

module.exports = MakrosystemIntegration;

// Execução direta do script
if (require.main === module) {
    const integration = new MakrosystemIntegration();

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
                    console.log('✅ Processamento concluído:', JSON.stringify(result, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Erro:', error.message);
                    process.exit(1);
                });
            break;

        case 'tax-report':
            if (!parameter) {
                console.error('❌ Período é obrigatório (formato: YYYY-MM)');
                process.exit(1);
            }
            integration.generateTaxReport(parameter)
                .then(result => {
                    console.log('✅ Relatório tributário gerado:', JSON.stringify(result, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Erro:', error.message);
                    process.exit(1);
                });
            break;

        default:
            console.log(`
🔧 Pedro Tiago Contabilidade - Integração Makrosystem Web

Comandos disponíveis:
  node makrosystem-integration.js process-client "Nome do Cliente"
  node makrosystem-integration.js tax-report "2024-01"

Exemplos:
  node makrosystem-integration.js process-client "Empresa XYZ Ltda"
  node makrosystem-integration.js tax-report "2024-01"

Contato: pedrotiago@pedrotiagocontabilidade.com.br
WhatsApp: 62999948445
            `);
            process.exit(0);
    }
}