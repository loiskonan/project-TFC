const SystemConfig = require('../models/SystemConfig');
const bcrypt = require('bcrypt');

class SystemController {
  // Récupérer le statut du mot de passe par défaut
  static async getDefaultPassword(req, res) {
    try {
      const hashedDefaultPassword = await SystemConfig.getConfig('default_password');
      
      res.json({
        success: true,
        isConfigured: !!hashedDefaultPassword,
        message: hashedDefaultPassword 
          ? 'Mot de passe par défaut configuré' 
          : 'Mot de passe par défaut non configuré (utilise dataflow@225)'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du mot de passe par défaut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Modifier le mot de passe par défaut
  static async updateDefaultPassword(req, res) {
    try {
      const { newPassword } = req.body;

      // Validation
      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Le nouveau mot de passe est requis'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      // Hasher le mot de passe avant de le stocker
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe par défaut (hashé)
      await SystemConfig.setConfig(
        'default_password', 
        hashedPassword, 
        'Mot de passe par défaut hashé pour les nouveaux utilisateurs'
      );

      res.json({
        success: true,
        message: 'Mot de passe par défaut mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe par défaut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer toute la configuration système
  static async getAllConfig(req, res) {
    try {
      const config = await SystemConfig.getAllConfig();
      
      res.json({
        success: true,
        config: config
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = SystemController;
