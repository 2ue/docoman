import { config } from 'dotenv';
import path from 'path';

config();

export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  COMPOSE_DIRECTORY: path.resolve(process.env.COMPOSE_DIRECTORY || './docker-compose-files'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  AUTH: {
    USERNAME: process.env.AUTH_USERNAME || 'admin',
    PASSWORD_MD5: process.env.AUTH_PASSWORD_MD5 || '21232f297a57a5a743894a0e4a801fc3', // admin的MD5
  },
} as const;

export const isDevelopment = CONFIG.NODE_ENV === 'development';
export const isProduction = CONFIG.NODE_ENV === 'production';