import React from 'react';
import { useAtom } from 'jotai';
import { 
  Play, 
  Square, 
  Edit, 
  Trash2, 
  Clock,
  Users,
  AlertCircle,
  Loader2,
  Activity,
  Package
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DockerComposeFile } from '@/types';
import { operationsAtom } from '@/store/atoms';
import { cn } from '@/lib/utils';

interface FileCardProps {
  file: DockerComposeFile;
  onStart: (filename: string) => void;
  onStop: (filename: string) => void;
  onEdit: (filename: string) => void;
  onDelete: (filename: string) => void;
}

const FileCard: React.FC<FileCardProps> = ({
  file,
  onStart,
  onStop,
  onEdit,
  onDelete,
}) => {
  const [operations] = useAtom(operationsAtom);
  const operation = operations[file.filename];

  // 提取项目名称和文件名
  const projectName = file.filename.includes('/') 
    ? file.filename.split('/')[0] 
    : file.filename.replace('.yml', '').replace('.yaml', '');
  
  const displayName = file.filename.includes('/') 
    ? file.filename 
    : file.filename;

  const getStatusBadge = () => {
    if (operation === 'starting') {
      return (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Starting
        </Badge>
      );
    }
    if (operation === 'stopping') {
      return (
        <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200 animate-pulse">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Stopping
        </Badge>
      );
    }
    
    switch (file.status) {
      case 'running':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
            <Activity className="w-3 h-3 mr-1" />
            Running
          </Badge>
        );
      case 'stopped':
        return (
          <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-gray-200">
            <Square className="w-3 h-3 mr-1" />
            Stopped
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const isOperating = Boolean(operation);
  const canStart = file.status === 'stopped' && !isOperating;
  const canStop = file.status === 'running' && !isOperating;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1">
      {/* 状态指示条 */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 transition-colors duration-300",
        file.status === 'running' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
        file.status === 'error' ? 'bg-gradient-to-r from-red-400 to-red-500' :
        operation ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
        'bg-gradient-to-r from-gray-300 to-gray-400'
      )} />
      
      <CardHeader className="pb-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              "p-2.5 rounded-xl shadow-sm transition-colors duration-200",
              file.status === 'running' ? 'bg-blue-50 text-blue-600' :
              file.status === 'error' ? 'bg-red-50 text-red-600' :
              operation ? 'bg-blue-50 text-blue-600' :
              'bg-gray-50 text-gray-600'
            )}>
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                {projectName}
              </h3>
              <p className="text-sm text-gray-500 truncate mt-0.5">
                {displayName}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pb-4">
        {/* 服务信息 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="p-1.5 rounded-lg bg-gray-100">
            <Users className="w-4 h-4" />
          </div>
          <span className="font-medium">
            {file.services.length} service{file.services.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* 服务标签 */}
        {file.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {file.services.slice(0, 3).map((service) => (
              <span
                key={service}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                {service}
              </span>
            ))}
            {file.services.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                +{file.services.length - 3} more
              </span>
            )}
          </div>
        )}
        
        {/* 修改时间 */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Modified {new Date(file.lastModified).toLocaleDateString()}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 pb-6 bg-gray-50/50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
          <Button
            size="sm"
            variant="default"
            disabled={!canStart}
            onClick={() => onStart(file.filename)}
            className={cn(
              "flex-1 h-9 text-xs font-medium transition-all duration-200",
              canStart ? 
                "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md" :
                "opacity-50 cursor-not-allowed"
            )}
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Start</span>
            <span className="sm:hidden">▶</span>
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            disabled={!canStop}
            onClick={() => onStop(file.filename)}
            className={cn(
              "flex-1 h-9 text-xs font-medium transition-all duration-200",
              canStop ?
                "bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200" :
                "opacity-50 cursor-not-allowed"
            )}
          >
            <Square className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Stop</span>
            <span className="sm:hidden">⏹</span>
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(file.filename)}
            className="flex-1 h-9 text-xs font-medium transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Edit</span>
            <span className="sm:hidden">✏</span>
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            disabled={file.status === 'running'}
            onClick={() => onDelete(file.filename)}
            className={cn(
              "flex-1 h-9 text-xs font-medium transition-all duration-200",
              file.status !== 'running' ?
                "bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-sm hover:shadow-md" :
                "opacity-50 cursor-not-allowed"
            )}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Delete</span>
            <span className="sm:hidden">🗑</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default FileCard;