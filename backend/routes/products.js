const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Middleware de vérification admin pour toutes les routes
router.use(requireAdmin);

// Routes pour les produits
router.get('/', ProductController.getAllProducts);
router.get('/categories', ProductController.getCategories);
router.get('/stats', ProductController.getStats);
router.get('/:id', ProductController.getProductById);
router.post('/', ProductController.createProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

module.exports = router;

