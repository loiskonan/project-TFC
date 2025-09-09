import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FileSendList from './FileSendList';

const FileManagement: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentification requise</h3>
        <p className="text-gray-600">Veuillez vous connecter pour accéder à cette section.</p>
      </div>
    );
  }

  // Titre selon le rôle
  const getPageTitle = () => {
    if (currentUser.role === 'user') {
      return `Fichiers reçus${currentUser?.banque ? ` - ${currentUser.banque}` : ''}`;
    } else {
      return 'Fichiers envoyés (Toutes les banques)';
    }
  };

  // Titre personnalisé avec style pour les utilisateurs
  const renderCustomTitle = () => {
    if (currentUser.role === 'user' && currentUser?.banque) {
      return (
        <div className="flex items-center">
          <span className="text-gray-900">Fichiers reçus - </span>
          <span className="text-yellow-500 font-semibold ml-1">{currentUser.banque}</span>
        </div>
      );
    }
    return getPageTitle();
  };

  // Utiliser FileSendList pour tous les utilisateurs
  return (
    <FileSendList 
      title={renderCustomTitle()}
      showDeposantInfo={currentUser.role === 'admin' || currentUser.role === 'nsia_vie'}
    />
  );
};

export default FileManagement;

