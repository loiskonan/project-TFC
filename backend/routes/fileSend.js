const express = require('express');
const router = express.Router();
const fileSendController = require('../controllers/fileSendController');
const { authenticateToken, requireAdminOrNsiaVie } = require('../middleware/auth');
const { validateFileSend, validateFileUploadFormData } = require('../middleware/validation');

// Routes pour l'upload de fichiers envoyés (admin/nsia_vie seulement)
// POST /api/file-send/upload-single - Upload d'un seul fichier
router.post('/upload-single', authenticateToken, requireAdminOrNsiaVie, validateFileUploadFormData, fileSendController.uploadSingle);

// POST /api/file-send/upload-multiple - Upload de plusieurs fichiers
router.post('/upload-multiple', authenticateToken, requireAdminOrNsiaVie, validateFileUploadFormData, fileSendController.uploadMultiple);

// GET /api/file-send/my-sent-files - Récupérer les fichiers envoyés par l'utilisateur connecté (admin/nsia_vie seulement)
router.get('/my-sent-files', authenticateToken, requireAdminOrNsiaVie, fileSendController.getMySentFiles);

// GET /api/file-send/all-sent-files - Récupérer tous les fichiers envoyés (admin/nsia_vie seulement)
router.get('/all-sent-files', authenticateToken, requireAdminOrNsiaVie, fileSendController.getAllSentFiles);

// GET /api/file-send/received-files - Récupérer les fichiers reçus par la banque de l'utilisateur (tous les utilisateurs)
router.get('/received-files', authenticateToken, fileSendController.getReceivedFiles);

// GET /api/file-send/stats - Récupérer les statistiques des fichiers envoyés (admin/nsia_vie seulement)
router.get('/stats', authenticateToken, requireAdminOrNsiaVie, fileSendController.getStats);

// GET /api/file-send/stats-user - Récupérer les statistiques pour un utilisateur (sa banque uniquement)
router.get('/stats-user', authenticateToken, fileSendController.getStatsUser);

// GET /api/file-send/download/:id - Télécharger un fichier envoyé (tous les utilisateurs)
router.get('/download/:id', authenticateToken, fileSendController.downloadFile);

// DELETE /api/file-send/:id - Supprimer un fichier envoyé (admin/nsia_vie seulement)
router.delete('/:id', authenticateToken, requireAdminOrNsiaVie, fileSendController.deleteFile);

// Statistiques complètes pour admin/nsia_vie (toutes les données sans filtre de période)
router.get('/stats-complete', authenticateToken, requireAdminOrNsiaVie, fileSendController.getStatsComplete.bind(fileSendController));

// Statistiques complètes pour utilisateurs normaux (toutes leurs données sans filtre de période)
router.get('/stats-user-complete', authenticateToken, fileSendController.getStatsUserComplete.bind(fileSendController));

module.exports = router;
