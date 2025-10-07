const BanqueProduct = require('../models/BanqueProduct');
const Banque = require('../models/Banque');

class BanqueProductController {
  static async getAllBanquesWithProducts(req, res, next) {
    try {
      const banques = await BanqueProduct.getBanquesWithProducts();
      
      res.json({
        success: true,
        data: banques
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductsByBanque(req, res, next) {
    try {
      const { banqueId } = req.params;
      const products = await BanqueProduct.getProductsByBanque(banqueId);

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req, res, next) {
    try {
      const { banqueId } = req.params;
      const { product_name, code_produit } = req.body;

      // Vérifier que la banque existe
      const banque = await Banque.findById(banqueId);
      if (!banque) {
        return res.status(404).json({
          success: false,
          message: 'Banque non trouvée'
        });
      }

      // Validation des données
      if (!product_name || !code_produit) {
        return res.status(400).json({
          success: false,
          message: 'Le nom du produit et le code produit sont requis'
        });
      }

      const productData = {
        product_name: product_name.trim(),
        code_produit: code_produit.trim().toUpperCase()
      };

      const product = await BanqueProduct.createProduct(banqueId, productData);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Produit ajouté à la banque avec succès'
      });
    } catch (error) {
      // Gérer l'erreur de contrainte unique
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Ce code produit existe déjà pour cette banque'
        });
      }
      next(error);
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { product_name, code_produit, isActive } = req.body;

      // Vérifier si le produit existe
      const existingProduct = await BanqueProduct.getProductById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      // Préparer les données à mettre à jour
      const updateData = {};
      if (product_name !== undefined) updateData.product_name = product_name.trim();
      if (code_produit !== undefined) updateData.code_produit = code_produit.trim().toUpperCase();
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      const product = await BanqueProduct.updateProduct(id, updateData);

      res.json({
        success: true,
        data: product,
        message: 'Produit mis à jour avec succès'
      });
    } catch (error) {
      // Gérer l'erreur de contrainte unique
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Ce code produit existe déjà pour cette banque'
        });
      }
      next(error);
    }
  }

  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier si le produit existe
      const existingProduct = await BanqueProduct.getProductById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      const deleted = await BanqueProduct.deleteProduct(id);

      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la suppression du produit'
        });
      }

      res.json({
        success: true,
        message: 'Produit supprimé avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req, res, next) {
    try {
      const categories = await BanqueProduct.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBanqueStats(req, res, next) {
    try {
      const { banqueId } = req.params;
      const stats = await BanqueProduct.getBanqueStats(banqueId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Nouvelle méthode pour récupérer les produits par nom de banque (pour les utilisateurs)
  static async getProductsByBanqueName(req, res, next) {
    try {
      const { banqueName } = req.params;
      
      // Trouver la banque par nom
      const banque = await Banque.findByName(banqueName);
      if (!banque) {
        return res.status(404).json({
          success: false,
          message: 'Banque non trouvée'
        });
      }

      // Récupérer les produits de cette banque
      const products = await BanqueProduct.getProductsByBanque(banque.id);

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BanqueProductController;
