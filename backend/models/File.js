const db = require('../config/db');
const path = require('path');
const fs = require('fs');

class File {
  static async create(fileData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO files (name, original_name, description, deposant_nom, deposant_email, deposant_banque, file_path, file_size, file_type, uploaded_by, is_public, product_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        fileData.isPublic || false,
        fileData.productId || null
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
        SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque,
               bp.product_name, bp.code_produit
        FROM files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        LEFT JOIN banque_products bp ON f.product_id = bp.id
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
        SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque,
               bp.product_name, bp.code_produit
        FROM files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        LEFT JOIN banque_products bp ON f.product_id = bp.id
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
        SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque,
               bp.product_name, bp.code_produit
        FROM files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        LEFT JOIN banque_products bp ON f.product_id = bp.id
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
      
      // Filtre par produit
      if (filters.product && filters.product !== 'all') {
        whereConditions.push('f.product_id = ?');
        queryParams.push(filters.product);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Requête pour récupérer les fichiers avec pagination et filtres
      const query = `
        SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque,
               bp.product_name, bp.code_produit
        FROM files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        LEFT JOIN banque_products bp ON f.product_id = bp.id
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

  static async findByBanquePaginated(banque, page = 1, limit = 3, filters = {}) {
    return new Promise((resolve, reject) => {
      const offset = (page - 1) * limit;
      
      // Construire les conditions de filtrage
      let whereConditions = ['f.deposant_banque = ?'];
      let queryParams = [banque];
      
      // Filtre par nom de fichier
      if (filters.searchTerm && filters.searchTerm.trim()) {
        whereConditions.push('(f.original_name LIKE ? OR f.description LIKE ?)');
        const searchPattern = `%${filters.searchTerm.trim()}%`;
        queryParams.push(searchPattern, searchPattern);
      }
      
      // Filtre par produit
      if (filters.product && filters.product !== 'all') {
        whereConditions.push('f.product_id = ?');
        queryParams.push(filters.product);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Requête pour récupérer les fichiers avec pagination et filtres
      const query = `
        SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque,
               bp.product_name, bp.code_produit
        FROM files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        LEFT JOIN banque_products bp ON f.product_id = bp.id
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
      
      // Filtre par produit
      if (filters.product && filters.product !== 'all') {
        whereConditions.push('f.product_id = ?');
        queryParams.push(filters.product);
      }
      
      // Filtre par banque (pour les admins/nsia_vie)
      if (filters.banque && filters.banque !== 'all') {
        whereConditions.push('f.deposant_banque = ?');
        queryParams.push(filters.banque);
      }
      
      // Filtre par produit
      if (filters.product && filters.product !== 'all') {
        whereConditions.push('f.product_id = ?');
        queryParams.push(filters.product);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // Requête pour récupérer les fichiers avec pagination et filtres
      const query = `
        SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque,
               bp.product_name, bp.code_produit
        FROM files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        LEFT JOIN banque_products bp ON f.product_id = bp.id
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

  // Statistiques générales pour réceptions (admin/nsia_vie)
  static async getStatsReceptions() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(CASE WHEN uploaded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as totalFiles,
          SUM(CASE WHEN uploaded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN download_count ELSE 0 END) as totalDownloads,
          SUM(CASE WHEN uploaded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN file_size ELSE 0 END) as totalSize,
          COUNT(CASE WHEN uploaded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recentUploads
        FROM files
      `;

      db.execute(query, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const row = result[0];
          resolve({
            totalFiles: row.totalFiles || 0,
            totalDownloads: row.totalDownloads || 0,
            totalSize: row.totalSize || 0,
            recentUploads: row.recentUploads || 0
          });
        }
      });
    });
  }

  // Statistiques par banque pour réceptions
  static async getStatsByBank(banqueDestinataire) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(CASE WHEN uploaded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as totalFiles,
          SUM(CASE WHEN uploaded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN download_count ELSE 0 END) as totalDownloads,
          SUM(CASE WHEN uploaded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN file_size ELSE 0 END) as totalSize,
          COUNT(CASE WHEN uploaded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recentUploads
        FROM files
        WHERE deposant_banque = ?
      `;

      db.execute(query, [banqueDestinataire], (err, result) => {
        if (err) {
          reject(err);
        } else {
          const row = result[0];
          resolve({
            totalFiles: row.totalFiles || 0,
            totalDownloads: row.totalDownloads || 0,
            totalSize: row.totalSize || 0,
            recentUploads: row.recentUploads || 0
          });
        }
      });
    });
  }

  // Fichiers récents pour réceptions (toutes les banques)
  static async getRecentFilesReceptions(limit = 5) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM files 
        ORDER BY uploaded_at DESC 
        LIMIT ?
      `;

      db.execute(query, [limit], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Fichiers récents par banque pour réceptions
  static async getRecentFilesByBank(banqueDestinataire, limit = 5) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM files 
        WHERE deposant_banque = ?
        ORDER BY uploaded_at DESC 
        LIMIT ?
      `;

      db.execute(query, [banqueDestinataire, limit], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Répartition des fichiers par banque pour réceptions
  static async getFilesByBankReceptions() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          deposant_banque,
          COUNT(*) as count
        FROM files 
        GROUP BY deposant_banque
        ORDER BY count DESC
      `;

      db.execute(query, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const filesByBank = {};
          result.forEach(row => {
            filesByBank[row.deposant_banque] = row.count;
          });
          resolve(filesByBank);
        }
      });
    });
  }

  // Statistiques complètes pour réceptions (toutes les données sans filtre de période)
  static async getStatsReceptionsComplete() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as totalFiles,
          SUM(download_count) as totalDownloads,
          SUM(file_size) as totalSize,
          COUNT(CASE WHEN uploaded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recentUploads
        FROM files
      `;

      db.execute(query, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const row = result[0];
          resolve({
            totalFiles: row.totalFiles || 0,
            totalDownloads: row.totalDownloads || 0,
            totalSize: row.totalSize || 0,
            recentUploads: row.recentUploads || 0
          });
        }
      });
    });
  }

  // Statistiques complètes par banque pour réceptions (toutes les données sans filtre de période)
  static async getStatsByBankComplete(banqueDestinataire) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as totalFiles,
          SUM(download_count) as totalDownloads,
          SUM(file_size) as totalSize,
          COUNT(CASE WHEN uploaded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recentUploads
        FROM files
        WHERE deposant_banque = ?
      `;

      db.execute(query, [banqueDestinataire], (err, result) => {
        if (err) {
          reject(err);
        } else {
          const row = result[0];
          resolve({
            totalFiles: row.totalFiles || 0,
            totalDownloads: row.totalDownloads || 0,
            totalSize: row.totalSize || 0,
            recentUploads: row.recentUploads || 0
          });
        }
      });
    });
  }
}

module.exports = File;
