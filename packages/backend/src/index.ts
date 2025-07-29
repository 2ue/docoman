import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { CONFIG } from './utils/config';
import logger from './utils/logger';
import fileRoutes from './routes/files';
import serviceRoutes from './routes/services';
import convertRoutes from './routes/convert';
import authRoutes from './routes/auth';

const app = express();

// 中间件
app.use(helmet());
app.use(cors({ origin: CONFIG.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/convert', convertRoutes);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    code: error.constructor.name,
    message: error.message || 'Internal Server Error',
    timestamp: new Date(),
    ...(CONFIG.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 'NotFound',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date()
  });
});

// WebSocket 连接处理已移除

// 启动服务器
app.listen(CONFIG.PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${CONFIG.PORT}`);
  logger.info(`Compose directory: ${CONFIG.COMPOSE_DIRECTORY}`);
  logger.info(`CORS origin: ${CONFIG.CORS_ORIGIN}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});