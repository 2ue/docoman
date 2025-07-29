export interface DockerComposeFile {
  filename: string;
  path: string;
  content: string;
  lastModified: string;
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

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ServiceOperationResult {
  success: boolean;
  message: string;
  logs?: string[];
}

export interface DockerConvertResult {
  dockerCommand: string;
  composeContent: string;
  timestamp: string;
}