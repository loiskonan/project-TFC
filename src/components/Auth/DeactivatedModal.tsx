import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeactivatedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeactivatedModal: React.FC<DeactivatedModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-full mr-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Compte désactivé
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            Votre compte a été désactivé par un administrateur.
          </p>
          <p className="text-gray-600">
            Vous allez être redirigé vers la page de connexion.
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivatedModal;




