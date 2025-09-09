const express = require('express');
const router = express.Router();
const BanqueController = require('../controllers/banqueController');
const { requireAuthAndAdmin, authenticateToken } = require('../middleware/auth');
const { validateCreateBanque } = require('../middleware/validation');

// Récupérer les banques actives (pour les formulaires) - accessible à tous les utilisateurs authentifiés
router.get('/active', authenticateToken, BanqueController.getActiveBanques);

// Récupérer les mots de passe par banque (accessible aux admins et NSIA Vie)
router.get('/passwords', authenticateToken, BanqueController.getBankPasswordsPaginated);

// Toutes les autres routes nécessitent une authentification et des droits d'administrateur
router.use(requireAuthAndAdmin);

// Récupérer toutes les banques
router.get('/', BanqueController.getAllBanques);

// Récupérer une banque par ID
router.get('/:id', BanqueController.getBanqueById);

// Créer une nouvelle banque
router.post('/', validateCreateBanque, BanqueController.createBanque);

// Mettre à jour une banque
router.put('/:id', BanqueController.updateBanque);

// Supprimer une banque
router.delete('/:id', BanqueController.deleteBanque);

// Activer/Désactiver une banque
router.patch('/:id/status', BanqueController.toggleBanqueStatus);

module.exports = router;

