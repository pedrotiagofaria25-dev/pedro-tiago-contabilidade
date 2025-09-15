/**
 * Pedro Tiago Contabilidade - Sincronização de Dados Entre Sistemas
 * Sincronização bidirecional Calima ↔ Makrosystem com validação inteligente
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const { ClaudeCode } = require('@anthropic-ai/claude-code');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');

const CalimaIntegration = require('./calima-integration');
const MakrosystemIntegration = require('./makrosystem-integration');

class DataSync {
    constructor() {
        this.claude = new ClaudeCode({
            apiKey: process.env.CLAUDE_API_KEY,
            model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229'
        });

        this.calima = new CalimaIntegration();
        this.makrosystem = new MakrosystemIntegration();

        this.syncConfig = {
            batchSize: parseInt(process.env.SYNC_BATCH_SIZE) || 100,
            timeout: parseInt(process.env.SYNC_TIMEOUT) || 300000,
            retryAttempts: 3,
            conflictResolution: 'claude' // 'claude', 'calima', 'makrosystem', 'manual'
        };

        this.syncLog = [];
    }

    async syncBetweenSystems() {
        try {
            console.log('🔄 Iniciando sincronização bidirecional Calima ↔ Makrosystem...');

            const syncResult = {
                startTime: moment().toISOString(),
                calima: {},
                makrosystem: {},
                conflicts: [],
                resolved: [],
                errors: [],
                summary: {}
            };

            // Obter dados de ambos os sistemas
            console.log('📥 Coletando dados do Calima...');
            const calimaData = await this.getCalimaData();

            console.log('📥 Coletando dados do Makrosystem...');
            const makrosystemData = await this.getMakrosystemData();

            // Comparar e identificar diferenças
            console.log('🔍 Identificando diferenças entre sistemas...');
            const differences = await this.identifyDifferences(calimaData, makrosystemData);

            // Resolver conflitos com Claude
            if (differences.conflicts.length > 0) {
                console.log(`⚠️ Encontrados ${differences.conflicts.length} conflitos. Resolvendo com Claude...`);
                differences.resolved = await this.resolveConflictsWithClaude(differences.conflicts);
            }

            // Aplicar sincronização
            console.log('💾 Aplicando sincronização...');
            const syncResults = await this.applySynchronization(differences);

            syncResult.calima = syncResults.calima;
            syncResult.makrosystem = syncResults.makrosystem;
            syncResult.conflicts = differences.conflicts;
            syncResult.resolved = differences.resolved;
            syncResult.errors = syncResults.errors;

            // Gerar resumo
            syncResult.summary = this.generateSyncSummary(syncResult);
            syncResult.endTime = moment().toISOString();

            // Salvar log da sincronização
            await this.saveSyncLog(syncResult);

            console.log('✅ Sincronização concluída com sucesso');
            return syncResult;

        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            throw error;
        }
    }

    async getCalimaData() {
        try {
            await this.calima.initialize();
            await this.calima.login();

            // Obter dados principais do Calima
            const data = {
                clients: await this.getClientDataCalima(),
                documents: await this.getDocumentsCalima(),
                accounts: await this.getAccountsCalima(),
                movements: await this.getMovementsCalima()
            };

            await this.calima.cleanup();
            return data;

        } catch (error) {
            console.error('❌ Erro ao obter dados do Calima:', error);
            await this.calima.cleanup();
            throw error;
        }
    }

    async getMakrosystemData() {
        try {
            await this.makrosystem.initialize();
            await this.makrosystem.login();

            // Obter dados principais do Makrosystem
            const data = {
                clients: await this.getClientDataMakrosystem(),
                documents: await this.getDocumentsMakrosystem(),
                accounts: await this.getAccountsMakrosystem(),
                movements: await this.getMovementsMakrosystem()
            };

            await this.makrosystem.cleanup();
            return data;

        } catch (error) {
            console.error('❌ Erro ao obter dados do Makrosystem:', error);
            await this.makrosystem.cleanup();
            throw error;
        }
    }

    async getClientDataCalima() {
        return await this.calima.page.evaluate(() => {
            const clients = document.querySelectorAll('.client-item');
            return Array.from(clients).map(client => ({
                id: client.dataset.clientId,
                name: client.querySelector('.client-name').textContent.trim(),
                cnpj: client.querySelector('.client-cnpj').textContent.trim(),
                status: client.querySelector('.client-status').textContent.trim(),
                lastUpdate: client.querySelector('.client-updated').textContent.trim(),
                system: 'calima'
            }));
        });
    }

    async getClientDataMakrosystem() {
        return await this.makrosystem.page.evaluate(() => {
            const clients = document.querySelectorAll('.cliente-item');
            return Array.from(clients).map(client => ({
                id: client.dataset.clienteId,
                name: client.querySelector('.cliente-nome').textContent.trim(),
                cnpj: client.querySelector('.cliente-cnpj').textContent.trim(),
                status: client.querySelector('.cliente-status').textContent.trim(),
                lastUpdate: client.querySelector('.cliente-updated').textContent.trim(),
                system: 'makrosystem'
            }));
        });
    }

    async identifyDifferences(calimaData, makrosystemData) {
        console.log('🔍 Analisando diferenças entre sistemas...');

        const differences = {
            clients: await this.compareClients(calimaData.clients, makrosystemData.clients),
            documents: await this.compareDocuments(calimaData.documents, makrosystemData.documents),
            accounts: await this.compareAccounts(calimaData.accounts, makrosystemData.accounts),
            movements: await this.compareMovements(calimaData.movements, makrosystemData.movements),
            conflicts: [],
            resolved: []
        };

        // Consolidar conflitos
        differences.conflicts = [
            ...differences.clients.conflicts,
            ...differences.documents.conflicts,
            ...differences.accounts.conflicts,
            ...differences.movements.conflicts
        ];

        return differences;
    }

    async compareClients(calimaClients, makrosystemClients) {
        const comparison = {
            onlyInCalima: [],
            onlyInMakrosystem: [],
            different: [],
            conflicts: []
        };

        // Criar mapas por CNPJ para comparação
        const calimaMap = new Map(calimaClients.map(c => [c.cnpj, c]));
        const makrosystemMap = new Map(makrosystemClients.map(c => [c.cnpj, c]));

        // Identificar clientes apenas no Calima
        for (const [cnpj, client] of calimaMap) {
            if (!makrosystemMap.has(cnpj)) {
                comparison.onlyInCalima.push(client);
            }
        }

        // Identificar clientes apenas no Makrosystem
        for (const [cnpj, client] of makrosystemMap) {
            if (!calimaMap.has(cnpj)) {
                comparison.onlyInMakrosystem.push(client);
            }
        }

        // Identificar diferenças em clientes existentes em ambos
        for (const [cnpj, calimaClient] of calimaMap) {
            const makrosystemClient = makrosystemMap.get(cnpj);
            if (makrosystemClient) {
                const differences = this.findClientDifferences(calimaClient, makrosystemClient);
                if (differences.length > 0) {
                    comparison.different.push({
                        cnpj: cnpj,
                        calima: calimaClient,
                        makrosystem: makrosystemClient,
                        differences: differences
                    });

                    // Adicionar como conflito se houver diferenças significativas
                    if (differences.some(d => ['name', 'status'].includes(d.field))) {
                        comparison.conflicts.push({
                            type: 'client',
                            cnpj: cnpj,
                            calima: calimaClient,
                            makrosystem: makrosystemClient,
                            differences: differences
                        });
                    }
                }
            }
        }

        return comparison;
    }

    findClientDifferences(client1, client2) {
        const differences = [];
        const fields = ['name', 'status', 'lastUpdate'];

        for (const field of fields) {
            if (client1[field] !== client2[field]) {
                differences.push({
                    field: field,
                    calima: client1[field],
                    makrosystem: client2[field]
                });
            }
        }

        return differences;
    }

    async resolveConflictsWithClaude(conflicts) {
        console.log(`🤖 Resolvendo ${conflicts.length} conflitos com Claude...`);

        const resolved = [];

        for (const conflict of conflicts) {
            try {
                const resolution = await this.resolveConflictWithClaude(conflict);
                resolved.push({
                    conflict: conflict,
                    resolution: resolution,
                    resolvedAt: moment().toISOString()
                });
            } catch (error) {
                console.error(`❌ Erro ao resolver conflito:`, error);
                resolved.push({
                    conflict: conflict,
                    resolution: { error: error.message },
                    resolvedAt: moment().toISOString()
                });
            }
        }

        return resolved;
    }

    async resolveConflictWithClaude(conflict) {
        const prompt = `
Como especialista em sistemas contábeis da ${process.env.COMPANY_NAME} (CRC ${process.env.CRC_NUMBER}),
resolva o seguinte conflito entre os sistemas Calima e Makrosystem:

TIPO DE CONFLITO: ${conflict.type}
IDENTIFICADOR: ${conflict.cnpj || conflict.id}

DADOS NO CALIMA:
${JSON.stringify(conflict.calima, null, 2)}

DADOS NO MAKROSYSTEM:
${JSON.stringify(conflict.makrosystem, null, 2)}

DIFERENÇAS IDENTIFICADAS:
${JSON.stringify(conflict.differences, null, 2)}

Forneça a resolução recomendada considerando:
1. Integridade dos dados contábeis
2. Conformidade fiscal
3. Consistência entre sistemas
4. Qual fonte é mais confiável
5. Ação específica a ser tomada

Responda em JSON com a estrutura:
{
  "action": "update_calima|update_makrosystem|merge|manual_review",
  "reasoning": "explicação da decisão",
  "targetValue": "valor final recomendado",
  "priority": "high|medium|low",
  "additionalSteps": ["passos adicionais necessários"]
}
        `;

        const resolution = await this.claude.analyze(prompt, {
            maxTokens: 1000,
            temperature: 0.2
        });

        return resolution;
    }

    async applySynchronization(differences) {
        console.log('💾 Aplicando sincronização nos sistemas...');

        const results = {
            calima: { updated: 0, created: 0, errors: [] },
            makrosystem: { updated: 0, created: 0, errors: [] },
            errors: []
        };

        try {
            // Aplicar resoluções de conflitos
            for (const resolved of differences.resolved) {
                if (resolved.resolution.error) continue;

                await this.applyResolution(resolved, results);
            }

            // Sincronizar dados únicos de cada sistema
            await this.syncUniqueData(differences, results);

            return results;

        } catch (error) {
            console.error('❌ Erro ao aplicar sincronização:', error);
            results.errors.push(error.message);
            return results;
        }
    }

    async applyResolution(resolved, results) {
        const { conflict, resolution } = resolved;

        try {
            switch (resolution.action) {
                case 'update_calima':
                    await this.updateCalimaData(conflict, resolution.targetValue);
                    results.calima.updated++;
                    break;

                case 'update_makrosystem':
                    await this.updateMakrosystemData(conflict, resolution.targetValue);
                    results.makrosystem.updated++;
                    break;

                case 'merge':
                    await this.mergeData(conflict, resolution.targetValue);
                    results.calima.updated++;
                    results.makrosystem.updated++;
                    break;

                case 'manual_review':
                    console.log(`⚠️ Revisão manual necessária: ${conflict.cnpj || conflict.id}`);
                    await this.flagForManualReview(conflict, resolution);
                    break;
            }

            console.log(`✅ Resolução aplicada: ${resolution.action} para ${conflict.cnpj || conflict.id}`);

        } catch (error) {
            console.error(`❌ Erro ao aplicar resolução:`, error);
            results.errors.push(`${conflict.cnpj || conflict.id}: ${error.message}`);
        }
    }

    async syncUniqueData(differences, results) {
        // Sincronizar clientes únicos do Calima para Makrosystem
        for (const client of differences.clients.onlyInCalima) {
            try {
                await this.createClientInMakrosystem(client);
                results.makrosystem.created++;
            } catch (error) {
                results.errors.push(`Erro ao criar cliente ${client.cnpj} no Makrosystem: ${error.message}`);
            }
        }

        // Sincronizar clientes únicos do Makrosystem para Calima
        for (const client of differences.clients.onlyInMakrosystem) {
            try {
                await this.createClientInCalima(client);
                results.calima.created++;
            } catch (error) {
                results.errors.push(`Erro ao criar cliente ${client.cnpj} no Calima: ${error.message}`);
            }
        }
    }

    async syncClientData(clientName) {
        try {
            console.log(`🔄 Sincronizando dados específicos do cliente: ${clientName}`);

            // Obter dados do cliente em ambos os sistemas
            const calimaClient = await this.getClientFromCalima(clientName);
            const makrosystemClient = await this.getClientFromMakrosystem(clientName);

            if (!calimaClient && !makrosystemClient) {
                throw new Error(`Cliente ${clientName} não encontrado em nenhum sistema`);
            }

            const syncResult = {
                client: clientName,
                startTime: moment().toISOString(),
                actions: [],
                errors: []
            };

            // Sincronizar dados do cliente
            if (calimaClient && !makrosystemClient) {
                await this.createClientInMakrosystem(calimaClient);
                syncResult.actions.push('Cliente criado no Makrosystem');
            } else if (!calimaClient && makrosystemClient) {
                await this.createClientInCalima(makrosystemClient);
                syncResult.actions.push('Cliente criado no Calima');
            } else {
                // Ambos existem, verificar diferenças
                const differences = this.findClientDifferences(calimaClient, makrosystemClient);
                if (differences.length > 0) {
                    const resolution = await this.resolveConflictWithClaude({
                        type: 'client',
                        cnpj: calimaClient.cnpj,
                        calima: calimaClient,
                        makrosystem: makrosystemClient,
                        differences: differences
                    });

                    await this.applyResolution({ conflict: { cnpj: calimaClient.cnpj }, resolution }, {
                        calima: { updated: 0, created: 0, errors: [] },
                        makrosystem: { updated: 0, created: 0, errors: [] },
                        errors: syncResult.errors
                    });

                    syncResult.actions.push(`Diferenças resolvidas: ${resolution.action}`);
                }
            }

            syncResult.endTime = moment().toISOString();
            return syncResult;

        } catch (error) {
            console.error(`❌ Erro na sincronização do cliente ${clientName}:`, error);
            throw error;
        }
    }

    generateSyncSummary(syncResult) {
        return {
            duration: moment(syncResult.endTime).diff(moment(syncResult.startTime), 'minutes'),
            conflictsFound: syncResult.conflicts.length,
            conflictsResolved: syncResult.resolved.length,
            calimaUpdates: syncResult.calima.updated || 0,
            calimaCreations: syncResult.calima.created || 0,
            makrosystemUpdates: syncResult.makrosystem.updated || 0,
            makrosystemCreations: syncResult.makrosystem.created || 0,
            totalErrors: syncResult.errors.length,
            successRate: `${(((syncResult.resolved.length / Math.max(syncResult.conflicts.length, 1)) * 100)).toFixed(2)}%`
        };
    }

    async saveSyncLog(syncResult) {
        const logsDir = path.join(__dirname, '../logs/sync');
        await fs.ensureDir(logsDir);

        const filename = `sync-${moment().format('YYYY-MM-DD-HH-mm-ss')}.json`;
        const filepath = path.join(logsDir, filename);

        await fs.writeJson(filepath, syncResult, { spaces: 2 });
        console.log(`📝 Log de sincronização salvo: ${filepath}`);
    }

    // Métodos auxiliares (implementação simplificada)
    async getDocumentsCalima() { return []; }
    async getAccountsCalima() { return []; }
    async getMovementsCalima() { return []; }
    async getDocumentsMakrosystem() { return []; }
    async getAccountsMakrosystem() { return []; }
    async getMovementsMakrosystem() { return []; }
    async compareDocuments() { return { conflicts: [] }; }
    async compareAccounts() { return { conflicts: [] }; }
    async compareMovements() { return { conflicts: [] }; }
    async updateCalimaData() { }
    async updateMakrosystemData() { }
    async mergeData() { }
    async flagForManualReview() { }
    async createClientInMakrosystem() { }
    async createClientInCalima() { }
    async getClientFromCalima() { return null; }
    async getClientFromMakrosystem() { return null; }
}

module.exports = DataSync;

// Execução direta
if (require.main === module) {
    const sync = new DataSync();

    const args = process.argv.slice(2);
    const command = args[0];
    const parameter = args[1];

    switch (command) {
        case 'full-sync':
            sync.syncBetweenSystems()
                .then(result => {
                    console.log('✅ Sincronização completa finalizada:', JSON.stringify(result.summary, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Erro na sincronização:', error.message);
                    process.exit(1);
                });
            break;

        case 'sync-client':
            if (!parameter) {
                console.error('❌ Nome do cliente é obrigatório');
                process.exit(1);
            }
            sync.syncClientData(parameter)
                .then(result => {
                    console.log('✅ Sincronização do cliente finalizada:', JSON.stringify(result, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Erro:', error.message);
                    process.exit(1);
                });
            break;

        default:
            console.log(`
🔄 Pedro Tiago Contabilidade - Sincronização de Dados

Comandos disponíveis:
  node data-sync.js full-sync
  node data-sync.js sync-client "Nome do Cliente"

Exemplos:
  node data-sync.js full-sync
  node data-sync.js sync-client "Empresa ABC Ltda"

Contato: pedrotiago@pedrotiagocontabilidade.com.br
WhatsApp: 62999948445
            `);
            process.exit(0);
    }
}