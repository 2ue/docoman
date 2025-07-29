import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';

import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/toast';
import Layout from '@/components/Layout';
import FileListPage from '@/pages/FileListPage';
import FileEditorPage from '@/pages/FileEditorPage';
import ConverterPage from '@/pages/ConverterPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<FileListPage />} />
                  <Route path="/editor/:filename?" element={<FileEditorPage />} />
                  <Route path="/converter" element={<ConverterPage />} />
                </Routes>
              </Layout>
            </Router>
          </ToastProvider>
        </QueryClientProvider>
      </JotaiProvider>
    </ErrorBoundary>
  );
}

export default App;