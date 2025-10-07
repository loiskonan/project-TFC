const express = require('express');
const router = express.Router();
const BanqueProductController = require('../controllers/banqueProductController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Middleware de vérification admin pour toutes les routes
router.use(requireAdmin);

// Routes pour les produits des banques
router.get('/banques', BanqueProductController.getAllBanquesWithProducts);
router.get('/banques/:banqueId/products', BanqueProductController.getProductsByBanque);
router.get('/banques/:banqueId/stats', BanqueProductController.getBanqueStats);
router.post('/banques/:banqueId/products', BanqueProductController.createProduct);
router.put('/products/:id', BanqueProductController.updateProduct);
router.delete('/products/:id', BanqueProductController.deleteProduct);
router.get('/categories', BanqueProductController.getCategories);

module.exports = router;

