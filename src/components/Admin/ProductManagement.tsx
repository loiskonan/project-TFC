import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Banque, BanqueProduct, CreateBanqueProductData, UpdateBanqueProductData } from '../../types/product';
import { banqueProductService } from '../../services/productService';
import { Plus, Edit, Trash2, Building2, Package, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';

const ProductManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [banques, setBanques] = useState<Banque[]>([]);
  const [selectedBanque, setSelectedBanque] = useState<Banque | null>(null);
  const [products, setProducts] = useState<BanqueProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BanqueProduct | null>(null);
  const [expandedBanques, setExpandedBanques] = useState<Set<number>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState<Set<number>>(new Set());

  // Vérifier si l'utilisateur est admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h2>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  const fetchBanques = async () => {
    try {
      setLoading(true);
      const [banquesData, categoriesData] = await Promise.all([
        banqueProductService.getAllBanquesWithProducts(),
        banqueProductService.getCategories()
      ]);
      
      setBanques(banquesData);
      setCategories(categoriesData);
      setError('');
    } catch (err: any) {
      setError('Erreur lors du chargement des banques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsForBanque = async (banqueId: number) => {
    try {
      setLoadingProducts(prev => new Set(prev).add(banqueId));
      const productsData = await banqueProductService.getProductsByBanque(banqueId);
      setProducts(productsData);
      setError('');
    } catch (err: any) {
      setError('Erreur lors du chargement des produits');
      console.error(err);
    } finally {
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(banqueId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchBanques();
  }, []);

  const toggleBanqueExpansion = async (banque: Banque) => {
    const banqueId = banque.banque_id;
    const isExpanded = expandedBanques.has(banqueId);
    
    if (isExpanded) {
      setExpandedBanques(prev => {
        const newSet = new Set(prev);
        newSet.delete(banqueId);
        return newSet;
      });
    } else {
      setExpandedBanques(prev => new Set(prev).add(banqueId));
      setSelectedBanque(banque);
      await fetchProductsForBanque(banqueId);
    }
  };

  const handleCreateProduct = async (productData: CreateBanqueProductData | UpdateBanqueProductData) => {
    if (!selectedBanque) return;
    
    try {
      await banqueProductService.createProduct(selectedBanque.banque_id, productData as CreateBanqueProductData);
      setShowCreateModal(false);
      await fetchProductsForBanque(selectedBanque.banque_id);
      await fetchBanques(); // Rafraîchir les stats des banques
    } catch (err: any) {
      setError('Erreur lors de la création du produit');
    }
  };

  const handleUpdateProduct = async (id: number, productData: UpdateBanqueProductData) => {
    try {
      await banqueProductService.updateProduct(id, productData);
      setShowEditModal(false);
      setEditingProduct(null);
      if (selectedBanque) {
        await fetchProductsForBanque(selectedBanque.banque_id);
        await fetchBanques(); // Rafraîchir les stats des banques
      }
    } catch (err: any) {
      setError('Erreur lors de la mise à jour du produit');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await banqueProductService.deleteProduct(id);
        if (selectedBanque) {
          await fetchProductsForBanque(selectedBanque.banque_id);
          await fetchBanques(); // Rafraîchir les stats des banques
        }
      } catch (err: any) {
        setError('Erreur lors de la suppression du produit');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des banques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits par Banque</h1>
              <p className="text-gray-600">Gérez les produits de chaque banque</p>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Liste des banques */}
        <div className="space-y-4">
          {banques.map((banque) => {
            const isExpanded = expandedBanques.has(banque.banque_id);
            const isLoading = loadingProducts.has(banque.banque_id);
            
            return (
              <div key={banque.banque_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* En-tête de la banque */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleBanqueExpansion(banque)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building2 className="h-6 w-6 text-blue-900 mr-3" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{banque.banque_nom}</h3>
                        <p className="text-gray-600">Code: {banque.banque_code}</p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <span>🏦 Banque {banque.banque_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Produits</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {banque.total_products} ({banque.active_products} actifs)
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBanque(banque);
                          setShowCreateModal(true);
                        }}
                        className="bg-blue-900 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </button>
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      ) : (
                        isExpanded ? <ChevronDown className="h-6 w-6 text-gray-400" /> : <ChevronRight className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Liste des produits (si la banque est étendue) */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {products.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun produit trouvé pour cette banque</p>
                        <button
                          onClick={() => {
                            setSelectedBanque(banque);
                            setShowCreateModal(true);
                          }}
                          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Ajouter le premier produit
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Produit
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Code Produit
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Statut
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {products.map((product) => (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {product.code_produit}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    product.is_active 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {product.is_active ? 'Actif' : 'Inactif'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => {
                                        setEditingProduct(product);
                                        setShowEditModal(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      <Edit className="h-5 w-5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modales */}
        {showCreateModal && selectedBanque && (
          <ProductModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateProduct}
            categories={categories}
            title={`Ajouter un produit à ${selectedBanque.banque_nom}`}
          />
        )}

        {showEditModal && editingProduct && (
          <ProductModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingProduct(null);
            }}
            onSubmit={(data) => handleUpdateProduct(editingProduct.id, data)}
            categories={categories}
            title="Modifier le produit"
            initialData={editingProduct}
          />
        )}
      </div>
    </div>
  );
};

// Composant modal pour créer/modifier un produit
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBanqueProductData | UpdateBanqueProductData) => void;
  categories: string[];
  title: string;
  initialData?: BanqueProduct;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  title,
  initialData
}) => {
  const [formData, setFormData] = useState({
    product_name: initialData?.product_name || '',
    code_produit: initialData?.code_produit || '',
    is_active: initialData?.is_active ?? true
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        product_name: initialData.product_name,
        code_produit: initialData.code_produit,
        is_active: initialData.is_active
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du produit
            </label>
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code Produit
            </label>
            <input
              type="text"
              value={formData.code_produit}
              onChange={(e) => setFormData({ ...formData, code_produit: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="Ex: CC001, CR002, PI003"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Le code sera automatiquement converti en majuscules
            </p>
          </div>

          {initialData && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Produit actif</span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {initialData ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductManagement;