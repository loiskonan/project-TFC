import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  RefreshCw,
  FileText,
  Image,
  FileVideo,
  FileAudio,
  Database,
  Archive,
  FileSpreadsheet,
  FileCode,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useUserFiles, UserFile } from '../../hooks/useUserFiles';
import { useAuth } from '../../contexts/AuthContext';
import { banqueProductService } from '../../services/productService';
import { BanqueProduct } from '../../types/product';

const FileList: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    files, 
    pagination, 
    isLoading, 
    error, 
    filters,
    banques,
    updateFilters,
    applyFilters,
    downloadFile, 
    refreshFiles 
  } = useUserFiles();
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<BanqueProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    refreshFiles(page);
  };

  const handleRefresh = () => {
    refreshFiles(currentPage);
  };

  const handleSearchChange = (value: string) => {
    updateFilters({ searchTerm: value });
  };

  const handleFilterTypeChange = (value: string) => {
    updateFilters({ fileType: value });
  };

  const handleBanqueChange = (value: string) => {
    updateFilters({ banque: value, product: 'all' });
    // Charger les produits de la banque sélectionnée
    if (value && value !== 'all') {
      loadProductsForBanque(value);
    } else {
      setProducts([]);
    }
  };

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

  const handleProductChange = (value: string) => {
    updateFilters({ product: value });
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Retourner à la première page
    applyFilters();
  };

  // Charger automatiquement les produits de la banque de l'utilisateur 'user'
  useEffect(() => {
    if (currentUser?.role === 'user' && currentUser?.banque) {
      loadProductsForBanque(currentUser.banque);
    }
  }, [currentUser?.role, currentUser?.banque]);

  // Les fichiers sont déjà filtrés côté serveur
  const filteredFiles = files;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getFileIcon = (type: string) => {
    // Images
    if (type.includes('image')) {
      return <Image className="h-6 w-6 text-blue-500" />;
    }
    
    // PDF
    if (type.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    
    // Word documents
    if (type.includes('word') || type.includes('document')) {
      return <FileText className="h-6 w-6 text-blue-600" />;
    }
    
    // Excel/Spreadsheets
    if (type.includes('excel') || type.includes('spreadsheet') || type.includes('sheet')) {
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
    }
    
    // Videos
    if (type.includes('video')) {
      return <FileVideo className="h-6 w-6 text-purple-500" />;
    }
    
    // Audio
    if (type.includes('audio')) {
      return <FileAudio className="h-6 w-6 text-orange-500" />;
    }
    
    // SQL/Database
    if (type.includes('sql') || type.includes('database')) {
      return <Database className="h-6 w-6 text-indigo-500" />;
    }
    
    // Archives
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('compressed')) {
      return <Archive className="h-6 w-6 text-yellow-600" />;
    }
    
    // Code files
    if (type.includes('javascript') || type.includes('python') || type.includes('java') || 
        type.includes('php') || type.includes('html') || type.includes('css') || 
        type.includes('xml') || type.includes('json')) {
      return <FileCode className="h-6 w-6 text-gray-600" />;
    }
    
    // Text files
    if (type.includes('text') || type.includes('plain')) {
      return <FileText className="h-6 w-6 text-gray-500" />;
    }
    
    // Default
    return <FileText className="h-6 w-6 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentUser?.role === 'user' 
                ? (
                  <>
                    Fichiers déposés par tous les agents - <span style={{ color: 'rgb(215, 153, 14)' }}>{currentUser.banque || 'Banque non assignée'}</span>
                  </>
                )
                : (
                  <>
                    Fichiers reçus
                    {(currentUser?.role === 'admin' || currentUser?.role === 'nsia_vie') && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        (Toutes les banques)
                      </span>
                    )}
                  </>
                )
              }
            </h3>
                          <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher un fichier ou une description..."
                value={filters.searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={filters.product}
                onChange={(e) => handleProductChange(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loadingProducts}
              >
                <option value="all">Tous les produits</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} ({product.code_produit})
                  </option>
                ))}
              </select>
            </div>

                          {/* Filtre par banque pour les admins/nsia_vie */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'nsia_vie') && (
                <div className="relative">
                  <select
                    value={filters.banque}
                    onChange={(e) => handleBanqueChange(e.target.value)}
                    className="pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Toutes les banques</option>
                    {banques.map((banque, index) => (
                      <option key={index} value={banque}>
                        {banque}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            <button
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="px-4 py-2 bg-primary-blue-lighter text-white rounded-lg "
            >
              Appliquer
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">Chargement des fichiers...</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Fichier</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Produit</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Déposant</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Taille</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Uploadé le</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Téléchargements</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.fileType)}
                      <div>
                        <p className="font-medium text-gray-900">{file.originalName}</p>
                        <p className="text-sm text-gray-500">{file.fileType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-700 truncate" title={file.description}>
                        {file.description}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {file.productName ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.productName}</p>
                        <p className="text-xs text-gray-500 font-mono">{file.productCode}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Non spécifié</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.deposantNom}</p>
                      <p className="text-xs text-gray-500">{file.deposantBanque}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-700">{formatFileSize(file.fileSize)}</td>
                  <td className="py-4 px-4 text-gray-700">{formatDate(file.uploadedAt)}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-blue-lighter text-white">
                      {file.downloadCount} téléchargements
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => downloadFile(file.id)}
                        className="p-2 text-primary-blue hover:text-primary-blue hover:bg-primary-blue-lighter rounded-lg transition-colors"
                        title="Télécharger"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun fichier trouvé</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} à {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} sur {pagination.totalItems} fichiers
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-sm text-gray-700">
                Page {pagination.currentPage} sur {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;