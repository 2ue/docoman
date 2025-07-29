import { Router } from 'express';
import { CONFIG } from '../utils/config';
import logger from '../utils/logger';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        code: 'ValidationError',
        message: '用户名和密码不能为空',
        timestamp: new Date()
      });
    }

    // 验证用户名和MD5加密的密码
    if (username === CONFIG.AUTH.USERNAME && password === CONFIG.AUTH.PASSWORD_MD5) {
      logger.info(`用户 ${username} 登录成功`);
      res.json({
        success: true,
        message: '登录成功',
        timestamp: new Date()
      });
    } else {
      logger.warn(`用户 ${username} 登录失败：账号或密码错误`);
      res.status(401).json({
        code: 'AuthenticationError',
        message: '用户名或密码错误',
        timestamp: new Date()
      });
    }
  } catch (error) {
    logger.error('登录接口错误:', error);
    res.status(500).json({
      code: 'InternalServerError',
      message: '服务器内部错误',
      timestamp: new Date()
    });
  }
});

export default router;