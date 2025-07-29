import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import chokidar from 'chokidar';
import { DockerComposeFile, FileCache } from '../types/index';
import { CONFIG } from '../utils/config';
import logger from '../utils/logger';

class FileService {
  private cache: FileCache = {};
  private watcher: chokidar.FSWatcher | null = null;

  constructor() {
    this.initializeWatcher();
  }

  private initializeWatcher() {
    const pattern = path.join(CONFIG.COMPOSE_DIRECTORY, '**/{docker-compose.yml,docker-compose.yaml}');
    
    this.watcher = chokidar.watch(pattern, {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: false
    });

    this.watcher
      .on('add', (filePath) => {
        logger.info(`File added: ${filePath}`);
        this.invalidateCache(path.basename(filePath));
      })
      .on('change', (filePath) => {
        logger.info(`File changed: ${filePath}`);
        this.invalidateCache(path.basename(filePath));
      })
      .on('unlink', (filePath) => {
        logger.info(`File removed: ${filePath}`);
        this.invalidateCache(path.basename(filePath));
      })
      .on('error', (error) => {
        logger.error('File watcher error:', error);
      });
  }

  private invalidateCache(filename: string) {
    delete this.cache[filename];
  }

  async getAllFiles(): Promise<DockerComposeFile[]> {
    try {
      await this.ensureDirectoryExists();
      const files = await this.scanForComposeFiles();
      return files;
    } catch (error) {
      logger.error('Error getting all files:', error);
      throw error;
    }
  }

  async getFile(filename: string): Promise<DockerComposeFile | null> {
    try {
      const filePath = path.join(CONFIG.COMPOSE_DIRECTORY, filename);
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        filename: filename, // 保持相对路径，如 "project1/docker-compose.yml"
        path: filePath,
        content,
        lastModified: stats.mtime,
        status: 'unknown', // 将在服务状态检测中更新
        services: this.extractServices(content)
      };
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async createFile(filename: string, content: string): Promise<DockerComposeFile> {
    try {
      // 验证文件名
      const baseName = path.basename(filename);
      if (!baseName.endsWith('.yml') && !baseName.endsWith('.yaml')) {
        throw new Error('File must have .yml or .yaml extension');
      }

      // 验证 YAML 内容
      this.validateYamlContent(content);

      const filePath = path.join(CONFIG.COMPOSE_DIRECTORY, filename);
      
      // 确保目录存在
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // 检查文件是否已存在
      try {
        await fs.access(filePath);
        throw new Error('File already exists');
      } catch (error) {
        if ((error as any).code !== 'ENOENT') {
          throw error;
        }
      }

      await fs.writeFile(filePath, content, 'utf-8');
      
      const file = await this.getFile(filename);
      if (!file) {
        throw new Error('Failed to create file');
      }

      logger.info(`File created: ${filename}`);
      return file;
    } catch (error) {
      logger.error(`Error creating file ${filename}:`, error);
      throw error;
    }
  }

  async updateFile(filename: string, content: string): Promise<DockerComposeFile> {
    try {
      // 验证 YAML 内容
      this.validateYamlContent(content);

      const filePath = path.join(CONFIG.COMPOSE_DIRECTORY, filename);
      await fs.writeFile(filePath, content, 'utf-8');
      
      this.invalidateCache(filename);
      
      const file = await this.getFile(filename);
      if (!file) {
        throw new Error('Failed to update file');
      }

      logger.info(`File updated: ${filename}`);
      return file;
    } catch (error) {
      logger.error(`Error updating file ${filename}:`, error);
      throw error;
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(CONFIG.COMPOSE_DIRECTORY, filename);
      await fs.unlink(filePath);
      
      this.invalidateCache(filename);
      
      logger.info(`File deleted: ${filename}`);
    } catch (error) {
      logger.error(`Error deleting file ${filename}:`, error);
      throw error;
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(CONFIG.COMPOSE_DIRECTORY);
    } catch {
      await fs.mkdir(CONFIG.COMPOSE_DIRECTORY, { recursive: true });
      logger.info(`Created compose directory: ${CONFIG.COMPOSE_DIRECTORY}`);
    }
  }

  private async scanForComposeFiles(): Promise<DockerComposeFile[]> {
    const files: DockerComposeFile[] = [];
    
    try {
      const entries = await fs.readdir(CONFIG.COMPOSE_DIRECTORY, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && this.isComposeFile(entry.name)) {
          const file = await this.getFile(entry.name);
          if (file) {
            files.push(file);
          }
        } else if (entry.isDirectory()) {
          // 递归扫描子目录
          const subFiles = await this.scanSubDirectory(path.join(CONFIG.COMPOSE_DIRECTORY, entry.name));
          files.push(...subFiles);
        }
      }
    } catch (error) {
      logger.error('Error scanning compose files:', error);
    }

    return files;
  }

  private async scanSubDirectory(dirPath: string): Promise<DockerComposeFile[]> {
    const files: DockerComposeFile[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && this.isComposeFile(entry.name)) {
          const relativePath = path.relative(CONFIG.COMPOSE_DIRECTORY, path.join(dirPath, entry.name));
          const file = await this.getFile(relativePath);
          if (file) {
            files.push(file);
          }
        }
        // 可以在这里添加递归扫描更深层目录的逻辑，如果需要的话
      }
    } catch (error) {
      logger.error(`Error scanning subdirectory ${dirPath}:`, error);
    }

    return files;
  }

  private isComposeFile(filename: string): boolean {
    return filename === 'docker-compose.yml' || filename === 'docker-compose.yaml';
  }

  private validateYamlContent(content: string): void {
    try {
      const parsed = yaml.load(content);
      
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid YAML: content must be an object');
      }

      // 基本的 Docker Compose 文件验证
      const compose = parsed as any;
      if (!compose.services || typeof compose.services !== 'object') {
        throw new Error('Invalid Docker Compose: services section is required');
      }

    } catch (error) {
      if (error instanceof yaml.YAMLException) {
        throw new Error(`YAML syntax error: ${error.message}`);
      }
      throw error;
    }
  }

  private extractServices(content: string): string[] {
    try {
      const parsed = yaml.load(content) as any;
      if (parsed && parsed.services) {
        return Object.keys(parsed.services);
      }
    } catch (error) {
      logger.warn('Error extracting services:', error);
    }
    return [];
  }

  destroy() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

export default new FileService();