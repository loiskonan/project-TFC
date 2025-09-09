const express = require('express');
const router = express.Router();
const UserUploadController = require('../controllers/userUploadController');
const { authenticateToken } = require('../middleware/auth');
const { validateFileUpload, validateFileUploadFormData } = require('../middleware/validation');

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// Upload d'un fichier par un utilisateur (rôle 'user' uniquement)
router.post('/upload', validateFileUploadFormData, UserUploadController.uploadFile);

// Upload de plusieurs fichiers avec transaction (rôle 'user' uniquement)
router.post('/upload-multiple', validateFileUploadFormData, UserUploadController.uploadMultipleFiles);

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

// Statistiques pour admin/nsia_vie (réceptions de toutes les banques)
router.get('/stats-receptions', (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'nsia_vie') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits insuffisants.'
    });
  }
  next();
}, (req, res) => UserUploadController.getStatsReceptions(req, res));

// Statistiques pour utilisateurs normaux (leurs envois)
router.get('/stats-user', (req, res) => UserUploadController.getStatsUser(req, res));

// Statistiques complètes pour admin/nsia_vie (réceptions de toutes les banques sans filtre de période)
router.get('/stats-complete', (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'nsia_vie') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits insuffisants.'
    });
  }
  next();
}, UserUploadController.getStatsReceptionsComplete);

// Statistiques complètes pour utilisateurs normaux (leurs envois sans filtre de période)
router.get('/stats-user-complete', UserUploadController.getStatsUserComplete);

// Récupérer la liste des banques pour les filtres
router.get('/banques', UserUploadController.getBanques);

module.exports = router;
