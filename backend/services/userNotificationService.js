const db = require('../config/db');

class UserNotificationService {
  // Récupérer tous les utilisateurs actifs d'une banque
  static async getUsersByBanque(banqueName) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, name, email, role, banque, is_active
        FROM users 
        WHERE banque = ? AND is_active = 1 AND email IS NOT NULL AND email != ''
        ORDER BY name ASC
      `;
      
      db.query(query, [banqueName], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Récupérer tous les utilisateurs actifs d'une banque (sauf l'expéditeur)
  static async getUsersByBanqueExcludingSender(banqueName, senderId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, name, email, role, banque, is_active
        FROM users 
        WHERE banque = ? AND is_active = 1 AND id != ? AND email IS NOT NULL AND email != ''
        ORDER BY name ASC
      `;
      
      db.query(query, [banqueName, senderId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Récupérer les emails des utilisateurs d'une banque
  static async getEmailsByBanque(banqueName) {
    try {
      const users = await this.getUsersByBanque(banqueName);
      return users.map(user => user.email).filter(email => email && email.trim() !== '');
    } catch (error) {
      console.error('Erreur lors de la récupération des emails:', error);
      return [];
    }
  }

  // Récupérer les emails des utilisateurs d'une banque (sauf l'expéditeur)
  static async getEmailsByBanqueExcludingSender(banqueName, senderId) {
    try {
      const users = await this.getUsersByBanqueExcludingSender(banqueName, senderId);
      return users.map(user => user.email).filter(email => email && email.trim() !== '');
    } catch (error) {
      console.error('Erreur lors de la récupération des emails:', error);
      return [];
    }
  }

  // Récupérer les utilisateurs par rôle
  static async getUsersByRole(roles) {
    return new Promise((resolve, reject) => {
      const placeholders = roles.map(() => '?').join(',');
      const query = `
        SELECT id, name, email, role, banque, is_active
        FROM users 
        WHERE role IN (${placeholders}) AND is_active = 1 AND email IS NOT NULL AND email != ''
        ORDER BY name ASC
      `;
      
      db.query(query, roles, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Récupérer les emails des utilisateurs par rôle
  static async getEmailsByRole(roles) {
    try {
      const users = await this.getUsersByRole(roles);
      return users.map(user => user.email).filter(email => email && email.trim() !== '');
    } catch (error) {
      console.error('Erreur lors de la récupération des emails par rôle:', error);
      return [];
    }
  }

  // Récupérer les utilisateurs par rôle (sauf l'expéditeur)
  static async getUsersByRoleExcludingSender(roles, senderId) {
    return new Promise((resolve, reject) => {
      const placeholders = roles.map(() => '?').join(',');
      const query = `
        SELECT id, name, email, role, banque, is_active
        FROM users 
        WHERE role IN (${placeholders}) AND is_active = 1 AND id != ? AND email IS NOT NULL AND email != ''
        ORDER BY name ASC
      `;
      
      db.query(query, [...roles, senderId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Récupérer les emails des utilisateurs par rôle (sauf l'expéditeur)
  static async getEmailsByRoleExcludingSender(roles, senderId) {
    try {
      const users = await this.getUsersByRoleExcludingSender(roles, senderId);
      return users.map(user => user.email).filter(email => email && email.trim() !== '');
    } catch (error) {
      console.error('Erreur lors de la récupération des emails par rôle (sauf expéditeur):', error);
      return [];
    }
  }
}

module.exports = UserNotificationService;
