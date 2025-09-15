/**
 * Claude Code Permissions Configuration System
 * Pedro Tiago Contabilidade - Sistema de Configuração de Permissões
 */

import { query } from "@anthropic-ai/claude-code";
import { readFileSync, writeFileSync, existsSync, watchFile } from "fs";
import { join, resolve } from "path";
import minimatch from "minimatch";

/**
 * Sistema de permissões baseado em configuração
 */
class PermissionsConfigSystem {
  constructor(configPath = './claude-permissions.json') {
    this.configPath = configPath;
    this.permissions = {
      allow: [],
      deny: [],
      ask: []
    };
    this.cache = new Map();
    this.statistics = {
      allowed: 0,
      denied: 0,
      asked: 0,
      total: 0
    };

    // Carrega configuração
    this.loadConfig();

    // Monitora mudanças no arquivo de config
    this.watchConfig();
  }

  /**
   * Carrega configuração de permissões
   */
  loadConfig() {
    try {
      if (existsSync(this.configPath)) {
        const configContent = readFileSync(this.configPath, 'utf-8');
        const config = JSON.parse(configContent);
        this.permissions = config.permissions || this.permissions;
        console.log(`✅ Configuração de permissões carregada de ${this.configPath}`);
      } else {
        // Cria configuração padrão se não existir
        this.createDefaultConfig();
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar configuração:`, error);
      this.createDefaultConfig();
    }
  }

  /**
   * Cria configuração padrão
   */
  createDefaultConfig() {
    const defaultConfig = {
      "permissions": {
        "allow": [
          // Comandos de desenvolvimento seguros
          "Bash(npm run lint)",
          "Bash(npm run test:*)",
          "Bash(npm run build)",
          "Bash(python -m pytest)",
          "Bash(git status)",
          "Bash(git diff)",
          "Bash(ls:*)",
          "Bash(pwd)",
          "Bash(echo:*)",

          // Leitura de arquivos de configuração seguros
          "Read(./package.json)",
          "Read(./tsconfig.json)",
          "Read(./.eslintrc*)",
          "Read(./README.md)",
          "Read(./src/**)",

          // Ferramentas de análise
          "Grep(*)",
          "Glob(*)"
        ],
        "deny": [
          // Comandos perigosos
          "Bash(rm -rf:*)",
          "Bash(curl:*)",
          "Bash(wget:*)",
          "Bash(sudo:*)",
          "Bash(shutdown:*)",
          "Bash(format:*)",

          // Arquivos sensíveis
          "Read(./.env)",
          "Read(./.env.*)",
          "Read(./secrets/**)",
          "Read(**/*password*)",
          "Read(**/*secret*)",
          "Read(**/*key*)",
          "Write(./.env)",
          "Write(./secrets/**)",

          // Operações de rede não confiáveis
          "WebFetch",

          // Diretórios do sistema
          "Read(C:\\Windows\\**)",
          "Write(C:\\Windows\\**)",
          "Read(/etc/**)",
          "Write(/etc/**)"
        ],
        "ask": [
          // Operações que requerem confirmação
          "Bash(git push:*)",
          "Bash(git merge:*)",
          "Bash(npm publish)",
          "Bash(pip install:*)",
          "Write(./production/**)",
          "Write(./dist/**)",
          "Edit(./.github/**)",
          "Delete(*)"
        ]
      },
      "rules": {
        "autoApproveTimeout": 30000,
        "cacheDuration": 300000,
        "strictMode": false,
        "logLevel": "info"
      },
      "customPatterns": {
        "accounting": {
          "allow": [
            "Read(./agente_*.py)",
            "Bash(python agente_*.py)",
            "Read(./relatorios/**)"
          ],
          "deny": [
            "Write(./dados_fiscais/**)",
            "Delete(./backup/**)"
          ]
        }
      }
    };

    writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    this.permissions = defaultConfig.permissions;
    console.log(`📝 Configuração padrão criada em ${this.configPath}`);
  }

  /**
   * Monitora mudanças no arquivo de configuração
   */
  watchConfig() {
    if (existsSync(this.configPath)) {
      watchFile(this.configPath, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          console.log(`\n🔄 Configuração modificada, recarregando...`);
          this.loadConfig();
          this.cache.clear(); // Limpa cache ao recarregar
        }
      });
    }
  }

  /**
   * Verifica permissão para uma ferramenta
   */
  checkPermission(toolName, toolInput) {
    this.statistics.total++;

    // Cria chave para verificação
    const key = this.createPermissionKey(toolName, toolInput);

    // Verifica cache primeiro
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      console.log(`📦 Usando permissão em cache: ${cached.decision}`);
      return cached;
    }

    // Verifica nas listas de permissão
    let decision = this.evaluatePermission(key, toolName, toolInput);

    // Adiciona ao cache
    this.cache.set(key, decision);

    // Limpa cache antigo periodicamente
    if (this.cache.size > 100) {
      this.cleanCache();
    }

    return decision;
  }

  /**
   * Cria chave de permissão baseada na ferramenta e entrada
   */
  createPermissionKey(toolName, toolInput) {
    switch (toolName) {
      case 'Bash':
        return `Bash(${toolInput.command || '*'})`;

      case 'Read':
      case 'Write':
      case 'Edit':
        return `${toolName}(${toolInput.file_path || toolInput.path || '*'})`;

      case 'Delete':
        return `Delete(${toolInput.path || '*'})`;

      case 'WebFetch':
        return `WebFetch(${toolInput.url || '*'})`;

      default:
        return `${toolName}(*)`;
    }
  }

  /**
   * Avalia permissão baseada nas regras
   */
  evaluatePermission(key, toolName, toolInput) {
    console.log(`\n🔍 Avaliando permissão: ${key}`);

    // 1. Verifica lista de negação primeiro (maior prioridade)
    for (const pattern of this.permissions.deny) {
      if (this.matchPattern(key, pattern)) {
        console.log(`   ❌ Negado por regra: ${pattern}`);
        this.statistics.denied++;

        return {
          decision: 'deny',
          reason: `Blocked by deny rule: ${pattern}`,
          pattern
        };
      }
    }

    // 2. Verifica lista de aprovação
    for (const pattern of this.permissions.allow) {
      if (this.matchPattern(key, pattern)) {
        console.log(`   ✅ Permitido por regra: ${pattern}`);
        this.statistics.allowed++;

        return {
          decision: 'allow',
          reason: `Allowed by rule: ${pattern}`,
          pattern
        };
      }
    }

    // 3. Verifica lista de confirmação
    for (const pattern of this.permissions.ask) {
      if (this.matchPattern(key, pattern)) {
        console.log(`   ❓ Requer confirmação: ${pattern}`);
        this.statistics.asked++;

        return {
          decision: 'ask',
          reason: `Requires confirmation: ${pattern}`,
          pattern
        };
      }
    }

    // 4. Comportamento padrão (negar se não estiver explicitamente permitido)
    console.log(`   ⚠️ Sem regra específica, aplicando política padrão`);
    this.statistics.denied++;

    return {
      decision: 'deny',
      reason: 'No matching rule found (default deny)',
      pattern: null
    };
  }

  /**
   * Verifica se a chave corresponde ao padrão
   */
  matchPattern(key, pattern) {
    // Suporte para wildcards e glob patterns
    if (pattern.includes('*') || pattern.includes('**')) {
      return minimatch(key, pattern, {
        nocase: true,
        matchBase: true
      });
    }

    // Comparação exata
    return key === pattern;
  }

  /**
   * Limpa entradas antigas do cache
   */
  cleanCache() {
    const maxAge = 5 * 60 * 1000; // 5 minutos
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }

    console.log(`🧹 Cache limpo, ${this.cache.size} entradas restantes`);
  }

  /**
   * Cria hook de permissões para Claude Code
   */
  createPermissionHook() {
    return async (input, toolUseId, { signal }) => {
      const decision = this.checkPermission(input.tool_name, input.tool_input);

      switch (decision.decision) {
        case 'allow':
          return { continue: true };

        case 'deny':
          return {
            decision: 'block',
            reason: decision.reason
          };

        case 'ask':
          // Em produção, isso seria interativo
          const approved = await this.promptUser(input.tool_name, input.tool_input, decision);

          if (approved) {
            // Adiciona temporariamente à lista de permitidos
            this.addTemporaryPermission(input.tool_name, input.tool_input);
            return { continue: true };
          } else {
            return {
              decision: 'block',
              reason: 'User denied permission'
            };
          }

        default:
          return {
            decision: 'block',
            reason: 'Unknown decision type'
          };
      }
    };
  }

  /**
   * Solicita confirmação do usuário (simulado)
   */
  async promptUser(toolName, toolInput, decision) {
    console.log(`\n❓ CONFIRMAÇÃO NECESSÁRIA`);
    console.log(`   Ferramenta: ${toolName}`);
    console.log(`   Razão: ${decision.reason}`);

    // Em produção, isso seria uma interface real
    // Por agora, simula aprovação automática para demonstração
    console.log(`   ✅ Auto-aprovado para demonstração`);

    return true;
  }

  /**
   * Adiciona permissão temporária
   */
  addTemporaryPermission(toolName, toolInput) {
    const key = this.createPermissionKey(toolName, toolInput);

    // Adiciona ao cache com decisão temporária
    this.cache.set(key, {
      decision: 'allow',
      reason: 'Temporarily allowed by user',
      timestamp: Date.now(),
      temporary: true
    });

    console.log(`⏱️ Permissão temporária adicionada: ${key}`);
  }

  /**
   * Gera relatório de permissões
   */
  generateReport() {
    console.log("\n" + "═".repeat(60));
    console.log("📊 RELATÓRIO DE PERMISSÕES");
    console.log("═".repeat(60));

    console.log("\n📈 Estatísticas:");
    console.log(`   Total de verificações: ${this.statistics.total}`);
    console.log(`   ✅ Permitidas: ${this.statistics.allowed}`);
    console.log(`   ❌ Negadas: ${this.statistics.denied}`);
    console.log(`   ❓ Confirmações: ${this.statistics.asked}`);

    if (this.statistics.total > 0) {
      const allowRate = ((this.statistics.allowed / this.statistics.total) * 100).toFixed(1);
      const denyRate = ((this.statistics.denied / this.statistics.total) * 100).toFixed(1);

      console.log(`\n   Taxa de aprovação: ${allowRate}%`);
      console.log(`   Taxa de negação: ${denyRate}%`);
    }

    console.log("\n📋 Configuração Atual:");
    console.log(`   Regras Allow: ${this.permissions.allow.length}`);
    console.log(`   Regras Deny: ${this.permissions.deny.length}`);
    console.log(`   Regras Ask: ${this.permissions.ask.length}`);
    console.log(`   Cache: ${this.cache.size} entradas`);

    // Salva relatório
    const reportPath = `permissions-report-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify({
      statistics: this.statistics,
      permissions: this.permissions,
      cacheSize: this.cache.size,
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`\n💾 Relatório salvo em ${reportPath}`);
  }
}

/**
 * Sistema de permissões para ambiente contábil
 */
class AccountingPermissionsSystem extends PermissionsConfigSystem {
  constructor() {
    super('./accounting-permissions.json');
    this.setupAccountingRules();
  }

  /**
   * Configura regras específicas para contabilidade
   */
  setupAccountingRules() {
    // Adiciona regras específicas para sistemas contábeis
    this.permissions.allow.push(
      // Permite leitura de dados contábeis
      "Read(./dados_contabeis/**)",
      "Read(./relatorios/**)",
      "Read(./notas_fiscais/**)",

      // Permite execução de agentes
      "Bash(python agente_navegador_contabil.py)",
      "Bash(python agente_relatorios.py)",
      "Bash(python agente_backup.py)",

      // Permite operações seguras
      "Write(./temp/**)",
      "Write(./cache/**)"
    );

    this.permissions.deny.push(
      // Protege dados sensíveis
      "Read(./senhas.json)",
      "Read(./tokens/**)",
      "Write(./dados_fiscais/originais/**)",

      // Bloqueia operações perigosas
      "Delete(./backup/**)",
      "Delete(./dados_contabeis/**)",
      "Bash(rm:./dados_fiscais/**)"
    );

    this.permissions.ask.push(
      // Requer confirmação para operações críticas
      "Write(./dados_fiscais/**)",
      "Bash(python enviar_sped.py)",
      "Bash(python processar_folha.py)",
      "Edit(./config/database.json)"
    );

    console.log("📊 Regras contábeis configuradas");
  }
}

/**
 * Exemplo de uso com configuração de permissões
 */
async function runWithPermissions() {
  console.log("🔐 Sistema de Permissões Configurado");
  console.log("=" .repeat(60));

  const permSystem = new PermissionsConfigSystem();

  try {
    const result = await query({
      prompt: "Analyze and optimize the accounting system",
      options: {
        maxTurns: 10,
        allowedTools: ["Read", "Edit", "Write", "Bash"],
        hooks: {
          PreToolUse: [{
            hooks: [permSystem.createPermissionHook()]
          }]
        }
      }
    });

    for await (const message of result) {
      if (message.type === "result") {
        console.log("\n✅ Operação concluída");
      }
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    permSystem.generateReport();
  }
}

/**
 * Exemplo específico para contabilidade
 */
async function runAccountingExample() {
  console.log("💼 Sistema de Permissões Contábeis");
  console.log("=" .repeat(60));

  const accountingPerms = new AccountingPermissionsSystem();

  // Testa algumas permissões
  const tests = [
    { tool: 'Read', input: { file_path: './dados_contabeis/balanco.xlsx' } },
    { tool: 'Write', input: { file_path: './dados_fiscais/sped.txt' } },
    { tool: 'Bash', input: { command: 'python agente_navegador_contabil.py' } },
    { tool: 'Delete', input: { path: './backup/2024' } },
    { tool: 'Read', input: { file_path: './.env' } }
  ];

  console.log("\n🧪 Testando permissões:");
  for (const test of tests) {
    const result = accountingPerms.checkPermission(test.tool, test.input);
    console.log(`\n   ${test.tool}(${JSON.stringify(test.input)})`);
    console.log(`   → ${result.decision}: ${result.reason}`);
  }

  accountingPerms.generateReport();
}

// Exportar classes e funções
export {
  PermissionsConfigSystem,
  AccountingPermissionsSystem,
  runWithPermissions,
  runAccountingExample
};

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--run') {
    runWithPermissions().catch(console.error);
  } else if (args[0] === '--accounting') {
    runAccountingExample().catch(console.error);
  } else if (args[0] === '--create-config') {
    const permSystem = new PermissionsConfigSystem();
    console.log("✅ Arquivo de configuração criado");
  } else {
    console.log(`
Uso: node permissions-config.js [opção]

Opções:
  --run              Executa com sistema de permissões
  --accounting       Exemplo específico para contabilidade
  --create-config    Cria arquivo de configuração padrão

Exemplos:
  node permissions-config.js --create-config
  node permissions-config.js --run
  node permissions-config.js --accounting
    `);
  }
}