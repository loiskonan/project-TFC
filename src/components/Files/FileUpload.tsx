import React, { useCallback, useState, useEffect } from 'react';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { banqueProductService } from '../../services/productService';
import { BanqueProduct } from '../../types/product';
import axios from 'axios';

// Liste des mois
const MONTHS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' }
];

const FileUpload: React.FC = () => {
  const { currentUser } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'uploading' | 'success' | 'error'}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États pour la sélection de banque (admin et nsia_vie)
  const [banques, setBanques] = useState<Array<{id: number, nom: string}>>([]);
  const [selectedBanque, setSelectedBanque] = useState<number | null>(null);
  const [loadingBanques, setLoadingBanques] = useState(false);

  // États pour la gestion des produits
  const [products, setProducts] = useState<BanqueProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [fileProducts, setFileProducts] = useState<{[key: string]: number}>({});

  // Récupérer la liste des banques pour les admins et nsia_vie
  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'nsia_vie') {
      fetchBanques();
    }
  }, [currentUser?.role]);

  // Récupérer les produits de la banque de l'utilisateur connecté
  useEffect(() => {
    if (currentUser?.banque) {
      fetchProductsForUserBanque();
    }
  }, [currentUser?.banque]);

  const fetchBanques = async () => {
    setLoadingBanques(true);
    try {
      const token = localStorage.getItem('dataflow_token');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}:5000/api/banques/active`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setBanques(response.data.banques);
      }
    } catch (error) {
    } finally {
      setLoadingBanques(false);
    }
  };

  const fetchProductsForUserBanque = async () => {
    if (!currentUser?.banque) return;
    
    setLoadingProducts(true);
    try {
      const productsData = await banqueProductService.getProductsByBanqueName(currentUser.banque);
      setProducts(productsData);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleBanqueSelect = async (banqueId: number) => {
    setSelectedBanque(banqueId);
    // Réinitialiser les autres états quand on change de banque
    setUploadQueue([]);
    setUploadStatus({});
    setFileProducts({});
    setError('');
    setSuccess('');
    
    // Récupérer les produits de la banque sélectionnée
    const banque = banques.find(b => b.id === banqueId);
    if (banque) {
      setLoadingProducts(true);
      try {
        const productsData = await banqueProductService.getProductsByBanqueName(banque.nom);
        setProducts(productsData);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  const handleProductSelect = (fileKey: string, productId: number) => {
    setFileProducts(prev => ({
      ...prev,
      [fileKey]: productId
    }));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setUploadQueue(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setUploadQueue(prev => [...prev, ...files]);
    }
  };

  const removeFromQueue = (index: number) => {
    setUploadQueue(prev => {
      const newQueue = prev.filter((_, i) => i !== index);
      // Nettoyer le statut du fichier supprimé
      const removedFile = prev[index];
      if (removedFile) {
        const fileKey = `${removedFile.name}-${removedFile.size}`;
        setUploadStatus(prevStatus => {
          const newStatus = { ...prevStatus };
          delete newStatus[fileKey];
          return newStatus;
        });
        // Nettoyer aussi la sélection de produit
        setFileProducts(prevProducts => {
          const newProducts = { ...prevProducts };
          delete newProducts[fileKey];
          return newProducts;
        });
      }
      return newQueue;
    });
  };

  const clearBatchDescription = () => {
    setSelectedMonth('');
    setSelectedYear(new Date().getFullYear().toString());
  };

  // Générer la description à partir du mois et de l'année
  const generateDescription = () => {
    if (!selectedMonth || !selectedYear) return '';
    const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label;
    return `${monthLabel} ${selectedYear}`;
  };

  const processUploads = async () => {
    setError('');
    setSuccess('');
    
    // Vérifier que le mois et l'année sont fournis
    if (!selectedMonth || !selectedYear) {
      setError('Le mois et l\'année sont obligatoires');
      return;
    }

    // Vérifier que tous les fichiers ont un produit sélectionné
    const missingProducts = uploadQueue.filter(file => {
      const fileKey = `${file.name}-${file.size}`;
      return !fileProducts[fileKey];
    });

    if (missingProducts.length > 0) {
      setError(`Veuillez sélectionner un produit pour tous les fichiers. Fichiers sans produit : ${missingProducts.map(f => f.name).join(', ')}`);
      return;
    }

    const description = generateDescription();

    setIsLoading(true);

    try {
      const token = localStorage.getItem('dataflow_token');
      const formData = new FormData();
      
      // Ajouter tous les fichiers avec leurs produits associés
      uploadQueue.forEach(file => {
        const fileKey = `${file.name}-${file.size}`;
        const productId = fileProducts[fileKey];
        formData.append('files', file);
      });
      
      // Ajouter les produits comme un JSON string
      const productsArray = uploadQueue.map(file => {
        const fileKey = `${file.name}-${file.size}`;
        return fileProducts[fileKey];
      });
      formData.append('file_products', JSON.stringify(productsArray));
      
      // Ajouter la description
      formData.append('description', description);

      let endpoint = '';
      
      // Utiliser la nouvelle API file-send pour admin/nsia_vie
      if (currentUser?.role === 'admin' || currentUser?.role === 'nsia_vie') {
        if (!selectedBanque) {
          setError('Veuillez sélectionner une banque');
          setIsLoading(false);
          return;
        }
        const banque = banques.find(b => b.id === selectedBanque);
        if (!banque) {
          setError('Banque sélectionnée introuvable');
          setIsLoading(false);
          return;
        }
        
        formData.append('banqueDestinataire', banque.nom);
        formData.append('banqueCode', banque.nom); // Utiliser le nom comme code pour l'instant
        
        endpoint = `${import.meta.env.VITE_BASE_URL}:5000/api/file-send/upload-multiple`;
      } else {
        // Pour les utilisateurs normaux, utiliser l'ancienne API
        endpoint = `${import.meta.env.VITE_BASE_URL}:5000/api/user-uploads/upload-multiple`;
      }

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Marquer tous les fichiers comme succès
        uploadQueue.forEach(file => {
          const fileKey = `${file.name}-${file.size}`;
          setUploadStatus(prev => ({ ...prev, [fileKey]: 'success' }));
        });

        setSuccess(response.data.message);
    
    // Nettoyer la queue après 2 secondes
    setTimeout(() => {
      setUploadQueue([]);
      setUploadStatus({});
          setFileProducts({});
          clearBatchDescription();
    }, 2000);
      }
    } catch (error: any) {
      
      if (error.response?.data?.errors) {
        // Erreurs détaillées pour certains fichiers
        const errorMessage = `Échec de l'upload:\n${error.response.data.errors.map((e: any) => `- ${e.fileName}: ${e.error}`).join('\n')}`;
        setError(errorMessage);
        
        // Marquer les fichiers en erreur
        if (error.response.data.failedFiles) {
          uploadQueue.forEach(file => {
            const fileKey = `${file.name}-${file.size}`;
            if (error.response.data.failedFiles.includes(file.name)) {
              setUploadStatus(prev => ({ ...prev, [fileKey]: 'error' }));
            }
          });
        }
      } else {
        // Erreur générale
        setError(error.response?.data?.message || 'Erreur lors de l\'upload');
        
        // Marquer tous les fichiers en erreur
        uploadQueue.forEach(file => {
          const fileKey = `${file.name}-${file.size}`;
          setUploadStatus(prev => ({ ...prev, [fileKey]: 'error' }));
        });
      }
    }

    setIsLoading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Si l'utilisateur n'est pas un "user", afficher "Dépôt" suivi du rôle
  if (currentUser?.role !== 'user') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-center font-bold text-3xl mb-4">
            <span style={{ color: 'rgb(16,16,92)' }}>Dépôt</span> <span style={{ color: 'rgb(215, 153, 14)' }}>
              {currentUser?.role === 'admin' ? 'Administrateur' : 
               currentUser?.role === 'nsia_vie' ? 'NSIA Vie' : 
               currentUser?.role}
            </span>
          </h1>
        </div>

        {/* Interface spéciale pour les admins et nsia_vie */}
        {(currentUser?.role === 'admin' || currentUser?.role === 'nsia_vie') && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélectionner une banque</h3>
            
            {loadingBanques ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Chargement des banques...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banques.map((banque) => (
                  <div
                    key={banque.id}
                    onClick={() => handleBanqueSelect(banque.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedBanque === banque.id
                        ? 'border-yellow-400 bg-yellow-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Building2 className={`h-6 w-6 ${
                        selectedBanque === banque.id ? 'text-yellow-600' : 'text-gray-500'
                      }`} />
                      <div>
                        <h4 className={`font-medium ${
                          selectedBanque === banque.id ? 'text-yellow-800' : 'text-gray-900'
                        }`}>
                          {banque.nom}
                        </h4>
                        <p className={`text-sm ${
                          selectedBanque === banque.id ? 'text-yellow-600' : 'text-gray-500'
                        }`}>
                          Cliquer pour sélectionner
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedBanque && (
              <>
                {/* Confirmation de sélection */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  
                  <p className="text-sm text-blue-700">
                    Vous pouvez maintenant déposer des fichiers pour cette banque.
                  </p>
                </div>

                {/* Titre avec nom de la banque */}
                <div className="mt-6 text-center">
                  <h1 className="font-bold text-3xl mb-4">
                    <span style={{ color: 'rgb(215, 153, 14)' }}>
                      {banques.find(b => b.id === selectedBanque)?.nom}
                    </span>
                  </h1>
                </div>

                {/* Zone d'upload */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload de fichiers</h3>
                  
                  <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                      dragActive
                        ? 'border-primary-blue bg-primary-blue-lighter'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className={`h-12 w-12 mx-auto mb-4 ${
                      dragActive ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Glissez-déposez vos fichiers ici
                    </p>
                    <p className="text-gray-500 mb-2">
                      ou cliquez pour sélectionner des fichiers
                    </p>
                    <p className="text-sm text-gray-400 mb-2">
                      Taille maximale par fichier : <span className="font-medium">50 MB</span>
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                      Types autorisés : PDF, Word, Excel, PowerPoint, Images, Archives, Médias
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload-admin"
                    />
                    <label
                      htmlFor="file-upload-admin"
                      className="inline-flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors cursor-pointer"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Sélectionner des fichiers
                    </label>
                  </div>
                </div>

                {/* Messages d'erreur et succès */}
                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                )}

                {/* Liste des fichiers en attente */}
                {uploadQueue.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">
                        Fichiers en attente ({uploadQueue.length})
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setUploadQueue([]);
                            setUploadStatus({});
                          }}
                          className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                          title="Effacer tous les fichiers"
                        >
                          Effacer tout
                        </button>
                        <button
                          onClick={processUploads}
                          disabled={isLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isLoading ? 'Upload en cours...' : 'Uploader tous'}
                        </button>
                      </div>
                    </div>

                    {/* Sélection du mois et de l'année */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-3">Description du lot *</h5>
                      <div className="flex items-end space-x-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            Mois
                          </label>
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Sélectionnez un mois</option>
                            {MONTHS.map((month) => (
                              <option key={month.value} value={month.value}>
                                {month.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            Année
                          </label>
                          <input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            placeholder="2024"
                            min="2000"
                            max="2100"
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={clearBatchDescription}
                            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                          >
                            Effacer
                          </button>
                        </div>
                      </div>
                      {selectedMonth && selectedYear && (
                        <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>Description générée :</strong> {generateDescription()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {uploadQueue.map((file, index) => {
                        const fileKey = `${file.name}-${file.size}`;
                        const status = uploadStatus[fileKey];
                        const selectedProductId = fileProducts[fileKey];
                        
                        return (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center">
                                  {status === 'uploading' && (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                  )}
                                  {status === 'success' && (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  )}
                                  {status === 'error' && (
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                  )}
                                  {!status && (
                                    <div className="h-5 w-5 rounded-full bg-gray-300"></div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{file.name}</p>
                                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => removeFromQueue(index)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Retirer le fichier"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            
                            {/* Sélection de produit pour ce fichier */}
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sélectionner un produit *
                              </label>
                              {loadingProducts ? (
                                <div className="flex items-center space-x-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                  <span className="text-sm text-gray-500">Chargement des produits...</span>
                                </div>
                              ) : (
                                <select
                                  value={selectedProductId || ''}
                                  onChange={(e) => handleProductSelect(fileKey, parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required
                                >
                                  <option value="">Choisir un produit</option>
                                  {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.product_name} ({product.code_produit})
                                    </option>
                                  ))}
                                </select>
                              )}
                              {selectedProductId && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✓ Produit sélectionné
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Interface d'upload pour les utilisateurs
  return (
    <div className="space-y-6">
      {/* Titre conditionnel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-center font-bold text-3xl mb-4">
          {currentUser?.banque ? (
            <>
              <span style={{ color: 'rgb(16,16,92)' }}>Dépôt</span> <span style={{ color: 'rgb(215, 153, 14)' }}>{currentUser.banque}</span>
            </>
          ) : (
            'Affichage non utilisateur'
          )}
        </h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload de fichiers</h3>
        
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
            dragActive
              ? 'border-primary-blue bg-primary-blue-lighter'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${
            dragActive ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Glissez-déposez vos fichiers ici
          </p>
          <p className="text-gray-500 mb-2">
            ou cliquez pour sélectionner des fichiers
          </p>
          <p className="text-sm text-gray-400 mb-2">
            Taille maximale par fichier : <span className="font-medium">50 MB</span>
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Types autorisés : PDF, Word, Excel, PowerPoint, Images, Archives, Médias
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4 mr-2" />
            Sélectionner des fichiers
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {uploadQueue.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              Fichiers en attente ({uploadQueue.length})
            </h4>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setUploadQueue([]);
                  setUploadStatus({});
                }}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                title="Effacer tous les fichiers"
              >
                Effacer tout
              </button>
            <button
              onClick={processUploads}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Upload en cours...' : 'Uploader tous'}
            </button>
            </div>
          </div>

          {/* Sélection du mois et de l'année */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-3">Description du lot *</h5>
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Mois
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez un mois</option>
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Année
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  placeholder="2024"
                  min="2000"
                  max="2100"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={clearBatchDescription}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Effacer
                </button>
              </div>
            </div>
            {selectedMonth && selectedYear && (
              <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Description générée :</strong> {generateDescription()}
                </p>
              </div>
            )}
            
          </div>
          
          <div className="space-y-3">
            {uploadQueue.map((file, index) => {
              const fileKey = `${file.name}-${file.size}`;
              const status = uploadStatus[fileKey];
              const selectedProductId = fileProducts[fileKey];
              
              return (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {status === 'uploading' && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      )}
                      {status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      {!status && (
                        <div className="h-5 w-5 rounded-full bg-gray-300"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                    <button
                      onClick={() => removeFromQueue(index)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Retirer le fichier"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Sélection de produit pour ce fichier */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélectionner un produit *
                    </label>
                    {loadingProducts ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-500">Chargement des produits...</span>
                      </div>
                    ) : (
                      <select
                        value={selectedProductId || ''}
                        onChange={(e) => handleProductSelect(fileKey, parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Choisir un produit</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.product_name} ({product.code_produit})
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedProductId && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Produit sélectionné
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;