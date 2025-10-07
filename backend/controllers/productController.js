const Product = require('../models/Product');

class ProductController {
  static async getAllProducts(req, res, next) {
    try {
      const filters = {
        category: req.query.category,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search
      };

      const products = await Product.findAll(filters);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req, res, next) {
    try {
      const { name, description, price, category, stock } = req.body;

      // Validation des données
      if (!name || !description || price === undefined || !category || stock === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      if (price < 0 || stock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Le prix et le stock doivent être positifs'
        });
      }

      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category.trim(),
        stock: parseInt(stock)
      };

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Produit créé avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, price, category, stock, isActive } = req.body;

      // Vérifier si le produit existe
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      // Préparer les données à mettre à jour
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (price !== undefined) {
        if (price < 0) {
          return res.status(400).json({
            success: false,
            message: 'Le prix doit être positif'
          });
        }
        updateData.price = parseFloat(price);
      }
      if (category !== undefined) updateData.category = category.trim();
      if (stock !== undefined) {
        if (stock < 0) {
          return res.status(400).json({
            success: false,
            message: 'Le stock doit être positif'
          });
        }
        updateData.stock = parseInt(stock);
      }
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      const product = await Product.update(id, updateData);

      res.json({
        success: true,
        data: product,
        message: 'Produit mis à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier si le produit existe
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      const deleted = await Product.delete(id);

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
      const categories = await Product.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await Product.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;

