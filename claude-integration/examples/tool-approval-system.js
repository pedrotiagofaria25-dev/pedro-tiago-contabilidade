/**
 * Claude Code Tool Approval System
 * Pedro Tiago Contabilidade - Sistema de Aprovação de Ferramentas
 */

import { query } from "@anthropic-ai/claude-code";
import readline from "readline";
import { EventEmitter } from "events";
import { writeFileSync, appendFileSync, existsSync } from "fs";
import chalk from "chalk"; // Para colorir output (opcional)

/**
 * Sistema de aprovação de ferramentas com controle granular
 */
class ToolApprovalSystem extends EventEmitter {
  constructor() {
    super();
    this.approvalHistory = [];
    this.toolPolicies = new Map();
    this.autoApproveList = new Set();
    this.autoDenyList = new Set();
    this.rl = null;
    this.logFile = `tool-approval-log-${Date.now()}.txt`;

    // Configurações padrão para ferramentas contábeis
    this.setupDefaultPolicies();
  }

  /**
   * Configura políticas padrão para ferramentas
   */
  setupDefaultPolicies() {
    // Ferramentas sempre aprovadas (baixo risco)
    this.autoApproveList.add('Read');
    this.autoApproveList.add('Grep');
    this.autoApproveList.add('Glob');

    // Ferramentas sempre negadas (alto risco)
    this.autoDenyList.add('DeleteDatabase');
    this.autoDenyList.add('FormatDisk');

    // Políticas específicas por ferramenta
    this.toolPolicies.set('Bash', {
      requireApproval: true,
      allowedCommands: ['ls', 'pwd', 'echo', 'node', 'python', 'npm'],
      deniedCommands: ['rm -rf', 'format', 'del /f'],
      maxExecutionTime: 30000
    });

    this.toolPolicies.set('Write', {
      requireApproval: true,
      allowedPaths: [
        'C:\\Users\\pedro\\GitHub\\pedro-tiago-contabilidade',
        'C:\\Users\\pedro\\temp'
      ],
      deniedPaths: ['C:\\Windows', 'C:\\Program Files'],
      maxFileSize: 10 * 1024 * 1024 // 10MB
    });

    this.toolPolicies.set('Edit', {
      requireApproval: false, // Edições são geralmente seguras
      backupBeforeEdit: true,
      maxChanges: 1000
    });
  }

  /**
   * Prompt principal para aprovação de ferramenta
   */
  async promptForToolApproval(toolName, input) {
    console.log("\n" + "═".repeat(60));
    console.log("🔧 SOLICITAÇÃO DE FERRAMENTA");
    console.log("═".repeat(60));
    console.log(`   Ferramenta: ${this.formatToolName(toolName)}`);
    console.log(`   Timestamp: ${new Date().toLocaleTimeString()}`);

    // Exibe parâmetros da ferramenta
    if (input && Object.keys(input).length > 0) {
      console.log("\n   📋 Parâmetros:");
      for (const [key, value] of Object.entries(input)) {
        const displayValue = this.formatParameterValue(key, value);
        console.log(`     ${key}: ${displayValue}`);
      }
    }

    // Análise de risco
    const riskAnalysis = await this.analyzeToolRisk(toolName, input);
    this.displayRiskAnalysis(riskAnalysis);

    // Verifica políticas automáticas
    const autoDecision = this.checkAutoPolicies(toolName, input);
    if (autoDecision) {
      return autoDecision;
    }

    // Obtém aprovação do usuário
    const decision = await this.getUserApproval(toolName, input, riskAnalysis);

    // Registra decisão
    this.logDecision(toolName, input, decision, riskAnalysis);

    return decision;
  }

  /**
   * Formata nome da ferramenta com emoji apropriado
   */
  formatToolName(toolName) {
    const toolEmojis = {
      'Read': '📖',
      'Write': '✍️',
      'Edit': '✏️',
      'Bash': '💻',
      'Delete': '🗑️',
      'WebFetch': '🌐',
      'Database': '🗄️'
    };

    const emoji = toolEmojis[toolName] || '🔧';
    return `${emoji} ${toolName}`;
  }

  /**
   * Formata valor do parâmetro para exibição
   */
  formatParameterValue(key, value) {
    if (typeof value === 'string') {
      // Trunca strings longas
      if (value.length > 100) {
        return value.substring(0, 100) + "...";
      }

      // Destaca caminhos de arquivo
      if (key === 'file_path' || key === 'path') {
        return `📁 ${value}`;
      }

      // Destaca comandos
      if (key === 'command') {
        return `$ ${value}`;
      }

      return value;
    } else if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    } else if (typeof value === 'boolean') {
      return value ? '✅ true' : '❌ false';
    }

    return String(value);
  }

  /**
   * Analisa risco da operação
   */
  async analyzeToolRisk(toolName, input) {
    const analysis = {
      riskLevel: 'low',
      score: 0,
      factors: [],
      recommendations: []
    };

    // Análise específica por ferramenta
    switch (toolName) {
      case 'Bash':
        if (input.command) {
          // Comandos perigosos
          if (input.command.includes('rm') || input.command.includes('del')) {
            analysis.score += 50;
            analysis.factors.push('Comando de exclusão detectado');
          }
          if (input.command.includes('sudo') || input.command.includes('admin')) {
            analysis.score += 30;
            analysis.factors.push('Privilégios elevados solicitados');
          }
          if (input.command.includes('curl') || input.command.includes('wget')) {
            analysis.score += 20;
            analysis.factors.push('Download de conteúdo externo');
          }
        }
        break;

      case 'Write':
        if (input.file_path) {
          // Arquivos críticos
          if (input.file_path.includes('config') || input.file_path.includes('.env')) {
            analysis.score += 40;
            analysis.factors.push('Modificação de arquivo de configuração');
          }
          if (input.file_path.includes('C:\\Windows')) {
            analysis.score += 80;
            analysis.factors.push('Tentativa de escrita em diretório do sistema');
          }
        }
        break;

      case 'Edit':
        if (input.old_string && input.new_string) {
          // Mudanças sensíveis
          if (input.old_string.includes('password') || input.new_string.includes('password')) {
            analysis.score += 60;
            analysis.factors.push('Modificação envolvendo senhas');
          }
        }
        break;

      case 'Database':
        if (input.query) {
          // Queries perigosas
          if (input.query.includes('DROP') || input.query.includes('TRUNCATE')) {
            analysis.score += 70;
            analysis.factors.push('Query destrutiva detectada');
          }
          if (input.query.includes('DELETE') && !input.query.includes('WHERE')) {
            analysis.score += 60;
            analysis.factors.push('DELETE sem cláusula WHERE');
          }
        }
        break;
    }

    // Calcula nível de risco
    if (analysis.score >= 70) {
      analysis.riskLevel = 'high';
      analysis.recommendations.push('Revisar cuidadosamente antes de aprovar');
      analysis.recommendations.push('Considerar fazer backup antes');
    } else if (analysis.score >= 40) {
      analysis.riskLevel = 'medium';
      analysis.recommendations.push('Verificar parâmetros da operação');
    } else {
      analysis.riskLevel = 'low';
      analysis.recommendations.push('Operação geralmente segura');
    }

    return analysis;
  }

  /**
   * Exibe análise de risco
   */
  displayRiskAnalysis(analysis) {
    console.log("\n   🔍 Análise de Risco:");

    const riskColors = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🔴'
    };

    console.log(`     Nível: ${riskColors[analysis.riskLevel]} ${analysis.riskLevel.toUpperCase()}`);
    console.log(`     Score: ${analysis.score}/100`);

    if (analysis.factors.length > 0) {
      console.log("\n   ⚠️ Fatores de Risco:");
      analysis.factors.forEach(factor => {
        console.log(`     • ${factor}`);
      });
    }

    if (analysis.recommendations.length > 0) {
      console.log("\n   💡 Recomendações:");
      analysis.recommendations.forEach(rec => {
        console.log(`     • ${rec}`);
      });
    }
  }

  /**
   * Verifica políticas automáticas
   */
  checkAutoPolicies(toolName, input) {
    // Auto-aprovar ferramentas na lista
    if (this.autoApproveList.has(toolName)) {
      console.log(`\n   ✅ Auto-aprovado (ferramenta na lista de confiança)`);
      return {
        behavior: "allow",
        updatedInput: input,
        automatic: true
      };
    }

    // Auto-negar ferramentas perigosas
    if (this.autoDenyList.has(toolName)) {
      console.log(`\n   ❌ Auto-negado (ferramenta bloqueada por política)`);
      return {
        behavior: "deny",
        message: "Tool blocked by security policy",
        automatic: true
      };
    }

    // Verifica políticas específicas
    const policy = this.toolPolicies.get(toolName);
    if (policy && !policy.requireApproval) {
      console.log(`\n   ✅ Auto-aprovado (não requer aprovação manual)`);
      return {
        behavior: "allow",
        updatedInput: input,
        automatic: true
      };
    }

    return null; // Requer aprovação manual
  }

  /**
   * Obtém aprovação do usuário
   */
  async getUserApproval(toolName, input, riskAnalysis) {
    return new Promise((resolve) => {
      if (!this.rl) {
        this.rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
      }

      console.log("\n   ═════════════════════════════════════════");
      console.log("   Opções:");
      console.log("     [A] Aprovar esta operação");
      console.log("     [D] Negar esta operação");
      console.log("     [M] Modificar parâmetros");
      console.log("     [S] Sempre aprovar " + toolName);
      console.log("     [N] Nunca aprovar " + toolName);
      console.log("     [I] Mais informações");
      console.log("   ═════════════════════════════════════════");

      this.rl.question('\n   Sua decisão [A/D/M/S/N/I]: ', async (answer) => {
        const choice = answer.toUpperCase();

        switch (choice) {
          case 'A':
            console.log("   ✅ Aprovado\n");
            resolve({
              behavior: "allow",
              updatedInput: input
            });
            break;

          case 'D':
            console.log("   ❌ Negado\n");
            resolve({
              behavior: "deny",
              message: "User denied permission"
            });
            break;

          case 'M':
            const modifiedInput = await this.modifyParameters(input);
            console.log("   ✅ Aprovado com modificações\n");
            resolve({
              behavior: "allow",
              updatedInput: modifiedInput
            });
            break;

          case 'S':
            this.autoApproveList.add(toolName);
            console.log(`   ✅ ${toolName} adicionado à lista de auto-aprovação\n`);
            resolve({
              behavior: "allow",
              updatedInput: input
            });
            break;

          case 'N':
            this.autoDenyList.add(toolName);
            console.log(`   ❌ ${toolName} adicionado à lista de bloqueio\n`);
            resolve({
              behavior: "deny",
              message: "Tool blocked by user preference"
            });
            break;

          case 'I':
            await this.showMoreInfo(toolName, input, riskAnalysis);
            // Recursivamente pede decisão novamente
            resolve(await this.getUserApproval(toolName, input, riskAnalysis));
            break;

          default:
            console.log("   ⚠️ Opção inválida. Negando por segurança.\n");
            resolve({
              behavior: "deny",
              message: "Invalid option - denied for safety"
            });
        }
      });
    });
  }

  /**
   * Permite modificar parâmetros antes da aprovação
   */
  async modifyParameters(input) {
    const modifiedInput = { ...input };

    console.log("\n   📝 Modificar Parâmetros:");
    console.log("   (Pressione ENTER para manter o valor atual)");

    for (const [key, value] of Object.entries(input)) {
      await new Promise((resolve) => {
        this.rl.question(`     ${key} [${value}]: `, (newValue) => {
          if (newValue.trim()) {
            modifiedInput[key] = newValue.trim();
          }
          resolve();
        });
      });
    }

    return modifiedInput;
  }

  /**
   * Mostra informações detalhadas
   */
  async showMoreInfo(toolName, input, riskAnalysis) {
    console.log("\n   ═══════════════════════════════════════════");
    console.log("   📚 INFORMAÇÕES DETALHADAS");
    console.log("   ═══════════════════════════════════════════");

    console.log(`\n   Ferramenta: ${toolName}`);
    console.log(`   Descrição: ${this.getToolDescription(toolName)}`);

    console.log("\n   Parâmetros Completos:");
    console.log(JSON.stringify(input, null, 4));

    console.log("\n   Histórico Recente:");
    const recentHistory = this.approvalHistory
      .filter(h => h.toolName === toolName)
      .slice(-5);

    if (recentHistory.length > 0) {
      recentHistory.forEach(h => {
        console.log(`     • ${h.timestamp}: ${h.decision.behavior}`);
      });
    } else {
      console.log("     Nenhum histórico para esta ferramenta");
    }

    console.log("\n   Pressione ENTER para continuar...");
    await new Promise(resolve => {
      this.rl.question('', resolve);
    });
  }

  /**
   * Retorna descrição da ferramenta
   */
  getToolDescription(toolName) {
    const descriptions = {
      'Read': 'Lê conteúdo de arquivos',
      'Write': 'Cria ou sobrescreve arquivos',
      'Edit': 'Modifica arquivos existentes',
      'Bash': 'Executa comandos do sistema',
      'Database': 'Executa queries no banco de dados',
      'WebFetch': 'Busca conteúdo da web',
      'Delete': 'Remove arquivos ou diretórios'
    };

    return descriptions[toolName] || 'Ferramenta de propósito geral';
  }

  /**
   * Registra decisão no histórico
   */
  logDecision(toolName, input, decision, riskAnalysis) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      toolName,
      input,
      decision,
      riskAnalysis,
      automatic: decision.automatic || false
    };

    this.approvalHistory.push(logEntry);

    // Salva em arquivo
    appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');

    // Emite evento
    this.emit('decision', logEntry);
  }

  /**
   * Fecha interface readline
   */
  close() {
    if (this.rl) {
      this.rl.close();
    }

    // Salva configurações
    this.saveConfiguration();
  }

  /**
   * Salva configuração atual
   */
  saveConfiguration() {
    const config = {
      autoApproveList: Array.from(this.autoApproveList),
      autoDenyList: Array.from(this.autoDenyList),
      toolPolicies: Object.fromEntries(this.toolPolicies),
      timestamp: new Date().toISOString()
    };

    writeFileSync('tool-approval-config.json', JSON.stringify(config, null, 2));
    console.log("\n💾 Configuração salva em tool-approval-config.json");
  }
}

/**
 * Exemplo de uso com Claude Code
 */
async function runWithApprovalSystem() {
  console.log("🚀 Sistema de Aprovação de Ferramentas Ativo");
  console.log("=" .repeat(60));

  const approvalSystem = new ToolApprovalSystem();

  try {
    const result = await query({
      prompt: "Optimize the tax calculation system and create tests",
      options: {
        maxTurns: 10,
        allowedTools: ["Read", "Edit", "Write", "Bash"],
        toolApprovalCallback: async (toolName, input) => {
          return await approvalSystem.promptForToolApproval(toolName, input);
        }
      }
    });

    for await (const message of result) {
      if (message.type === "tool_use") {
        console.log(`🔧 Ferramenta aprovada: ${message.tool}`);
      } else if (message.type === "result") {
        console.log("✅ Operação concluída");
      }
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    approvalSystem.close();
  }
}

/**
 * Exemplo simples de aprovação
 */
async function simpleApprovalExample() {
  const approvalSystem = new ToolApprovalSystem();

  // Simula solicitação de ferramenta
  const decision = await approvalSystem.promptForToolApproval('Bash', {
    command: 'npm test',
    timeout: 30000
  });

  console.log("Decisão:", decision);

  approvalSystem.close();
}

// Exportar classes e funções
export {
  ToolApprovalSystem,
  runWithApprovalSystem,
  simpleApprovalExample
};

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--full') {
    runWithApprovalSystem().catch(console.error);
  } else if (args[0] === '--simple') {
    simpleApprovalExample().catch(console.error);
  } else {
    console.log(`
Uso: node tool-approval-system.js [opção]

Opções:
  --full     Executa sistema completo com Claude Code
  --simple   Exemplo simples de aprovação

Exemplos:
  node tool-approval-system.js --full
  node tool-approval-system.js --simple
    `);
  }
}