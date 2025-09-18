/**
 * Claude Code Subagent Usage Examples
 * Pedro Tiago Contabilidade - Como Usar Subagentes Especializados
 */

import { query } from "@anthropic-ai/claude-code";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Gerenciador de Subagentes para Sistema Contábil
 */
class SubagentManager {
  constructor() {
    this.subagents = new Map();
    this.loadSubagents();
    this.executionHistory = [];
  }

  /**
   * Carrega definições de subagentes disponíveis
   */
  loadSubagents() {
    const subagentDefinitions = {
      'code-reviewer': {
        path: './subagents/code-reviewer.md',
        description: 'Expert code review specialist for accounting systems',
        triggers: ['review', 'check', 'analyze code', 'code quality']
      },
      'fiscal-automation': {
        path: './subagents/fiscal-automation.md',
        description: 'Brazilian fiscal and tax automation specialist',
        triggers: ['tax', 'fiscal', 'nfe', 'sped', 'impostos']
      },
      'data-analyst': {
        path: './subagents/data-analyst.md',
        description: 'Financial data analysis and reporting specialist',
        triggers: ['analyze data', 'report', 'kpi', 'metrics', 'dashboard']
      },
      'performance-optimizer': {
        path: './subagents/performance-optimizer.md',
        description: 'Performance optimization specialist (PROACTIVE)',
        triggers: ['optimize', 'slow', 'performance', 'speed up'],
        proactive: true
      },
      'test-automation': {
        path: './subagents/test-automation.md',
        description: 'Test automation specialist (PROACTIVE)',
        triggers: ['test', 'coverage', 'unit test', 'integration test'],
        proactive: true
      }
    };

    for (const [name, config] of Object.entries(subagentDefinitions)) {
      this.subagents.set(name, config);
    }

    console.log(`✅ ${this.subagents.size} subagentes carregados`);
  }

  /**
   * Determina qual subagente usar baseado no prompt
   */
  selectSubagent(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Verifica menção explícita
    for (const [name, config] of this.subagents) {
      if (lowerPrompt.includes(name)) {
        return name;
      }
    }

    // Verifica triggers
    for (const [name, config] of this.subagents) {
      for (const trigger of config.triggers) {
        if (lowerPrompt.includes(trigger)) {
          return name;
        }
      }
    }

    return null;
  }

  /**
   * Registra execução de subagente
   */
  logExecution(subagent, prompt, result) {
    this.executionHistory.push({
      subagent,
      prompt,
      timestamp: new Date().toISOString(),
      success: result.success || false
    });
  }
}

/**
 * 1. USO EXPLÍCITO DE SUBAGENTES
 */
async function explicitSubagentUsage() {
  console.log("\n🎯 Uso Explícito de Subagentes");
  console.log("=" .repeat(60));

  // Exemplo 1: Code Reviewer
  console.log("\n1️⃣ Revisão de Código com code-reviewer");
  const codeReviewResult = await query({
    prompt: "Use the code-reviewer subagent to check the authentication module for security vulnerabilities and code quality issues",
    options: {
      subagent: 'code-reviewer',
      allowedTools: ["Read", "Grep", "Glob"]
    }
  });

  for await (const message of codeReviewResult) {
    if (message.type === "result") {
      console.log("✅ Revisão concluída");
      console.log(message.result);
    }
  }

  // Exemplo 2: Fiscal Automation
  console.log("\n2️⃣ Automação Fiscal com fiscal-automation");
  const fiscalResult = await query({
    prompt: "Use the fiscal-automation subagent to generate NFe XML for invoice #12345 and calculate all applicable taxes",
    options: {
      subagent: 'fiscal-automation',
      allowedTools: ["Read", "Write", "WebFetch"]
    }
  });

  for await (const message of fiscalResult) {
    if (message.type === "result") {
      console.log("✅ NFe gerada");
    }
  }

  // Exemplo 3: Data Analysis
  console.log("\n3️⃣ Análise de Dados com data-analyst");
  const analysisResult = await query({
    prompt: "Use the data-analyst subagent to analyze last quarter's financial performance and generate KPI dashboard",
    options: {
      subagent: 'data-analyst',
      allowedTools: ["Read", "Write", "Bash"]
    }
  });

  for await (const message of analysisResult) {
    if (message.type === "result") {
      console.log("✅ Análise concluída");
    }
  }
}

/**
 * 2. USO AUTOMÁTICO BASEADO EM CONTEXTO
 */
async function automaticSubagentSelection() {
  console.log("\n🤖 Seleção Automática de Subagentes");
  console.log("=" .repeat(60));

  const manager = new SubagentManager();

  const prompts = [
    "Review the tax calculation module for bugs",  // → code-reviewer
    "Calculate ICMS for this interstate operation", // → fiscal-automation
    "Generate monthly revenue report with trends",   // → data-analyst
    "Optimize database queries in the invoice module", // → performance-optimizer
    "Create unit tests for the payment processor"   // → test-automation
  ];

  for (const prompt of prompts) {
    const selectedSubagent = manager.selectSubagent(prompt);
    console.log(`\n📝 Prompt: "${prompt}"`);
    console.log(`🎯 Subagente selecionado: ${selectedSubagent || 'default'}`);

    if (selectedSubagent) {
      const result = await query({
        prompt,
        options: {
          subagent: selectedSubagent,
          autoSelect: true
        }
      });

      for await (const message of result) {
        if (message.type === "subagent") {
          console.log(`   ✅ Usando: ${message.name}`);
        }
      }
    }
  }
}

/**
 * 3. CADEIA DE SUBAGENTES (PIPELINE)
 */
async function subagentPipeline() {
  console.log("\n⛓️ Pipeline de Subagentes");
  console.log("=" .repeat(60));

  const pipeline = [
    {
      name: 'code-reviewer',
      prompt: 'Review the new tax calculation module',
      output: 'review_report'
    },
    {
      name: 'performance-optimizer',
      prompt: 'Optimize the issues found in {review_report}',
      output: 'optimized_code'
    },
    {
      name: 'test-automation',
      prompt: 'Create comprehensive tests for {optimized_code}',
      output: 'test_suite'
    }
  ];

  const results = {};

  for (const step of pipeline) {
    console.log(`\n🔄 Executando: ${step.name}`);

    // Substitui placeholders com resultados anteriores
    let prompt = step.prompt;
    for (const [key, value] of Object.entries(results)) {
      prompt = prompt.replace(`{${key}}`, value);
    }

    const stepResult = await query({
      prompt: `Use the ${step.name} subagent to ${prompt}`,
      options: {
        subagent: step.name,
        context: results
      }
    });

    for await (const message of stepResult) {
      if (message.type === "result") {
        results[step.output] = message.result;
        console.log(`   ✅ ${step.name} concluído`);
      }
    }
  }

  console.log("\n✅ Pipeline concluído!");
  return results;
}

/**
 * 4. SUBAGENTES PROATIVOS
 */
async function proactiveSubagents() {
  console.log("\n🚀 Subagentes Proativos");
  console.log("=" .repeat(60));

  // Performance Optimizer - ativa automaticamente
  console.log("\n⚡ Performance Optimizer (Proativo)");
  const result1 = await query({
    prompt: "Add a new function to process 10000 invoices", // Triggers performance optimizer
    options: {
      enableProactiveSubagents: true,
      proactiveSubagents: ['performance-optimizer', 'test-automation']
    }
  });

  for await (const message of result1) {
    if (message.type === "proactive_subagent") {
      console.log(`🚨 Subagente proativo ativado: ${message.name}`);
      console.log(`   Razão: ${message.reason}`);
    } else if (message.type === "optimization") {
      console.log(`   ⚡ Otimização aplicada: ${message.description}`);
    }
  }

  // Test Automation - ativa automaticamente após mudanças
  console.log("\n🧪 Test Automation (Proativo)");
  const result2 = await query({
    prompt: "Implement new tax calculation formula", // Triggers test automation
    options: {
      enableProactiveSubagents: true
    }
  });

  for await (const message of result2) {
    if (message.type === "proactive_subagent") {
      console.log(`🚨 Subagente proativo ativado: ${message.name}`);
    } else if (message.type === "test_created") {
      console.log(`   ✅ Teste criado: ${message.test_name}`);
    }
  }
}

/**
 * 5. CONFIGURAÇÃO CUSTOMIZADA DE SUBAGENTES
 */
async function customSubagentConfiguration() {
  console.log("\n⚙️ Configuração Customizada de Subagentes");
  console.log("=" .repeat(60));

  // Define configuração específica para cada subagente
  const customConfig = {
    'code-reviewer': {
      rules: {
        enforceTypeHints: true,
        maxComplexity: 10,
        minTestCoverage: 80,
        blockDangerousPatterns: ['eval', 'exec', '__import__']
      },
      focus: ['security', 'performance', 'maintainability']
    },
    'fiscal-automation': {
      settings: {
        defaultState: 'GO',
        taxRegime: 'LUCRO_REAL',
        enableSPED: true,
        nfeVersion: '4.00'
      },
      validations: ['CNPJ', 'CPF', 'IE', 'NCM']
    },
    'performance-optimizer': {
      thresholds: {
        maxQueryTime: 100,     // ms
        maxMemoryUsage: 512,   // MB
        minCacheHitRate: 0.9,  // 90%
        targetResponseTime: 200 // ms
      },
      strategies: ['caching', 'indexing', 'async', 'batching']
    }
  };

  const result = await query({
    prompt: "Review and optimize the entire accounting module",
    options: {
      subagents: ['code-reviewer', 'performance-optimizer'],
      subagentConfig: customConfig,
      parallel: true  // Execute subagentes em paralelo quando possível
    }
  });

  for await (const message of result) {
    if (message.type === "subagent_start") {
      console.log(`\n🚀 Iniciando: ${message.name}`);
      console.log(`   Config: ${JSON.stringify(customConfig[message.name], null, 2)}`);
    } else if (message.type === "subagent_complete") {
      console.log(`✅ ${message.name} concluído`);
    }
  }
}

/**
 * 6. MONITORAMENTO DE SUBAGENTES
 */
class SubagentMonitor {
  constructor() {
    this.metrics = {
      executions: {},
      errors: {},
      performance: {}
    };
  }

  async monitorExecution(subagentName, executionFn) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = await executionFn();

      // Registra métricas de sucesso
      this.recordSuccess(subagentName, {
        duration: Date.now() - startTime,
        memoryDelta: process.memoryUsage().heapUsed - startMemory
      });

      return result;
    } catch (error) {
      // Registra erro
      this.recordError(subagentName, error);
      throw error;
    }
  }

  recordSuccess(subagent, metrics) {
    if (!this.metrics.executions[subagent]) {
      this.metrics.executions[subagent] = 0;
    }
    this.metrics.executions[subagent]++;

    if (!this.metrics.performance[subagent]) {
      this.metrics.performance[subagent] = [];
    }
    this.metrics.performance[subagent].push(metrics);
  }

  recordError(subagent, error) {
    if (!this.metrics.errors[subagent]) {
      this.metrics.errors[subagent] = [];
    }
    this.metrics.errors[subagent].push({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  generateReport() {
    console.log("\n📊 Relatório de Subagentes");
    console.log("=" .repeat(60));

    for (const [subagent, count] of Object.entries(this.metrics.executions)) {
      const errors = this.metrics.errors[subagent]?.length || 0;
      const perfData = this.metrics.performance[subagent] || [];
      const avgDuration = perfData.reduce((sum, p) => sum + p.duration, 0) / perfData.length || 0;

      console.log(`\n${subagent}:`);
      console.log(`   Execuções: ${count}`);
      console.log(`   Erros: ${errors}`);
      console.log(`   Tempo médio: ${avgDuration.toFixed(0)}ms`);
      console.log(`   Taxa de sucesso: ${((count - errors) / count * 100).toFixed(1)}%`);
    }
  }
}

/**
 * 7. EXEMPLO COMPLETO: WORKFLOW CONTÁBIL
 */
async function completeAccountingWorkflow() {
  console.log("\n💼 Workflow Contábil Completo com Subagentes");
  console.log("=" .repeat(60));

  const monitor = new SubagentMonitor();

  // 1. Análise de código existente
  console.log("\n[1/5] Analisando código existente...");
  await monitor.monitorExecution('code-reviewer', async () => {
    return await query({
      prompt: "Use the code-reviewer subagent to analyze all tax calculation modules",
      options: { subagent: 'code-reviewer' }
    });
  });

  // 2. Otimização de performance
  console.log("\n[2/5] Otimizando performance...");
  await monitor.monitorExecution('performance-optimizer', async () => {
    return await query({
      prompt: "Use the performance-optimizer subagent to optimize database queries and calculations",
      options: { subagent: 'performance-optimizer' }
    });
  });

  // 3. Implementação fiscal
  console.log("\n[3/5] Implementando melhorias fiscais...");
  await monitor.monitorExecution('fiscal-automation', async () => {
    return await query({
      prompt: "Use the fiscal-automation subagent to implement SPED generation and NFe validation",
      options: { subagent: 'fiscal-automation' }
    });
  });

  // 4. Criação de testes
  console.log("\n[4/5] Criando suite de testes...");
  await monitor.monitorExecution('test-automation', async () => {
    return await query({
      prompt: "Use the test-automation subagent to create comprehensive tests for all changes",
      options: { subagent: 'test-automation' }
    });
  });

  // 5. Análise de dados e relatórios
  console.log("\n[5/5] Gerando análises e relatórios...");
  await monitor.monitorExecution('data-analyst', async () => {
    return await query({
      prompt: "Use the data-analyst subagent to analyze system performance and generate executive dashboard",
      options: { subagent: 'data-analyst' }
    });
  });

  // Gera relatório final
  monitor.generateReport();

  console.log("\n✅ Workflow contábil completo!");
}

/**
 * 8. CRIAÇÃO DE SUBAGENTE CUSTOMIZADO
 */
async function createCustomSubagent() {
  console.log("\n🛠️ Criando Subagente Customizado");
  console.log("=" .repeat(60));

  const customSubagentDefinition = `---
name: accounting-assistant
description: Specialized assistant for Pedro Tiago Contabilidade operations
tools: Read, Write, Edit, Bash, WebFetch
---

You are a specialized accounting assistant for Pedro Tiago Contabilidade.

## Core Responsibilities
1. Automate routine accounting tasks
2. Integrate with Calima Web and Makrosystem
3. Generate client reports
4. Monitor fiscal deadlines
5. Ensure compliance with Brazilian regulations

## Specific Knowledge
- Brazilian tax system (ICMS, ISS, PIS, COFINS)
- SPED requirements
- NFe/NFSe generation
- Client management
- Financial reporting

## Automation Priorities
1. Daily bank reconciliation
2. Monthly tax calculations
3. Quarterly reports
4. Annual declarations

Always prioritize accuracy and compliance over speed.
`;

  // Salva definição do subagente
  writeFileSync('./subagents/accounting-assistant.md', customSubagentDefinition);

  // Usa o novo subagente
  const result = await query({
    prompt: "Use the accounting-assistant subagent to automate this month's tax calculations",
    options: {
      subagent: 'accounting-assistant',
      customSubagentPath: './subagents/accounting-assistant.md'
    }
  });

  for await (const message of result) {
    if (message.type === "result") {
      console.log("✅ Subagente customizado executado com sucesso");
    }
  }
}

// Exportar funções e classes
export {
  SubagentManager,
  SubagentMonitor,
  explicitSubagentUsage,
  automaticSubagentSelection,
  subagentPipeline,
  proactiveSubagents,
  customSubagentConfiguration,
  completeAccountingWorkflow,
  createCustomSubagent
};

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--explicit') {
    explicitSubagentUsage().catch(console.error);
  } else if (args[0] === '--automatic') {
    automaticSubagentSelection().catch(console.error);
  } else if (args[0] === '--pipeline') {
    subagentPipeline().catch(console.error);
  } else if (args[0] === '--proactive') {
    proactiveSubagents().catch(console.error);
  } else if (args[0] === '--custom') {
    customSubagentConfiguration().catch(console.error);
  } else if (args[0] === '--workflow') {
    completeAccountingWorkflow().catch(console.error);
  } else if (args[0] === '--create') {
    createCustomSubagent().catch(console.error);
  } else {
    console.log(`
Uso: node subagent-usage.js [opção]

Opções:
  --explicit    Uso explícito de subagentes
  --automatic   Seleção automática baseada em contexto
  --pipeline    Pipeline de múltiplos subagentes
  --proactive   Subagentes proativos
  --custom      Configuração customizada
  --workflow    Workflow contábil completo
  --create      Criar subagente customizado

Exemplos:
  node subagent-usage.js --explicit
  node subagent-usage.js --workflow
  node subagent-usage.js --create
    `);
  }
}