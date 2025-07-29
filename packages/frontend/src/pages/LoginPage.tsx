import { useState } from 'react';
import { useAtom } from 'jotai';
import MD5 from 'crypto-js/md5';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api';
import { setAuthenticatedAtom } from '@/store/atoms';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setAuthenticated] = useAtom(setAuthenticatedAtom);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: '错误',
        description: '请输入用户名和密码',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // 对密码进行MD5加密
      const passwordMd5 = MD5(password).toString();
      
      const result = await apiClient.login(username, passwordMd5);
      
      if (result.success) {
        setAuthenticated(true);
        toast({
          title: '登录成功',
          description: '欢迎使用 Docoman',
        });
      }
    } catch (error: any) {
      toast({
        title: '登录失败',
        description: error.message || '用户名或密码错误',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Docoman
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Docker Compose 管理系统
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>默认账号: admin</p>
          <p>默认密码: admin</p>
        </div>
      </Card>
    </div>
  );
}