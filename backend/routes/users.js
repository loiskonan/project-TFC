const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { requireAuthAndAdmin } = require('../middleware/auth');
const { validateCreateUser, validateUpdateProfile } = require('../middleware/validation');

// Toutes les routes nécessitent une authentification et des droits d'administrateur
router.use(requireAuthAndAdmin);

// Récupérer tous les utilisateurs
router.get('/', UserController.getAllUsers);

// Récupérer les statistiques des utilisateurs
router.get('/stats', UserController.getUserStats);

// Récupérer un utilisateur par ID
router.get('/:id', UserController.getUserById);

// Créer un nouvel utilisateur
router.post('/', validateCreateUser, UserController.createUser);

// Mettre à jour un utilisateur
router.put('/:id', validateUpdateProfile, UserController.updateUser);

// Supprimer un utilisateur
router.delete('/:id', UserController.deleteUser);

// Changer le rôle d'un utilisateur
router.patch('/:id/role', UserController.changeUserRole);

// Activer/Désactiver un utilisateur
router.patch('/:id/status', UserController.toggleUserStatus);

module.exports = router;
