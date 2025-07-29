import { Router, Request, Response } from 'express';
import fileService from '../services/fileService';
import dockerService from '../services/dockerService';
import logger from '../utils/logger';

const router: Router = Router();

// 获取所有文件
router.get('/', async (_req: Request, res: Response) => {
  try {
    const files = await fileService.getAllFiles();
    
    // 获取每个文件的服务状态
    const filesWithStatus = await Promise.all(
      files.map(async (file) => {
        const status = await dockerService.getServiceStatus(file.filename);
        return {
          ...file,
          status: status.status
        };
      })
    );

    return res.json(filesWithStatus);
  } catch (error) {
    logger.error('Error getting files:', error);
    return res.status(500).json({
      code: 'InternalServerError',
      message: 'Failed to get files',
      timestamp: new Date()
    });
  }
});

// 获取单个文件
router.get('/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const file = await fileService.getFile(filename);
    
    if (!file) {
      return res.status(404).json({
        code: 'FileNotFound',
        message: `File ${filename} not found`,
        timestamp: new Date()
      });
    }

    // 获取服务状态
    const status = await dockerService.getServiceStatus(filename);
    
    return res.json({
      ...file,
      status: status.status
    });
  } catch (error) {
    logger.error('Error getting file:', error);
    return res.status(500).json({
      code: 'InternalServerError',
      message: 'Failed to get file',
      timestamp: new Date()
    });
  }
});

// 创建文件
router.post('/', async (req: Request, res: Response) => {
  try {
    const { filename, content } = req.body;
    
    if (!filename || !content) {
      return res.status(400).json({
        code: 'ValidationError',
        message: 'filename and content are required',
        timestamp: new Date()
      });
    }

    const file = await fileService.createFile(filename, content);
    
    return res.status(201).json(file);
  } catch (error) {
    logger.error('Error creating file:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          code: 'FileAlreadyExists',
          message: error.message,
          timestamp: new Date()
        });
      }
      
      if (error.message.includes('YAML') || error.message.includes('Docker Compose')) {
        return res.status(400).json({
          code: 'ValidationError',
          message: error.message,
          timestamp: new Date()
        });
      }
    }
    
    return res.status(500).json({
      code: 'InternalServerError',
      message: 'Failed to create file',
      timestamp: new Date()
    });
  }
});

// 更新文件
router.put('/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        code: 'ValidationError',
        message: 'content is required',
        timestamp: new Date()
      });
    }

    const file = await fileService.updateFile(filename, content);
    
    return res.json(file);
  } catch (error) {
    logger.error('Error updating file:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('YAML') || error.message.includes('Docker Compose')) {
        return res.status(400).json({
          code: 'ValidationError',
          message: error.message,
          timestamp: new Date()
        });
      }
    }
    
    return res.status(500).json({
      code: 'InternalServerError',
      message: 'Failed to update file',
      timestamp: new Date()
    });
  }
});

// 删除文件
router.delete('/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // 检查服务是否正在运行
    const status = await dockerService.getServiceStatus(filename);
    if (status.status === 'running') {
      return res.status(409).json({
        code: 'ServiceRunning',
        message: 'Cannot delete file while service is running. Please stop the service first.',
        timestamp: new Date()
      });
    }

    await fileService.deleteFile(filename);
    
    return res.status(204).send();
  } catch (error) {
    logger.error('Error deleting file:', error);
    
    if (error instanceof Error && (error as any).code === 'ENOENT') {
      return res.status(404).json({
        code: 'FileNotFound',
        message: `File ${req.params.filename} not found`,
        timestamp: new Date()
      });
    }
    
    return res.status(500).json({
      code: 'InternalServerError',
      message: 'Failed to delete file',
      timestamp: new Date()
    });
  }
});

export default router;