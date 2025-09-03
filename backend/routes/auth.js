const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Route de connexion
router.post('/login', AuthController.login);

// Route de récupération de mot de passe
router.post('/forgot-password', AuthController.forgotPassword);

// Route de changement de mot de passe (nécessite authentification)
router.post('/change-password', authenticateToken, AuthController.changePassword);

// Route de vérification de token (nécessite authentification)
router.get('/verify', authenticateToken, AuthController.verifyToken);

module.exports = router;
