/**
 * Pedro Tiago Contabilidade - Gerador de Relatórios Inteligentes
 * Sistema avançado de geração de relatórios com análise Claude
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const { ClaudeCode } = require('@anthropic-ai/claude-code');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const XLSX = require('xlsx');
const puppeteer = require('puppeteer');

class ReportGenerator {
    constructor() {
        this.claude = new ClaudeCode({
            apiKey: process.env.CLAUDE_API_KEY,
            model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229'
        });

        this.reportsPath = process.env.REPORTS_PATH || path.join(__dirname, '../reports');
        this.templatesPath = process.env.REPORTS_TEMPLATE_PATH || path.join(__dirname, '../templates');

        this.reportTypes = [
            'monthly-summary',
            'client-analysis',
            'financial-dashboard',
            'tax-compliance',
            'cash-flow',
            'comparative-analysis'
        ];
    }

    async generateReport(options) {
        try {
            console.log(`📊 Gerando relatório: ${options.type}...`);

            const report = {
                id: this.generateReportId(),
                type: options.type,
                parameters: options,
                createdAt: moment().toISOString(),
                createdBy: process.env.COMPANY_NAME
            };

            // Validar tipo de relatório
            if (!this.reportTypes.includes(options.type)) {
                throw new Error(`Tipo de relatório não suportado: ${options.type}`);
            }

            // Gerar relatório baseado no tipo
            switch (options.type) {
                case 'monthly-summary':
                    report.data = await this.generateMonthlySummary(options);
                    break;
                case 'client-analysis':
                    report.data = await this.generateClientAnalysis(options);
                    break;
                case 'financial-dashboard':
                    report.data = await this.generateFinancialDashboard(options);
                    break;
                case 'tax-compliance':
                    report.data = await this.generateTaxCompliance(options);
                    break;
                case 'cash-flow':
                    report.data = await this.generateCashFlow(options);
                    break;
                case 'comparative-analysis':
                    report.data = await this.generateComparativeAnalysis(options);
                    break;
            }

            // Gerar análise com Claude
            report.claudeInsights = await this.generateClaudeInsights(report);

            // Salvar relatório
            const savedReport = await this.saveReport(report, options.format || 'json');

            console.log(`✅ Relatório gerado com sucesso: ${savedReport.filePath}`);
            return savedReport;

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error);
            throw error;
        }
    }

    async generateMonthlySummary(options) {
        const { period, clients } = options;
        console.log(`📅 Gerando resumo mensal para ${period}...`);

        // Simular coleta de dados (implementação real conectaria aos sistemas)
        const data = {
            period: period,
            summary: {
                totalRevenue: 125000.00,
                totalExpenses: 85000.00,
                netProfit: 40000.00,
                activeClients: clients?.length || 45,
                newClients: 3,
                lostClients: 1
            },
            breakdown: {
                revenueByService: {
                    'Contabilidade Geral': 65000.00,
                    'Consultoria Fiscal': 35000.00,
                    'Folha de Pagamento': 25000.00
                },
                expensesByCategory: {
                    'Pessoal': 45000.00,
                    'Tecnologia': 15000.00,
                    'Infraestrutura': 12000.00,
                    'Marketing': 8000.00,
                    'Outros': 5000.00
                }
            },
            clientMetrics: {
                averageRevenuePorClient: 2777.78,
                clientRetentionRate: '97.8%',
                averageContractValue: 1500.00
            },
            kpis: {
                profitMargin: '32%',
                growthRate: '8.5%',
                clientSatisfactionRate: '96%',
                averageResponseTime: '2.3 hours'
            }
        };

        return data;
    }

    async generateClientAnalysis(options) {
        const { clientId, clientName, period } = options;
        console.log(`👤 Gerando análise do cliente: ${clientName}...`);

        const data = {
            client: {
                name: clientName,
                id: clientId,
                cnpj: '12.345.678/0001-90',
                segment: 'Varejo',
                contractStart: '2023-01-15'
            },
            financialOverview: {
                revenue: {
                    current: 250000.00,
                    previous: 230000.00,
                    growth: '8.7%'
                },
                expenses: {
                    current: 180000.00,
                    previous: 175000.00,
                    variation: '2.9%'
                },
                profit: {
                    current: 70000.00,
                    previous: 55000.00,
                    growth: '27.3%'
                }
            },
            taxSituation: {
                regime: 'Lucro Presumido',
                monthlyTax: 15750.00,
                annualProjection: 189000.00,
                savings: 12000.00,
                compliance: 'Em dia'
            },
            recommendations: [
                'Considerar mudança para Lucro Real devido ao crescimento',
                'Implementar controles de custos mais rigorosos',
                'Avaliar investimentos em tecnologia para automação'
            ],
            alerts: [
                'Prazo DAS vencendo em 5 dias',
                'Declaração anual pendente de revisão'
            ]
        };

        return data;
    }

    async generateFinancialDashboard(options) {
        const { period, compareWithPrevious } = options;
        console.log(`📈 Gerando dashboard financeiro para ${period}...`);

        const data = {
            period: period,
            metrics: {
                totalRevenue: {
                    current: 485000.00,
                    previous: 425000.00,
                    change: '+14.1%',
                    trend: 'up'
                },
                totalExpenses: {
                    current: 325000.00,
                    previous: 310000.00,
                    change: '+4.8%',
                    trend: 'up'
                },
                netProfit: {
                    current: 160000.00,
                    previous: 115000.00,
                    change: '+39.1%',
                    trend: 'up'
                },
                profitMargin: {
                    current: '33.0%',
                    previous: '27.1%',
                    change: '+5.9pp',
                    trend: 'up'
                }
            },
            cashFlow: {
                beginning: 75000.00,
                inflow: 485000.00,
                outflow: 325000.00,
                ending: 235000.00
            },
            topClients: [
                { name: 'Empresa Alpha Ltda', revenue: 45000.00, percentage: '9.3%' },
                { name: 'Beta Comércio EIRELI', revenue: 38000.00, percentage: '7.8%' },
                { name: 'Gamma Serviços SA', revenue: 35000.00, percentage: '7.2%' },
                { name: 'Delta Tech Ltda', revenue: 32000.00, percentage: '6.6%' },
                { name: 'Epsilon Corp', revenue: 28000.00, percentage: '5.8%' }
            ],
            serviceBreakdown: [
                { service: 'Contabilidade Geral', revenue: 195000.00, percentage: '40.2%' },
                { service: 'Consultoria Fiscal', revenue: 145000.00, percentage: '29.9%' },
                { service: 'Folha de Pagamento', revenue: 85000.00, percentage: '17.5%' },
                { service: 'Planejamento Tributário', revenue: 60000.00, percentage: '12.4%' }
            ]
        };

        return data;
    }

    async generateTaxCompliance(options) {
        const { period, includeProjections } = options;
        console.log(`🏛️ Gerando relatório de compliance fiscal para ${period}...`);

        const data = {
            period: period,
            overview: {
                totalObligations: 127,
                delivered: 125,
                pending: 2,
                overdue: 0,
                complianceRate: '98.4%'
            },
            obligations: {
                monthly: {
                    'DAS/Simples': { status: 'Em dia', dueDate: '20/12/2024' },
                    'DCTF Web': { status: 'Em dia', dueDate: '15/12/2024' },
                    'EFD-Contribuições': { status: 'Em dia', dueDate: '10/12/2024' },
                    'SPED Fiscal': { status: 'Pendente', dueDate: '30/12/2024' }
                },
                annual: {
                    'DIPJ/ECF': { status: 'Concluída', deliveredAt: '30/07/2024' },
                    'DIRF': { status: 'Concluída', deliveredAt: '28/02/2024' },
                    'RAIS': { status: 'Concluída', deliveredAt: '31/03/2024' }
                }
            },
            taxes: {
                federal: {
                    'IRPJ': 25000.00,
                    'CSLL': 15000.00,
                    'PIS/COFINS': 35000.00,
                    'IPI': 8000.00
                },
                state: {
                    'ICMS': 45000.00,
                    'IPVA': 2500.00
                },
                municipal: {
                    'ISS': 18000.00,
                    'IPTU': 3500.00
                }
            },
            projections: includeProjections ? {
                nextQuarter: {
                    estimatedTaxes: 89000.00,
                    upcomingObligations: 15,
                    criticalDeadlines: [
                        { obligation: 'ECF 2024', deadline: '31/07/2025' },
                        { obligation: 'DIRF 2025', deadline: '28/02/2025' }
                    ]
                }
            } : null
        };

        return data;
    }

    async generateCashFlow(options) {
        const { startDate, endDate, includeProjections } = options;
        console.log(`💰 Gerando relatório de fluxo de caixa...`);

        const data = {
            period: `${startDate} até ${endDate}`,
            summary: {
                beginningBalance: 125000.00,
                totalInflows: 485000.00,
                totalOutflows: 325000.00,
                endingBalance: 285000.00,
                netCashFlow: 160000.00
            },
            inflows: {
                'Receita de Serviços': 415000.00,
                'Recebimento de Clientes': 45000.00,
                'Outras Receitas': 25000.00
            },
            outflows: {
                'Salários e Encargos': 125000.00,
                'Fornecedores': 85000.00,
                'Impostos e Taxas': 65000.00,
                'Aluguel e Condomínio': 25000.00,
                'Tecnologia': 15000.00,
                'Outras Despesas': 10000.00
            },
            monthlyBreakdown: [
                { month: 'Jan/2024', inflow: 38000, outflow: 25000, net: 13000 },
                { month: 'Feb/2024', inflow: 42000, outflow: 28000, net: 14000 },
                { month: 'Mar/2024', inflow: 45000, outflow: 30000, net: 15000 }
            ],
            projections: includeProjections ? {
                next3Months: {
                    projectedInflows: 145000.00,
                    projectedOutflows: 98000.00,
                    projectedBalance: 332000.00
                }
            } : null
        };

        return data;
    }

    async generateComparativeAnalysis(options) {
        const { periods, metrics } = options;
        console.log(`📊 Gerando análise comparativa...`);

        const data = {
            periods: periods,
            comparison: {
                revenue: {
                    '2024': 485000.00,
                    '2023': 425000.00,
                    growth: '14.1%'
                },
                profit: {
                    '2024': 160000.00,
                    '2023': 115000.00,
                    growth: '39.1%'
                },
                clients: {
                    '2024': 45,
                    '2023': 38,
                    growth: '18.4%'
                }
            },
            trends: {
                revenue: 'Crescimento consistente',
                profitability: 'Melhoria significativa',
                clientBase: 'Expansão controlada'
            },
            benchmarks: {
                industryAverage: {
                    profitMargin: '28%',
                    growthRate: '12%',
                    clientRetention: '92%'
                },
                ourPerformance: {
                    profitMargin: '33%',
                    growthRate: '14.1%',
                    clientRetention: '97.8%'
                }
            }
        };

        return data;
    }

    async generateClaudeInsights(report) {
        const prompt = `
Como contador sênior especialista da ${process.env.COMPANY_NAME} (CRC ${process.env.CRC_NUMBER}),
analise o seguinte relatório ${report.type} e forneça insights profissionais:

DADOS DO RELATÓRIO:
${JSON.stringify(report.data, null, 2)}

PARÂMETROS:
${JSON.stringify(report.parameters, null, 2)}

Forneça análise executiva incluindo:

1. PRINCIPAIS INSIGHTS
   - Pontos mais relevantes dos dados
   - Tendências identificadas
   - Destaques positivos e negativos

2. ANÁLISE CRÍTICA
   - Áreas de preocupação
   - Oportunidades de melhoria
   - Riscos identificados

3. RECOMENDAÇÕES ESTRATÉGICAS
   - Ações imediatas recomendadas
   - Planejamento de médio prazo
   - Métricas para monitoramento

4. CONTEXTO CONTÁBIL
   - Implicações fiscais
   - Conformidade regulatória
   - Melhores práticas contábeis

5. PRÓXIMOS PASSOS
   - Prioridades de ação
   - Cronograma sugerido
   - Recursos necessários

Mantenha linguagem profissional e foque em valor agregado para tomada de decisões.
        `;

        return await this.claude.analyze(prompt, {
            maxTokens: 3000,
            temperature: 0.3
        });
    }

    async saveReport(report, format = 'json') {
        try {
            await fs.ensureDir(this.reportsPath);

            const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
            const filename = `${report.type}-${timestamp}`;

            let filePath;
            let savedData;

            switch (format.toLowerCase()) {
                case 'json':
                    filePath = path.join(this.reportsPath, `${filename}.json`);
                    await fs.writeJson(filePath, report, { spaces: 2 });
                    savedData = { format: 'json', filePath, size: (await fs.stat(filePath)).size };
                    break;

                case 'xlsx':
                    filePath = path.join(this.reportsPath, `${filename}.xlsx`);
                    const workbook = this.convertToExcel(report);
                    XLSX.writeFile(workbook, filePath);
                    savedData = { format: 'xlsx', filePath, size: (await fs.stat(filePath)).size };
                    break;

                case 'pdf':
                    filePath = path.join(this.reportsPath, `${filename}.pdf`);
                    await this.generatePDF(report, filePath);
                    savedData = { format: 'pdf', filePath, size: (await fs.stat(filePath)).size };
                    break;

                default:
                    throw new Error(`Formato não suportado: ${format}`);
            }

            return {
                ...report,
                savedAt: moment().toISOString(),
                ...savedData
            };

        } catch (error) {
            console.error('❌ Erro ao salvar relatório:', error);
            throw error;
        }
    }

    convertToExcel(report) {
        const wb = XLSX.utils.book_new();

        // Aba principal com resumo
        const summaryData = [
            ['Relatório', report.type],
            ['Gerado em', moment(report.createdAt).format('DD/MM/YYYY HH:mm:ss')],
            ['Criado por', report.createdBy],
            ['', ''],
            ['=== DADOS DO RELATÓRIO ===', '']
        ];

        // Converter dados para formato tabular
        this.flattenObjectToRows(report.data, summaryData);

        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo');

        // Aba com insights do Claude
        if (report.claudeInsights) {
            const insightsData = [
                ['INSIGHTS CLAUDE AI', ''],
                ['', ''],
                ['Análise gerada por inteligência artificial', ''],
                ['', ''],
                [report.claudeInsights, '']
            ];

            const insightsWs = XLSX.utils.aoa_to_sheet(insightsData);
            XLSX.utils.book_append_sheet(wb, insightsWs, 'Insights IA');
        }

        return wb;
    }

    flattenObjectToRows(obj, rows, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                rows.push([fullKey, '']);
                this.flattenObjectToRows(value, rows, fullKey);
            } else if (Array.isArray(value)) {
                rows.push([fullKey, `Array com ${value.length} itens`]);
                value.forEach((item, index) => {
                    if (typeof item === 'object') {
                        this.flattenObjectToRows(item, rows, `${fullKey}[${index}]`);
                    } else {
                        rows.push([`${fullKey}[${index}]`, item]);
                    }
                });
            } else {
                rows.push([fullKey, value]);
            }
        }
    }

    async generatePDF(report, filePath) {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        const html = this.generateHTMLReport(report);

        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
        });

        await browser.close();
    }

    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório ${report.type} - ${process.env.COMPANY_NAME}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .title { font-size: 24px; font-weight: bold; color: #333; }
        .subtitle { font-size: 18px; font-weight: bold; color: #666; margin: 15px 0 10px 0; }
        .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .data-table th { background-color: #f2f2f2; font-weight: bold; }
        .insights { background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${process.env.COMPANY_NAME}</h1>
        <p>CRC ${process.env.CRC_NUMBER}</p>
        <p>Relatório: ${report.type}</p>
        <p>Gerado em: ${moment(report.createdAt).format('DD/MM/YYYY HH:mm:ss')}</p>
    </div>

    <div class="section">
        <h2 class="subtitle">Dados do Relatório</h2>
        <pre>${JSON.stringify(report.data, null, 2)}</pre>
    </div>

    ${report.claudeInsights ? `
    <div class="section">
        <h2 class="subtitle">Insights da Inteligência Artificial</h2>
        <div class="insights">
            <pre>${report.claudeInsights}</pre>
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p>${process.env.COMPANY_NAME} - Pedro Tiago (CRC ${process.env.CRC_NUMBER})</p>
        <p>Email: ${process.env.EMAIL} | WhatsApp: ${process.env.WHATSAPP}</p>
        <p>Site: ${process.env.SITE_URL}</p>
    </div>
</body>
</html>
        `;
    }

    generateReportId() {
        return `RPT-${moment().format('YYYYMMDD')}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    async generateMonthlyReport(period) {
        return await this.generateReport({
            type: 'monthly-summary',
            period: period,
            format: 'pdf'
        });
    }
}

module.exports = ReportGenerator;

// Execução direta
if (require.main === module) {
    const generator = new ReportGenerator();

    const args = process.argv.slice(2);
    const command = args[0];
    const parameter = args[1];
    const format = args[2] || 'json';

    switch (command) {
        case 'monthly':
            if (!parameter) {
                console.error('❌ Período é obrigatório (formato: YYYY-MM)');
                process.exit(1);
            }
            generator.generateMonthlyReport(parameter)
                .then(result => {
                    console.log('✅ Relatório mensal gerado:', result.filePath);
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Erro:', error.message);
                    process.exit(1);
                });
            break;

        case 'custom':
            const options = JSON.parse(parameter || '{}');
            options.format = format;

            generator.generateReport(options)
                .then(result => {
                    console.log('✅ Relatório personalizado gerado:', result.filePath);
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Erro:', error.message);
                    process.exit(1);
                });
            break;

        default:
            console.log(`
📊 Pedro Tiago Contabilidade - Gerador de Relatórios

Comandos disponíveis:
  node report-generator.js monthly "YYYY-MM" [format]
  node report-generator.js custom '{"type":"client-analysis","clientName":"Empresa ABC"}' [format]

Formatos: json, xlsx, pdf

Tipos de relatório:
  - monthly-summary: Resumo mensal
  - client-analysis: Análise de cliente
  - financial-dashboard: Dashboard financeiro
  - tax-compliance: Compliance fiscal
  - cash-flow: Fluxo de caixa
  - comparative-analysis: Análise comparativa

Exemplos:
  node report-generator.js monthly "2024-01" pdf
  node report-generator.js custom '{"type":"cash-flow","startDate":"2024-01-01","endDate":"2024-12-31"}' xlsx

Contato: pedrotiago@pedrotiagocontabilidade.com.br
WhatsApp: 62999948445
            `);
            process.exit(0);
    }
}