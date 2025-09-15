/**
 * Claude Code Hooks System
 * Pedro Tiago Contabilidade - Sistema de Hooks para Controle de Ferramentas
 */

import { query } from "@anthropic-ai/claude-code";
import { EventEmitter } from "events";
import { writeFileSync, appendFileSync, readFileSync, existsSync } from "fs";
import crypto from "crypto";

/**
 * Sistema avançado de hooks para controle de ferramentas
 */
class HooksSystem extends EventEmitter {
  constructor() {
    super();
    this.auditLog = [];
    this.blockedCommands = new Set();
    this.allowedCommands = new Set();
    this.toolMetrics = new Map();
    this.sessionId = crypto.randomBytes(16).toString('hex');
    this.configFile = 'hooks-config.json';

    // Carrega configuração se existir
    this.loadConfiguration();

    // Configura comandos perigosos padrão
    this.setupDefaultBlocklist();
  }

  /**
   * Configura lista padrão de comandos bloqueados
   */
  setupDefaultBlocklist() {
    // Comandos destrutivos
    this.blockedCommands.add('rm -rf /');
    this.blockedCommands.add('rm -rf /*');
    this.blockedCommands.add('format c:');
    this.blockedCommands.add('del /f /s /q C:\\*');

    // Comandos de sistema perigosos
    this.blockedCommands.add('shutdown');
    this.blockedCommands.add('reboot');
    this.blockedCommands.add('kill -9');

    // Comandos de rede perigosos
    this.blockedCommands.add('nc -l');
    this.blockedCommands.add('netcat');

    // Comandos permitidos explicitamente
    this.allowedCommands.add('ls');
    this.allowedCommands.add('pwd');
    this.allowedCommands.add('echo');
    this.allowedCommands.add('npm test');
    this.allowedCommands.add('python test');
    this.allowedCommands.add('git status');
  }

  /**
   * Cria hooks para controle de ferramentas
   */
  createHooks() {
    return {
      PreToolUse: [{
        hooks: [
          this.createPreToolHook(),
          this.createSecurityHook(),
          this.createValidationHook(),
          this.createRateLimitHook()
        ]
      }],
      PostToolUse: [{
        hooks: [
          this.createPostToolHook(),
          this.createAuditHook(),
          this.createMetricsHook(),
          this.createNotificationHook()
        ]
      }],
      OnError: [{
        hooks: [
          this.createErrorHook()
        ]
      }]
    };
  }

  /**
   * Hook de pré-execução de ferramenta
   */
  createPreToolHook() {
    return async (input, toolUseId, { signal }) => {
      console.log(`\n🔧 [PRE] Ferramenta solicitada: ${input.tool_name}`);
      console.log(`   ID: ${toolUseId}`);
      console.log(`   Timestamp: ${new Date().toISOString()}`);

      // Registra início
      this.emit('tool:start', {
        toolName: input.tool_name,
        toolUseId,
        input: input.tool_input,
        timestamp: new Date()
      });

      // Valida entrada básica
      if (!input.tool_name) {
        return {
          decision: "block",
          reason: "Tool name is required"
        };
      }

      // Registra tentativa
      this.auditLog.push({
        type: 'pre_tool',
        toolName: input.tool_name,
        toolUseId,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        input: input.tool_input
      });

      return { continue: true };
    };
  }

  /**
   * Hook de segurança
   */
  createSecurityHook() {
    return async (input, toolUseId, { signal }) => {
      console.log(`🔒 [SECURITY] Verificando segurança...`);

      // Análise específica por ferramenta
      switch (input.tool_name) {
        case "Bash":
          return this.validateBashCommand(input.tool_input);

        case "Write":
          return this.validateWriteOperation(input.tool_input);

        case "Edit":
          return this.validateEditOperation(input.tool_input);

        case "Delete":
          return this.validateDeleteOperation(input.tool_input);

        default:
          return { continue: true };
      }
    };
  }

  /**
   * Valida comandos Bash
   */
  validateBashCommand(toolInput) {
    const command = toolInput.command;

    if (!command) {
      return {
        decision: "block",
        reason: "Command is required for Bash tool"
      };
    }

    // Verifica comandos bloqueados
    for (const blocked of this.blockedCommands) {
      if (command.includes(blocked)) {
        console.log(`   ❌ Comando perigoso bloqueado: ${blocked}`);

        this.auditLog.push({
          type: 'blocked_command',
          command,
          reason: `Contains blocked pattern: ${blocked}`,
          timestamp: new Date().toISOString()
        });

        return {
          decision: "block",
          reason: `Dangerous command blocked: ${blocked}`
        };
      }
    }

    // Verifica comandos permitidos
    let isAllowed = false;
    for (const allowed of this.allowedCommands) {
      if (command.startsWith(allowed)) {
        isAllowed = true;
        break;
      }
    }

    if (!isAllowed && this.allowedCommands.size > 0) {
      console.log(`   ⚠️ Comando não está na lista de permitidos`);

      // Análise adicional para comandos não listados
      const riskScore = this.analyzeBashRisk(command);

      if (riskScore > 70) {
        return {
          decision: "block",
          reason: `Command risk score too high: ${riskScore}`
        };
      }
    }

    console.log(`   ✅ Comando aprovado`);
    return { continue: true };
  }

  /**
   * Analisa risco de comando Bash
   */
  analyzeBashRisk(command) {
    let score = 0;

    // Palavras-chave perigosas
    const dangerousKeywords = [
      'sudo', 'rm', 'del', 'format', 'kill',
      'chmod 777', 'curl | bash', 'wget | sh'
    ];

    for (const keyword of dangerousKeywords) {
      if (command.includes(keyword)) {
        score += 30;
      }
    }

    // Redirecionamentos perigosos
    if (command.includes('>') && command.includes('/dev/')) {
      score += 40;
    }

    // Pipes múltiplos (potencial injeção)
    const pipeCount = (command.match(/\|/g) || []).length;
    if (pipeCount > 2) {
      score += pipeCount * 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Valida operações de escrita
   */
  validateWriteOperation(toolInput) {
    const filePath = toolInput.file_path;

    if (!filePath) {
      return {
        decision: "block",
        reason: "File path is required for Write tool"
      };
    }

    // Bloqueia escritas em diretórios do sistema
    const systemPaths = [
      'C:\\Windows',
      'C:\\Program Files',
      '/etc',
      '/usr/bin',
      '/System'
    ];

    for (const systemPath of systemPaths) {
      if (filePath.startsWith(systemPath)) {
        console.log(`   ❌ Tentativa de escrita em diretório do sistema bloqueada`);
        return {
          decision: "block",
          reason: `Cannot write to system directory: ${systemPath}`
        };
      }
    }

    // Verifica extensões perigosas
    const dangerousExtensions = ['.exe', '.dll', '.sys', '.bat', '.cmd'];
    const extension = filePath.substring(filePath.lastIndexOf('.'));

    if (dangerousExtensions.includes(extension)) {
      console.log(`   ⚠️ Extensão potencialmente perigosa: ${extension}`);

      // Permite apenas em diretórios específicos
      if (!filePath.includes('pedro\\GitHub')) {
        return {
          decision: "block",
          reason: `Dangerous file extension: ${extension}`
        };
      }
    }

    console.log(`   ✅ Operação de escrita aprovada`);
    return { continue: true };
  }

  /**
   * Valida operações de edição
   */
  validateEditOperation(toolInput) {
    const { file_path, old_string, new_string } = toolInput;

    // Verifica mudanças sensíveis
    const sensitivePatterns = [
      /password\s*=\s*["'].*["']/i,
      /api[_-]?key\s*=\s*["'].*["']/i,
      /secret\s*=\s*["'].*["']/i,
      /token\s*=\s*["'].*["']/i
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(old_string) || pattern.test(new_string)) {
        console.log(`   ⚠️ Edição envolve informações sensíveis`);

        // Log especial para edições sensíveis
        this.auditLog.push({
          type: 'sensitive_edit',
          file: file_path,
          timestamp: new Date().toISOString(),
          warning: 'Edit involves sensitive data'
        });

        // Não bloqueia, mas registra
        this.emit('sensitive:edit', {
          file: file_path,
          type: 'credential_change'
        });
      }
    }

    return { continue: true };
  }

  /**
   * Valida operações de exclusão
   */
  validateDeleteOperation(toolInput) {
    const path = toolInput.path || toolInput.file_path;

    console.log(`   🗑️ Validando exclusão: ${path}`);

    // Nunca permitir exclusão de diretórios críticos
    const criticalPaths = [
      'C:\\',
      '/',
      'C:\\Windows',
      'C:\\Users',
      '/home',
      '/usr'
    ];

    for (const critical of criticalPaths) {
      if (path === critical || path === critical + '\\' || path === critical + '/') {
        return {
          decision: "block",
          reason: `Cannot delete critical path: ${critical}`
        };
      }
    }

    // Aviso para exclusões em massa
    if (path.includes('*')) {
      console.log(`   ⚠️ Exclusão em massa detectada`);

      this.emit('warning:deletion', {
        path,
        type: 'bulk_deletion'
      });
    }

    return { continue: true };
  }

  /**
   * Hook de validação geral
   */
  createValidationHook() {
    return async (input, toolUseId, { signal }) => {
      console.log(`✓ [VALIDATION] Validando parâmetros...`);

      // Valida tamanho de entrada
      const inputSize = JSON.stringify(input.tool_input).length;
      if (inputSize > 1024 * 1024) { // 1MB
        return {
          decision: "block",
          reason: "Input size exceeds limit (1MB)"
        };
      }

      // Valida timeout se aplicável
      if (input.tool_input.timeout && input.tool_input.timeout > 60000) {
        console.log(`   ⚠️ Timeout muito alto: ${input.tool_input.timeout}ms`);

        // Ajusta timeout para valor seguro
        input.tool_input.timeout = 60000;
        console.log(`   📝 Timeout ajustado para: 60000ms`);
      }

      return { continue: true };
    };
  }

  /**
   * Hook de rate limiting
   */
  createRateLimitHook() {
    return async (input, toolUseId, { signal }) => {
      const toolName = input.tool_name;
      const now = Date.now();

      // Inicializa métricas se não existir
      if (!this.toolMetrics.has(toolName)) {
        this.toolMetrics.set(toolName, {
          count: 0,
          lastUsed: 0,
          windowStart: now
        });
      }

      const metrics = this.toolMetrics.get(toolName);

      // Reset janela a cada minuto
      if (now - metrics.windowStart > 60000) {
        metrics.count = 0;
        metrics.windowStart = now;
      }

      // Verifica rate limit (exemplo: 30 usos por minuto)
      const rateLimit = this.getRateLimit(toolName);

      if (metrics.count >= rateLimit) {
        console.log(`   ❌ Rate limit excedido: ${toolName} (${metrics.count}/${rateLimit})`);

        return {
          decision: "block",
          reason: `Rate limit exceeded: ${metrics.count}/${rateLimit} uses per minute`
        };
      }

      // Atualiza métricas
      metrics.count++;
      metrics.lastUsed = now;

      return { continue: true };
    };
  }

  /**
   * Obtém rate limit por ferramenta
   */
  getRateLimit(toolName) {
    const limits = {
      'Bash': 30,
      'Write': 50,
      'Edit': 100,
      'Read': 200,
      'Delete': 10
    };

    return limits[toolName] || 50;
  }

  /**
   * Hook pós-execução
   */
  createPostToolHook() {
    return async (input, toolUseId, { signal }) => {
      console.log(`\n✅ [POST] Ferramenta concluída: ${input.tool_name}`);

      // Emite evento de conclusão
      this.emit('tool:complete', {
        toolName: input.tool_name,
        toolUseId,
        timestamp: new Date()
      });

      return { continue: true };
    };
  }

  /**
   * Hook de auditoria
   */
  createAuditHook() {
    return async (input, toolUseId, { signal }) => {
      console.log(`📝 [AUDIT] Registrando execução...`);

      const auditEntry = {
        type: 'post_tool',
        toolName: input.tool_name,
        toolUseId,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        success: true,
        result: input.result ? 'success' : 'unknown'
      };

      this.auditLog.push(auditEntry);

      // Salva em arquivo
      appendFileSync(
        `audit-${this.sessionId}.log`,
        JSON.stringify(auditEntry) + '\n'
      );

      return { continue: true };
    };
  }

  /**
   * Hook de métricas
   */
  createMetricsHook() {
    return async (input, toolUseId, { signal }) => {
      const toolName = input.tool_name;
      const metrics = this.toolMetrics.get(toolName) || {};

      // Atualiza estatísticas
      if (!metrics.totalExecutions) {
        metrics.totalExecutions = 0;
        metrics.totalDuration = 0;
        metrics.errors = 0;
      }

      metrics.totalExecutions++;

      // Calcula duração se possível
      if (metrics.lastUsed) {
        const duration = Date.now() - metrics.lastUsed;
        metrics.totalDuration += duration;
        metrics.averageDuration = metrics.totalDuration / metrics.totalExecutions;

        console.log(`   ⏱️ Duração: ${duration}ms (média: ${metrics.averageDuration.toFixed(0)}ms)`);
      }

      this.toolMetrics.set(toolName, metrics);

      return { continue: true };
    };
  }

  /**
   * Hook de notificação
   */
  createNotificationHook() {
    return async (input, toolUseId, { signal }) => {
      // Notificações para operações importantes
      const importantTools = ['Delete', 'Bash', 'Database'];

      if (importantTools.includes(input.tool_name)) {
        console.log(`\n🔔 [NOTIFICATION] Operação importante concluída`);

        this.emit('important:operation', {
          toolName: input.tool_name,
          toolUseId,
          timestamp: new Date()
        });

        // Em produção, poderia enviar email/SMS/Slack
      }

      return { continue: true };
    };
  }

  /**
   * Hook de erro
   */
  createErrorHook() {
    return async (error, toolUseId, { signal }) => {
      console.error(`\n❌ [ERROR] Erro na ferramenta`);
      console.error(`   Tool ID: ${toolUseId}`);
      console.error(`   Erro: ${error.message}`);

      // Registra erro
      this.auditLog.push({
        type: 'error',
        toolUseId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      });

      // Atualiza métricas de erro
      const toolName = error.toolName || 'unknown';
      const metrics = this.toolMetrics.get(toolName) || {};
      metrics.errors = (metrics.errors || 0) + 1;
      this.toolMetrics.set(toolName, metrics);

      // Emite evento de erro
      this.emit('tool:error', {
        toolUseId,
        error,
        timestamp: new Date()
      });

      return { continue: true };
    };
  }

  /**
   * Carrega configuração salva
   */
  loadConfiguration() {
    if (existsSync(this.configFile)) {
      try {
        const config = JSON.parse(readFileSync(this.configFile, 'utf-8'));

        if (config.blockedCommands) {
          this.blockedCommands = new Set(config.blockedCommands);
        }

        if (config.allowedCommands) {
          this.allowedCommands = new Set(config.allowedCommands);
        }

        console.log(`✅ Configuração carregada de ${this.configFile}`);
      } catch (error) {
        console.error(`❌ Erro ao carregar configuração:`, error);
      }
    }
  }

  /**
   * Salva configuração atual
   */
  saveConfiguration() {
    const config = {
      blockedCommands: Array.from(this.blockedCommands),
      allowedCommands: Array.from(this.allowedCommands),
      timestamp: new Date().toISOString()
    };

    writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    console.log(`💾 Configuração salva em ${this.configFile}`);
  }

  /**
   * Gera relatório de sessão
   */
  generateReport() {
    console.log("\n" + "═".repeat(60));
    console.log("📊 RELATÓRIO DE HOOKS");
    console.log("═".repeat(60));
    console.log(`Session ID: ${this.sessionId}`);
    console.log(`Total de eventos: ${this.auditLog.length}`);

    console.log("\n📈 Métricas por Ferramenta:");
    for (const [tool, metrics] of this.toolMetrics) {
      console.log(`\n   ${tool}:`);
      console.log(`     Execuções: ${metrics.totalExecutions || 0}`);
      console.log(`     Erros: ${metrics.errors || 0}`);
      if (metrics.averageDuration) {
        console.log(`     Duração média: ${metrics.averageDuration.toFixed(0)}ms`);
      }
    }

    console.log("\n🚫 Comandos Bloqueados:");
    const blockedEvents = this.auditLog.filter(e => e.type === 'blocked_command');
    blockedEvents.forEach(e => {
      console.log(`   • ${e.command} - ${e.reason}`);
    });

    // Salva relatório completo
    const reportPath = `hooks-report-${this.sessionId}.json`;
    writeFileSync(reportPath, JSON.stringify({
      sessionId: this.sessionId,
      auditLog: this.auditLog,
      metrics: Object.fromEntries(this.toolMetrics),
      blockedCommands: Array.from(this.blockedCommands),
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`\n💾 Relatório completo salvo em ${reportPath}`);
  }
}

/**
 * Exemplo de uso com hooks
 */
async function runWithHooks() {
  console.log("🚀 Sistema de Hooks Ativo");
  console.log("=" .repeat(60));

  const hooksSystem = new HooksSystem();

  // Configura listeners de eventos
  hooksSystem.on('tool:start', (data) => {
    console.log(`\n🟢 Evento: Ferramenta iniciada - ${data.toolName}`);
  });

  hooksSystem.on('tool:complete', (data) => {
    console.log(`\n🔵 Evento: Ferramenta concluída - ${data.toolName}`);
  });

  hooksSystem.on('tool:error', (data) => {
    console.log(`\n🔴 Evento: Erro na ferramenta - ${data.error.message}`);
  });

  hooksSystem.on('sensitive:edit', (data) => {
    console.log(`\n⚠️ Alerta: Edição sensível detectada em ${data.file}`);
  });

  try {
    const result = await query({
      prompt: "Help me refactor the tax calculation module and add tests",
      options: {
        maxTurns: 10,
        allowedTools: ["Read", "Edit", "Write", "Bash"],
        hooks: hooksSystem.createHooks()
      }
    });

    for await (const message of result) {
      if (message.type === "result") {
        console.log("\n✅ Operação concluída com sucesso");
      }
    }

  } catch (error) {
    console.error("❌ Erro na execução:", error);
  } finally {
    // Gera relatório final
    hooksSystem.generateReport();

    // Salva configuração
    hooksSystem.saveConfiguration();
  }
}

/**
 * Exemplo simples de bloqueio de comando
 */
async function simpleBlockExample() {
  console.log("\n🔒 Exemplo de Bloqueio de Comando");
  console.log("=" .repeat(50));

  const result = await query({
    prompt: "Delete all temporary files",
    options: {
      hooks: {
        PreToolUse: [{
          hooks: [async (input, toolUseId, { signal }) => {
            console.log(`\n🔧 Ferramenta: ${input.tool_name}`);

            // Bloqueia comandos rm -rf
            if (input.tool_name === "Bash") {
              const command = input.tool_input.command;

              if (command && command.includes("rm -rf")) {
                console.log(`❌ Comando perigoso bloqueado: ${command}`);

                return {
                  decision: "block",
                  reason: "Dangerous command blocked: rm -rf"
                };
              }
            }

            console.log(`✅ Comando aprovado`);
            return { continue: true };
          }]
        }],
        PostToolUse: [{
          hooks: [async (input, toolUseId, { signal }) => {
            console.log(`✅ Ferramenta concluída: ${input.tool_name}`);
            return { continue: true };
          }]
        }]
      }
    }
  });

  for await (const message of result) {
    if (message.type === "result") {
      console.log("Resultado:", message.result);
    }
  }
}

// Exportar classes e funções
export {
  HooksSystem,
  runWithHooks,
  simpleBlockExample
};

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--full') {
    runWithHooks().catch(console.error);
  } else if (args[0] === '--simple') {
    simpleBlockExample().catch(console.error);
  } else {
    console.log(`
Uso: node hooks-system.js [opção]

Opções:
  --full     Sistema completo de hooks
  --simple   Exemplo simples de bloqueio

Exemplos:
  node hooks-system.js --full
  node hooks-system.js --simple
    `);
  }
}