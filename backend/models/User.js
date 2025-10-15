const db = require('../config/db');
const DynamicValidationService = require('../services/DynamicValidationService');

class User {
  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, email, password, role, banque, name, created_at as createdAt, last_login_at as lastLoginAt, is_active as isActive FROM users WHERE email = ?';
      db.query(query, [email], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  static async create(userData) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO users (email, password, role, banque, name) VALUES (?, ?, ?, ?, ?)';
      db.query(query, [userData.email, userData.password, userData.role, userData.banque, userData.name], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.insertId);
        }
      });
    });
  }

  static async updateLastLogin(userId) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE users SET last_login_at = NOW() WHERE id = ?';
      db.query(query, [userId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, email, role, banque, name, created_at as createdAt, last_login_at as lastLoginAt, is_active as isActive FROM users WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  static async findByIdWithPassword(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, email, password, role, banque, name, created_at as createdAt, last_login_at as lastLoginAt, is_active as isActive FROM users WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, email, role, banque, name, created_at as createdAt, last_login_at as lastLoginAt, is_active as isActive FROM users ORDER BY created_at DESC';
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  static async update(id, updateData) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          // Mapper les noms de champs camelCase vers snake_case
          let dbField = key;
          if (key === 'isActive') dbField = 'is_active';
          if (key === 'lastLoginAt') dbField = 'last_login_at';
          if (key === 'createdAt') dbField = 'created_at';
          
          fields.push(`${dbField} = ?`);
          values.push(updateData[key]);
        }
      });
      
      values.push(id);
      
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      db.query(query, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM users WHERE id = ?';
      db.query(query, [id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Récupérer tous les utilisateurs avec pagination et filtres SÉCURISÉS
  static async findAllPaginatedWithFilters(limit, offset, filters) {
    return new Promise(async (resolve, reject) => {
      try {
        let whereConditions = [];
        let queryParams = [];

        // Validation stricte des valeurs autorisées
        const allowedRoles = ['admin', 'user', 'nsia_vie'];
        const allowedStatuses = ['active', 'inactive'];

        // Filtre de recherche - SANITISÉ
        if (filters.search && typeof filters.search === 'string') {
          const sanitizedSearch = filters.search
            .replace(/[%_\\'";]/g, '') // Supprimer les caractères spéciaux SQL
            .trim()
            .substring(0, 100); // Limiter la longueur
          
          if (sanitizedSearch.length > 0) {
            whereConditions.push('(name LIKE ? OR email LIKE ?)');
            const searchPattern = `%${sanitizedSearch}%`;
            queryParams.push(searchPattern, searchPattern);
          }
        }

        // Filtre par banque - VALIDÉ DYNAMIQUEMENT
        if (filters.banque && typeof filters.banque === 'string') {
          const validBanque = await DynamicValidationService.validateBanque(filters.banque);
          if (validBanque) {
            whereConditions.push('banque = ?');
            queryParams.push(validBanque);
          }
        }

        // Filtre par rôle - VALIDÉ
        if (filters.role && typeof filters.role === 'string') {
          const trimmedRole = filters.role.trim();
          if (allowedRoles.includes(trimmedRole)) {
            whereConditions.push('role = ?');
            queryParams.push(trimmedRole);
          }
        }

        // Filtre par statut - VALIDÉ
        if (filters.status && typeof filters.status === 'string') {
          const trimmedStatus = filters.status.trim();
          if (allowedStatuses.includes(trimmedStatus)) {
            if (trimmedStatus === 'active') {
              whereConditions.push('is_active = 1');
            } else if (trimmedStatus === 'inactive') {
              whereConditions.push('is_active = 0');
            }
          }
        }

        // Construction sécurisée de la requête
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const query = `
          SELECT id, email, role, banque, name, created_at as createdAt, last_login_at as lastLoginAt, is_active as isActive 
          FROM users 
          ${whereClause}
          ORDER BY created_at DESC 
          LIMIT ? OFFSET ?
        `;

        // Validation des paramètres de pagination
        const validLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100); // Entre 1 et 100
        const validOffset = Math.max(parseInt(offset) || 0, 0); // Minimum 0
        
        queryParams.push(validLimit, validOffset);

        db.query(query, queryParams, (err, results) => {
          if (err) {
            console.error('Erreur SQL sécurisée:', err);
            reject(new Error('Erreur lors de la récupération des utilisateurs'));
          } else {
            resolve(results);
          }
        });
      } catch (error) {
        console.error('Erreur dans findAllPaginatedWithFilters:', error);
        reject(new Error('Erreur lors de la récupération des utilisateurs'));
      }
    });
  }

  // Compter tous les utilisateurs avec filtres SÉCURISÉS
  static async countAllWithFilters(filters) {
    return new Promise(async (resolve, reject) => {
      try {
        let whereConditions = [];
        let queryParams = [];

        // Même validation que findAllPaginatedWithFilters
        const allowedRoles = ['admin', 'user', 'nsia_vie'];
        const allowedStatuses = ['active', 'inactive'];

        // Filtre de recherche - SANITISÉ
        if (filters.search && typeof filters.search === 'string') {
          const sanitizedSearch = filters.search
            .replace(/[%_\\'";]/g, '') // Supprimer les caractères spéciaux SQL
            .trim()
            .substring(0, 100); // Limiter la longueur
          
          if (sanitizedSearch.length > 0) {
            whereConditions.push('(name LIKE ? OR email LIKE ?)');
            const searchPattern = `%${sanitizedSearch}%`;
            queryParams.push(searchPattern, searchPattern);
          }
        }

        // Filtre par banque - VALIDÉ DYNAMIQUEMENT
        if (filters.banque && typeof filters.banque === 'string') {
          const validBanque = await DynamicValidationService.validateBanque(filters.banque);
          if (validBanque) {
            whereConditions.push('banque = ?');
            queryParams.push(validBanque);
          }
        }

        // Filtre par rôle - VALIDÉ
        if (filters.role && typeof filters.role === 'string') {
          const trimmedRole = filters.role.trim();
          if (allowedRoles.includes(trimmedRole)) {
            whereConditions.push('role = ?');
            queryParams.push(trimmedRole);
          }
        }

        // Filtre par statut - VALIDÉ
        if (filters.status && typeof filters.status === 'string') {
          const trimmedStatus = filters.status.trim();
          if (allowedStatuses.includes(trimmedStatus)) {
            if (trimmedStatus === 'active') {
              whereConditions.push('is_active = 1');
            } else if (trimmedStatus === 'inactive') {
              whereConditions.push('is_active = 0');
            }
          }
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const query = `SELECT COUNT(*) as total FROM users ${whereClause}`;

        db.query(query, queryParams, (err, results) => {
          if (err) {
            console.error('Erreur SQL sécurisée:', err);
            reject(new Error('Erreur lors du comptage des utilisateurs'));
          } else {
            resolve(results[0].total);
          }
        });
      } catch (error) {
        console.error('Erreur dans countAllWithFilters:', error);
        reject(new Error('Erreur lors du comptage des utilisateurs'));
      }
    });
  }

  // Compter tous les utilisateurs
  static async countAll() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) as total FROM users';
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].total);
        }
      });
    });
  }

  // Compter les utilisateurs actifs
  static async countActiveUsers() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) as total FROM users WHERE is_active = 1';
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].total);
        }
      });
    });
  }

  // Compter les utilisateurs par banque
  static async countByBanque(banque) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) as total FROM users WHERE banque = ? AND role = "user"';
      db.query(query, [banque], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].total);
        }
      });
    });
  }
}

module.exports = User;

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const query = `SELECT COUNT(*) as total FROM users ${whereClause}`;

        db.query(query, queryParams, (err, results) => {
          if (err) {
            console.error('Erreur SQL sécurisée:', err);
            reject(new Error('Erreur lors du comptage des utilisateurs'));
          } else {
            resolve(results[0].total);
          }
        });
      } catch (error) {
        console.error('Erreur dans countAllWithFilters:', error);
        reject(new Error('Erreur lors du comptage des utilisateurs'));
      }
    });
  }

  // Compter tous les utilisateurs
  static async countAll() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) as total FROM users';
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].total);
        }
      });
    });
  }

  // Compter les utilisateurs actifs
  static async countActiveUsers() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) as total FROM users WHERE is_active = 1';
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].total);
        }
      });
    });
  }

  // Compter les utilisateurs par banque
  static async countByBanque(banque) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) as total FROM users WHERE banque = ? AND role = "user"';
      db.query(query, [banque], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].total);
        }
      });
    });
  }
}

module.exports = User;
