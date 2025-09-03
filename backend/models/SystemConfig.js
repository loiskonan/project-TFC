const db = require('../config/db');

class SystemConfig {
  static async getConfig(key) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT config_value FROM system_config WHERE config_key = ?';
      db.query(query, [key], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]?.config_value);
        }
      });
    });
  }

  static async setConfig(key, value, description = null) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO system_config (config_key, config_value, description) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
        config_value = VALUES(config_value),
        description = VALUES(description),
        updated_at = CURRENT_TIMESTAMP
      `;
      db.query(query, [key, value, description], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  static async getAllConfig() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT config_key, config_value, description, updated_at FROM system_config ORDER BY config_key';
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }
}

module.exports = SystemConfig;
