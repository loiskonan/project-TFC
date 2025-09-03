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

  static async findAllPaginated(limit, offset) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, email, role, banque, name, created_at as createdAt, last_login_at as lastLoginAt, is_active as isActive FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?';
      db.query(query, [limit, offset], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  static async findAllPaginatedWithFilters(limit, offset, filters) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT id, email, role, banque, name, created_at as createdAt, last_login_at as lastLoginAt, is_active as isActive FROM users WHERE 1=1';
      const values = [];

      // Ajouter les conditions de filtrage
      if (filters.search) {
        query += ' AND (name LIKE ? OR email LIKE ?)';
        values.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      if (filters.banque) {
        query += ' AND banque = ?';
        values.push(filters.banque);
      }

      if (filters.role) {
        query += ' AND role = ?';
        values.push(filters.role);
      }

      if (filters.status) {
        if (filters.status === 'active') {
          query += ' AND is_active = 1';
        } else if (filters.status === 'inactive') {
          query += ' AND is_active = 0';
        }
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      db.query(query, values, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

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

  static async countAllWithFilters(filters) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
      const values = [];

      // Ajouter les conditions de filtrage
      if (filters.search) {
        query += ' AND (name LIKE ? OR email LIKE ?)';
        values.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      if (filters.banque) {
        query += ' AND banque = ?';
        values.push(filters.banque);
      }

      if (filters.role) {
        query += ' AND role = ?';
        values.push(filters.role);
      }

      if (filters.status) {
        if (filters.status === 'active') {
          query += ' AND is_active = 1';
        } else if (filters.status === 'inactive') {
          query += ' AND is_active = 0';
        }
      }

      db.query(query, values, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].total);
        }
      });
    });
  }

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
      console.log('🔧 Requête UPDATE:', query, 'Valeurs:', values);
      db.query(query, values, (err, result) => {
        if (err) {
          console.error('❌ Erreur SQL:', err);
          reject(err);
        } else {
          console.log('✅ Mise à jour réussie:', result);
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
}

module.exports = User;
