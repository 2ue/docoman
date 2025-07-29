import { atom } from 'jotai';
import { DockerComposeFile } from '@/types';

// 文件列表状态
export const filesAtom = atom<DockerComposeFile[]>([]);
export const filesLoadingAtom = atom(false);
export const filesErrorAtom = atom<string | null>(null);

// 当前选中的文件
export const selectedFileAtom = atom<DockerComposeFile | null>(null);

// UI 状态
export const sidebarOpenAtom = atom(true);
export const themeAtom = atom<'light' | 'dark'>('light');

// 操作状态
export const operationsAtom = atom<Record<string, 'starting' | 'stopping' | null>>({});

// 认证状态
export const isAuthenticatedAtom = atom<boolean>(
  () => localStorage.getItem('docoman_authenticated') === 'true'
);

export const setAuthenticatedAtom = atom(
  null,
  (get, set, authenticated: boolean) => {
    set(isAuthenticatedAtom, authenticated);
    localStorage.setItem('docoman_authenticated', authenticated.toString());
  }
);