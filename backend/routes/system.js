const express = require('express');
const router = express.Router();
const SystemController = require('../controllers/systemController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Routes protégées par authentification
router.use(authenticateToken);

// Récupérer le mot de passe par défaut (admin seulement)
router.get('/default-password', requireAdmin, SystemController.getDefaultPassword);

// Modifier le mot de passe par défaut (admin seulement)
router.put('/default-password', requireAdmin, SystemController.updateDefaultPassword);

// Récupérer toute la configuration (admin seulement)
router.get('/config', requireAdmin, SystemController.getAllConfig);

module.exports = router;
