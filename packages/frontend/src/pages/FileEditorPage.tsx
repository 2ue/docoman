import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, FileText, Copy, FileDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api';

const FileEditorPage: React.FC = () => {
  const { filename } = useParams<{ filename: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const isNewFile = !filename;
  const fromConverter = location.state?.fromConverter;
  const initialContent = location.state?.initialContent;

  // 获取文件内容（仅对现有文件）
  const { data: file, isLoading } = useQuery({
    queryKey: ['file', filename],
    queryFn: () => apiClient.getFile(filename!),
    enabled: !isNewFile,
  });

  // 创建文件
  const createMutation = useMutation({
    mutationFn: ({ filename, content }: { filename: string; content: string }) =>
      apiClient.createFile(filename, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      navigate('/');
    },
  });

  // 更新文件
  const updateMutation = useMutation({
    mutationFn: ({ filename, content }: { filename: string; content: string }) =>
      apiClient.updateFile(filename, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['file', filename] });
      setHasChanges(false);
    },
  });

  useEffect(() => {
    if (file) {
      setFileName(file.filename);
      setContent(file.content);
    } else if (isNewFile) {
      setFileName('');
      // 如果是从转换器来的，使用转换后的内容
      if (fromConverter && initialContent) {
        setContent(initialContent);
      } else {
        setContent(`services:
  # Add your services here
  web:
    image: nginx:latest
    ports:
      - "80:80"
`);
      }
    }
  }, [file, isNewFile, fromConverter, initialContent]);

  const handleSave = () => {
    if (isNewFile) {
      if (!fileName.trim()) {
        alert('Please enter a filename');
        return;
      }
      
      let finalFilename = fileName.trim();
      if (!finalFilename.endsWith('.yml') && !finalFilename.endsWith('.yaml')) {
        finalFilename += '.yml';
      }
      
      createMutation.mutate({ filename: finalFilename, content });
    } else {
      updateMutation.mutate({ filename: filename!, content });
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
  };

  const handleBack = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleCopyContent = async () => {
    if (!content.trim()) {
      addToast({
        type: 'error',
        title: 'No Content',
        message: 'There is no content to copy',
      });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(content);
      addToast({
        type: 'success',
        title: 'Copied',
        message: 'Content copied to clipboard',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy content to clipboard',
      });
    }
  };

  const handleDownloadFile = () => {
    if (!content.trim()) {
      addToast({
        type: 'error',
        title: 'No Content',
        message: 'There is no content to download',
      });
      return;
    }
    
    try {
      // 创建 Blob 对象
      const blob = new Blob([content], { type: 'text/yaml' });
      
      // 确定文件名
      let downloadFileName = 'docker-compose.yml';
      if (fileName.trim()) {
        downloadFileName = fileName.trim();
        if (!downloadFileName.endsWith('.yml') && !downloadFileName.endsWith('.yaml')) {
          downloadFileName += '.yml';
        }
      } else if (filename) {
        downloadFileName = filename;
      }
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFileName;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'Download Started',
        message: `${downloadFileName} has been downloaded`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download the file',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <h1 className="text-2xl font-bold">
              {isNewFile ? 'New File' : 'Edit File'}
            </h1>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleCopyContent}
            variant="outline"
            className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          
          <Button
            onClick={handleDownloadFile}
            variant="outline"
            className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Download
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {isNewFile && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Name</label>
            <Input
              value={fileName.includes('/') ? fileName.split('/')[0] : ''}
              onChange={(e) => {
                const projectName = e.target.value;
                const currentFileName = fileName.includes('/') ? fileName.split('/')[1] : 'docker-compose.yml';
                setFileName(projectName ? `${projectName}/${currentFileName}` : currentFileName);
              }}
              placeholder="my-project"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Files will be organized in project directories
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">File Name</label>
            <div className="flex items-center gap-2 max-w-md">
              {fileName.includes('/') && (
                <span className="text-sm text-muted-foreground">
                  {fileName.split('/')[0]}/
                </span>
              )}
              <Input
                value={fileName.includes('/') ? fileName.split('/')[1] : fileName}
                onChange={(e) => {
                  const newFileName = e.target.value;
                  const projectName = fileName.includes('/') ? fileName.split('/')[0] : '';
                  setFileName(projectName ? `${projectName}/${newFileName}` : newFileName);
                }}
                placeholder="docker-compose.yml"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Content</label>
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-96 p-4 border border-input rounded-md bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          placeholder="Enter your Docker Compose configuration..."
        />
      </div>
      
      {hasChanges && (
        <p className="text-sm text-muted-foreground">
          * You have unsaved changes
        </p>
      )}
    </div>
  );
};

export default FileEditorPage;