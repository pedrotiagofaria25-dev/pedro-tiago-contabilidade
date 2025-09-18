/**
 * Claude Code MCP Tools Usage Examples
 * Pedro Tiago Contabilidade - Exemplos de Uso de Ferramentas MCP
 */

import { query } from "@anthropic-ai/claude-code";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Gerenciador de ferramentas MCP para operações contábeis
 */
class MCPToolsManager {
  constructor() {
    this.mcpConfigPath = ".mcp.json";
    this.resultsCache = new Map();
    this.setupMCPConfig();
  }

  /**
   * Configura arquivo .mcp.json se não existir
   */
  setupMCPConfig() {
    if (!existsSync(this.mcpConfigPath)) {
      const config = {
        "mcpServers": {
          "filesystem": {
            "command": "npx",
            "args": ["@modelcontextprotocol/server-filesystem"],
            "env": {
              "ALLOWED_PATHS": "C:\\Users\\pedro\\GitHub\\pedro-tiago-contabilidade"
            }
          },
          "puppeteer": {
            "command": "npx",
            "args": ["@modelcontextprotocol/server-puppeteer"],
            "env": {
              "HEADLESS": "false",
              "DEFAULT_TIMEOUT": "30000"
            }
          },
          "windows-notifications": {
            "command": "npx",
            "args": ["@modelcontextprotocol/server-windows-notifications"],
            "env": {}
          }
        }
      };

      writeFileSync(this.mcpConfigPath, JSON.stringify(config, null, 2));
      console.log(`✅ Arquivo .mcp.json criado`);
    }
  }

  /**
   * Lista arquivos do projeto usando MCP
   */
  async listProjectFiles(directory = ".") {
    console.log(`\n📁 Listando arquivos em: ${directory}`);
    console.log("=" .repeat(50));

    try {
      for await (const message of query({
        prompt: `List all files in ${directory}`,
        options: {
          mcpConfig: this.mcpConfigPath,
          allowedTools: ["mcp__filesystem__list_directory"]
        }
      })) {
        if (message.type === "result" && message.subtype === "success") {
          console.log("✅ Arquivos encontrados:");

          // Processa resultado
          const files = this.parseFileList(message.result);
          files.forEach(file => {
            console.log(`   ${file.type === 'dir' ? '📁' : '📄'} ${file.name}`);
          });

          // Cacheia resultado
          this.resultsCache.set(`files_${directory}`, files);

          return files;
        } else if (message.type === "error") {
          console.error(`❌ Erro: ${message.error}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao listar arquivos:`, error);
    }
  }

  /**
   * Lê arquivo usando MCP
   */
  async readFileWithMCP(filePath) {
    console.log(`\n📖 Lendo arquivo: ${filePath}`);

    try {
      for await (const message of query({
        prompt: `Read the file at ${filePath}`,
        options: {
          mcpConfig: this.mcpConfigPath,
          allowedTools: ["mcp__filesystem__read_file"]
        }
      })) {
        if (message.type === "result" && message.subtype === "success") {
          console.log("✅ Arquivo lido com sucesso");
          return message.result;
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao ler arquivo:`, error);
    }
  }

  /**
   * Escreve arquivo usando MCP
   */
  async writeFileWithMCP(filePath, content) {
    console.log(`\n✍️ Escrevendo arquivo: ${filePath}`);

    try {
      for await (const message of query({
        prompt: `Write the following content to ${filePath}:\n${content}`,
        options: {
          mcpConfig: this.mcpConfigPath,
          allowedTools: ["mcp__filesystem__write_file"]
        }
      })) {
        if (message.type === "result" && message.subtype === "success") {
          console.log("✅ Arquivo escrito com sucesso");
          return true;
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao escrever arquivo:`, error);
      return false;
    }
  }

  /**
   * Navega para URL usando Puppeteer MCP
   */
  async navigateToURL(url) {
    console.log(`\n🌐 Navegando para: ${url}`);

    try {
      for await (const message of query({
        prompt: `Navigate to ${url} and wait for page to load`,
        options: {
          mcpConfig: this.mcpConfigPath,
          allowedTools: ["mcp__puppeteer__puppeteer_navigate"]
        }
      })) {
        if (message.type === "result" && message.subtype === "success") {
          console.log("✅ Página carregada");
          return true;
        }
      }
    } catch (error) {
      console.error(`❌ Erro na navegação:`, error);
      return false;
    }
  }

  /**
   * Captura screenshot usando Puppeteer MCP
   */
  async captureScreenshot(outputPath) {
    console.log(`\n📸 Capturando screenshot: ${outputPath}`);

    try {
      for await (const message of query({
        prompt: `Take a screenshot and save it to ${outputPath}`,
        options: {
          mcpConfig: this.mcpConfigPath,
          allowedTools: ["mcp__puppeteer__puppeteer_screenshot"]
        }
      })) {
        if (message.type === "result" && message.subtype === "success") {
          console.log("✅ Screenshot capturado");
          return true;
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao capturar screenshot:`, error);
      return false;
    }
  }

  /**
   * Preenche formulário usando Puppeteer MCP
   */
  async fillForm(selector, value) {
    console.log(`\n✏️ Preenchendo formulário: ${selector}`);

    try {
      for await (const message of query({
        prompt: `Fill the form field ${selector} with value: ${value}`,
        options: {
          mcpConfig: this.mcpConfigPath,
          allowedTools: ["mcp__puppeteer__puppeteer_fill"]
        }
      })) {
        if (message.type === "result" && message.subtype === "success") {
          console.log("✅ Campo preenchido");
          return true;
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao preencher formulário:`, error);
      return false;
    }
  }

  /**
   * Clica em elemento usando Puppeteer MCP
   */
  async clickElement(selector) {
    console.log(`\n👆 Clicando em: ${selector}`);

    try {
      for await (const message of query({
        prompt: `Click on the element: ${selector}`,
        options: {
          mcpConfig: this.mcpConfigPath,
          allowedTools: ["mcp__puppeteer__puppeteer_click"]
        }
      })) {
        if (message.type === "result" && message.subtype === "success") {
          console.log("✅ Elemento clicado");
          return true;
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao clicar:`, error);
      return false;
    }
  }

  /**
   * Envia notificação Windows usando MCP
   */
  async sendNotification(title, message, icon = "info") {
    console.log(`\n🔔 Enviando notificação: ${title}`);

    try {
      for await (const message of query({
        prompt: `Send Windows notification with title "${title}" and message "${message}"`,
        options: {
          mcpConfig: this.mcpConfigPath,
          allowedTools: ["mcp__windows-notifications__send_windows_notification"]
        }
      })) {
        if (message.type === "result" && message.subtype === "success") {
          console.log("✅ Notificação enviada");
          return true;
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao enviar notificação:`, error);
      return false;
    }
  }

  /**
   * Parse lista de arquivos do resultado
   */
  parseFileList(result) {
    // Implementação simplificada - ajustar conforme formato real
    const files = [];
    const lines = result.split('\n');

    for (const line of lines) {
      if (line.trim()) {
        const isDir = line.includes('[DIR]') || line.includes('📁');
        const name = line.replace(/\[DIR\]|\[FILE\]|📁|📄/g, '').trim();

        if (name) {
          files.push({
            name,
            type: isDir ? 'dir' : 'file',
            path: join('.', name)
          });
        }
      }
    }

    return files;
  }
}

/**
 * Workflow contábil usando ferramentas MCP
 */
class AccountingMCPWorkflow {
  constructor() {
    this.tools = new MCPToolsManager();
  }

  /**
   * Extrai dados do Calima Web usando MCP
   */
  async extractCalimaData() {
    console.log("\n💼 Extraindo dados do Calima Web");
    console.log("=" .repeat(60));

    try {
      // 1. Navega para o Calima
      await this.tools.navigateToURL("https://app.calimaweb.com.br");

      // 2. Preenche login
      await this.tools.fillForm("#username", "usuario@exemplo.com");
      await this.tools.fillForm("#password", "senha_segura");

      // 3. Clica em entrar
      await this.tools.clickElement("#login-button");

      // 4. Aguarda dashboard carregar
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 5. Captura screenshot do dashboard
      await this.tools.captureScreenshot("./screenshots/calima-dashboard.png");

      // 6. Extrai relatórios
      const reports = await this.extractReports();

      console.log("✅ Dados do Calima extraídos com sucesso");
      return reports;

    } catch (error) {
      console.error("❌ Erro na extração do Calima:", error);
      return null;
    }
  }

  /**
   * Extrai relatórios específicos
   */
  async extractReports() {
    console.log("\n📊 Extraindo relatórios...");

    const reports = [];

    // Lista de relatórios para extrair
    const reportTypes = [
      { selector: "#report-balanco", name: "Balanço Patrimonial" },
      { selector: "#report-dre", name: "DRE" },
      { selector: "#report-fluxo", name: "Fluxo de Caixa" }
    ];

    for (const report of reportTypes) {
      console.log(`   Extraindo: ${report.name}`);

      // Clica no relatório
      await this.tools.clickElement(report.selector);

      // Aguarda carregamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Captura screenshot
      await this.tools.captureScreenshot(`./reports/${report.name.replace(/ /g, '_')}.png`);

      reports.push({
        name: report.name,
        timestamp: new Date().toISOString(),
        path: `./reports/${report.name.replace(/ /g, '_')}.png`
      });
    }

    return reports;
  }

  /**
   * Processa documentos fiscais
   */
  async processFiscalDocuments() {
    console.log("\n📄 Processando documentos fiscais");
    console.log("=" .repeat(60));

    // Lista arquivos na pasta de documentos
    const files = await this.tools.listProjectFiles("./documentos_fiscais");

    if (!files || files.length === 0) {
      console.log("⚠️ Nenhum documento encontrado");
      return;
    }

    console.log(`📊 ${files.length} documentos encontrados`);

    // Processa cada documento
    for (const file of files) {
      if (file.type === 'file' && file.name.endsWith('.xml')) {
        console.log(`\n   Processando: ${file.name}`);

        // Lê conteúdo do arquivo
        const content = await this.tools.readFileWithMCP(file.path);

        // Processa XML (simplificado)
        const processed = this.processXML(content);

        // Salva resultado processado
        const outputPath = file.path.replace('.xml', '_processado.json');
        await this.tools.writeFileWithMCP(outputPath, JSON.stringify(processed, null, 2));

        console.log(`   ✅ Processado: ${outputPath}`);
      }
    }

    // Envia notificação de conclusão
    await this.tools.sendNotification(
      "Processamento Concluído",
      `${files.length} documentos fiscais processados com sucesso`,
      "success"
    );
  }

  /**
   * Processa XML fiscal (simplificado)
   */
  processXML(xmlContent) {
    // Implementação simplificada
    return {
      tipo: "NFe",
      data: new Date().toISOString(),
      status: "processado",
      conteudo: xmlContent.substring(0, 100) + "..."
    };
  }

  /**
   * Gera relatório consolidado
   */
  async generateConsolidatedReport() {
    console.log("\n📑 Gerando relatório consolidado");
    console.log("=" .repeat(60));

    const report = {
      titulo: "Relatório Contábil Consolidado",
      empresa: "Pedro Tiago Contabilidade",
      data: new Date().toISOString(),
      sections: []
    };

    // Adiciona seções ao relatório
    report.sections.push({
      titulo: "Resumo Executivo",
      conteudo: "Análise consolidada dos dados contábeis do período"
    });

    report.sections.push({
      titulo: "Dados do Calima",
      conteudo: "Relatórios extraídos do sistema Calima Web"
    });

    report.sections.push({
      titulo: "Documentos Fiscais",
      conteudo: "Processamento de notas fiscais eletrônicas"
    });

    // Salva relatório
    const reportPath = `./relatorios/consolidado_${Date.now()}.json`;
    await this.tools.writeFileWithMCP(reportPath, JSON.stringify(report, null, 2));

    console.log(`✅ Relatório salvo em: ${reportPath}`);

    // Notifica conclusão
    await this.tools.sendNotification(
      "Relatório Gerado",
      "Relatório consolidado disponível",
      "info"
    );

    return report;
  }
}

/**
 * Exemplo simples de listagem de arquivos
 */
async function simpleFileListExample() {
  console.log("\n📁 Exemplo Simples: Listagem de Arquivos");
  console.log("=" .repeat(50));

  for await (const message of query({
    prompt: "List files in my project",
    options: {
      mcpConfig: ".mcp.json",
      allowedTools: ["mcp__filesystem__list_directory"]
    }
  })) {
    if (message.type === "result" && message.subtype === "success") {
      console.log("✅ Arquivos encontrados:");
      console.log(message.result);
    } else if (message.type === "tool_use") {
      console.log(`🔧 Usando ferramenta MCP: ${message.tool}`);
    }
  }
}

/**
 * Exemplo de automação completa
 */
async function runCompleteAutomation() {
  console.log("\n🤖 Automação Contábil Completa com MCP");
  console.log("=" .repeat(60));

  const workflow = new AccountingMCPWorkflow();

  try {
    // 1. Extrai dados do Calima
    console.log("\n[1/4] Extraindo dados do Calima...");
    const calimaData = await workflow.extractCalimaData();

    // 2. Processa documentos fiscais
    console.log("\n[2/4] Processando documentos fiscais...");
    await workflow.processFiscalDocuments();

    // 3. Gera relatório consolidado
    console.log("\n[3/4] Gerando relatório consolidado...");
    const report = await workflow.generateConsolidatedReport();

    // 4. Notifica conclusão
    console.log("\n[4/4] Finalizando...");
    await workflow.tools.sendNotification(
      "Automação Completa",
      "Todos os processos contábeis foram executados com sucesso",
      "success"
    );

    console.log("\n✅ Automação concluída com sucesso!");

  } catch (error) {
    console.error("\n❌ Erro na automação:", error);

    await workflow.tools.sendNotification(
      "Erro na Automação",
      `Ocorreu um erro: ${error.message}`,
      "error"
    );
  }
}

/**
 * Exemplo de uso de múltiplas ferramentas MCP
 */
async function multiToolExample() {
  console.log("\n🔧 Exemplo: Múltiplas Ferramentas MCP");
  console.log("=" .repeat(50));

  for await (const message of query({
    prompt: `Complete these tasks:
      1. List all Python files in the project
      2. Read the main configuration file
      3. Take a screenshot of the current page
      4. Send a notification when done`,
    options: {
      mcpConfig: ".mcp.json",
      allowedTools: [
        "mcp__filesystem__list_directory",
        "mcp__filesystem__read_file",
        "mcp__puppeteer__puppeteer_screenshot",
        "mcp__windows-notifications__send_windows_notification"
      ]
    }
  })) {
    if (message.type === "tool_use") {
      console.log(`\n🔧 Ferramenta MCP: ${message.tool}`);
      console.log(`   Ação: ${message.action || 'N/A'}`);
    } else if (message.type === "result") {
      console.log("\n✅ Tarefa concluída");
      if (message.result) {
        console.log("   Resultado:", message.result.substring(0, 200) + "...");
      }
    }
  }
}

// Exportar classes e funções
export {
  MCPToolsManager,
  AccountingMCPWorkflow,
  simpleFileListExample,
  runCompleteAutomation,
  multiToolExample
};

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--simple') {
    simpleFileListExample().catch(console.error);
  } else if (args[0] === '--automation') {
    runCompleteAutomation().catch(console.error);
  } else if (args[0] === '--multi') {
    multiToolExample().catch(console.error);
  } else if (args[0] === '--setup') {
    const manager = new MCPToolsManager();
    console.log("✅ Configuração MCP criada");
  } else {
    console.log(`
Uso: node mcp-tools-usage.js [opção]

Opções:
  --setup        Cria arquivo .mcp.json de configuração
  --simple       Exemplo simples de listagem de arquivos
  --automation   Executa automação contábil completa
  --multi        Exemplo com múltiplas ferramentas MCP

Exemplos:
  node mcp-tools-usage.js --setup
  node mcp-tools-usage.js --simple
  node mcp-tools-usage.js --automation
  node mcp-tools-usage.js --multi
    `);
  }
}