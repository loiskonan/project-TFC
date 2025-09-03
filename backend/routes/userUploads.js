const express = require('express');
const router = express.Router();
const UserUploadController = require('../controllers/userUploadController');
const { authenticateToken } = require('../middleware/auth');

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// Upload d'un fichier par un utilisateur (rôle 'user' uniquement)
router.post('/upload', UserUploadController.uploadFile);

// Upload de plusieurs fichiers avec transaction (rôle 'user' uniquement)
router.post('/upload-multiple', UserUploadController.uploadMultipleFiles);

// Récupérer les dépôts de l'utilisateur connecté (rôle 'user' uniquement)
router.get('/my-deposits', UserUploadController.getUserDeposits);

// Récupérer tous les dépôts (admin et nsia_vie uniquement)
router.get('/all-deposits', (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'nsia_vie') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits insuffisants.'
    });
  }
  next();
}, UserUploadController.getAllDeposits);

// Obtenir les statistiques des dépôts
router.get('/stats', UserUploadController.getDepositStats);

// Récupérer la liste des banques pour les filtres
router.get('/banques', UserUploadController.getBanques);

module.exports = router;
