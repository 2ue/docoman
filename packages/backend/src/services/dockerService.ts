import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { ServiceStatus, ContainerInfo } from '../types/index';
import { CONFIG } from '../utils/config';
import logger from '../utils/logger';

const execAsync = promisify(exec);

class DockerService {
  async getServiceStatus(filename: string): Promise<ServiceStatus> {
    try {
      const filePath = path.join(CONFIG.COMPOSE_DIRECTORY, filename);
      const projectName = this.getProjectName(filename);
      
      const { stdout } = await execAsync(`docker-compose -f "${filePath}" -p "${projectName}" ps --format json`);
      
      if (!stdout.trim()) {
        return {
          filename,
          status: 'stopped',
          containers: []
        };
      }

      const containers: ContainerInfo[] = [];
      const lines = stdout.trim().split('\n');
      
      for (const line of lines) {
        try {
          const container = JSON.parse(line);
          containers.push({
            name: container.Name,
            status: container.State,
            ports: this.parsePorts(container.Ports),
            image: container.Image
          });
        } catch (error) {
          logger.warn('Error parsing container info:', error);
        }
      }

      const hasRunning = containers.some(c => c.status === 'running');
      const hasExited = containers.some(c => c.status === 'exited');
      
      let status: 'running' | 'stopped' | 'error';
      if (hasRunning && !hasExited) {
        status = 'running';
      } else if (!hasRunning && hasExited) {
        status = 'stopped';
      } else if (hasRunning && hasExited) {
        status = 'error'; // 部分容器运行，部分停止
      } else {
        status = 'stopped';
      }

      return {
        filename,
        status,
        containers
      };
    } catch (error) {
      logger.error(`Error getting service status for ${filename}:`, error);
      return {
        filename,
        status: 'error',
        containers: []
      };
    }
  }

  async startService(filename: string): Promise<{ success: boolean; message: string; logs?: string[] }> {
    return new Promise((resolve) => {
      const filePath = path.join(CONFIG.COMPOSE_DIRECTORY, filename);
      const projectName = this.getProjectName(filename);
      
      const logs: string[] = [];
      const process = spawn('docker-compose', [
        '-f', filePath,
        '-p', projectName,
        'up', '-d'
      ]);

      process.stdout.on('data', (data) => {
        const message = data.toString();
        logs.push(message);
        logger.info(`Docker Compose UP stdout: ${message}`);
      });

      process.stderr.on('data', (data) => {
        const message = data.toString();
        logs.push(message);
        logger.info(`Docker Compose UP stderr: ${message}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          logger.info(`Service ${filename} started successfully`);
          resolve({
            success: true,
            message: 'Service started successfully',
            logs
          });
        } else {
          logger.error(`Service ${filename} failed to start with code ${code}`);
          resolve({
            success: false,
            message: `Failed to start service (exit code: ${code})`,
            logs
          });
        }
      });

      process.on('error', (error) => {
        logger.error(`Error starting service ${filename}:`, error);
        resolve({
          success: false,
          message: `Error starting service: ${error.message}`,
          logs
        });
      });
    });
  }

  async stopService(filename: string): Promise<{ success: boolean; message: string; logs?: string[] }> {
    return new Promise((resolve) => {
      const filePath = path.join(CONFIG.COMPOSE_DIRECTORY, filename);
      const projectName = this.getProjectName(filename);
      
      const logs: string[] = [];
      const process = spawn('docker-compose', [
        '-f', filePath,
        '-p', projectName,
        'down'
      ]);

      process.stdout.on('data', (data) => {
        const message = data.toString();
        logs.push(message);
        logger.info(`Docker Compose DOWN stdout: ${message}`);
      });

      process.stderr.on('data', (data) => {
        const message = data.toString();
        logs.push(message);
        logger.info(`Docker Compose DOWN stderr: ${message}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          logger.info(`Service ${filename} stopped successfully`);
          resolve({
            success: true,
            message: 'Service stopped successfully',
            logs
          });
        } else {
          logger.error(`Service ${filename} failed to stop with code ${code}`);
          resolve({
            success: false,
            message: `Failed to stop service (exit code: ${code})`,
            logs
          });
        }
      });

      process.on('error', (error) => {
        logger.error(`Error stopping service ${filename}:`, error);
        resolve({
          success: false,
          message: `Error stopping service: ${error.message}`,
          logs
        });
      });
    });
  }

  async isDockerAvailable(): Promise<boolean> {
    try {
      await execAsync('docker --version');
      await execAsync('docker-compose --version');
      return true;
    } catch (error) {
      logger.error('Docker is not available:', error);
      return false;
    }
  }

  private getProjectName(filename: string): string {
    // 使用文件名（不包含扩展名）作为项目名，确保唯一性
    const baseName = path.basename(filename, path.extname(filename));
    const dirName = path.dirname(filename).replace(/[^a-zA-Z0-9]/g, '_');
    return dirName === '.' ? baseName : `${dirName}_${baseName}`;
  }

  private parsePorts(portsString: string): string[] {
    if (!portsString) return [];
    
    // Docker Compose ports 格式: "0.0.0.0:3000->3000/tcp, 0.0.0.0:3001->3001/tcp"
    return portsString.split(',').map(port => port.trim()).filter(Boolean);
  }
}

export default new DockerService();