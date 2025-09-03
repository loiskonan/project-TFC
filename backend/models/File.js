const db = require('../config/db');
const path = require('path');
const fs = require('fs');

class File {
  static async create(fileData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO files (name, original_name, description, deposant_nom, deposant_email, deposant_banque, file_path, file_size, file_type, uploaded_by, is_public) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        fileData.name,
        fileData.originalName,
        fileData.description,
        fileData.deposantNom,
        fileData.deposantEmail,
        fileData.deposantBanque,
        fileData.filePath,
        fileData.fileSize,
        fileData.fileType,
        fileData.uploadedBy,
        fileData.isPublic || false
      ];
      
      db.query(query, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.insertId);
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque
        FROM files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        WHERE f.id = ?
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

  static async findByUser(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque
        FROM files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        WHERE f.uploaded_by = ?
        ORDER BY f.uploaded_at DESC
      `;
      db.query(query, [userId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque
        FROM files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        ORDER BY f.uploaded_at DESC
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

  static async updateDownloadCount(id) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE files SET download_count = download_count + 1 WHERE id = ?';
      db.query(query, [id], (err, result) => {
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
      // D'abord récupérer le fichier pour supprimer le fichier physique
      this.findById(id).then(file => {
        if (file && file.file_path) {
          const filePath = path.join(__dirname, '..', '..', file.file_path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        
        // Supprimer de la base de données
        const query = 'DELETE FROM files WHERE id = ?';
        db.query(query, [id], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      }).catch(reject);
    });
  }

  static async getStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_files,
          SUM(file_size) as total_size,
          SUM(download_count) as total_downloads,
          COUNT(DISTINCT uploaded_by) as unique_uploaders
        FROM files
      `;
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  static async fileNameExists(originalName, deposantBanque) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count 
        FROM files 
        WHERE original_name = ? AND deposant_banque = ?
      `;
      db.query(query, [originalName, deposantBanque], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].count > 0);
        }
      });
    });
  }

  static async findByUserPaginated(userId, page = 1, limit = 3, filters = {}) {
    return new Promise((resolve, reject) => {
      const offset = (page - 1) * limit;
      
      // Construire les conditions de filtrage
      let whereConditions = ['f.uploaded_by = ?'];
      let queryParams = [userId];
      
      // Filtre par nom de fichier
      if (filters.searchTerm && filters.searchTerm.trim()) {
        whereConditions.push('(f.original_name LIKE ? OR f.description LIKE ?)');
        const searchPattern = `%${filters.searchTerm.trim()}%`;
        queryParams.push(searchPattern, searchPattern);
      }
      
      // Filtre par type de fichier
      if (filters.fileType && filters.fileType !== 'all') {
        whereConditions.push('f.file_type LIKE ?');
        queryParams.push(`%${filters.fileType}%`);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Requête pour récupérer les fichiers avec pagination et filtres
      const query = `
        SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque
        FROM files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        WHERE ${whereClause}
        ORDER BY f.uploaded_at DESC
        LIMIT ? OFFSET ?
      `;
      
      // Requête pour compter le total avec filtres
      const countQuery = `
        SELECT COUNT(*) as total
        FROM files f
        WHERE ${whereClause}
      `;
      
      // Ajouter les paramètres de pagination
      const queryParamsWithPagination = [...queryParams, limit, offset];
      
      db.query(query, queryParamsWithPagination, (err, results) => {
        if (err) {
          reject(err);
        } else {
          // Compter le total avec les mêmes filtres
          db.query(countQuery, queryParams, (countErr, countResults) => {
            if (countErr) {
              reject(countErr);
            } else {
              const total = countResults[0].total;
              const totalPages = Math.ceil(total / limit);
              
              resolve({
                files: results,
                pagination: {
                  currentPage: page,
                  totalPages: totalPages,
                  totalItems: total,
                  itemsPerPage: limit,
                  hasNextPage: page < totalPages,
                  hasPrevPage: page > 1
                }
              });
            }
          });
        }
      });
    });
  }

  static async findAllPaginated(page = 1, limit = 3, filters = {}) {
    return new Promise((resolve, reject) => {
      const offset = (page - 1) * limit;
      
      // Construire les conditions de filtrage
      let whereConditions = [];
      let queryParams = [];
      
      // Filtre par nom de fichier ou description
      if (filters.searchTerm && filters.searchTerm.trim()) {
        whereConditions.push('(f.original_name LIKE ? OR f.description LIKE ?)');
        const searchPattern = `%${filters.searchTerm.trim()}%`;
        queryParams.push(searchPattern, searchPattern);
      }
      
      // Filtre par type de fichier
      if (filters.fileType && filters.fileType !== 'all') {
        whereConditions.push('f.file_type LIKE ?');
        queryParams.push(`%${filters.fileType}%`);
      }
      
      // Filtre par banque (pour les admins/nsia_vie)
      if (filters.banque && filters.banque !== 'all') {
        whereConditions.push('f.deposant_banque = ?');
        queryParams.push(filters.banque);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // Requête pour récupérer les fichiers avec pagination et filtres
      const query = `
        SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque
        FROM files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        ${whereClause}
        ORDER BY f.uploaded_at DESC
        LIMIT ? OFFSET ?
      `;
      
      // Requête pour compter le total avec filtres
      const countQuery = `
        SELECT COUNT(*) as total
        FROM files f
        ${whereClause}
      `;
      
      // Ajouter les paramètres de pagination
      const queryParamsWithPagination = [...queryParams, limit, offset];
      
      db.query(query, queryParamsWithPagination, (err, results) => {
        if (err) {
          reject(err);
        } else {
          // Compter le total avec les mêmes filtres
          db.query(countQuery, queryParams, (countErr, countResults) => {
            if (countErr) {
              reject(countErr);
            } else {
              const total = countResults[0].total;
              const totalPages = Math.ceil(total / limit);
              
              resolve({
                files: results,
                pagination: {
                  currentPage: page,
                  totalPages: totalPages,
                  totalItems: total,
                  itemsPerPage: limit,
                  hasNextPage: page < totalPages,
                  hasPrevPage: page > 1
                }
              });
            }
          });
        }
      });
    });
  }
}

module.exports = File;
