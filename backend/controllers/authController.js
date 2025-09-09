const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

class AuthController {
  // Inscription utilisateur
  static async register(req, res) {
    try {
      const { email, password, name, role, banque } = req.body;

      // Validation des données
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, mot de passe et nom sont requis'
        });
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide'
        });
      }

      // Validation du mot de passe
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      // Vérification si l'email existe déjà
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }

      // Hashage du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Création de l'utilisateur
      const userData = {
        email,
        password: hashedPassword,
        name,
        role: role || 'user',
        banque: role === 'user' ? banque : null
      };

      const userId = await User.create(userData);

      // Récupération de l'utilisateur créé (sans le mot de passe)
      const newUser = await User.findById(userId);

      // Génération du token JWT
      const token = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          banque: newUser.banque
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          banque: newUser.banque,
          createdAt: newUser.created_at,
          lastLoginAt: newUser.last_login_at,
          isActive: newUser.isActive
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Connexion utilisateur
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation des données
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis'
        });
      }

      // Recherche de l'utilisateur
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérification du mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérification si l'utilisateur est actif
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Compte désactivé'
        });
      }

      // Mise à jour de la dernière connexion
      await User.updateLastLogin(user.id);

      // Génération du token JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          banque: user.banque
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Réponse avec les données utilisateur (sans le mot de passe)
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        banque: user.banque,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        isActive: user.isActive
      };

      res.json({
        success: true,
        message: 'Connexion réussie',
        token,
        user: userData
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupération de mot de passe
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // Validation de l'email
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email requis'
        });
      }

      // Recherche de l'utilisateur
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Aucun utilisateur trouvé avec cet email'
        });
      }

      // Vérification si l'utilisateur est actif
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Compte désactivé'
        });
      }

      // Ici vous pouvez ajouter la logique d'envoi d'email
      // Pour l'instant, on simule l'envoi
      
      res.json({
        success: true,
        message: 'Un email de récupération a été envoyé à votre adresse email'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Vérification du token JWT
  static async verifyToken(req, res) {
    try {
      // L'utilisateur est déjà vérifié par le middleware authenticateToken
      const user = req.user;

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          banque: user.banque,
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at,
          isActive: user.isActive
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Changer le mot de passe
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Validation des champs
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe actuel et le nouveau mot de passe sont requis'
        });
      }

      // Vérifier la longueur du nouveau mot de passe
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
        });
      }

      // Récupérer l'utilisateur avec son mot de passe
      const user = await User.findByIdWithPassword(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier que le mot de passe existe
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'Erreur: mot de passe utilisateur non trouvé'
        });
      }

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe actuel est incorrect'
        });
      }

      // Hasher le nouveau mot de passe
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe
      await User.update(userId, { password: hashedNewPassword });

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = AuthController;
