import { Router, Request, Response } from 'express';
import logger from '../utils/logger';
import composerize from 'composerize';

const router: Router = Router();

// Docker 命令转 Docker Compose 接口
router.post('/convert', async (req: Request, res: Response) => {
  try {
    const { dockerCommand } = req.body;
    
    if (!dockerCommand || typeof dockerCommand !== 'string') {
      return res.status(400).json({
        code: 'InvalidInput',
        message: 'Docker command is required and must be a string',
        timestamp: new Date()
      });
    }

    try {
      // 转换 Docker 命令为 Docker Compose 格式
      const composeConfig = composerize(dockerCommand.trim());
      
      if (!composeConfig) {
        return res.status(400).json({
          code: 'ConversionFailed',
          message: 'Failed to convert Docker command. Please check the command syntax.',
          timestamp: new Date()
        });
      }

      logger.info(`Docker command converted successfully: ${dockerCommand}`);
      
      return res.json({
        dockerCommand: dockerCommand.trim(),
        composeContent: composeConfig,
        timestamp: new Date()
      });
      
    } catch (conversionError) {
      logger.error('Docker command conversion error:', conversionError);
      
      return res.status(400).json({
        code: 'ConversionError',
        message: 'Invalid Docker command format or unsupported options',
        details: conversionError instanceof Error ? conversionError.message : 'Unknown error',
        timestamp: new Date()
      });
    }
    
  } catch (error) {
    logger.error('Convert endpoint error:', error);
    
    return res.status(500).json({
      code: 'InternalServerError',
      message: 'Failed to convert Docker command',
      timestamp: new Date()
    });
  }
});

export default router;