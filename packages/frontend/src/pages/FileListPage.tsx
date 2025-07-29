import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, AlertCircle, FileX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import FileCard from '@/components/FileCard';
import { apiClient } from '@/lib/api';
import { operationsAtom } from '@/store/atoms';

const FileListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [, setOperations] = useAtom(operationsAtom);

  // 获取文件列表
  const {
    data: files = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['files'],
    queryFn: () => apiClient.getFiles(),
    refetchInterval: 30000, // 每30秒刷新一次
    staleTime: 5000, // 5秒内认为数据是新鲜的
    refetchOnMount: true, // 组件挂载时重新获取
    refetchOnWindowFocus: false, // 防止频繁刷新
  });

  // 启动服务
  const startMutation = useMutation({
    mutationFn: (filename: string) => apiClient.startService(filename),
    onMutate: (filename) => {
      setOperations((prev) => ({ ...prev, [filename]: 'starting' }));
    },
    onSuccess: (_, filename) => {
      addToast({
        type: 'success',
        title: 'Service Started',
        message: `${filename} started successfully`,
      });
    },
    onError: (error: any, filename) => {
      addToast({
        type: 'error',
        title: 'Failed to Start Service',
        message: error?.message || `Failed to start ${filename}`,
      });
    },
    onSettled: (_, __, filename) => {
      setOperations((prev) => ({ ...prev, [filename]: null }));
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  // 停止服务
  const stopMutation = useMutation({
    mutationFn: (filename: string) => apiClient.stopService(filename),
    onMutate: (filename) => {
      setOperations((prev) => ({ ...prev, [filename]: 'stopping' }));
    },
    onSuccess: (_, filename) => {
      addToast({
        type: 'success',
        title: 'Service Stopped',
        message: `${filename} stopped successfully`,
      });
    },
    onError: (error: any, filename) => {
      addToast({
        type: 'error',
        title: 'Failed to Stop Service',
        message: error?.message || `Failed to stop ${filename}`,
      });
    },
    onSettled: (_, __, filename) => {
      setOperations((prev) => ({ ...prev, [filename]: null }));
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  // 删除文件
  const deleteMutation = useMutation({
    mutationFn: (filename: string) => apiClient.deleteFile(filename),
    onSuccess: (_, filename) => {
      addToast({
        type: 'success',
        title: 'File Deleted',
        message: `${filename} deleted successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error: any, filename) => {
      addToast({
        type: 'error',
        title: 'Failed to Delete File',
        message: error?.message || `Failed to delete ${filename}`,
      });
    },
  });

  const handleStart = (filename: string) => {
    startMutation.mutate(filename);
  };

  const handleStop = (filename: string) => {
    stopMutation.mutate(filename);
  };

  const handleEdit = (filename: string) => {
    navigate(`/editor/${encodeURIComponent(filename)}`);
  };

  const handleDelete = (filename: string) => {
    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      deleteMutation.mutate(filename);
    }
  };

  const handleCreateNew = () => {
    navigate('/editor');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Docker Compose Files</h1>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Docker Compose Files</h1>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold">Failed to load files</h3>
            <p className="text-muted-foreground">
              {(error as any)?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Docker Compose Files</h1>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New File
          </Button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-6 max-w-md mx-auto px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <FileX className="w-12 h-12 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">No Docker Compose files</h3>
              <p className="text-gray-500 leading-relaxed">
                Get started by creating your first Docker Compose file to manage your containerized applications
              </p>
            </div>
            <Button 
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New File
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {files.map((file) => (
            <FileCard
              key={file.filename}
              file={file}
              onStart={handleStart}
              onStop={handleStop}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileListPage;