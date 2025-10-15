const Banque = require('../models/Banque');
const User = require('../models/User');
const DynamicValidationService = require('../services/DynamicValidationService');
const { generatePasswordsForAllBanks } = require('../utils/passwordGenerator');

class BanqueController {
  // Récupérer toutes les banques
  static async getAllBanques(req, res) {
    try {
      const banques = await Banque.findAll();
      res.json({
        success: true,
        banques: banques
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer une banque par ID
  static async getBanqueById(req, res) {
    try {
      const { id } = req.params;
      const banque = await Banque.findById(id);
      
      if (!banque) {
        return res.status(404).json({
          success: false,
          message: 'Banque non trouvée'
        });
      }

      res.json({
        success: true,
        banque: banque
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Créer une nouvelle banque
  static async createBanque(req, res) {
    try {
      const { nom, code } = req.body;

      // Validation des champs requis
      if (!nom || !code) {
        return res.status(400).json({
          success: false,
          message: 'Le nom et le code sont requis'
        });
      }

      // Vérifier si le nom existe déjà
      const existingBanqueByName = await Banque.findByName(nom);
      if (existingBanqueByName) {
        return res.status(400).json({
          success: false,
          message: 'Une banque avec ce nom existe déjà'
        });
      }

      // Vérifier si le code existe déjà
      const existingBanqueByCode = await Banque.findByCode(code);
      if (existingBanqueByCode) {
        return res.status(400).json({
          success: false,
          message: 'Une banque avec ce code existe déjà'
        });
      }

      const banqueId = await Banque.create({
        nom,
        code
      });

      const newBanque = await Banque.findById(banqueId);

      // Invalider le cache des banques
      DynamicValidationService.invalidateCache();

      res.status(201).json({
        success: true,
        message: 'Banque créée avec succès',
        banque: newBanque
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Mettre à jour une banque
  static async updateBanque(req, res) {
    try {
      const { id } = req.params;
      const { nom, code } = req.body;

      const banque = await Banque.findById(id);
      if (!banque) {
        return res.status(404).json({
          success: false,
          message: 'Banque non trouvée'
        });
      }

      // Vérifier si le nom existe déjà (sauf pour la banque actuelle)
      if (nom && nom !== banque.nom) {
        const existingBanqueByName = await Banque.findByName(nom);
        if (existingBanqueByName) {
          return res.status(400).json({
            success: false,
            message: 'Une banque avec ce nom existe déjà'
          });
        }
      }

      // Vérifier si le code existe déjà (sauf pour la banque actuelle)
      if (code && code !== banque.code) {
        const existingBanqueByCode = await Banque.findByCode(code);
        if (existingBanqueByCode) {
          return res.status(400).json({
            success: false,
            message: 'Une banque avec ce code existe déjà'
          });
        }
      }

      await Banque.update(id, {
        nom: nom || banque.nom,
        code: code || banque.code
      });

      const updatedBanque = await Banque.findById(id);

      res.json({
        success: true,
        message: 'Banque mise à jour avec succès',
        banque: updatedBanque
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Supprimer une banque
  static async deleteBanque(req, res) {
    try {
      const { id } = req.params;

      const banque = await Banque.findById(id);
      if (!banque) {
        return res.status(404).json({
          success: false,
          message: 'Banque non trouvée'
        });
      }

      await Banque.delete(id);

      res.json({
        success: true,
        message: 'Banque supprimée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Activer/Désactiver une banque
  static async toggleBanqueStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const banque = await Banque.findById(id);
      if (!banque) {
        return res.status(404).json({
          success: false,
          message: 'Banque non trouvée'
        });
      }

      await Banque.toggleStatus(id, isActive);

      const updatedBanque = await Banque.findById(id);

      res.json({
        success: true,
        message: `Banque ${isActive ? 'activée' : 'désactivée'} avec succès`,
        banque: updatedBanque
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer les banques actives (accessible à tous les utilisateurs authentifiés)
  static async getActiveBanques(req, res) {
    try {
      const banques = await Banque.findActive();
      
      res.json({
        success: true,
        banques: banques
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer les mots de passe par banque avec pagination
  static async getBankPasswordsPaginated(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Récupérer les banques avec pagination
      const banques = await Banque.findAllPaginated(limit, offset);
      
      // Compter le total
      const total = await Banque.countAll();

      // Générer les mots de passe et compter les utilisateurs
      const banquesWithPasswords = await Promise.all(
        banques.map(async (banque) => {
          // Compter les utilisateurs de cette banque
          const userCount = await User.countByBanque(banque.nom);

          return {
            id: banque.id,
            nom: banque.nom,
            code: banque.code,
            motDePasse: generatePasswordsForAllBanks([banque])[0].motDePasse,
            nombreUtilisateurs: userCount,
            isActive: banque.isActive
          };
        })
      );

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        banques: banquesWithPasswords,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = BanqueController;
