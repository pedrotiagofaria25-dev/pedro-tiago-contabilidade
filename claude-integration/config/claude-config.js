/**
 * Pedro Tiago Contabilidade - Configuração Claude Code
 * Configurações centralizadas para integração com Claude AI
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const dotenv = require('dotenv');
dotenv.config();

class ClaudeConfig {
    constructor() {
        this.validateConfig();
    }

    validateConfig() {
        const required = ['CLAUDE_API_KEY'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            throw new Error(`Configurações obrigatórias do Claude não encontradas: ${missing.join(', ')}`);
        }
    }

    get apiConfig() {
        return {
            apiKey: process.env.CLAUDE_API_KEY,
            model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
            maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096,
            temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.3
        };
    }

    get accountingPrompts() {
        return {
            documentClassification: `
Você é um contador especialista da ${process.env.COMPANY_NAME} (CRC ${process.env.CRC_NUMBER}).
Analise documentos contábeis e forneça classificação apropriada incluindo:
- Plano de contas
- Centro de custo
- Histórico padronizado
- Verificações de conformidade
- Alertas importantes

Responda sempre em JSON estruturado.
            `,

            fiscalCompliance: `
Como especialista fiscal da ${process.env.COMPANY_NAME}, analise a conformidade tributária e forneça:
- Status de compliance
- Riscos identificados
- Oportunidades de economia
- Próximas obrigações
- Recomendações específicas

Mantenha foco na legislação brasileira atual.
            `,

            financialAnalysis: `
Como contador sênior, analise dados financeiros e forneça insights sobre:
- Performance financeira
- Tendências identificadas
- Oportunidades de melhoria
- Riscos potenciais
- Recomendações estratégicas

Foque em valor agregado para tomada de decisões.
            `
        };
    }

    get conversationSettings() {
        return {
            contextWindow: 32000,
            preserveContext: true,
            multiTurn: true,
            systemMessage: `
Você é um assistente contábil especializado da ${process.env.COMPANY_NAME}.

INFORMAÇÕES DA EMPRESA:
- Contador: Pedro Tiago
- CRC: ${process.env.CRC_NUMBER}
- Email: ${process.env.EMAIL}
- WhatsApp: ${process.env.WHATSAPP}

ESPECIALIDADES:
- Contabilidade empresarial
- Planejamento tributário
- Compliance fiscal
- Análise financeira
- Automação contábil

DIRETRIZES:
- Sempre responda com precisão técnica
- Use terminologia contábil adequada
- Considere legislação brasileira
- Foque em soluções práticas
- Mantenha confidencialidade absoluta
            `
        };
    }

    get rateLimits() {
        return {
            requestsPerMinute: 50,
            requestsPerHour: 1000,
            requestsPerDay: 5000,
            maxConcurrent: 5
        };
    }

    get retrySettings() {
        return {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
            jitterEnabled: true
        };
    }
}

module.exports = ClaudeConfig;