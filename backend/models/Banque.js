const db = require('../config/db');

class Banque {
  static async findAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, nom, code, is_active
        FROM banques
        WHERE is_active = TRUE
        ORDER BY nom ASC
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, nom, code, is_active
        FROM banques
        WHERE id = ? AND is_active = TRUE
      `;
      
      db.query(query, [id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  static async findByCode(code) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, nom, code, is_active
        FROM banques
        WHERE code = ? AND is_active = TRUE
      `;
      
      db.query(query, [code], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  static async getBanquesForFilter() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT nom
        FROM banques
        WHERE is_active = TRUE
        ORDER BY nom ASC
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results.map(row => row.nom));
        }
      });
    });
  }

  static async findActive() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, nom, code, is_active
        FROM banques
        WHERE is_active = TRUE
        ORDER BY nom ASC
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  static async findByName(nom) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, nom, code, is_active
        FROM banques
        WHERE nom = ?
      `;
      
      db.query(query, [nom], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  static async create(banqueData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO banques (nom, code)
        VALUES (?, ?)
      `;
      
      db.query(query, [banqueData.nom, banqueData.code], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.insertId);
        }
      });
    });
  }

  static async update(id, banqueData) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE banques
        SET nom = ?, code = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.query(query, [banqueData.nom, banqueData.code, id], (err, result) => {
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
      const query = `
        DELETE FROM banques
        WHERE id = ?
      `;
      
      db.query(query, [id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  static async toggleStatus(id, isActive) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE banques
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.query(query, [isActive, id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}

module.exports = Banque;
