const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const bcrypt = require('bcrypt');

class UserController {
  // Récupérer tous les utilisateurs avec pagination et filtres
  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Récupérer les paramètres de filtrage
      const search = req.query.search || '';
      const banque = req.query.banque || '';
      const role = req.query.role || '';
      const status = req.query.status || '';

      console.log('Filtres reçus:', { search, banque, role, status });

      // Récupérer les utilisateurs avec pagination et filtres
      const users = await User.findAllPaginatedWithFilters(limit, offset, { search, banque, role, status });
      
      // Récupérer le nombre total d'utilisateurs avec filtres
      const totalUsers = await User.countAllWithFilters({ search, banque, role, status });
      
      // Calculer les informations de pagination
      const totalPages = Math.ceil(totalUsers / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        users: users,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalUsers: totalUsers,
          usersPerPage: limit,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer les statistiques des utilisateurs
  static async getUserStats(req, res) {
    try {
      const totalUsers = await User.countAll();
      const activeUsers = await User.countActiveUsers();

      res.json({
        success: true,
        stats: {
          totalUsers: totalUsers,
          activeUsers: activeUsers
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer un utilisateur par ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        user: user
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Créer un nouvel utilisateur
  static async createUser(req, res) {
    try {
      const { name, email, role, banque } = req.body;

      // Validation des données
      if (!name || !email || !role) {
        return res.status(400).json({
          success: false,
          message: 'Nom, email et rôle sont requis'
        });
      }

      // Validation de la banque selon le rôle
      if (role === 'user' && !banque) {
        return res.status(400).json({
          success: false,
          message: 'La banque est requise pour les utilisateurs'
        });
      }

      // Vérifier si l'email existe déjà
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }

      // Récupérer le mot de passe par défaut hashé depuis la configuration
      const hashedDefaultPassword = await SystemConfig.getConfig('default_password');
      
      // Si aucun mot de passe par défaut n'est configuré, utiliser le mot de passe par défaut et le hasher
      const hashedPassword = hashedDefaultPassword ;

      const userId = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        banque: role === 'user' ? banque : null
      });

      const newUser = await User.findById(userId);

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès. Mot de passe par défaut configuré dans les paramètres système.',
        user: newUser
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Mettre à jour un utilisateur
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role, banque, isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier si l'email existe déjà (sauf pour l'utilisateur actuel)
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Un utilisateur avec cet email existe déjà'
          });
        }
      }

      await User.update(id, {
        name: name || user.name,
        email: email || user.email,
        role: role || user.role,
        banque: banque !== undefined ? banque : user.banque,
        isActive: isActive !== undefined ? isActive : user.isActive
      });

      const updatedUser = await User.findById(id);

      res.json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        user: updatedUser
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Supprimer un utilisateur
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      await User.delete(id);

      res.json({
        success: true,
        message: 'Utilisateur supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Changer le rôle d'un utilisateur
  static async changeUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['admin', 'user', 'nsia_vie'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Rôle invalide'
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      await User.update(id, { role });

      const updatedUser = await User.findById(id);

      res.json({
        success: true,
        message: 'Rôle mis à jour avec succès',
        user: updatedUser
      });
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Activer/Désactiver un utilisateur
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      await User.update(id, { isActive });

      const updatedUser = await User.findById(id);

      res.json({
        success: true,
        message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = UserController;
