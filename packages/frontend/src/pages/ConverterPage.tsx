import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Copy, 
  Download, 
  FileText, 
  Terminal, 
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileDown
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api';

const ConverterPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [dockerCommand, setDockerCommand] = useState('');
  const [composeResult, setComposeResult] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');

  // 转换 Docker 命令
  const convertMutation = useMutation({
    mutationFn: (command: string) => apiClient.convertDockerCommand(command),
    onSuccess: (result) => {
      let processedContent = result.composeContent;
      
      // 去掉开头的 name 字段
      processedContent = processedContent.replace(/^name:\s*.*\n/, '');
      
      // 如果选择了版本，添加 version 字段
      if (selectedVersion) {
        processedContent = `version: '${selectedVersion}'\n${processedContent}`;
      }
      
      setComposeResult(processedContent);
      addToast({
        type: 'success',
        title: 'Conversion Successful',
        message: 'Docker command converted to Docker Compose format',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: 'Conversion Failed',
        message: error?.message || 'Failed to convert Docker command',
      });
    },
  });

  const handleConvert = () => {
    if (!dockerCommand.trim()) {
      addToast({
        type: 'error',
        title: 'Input Required',
        message: 'Please enter a Docker command to convert',
      });
      return;
    }
    convertMutation.mutate(dockerCommand.trim());
  };

  const handleCopyResult = async () => {
    if (!composeResult) return;
    
    try {
      await navigator.clipboard.writeText(composeResult);
      addToast({
        type: 'success',
        title: 'Copied',
        message: 'Docker Compose content copied to clipboard',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy content to clipboard',
      });
    }
  };

  const handleCreateFile = () => {
    if (!composeResult) return;
    
    // 导航到编辑器页面并传递生成的内容
    navigate('/editor', { 
      state: { 
        initialContent: composeResult,
        fromConverter: true 
      } 
    });
  };

  const handleDownloadFile = () => {
    if (!composeResult) return;
    
    try {
      // 创建 Blob 对象
      const blob = new Blob([composeResult], { type: 'text/yaml' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'docker-compose.yml';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'Download Started',
        message: 'docker-compose.yml file has been downloaded',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download the file',
      });
    }
  };

  const exampleCommands = [
    'docker run -d -p 8080:80 --name my-web-app nginx:latest',
    'docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=secret --name mysql-db mysql:8.0',
    'docker run -d -p 6379:6379 --name redis-cache redis:alpine',
    'docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password --name postgres-db postgres:13'
  ];

  const insertExample = (command: string) => {
    setDockerCommand(command);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Docker to Compose Converter
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Convert your Docker run commands into Docker Compose format with ease. 
          Simplify container orchestration and make your deployments more manageable.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 输入区域 */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              Docker Command Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="docker-command" className="text-sm font-medium">
                Enter your Docker run command
              </Label>
              <Textarea
                id="docker-command"
                placeholder="docker run -d -p 8080:80 --name my-app nginx:latest"
                value={dockerCommand}
                onChange={(e) => setDockerCommand(e.target.value)}
                className="mt-2 min-h-[120px] font-mono text-sm"
              />
            </div>

            {/* 版本选择 */}
            <div>
              <Label htmlFor="version-select" className="text-sm font-medium">
                Docker Compose Version (Optional)
              </Label>
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="No version (recommended)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No version (recommended)</SelectItem>
                  <SelectItem value="3.8">3.8</SelectItem>
                  <SelectItem value="3.7">3.7</SelectItem>
                  <SelectItem value="3.6">3.6</SelectItem>
                  <SelectItem value="3.5">3.5</SelectItem>
                  <SelectItem value="3.4">3.4</SelectItem>
                  <SelectItem value="3.3">3.3</SelectItem>
                  <SelectItem value="2.4">2.4</SelectItem>
                  <SelectItem value="2.3">2.3</SelectItem>
                  <SelectItem value="2.2">2.2</SelectItem>
                  <SelectItem value="2.1">2.1</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Modern Docker Compose (v2) doesn't require version specification
              </p>
            </div>

            <Button
              onClick={handleConvert}
              disabled={convertMutation.isPending || !dockerCommand.trim()}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {convertMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Convert to Compose
                </>
              )}
            </Button>

            {/* 示例命令 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Example Commands:</Label>
              <div className="space-y-2">
                {exampleCommands.map((command, index) => (
                  <button
                    key={index}
                    onClick={() => insertExample(command)}
                    className="w-full text-left p-3 text-xs font-mono bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
                  >
                    {command}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 输出区域 */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Docker Compose Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Generated Docker Compose YAML
              </Label>
              {composeResult ? (
                <div className="mt-2 relative">
                  <Textarea
                    readOnly
                    value={composeResult}
                    className="min-h-[300px] font-mono text-sm bg-gray-50 border-blue-200"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyResult}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 min-h-[300px] border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                  <div className="text-center space-y-2">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-gray-500 text-sm">
                      Docker Compose output will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 结果操作按钮 */}
            {composeResult && (
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyResult}
                  variant="outline"
                  className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Result
                </Button>
                <Button
                  onClick={handleDownloadFile}
                  variant="outline"
                  className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handleCreateFile}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Create File
                </Button>
              </div>
            )}

            {/* 转换状态提示 */}
            {convertMutation.isPending && (
              <div className="flex items-center gap-2 text-blue-600 text-sm bg-blue-50 p-3 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                Converting Docker command...
              </div>
            )}

            {convertMutation.isError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                Conversion failed. Please check your Docker command syntax.
              </div>
            )}

            {composeResult && !convertMutation.isPending && (
              <div className="flex items-center gap-2 text-blue-600 text-sm bg-blue-50 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                Docker command successfully converted!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用指南 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Usage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Terminal className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold">Supported Commands</h3>
              <p className="text-sm text-gray-600">
                Most Docker run command options are supported including ports, environment variables, volumes, and more.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold">Clean Output</h3>
              <p className="text-sm text-gray-600">
                Generated Docker Compose files follow best practices and are ready to use in your projects.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-semibold">Quick Setup</h3>
              <p className="text-sm text-gray-600">
                Convert and create new Docker Compose files instantly, saving time on manual configuration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConverterPage;