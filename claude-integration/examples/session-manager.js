/**
 * Claude Code Session Manager
 * Pedro Tiago Contabilidade - Gerenciamento de Sessões de Análise
 */

import { query } from "@anthropic-ai/claude-code";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Gerenciador de sessões para análises contábeis complexas
 */
class AccountingSessionManager {
  constructor() {
    this.sessionHistory = [];
    this.currentContext = null;
    this.sessionFile = join(process.cwd(), "session-history.json");
  }

  /**
   * Análise inicial do fluxo de autenticação
   */
  async analyzeAuthenticationFlow() {
    console.log("\n🔐 Analisando Fluxo de Autenticação");
    console.log("=" .repeat(50));

    try {
      // Primeira consulta - análise de autenticação
      for await (const message of query({
        prompt: "Analyze the authentication flow in our accounting systems (Calima and Makrosystem). Focus on security best practices.",
        options: {
          maxTurns: 1,
          allowedTools: ["Read", "Grep", "Glob"],
          temperature: 0.3
        }
      })) {
        if (message.type === "result") {
          console.log("\n📊 Análise de Autenticação:");
          console.log(message.result);

          // Salvar contexto para próxima consulta
          this.currentContext = {
            topic: "authentication",
            timestamp: new Date().toISOString(),
            result: message.result
          };

          this.sessionHistory.push(this.currentContext);
        } else if (message.type === "tool_use") {
          console.log(`🔧 Ferramenta utilizada: ${message.tool}`);
        }
      }
    } catch (error) {
      console.error("❌ Erro na análise:", error);
    }
  }

  /**
   * Continuação da sessão - análise de autorização
   */
  async analyzeAuthorizationProcess() {
    console.log("\n🔑 Continuando: Análise de Autorização");
    console.log("=" .repeat(50));

    if (!this.currentContext) {
      console.log("⚠️ Nenhuma sessão anterior encontrada. Iniciando nova análise.");
    }

    try {
      // Continua a conversa com contexto anterior
      for await (const message of query({
        prompt: "Now explain the authorization process and user permission levels for our accounting system. How can we improve role-based access control?",
        options: {
          continue: true, // Continua a sessão anterior
          maxTurns: 1,
          allowedTools: ["Read", "Grep"]
        }
      })) {
        if (message.type === "result") {
          console.log("\n📊 Análise de Autorização:");
          console.log(message.result);

          // Atualizar contexto
          this.currentContext = {
            topic: "authorization",
            timestamp: new Date().toISOString(),
            result: message.result,
            previous: this.currentContext
          };

          this.sessionHistory.push(this.currentContext);
        }
      }
    } catch (error) {
      console.error("❌ Erro na análise:", error);
    }
  }

  /**
   * Análise de compliance fiscal
   */
  async analyzeTaxCompliance() {
    console.log("\n📋 Análise de Compliance Fiscal");
    console.log("=" .repeat(50));

    try {
      for await (const message of query({
        prompt: "Analyze our tax compliance workflows. Check for SPED, DCTF, and other Brazilian tax obligations implementation.",
        options: {
          continue: true,
          maxTurns: 2, // Permite análise mais profunda
          allowedTools: ["Read", "Grep", "Glob"],
          temperature: 0.2 // Mais preciso para compliance
        }
      })) {
        if (message.type === "result") {
          console.log("\n📊 Resultado da Análise:");
          console.log(message.result);

          this.currentContext = {
            topic: "tax_compliance",
            timestamp: new Date().toISOString(),
            result: message.result,
            critical: this.extractCriticalPoints(message.result)
          };

          this.sessionHistory.push(this.currentContext);
        } else if (message.type === "progress") {
          console.log(`⏳ Progresso: ${message.status}`);
        }
      }
    } catch (error) {
      console.error("❌ Erro na análise:", error);
    }
  }

  /**
   * Análise de performance do sistema
   */
  async analyzeSystemPerformance() {
    console.log("\n⚡ Análise de Performance");
    console.log("=" .repeat(50));

    try {
      for await (const message of query({
        prompt: "Analyze system performance bottlenecks. Focus on database queries, API response times, and resource usage.",
        options: {
          maxTurns: 3,
          allowedTools: ["Read", "Grep", "Bash"],
          continue: false // Nova sessão independente
        }
      })) {
        if (message.type === "result") {
          console.log("\n📊 Análise de Performance:");
          console.log(message.result);

          // Gerar recomendações baseadas na análise
          const recommendations = this.generatePerformanceRecommendations(message.result);

          this.currentContext = {
            topic: "performance",
            timestamp: new Date().toISOString(),
            result: message.result,
            recommendations: recommendations
          };

          this.sessionHistory.push(this.currentContext);
        }
      }
    } catch (error) {
      console.error("❌ Erro na análise:", error);
    }
  }

  /**
   * Análise de segurança em múltiplas etapas
   */
  async performSecurityAudit() {
    console.log("\n🔒 Auditoria de Segurança Completa");
    console.log("=" .repeat(50));

    const securityChecks = [
      "Check for hardcoded credentials and API keys",
      "Analyze SQL injection vulnerabilities",
      "Review XSS protection measures",
      "Audit file upload security",
      "Check HTTPS and certificate configuration"
    ];

    for (const check of securityChecks) {
      console.log(`\n🔍 Executando: ${check}`);

      try {
        for await (const message of query({
          prompt: check,
          options: {
            continue: true, // Mantém contexto entre checks
            maxTurns: 1,
            allowedTools: ["Read", "Grep", "Glob"]
          }
        })) {
          if (message.type === "result") {
            console.log(`✅ ${check}: Completo`);

            this.sessionHistory.push({
              topic: "security_audit",
              check: check,
              timestamp: new Date().toISOString(),
              result: message.result
            });
          }
        }
      } catch (error) {
        console.error(`❌ Erro em ${check}:`, error);
      }
    }

    // Gerar relatório final
    this.generateSecurityReport();
  }

  /**
   * Extrai pontos críticos da análise
   */
  extractCriticalPoints(result) {
    const critical = [];
    const lines = result.split('\n');

    for (const line of lines) {
      if (line.includes('CRITICAL') ||
          line.includes('ERROR') ||
          line.includes('WARNING')) {
        critical.push(line.trim());
      }
    }

    return critical;
  }

  /**
   * Gera recomendações de performance
   */
  generatePerformanceRecommendations(result) {
    const recommendations = [];

    if (result.includes('slow query')) {
      recommendations.push("Otimizar queries SQL com índices apropriados");
    }

    if (result.includes('memory')) {
      recommendations.push("Implementar cache Redis para dados frequentes");
    }

    if (result.includes('API')) {
      recommendations.push("Adicionar rate limiting e caching de API");
    }

    return recommendations;
  }

  /**
   * Gera relatório de segurança
   */
  generateSecurityReport() {
    console.log("\n" + "=" .repeat(60));
    console.log("📊 RELATÓRIO DE SEGURANÇA - Pedro Tiago Contabilidade");
    console.log("=" .repeat(60));

    const securityIssues = this.sessionHistory.filter(h => h.topic === "security_audit");

    let criticalCount = 0;
    let warningCount = 0;

    for (const issue of securityIssues) {
      if (issue.result.includes('CRITICAL')) criticalCount++;
      if (issue.result.includes('WARNING')) warningCount++;
    }

    console.log(`\n🔴 Problemas Críticos: ${criticalCount}`);
    console.log(`🟡 Avisos: ${warningCount}`);
    console.log(`✅ Checks Realizados: ${securityIssues.length}`);

    // Salvar relatório
    this.saveSession();
  }

  /**
   * Salva histórico da sessão
   */
  saveSession() {
    try {
      writeFileSync(
        this.sessionFile,
        JSON.stringify(this.sessionHistory, null, 2)
      );
      console.log(`\n💾 Sessão salva em: ${this.sessionFile}`);
    } catch (error) {
      console.error("❌ Erro ao salvar sessão:", error);
    }
  }

  /**
   * Carrega sessão anterior
   */
  loadSession() {
    try {
      if (require('fs').existsSync(this.sessionFile)) {
        const data = readFileSync(this.sessionFile, 'utf-8');
        this.sessionHistory = JSON.parse(data);
        console.log(`✅ Sessão anterior carregada: ${this.sessionHistory.length} registros`);
        return true;
      }
    } catch (error) {
      console.error("❌ Erro ao carregar sessão:", error);
    }
    return false;
  }
}

/**
 * Executa análise completa com gerenciamento de sessão
 */
async function runCompleteAnalysis() {
  console.log("🚀 Iniciando Análise Completa - Pedro Tiago Contabilidade");
  console.log("=" .repeat(60));

  const manager = new AccountingSessionManager();

  // Carrega sessão anterior se existir
  manager.loadSession();

  try {
    // Executa análises em sequência com contexto mantido
    await manager.analyzeAuthenticationFlow();
    await manager.analyzeAuthorizationProcess();
    await manager.analyzeTaxCompliance();
    await manager.analyzeSystemPerformance();
    await manager.performSecurityAudit();

    // Salva sessão completa
    manager.saveSession();

    console.log("\n✅ Análise completa finalizada!");
    console.log(`📊 Total de análises: ${manager.sessionHistory.length}`);

  } catch (error) {
    console.error("❌ Erro durante análise:", error);
  }
}

/**
 * Exemplo de uso simples
 */
async function simpleExample() {
  console.log("\n📝 Exemplo Simples - Consulta Única");
  console.log("=" .repeat(50));

  // Consulta simples sem sessão
  for await (const message of query({
    prompt: "List all Python files in the accounting agents folder",
    options: {
      maxTurns: 1,
      allowedTools: ["Glob"]
    }
  })) {
    if (message.type === "result") {
      console.log("Arquivos encontrados:");
      console.log(message.result);
    }
  }
}

// Exportar classe e funções
export {
  AccountingSessionManager,
  runCompleteAnalysis,
  simpleExample
};

// Executar se chamado diretamente
if (require.main === module) {
  // Menu de opções
  const args = process.argv.slice(2);

  if (args.includes('--simple')) {
    simpleExample().catch(console.error);
  } else if (args.includes('--security')) {
    const manager = new AccountingSessionManager();
    manager.performSecurityAudit().catch(console.error);
  } else {
    runCompleteAnalysis().catch(console.error);
  }
}