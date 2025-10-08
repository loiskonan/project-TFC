import React from 'react';
import { LogIn } from 'lucide-react';

import { 
  Home, 
  Upload, 
  Download, 
  BarChart3, 
  Users, 
  Settings,
  FileText,
  Key,
  Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isNsiaVie = currentUser?.role === 'nsia_vie';

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { 
      id: 'files', 
      label: currentUser?.role === 'user' ? 'Fichiers envoyés' : 'Fichiers reçus', 
      icon: FileText 
    },
    { 
      id: 'file-management', 
      label: currentUser?.role === 'user' ? 'Fichiers reçus' : 'Fichiers envoyés', 
      icon: Download 
    },
    { id: 'upload', label: 'Transmission de fichiers', icon: Upload },
    { id: 'reports', label: 'Rapports', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings },
    ...(isAdmin ? [
      { id: 'users', label: 'Utilisateurs', icon: Users },
      { id: 'bank-passwords', label: 'Mots de passe banques', icon: Key },
      { id: 'products', label: 'Gestion des produits', icon: Package }
    ] : isNsiaVie ? [
      { id: 'users', label: 'Utilisateurs', icon: Users },
      { id: 'bank-passwords', label: 'Mots de passe banques', icon: Key }
    ] : [])
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: 'rgb(16,16,92)' }}>
            <LogIn className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800"> 
            <span style={{ color: 'rgb(16,16,92)' }}>Data</span>
            <span style={{ color: 'rgb(215, 153, 14)' }}>Flow</span>
          </h2>
        </div>
        <p className="text-sm text-gray-600" >
          {isAdmin 
            ? 'Administration' 
            : isNsiaVie 
            ? 'Espace NSIA Vie' 
            : currentUser?.banque 
            ? `Espace ${currentUser.banque}`
            : 'Espace utilisateur'
          }
        </p>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-primary-blue-lighter text-white border-l-4 border-primary-blue'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;