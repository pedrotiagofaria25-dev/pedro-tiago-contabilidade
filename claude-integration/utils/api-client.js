/**
 * Pedro Tiago Contabilidade - Cliente de API Unificado
 * Cliente centralizado para integração com Claude AI e sistemas contábeis
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const axios = require('axios');
const { ClaudeCode } = require('@anthropic-ai/claude-code');
const Logger = require('../config/logger-config');
const ClaudeConfig = require('../config/claude-config');

class ApiClient {
    constructor() {
        this.logger = new Logger('ApiClient');
        this.claudeConfig = new ClaudeConfig();

        // Inicializar Claude
        this.claude = new ClaudeCode(this.claudeConfig.apiConfig);

        // Configurar axios com interceptadores
        this.setupAxiosInterceptors();

        // Rate limiting
        this.rateLimiter = {
            requests: [],
            maxRequests: this.claudeConfig.rateLimits.requestsPerMinute,
            windowMs: 60000
        };
    }

    setupAxiosInterceptors() {
        // Request interceptor
        axios.interceptors.request.use(
            (config) => {
                config.metadata = { startTime: new Date() };
                this.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                this.logger.error('API Request Error', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        axios.interceptors.response.use(
            (response) => {
                const duration = new Date() - response.config.metadata.startTime;
                this.logger.debug(`API Response: ${response.status} ${response.config.url} (${duration}ms)`);
                return response;
            },
            (error) => {
                const duration = error.config?.metadata ? new Date() - error.config.metadata.startTime : 0;
                this.logger.error(`API Error: ${error.response?.status || 'Network'} ${error.config?.url} (${duration}ms)`, error);
                return Promise.reject(error);
            }
        );
    }

    // Rate limiting para evitar exceder limites da API
    async checkRateLimit() {
        const now = Date.now();

        // Remove requests antigas (fora da janela)
        this.rateLimiter.requests = this.rateLimiter.requests.filter(
            time => now - time < this.rateLimiter.windowMs
        );

        // Verifica se pode fazer mais requests
        if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
            const oldestRequest = Math.min(...this.rateLimiter.requests);
            const waitTime = this.rateLimiter.windowMs - (now - oldestRequest);

            this.logger.warn(`Rate limit reached. Waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));

            // Recheck after waiting
            return this.checkRateLimit();
        }

        this.rateLimiter.requests.push(now);
    }

    // Cliente Claude AI principal
    async claudeRequest(prompt, options = {}) {
        try {
            await this.checkRateLimit();

            const startTime = Date.now();

            const requestOptions = {
                maxTokens: options.maxTokens || this.claudeConfig.apiConfig.maxTokens,
                temperature: options.temperature || this.claudeConfig.apiConfig.temperature,
                ...options
            };

            this.logger.claudeOperation('request_start', 0, this.claudeConfig.apiConfig.model, {
                promptLength: prompt.length,
                options: requestOptions
            });

            const response = await this.claude.analyze(prompt, requestOptions);

            const duration = Date.now() - startTime;
            const estimatedTokens = Math.ceil(prompt.length / 4) + Math.ceil((response?.length || 0) / 4);

            this.logger.claudeOperation('request_complete', estimatedTokens, this.claudeConfig.apiConfig.model, {
                duration,
                responseLength: response?.length || 0
            });

            return response;

        } catch (error) {
            this.logger.error('Claude API request failed', error, {
                promptLength: prompt.length,
                options
            });
            throw this.handleClaudeError(error);
        }
    }

    // Wrapper para análise de documentos contábeis
    async analyzeDocument(document, context = {}) {
        const prompt = this.buildDocumentAnalysisPrompt(document, context);

        try {
            const analysis = await this.claudeRequest(prompt, {
                maxTokens: 1500,
                temperature: 0.2
            });

            this.logger.documentProcessing(
                document.id || 'unknown',
                'claude_analysis',
                'success',
                { documentType: document.type }
            );

            return this.parseAnalysisResponse(analysis);

        } catch (error) {
            this.logger.documentProcessing(
                document.id || 'unknown',
                'claude_analysis',
                'error',
                { error: error.message }
            );
            throw error;
        }
    }

    // Wrapper para resolução de conflitos
    async resolveConflict(conflictData, context = {}) {
        const prompt = this.buildConflictResolutionPrompt(conflictData, context);

        try {
            const resolution = await this.claudeRequest(prompt, {
                maxTokens: 1000,
                temperature: 0.1
            });

            this.logger.syncOperation(
                ['calima', 'makrosystem'],
                'conflict_resolution',
                'success',
                { conflictType: conflictData.type }
            );

            return this.parseResolutionResponse(resolution);

        } catch (error) {
            this.logger.syncOperation(
                ['calima', 'makrosystem'],
                'conflict_resolution',
                'error',
                { error: error.message }
            );
            throw error;
        }
    }

    // Wrapper para análise financeira
    async analyzeFinancialData(data, analysisType = 'general', context = {}) {
        const prompt = this.buildFinancialAnalysisPrompt(data, analysisType, context);

        try {
            const insights = await this.claudeRequest(prompt, {
                maxTokens: 2500,
                temperature: 0.3
            });

            this.logger.reportGeneration(
                `financial_analysis_${analysisType}`,
                context.client,
                'json',
                { dataPoints: Object.keys(data).length }
            );

            return this.parseInsightsResponse(insights);

        } catch (error) {
            this.logger.error('Financial analysis failed', error, {
                analysisType,
                dataSize: JSON.stringify(data).length
            });
            throw error;
        }
    }

    // Cliente HTTP genérico para APIs externas
    async httpRequest(method, url, data = null, headers = {}) {
        try {
            const config = {
                method,
                url,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `Pedro-Tiago-Contabilidade/1.0`,
                    ...headers
                },
                timeout: 30000
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return response.data;

        } catch (error) {
            this.logger.error(`HTTP ${method.toUpperCase()} request failed`, error, {
                url,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            throw error;
        }
    }

    // Teste de conectividade com Claude API
    async testConnection() {
        try {
            const testPrompt = "Responda apenas 'OK' se você pode me ouvir.";
            const response = await this.claudeRequest(testPrompt, {
                maxTokens: 10,
                temperature: 0
            });

            const isConnected = response && response.toLowerCase().includes('ok');

            if (isConnected) {
                this.logger.info('Claude API connection test successful');
                return { connected: true, response };
            } else {
                throw new Error('Unexpected response from Claude API');
            }

        } catch (error) {
            this.logger.error('Claude API connection test failed', error);
            throw error;
        }
    }

    // Construir prompt para análise de documentos
    buildDocumentAnalysisPrompt(document, context) {
        return `${this.claudeConfig.accountingPrompts.documentClassification}

DOCUMENTO PARA ANÁLISE:
${JSON.stringify(document, null, 2)}

CONTEXTO ADICIONAL:
${JSON.stringify(context, null, 2)}

Forneça análise completa em formato JSON estruturado.`;
    }

    // Construir prompt para resolução de conflitos
    buildConflictResolutionPrompt(conflictData, context) {
        return `${this.claudeConfig.accountingPrompts.fiscalCompliance}

CONFLITO ENTRE SISTEMAS:
${JSON.stringify(conflictData, null, 2)}

CONTEXTO:
${JSON.stringify(context, null, 2)}

Resolva o conflito e forneça resposta em JSON com:
{
  "action": "update_calima|update_makrosystem|merge|manual_review",
  "reasoning": "explicação detalhada",
  "targetValue": "valor final recomendado",
  "priority": "high|medium|low",
  "additionalSteps": ["passos adicionais"]
}`;
    }

    // Construir prompt para análise financeira
    buildFinancialAnalysisPrompt(data, analysisType, context) {
        return `${this.claudeConfig.accountingPrompts.financialAnalysis}

TIPO DE ANÁLISE: ${analysisType}

DADOS FINANCEIROS:
${JSON.stringify(data, null, 2)}

CONTEXTO:
${JSON.stringify(context, null, 2)}

Forneça análise abrangente focada em insights acionáveis para ${process.env.COMPANY_NAME}.`;
    }

    // Parser de resposta de análise
    parseAnalysisResponse(response) {
        try {
            // Tentar parsear JSON diretamente
            if (typeof response === 'object') {
                return response;
            }

            // Tentar extrair JSON da resposta em texto
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // Se não conseguir parsear, retornar resposta estruturada
            return {
                analysis: response,
                parsed: false,
                rawResponse: response
            };

        } catch (error) {
            this.logger.warn('Failed to parse analysis response as JSON', { response });
            return {
                analysis: response,
                parsed: false,
                error: error.message,
                rawResponse: response
            };
        }
    }

    // Parser de resposta de resolução
    parseResolutionResponse(response) {
        return this.parseAnalysisResponse(response);
    }

    // Parser de insights financeiros
    parseInsightsResponse(response) {
        return this.parseAnalysisResponse(response);
    }

    // Handler de erros Claude específicos
    handleClaudeError(error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            switch (status) {
                case 400:
                    return new Error(`Requisição inválida Claude API: ${data.error?.message || 'Bad Request'}`);
                case 401:
                    return new Error('Chave API do Claude inválida ou expirada');
                case 403:
                    return new Error('Acesso negado à API do Claude');
                case 429:
                    return new Error('Limite de rate da API do Claude excedido');
                case 500:
                    return new Error('Erro interno da API do Claude');
                default:
                    return new Error(`Erro da API do Claude: ${status} - ${data.error?.message || 'Unknown error'}`);
            }
        }

        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return new Error('Falha na conexão com a API do Claude. Verifique sua conexão de internet.');
        }

        return error;
    }

    // Retry automático com backoff exponencial
    async retryRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }

                const delay = baseDelay * Math.pow(2, attempt - 1) * (1 + Math.random() * 0.1);
                this.logger.warn(`Request failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`, {
                    error: error.message
                });

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Método de limpeza
    async cleanup() {
        // Limpar cache de rate limiting
        this.rateLimiter.requests = [];

        this.logger.info('ApiClient cleanup completed');
    }
}

module.exports = ApiClient;