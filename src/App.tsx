import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { CompaniesPage } from './pages/CompaniesPage';
import { TeamsPage } from './pages/TeamsPage';
import { UsersPage } from './pages/UsersPage';
import { ChecklistsPage } from './pages/ChecklistsPage';
import { PromptsPage } from './pages/PromptsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { LogsPage } from './pages/LogsPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('companies');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <LoginPage />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'companies' && <CompaniesPage />}
      {currentPage === 'teams' && <TeamsPage />}
      {currentPage === 'users' && <UsersPage />}
      {currentPage === 'checklists' && <ChecklistsPage />}
      {currentPage === 'prompts' && <PromptsPage />}
      {currentPage === 'integrations' && <IntegrationsPage />}
      {currentPage === 'logs' && <LogsPage />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
