const Banque = require('../models/Banque');

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
      console.error('Erreur lors de la récupération des banques:', error);
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
      console.error('Erreur lors de la récupération de la banque:', error);
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

      res.status(201).json({
        success: true,
        message: 'Banque créée avec succès',
        banque: newBanque
      });
    } catch (error) {
      console.error('Erreur lors de la création de la banque:', error);
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
      console.error('Erreur lors de la mise à jour de la banque:', error);
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
      console.error('Erreur lors de la suppression de la banque:', error);
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
      console.error('Erreur lors du changement de statut de la banque:', error);
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
      console.error('Erreur lors de la récupération des banques actives:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = BanqueController;
