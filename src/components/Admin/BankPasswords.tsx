import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface BankPassword {
  id: number;
  nom: string;
  code: string;
  motDePasse: string;
  nombreUtilisateurs: number;
  isActive: boolean;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const BankPasswords: React.FC = () => {
  const [passwords, setPasswords] = useState<BankPassword[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [loading, setLoading] = useState(false);

  const fetchPasswords = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dataflow_token');
      const response = await axios.get(`http://localhost:5000/api/banques/passwords?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setPasswords(response.data.banques);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des mots de passe:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasswords();
  }, []);


  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {pagination.currentPage} sur {pagination.totalPages} 
            ({pagination.totalItems} banques au total)
          </div>
          <div className="flex space-x-2">
            {pagination.currentPage > 1 && (
              <button
                onClick={() => fetchPasswords(pagination.currentPage - 1)}
                className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Précédent
              </button>
            )}
            {pagination.currentPage < pagination.totalPages && (
              <button
                onClick={() => fetchPasswords(pagination.currentPage + 1)}
                className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Suivant
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            🔐 Mots de passe par défaut des banques
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Chaque banque a un mot de passe unique généré automatiquement pour ses utilisateurs
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Banque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mot de passe par défaut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateurs
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : passwords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Aucune banque trouvée
                  </td>
                </tr>
              ) : (
                passwords.map((bank) => (
                  <tr key={bank.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {bank.nom}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {bank.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">
                        {bank.motDePasse}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {bank.nombreUtilisateurs} utilisateur{bank.nombreUtilisateurs > 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              Guide d'utilisation
            </h3>
            <div className="mt-2 text-sm text-gray-700">
              <p>
                Cette page affiche les mots de passe par défaut générés automatiquement pour chaque banque. 
                Les utilisateurs de type "user" reçoivent automatiquement le mot de passe de leur banque lors de leur création.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankPasswords;
