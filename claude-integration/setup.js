#!/usr/bin/env node

/**
 * Pedro Tiago Contabilidade - Script de Configuração Inicial
 * Configuração automática do ambiente Claude Code Integration
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class SetupManager {
    constructor() {
        this.projectPath = __dirname;
        this.envPath = path.join(this.projectPath, '.env');

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async run() {
        try {
            console.log('\n🚀 Pedro Tiago Contabilidade - Configuração Claude Code Integration\n');
            console.log('='.repeat(70));

            await this.checkNodeVersion();
            await this.installDependencies();
            await this.createEnvironmentFile();
            await this.createDirectoryStructure();
            await this.validateSetup();
            await this.displayCompletionInfo();

        } catch (error) {
            console.error('\n❌ Erro durante a configuração:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    async checkNodeVersion() {
        console.log('🔍 Verificando versão do Node.js...');

        try {
            const nodeVersion = process.version;
            const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

            if (majorVersion < 18) {
                throw new Error(`Node.js 18+ é necessário. Versão atual: ${nodeVersion}`);
            }

            console.log(`✅ Node.js ${nodeVersion} - OK`);
        } catch (error) {
            throw new Error(`Erro ao verificar Node.js: ${error.message}`);
        }
    }

    async installDependencies() {
        console.log('\n📦 Instalando dependências...');

        try {
            // Verificar se package.json existe
            const packageJsonPath = path.join(this.projectPath, 'package.json');
            if (!await fs.pathExists(packageJsonPath)) {
                throw new Error('package.json não encontrado');
            }

            console.log('   Executando npm install...');
            execSync('npm install', {
                cwd: this.projectPath,
                stdio: 'inherit',
                timeout: 300000 // 5 minutos
            });

            console.log('✅ Dependências instaladas com sucesso');
        } catch (error) {
            throw new Error(`Erro na instalação de dependências: ${error.message}`);
        }
    }

    async createEnvironmentFile() {
        console.log('\n⚙️ Configurando variáveis de ambiente...');

        // Verificar se .env já existe
        if (await fs.pathExists(this.envPath)) {
            const useExisting = await this.askQuestion(
                '   Arquivo .env já existe. Deseja recriar? (s/N): '
            );

            if (useExisting.toLowerCase() !== 's') {
                console.log('   Mantendo arquivo .env existente');
                return;
            }
        }

        // Coletar informações básicas
        console.log('\n   📝 Configuração básica (pressione Enter para valores padrão):');

        const config = {
            CLAUDE_API_KEY: await this.askQuestion('   Chave API do Claude (obrigatório): ', true),
            CLAUDE_MODEL: await this.askQuestion('   Modelo Claude [claude-3-sonnet-20240229]: ') || 'claude-3-sonnet-20240229',

            COMPANY_NAME: await this.askQuestion('   Nome da empresa [Pedro Tiago Contabilidade]: ') || 'Pedro Tiago Contabilidade',
            CRC_NUMBER: await this.askQuestion('   Número CRC [GO-027770/O]: ') || 'GO-027770/O',
            EMAIL: await this.askQuestion('   Email [pedrotiago@pedrotiagocontabilidade.com.br]: ') || 'pedrotiago@pedrotiagocontabilidade.com.br',
            WHATSAPP: await this.askQuestion('   WhatsApp [62999948445]: ') || '62999948445',

            CALIMA_URL: await this.askQuestion('   URL Calima (opcional): ') || '',
            CALIMA_USERNAME: await this.askQuestion('   Usuário Calima (opcional): ') || '',
            CALIMA_PASSWORD: await this.askQuestion('   Senha Calima (opcional): ') || '',

            MAKRO_URL: await this.askQuestion('   URL Makrosystem (opcional): ') || '',
            MAKRO_USERNAME: await this.askQuestion('   Usuário Makrosystem (opcional): ') || '',
            MAKRO_PASSWORD: await this.askQuestion('   Senha Makrosystem (opcional): ') || '',

            NODE_ENV: 'development',
            PORT: '3000',
            LOG_LEVEL: 'info'
        };

        // Criar arquivo .env
        let envContent = `# Pedro Tiago Contabilidade - Configuração Claude Code Integration
# Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}

`;

        for (const [key, value] of Object.entries(config)) {
            envContent += `${key}=${value}\n`;
        }

        await fs.writeFile(this.envPath, envContent);
        console.log('✅ Arquivo .env criado com sucesso');
    }

    async createDirectoryStructure() {
        console.log('\n📁 Criando estrutura de diretórios...');

        const directories = [
            'data',
            'data/monitoring',
            'logs',
            'logs/archive',
            'logs/errors',
            'logs/audit',
            'logs/sync',
            'logs/monitoring',
            'reports',
            'reports/calima',
            'reports/makrosystem',
            'reports/monitoring',
            'results',
            'results/calima',
            'results/makrosystem',
            'backups'
        ];

        for (const dir of directories) {
            const fullPath = path.join(this.projectPath, dir);
            await fs.ensureDir(fullPath);

            // Criar arquivo .gitkeep para manter diretórios no git
            const gitkeepPath = path.join(fullPath, '.gitkeep');
            if (!await fs.pathExists(gitkeepPath)) {
                await fs.writeFile(gitkeepPath, '# Manter este diretório no git');
            }
        }

        console.log('✅ Estrutura de diretórios criada');
    }

    async validateSetup() {
        console.log('\n🔍 Validando configuração...');

        const checks = [
            {
                name: 'Arquivo .env',
                check: () => fs.pathExists(this.envPath)
            },
            {
                name: 'Diretório de logs',
                check: () => fs.pathExists(path.join(this.projectPath, 'logs'))
            },
            {
                name: 'Diretório de dados',
                check: () => fs.pathExists(path.join(this.projectPath, 'data'))
            },
            {
                name: 'Node modules',
                check: () => fs.pathExists(path.join(this.projectPath, 'node_modules'))
            }
        ];

        for (const { name, check } of checks) {
            const result = await check();
            console.log(`   ${result ? '✅' : '❌'} ${name}`);

            if (!result) {
                throw new Error(`Falha na validação: ${name}`);
            }
        }

        console.log('✅ Validação concluída com sucesso');
    }

    async displayCompletionInfo() {
        console.log('\n' + '='.repeat(70));
        console.log('🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('='.repeat(70));

        console.log('\n📋 Próximos passos:');
        console.log('   1. Verifique e ajuste o arquivo .env se necessário');
        console.log('   2. Configure as credenciais dos sistemas contábeis');
        console.log('   3. Teste a conectividade com Claude AI');
        console.log('\n🚀 Comandos para começar:');
        console.log('   npm start                    # Iniciar servidor principal');
        console.log('   npm run dev                  # Modo desenvolvimento');
        console.log('   npm run monitor             # Monitoramento de sistemas');
        console.log('   node index.js system-status # Status dos sistemas');

        console.log('\n📖 Exemplos de uso:');
        console.log('   # Processar cliente específico');
        console.log('   npm run calima process-client "Nome do Cliente"');
        console.log('\n   # Gerar relatório mensal');
        console.log('   node examples/report-generator.js monthly "2024-01"');
        console.log('\n   # Sincronização completa');
        console.log('   npm run sync');

        console.log('\n🔗 Links úteis:');
        console.log('   📧 Email: pedrotiago@pedrotiagocontabilidade.com.br');
        console.log('   📱 WhatsApp: 62999948445');
        console.log('   🌐 Site: www.pedrotiagocontabilidade.com.br');

        console.log('\n💡 Dica: Execute "node setup.js --help" para ver opções avançadas');
        console.log('\n' + '='.repeat(70));
    }

    askQuestion(question, required = false) {
        return new Promise((resolve) => {
            const ask = () => {
                this.rl.question(question, (answer) => {
                    if (required && !answer.trim()) {
                        console.log('   ❌ Este campo é obrigatório!');
                        ask();
                    } else {
                        resolve(answer.trim());
                    }
                });
            };
            ask();
        });
    }
}

// Execução do script
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🔧 Pedro Tiago Contabilidade - Setup Claude Code Integration

Uso: node setup.js [opções]

Opções:
  --help, -h     Exibir esta ajuda
  --force        Forçar recriação de arquivos existentes
  --quiet        Modo silencioso (menos output)

Exemplos:
  node setup.js           # Configuração interativa
  node setup.js --force   # Recriar todos os arquivos

Este script configura automaticamente:
- Instalação de dependências
- Criação de arquivo .env
- Estrutura de diretórios
- Validação da configuração

Para suporte: pedrotiago@pedrotiagocontabilidade.com.br
        `);
        process.exit(0);
    }

    const setup = new SetupManager();
    setup.run().catch(error => {
        console.error('\n💥 Erro fatal na configuração:', error.message);
        process.exit(1);
    });
}

module.exports = SetupManager;