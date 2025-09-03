const express = require('express');
const router = express.Router();
const BanqueController = require('../controllers/banqueController');
const { requireAuthAndAdmin, authenticateToken } = require('../middleware/auth');

// Récupérer les banques actives (pour les formulaires) - accessible à tous les utilisateurs authentifiés
router.get('/active', authenticateToken, BanqueController.getActiveBanques);

// Toutes les autres routes nécessitent une authentification et des droits d'administrateur
router.use(requireAuthAndAdmin);

// Récupérer toutes les banques
router.get('/', BanqueController.getAllBanques);

// Récupérer une banque par ID
router.get('/:id', BanqueController.getBanqueById);

// Créer une nouvelle banque
router.post('/', BanqueController.createBanque);

// Mettre à jour une banque
router.put('/:id', BanqueController.updateBanque);

// Supprimer une banque
router.delete('/:id', BanqueController.deleteBanque);

// Activer/Désactiver une banque
router.patch('/:id/status', BanqueController.toggleBanqueStatus);

module.exports = router;

