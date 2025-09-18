/**
 * Claude Code Refactoring Assistant
 * Pedro Tiago Contabilidade - Refatoração Automática de Código
 */

import { query } from "@anthropic-ai/claude-code";
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, extname } from "path";

/**
 * Assistente de refatoração para código contábil
 */
class RefactoringAssistant {
  constructor() {
    this.refactoredFiles = [];
    this.improvements = [];
    this.metrics = {
      filesAnalyzed: 0,
      filesRefactored: 0,
      linesImproved: 0,
      performanceGains: []
    };
  }

  /**
   * Refatora um arquivo específico
   */
  async refactorFile(filePath) {
    console.log(`\n🔧 Refatorando: ${filePath}`);
    console.log("=" .repeat(50));

    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      const fileExtension = extname(filePath);

      // Determina o tipo de refatoração baseado na extensão
      const refactorPrompt = this.getRefactorPrompt(fileExtension, fileContent);

      const result = await query({
        prompt: refactorPrompt,
        options: {
          permissionMode: 'default', // Modo de permissão padrão
          maxTurns: 3,
          allowedTools: ["Read", "Edit", "Write"],
          temperature: 0.3 // Baixa temperatura para refatoração precisa
        }
      });

      // Processar resultado
      for await (const message of result) {
        if (message.type === "result") {
          console.log("✅ Refatoração concluída!");

          this.refactoredFiles.push({
            path: filePath,
            timestamp: new Date().toISOString(),
            improvements: message.result
          });

          this.metrics.filesRefactored++;
        } else if (message.type === "edit") {
          console.log(`📝 Editando: ${message.file}`);
          this.metrics.linesImproved += message.linesChanged || 0;
        }
      }

    } catch (error) {
      console.error(`❌ Erro ao refatorar ${filePath}:`, error);
    }

    this.metrics.filesAnalyzed++;
  }

  /**
   * Gera prompt específico para refatoração
   */
  getRefactorPrompt(extension, content) {
    const basePrompt = `Help me refactor this code following best practices. Focus on:
    1. Code clarity and readability
    2. Performance optimization
    3. Error handling
    4. Documentation
    5. Security improvements`;

    const extensionPrompts = {
      '.py': `
        ${basePrompt}

        Python-specific improvements:
        - Use type hints
        - Follow PEP 8 style guide
        - Optimize list comprehensions
        - Add proper docstrings
        - Use context managers where appropriate
        - Implement proper exception handling

        Code to refactor:
        ${content}`,

      '.js': `
        ${basePrompt}

        JavaScript-specific improvements:
        - Use modern ES6+ syntax
        - Add JSDoc comments
        - Implement proper async/await
        - Use const/let instead of var
        - Add error boundaries
        - Optimize for V8 engine

        Code to refactor:
        ${content}`,

      '.sql': `
        ${basePrompt}

        SQL-specific improvements:
        - Optimize query performance
        - Add proper indexes
        - Use CTEs for readability
        - Implement proper transactions
        - Add comments for complex queries

        Query to refactor:
        ${content}`,

      '.html': `
        ${basePrompt}

        HTML-specific improvements:
        - Semantic HTML5 tags
        - Accessibility (ARIA labels)
        - SEO optimization
        - Performance (lazy loading)
        - Mobile responsiveness

        HTML to refactor:
        ${content}`
    };

    return extensionPrompts[extension] || `${basePrompt}\n\nCode to refactor:\n${content}`;
  }

  /**
   * Refatora múltiplos arquivos de um diretório
   */
  async refactorDirectory(dirPath, extensions = ['.py', '.js']) {
    console.log(`\n📁 Refatorando diretório: ${dirPath}`);
    console.log(`📝 Extensões: ${extensions.join(', ')}`);
    console.log("=" .repeat(60));

    try {
      const files = readdirSync(dirPath);

      for (const file of files) {
        const filePath = join(dirPath, file);
        const ext = extname(file);

        if (extensions.includes(ext)) {
          await this.refactorFile(filePath);
        }
      }

      this.generateReport();

    } catch (error) {
      console.error(`❌ Erro ao processar diretório:`, error);
    }
  }

  /**
   * Refatora código específico do sistema contábil
   */
  async refactorAccountingModule(moduleName) {
    console.log(`\n💼 Refatorando Módulo Contábil: ${moduleName}`);
    console.log("=" .repeat(60));

    const accountingPrompts = {
      'tax_calculator': `
        Refactor this tax calculation module to:
        - Improve accuracy of Brazilian tax calculations (ICMS, ISS, PIS, COFINS)
        - Add validation for all inputs
        - Implement caching for frequently used tax rates
        - Add comprehensive error handling
        - Include audit logging for compliance`,

      'invoice_generator': `
        Refactor this invoice generation module to:
        - Optimize PDF generation performance
        - Add template system for different invoice types
        - Implement batch processing
        - Add data validation
        - Include digital signature support`,

      'report_builder': `
        Refactor this report builder to:
        - Implement lazy loading for large datasets
        - Add export to multiple formats (Excel, PDF, CSV)
        - Optimize database queries
        - Add real-time progress tracking
        - Implement caching strategy`,

      'api_integration': `
        Refactor this API integration to:
        - Add retry logic with exponential backoff
        - Implement rate limiting
        - Add request/response logging
        - Improve error handling
        - Add circuit breaker pattern`
    };

    const prompt = accountingPrompts[moduleName] || 'Help me refactor this accounting module';

    try {
      const result = await query({
        prompt: prompt,
        options: {
          permissionMode: 'default',
          maxTurns: 5,
          allowedTools: ["Read", "Edit", "Write", "Grep"],
          temperature: 0.2
        }
      });

      for await (const message of result) {
        if (message.type === "result") {
          console.log("\n📊 Melhorias implementadas:");
          console.log(message.result);

          this.improvements.push({
            module: moduleName,
            timestamp: new Date().toISOString(),
            changes: message.result
          });
        }
      }

    } catch (error) {
      console.error(`❌ Erro ao refatorar módulo:`, error);
    }
  }

  /**
   * Análise de code smells
   */
  async detectCodeSmells(filePath) {
    console.log(`\n🔍 Detectando Code Smells: ${filePath}`);

    const result = await query({
      prompt: `Analyze this code for code smells and anti-patterns. Identify:
        - Long methods
        - Duplicate code
        - God classes
        - Dead code
        - Complex conditionals
        - Magic numbers
        - Poor naming conventions`,
      options: {
        permissionMode: 'default',
        maxTurns: 1,
        allowedTools: ["Read"],
        temperature: 0.3
      }
    });

    const smells = [];
    for await (const message of result) {
      if (message.type === "result") {
        smells.push(message.result);
      }
    }

    return smells;
  }

  /**
   * Otimização de performance
   */
  async optimizePerformance(filePath) {
    console.log(`\n⚡ Otimizando Performance: ${filePath}`);

    const result = await query({
      prompt: `Optimize this code for performance. Focus on:
        - Algorithm complexity reduction
        - Memory usage optimization
        - Database query optimization
        - Caching opportunities
        - Async/parallel processing
        - Resource cleanup`,
      options: {
        permissionMode: 'default',
        maxTurns: 3,
        allowedTools: ["Read", "Edit"],
        temperature: 0.3
      }
    });

    for await (const message of result) {
      if (message.type === "result") {
        console.log("✅ Otimizações aplicadas!");
        this.metrics.performanceGains.push({
          file: filePath,
          optimizations: message.result
        });
      }
    }
  }

  /**
   * Adiciona documentação automática
   */
  async addDocumentation(filePath) {
    console.log(`\n📚 Adicionando Documentação: ${filePath}`);

    const result = await query({
      prompt: `Add comprehensive documentation to this code:
        - Function/method descriptions
        - Parameter documentation
        - Return value descriptions
        - Usage examples
        - Error handling documentation
        - Complex logic explanations`,
      options: {
        permissionMode: 'default',
        maxTurns: 2,
        allowedTools: ["Read", "Edit"],
        temperature: 0.4
      }
    });

    for await (const message of result) {
      if (message.type === "result") {
        console.log("✅ Documentação adicionada!");
      }
    }
  }

  /**
   * Gera relatório de refatoração
   */
  generateReport() {
    console.log("\n" + "=" .repeat(60));
    console.log("📊 RELATÓRIO DE REFATORAÇÃO");
    console.log("=" .repeat(60));

    console.log(`\n📈 Métricas:`);
    console.log(`   Arquivos analisados: ${this.metrics.filesAnalyzed}`);
    console.log(`   Arquivos refatorados: ${this.metrics.filesRefactored}`);
    console.log(`   Linhas melhoradas: ${this.metrics.linesImproved}`);
    console.log(`   Otimizações de performance: ${this.metrics.performanceGains.length}`);

    if (this.improvements.length > 0) {
      console.log(`\n💡 Principais Melhorias:`);
      this.improvements.forEach((imp, index) => {
        console.log(`   ${index + 1}. ${imp.module} - ${new Date(imp.timestamp).toLocaleString()}`);
      });
    }

    // Salvar relatório
    const reportPath = `refactoring-report-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify({
      metrics: this.metrics,
      refactoredFiles: this.refactoredFiles,
      improvements: this.improvements,
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`\n💾 Relatório salvo em: ${reportPath}`);
  }
}

/**
 * Exemplo de uso simples
 */
async function simpleRefactorExample() {
  console.log("\n🔧 Exemplo Simples de Refatoração");
  console.log("=" .repeat(50));

  // Refatoração simples com permissão padrão
  const result = await query({
    prompt: `Help me refactor this code to be more efficient:

      function calculateTax(amount) {
        var tax = 0;
        if (amount > 0 && amount <= 1000) {
          tax = amount * 0.1;
        } else if (amount > 1000 && amount <= 5000) {
          tax = amount * 0.15;
        } else if (amount > 5000) {
          tax = amount * 0.2;
        }
        return tax;
      }`,
    options: {
      permissionMode: 'default',
      maxTurns: 1
    }
  });

  for await (const message of result) {
    if (message.type === "result") {
      console.log("\n✅ Código Refatorado:");
      console.log(message.result);
    }
  }
}

/**
 * Refatoração em lote
 */
async function batchRefactor() {
  const assistant = new RefactoringAssistant();

  // Refatorar todos os agentes Python
  await assistant.refactorDirectory('C:\\Users\\pedro', ['.py']);

  // Refatorar módulos específicos
  const modules = ['tax_calculator', 'invoice_generator', 'report_builder'];
  for (const module of modules) {
    await assistant.refactorAccountingModule(module);
  }

  // Gerar relatório final
  assistant.generateReport();
}

/**
 * Análise completa de código
 */
async function completeCodeAnalysis(filePath) {
  const assistant = new RefactoringAssistant();

  console.log(`\n🔬 Análise Completa: ${filePath}`);
  console.log("=" .repeat(60));

  // 1. Detectar code smells
  const smells = await assistant.detectCodeSmells(filePath);
  console.log("\n🔍 Code Smells Detectados:", smells.length);

  // 2. Otimizar performance
  await assistant.optimizePerformance(filePath);

  // 3. Adicionar documentação
  await assistant.addDocumentation(filePath);

  // 4. Refatorar código
  await assistant.refactorFile(filePath);

  console.log("\n✅ Análise completa finalizada!");
}

// Exportar classes e funções
export {
  RefactoringAssistant,
  simpleRefactorExample,
  batchRefactor,
  completeCodeAnalysis
};

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--simple') {
    simpleRefactorExample().catch(console.error);
  } else if (args[0] === '--batch') {
    batchRefactor().catch(console.error);
  } else if (args[0] === '--analyze' && args[1]) {
    completeCodeAnalysis(args[1]).catch(console.error);
  } else {
    console.log(`
Uso: node code-refactoring.js [opção] [arquivo]

Opções:
  --simple              Executa exemplo simples de refatoração
  --batch               Refatora múltiplos arquivos
  --analyze <arquivo>   Análise completa de um arquivo

Exemplos:
  node code-refactoring.js --simple
  node code-refactoring.js --batch
  node code-refactoring.js --analyze agente_navegador_contabil.py
    `);
  }
}