const db = require('../config/db');

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

  // Récupérer tous les utilisateurs avec pagination et filtres
  static async findAllPaginatedWithFilters(limit, offset, filters) {
    return new Promise((resolve, reject) => {
      let whereConditions = [];
      let queryParams = [];

      // Construire les conditions de filtrage
      if (filters.search && filters.search.trim()) {
        whereConditions.push('(name LIKE ? OR email LIKE ?)');
        const searchPattern = `%${filters.search.trim()}%`;
        queryParams.push(searchPattern, searchPattern);
      }

      if (filters.banque && filters.banque !== '') {
        whereConditions.push('banque = ?');
        queryParams.push(filters.banque);
      }

      if (filters.role && filters.role !== '') {
        whereConditions.push('role = ?');
        queryParams.push(filters.role);
      }

      if (filters.status && filters.status !== '') {
        if (filters.status === 'active') {
          whereConditions.push('is_active = 1');
        } else if (filters.status === 'inactive') {
          whereConditions.push('is_active = 0');
        }
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT id, email, role, banque, name, created_at as createdAt, last_login_at as lastLoginAt, is_active as isActive 
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);

      db.query(query, queryParams, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Compter tous les utilisateurs avec filtres
  static async countAllWithFilters(filters) {
    return new Promise((resolve, reject) => {
      let whereConditions = [];
      let queryParams = [];

      // Construire les conditions de filtrage (même logique que findAllPaginatedWithFilters)
      if (filters.search && filters.search.trim()) {
        whereConditions.push('(name LIKE ? OR email LIKE ?)');
        const searchPattern = `%${filters.search.trim()}%`;
        queryParams.push(searchPattern, searchPattern);
      }

      if (filters.banque && filters.banque !== '') {
        whereConditions.push('banque = ?');
        queryParams.push(filters.banque);
      }

      if (filters.role && filters.role !== '') {
        whereConditions.push('role = ?');
        queryParams.push(filters.role);
      }

      if (filters.status && filters.status !== '') {
        if (filters.status === 'active') {
          whereConditions.push('is_active = 1');
        } else if (filters.status === 'inactive') {
          whereConditions.push('is_active = 0');
        }
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `SELECT COUNT(*) as total FROM users ${whereClause}`;

      db.query(query, queryParams, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].total);
        }
      });
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
