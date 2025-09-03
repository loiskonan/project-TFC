const express = require('express');
const router = express.Router();
const { FileController } = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');

// Routes protégées par authentification
router.use(authenticateToken);

// Upload d'un fichier
router.post('/upload', FileController.uploadFile);

// Récupérer tous les fichiers (admin seulement)
router.get('/all', (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'nsia_vie') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits insuffisants.'
    });
  }
  next();
}, FileController.getAllFiles);

// Récupérer les fichiers de l'utilisateur connecté
router.get('/my-files', FileController.getUserFiles);

// Télécharger un fichier
router.get('/download/:id', FileController.downloadFile);

// Supprimer un fichier
router.delete('/:id', FileController.deleteFile);

// Récupérer les statistiques des fichiers
router.get('/stats', FileController.getFileStats);

module.exports = router;
