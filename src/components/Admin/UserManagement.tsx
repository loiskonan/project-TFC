import React, { useState, useEffect } from 'react';
import { Plus, Edit, Check, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'nsia_vie';
  banque: string;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
}

interface Banque {
  id: number;
  nom: string;
  code: string;
  isActive: boolean;
}

const UserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [banques, setBanques] = useState<Banque[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddBanque, setShowAddBanque] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    usersPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0
  });

  // Log des changements de stats
  useEffect(() => {
  }, [stats]);

  // États pour les filtres
  const [filters, setFilters] = useState({
    search: '',
    banque: '',
    role: '',
    status: ''
  });

  // États pour le formulaire d'ajout/édition
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user' | 'nsia_vie',
    banque: ''
  });

  // États pour le formulaire de banque
  const [banqueFormData, setBanqueFormData] = useState({
    nom: '',
    code: ''
  });
  const [banqueError, setBanqueError] = useState('');

  // Charger les utilisateurs
  const loadUsers = async (page = 1, currentFilters = filters) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('dataflow_token');
      
      if (!token) {
        setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
        return;
      }

      // Construire les paramètres de requête avec les filtres
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      // Ajouter les filtres actifs
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.banque) params.append('banque', currentFilters.banque);
      if (currentFilters.role) params.append('role', currentFilters.role);
      if (currentFilters.status) params.append('status', currentFilters.status);


      const response = await axios.get(`http://localhost:5000/api/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError('Erreur lors du chargement des utilisateurs');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les statistiques depuis la base de données
  const loadStats = async () => {
    try {
      const token = localStorage.getItem('dataflow_token');
      
      if (!token) {
        return;
      }

      const response = await axios.get('http://localhost:5000/api/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      
      // Vérifier que les données sont valides avant de les mettre à jour
      if (response.data && response.data.stats && 
          typeof response.data.stats.totalUsers === 'number' && 
          typeof response.data.stats.activeUsers === 'number') {
        setStats(response.data.stats);
      } else {
      }
    } catch (error: any) {
      // Ne pas réinitialiser les statistiques en cas d'erreur
    }
  };

  // Charger les banques
  const loadBanques = async () => {
    try {
      const token = localStorage.getItem('dataflow_token');
      const response = await axios.get('http://localhost:5000/api/banques/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setBanques(response.data.banques);
    } catch (error) {
    }
  };

  // Utiliser directement les utilisateurs de l'API (déjà filtrés côté serveur)
  const filteredUsers = users;

  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadUsers();
        await loadBanques();
        await loadStats();
      } catch (error) {
      }
    };
    
    initializeData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value
    };
    
    setFilters(newFilters);
    
    // Indiquer que le filtrage est en cours
    setIsFiltering(true);
    
    // Recharger les utilisateurs avec les nouveaux filtres
    setTimeout(() => {
      loadUsers(1, newFilters).finally(() => {
        setIsFiltering(false);
      }); // Retourner à la première page
    }, 150); // Délai réduit pour une réponse plus rapide
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      banque: '',
      role: '',
      status: ''
    };
    
    setFilters(emptyFilters);
    
    // Recharger les utilisateurs sans filtres
    setTimeout(() => {
      loadUsers(1, emptyFilters);
    }, 100);
  };

  const goToPage = (page: number) => {
    loadUsers(page);
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage) {
      loadUsers(pagination.nextPage!);
    }
  };

  const goToPrevPage = () => {
    if (pagination.hasPrevPage) {
      loadUsers(pagination.prevPage!);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'user' as 'admin' | 'user' | 'nsia_vie',
      banque: ''
    });
    setShowAddUser(false);
    setEditingUser(null);
  };

  const resetBanqueForm = () => {
    setBanqueFormData({
      nom: '',
      code: ''
    });
    setBanqueError('');
    setShowAddBanque(false);
  };

  const handleBanqueInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBanqueFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBanqueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanqueError('');

    // Validation
    if (!banqueFormData.nom || !banqueFormData.code) {
      setBanqueError('Le nom et le code sont requis');
      return;
    }

    try {
      const token = localStorage.getItem('dataflow_token');
      await axios.post('http://localhost:5000/api/banques', banqueFormData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      resetBanqueForm();
      // Recharger la liste des banques après création
      loadBanques();
    } catch (error: any) {
      setBanqueError(error.response?.data?.message || 'Erreur lors de la création de la banque');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.role) {
      setError('Nom, email et rôle sont requis');
      return;
    }

    // Validation de la banque selon le rôle
    if (formData.role === 'user' && !formData.banque) {
      setError('La banque est requise pour les utilisateurs');
      return;
    }

    try {
      const token = localStorage.getItem('dataflow_token');
      
      if (!token) {
        setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
        return;
      }

      const url = editingUser 
        ? `http://localhost:5000/api/users/${editingUser.id}`
        : 'http://localhost:5000/api/users';
      
      const body = { ...formData };

      if (editingUser) {
        await axios.put(url, body, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        await axios.post(url, body, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      await loadUsers(); // Recharger la liste
      await loadStats(); // Mettre à jour les statistiques
      resetForm();
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError(error.response?.data?.message || 'Erreur lors de l\'opération');
      }
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('dataflow_token');
      await axios.patch(`http://localhost:5000/api/users/${userId}/status`, 
        { isActive },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      await loadUsers(); // Recharger la liste
      await loadStats(); // Mettre à jour les statistiques
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const editUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      banque: user.banque || ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUser) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentification requise</h3>
        <p className="text-gray-600">Veuillez vous connecter pour accéder à cette section.</p>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Accès refusé</h3>
        <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Gestion des utilisateurs</h3>
          <div className="flex space-x-3">
          <button
            onClick={() => setShowAddUser(true)}
              className="flex items-center px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un utilisateur
            </button>
            <button
              onClick={() => setShowAddBanque(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
              Ajouter une banque
          </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Recherche */}
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rechercher
              </label>
            <input
              type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Nom ou email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
            </div>

            {/* Filtre par banque */}
            <div className="min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banque
              </label>
              <select
                name="banque"
                value={filters.banque}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              >
                <option value="">Toutes les banques</option>
                {banques.map((banque) => (
                  <option key={banque.id} value={banque.nom}>
                    {banque.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par rôle */}
            <div className="min-w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle
              </label>
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              >
                <option value="">Tous les rôles</option>
                <option value="admin">Administrateur</option>
                <option value="user">Utilisateur</option>
                <option value="nsia_vie">NSIA Vie</option>
              </select>
            </div>

            {/* Filtre par statut */}
            <div className="min-w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>

            {/* Bouton réinitialiser */}
            <div>
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Cadres de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-6 rounded-xl text-white shadow-lg" style={{ backgroundColor: 'rgb(16,16,92)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total d'utilisateurs</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Utilisateurs actifs</p>
                <p className="text-3xl font-bold">{stats.activeUsers}</p>
              </div>
              <div className="bg-green-400 bg-opacity-30 p-3 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateur de filtres */}
        {(filters.search || filters.banque || filters.role || filters.status) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-blue-700 text-sm font-medium">
                  Filtres actifs : {pagination.totalUsers} utilisateur{pagination.totalUsers !== 1 ? 's' : ''} trouvé{pagination.totalUsers !== 1 ? 's' : ''}
                  {isFiltering && (
                    <span className="ml-2 inline-flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-1 text-xs">Filtrage...</span>
                    </span>
                  )}
                </span>
                {filters.search && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Recherche: "{filters.search}"
                  </span>
                )}
                {filters.banque && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Banque: {filters.banque}
                  </span>
                )}
                {filters.role && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Rôle: {filters.role === 'admin' ? 'Administrateur' : filters.role === 'nsia_vie' ? 'NSIA Vie' : 'Utilisateur'}
                  </span>
                )}
                {filters.status && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Statut: {filters.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Effacer les filtres
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
          </div>
        ) : (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
              </tr>
            </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-primary-blue-lighter text-white'
                        : user.role === 'nsia_vie'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrateur' : user.role === 'nsia_vie' ? 'NSIA Vie' : 'Utilisateur'}
                    </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.banque || '-'}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Jamais'}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => editUser(user)}
                        className="p-2 text-primary-blue hover:text-primary-blue-hover hover:bg-primary-blue-lighter rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id, !user.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isActive
                            ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                        }`}
                        title={user.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {user.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Contrôles de pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de {((pagination.currentPage - 1) * pagination.usersPerPage) + 1} à {Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)} sur {pagination.totalUsers} utilisateurs
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPrevPage}
                  disabled={!pagination.hasPrevPage}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pagination.hasPrevPage
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Précédent
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        page === pagination.currentPage
                          ? 'bg-primary-blue text-white'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={!pagination.hasNextPage}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pagination.hasNextPage
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                    }`}
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'ajout/édition d'utilisateur */}
      {(showAddUser || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              
            </h3>
            
            {editingUser && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Informations actuelles</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Nom:</span>
                    <span className="ml-2 font-medium">{editingUser.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{editingUser.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rôle:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      editingUser.role === 'admin' 
                        ? 'bg-primary-blue-lighter text-white' 
                        : editingUser.role === 'nsia_vie'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {editingUser.role === 'admin' ? 'Administrateur' : editingUser.role === 'nsia_vie' ? 'NSIA Vie' : 'Utilisateur'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Banque:</span>
                    <span className="ml-2 font-medium">{editingUser.banque || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Statut:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      editingUser.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {editingUser.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dernière connexion:</span>
                    <span className="ml-2 font-medium">
                      {editingUser.lastLoginAt ? formatDate(editingUser.lastLoginAt) : 'Jamais'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ color: 'rgb(215, 153, 14)' }}>
                  {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
                </h2>
                <p className="text-gray-600">
                  {editingUser ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouvel utilisateur'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Colonne 1 */}
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Nom complet"
                    />
                  </div>



                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle *
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="nsia_vie">NSIA Vie</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                </div>

                {/* Colonne 2 */}
                <div className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="email@exemple.com"
                    />
                  </div>



                  {formData.role === 'user' && (
                    <div>
                      <label htmlFor="banque" className="block text-sm font-medium text-gray-700 mb-2">
                        Banque *
                      </label>
                      <select
                        id="banque"
                        name="banque"
                        required
                        value={formData.banque}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="">Sélectionnez une banque</option>
                        {banques.map((banque) => (
                          <option key={banque.id} value={banque.nom}>
                            {banque.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors"
                >
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'ajout de banque */}
      {showAddBanque && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ajouter une banque
            </h3>
            
            <form onSubmit={handleBanqueSubmit} className="space-y-4">
              {banqueError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{banqueError}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la banque *
                </label>
                <input
                  type="text"
                  name="nom"
                  required
                  value={banqueFormData.nom}
                  onChange={handleBanqueInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="Ex: NSIA BANQUE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code de la banque *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  value={banqueFormData.code}
                  onChange={handleBanqueInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="Ex: NSIA"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetBanqueForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;