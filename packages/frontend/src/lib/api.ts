import { DockerComposeFile, ServiceStatus, ServiceOperationResult, DockerConvertResult } from '@/types';

const API_BASE_URL = '/api';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        code: 'NetworkError',
        message: 'Failed to communicate with server',
        timestamp: new Date().toISOString()
      }));
      throw error;
    }

    // 处理 204 No Content 状态码（如删除操作）
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // 文件管理 API
  async getFiles(): Promise<DockerComposeFile[]> {
    return this.request<DockerComposeFile[]>('/files');
  }

  async getFile(filename: string): Promise<DockerComposeFile> {
    return this.request<DockerComposeFile>(`/files/${encodeURIComponent(filename)}`);
  }

  async createFile(filename: string, content: string): Promise<DockerComposeFile> {
    return this.request<DockerComposeFile>('/files', {
      method: 'POST',
      body: JSON.stringify({ filename, content }),
    });
  }

  async updateFile(filename: string, content: string): Promise<DockerComposeFile> {
    return this.request<DockerComposeFile>(`/files/${encodeURIComponent(filename)}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteFile(filename: string): Promise<void> {
    await this.request(`/files/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
  }

  // 服务控制 API
  async startService(filename: string): Promise<ServiceOperationResult> {
    return this.request<ServiceOperationResult>(`/services/${encodeURIComponent(filename)}/start`, {
      method: 'POST',
    });
  }

  async stopService(filename: string): Promise<ServiceOperationResult> {
    return this.request<ServiceOperationResult>(`/services/${encodeURIComponent(filename)}/stop`, {
      method: 'POST',
    });
  }

  async getServiceStatus(filename: string): Promise<ServiceStatus> {
    return this.request<ServiceStatus>(`/services/${encodeURIComponent(filename)}/status`);
  }

  // Docker 命令转换 API
  async convertDockerCommand(dockerCommand: string): Promise<DockerConvertResult> {
    return this.request<DockerConvertResult>('/convert/convert', {
      method: 'POST',
      body: JSON.stringify({ dockerCommand }),
    });
  }

  // 认证 API
  async login(username: string, passwordMd5: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password: passwordMd5 }),
    });
  }
}

export const apiClient = new ApiClient();