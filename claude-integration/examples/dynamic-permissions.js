/**
 * Claude Code Dynamic Permissions Manager
 * Pedro Tiago Contabilidade - Controle Dinâmico de Permissões
 */

import { query } from "@anthropic-ai/claude-code";
import { EventEmitter } from "events";
import { readFileSync, writeFileSync } from "fs";

/**
 * Gerenciador de permissões dinâmicas para desenvolvimento ágil
 */
class DynamicPermissionsManager extends EventEmitter {
  constructor() {
    super();
    this.currentMode = 'default';
    this.messageQueue = [];
    this.sessionActive = false;
    this.permissionHistory = [];
    this.automationLevel = 'conservative'; // conservative, moderate, aggressive
  }

  /**
   * Cria um gerador assíncrono para entrada de streaming
   */
  async* createStreamingInput() {
    // Mensagem inicial com permissões padrão
    yield {
      type: 'user',
      message: {
        role: 'user',
        content: "Let's start with default permissions to review the accounting system architecture"
      }
    };

    // Aguarda processamento
    await this.delay(2000);

    // Analisa resposta e ajusta nível de automação
    if (this.shouldIncreaseAutomation()) {
      yield {
        type: 'user',
        message: {
          role: 'user',
          content: "Now let's speed up development - enable automatic edits for refactoring"
        }
      };
    }

    // Processa fila de mensagens dinâmicas
    while (this.sessionActive) {
      if (this.messageQueue.length > 0) {
        const nextMessage = this.messageQueue.shift();
        yield nextMessage;
      }
      await this.delay(100);
    }
  }

  /**
   * Gerencia sessão com permissões dinâmicas
   */
  async manageDynamicSession() {
    console.log("🚀 Iniciando Sessão com Permissões Dinâmicas");
    console.log("=" .repeat(60));

    this.sessionActive = true;

    try {
      // Inicia query com streaming
      const q = query({
        prompt: this.createStreamingInput(),
        options: {
          permissionMode: this.currentMode,
          maxTurns: 10,
          allowedTools: ["Read", "Edit", "Write", "Bash"],
          temperature: 0.3
        }
      });

      // Monitora progresso e ajusta permissões
      this.monitorProgress(q);

      // Processa mensagens
      for await (const message of q) {
        await this.processMessage(message, q);
      }

    } catch (error) {
      console.error("❌ Erro na sessão:", error);
    } finally {
      this.sessionActive = false;
      this.generatePermissionReport();
    }
  }

  /**
   * Processa mensagem e ajusta permissões se necessário
   */
  async processMessage(message, queryInstance) {
    console.log(`\n📨 Mensagem tipo: ${message.type}`);

    switch (message.type) {
      case 'result':
        console.log("📊 Resultado:", message.result.substring(0, 200) + "...");
        this.analyzeResult(message.result);
        break;

      case 'tool_use':
        console.log(`🔧 Ferramenta: ${message.tool}`);
        await this.handleToolUse(message, queryInstance);
        break;

      case 'permission_request':
        console.log(`🔐 Solicitação de permissão: ${message.permission}`);
        await this.handlePermissionRequest(message, queryInstance);
        break;

      case 'edit':
        console.log(`✏️ Edição em: ${message.file}`);
        this.trackEdit(message);
        break;

      case 'error':
        console.error(`❌ Erro: ${message.error}`);
        await this.handleError(message, queryInstance);
        break;
    }
  }

  /**
   * Monitora progresso e ajusta automação
   */
  monitorProgress(queryInstance) {
    let editCount = 0;
    let successCount = 0;
    let errorCount = 0;

    const interval = setInterval(async () => {
      if (!this.sessionActive) {
        clearInterval(interval);
        return;
      }

      // Análise de métricas
      const metrics = {
        edits: editCount,
        successes: successCount,
        errors: errorCount,
        efficiency: successCount / (editCount + 1)
      };

      // Ajusta nível de automação baseado em métricas
      if (metrics.efficiency > 0.9 && editCount > 5) {
        await this.increaseAutomation(queryInstance);
      } else if (metrics.errors > 3) {
        await this.decreaseAutomation(queryInstance);
      }

    }, 5000); // Verifica a cada 5 segundos
  }

  /**
   * Lida com uso de ferramentas
   */
  async handleToolUse(message, queryInstance) {
    const criticalTools = ['Bash', 'Write'];
    const tool = message.tool;

    // Se ferramenta crítica e modo conservador, solicita confirmação
    if (criticalTools.includes(tool) && this.automationLevel === 'conservative') {
      console.log(`⚠️ Ferramenta crítica detectada: ${tool}`);

      // Simula decisão do usuário (em produção, seria interativo)
      const approved = await this.simulateUserApproval(tool);

      if (!approved) {
        console.log("🚫 Operação negada pelo usuário");
        this.messageQueue.push({
          type: 'user',
          message: {
            role: 'user',
            content: `Skip this operation and continue with the next task`
          }
        });
      }
    }

    // Registra uso da ferramenta
    this.permissionHistory.push({
      timestamp: new Date().toISOString(),
      tool: tool,
      mode: this.currentMode,
      automationLevel: this.automationLevel
    });
  }

  /**
   * Lida com solicitações de permissão
   */
  async handlePermissionRequest(request, queryInstance) {
    console.log(`\n🔐 Analisando solicitação: ${request.permission}`);

    const decision = await this.makePermissionDecision(request);

    if (decision.approved) {
      console.log(`✅ Permissão concedida: ${request.permission}`);

      if (decision.changeMode) {
        await this.changePermissionMode(queryInstance, decision.newMode);
      }
    } else {
      console.log(`❌ Permissão negada: ${request.permission}`);
    }

    return decision;
  }

  /**
   * Decide sobre solicitações de permissão
   */
  async makePermissionDecision(request) {
    // Lógica de decisão baseada no nível de automação
    const decisions = {
      'conservative': {
        'edit': { approved: false, changeMode: false },
        'write': { approved: false, changeMode: false },
        'bash': { approved: false, changeMode: false }
      },
      'moderate': {
        'edit': { approved: true, changeMode: false },
        'write': { approved: false, changeMode: true, newMode: 'askEvery' },
        'bash': { approved: false, changeMode: false }
      },
      'aggressive': {
        'edit': { approved: true, changeMode: true, newMode: 'acceptEdits' },
        'write': { approved: true, changeMode: false },
        'bash': { approved: true, changeMode: false }
      }
    };

    const permission = request.permission.toLowerCase();
    return decisions[this.automationLevel][permission] ||
           { approved: false, changeMode: false };
  }

  /**
   * Aumenta nível de automação
   */
  async increaseAutomation(queryInstance) {
    const levels = ['conservative', 'moderate', 'aggressive'];
    const currentIndex = levels.indexOf(this.automationLevel);

    if (currentIndex < levels.length - 1) {
      this.automationLevel = levels[currentIndex + 1];
      console.log(`\n⬆️ Aumentando automação para: ${this.automationLevel}`);

      // Ajusta modo de permissão
      if (this.automationLevel === 'aggressive') {
        await this.changePermissionMode(queryInstance, 'acceptEdits');
      } else if (this.automationLevel === 'moderate') {
        await this.changePermissionMode(queryInstance, 'askEvery');
      }
    }
  }

  /**
   * Diminui nível de automação
   */
  async decreaseAutomation(queryInstance) {
    const levels = ['conservative', 'moderate', 'aggressive'];
    const currentIndex = levels.indexOf(this.automationLevel);

    if (currentIndex > 0) {
      this.automationLevel = levels[currentIndex - 1];
      console.log(`\n⬇️ Reduzindo automação para: ${this.automationLevel}`);

      await this.changePermissionMode(queryInstance, 'default');
    }
  }

  /**
   * Altera modo de permissão dinamicamente
   */
  async changePermissionMode(queryInstance, newMode) {
    console.log(`\n🔄 Alterando modo de permissão: ${this.currentMode} → ${newMode}`);

    try {
      await queryInstance.setPermissionMode(newMode);
      this.currentMode = newMode;

      // Registra mudança
      this.permissionHistory.push({
        timestamp: new Date().toISOString(),
        event: 'mode_change',
        from: this.currentMode,
        to: newMode,
        automationLevel: this.automationLevel
      });

      // Notifica mudança
      this.emit('permissionChanged', {
        oldMode: this.currentMode,
        newMode: newMode
      });

    } catch (error) {
      console.error(`❌ Erro ao alterar modo: ${error}`);
    }
  }

  /**
   * Rastreia edições para análise
   */
  trackEdit(editMessage) {
    this.permissionHistory.push({
      timestamp: new Date().toISOString(),
      event: 'edit',
      file: editMessage.file,
      linesChanged: editMessage.linesChanged || 0
    });
  }

  /**
   * Lida com erros e ajusta estratégia
   */
  async handleError(error, queryInstance) {
    console.error(`\n⚠️ Erro detectado: ${error.error}`);

    // Se muitos erros, reduz automação
    const recentErrors = this.permissionHistory
      .filter(h => h.event === 'error' &&
              new Date() - new Date(h.timestamp) < 60000)
      .length;

    if (recentErrors > 2) {
      await this.decreaseAutomation(queryInstance);
    }

    this.permissionHistory.push({
      timestamp: new Date().toISOString(),
      event: 'error',
      error: error.error
    });
  }

  /**
   * Analisa resultado para ajustar estratégia
   */
  analyzeResult(result) {
    // Analisa qualidade do resultado
    const quality = this.assessResultQuality(result);

    if (quality.score > 0.8) {
      this.messageQueue.push({
        type: 'user',
        message: {
          role: 'user',
          content: 'Great work! Continue with the next optimization'
        }
      });
    }
  }

  /**
   * Avalia qualidade do resultado
   */
  assessResultQuality(result) {
    let score = 0.5; // Base score

    // Critérios de qualidade
    if (result.includes('successfully')) score += 0.1;
    if (result.includes('optimized')) score += 0.1;
    if (result.includes('improved')) score += 0.1;
    if (result.includes('error')) score -= 0.2;
    if (result.includes('failed')) score -= 0.3;

    return {
      score: Math.max(0, Math.min(1, score)),
      assessment: score > 0.7 ? 'good' : score > 0.4 ? 'acceptable' : 'poor'
    };
  }

  /**
   * Decide se deve aumentar automação
   */
  shouldIncreaseAutomation() {
    const recentSuccesses = this.permissionHistory
      .filter(h => h.event === 'success')
      .length;

    return recentSuccesses > 3 && this.automationLevel !== 'aggressive';
  }

  /**
   * Simula aprovação do usuário (para demo)
   */
  async simulateUserApproval(tool) {
    console.log(`\n❓ Solicitando aprovação para: ${tool}`);

    // Em produção, isso seria uma interface real
    // Por agora, aprova automaticamente ferramentas de leitura
    const autoApprove = ['Read', 'Grep', 'Glob'];

    const approved = autoApprove.includes(tool) ||
                    this.automationLevel === 'aggressive';

    console.log(approved ? '✅ Aprovado' : '❌ Negado');
    return approved;
  }

  /**
   * Gera relatório de permissões
   */
  generatePermissionReport() {
    console.log("\n" + "=" .repeat(60));
    console.log("📊 RELATÓRIO DE PERMISSÕES DINÂMICAS");
    console.log("=" .repeat(60));

    const modeChanges = this.permissionHistory
      .filter(h => h.event === 'mode_change').length;

    const toolUses = this.permissionHistory
      .filter(h => h.tool).length;

    const edits = this.permissionHistory
      .filter(h => h.event === 'edit').length;

    const errors = this.permissionHistory
      .filter(h => h.event === 'error').length;

    console.log(`\n📈 Estatísticas:`);
    console.log(`   Mudanças de modo: ${modeChanges}`);
    console.log(`   Uso de ferramentas: ${toolUses}`);
    console.log(`   Edições realizadas: ${edits}`);
    console.log(`   Erros encontrados: ${errors}`);
    console.log(`   Nível final de automação: ${this.automationLevel}`);
    console.log(`   Modo final de permissão: ${this.currentMode}`);

    // Salva histórico
    const reportPath = `permission-history-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify({
      summary: {
        modeChanges,
        toolUses,
        edits,
        errors,
        finalAutomationLevel: this.automationLevel,
        finalPermissionMode: this.currentMode
      },
      history: this.permissionHistory
    }, null, 2));

    console.log(`\n💾 Histórico salvo em: ${reportPath}`);
  }

  /**
   * Delay auxiliar
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Exemplo de uso com workflow contábil
 */
async function accountingWorkflowExample() {
  console.log("\n💼 Workflow Contábil com Permissões Dinâmicas");
  console.log("=" .repeat(60));

  const manager = new DynamicPermissionsManager();

  // Configura listeners
  manager.on('permissionChanged', (change) => {
    console.log(`\n🔔 Evento: Permissão alterada de ${change.oldMode} para ${change.newMode}`);
  });

  // Inicia com tarefas progressivas
  manager.messageQueue.push(
    {
      type: 'user',
      message: {
        role: 'user',
        content: 'Analyze the tax calculation module for optimization opportunities'
      }
    },
    {
      type: 'user',
      message: {
        role: 'user',
        content: 'Refactor the identified bottlenecks in the tax calculator'
      }
    },
    {
      type: 'user',
      message: {
        role: 'user',
        content: 'Add comprehensive tests for the refactored code'
      }
    }
  );

  // Executa sessão
  await manager.manageDynamicSession();
}

/**
 * Exemplo simples de mudança de modo
 */
async function simpleModeChangeExample() {
  console.log("\n🔄 Exemplo de Mudança de Modo Dinâmica");
  console.log("=" .repeat(50));

  // Gerador de entrada streaming
  async function* streamInput() {
    yield {
      type: 'user',
      message: {
        role: 'user',
        content: "Let's start with default permissions to review the code"
      }
    };

    // Aguarda análise inicial
    await new Promise(resolve => setTimeout(resolve, 3000));

    yield {
      type: 'user',
      message: {
        role: 'user',
        content: "Now let's speed up development - enable automatic edits"
      }
    };
  }

  try {
    const q = query({
      prompt: streamInput(),
      options: {
        permissionMode: 'default'
      }
    });

    // Processa algumas mensagens
    let messageCount = 0;
    for await (const message of q) {
      console.log(`Mensagem ${++messageCount}:`, message.type);

      // Após 3 mensagens, muda para modo aceitar edições
      if (messageCount === 3) {
        console.log("\n🔄 Alterando para modo acceptEdits...");
        await q.setPermissionMode('acceptEdits');
      }

      // Para após 10 mensagens
      if (messageCount >= 10) break;
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

// Exportar classes e funções
export {
  DynamicPermissionsManager,
  accountingWorkflowExample,
  simpleModeChangeExample
};

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--workflow') {
    accountingWorkflowExample().catch(console.error);
  } else if (args[0] === '--simple') {
    simpleModeChangeExample().catch(console.error);
  } else {
    console.log(`
Uso: node dynamic-permissions.js [opção]

Opções:
  --workflow    Executa workflow contábil com permissões dinâmicas
  --simple      Exemplo simples de mudança de modo

Exemplos:
  node dynamic-permissions.js --workflow
  node dynamic-permissions.js --simple
    `);
  }
}