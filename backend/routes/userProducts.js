const express = require('express');
const router = express.Router();
const BanqueProductController = require('../controllers/banqueProductController');
const { authenticateToken } = require('../middleware/auth');

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Route pour récupérer les produits par nom de banque (pour les utilisateurs)
router.get('/banques/:banqueName/products', BanqueProductController.getProductsByBanqueName);

module.exports = router;
