/**
 * Teste de conexões com sistemas contábeis
 * Pedro Tiago Contabilidade - CRC GO-027770/O
 */

import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

class SystemConnectionTester {
    constructor() {
        this.results = {
            calima: { status: 'pending', details: null },
            makrosystem: { status: 'pending', details: null }
        };
    }

    async testCalimaConnection() {
        console.log('\n=== TESTANDO CONEXÃO COM CALIMA WEB ===');
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();

            // Navegar para a página de login
            console.log('Acessando:', process.env.CALIMA_URL);
            await page.goto(process.env.CALIMA_URL, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Aguardar campos de login
            await page.waitForSelector('input[type="email"], input[type="text"], input[name="email"], input[name="username"]', { timeout: 10000 });

            // Preencher credenciais
            console.log('Preenchendo credenciais...');
            const emailSelector = await page.$('input[type="email"], input[type="text"], input[name="email"], input[name="username"]');
            await emailSelector.type(process.env.CALIMA_USERNAME);

            const passwordSelector = await page.$('input[type="password"], input[name="password"]');
            await passwordSelector.type(process.env.CALIMA_PASSWORD);

            // Clicar no botão de login
            const loginButton = await page.$('button[type="submit"], input[type="submit"], button:contains("Entrar"), button:contains("Login")');
            await loginButton.click();

            // Aguardar redirecionamento ou elemento do dashboard
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

            // Verificar se login foi bem-sucedido
            const currentUrl = page.url();
            const pageContent = await page.content();

            if (currentUrl.includes('dashboard') || currentUrl.includes('home') || !currentUrl.includes('login')) {
                console.log('✓ Login no Calima realizado com sucesso!');
                this.results.calima = {
                    status: 'success',
                    details: {
                        url: currentUrl,
                        timestamp: new Date().toISOString()
                    }
                };

                // Tirar screenshot do dashboard
                await page.screenshot({
                    path: path.join(process.cwd(), 'logs', 'calima-dashboard.png'),
                    fullPage: true
                });
            } else {
                throw new Error('Login não foi concluído com sucesso');
            }

        } catch (error) {
            console.error('✗ Erro ao conectar com Calima:', error.message);
            this.results.calima = {
                status: 'error',
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            };
        } finally {
            await browser.close();
        }
    }

    async testMakrosystemConnection() {
        console.log('\n=== TESTANDO CONEXÃO COM MAKROSYSTEM WEB ===');
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();

            // Navegar para a página de login
            console.log('Acessando:', process.env.MAKRO_URL);
            await page.goto(process.env.MAKRO_URL, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Aguardar campos de login
            await page.waitForSelector('input[type="text"], input[name="usuario"], input[name="username"]', { timeout: 10000 });

            // Preencher credenciais
            console.log('Preenchendo credenciais...');
            const userSelector = await page.$('input[type="text"], input[name="usuario"], input[name="username"]');
            await userSelector.type(process.env.MAKRO_USERNAME);

            const passwordSelector = await page.$('input[type="password"], input[name="senha"], input[name="password"]');
            await passwordSelector.type(process.env.MAKRO_PASSWORD);

            // Se houver campo de escritório
            const officeSelector = await page.$('input[name="escritorio"], input[name="office"], select[name="escritorio"]');
            if (officeSelector) {
                const tagName = await page.evaluate(el => el.tagName, officeSelector);
                if (tagName === 'SELECT') {
                    await page.select('select[name="escritorio"], select[name="office"]', process.env.MAKRO_OFFICE_ID);
                } else {
                    await officeSelector.type(process.env.MAKRO_OFFICE_ID);
                }
            }

            // Clicar no botão de login
            const loginButton = await page.$('button[type="submit"], input[type="submit"], button:contains("Entrar"), button:contains("Login")');
            await loginButton.click();

            // Aguardar redirecionamento
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

            // Verificar se login foi bem-sucedido
            const currentUrl = page.url();

            if (currentUrl.includes('dashboard') || currentUrl.includes('home') || currentUrl.includes('principal') || !currentUrl.includes('login')) {
                console.log('✓ Login no Makrosystem realizado com sucesso!');
                this.results.makrosystem = {
                    status: 'success',
                    details: {
                        url: currentUrl,
                        office: process.env.MAKRO_OFFICE_ID,
                        timestamp: new Date().toISOString()
                    }
                };

                // Tirar screenshot do dashboard
                await page.screenshot({
                    path: path.join(process.cwd(), 'logs', 'makrosystem-dashboard.png'),
                    fullPage: true
                });
            } else {
                throw new Error('Login não foi concluído com sucesso');
            }

        } catch (error) {
            console.error('✗ Erro ao conectar com Makrosystem:', error.message);
            this.results.makrosystem = {
                status: 'error',
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            };
        } finally {
            await browser.close();
        }
    }

    async saveResults() {
        const resultsPath = path.join(process.cwd(), 'logs', 'connection-test-results.json');
        await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
        console.log('\nResultados salvos em:', resultsPath);
    }

    async runAllTests() {
        console.log('================================================');
        console.log('TESTE DE CONEXÕES - PEDRO TIAGO CONTABILIDADE');
        console.log('================================================');

        // Criar diretório de logs se não existir
        const logsDir = path.join(process.cwd(), 'logs');
        await fs.mkdir(logsDir, { recursive: true });

        // Testar Calima
        await this.testCalimaConnection();

        // Aguardar um pouco entre os testes
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Testar Makrosystem
        await this.testMakrosystemConnection();

        // Salvar resultados
        await this.saveResults();

        // Exibir resumo
        console.log('\n=== RESUMO DOS TESTES ===');
        console.log('Calima Web:', this.results.calima.status === 'success' ? '✓ Conectado' : '✗ Falha na conexão');
        console.log('Makrosystem Web:', this.results.makrosystem.status === 'success' ? '✓ Conectado' : '✗ Falha na conexão');

        return this.results;
    }
}

// Executar testes se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new SystemConnectionTester();
    tester.runAllTests()
        .then(results => {
            console.log('\nTestes concluídos!');
            process.exit(results.calima.status === 'success' && results.makrosystem.status === 'success' ? 0 : 1);
        })
        .catch(error => {
            console.error('Erro durante os testes:', error);
            process.exit(1);
        });
}

export default SystemConnectionTester;