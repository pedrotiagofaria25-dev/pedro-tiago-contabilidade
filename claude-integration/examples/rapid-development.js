/**
 * Claude Code Rapid Development Mode
 * Pedro Tiago Contabilidade - Desenvolvimento Ágil com Controle de Permissões
 */

import { query } from "@anthropic-ai/claude-code";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Gerenciador de desenvolvimento rápido com transição de modos
 */
class RapidDevelopmentManager {
  constructor() {
    this.developmentPhases = {
      'analysis': 'default',      // Fase inicial - modo controlado
      'prototyping': 'askEvery',  // Prototipagem - confirmação seletiva
      'development': 'acceptEdits', // Desenvolvimento - iteração rápida
      'review': 'default',        // Revisão final - modo controlado
      'deployment': 'askEvery'    // Deploy - confirmação importante
    };

    this.currentPhase = 'analysis';
    this.phaseHistory = [];
    this.metrics = {
      totalEdits: 0,
      autoAcceptedEdits: 0,
      rejectedEdits: 0,
      timeInPhases: {}
    };
  }

  /**
   * Executa desenvolvimento com transição automática de fases
   */
  async executeRapidDevelopment(projectPath) {
    console.log("🚀 Iniciando Desenvolvimento Rápido");
    console.log("=" .repeat(60));
    console.log(`📁 Projeto: ${projectPath}`);
    console.log(`📊 Fases: ${Object.keys(this.developmentPhases).join(' → ')}`);
    console.log("=" .repeat(60));

    try {
      // Fase 1: Análise (modo default)
      await this.runAnalysisPhase(projectPath);

      // Fase 2: Prototipagem (modo askEvery)
      await this.runPrototypingPhase(projectPath);

      // Fase 3: Desenvolvimento Rápido (modo acceptEdits)
      await this.runDevelopmentPhase(projectPath);

      // Fase 4: Revisão (modo default)
      await this.runReviewPhase(projectPath);

      // Fase 5: Deploy (modo askEvery)
      await this.runDeploymentPhase(projectPath);

      // Gerar relatório final
      this.generateDevelopmentReport();

    } catch (error) {
      console.error("❌ Erro no desenvolvimento:", error);
      await this.handleDevelopmentError(error);
    }
  }

  /**
   * Fase 1: Análise inicial com modo controlado
   */
  async runAnalysisPhase(projectPath) {
    console.log("\n📊 FASE 1: ANÁLISE");
    console.log("Modo: default (execução controlada)");
    console.log("-" .repeat(40));

    const startTime = Date.now();
    this.currentPhase = 'analysis';

    const q = query({
      prompt: `Analyze the accounting project at ${projectPath}. Identify:
        1. Current architecture and design patterns
        2. Code quality issues and technical debt
        3. Performance bottlenecks
        4. Security vulnerabilities
        5. Missing features or functionality`,
      options: {
        permissionMode: 'default', // Start in default mode for controlled execution
        maxTurns: 5,
        allowedTools: ["Read", "Grep", "Glob"],
        temperature: 0.3
      }
    });

    const analysisResults = [];

    for await (const message of q) {
      if (message.type === "result") {
        console.log("✅ Análise concluída");
        analysisResults.push(message.result);
      } else if (message.type === "tool_use") {
        console.log(`🔍 Analisando com: ${message.tool}`);
      }
    }

    this.phaseHistory.push({
      phase: 'analysis',
      duration: Date.now() - startTime,
      results: analysisResults.length,
      mode: 'default'
    });

    console.log(`⏱️ Tempo de análise: ${(Date.now() - startTime) / 1000}s`);
    return analysisResults;
  }

  /**
   * Fase 2: Prototipagem com confirmação seletiva
   */
  async runPrototypingPhase(projectPath) {
    console.log("\n🔧 FASE 2: PROTOTIPAGEM");
    console.log("Modo: askEvery (confirmação seletiva)");
    console.log("-" .repeat(40));

    const startTime = Date.now();
    this.currentPhase = 'prototyping';

    const q = query({
      prompt: `Create prototypes for the identified improvements:
        1. Design new API endpoints for tax calculations
        2. Create database schema for audit logging
        3. Implement caching strategy
        4. Add validation layer for fiscal documents`,
      options: {
        permissionMode: 'askEvery', // Pede confirmação para edições importantes
        maxTurns: 8,
        allowedTools: ["Read", "Write", "Edit"],
        temperature: 0.4
      }
    });

    let prototypeCount = 0;

    for await (const message of q) {
      if (message.type === "permission_request") {
        console.log(`❓ Solicitação de permissão: ${message.action}`);
        // Em produção, isso seria interativo
        console.log("✅ Permissão concedida (simulado)");
        prototypeCount++;
      } else if (message.type === "result") {
        console.log(`📝 Protótipo ${++prototypeCount} criado`);
      }
    }

    this.phaseHistory.push({
      phase: 'prototyping',
      duration: Date.now() - startTime,
      prototypes: prototypeCount,
      mode: 'askEvery'
    });

    console.log(`⏱️ Tempo de prototipagem: ${(Date.now() - startTime) / 1000}s`);
  }

  /**
   * Fase 3: Desenvolvimento rápido com edições automáticas
   */
  async runDevelopmentPhase(projectPath) {
    console.log("\n⚡ FASE 3: DESENVOLVIMENTO RÁPIDO");
    console.log("Modo: acceptEdits (iteração rápida)");
    console.log("-" .repeat(40));

    const startTime = Date.now();
    this.currentPhase = 'development';

    const q = query({
      prompt: `Implement the complete accounting system improvements:
        1. Refactor all tax calculation modules for better performance
        2. Implement comprehensive error handling
        3. Add unit tests for critical functions
        4. Optimize database queries
        5. Add monitoring and logging
        6. Update documentation`,
      options: {
        permissionMode: 'default', // Começa em modo default
        maxTurns: 15,
        allowedTools: ["Read", "Edit", "Write", "Bash"],
        temperature: 0.3
      }
    });

    // Switch to acceptEdits for rapid iteration after initial setup
    console.log("\n🔄 Alternando para modo acceptEdits para iteração rápida...");
    await q.setPermissionMode('acceptEdits');

    let editCount = 0;
    let fileCount = 0;

    for await (const message of q) {
      if (message.type === "edit") {
        editCount++;
        console.log(`✏️ Edit #${editCount}: ${message.file}`);
        this.metrics.totalEdits++;
        this.metrics.autoAcceptedEdits++;
      } else if (message.type === "write") {
        fileCount++;
        console.log(`📄 Novo arquivo #${fileCount}: ${message.file}`);
      } else if (message.type === "result") {
        console.log("✅ Implementação concluída");
      } else if (message.type === "tool_use") {
        console.log(`🔧 Usando: ${message.tool}`);
      }

      // Após muitas edições, pode voltar ao modo default para revisar
      if (editCount > 10 && editCount % 10 === 0) {
        console.log("\n⚠️ Checkpoint: Voltando ao modo default para revisão");
        await q.setPermissionMode('default');

        // Após revisão, volta para acceptEdits
        setTimeout(async () => {
          console.log("🔄 Retornando ao modo acceptEdits");
          await q.setPermissionMode('acceptEdits');
        }, 5000);
      }
    }

    this.phaseHistory.push({
      phase: 'development',
      duration: Date.now() - startTime,
      edits: editCount,
      files: fileCount,
      mode: 'acceptEdits'
    });

    console.log(`\n📊 Estatísticas de Desenvolvimento:`);
    console.log(`   Edições realizadas: ${editCount}`);
    console.log(`   Arquivos criados: ${fileCount}`);
    console.log(`   ⏱️ Tempo: ${(Date.now() - startTime) / 1000}s`);
  }

  /**
   * Fase 4: Revisão com modo controlado
   */
  async runReviewPhase(projectPath) {
    console.log("\n🔍 FASE 4: REVISÃO");
    console.log("Modo: default (revisão controlada)");
    console.log("-" .repeat(40));

    const startTime = Date.now();
    this.currentPhase = 'review';

    const q = query({
      prompt: `Review all changes made to the accounting system:
        1. Check code quality and standards compliance
        2. Verify all tests are passing
        3. Review security implementations
        4. Validate documentation completeness
        5. Check for any remaining issues`,
      options: {
        permissionMode: 'default', // Volta ao modo controlado para revisão
        maxTurns: 5,
        allowedTools: ["Read", "Bash"],
        temperature: 0.2
      }
    });

    const issues = [];

    for await (const message of q) {
      if (message.type === "result") {
        console.log("✅ Revisão concluída");
        if (message.result.includes("issue") || message.result.includes("problem")) {
          issues.push(message.result);
        }
      } else if (message.type === "tool_use") {
        console.log(`🔍 Revisando com: ${message.tool}`);
      }
    }

    this.phaseHistory.push({
      phase: 'review',
      duration: Date.now() - startTime,
      issuesFound: issues.length,
      mode: 'default'
    });

    console.log(`⏱️ Tempo de revisão: ${(Date.now() - startTime) / 1000}s`);
    console.log(`🐛 Problemas encontrados: ${issues.length}`);

    return issues;
  }

  /**
   * Fase 5: Deploy com confirmação importante
   */
  async runDeploymentPhase(projectPath) {
    console.log("\n🚀 FASE 5: DEPLOYMENT");
    console.log("Modo: askEvery (confirmação para operações críticas)");
    console.log("-" .repeat(40));

    const startTime = Date.now();
    this.currentPhase = 'deployment';

    const q = query({
      prompt: `Prepare the accounting system for deployment:
        1. Run final test suite
        2. Build production bundles
        3. Update environment configurations
        4. Create deployment scripts
        5. Generate release notes`,
      options: {
        permissionMode: 'askEvery', // Confirmação para operações de deploy
        maxTurns: 6,
        allowedTools: ["Read", "Write", "Bash"],
        temperature: 0.2
      }
    });

    let deploymentSteps = 0;

    for await (const message of q) {
      if (message.type === "permission_request") {
        console.log(`\n⚠️ Ação crítica de deploy: ${message.action}`);
        // Em produção, solicitaria confirmação do usuário
        console.log("✅ Aprovado para deploy (simulado)");
        deploymentSteps++;
      } else if (message.type === "result") {
        console.log(`✅ Passo de deploy ${++deploymentSteps} concluído`);
      }
    }

    this.phaseHistory.push({
      phase: 'deployment',
      duration: Date.now() - startTime,
      steps: deploymentSteps,
      mode: 'askEvery'
    });

    console.log(`⏱️ Tempo de deploy: ${(Date.now() - startTime) / 1000}s`);
  }

  /**
   * Lida com erros durante o desenvolvimento
   */
  async handleDevelopmentError(error) {
    console.error("\n❌ Erro durante desenvolvimento:", error);

    // Salva estado atual para recuperação
    const errorReport = {
      timestamp: new Date().toISOString(),
      phase: this.currentPhase,
      error: error.message,
      phaseHistory: this.phaseHistory,
      metrics: this.metrics
    };

    const reportPath = `error-report-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify(errorReport, null, 2));

    console.log(`\n💾 Relatório de erro salvo em: ${reportPath}`);
    console.log("📝 Use este relatório para retomar o desenvolvimento");
  }

  /**
   * Gera relatório completo do desenvolvimento
   */
  generateDevelopmentReport() {
    console.log("\n" + "=" .repeat(60));
    console.log("📊 RELATÓRIO DE DESENVOLVIMENTO RÁPIDO");
    console.log("=" .repeat(60));

    // Calcula tempo total
    const totalTime = this.phaseHistory.reduce((sum, phase) => sum + phase.duration, 0);

    console.log("\n⏱️ Tempo por Fase:");
    this.phaseHistory.forEach(phase => {
      const percentage = ((phase.duration / totalTime) * 100).toFixed(1);
      console.log(`   ${phase.phase}: ${(phase.duration / 1000).toFixed(1)}s (${percentage}%)`);
    });

    console.log("\n📈 Métricas de Desenvolvimento:");
    console.log(`   Total de edições: ${this.metrics.totalEdits}`);
    console.log(`   Edições auto-aceitas: ${this.metrics.autoAcceptedEdits}`);
    console.log(`   Taxa de aceitação: ${((this.metrics.autoAcceptedEdits / this.metrics.totalEdits) * 100).toFixed(1)}%`);

    console.log("\n🔄 Transições de Modo:");
    const modeTransitions = this.phaseHistory.map(p => p.mode);
    console.log(`   ${modeTransitions.join(' → ')}`);

    // Salva relatório completo
    const reportPath = `development-report-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify({
      summary: {
        totalTime: totalTime / 1000,
        phases: this.phaseHistory.length,
        totalEdits: this.metrics.totalEdits,
        autoAcceptRate: (this.metrics.autoAcceptedEdits / this.metrics.totalEdits) * 100
      },
      phaseDetails: this.phaseHistory,
      metrics: this.metrics,
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`\n💾 Relatório completo salvo em: ${reportPath}`);
  }
}

/**
 * Exemplo simples de transição de modo
 */
async function simpleModeTransition() {
  console.log("\n🔄 Exemplo Simples: Transição de Modo");
  console.log("=" .repeat(50));

  try {
    // Inicia em modo default para execução controlada
    console.log("📊 Iniciando em modo 'default' para análise controlada...");

    const q = query({
      prompt: "Analyze and optimize the tax calculation module",
      options: {
        permissionMode: 'default', // Start in default mode for controlled execution
        maxTurns: 10,
        allowedTools: ["Read", "Edit", "Write"]
      }
    });

    let messageCount = 0;

    for await (const message of q) {
      messageCount++;

      if (message.type === "result") {
        console.log(`\n📝 Mensagem ${messageCount}: ${message.result.substring(0, 100)}...`);
      }

      // Após análise inicial, muda para modo acceptEdits
      if (messageCount === 3) {
        console.log("\n🚀 Análise concluída! Alternando para modo 'acceptEdits' para iteração rápida...");

        // Switch to acceptEdits for rapid iteration
        await q.setPermissionMode('acceptEdits');

        console.log("✅ Modo alterado! Edições serão aceitas automaticamente.");
      }

      // Para a demonstração após 8 mensagens
      if (messageCount >= 8) {
        console.log("\n✅ Demonstração concluída!");
        break;
      }
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

/**
 * Workflow contábil com otimização progressiva
 */
async function accountingOptimizationWorkflow() {
  console.log("\n💼 Workflow de Otimização Contábil");
  console.log("=" .repeat(60));

  const phases = [
    { name: "Análise", mode: "default", prompt: "Analyze current tax calculation efficiency" },
    { name: "Otimização", mode: "acceptEdits", prompt: "Optimize all tax calculation algorithms" },
    { name: "Validação", mode: "default", prompt: "Validate optimizations against test cases" }
  ];

  for (const phase of phases) {
    console.log(`\n📊 Fase: ${phase.name}`);
    console.log(`🔐 Modo: ${phase.mode}`);
    console.log("-" .repeat(40));

    const q = query({
      prompt: phase.prompt,
      options: {
        permissionMode: phase.mode,
        maxTurns: 5,
        allowedTools: ["Read", "Edit", "Bash"]
      }
    });

    for await (const message of q) {
      if (message.type === "edit") {
        console.log(`✏️ Editando: ${message.file}`);
      } else if (message.type === "result") {
        console.log(`✅ ${phase.name} concluída`);
        break;
      }
    }
  }

  console.log("\n🎉 Workflow de otimização concluído!");
}

// Exportar classes e funções
export {
  RapidDevelopmentManager,
  simpleModeTransition,
  accountingOptimizationWorkflow
};

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--rapid' && args[1]) {
    const manager = new RapidDevelopmentManager();
    manager.executeRapidDevelopment(args[1]).catch(console.error);
  } else if (args[0] === '--simple') {
    simpleModeTransition().catch(console.error);
  } else if (args[0] === '--workflow') {
    accountingOptimizationWorkflow().catch(console.error);
  } else {
    console.log(`
Uso: node rapid-development.js [opção] [caminho]

Opções:
  --rapid <caminho>    Executa desenvolvimento rápido completo
  --simple             Demonstração simples de transição de modo
  --workflow           Workflow de otimização contábil

Exemplos:
  node rapid-development.js --rapid C:\\Users\\pedro\\projeto
  node rapid-development.js --simple
  node rapid-development.js --workflow
    `);
  }
}