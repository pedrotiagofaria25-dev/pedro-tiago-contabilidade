/**
 * Pedro Tiago Contabilidade - Gerenciador de Backup
 * Sistema avançado de backup automático com versionamento e cloud
 *
 * @author Pedro Tiago (CRC GO-027770/O)
 * @contact pedrotiago@pedrotiagocontabilidade.com.br
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const moment = require('moment');
const cron = require('node-cron');
const crypto = require('crypto');

const Logger = require('../config/logger-config');
const SystemsConfig = require('../config/systems-config');

class BackupManager {
    constructor() {
        this.logger = new Logger('BackupManager');
        this.config = new SystemsConfig();

        this.backupConfig = this.config.backupConfig;
        this.isRunning = false;
        this.scheduledJobs = [];

        this.backupTypes = [
            'configuration', // Configurações do sistema
            'data', // Dados dos clientes
            'logs', // Arquivos de log
            'reports', // Relatórios gerados
            'full' // Backup completo
        ];
    }

    async initialize() {
        try {
            this.logger.info('Inicializando Backup Manager...');

            // Criar estrutura de diretórios
            await this.ensureBackupDirectories();

            // Configurar agendamento automático
            if (this.backupConfig.schedule) {
                this.setupScheduledBackups();
            }

            // Limpar backups antigos
            await this.cleanupOldBackups();

            this.logger.info('Backup Manager inicializado com sucesso');

        } catch (error) {
            this.logger.error('Erro na inicialização do Backup Manager', error);
            throw error;
        }
    }

    async ensureBackupDirectories() {
        const dirs = [
            this.backupConfig.path,
            path.join(this.backupConfig.path, 'full'),
            path.join(this.backupConfig.path, 'configuration'),
            path.join(this.backupConfig.path, 'data'),
            path.join(this.backupConfig.path, 'logs'),
            path.join(this.backupConfig.path, 'reports'),
            path.join(this.backupConfig.path, 'temp')
        ];

        for (const dir of dirs) {
            await fs.ensureDir(dir);
        }

        this.logger.info(`Diretórios de backup criados em: ${this.backupConfig.path}`);
    }

    setupScheduledBackups() {
        // Backup completo agendado
        const fullBackupJob = cron.schedule(this.backupConfig.schedule, async () => {
            try {
                this.logger.info('Executando backup automático agendado...');
                await this.executeBackup('full');
            } catch (error) {
                this.logger.error('Erro no backup automático', error);
            }
        }, {
            scheduled: false,
            timezone: 'America/Sao_Paulo'
        });

        // Backup incremental de dados a cada 4 horas
        const incrementalJob = cron.schedule('0 */4 * * *', async () => {
            try {
                await this.executeBackup('data');
            } catch (error) {
                this.logger.error('Erro no backup incremental', error);
            }
        }, {
            scheduled: false,
            timezone: 'America/Sao_Paulo'
        });

        this.scheduledJobs = [fullBackupJob, incrementalJob];

        // Iniciar jobs
        this.scheduledJobs.forEach(job => job.start());

        this.logger.info('Backup automático agendado configurado');
    }

    async executeBackup(type = 'full') {
        if (this.isRunning) {
            this.logger.warn('Backup já está em execução');
            return null;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            this.logger.backupOperation(type, 'started');

            let result;
            switch (type) {
                case 'configuration':
                    result = await this.backupConfiguration();
                    break;
                case 'data':
                    result = await this.backupData();
                    break;
                case 'logs':
                    result = await this.backupLogs();
                    break;
                case 'reports':
                    result = await this.backupReports();
                    break;
                case 'full':
                default:
                    result = await this.fullBackup();
                    break;
            }

            const duration = Date.now() - startTime;
            result.duration = duration;

            this.logger.backupOperation(type, 'completed', {
                filePath: result.filePath,
                size: result.size,
                duration
            });

            // Upload para cloud se configurado
            if (this.backupConfig.cloud.enabled) {
                await this.uploadToCloud(result);
            }

            return result;

        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.backupOperation(type, 'failed', {
                error: error.message,
                duration
            });
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    async backupConfiguration() {
        const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
        const backupName = `config-backup-${timestamp}`;
        const tempDir = path.join(this.backupConfig.path, 'temp', backupName);

        try {
            await fs.ensureDir(tempDir);

            // Arquivos de configuração
            const configSources = [
                { src: path.join(__dirname, '../config'), dest: path.join(tempDir, 'config') },
                { src: path.join(__dirname, '../package.json'), dest: path.join(tempDir, 'package.json') },
                { src: path.join(__dirname, '../.env.example'), dest: path.join(tempDir, '.env.example') },
                { src: path.join(__dirname, '../README.md'), dest: path.join(tempDir, 'README.md') }
            ];

            // Copiar arquivos
            for (const { src, dest } of configSources) {
                if (await fs.pathExists(src)) {
                    await fs.copy(src, dest);
                }
            }

            // Criar arquivo de metadados
            const metadata = {
                type: 'configuration',
                timestamp: moment().toISOString(),
                company: process.env.COMPANY_NAME,
                crc: process.env.CRC_NUMBER,
                version: require('../package.json').version,
                environment: process.env.NODE_ENV
            };

            await fs.writeJson(path.join(tempDir, 'backup-metadata.json'), metadata, { spaces: 2 });

            // Comprimir
            const zipPath = path.join(this.backupConfig.path, 'configuration', `${backupName}.zip`);
            await this.compressDirectory(tempDir, zipPath);

            // Limpar diretório temporário
            await fs.remove(tempDir);

            const stats = await fs.stat(zipPath);

            return {
                type: 'configuration',
                filePath: zipPath,
                fileName: `${backupName}.zip`,
                size: stats.size,
                timestamp: moment().toISOString()
            };

        } catch (error) {
            // Limpar em caso de erro
            if (await fs.pathExists(tempDir)) {
                await fs.remove(tempDir);
            }
            throw error;
        }
    }

    async backupData() {
        const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
        const backupName = `data-backup-${timestamp}`;
        const tempDir = path.join(this.backupConfig.path, 'temp', backupName);

        try {
            await fs.ensureDir(tempDir);

            // Diretórios de dados
            const dataSources = [
                { src: path.join(__dirname, '../data'), dest: path.join(tempDir, 'data'), required: false },
                { src: path.join(__dirname, '../results'), dest: path.join(tempDir, 'results'), required: false },
                { src: path.join(__dirname, '../reports'), dest: path.join(tempDir, 'reports'), required: false }
            ];

            let hasData = false;

            // Copiar dados existentes
            for (const { src, dest, required } of dataSources) {
                if (await fs.pathExists(src)) {
                    await fs.copy(src, dest);
                    hasData = true;
                } else if (required) {
                    throw new Error(`Diretório obrigatório não encontrado: ${src}`);
                }
            }

            if (!hasData) {
                this.logger.warn('Nenhum dado encontrado para backup');
                return null;
            }

            // Metadados
            const metadata = {
                type: 'data',
                timestamp: moment().toISOString(),
                company: process.env.COMPANY_NAME,
                dataCount: await this.countDataFiles(tempDir)
            };

            await fs.writeJson(path.join(tempDir, 'backup-metadata.json'), metadata, { spaces: 2 });

            // Comprimir
            const zipPath = path.join(this.backupConfig.path, 'data', `${backupName}.zip`);
            await this.compressDirectory(tempDir, zipPath);

            // Limpar
            await fs.remove(tempDir);

            const stats = await fs.stat(zipPath);

            return {
                type: 'data',
                filePath: zipPath,
                fileName: `${backupName}.zip`,
                size: stats.size,
                timestamp: moment().toISOString()
            };

        } catch (error) {
            if (await fs.pathExists(tempDir)) {
                await fs.remove(tempDir);
            }
            throw error;
        }
    }

    async backupLogs() {
        const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
        const backupName = `logs-backup-${timestamp}`;
        const tempDir = path.join(this.backupConfig.path, 'temp', backupName);

        try {
            await fs.ensureDir(tempDir);

            const logsSource = path.join(__dirname, '../logs');

            if (await fs.pathExists(logsSource)) {
                await fs.copy(logsSource, path.join(tempDir, 'logs'));
            } else {
                this.logger.warn('Diretório de logs não encontrado');
                return null;
            }

            // Metadados
            const metadata = {
                type: 'logs',
                timestamp: moment().toISOString(),
                company: process.env.COMPANY_NAME,
                logFiles: await this.countLogFiles(path.join(tempDir, 'logs'))
            };

            await fs.writeJson(path.join(tempDir, 'backup-metadata.json'), metadata, { spaces: 2 });

            // Comprimir
            const zipPath = path.join(this.backupConfig.path, 'logs', `${backupName}.zip`);
            await this.compressDirectory(tempDir, zipPath);

            await fs.remove(tempDir);

            const stats = await fs.stat(zipPath);

            return {
                type: 'logs',
                filePath: zipPath,
                fileName: `${backupName}.zip`,
                size: stats.size,
                timestamp: moment().toISOString()
            };

        } catch (error) {
            if (await fs.pathExists(tempDir)) {
                await fs.remove(tempDir);
            }
            throw error;
        }
    }

    async backupReports() {
        const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
        const backupName = `reports-backup-${timestamp}`;
        const tempDir = path.join(this.backupConfig.path, 'temp', backupName);

        try {
            await fs.ensureDir(tempDir);

            const reportsSource = path.join(__dirname, '../reports');

            if (await fs.pathExists(reportsSource)) {
                await fs.copy(reportsSource, path.join(tempDir, 'reports'));
            } else {
                this.logger.warn('Diretório de relatórios não encontrado');
                return null;
            }

            // Metadados
            const metadata = {
                type: 'reports',
                timestamp: moment().toISOString(),
                company: process.env.COMPANY_NAME,
                reportFiles: await this.countDataFiles(path.join(tempDir, 'reports'))
            };

            await fs.writeJson(path.join(tempDir, 'backup-metadata.json'), metadata, { spaces: 2 });

            // Comprimir
            const zipPath = path.join(this.backupConfig.path, 'reports', `${backupName}.zip`);
            await this.compressDirectory(tempDir, zipPath);

            await fs.remove(tempDir);

            const stats = await fs.stat(zipPath);

            return {
                type: 'reports',
                filePath: zipPath,
                fileName: `${backupName}.zip`,
                size: stats.size,
                timestamp: moment().toISOString()
            };

        } catch (error) {
            if (await fs.pathExists(tempDir)) {
                await fs.remove(tempDir);
            }
            throw error;
        }
    }

    async fullBackup() {
        const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
        const backupName = `full-backup-${timestamp}`;
        const tempDir = path.join(this.backupConfig.path, 'temp', backupName);

        try {
            await fs.ensureDir(tempDir);

            this.logger.info('Iniciando backup completo...');

            // Executar todos os backups individuais
            const backups = await Promise.allSettled([
                this.backupConfiguration(),
                this.backupData(),
                this.backupLogs(),
                this.backupReports()
            ]);

            // Copiar backups individuais para o diretório temporário
            const fullBackupContents = [];

            for (let i = 0; i < backups.length; i++) {
                const backup = backups[i];
                const backupType = ['configuration', 'data', 'logs', 'reports'][i];

                if (backup.status === 'fulfilled' && backup.value) {
                    const sourcePath = backup.value.filePath;
                    const destPath = path.join(tempDir, path.basename(sourcePath));
                    await fs.copy(sourcePath, destPath);

                    fullBackupContents.push({
                        type: backupType,
                        fileName: path.basename(sourcePath),
                        size: backup.value.size,
                        status: 'success'
                    });
                } else {
                    fullBackupContents.push({
                        type: backupType,
                        status: 'failed',
                        error: backup.reason?.message || 'Unknown error'
                    });
                }
            }

            // Adicionar arquivos adicionais importantes
            const additionalFiles = [
                { src: path.join(__dirname, '../package.json'), dest: 'package.json' },
                { src: path.join(__dirname, '../README.md'), dest: 'README.md' }
            ];

            for (const { src, dest } of additionalFiles) {
                if (await fs.pathExists(src)) {
                    await fs.copy(src, path.join(tempDir, dest));
                }
            }

            // Metadados do backup completo
            const metadata = {
                type: 'full',
                timestamp: moment().toISOString(),
                company: process.env.COMPANY_NAME,
                crc: process.env.CRC_NUMBER,
                version: require('../package.json').version,
                environment: process.env.NODE_ENV,
                contents: fullBackupContents,
                checksum: await this.generateChecksum(tempDir)
            };

            await fs.writeJson(path.join(tempDir, 'full-backup-metadata.json'), metadata, { spaces: 2 });

            // Comprimir backup completo
            const zipPath = path.join(this.backupConfig.path, 'full', `${backupName}.zip`);
            await this.compressDirectory(tempDir, zipPath);

            // Limpar temporário
            await fs.remove(tempDir);

            const stats = await fs.stat(zipPath);

            this.logger.info(`Backup completo criado: ${zipPath} (${this.formatFileSize(stats.size)})`);

            return {
                type: 'full',
                filePath: zipPath,
                fileName: `${backupName}.zip`,
                size: stats.size,
                timestamp: moment().toISOString(),
                contents: fullBackupContents,
                checksum: metadata.checksum
            };

        } catch (error) {
            if (await fs.pathExists(tempDir)) {
                await fs.remove(tempDir);
            }
            throw error;
        }
    }

    async compressDirectory(sourceDir, outputPath) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', {
                zlib: { level: this.backupConfig.compression === 'gzip' ? 9 : 6 }
            });

            output.on('close', () => {
                resolve(archive.pointer());
            });

            archive.on('error', reject);

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    async generateChecksum(directory) {
        const hash = crypto.createHash('sha256');
        const files = await this.getAllFiles(directory);

        for (const file of files.sort()) {
            const content = await fs.readFile(file);
            hash.update(file);
            hash.update(content);
        }

        return hash.digest('hex');
    }

    async getAllFiles(dir) {
        const files = [];

        async function walk(currentDir) {
            const items = await fs.readdir(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = await fs.stat(fullPath);

                if (stat.isDirectory()) {
                    await walk(fullPath);
                } else {
                    files.push(fullPath);
                }
            }
        }

        await walk(dir);
        return files;
    }

    async countDataFiles(directory) {
        try {
            const files = await this.getAllFiles(directory);
            return files.length;
        } catch (error) {
            return 0;
        }
    }

    async countLogFiles(directory) {
        try {
            const files = await this.getAllFiles(directory);
            return files.filter(f => f.endsWith('.log')).length;
        } catch (error) {
            return 0;
        }
    }

    async uploadToCloud(backupResult) {
        try {
            this.logger.info(`Iniciando upload para cloud: ${backupResult.fileName}`);

            if (this.backupConfig.cloud.provider === 'aws') {
                await this.uploadToAWS(backupResult);
            } else {
                this.logger.warn(`Provider de cloud não implementado: ${this.backupConfig.cloud.provider}`);
            }

        } catch (error) {
            this.logger.error('Erro no upload para cloud', error, {
                fileName: backupResult.fileName,
                provider: this.backupConfig.cloud.provider
            });
            throw error;
        }
    }

    async uploadToAWS(backupResult) {
        // Implementação simplificada - em produção usaria AWS SDK
        this.logger.info('Upload AWS simulado (implementar AWS SDK)', {
            bucket: this.backupConfig.cloud.bucket,
            key: backupResult.fileName,
            size: backupResult.size
        });

        // TODO: Implementar upload real com AWS SDK
        // const AWS = require('aws-sdk');
        // const s3 = new AWS.S3();
        // await s3.upload({
        //     Bucket: this.backupConfig.cloud.bucket,
        //     Key: backupResult.fileName,
        //     Body: fs.createReadStream(backupResult.filePath)
        // }).promise();
    }

    async cleanupOldBackups() {
        try {
            const retentionDays = this.backupConfig.retention.days;
            const maxFiles = this.backupConfig.retention.maxFiles;
            const cutoffDate = moment().subtract(retentionDays, 'days');

            const backupDirs = ['full', 'configuration', 'data', 'logs', 'reports'];

            for (const dir of backupDirs) {
                const dirPath = path.join(this.backupConfig.path, dir);

                if (await fs.pathExists(dirPath)) {
                    const files = await fs.readdir(dirPath);
                    const backupFiles = files.filter(f => f.endsWith('.zip'));

                    // Ordenar por data (mais antigos primeiro)
                    const fileStats = await Promise.all(
                        backupFiles.map(async (file) => {
                            const filePath = path.join(dirPath, file);
                            const stats = await fs.stat(filePath);
                            return { file, path: filePath, mtime: stats.mtime };
                        })
                    );

                    fileStats.sort((a, b) => a.mtime - b.mtime);

                    // Remover arquivos antigos por data
                    for (const { file, path: filePath, mtime } of fileStats) {
                        if (moment(mtime).isBefore(cutoffDate)) {
                            await fs.remove(filePath);
                            this.logger.info(`Backup antigo removido: ${file}`);
                        }
                    }

                    // Remover arquivos excedentes (manter apenas maxFiles)
                    const remainingFiles = fileStats.filter(({ mtime }) =>
                        moment(mtime).isAfter(cutoffDate)
                    );

                    if (remainingFiles.length > maxFiles) {
                        const filesToRemove = remainingFiles.slice(0, remainingFiles.length - maxFiles);

                        for (const { file, path: filePath } of filesToRemove) {
                            await fs.remove(filePath);
                            this.logger.info(`Backup excedente removido: ${file}`);
                        }
                    }
                }
            }

        } catch (error) {
            this.logger.error('Erro na limpeza de backups antigos', error);
        }
    }

    async listBackups(type = null) {
        const backups = {};

        const dirs = type ? [type] : ['full', 'configuration', 'data', 'logs', 'reports'];

        for (const dir of dirs) {
            const dirPath = path.join(this.backupConfig.path, dir);
            backups[dir] = [];

            if (await fs.pathExists(dirPath)) {
                const files = await fs.readdir(dirPath);
                const backupFiles = files.filter(f => f.endsWith('.zip'));

                for (const file of backupFiles) {
                    const filePath = path.join(dirPath, file);
                    const stats = await fs.stat(filePath);

                    backups[dir].push({
                        fileName: file,
                        filePath: filePath,
                        size: stats.size,
                        sizeFormatted: this.formatFileSize(stats.size),
                        createdAt: stats.birthtime,
                        modifiedAt: stats.mtime
                    });
                }

                // Ordenar por data (mais recentes primeiro)
                backups[dir].sort((a, b) => b.createdAt - a.createdAt);
            }
        }

        return backups;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async cleanup() {
        // Parar jobs agendados
        this.scheduledJobs.forEach(job => job.stop());
        this.scheduledJobs = [];

        // Limpar diretório temporário
        const tempDir = path.join(this.backupConfig.path, 'temp');
        if (await fs.pathExists(tempDir)) {
            await fs.remove(tempDir);
        }

        this.logger.info('BackupManager cleanup concluído');
    }
}

module.exports = BackupManager;