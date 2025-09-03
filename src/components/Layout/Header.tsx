import React from 'react';
import { LogOut, Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ color: 'rgb(16, 16, 92)' }}>
            Gestion de fichiers
          </h1>
          <p className="text-sm text-gray-600" style={{ color: 'rgb(215, 153, 14)' }}>
            Bienvenue, {currentUser?.name}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
              <User className="h-4 w-4 text-gray-600" style={{ color: 'rgb(16, 16, 92)' }} />
              <span className="text-sm font-medium text-gray-700" style={{ color: 'rgb(215, 153, 14)' }}>
                {currentUser?.email}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentUser?.role === 'admin' 
                  ? 'bg-primary-blue-lighter text-white' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {currentUser?.role === 'admin' ? 'Admin' : 'Utilisateur'}
              </span>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;