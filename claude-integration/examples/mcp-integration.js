/**
 * Claude Code MCP Integration System
 * Pedro Tiago Contabilidade - Integração com Model Context Protocol
 */

import { query } from "@anthropic-ai/claude-code";
import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import WebSocket from "ws";

/**
 * Sistema de integração com MCP Servers
 */
class MCPIntegrationSystem {
  constructor(configPath = './mcp-config.json') {
    this.configPath = configPath;
    this.servers = new Map();
    this.connections = new Map();
    this.config = null;

    // Carrega configuração
    this.loadConfiguration();
  }

  /**
   * Carrega configuração MCP
   */
  loadConfiguration() {
    try {
      if (existsSync(this.configPath)) {
        const content = readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(content);
        console.log(`✅ Configuração MCP carregada de ${this.configPath}`);
      } else {
        this.createDefaultConfig();
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar configuração:`, error);
      this.createDefaultConfig();
    }
  }

  /**
   * Cria configuração padrão para ambiente contábil
   */
  createDefaultConfig() {
    const defaultConfig = {
      "mcpServers": {
        "filesystem": {
          "command": "npx",
          "args": ["@modelcontextprotocol/server-filesystem"],
          "env": {
            "ALLOWED_PATHS": "C:\\Users\\pedro\\GitHub\\pedro-tiago-contabilidade"
          },
          "description": "Acesso ao sistema de arquivos do projeto"
        },
        "database": {
          "command": "npx",
          "args": ["@modelcontextprotocol/server-postgres"],
          "env": {
            "DATABASE_URL": "postgresql://user:pass@localhost/contabilidade"
          },
          "description": "Acesso ao banco de dados contábil"
        },
        "git": {
          "command": "npx",
          "args": ["@modelcontextprotocol/server-git"],
          "env": {
            "REPO_PATH": "C:\\Users\\pedro\\GitHub\\pedro-tiago-contabilidade"
          },
          "description": "Operações Git no repositório"
        },
        "calima": {
          "command": "node",
          "args": ["./mcp-servers/calima-server.js"],
          "env": {
            "CALIMA_API_URL": "https://api.calimaweb.com.br",
            "CALIMA_API_KEY": "${CALIMA_API_KEY}"
          },
          "description": "Integração com Calima Web"
        },
        "makrosystem": {
          "command": "node",
          "args": ["./mcp-servers/makrosystem-server.js"],
          "env": {
            "MAKRO_API_URL": "https://api.makrosystem.com.br",
            "MAKRO_API_KEY": "${MAKRO_API_KEY}"
          },
          "description": "Integração com Makrosystem Web"
        },
        "fiscal": {
          "command": "python",
          "args": ["./mcp-servers/fiscal_server.py"],
          "env": {
            "RECEITA_FEDERAL_CERT": "./certs/e-cac.pfx"
          },
          "description": "Integração com sistemas fiscais brasileiros"
        },
        "whatsapp": {
          "command": "node",
          "args": ["./mcp-servers/whatsapp-server.js"],
          "env": {
            "WHATSAPP_API_KEY": "${WHATSAPP_API_KEY}",
            "WHATSAPP_PHONE": "62999948445"
          },
          "description": "Integração com WhatsApp Business"
        }
      },
      "settings": {
        "autoStart": ["filesystem", "git"],
        "retryOnFailure": true,
        "maxRetries": 3,
        "healthCheckInterval": 30000,
        "logLevel": "info"
      }
    };

    writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    this.config = defaultConfig;
    console.log(`📝 Configuração MCP padrão criada em ${this.configPath}`);
  }

  /**
   * Inicia servidor MCP
   */
  async startServer(serverName) {
    if (this.servers.has(serverName)) {
      console.log(`⚠️ Servidor ${serverName} já está rodando`);
      return true;
    }

    const serverConfig = this.config.mcpServers[serverName];
    if (!serverConfig) {
      console.error(`❌ Servidor ${serverName} não configurado`);
      return false;
    }

    console.log(`\n🚀 Iniciando servidor MCP: ${serverName}`);
    console.log(`   Comando: ${serverConfig.command} ${serverConfig.args.join(' ')}`);

    try {
      // Substitui variáveis de ambiente
      const env = this.processEnvironmentVariables(serverConfig.env);

      // Inicia processo do servidor
      const serverProcess = spawn(serverConfig.command, serverConfig.args, {
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      // Configura handlers
      serverProcess.stdout.on('data', (data) => {
        console.log(`[${serverName}] ${data.toString()}`);
      });

      serverProcess.stderr.on('data', (data) => {
        console.error(`[${serverName}] ERROR: ${data.toString()}`);
      });

      serverProcess.on('close', (code) => {
        console.log(`[${serverName}] Processo encerrado com código ${code}`);
        this.servers.delete(serverName);
        this.connections.delete(serverName);

        // Tenta reiniciar se configurado
        if (this.config.settings.retryOnFailure && code !== 0) {
          console.log(`🔄 Tentando reiniciar ${serverName}...`);
          setTimeout(() => this.startServer(serverName), 5000);
        }
      });

      // Adiciona à lista de servidores ativos
      this.servers.set(serverName, {
        process: serverProcess,
        config: serverConfig,
        startTime: new Date(),
        status: 'running'
      });

      // Aguarda servidor estar pronto
      await this.waitForServer(serverName);

      console.log(`✅ Servidor ${serverName} iniciado com sucesso`);
      return true;

    } catch (error) {
      console.error(`❌ Erro ao iniciar servidor ${serverName}:`, error);
      return false;
    }
  }

  /**
   * Processa variáveis de ambiente
   */
  processEnvironmentVariables(env) {
    const processed = {};

    for (const [key, value] of Object.entries(env)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        // Substitui variável de ambiente
        const envVar = value.slice(2, -1);
        processed[key] = process.env[envVar] || '';
      } else {
        processed[key] = value;
      }
    }

    return processed;
  }

  /**
   * Aguarda servidor estar pronto
   */
  async waitForServer(serverName, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.checkServerHealth(serverName)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Timeout aguardando servidor ${serverName}`);
  }

  /**
   * Verifica saúde do servidor
   */
  async checkServerHealth(serverName) {
    const server = this.servers.get(serverName);
    if (!server) return false;

    // Implementação simplificada - em produção seria mais robusta
    return server.status === 'running';
  }

  /**
   * Para servidor MCP
   */
  stopServer(serverName) {
    const server = this.servers.get(serverName);
    if (!server) {
      console.log(`⚠️ Servidor ${serverName} não está rodando`);
      return;
    }

    console.log(`🛑 Parando servidor ${serverName}...`);
    server.process.kill();
    this.servers.delete(serverName);
    this.connections.delete(serverName);
  }

  /**
   * Inicia todos os servidores configurados para auto-start
   */
  async startAutoServers() {
    const autoStart = this.config.settings.autoStart || [];

    console.log(`\n🚀 Iniciando servidores automáticos: ${autoStart.join(', ')}`);

    for (const serverName of autoStart) {
      await this.startServer(serverName);
    }
  }

  /**
   * Para todos os servidores
   */
  stopAllServers() {
    console.log("\n🛑 Parando todos os servidores MCP...");

    for (const serverName of this.servers.keys()) {
      this.stopServer(serverName);
    }
  }

  /**
   * Conecta ao servidor MCP via WebSocket
   */
  async connectToServer(serverName, port = 3000) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      ws.on('open', () => {
        console.log(`✅ Conectado ao servidor ${serverName}`);
        this.connections.set(serverName, ws);
        resolve(ws);
      });

      ws.on('error', (error) => {
        console.error(`❌ Erro na conexão com ${serverName}:`, error);
        reject(error);
      });

      ws.on('close', () => {
        console.log(`🔌 Conexão com ${serverName} encerrada`);
        this.connections.delete(serverName);
      });
    });
  }

  /**
   * Envia comando para servidor MCP
   */
  async sendCommand(serverName, command) {
    const connection = this.connections.get(serverName);
    if (!connection) {
      throw new Error(`Não conectado ao servidor ${serverName}`);
    }

    return new Promise((resolve, reject) => {
      connection.send(JSON.stringify(command));

      connection.once('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Gera relatório de status
   */
  generateStatusReport() {
    console.log("\n" + "═".repeat(60));
    console.log("📊 STATUS DOS SERVIDORES MCP");
    console.log("═".repeat(60));

    console.log("\n🖥️ Servidores Configurados:");
    for (const [name, config] of Object.entries(this.config.mcpServers)) {
      const server = this.servers.get(name);
      const status = server ? '🟢 Running' : '🔴 Stopped';
      console.log(`   ${name}: ${status}`);
      console.log(`     Descrição: ${config.description}`);

      if (server) {
        const uptime = Math.floor((Date.now() - server.startTime) / 1000);
        console.log(`     Uptime: ${uptime}s`);
      }
    }

    console.log("\n🔌 Conexões Ativas:");
    for (const serverName of this.connections.keys()) {
      console.log(`   • ${serverName}`);
    }

    console.log("\n⚙️ Configurações:");
    console.log(`   Auto-start: ${this.config.settings.autoStart.join(', ')}`);
    console.log(`   Retry on failure: ${this.config.settings.retryOnFailure}`);
    console.log(`   Health check interval: ${this.config.settings.healthCheckInterval}ms`);
  }
}

/**
 * Servidor MCP customizado para Calima Web
 */
class CalimaMCPServer {
  constructor() {
    this.wss = null;
    this.port = 3001;
  }

  /**
   * Inicia servidor Calima MCP
   */
  start() {
    this.wss = new WebSocket.Server({ port: this.port });

    console.log(`🌐 Calima MCP Server rodando na porta ${this.port}`);

    this.wss.on('connection', (ws) => {
      console.log('📱 Cliente conectado ao Calima MCP');

      ws.on('message', async (message) => {
        try {
          const command = JSON.parse(message.toString());
          const response = await this.handleCommand(command);
          ws.send(JSON.stringify(response));
        } catch (error) {
          ws.send(JSON.stringify({
            error: error.message
          }));
        }
      });
    });
  }

  /**
   * Processa comandos do Calima
   */
  async handleCommand(command) {
    switch (command.action) {
      case 'login':
        return this.login(command.credentials);

      case 'extractReport':
        return this.extractReport(command.reportType);

      case 'uploadDocument':
        return this.uploadDocument(command.document);

      case 'getClients':
        return this.getClients();

      default:
        throw new Error(`Comando desconhecido: ${command.action}`);
    }
  }

  /**
   * Login no Calima Web
   */
  async login(credentials) {
    console.log('🔐 Fazendo login no Calima Web...');

    // Simulação - em produção seria real
    return {
      success: true,
      token: 'calima-token-123',
      message: 'Login realizado com sucesso'
    };
  }

  /**
   * Extrai relatório do Calima
   */
  async extractReport(reportType) {
    console.log(`📊 Extraindo relatório: ${reportType}`);

    // Simulação de extração
    return {
      success: true,
      report: {
        type: reportType,
        data: [],
        generated: new Date().toISOString()
      }
    };
  }

  /**
   * Upload de documento para o Calima
   */
  async uploadDocument(document) {
    console.log(`📤 Fazendo upload de documento: ${document.name}`);

    return {
      success: true,
      documentId: 'doc-456',
      message: 'Documento enviado com sucesso'
    };
  }

  /**
   * Obtém lista de clientes
   */
  async getClients() {
    console.log('👥 Obtendo lista de clientes...');

    return {
      success: true,
      clients: [
        { id: 1, name: 'Cliente A', cnpj: '11.111.111/0001-11' },
        { id: 2, name: 'Cliente B', cnpj: '22.222.222/0001-22' }
      ]
    };
  }
}

/**
 * Exemplo de uso com MCP
 */
async function runWithMCP() {
  console.log("🚀 Sistema MCP para Contabilidade");
  console.log("=" .repeat(60));

  const mcpSystem = new MCPIntegrationSystem();

  try {
    // Inicia servidores automáticos
    await mcpSystem.startAutoServers();

    // Inicia servidor Calima customizado
    await mcpSystem.startServer('calima');

    // Executa query com acesso aos servidores MCP
    const result = await query({
      prompt: `Using the MCP servers, perform these accounting tasks:
        1. Read the latest financial reports from the filesystem
        2. Extract data from Calima Web
        3. Generate consolidated report
        4. Send summary via WhatsApp`,
      options: {
        maxTurns: 10,
        mcpServers: mcpSystem.config.mcpServers,
        allowedTools: ["Read", "Write", "MCP"]
      }
    });

    for await (const message of result) {
      if (message.type === "mcp_call") {
        console.log(`🔧 MCP Call: ${message.server} - ${message.action}`);
      } else if (message.type === "result") {
        console.log("✅ Tarefa concluída");
      }
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    // Gera relatório e para servidores
    mcpSystem.generateStatusReport();
    mcpSystem.stopAllServers();
  }
}

/**
 * Exemplo de servidor Calima standalone
 */
function runCalimaMCPServer() {
  console.log("🌐 Iniciando Calima MCP Server");
  console.log("=" .repeat(60));

  const server = new CalimaMCPServer();
  server.start();

  // Mantém servidor rodando
  process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    process.exit(0);
  });
}

/**
 * Cria arquivo de configuração de exemplo
 */
function createExampleServers() {
  // Cria diretório de servidores MCP
  const fs = require('fs');
  const path = require('path');

  const serverDir = './mcp-servers';
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }

  // Exemplo de servidor Calima
  const calimaServer = `
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

console.log('Calima MCP Server iniciado na porta 3001');

wss.on('connection', (ws) => {
  console.log('Cliente conectado');

  ws.on('message', (message) => {
    const command = JSON.parse(message);
    console.log('Comando recebido:', command);

    // Processa comando e envia resposta
    ws.send(JSON.stringify({
      success: true,
      result: 'Comando processado'
    }));
  });
});
`;

  fs.writeFileSync(path.join(serverDir, 'calima-server.js'), calimaServer);

  // Exemplo de servidor fiscal Python
  const fiscalServer = `
import asyncio
import websockets
import json

async def handle_command(websocket, path):
    async for message in websocket:
        command = json.loads(message)
        print(f"Comando fiscal recebido: {command}")

        # Processa comando fiscal
        response = {
            "success": True,
            "result": "Comando fiscal processado"
        }

        await websocket.send(json.dumps(response))

async def main():
    async with websockets.serve(handle_command, "localhost", 3002):
        print("Fiscal MCP Server rodando na porta 3002")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
`;

  fs.writeFileSync(path.join(serverDir, 'fiscal_server.py'), fiscalServer);

  console.log(`✅ Servidores de exemplo criados em ${serverDir}`);
}

// Exportar classes e funções
export {
  MCPIntegrationSystem,
  CalimaMCPServer,
  runWithMCP,
  runCalimaMCPServer,
  createExampleServers
};

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--run') {
    runWithMCP().catch(console.error);
  } else if (args[0] === '--calima') {
    runCalimaMCPServer();
  } else if (args[0] === '--create-servers') {
    createExampleServers();
  } else if (args[0] === '--create-config') {
    const mcpSystem = new MCPIntegrationSystem();
    console.log("✅ Configuração MCP criada");
  } else {
    console.log(`
Uso: node mcp-integration.js [opção]

Opções:
  --run              Executa sistema com MCP
  --calima           Inicia servidor Calima MCP
  --create-servers   Cria servidores de exemplo
  --create-config    Cria arquivo de configuração

Exemplos:
  node mcp-integration.js --create-config
  node mcp-integration.js --create-servers
  node mcp-integration.js --calima
  node mcp-integration.js --run
    `);
  }
}