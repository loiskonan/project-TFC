import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import FileUpload from './components/Files/FileUpload';
import FileList from './components/Files/FileList';
import ActionHistory from './components/History/ActionHistory';
import UserReports from './components/Reports/UserReports';
import UserManagement from './components/Admin/UserManagement';
import GlobalReports from './components/Reports/GlobalReports';
import Settings from './components/Settings/Settings';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!currentUser) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'files':
        return <FileList />;
      case 'upload':
        return <FileUpload />;
      case 'history':
        return <ActionHistory />;
      case 'reports':
        return <UserReports />;
      case 'users':
        return currentUser.role === 'admin' ? <UserManagement /> : <Dashboard />;
      case 'global-reports':
        return (currentUser.role === 'admin' || currentUser.role === 'nsia_vie') ? <GlobalReports /> : <Dashboard />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;