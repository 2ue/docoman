export interface DockerComposeFile {
  filename: string;
  path: string;
  content: string;
  lastModified: Date;
  status: 'running' | 'stopped' | 'error' | 'unknown';
  services: string[];
}

export interface ServiceStatus {
  filename: string;
  status: 'running' | 'stopped' | 'error';
  containers: ContainerInfo[];
}

export interface ContainerInfo {
  name: string;
  status: string;
  ports: string[];
  image: string;
}

export interface SystemConfig {
  composeDirectory: string;
  autoRefresh: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface FileCache {
  [filename: string]: {
    lastModified: Date;
    status: ServiceStatus;
    parsedContent: any;
    validationErrors: string[];
  };
}