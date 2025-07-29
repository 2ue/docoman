import { Router, Request, Response } from 'express';
import dockerService from '../services/dockerService';
import fileService from '../services/fileService';
import logger from '../utils/logger';

const router: Router = Router();

// 启动服务
router.post('/:filename/start', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // 检查文件是否存在
    const file = await fileService.getFile(filename);
    if (!file) {
      return res.status(404).json({
        code: 'FileNotFound',
        message: `File ${filename} not found`,
        timestamp: new Date()
      });
    }

    // 检查 Docker 是否可用
    const dockerAvailable = await dockerService.isDockerAvailable();
    if (!dockerAvailable) {
      return res.status(500).json({
        code: 'DockerUnavailable',
        message: 'Docker or Docker Compose is not available',
        timestamp: new Date()
      });
    }

    // 检查服务当前状态
    const currentStatus = await dockerService.getServiceStatus(filename);
    if (currentStatus.status === 'running') {
      return res.status(409).json({
        code: 'ServiceAlreadyRunning',
        message: 'Service is already running',
        timestamp: new Date()
      });
    }

    // 启动服务
    const result = await dockerService.startService(filename);
    
    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        logs: result.logs
      });
    } else {
      return res.status(500).json({
        code: 'ServiceStartFailed',
        message: result.message,
        logs: result.logs,
        timestamp: new Date()
      });
    }
  } catch (error) {
    logger.error('Error starting service:', error);
    return res.status(500).json({
      code: 'InternalServerError',
      message: 'Failed to start service',
      timestamp: new Date()
    });
  }
});

// 停止服务
router.post('/:filename/stop', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // 检查文件是否存在
    const file = await fileService.getFile(filename);
    if (!file) {
      return res.status(404).json({
        code: 'FileNotFound',
        message: `File ${filename} not found`,
        timestamp: new Date()
      });
    }

    // 检查 Docker 是否可用
    const dockerAvailable = await dockerService.isDockerAvailable();
    if (!dockerAvailable) {
      return res.status(500).json({
        code: 'DockerUnavailable',
        message: 'Docker or Docker Compose is not available',
        timestamp: new Date()
      });
    }

    // 检查服务当前状态
    const currentStatus = await dockerService.getServiceStatus(filename);
    if (currentStatus.status === 'stopped') {
      return res.status(409).json({
        code: 'ServiceAlreadyStopped',
        message: 'Service is already stopped',
        timestamp: new Date()
      });
    }

    // 停止服务
    const result = await dockerService.stopService(filename);
    
    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        logs: result.logs
      });
    } else {
      return res.status(500).json({
        code: 'ServiceStopFailed',
        message: result.message,
        logs: result.logs,
        timestamp: new Date()
      });
    }
  } catch (error) {
    logger.error('Error stopping service:', error);
    return res.status(500).json({
      code: 'InternalServerError',
      message: 'Failed to stop service',
      timestamp: new Date()
    });
  }
});

// 获取服务状态
router.get('/:filename/status', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // 检查文件是否存在
    const file = await fileService.getFile(filename);
    if (!file) {
      return res.status(404).json({
        code: 'FileNotFound',
        message: `File ${filename} not found`,
        timestamp: new Date()
      });
    }

    const status = await dockerService.getServiceStatus(filename);
    return res.json(status);
  } catch (error) {
    logger.error('Error getting service status:', error);
    return res.status(500).json({
      code: 'InternalServerError',
      message: 'Failed to get service status',
      timestamp: new Date()
    });
  }
});

export default router;