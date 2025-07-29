import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, useAtomValue } from 'jotai';

import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/toast';
import Layout from '@/components/Layout';
import FileListPage from '@/pages/FileListPage';
import FileEditorPage from '@/pages/FileEditorPage';
import ConverterPage from '@/pages/ConverterPage';
import LoginPage from '@/pages/LoginPage';
import { isAuthenticatedAtom } from '@/store/atoms';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<FileListPage />} />
          <Route path="/editor/:filename?" element={<FileEditorPage />} />
          <Route path="/converter" element={<ConverterPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </QueryClientProvider>
      </JotaiProvider>
    </ErrorBoundary>
  );
}

export default App;