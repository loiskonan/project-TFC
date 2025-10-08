import React, { useState, useEffect } from 'react';
import { 
  Download, 
  RefreshCw, 
  Search, 
  Filter,
  FileText,
  Image,
  FileVideo,
  FileAudio,
  Database,
  Archive,
  FileSpreadsheet,
  FileCode,
  Building2,
  Calendar,
  User,
  Mail,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { banqueProductService } from '../../services/productService';
import { BanqueProduct } from '../../types/product';

interface FileSendItem {
  id: number;
  originalName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  description: string;
  deposantNom: string;
  deposantEmail: string;
  deposantRole: string;
  banqueDestinataire: string;
  banqueCode: string;
  status: 'sent' | 'delivered' | 'read' | 'downloaded';
  downloadCount: number;
  createdAt: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  lastDownloadAt?: string;
  productId?: number;
  productName?: string;
  productCode?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface FileSendListProps {
  title: string | React.ReactNode;
  showDeposantInfo?: boolean;
}

const FileSendList: React.FC<FileSendListProps> = ({ title, showDeposantInfo = false }) => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<FileSendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // États pour les filtres
  const [filters, setFilters] = useState({
    searchTerm: '',
    banqueDestinataire: '',
    deposantRole: '',
    status: '',
    product: ''
  });

  const [banques, setBanques] = useState<Array<{name: string, code: string}>>([]);
  const [products, setProducts] = useState<BanqueProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Charger les fichiers
  const fetchFiles = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('dataflow_token');
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      });

      let endpoint = '';
      
      // Déterminer l'endpoint selon le rôle et le contexte
      if (currentUser?.role === 'admin' || currentUser?.role === 'nsia_vie') {
        if (showDeposantInfo) {
          // Admin/NSIA Vie voient tous les fichiers envoyés
          endpoint = 'http://localhost:5000/api/file-send/all-sent-files';
        } else {
          // Admin/NSIA Vie voient leurs propres fichiers envoyés
          endpoint = 'http://localhost:5000/api/file-send/my-sent-files';
        }
      } else {
        // Utilisateurs normaux voient les fichiers reçus par leur banque
        endpoint = 'http://localhost:5000/api/file-send/received-files';
      }

      const response = await axios.get(`${endpoint}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setFiles(response.data.data.files);
        setPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  // Charger la liste des banques pour les filtres
  const fetchBanques = async () => {
    try {
      const token = localStorage.getItem('dataflow_token');
      const response = await axios.get('http://localhost:5000/api/banques/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setBanques(response.data.banques.map((banque: any) => ({
          name: banque.nom,
          code: banque.nom
        })));
      }
    } catch (error) {
    }
  };

  // Charger les produits d'une banque
  const loadProductsForBanque = async (banqueName: string) => {
    try {
      setLoadingProducts(true);
      const productsData = await banqueProductService.getProductsByBanqueName(banqueName);
      setProducts(productsData);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Gestionnaire de changement de banque
  const handleBanqueChange = (value: string) => {
    setFilters(prev => ({ ...prev, banqueDestinataire: value, product: '' }));
    // Charger les produits de la banque sélectionnée
    if (value && value !== '') {
      loadProductsForBanque(value);
    } else {
      setProducts([]);
    }
  };

  // Gestionnaire de changement de produit
  const handleProductChange = (value: string) => {
    setFilters(prev => ({ ...prev, product: value }));
  };

  // Télécharger un fichier
  const downloadFile = async (fileId: number, originalName: string) => {
    try {
      const token = localStorage.getItem('dataflow_token');
      const response = await axios.get(`http://localhost:5000/api/file-send/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Rafraîchir la liste pour mettre à jour les statistiques
      fetchFiles();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors du téléchargement');
    }
  };

  // Obtenir l'icône du fichier
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <Image className="h-5 w-5 text-green-500" />;
    if (fileType.includes('video')) return <FileVideo className="h-5 w-5 text-purple-500" />;
    if (fileType.includes('audio')) return <FileAudio className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-5 w-5 text-blue-600" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return <Archive className="h-5 w-5 text-orange-500" />;
    if (fileType.includes('database')) return <Database className="h-5 w-5 text-indigo-500" />;
    if (fileType.includes('code') || fileType.includes('text')) return <FileCode className="h-5 w-5 text-gray-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Envoyé' },
      delivered: { color: 'bg-yellow-100 text-yellow-800', icon: CheckCircle, label: 'Livré' },
      read: { color: 'bg-green-100 text-green-800', icon: Eye, label: 'Lu' },
      downloaded: { color: 'bg-purple-100 text-purple-800', icon: Download, label: 'Téléchargé' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sent;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mettre à jour les filtres
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Appliquer les filtres
  const applyFilters = () => {
    fetchFiles();
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      banqueDestinataire: '',
      deposantRole: '',
      status: '',
      product: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Charger les données au montage du composant
  useEffect(() => {
    fetchFiles();
    if (showDeposantInfo) {
      fetchBanques(); // Charger les banques seulement pour admin/nsia_vie
    }
    
    // Charger automatiquement les produits de la banque de l'utilisateur 'user'
    if (currentUser?.role === 'user' && currentUser?.banque) {
      loadProductsForBanque(currentUser.banque);
    }
  }, [pagination.currentPage, filters, currentUser?.role, currentUser?.banque]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary-blue-lighter text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                placeholder="Nom de fichier ou description..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Banque destinataire - seulement pour admin/nsia_vie */}
          {showDeposantInfo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banque destinataire
              </label>
              <select
                value={filters.banqueDestinataire}
                onChange={(e) => handleBanqueChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les banques</option>
                {banques.map((banque, index) => (
                  <option key={index} value={banque.name}>
                    {banque.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rôle du déposant */}
          {showDeposantInfo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle du déposant
              </label>
              <select
                value={filters.deposantRole}
                onChange={(e) => updateFilters({ deposantRole: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les rôles</option>
                <option value="admin">Administrateur</option>
                <option value="nsia_vie">NSIA Vie</option>
              </select>
            </div>
          )}

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="sent">Envoyé</option>
              <option value="downloaded">Téléchargé</option>
            </select>
          </div>

          {/* Produit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produit
            </label>
            <select
              value={filters.product}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loadingProducts}
            >
              <option value="">Tous les produits</option>
              <option value="null">Sans produit (Fichiers anciens)</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.product_name} ({product.code_produit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex space-x-2">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-primary-blue-lighter text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Appliquer les filtres
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Liste des fichiers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des fichiers...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun fichier trouvé</p>
          </div>
        ) : (
          <>
            {/* En-tête du tableau */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {pagination.totalItems} fichier(s) trouvé(s)
                </h3>
                <div className="text-sm text-gray-500">
                  Page {pagination.currentPage} sur {pagination.totalPages}
                </div>
              </div>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fichier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    {showDeposantInfo && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Déposant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rôle
                        </th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Banque destinataire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléchargements
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'envoi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getFileIcon(file.fileType)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {file.originalName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(file.fileSize)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{file.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        {file.productName ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{file.productName}</div>
                            <div className="text-xs text-gray-500 font-mono">{file.productCode}</div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-sm text-gray-400 italic">Aucun produit</span>
                            <div className="text-xs text-gray-300 mt-1">(Fichier ancien)</div>
                          </div>
                        )}
                      </td>
                      {showDeposantInfo && (
                        <>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {file.deposantNom}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {file.deposantEmail}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              file.deposantRole === 'admin' 
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {file.deposantRole === 'admin' ? 'Administrateur' : 'NSIA Vie'}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{file.banqueDestinataire}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(file.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{file.downloadCount}</div>
                        {file.lastDownloadAt && (
                          <div className="text-xs text-gray-500">
                            {formatDate(file.lastDownloadAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDate(file.sentAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => downloadFile(file.id, file.originalName)}
                          className="flex items-center px-3 py-2 bg-primary-blue-lighter text-white rounded-lg hover:bg-primary-blue-lighter transition-colors text-sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Télécharger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Affichage de {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} à{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} sur{' '}
                    {pagination.totalItems} résultats
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                      disabled={pagination.currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FileSendList;
