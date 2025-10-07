const db = require('../config/db');

class FileSend {
  constructor(data) {
    this.id = data.id;
    this.originalName = data.original_name;
    this.fileName = data.file_name;
    this.filePath = data.file_path;
    this.fileType = data.file_type;
    this.fileSize = data.file_size;
    this.description = data.description;
    this.deposantId = data.deposant_id;
    this.deposantNom = data.deposant_nom;
    this.deposantEmail = data.deposant_email;
    this.deposantRole = data.deposant_role;
    this.banqueDestinataire = data.banque_destinataire;
    this.banqueCode = data.banque_code;
    this.status = data.status;
    this.downloadCount = data.download_count;
    this.productId = data.product_id;
    this.productName = data.product_name;
    this.productCode = data.code_produit;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.sentAt = data.sent_at;
    this.deliveredAt = data.delivered_at;
    this.readAt = data.read_at;
    this.lastDownloadAt = data.last_download_at;
  }

  // Créer un nouveau fichier envoyé
  static async create(fileData) {
    return new Promise((resolve, reject) => {
      const {
        originalName,
        fileName,
        filePath,
        fileType,
        fileSize,
        description,
        deposantId,
        deposantNom,
        deposantEmail,
        deposantRole,
        banqueDestinataire,
        banqueCode,
        productId,
        status = 'sent'
      } = fileData;

      const query = `
        INSERT INTO file_send (
          original_name, file_name, file_path, file_type, file_size, description,
          deposant_id, deposant_nom, deposant_email, deposant_role,
          banque_destinataire, banque_code, product_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        originalName, fileName, filePath, fileType, fileSize, description,
        deposantId, deposantNom, deposantEmail, deposantRole,
        banqueDestinataire, banqueCode, productId, status
      ];

      db.execute(query, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: result.insertId,
            ...fileData
          });
        }
      });
    });
  }

  // Créer plusieurs fichiers envoyés en lot
  static async createMultiple(filesData) {
    return new Promise((resolve, reject) => {
      if (!filesData || filesData.length === 0) {
        resolve([]);
        return;
      }

      // Créer les placeholders pour chaque fichier
      const placeholders = filesData.map(() => 
        '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).join(', ');

      const query = `
        INSERT INTO file_send (
          original_name, file_name, file_path, file_type, file_size, description,
          deposant_id, deposant_nom, deposant_email, deposant_role,
          banque_destinataire, banque_code, product_id, status
        ) VALUES ${placeholders}
      `;

      // Aplatir tous les valeurs en un seul tableau
      const values = filesData.flatMap(file => [
        file.originalName,
        file.fileName,
        file.filePath,
        file.fileType,
        file.fileSize,
        file.description,
        file.deposantId,
        file.deposantNom,
        file.deposantEmail,
        file.deposantRole,
        file.banqueDestinataire,
        file.banqueCode,
        file.productId || null,
        file.status || 'sent'
      ]);

      db.execute(query, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            insertId: result.insertId,
            affectedRows: result.affectedRows,
            files: filesData.map((file, index) => ({
              id: result.insertId + index,
              ...file
            }))
          });
        }
      });
    });
  }

  // Vérifier si un fichier avec le même nom existe déjà pour une banque
  static async fileNameExists(originalName, banqueDestinataire) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count 
        FROM file_send 
        WHERE original_name = ? AND banque_destinataire = ?
      `;

      db.execute(query, [originalName, banqueDestinataire], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0].count > 0);
        }
      });
    });
  }

  // Récupérer un fichier envoyé par son ID
  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM file_send WHERE id = ?
      `;
      
      db.query(query, [id], (err, results) => {
        if (err) {
          reject(err);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          resolve(new FileSend(results[0]));
        }
      });
    });
  }

  // Récupérer tous les fichiers envoyés avec pagination et filtres
  static async findAllPaginated(options = {}) {
    return new Promise((resolve, reject) => {
      const {
        page = 1,
        limit = 10,
        searchTerm = '',
        banqueDestinataire = '',
        deposantRole = '',
        status = '',
        fileType = ''
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // Filtres
      if (searchTerm) {
        whereConditions.push('(original_name LIKE ? OR description LIKE ?)');
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }

      if (banqueDestinataire) {
        whereConditions.push('banque_destinataire = ?');
        queryParams.push(banqueDestinataire);
      }

      if (deposantRole) {
        whereConditions.push('deposant_role = ?');
        queryParams.push(deposantRole);
      }

      if (status) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }

      if (options.product && options.product !== 'all') {
        if (options.product === 'null') {
          whereConditions.push('fs.product_id IS NULL');
        } else {
          whereConditions.push('fs.product_id = ?');
          queryParams.push(options.product);
        }
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT fs.*, bp.product_name, bp.code_produit
        FROM file_send fs
        LEFT JOIN banque_products bp ON fs.product_id = bp.id
        ${whereClause}
        ORDER BY fs.created_at DESC 
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);

      db.execute(query, queryParams, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.map(row => new FileSend(row)));
        }
      });
    });
  }

  // Compter le nombre total de fichiers envoyés avec filtres
  static async countAll(options = {}) {
    return new Promise((resolve, reject) => {
      const {
        searchTerm = '',
        banqueDestinataire = '',
        deposantRole = '',
        status = '',
        fileType = ''
      } = options;

      let whereConditions = [];
      let queryParams = [];

      // Filtres (même logique que findAllPaginated)
      if (searchTerm) {
        whereConditions.push('(original_name LIKE ? OR description LIKE ?)');
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }

      if (banqueDestinataire) {
        whereConditions.push('banque_destinataire = ?');
        queryParams.push(banqueDestinataire);
      }

      if (deposantRole) {
        whereConditions.push('deposant_role = ?');
        queryParams.push(deposantRole);
      }

      if (status) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }

      if (options.product && options.product !== 'all') {
        if (options.product === 'null') {
          whereConditions.push('product_id IS NULL');
        } else {
          whereConditions.push('product_id = ?');
          queryParams.push(options.product);
        }
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `SELECT COUNT(*) as total FROM file_send ${whereClause}`;

      db.execute(query, queryParams, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0].total);
        }
      });
    });
  }

  // Récupérer les fichiers envoyés par un utilisateur spécifique
  static async findByDeposant(deposantId, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        page = 1,
        limit = 10,
        searchTerm = '',
        banqueDestinataire = '',
        status = ''
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = ['deposant_id = ?'];
      let queryParams = [deposantId];

      // Filtres supplémentaires
      if (searchTerm) {
        whereConditions.push('(original_name LIKE ? OR description LIKE ?)');
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }

      if (banqueDestinataire) {
        whereConditions.push('banque_destinataire = ?');
        queryParams.push(banqueDestinataire);
      }

      if (status) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      const query = `
        SELECT * FROM file_send 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);

      db.execute(query, queryParams, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.map(row => new FileSend(row)));
        }
      });
    });
  }

  // Compter les fichiers envoyés par un utilisateur
  static async countByDeposant(deposantId, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        searchTerm = '',
        banqueDestinataire = '',
        status = ''
      } = options;

      let whereConditions = ['deposant_id = ?'];
      let queryParams = [deposantId];

      // Filtres supplémentaires
      if (searchTerm) {
        whereConditions.push('(original_name LIKE ? OR description LIKE ?)');
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }

      if (banqueDestinataire) {
        whereConditions.push('banque_destinataire = ?');
        queryParams.push(banqueDestinataire);
      }

      if (status) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      const query = `SELECT COUNT(*) as total FROM file_send ${whereClause}`;

      db.execute(query, queryParams, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0].total);
        }
      });
    });
  }

  // Mettre à jour le statut d'un fichier
  static async updateStatus(id, status, additionalData = {}) {
    return new Promise((resolve, reject) => {
      let updateFields = ['status = ?'];
      let queryParams = [status];

      // Ajouter des champs supplémentaires selon le statut
      if (status === 'delivered' && !additionalData.deliveredAt) {
        updateFields.push('delivered_at = NOW()');
      } else if (status === 'read' && !additionalData.readAt) {
        updateFields.push('read_at = NOW()');
      } else if (status === 'downloaded') {
        updateFields.push('download_count = download_count + 1');
        updateFields.push('last_download_at = NOW()');
      }

      // Ajouter des données supplémentaires si fournies
      if (additionalData.deliveredAt) {
        updateFields.push('delivered_at = ?');
        queryParams.push(additionalData.deliveredAt);
      }
      if (additionalData.readAt) {
        updateFields.push('read_at = ?');
        queryParams.push(additionalData.readAt);
      }

      queryParams.push(id);

      const query = `
        UPDATE file_send 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      db.execute(query, queryParams, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Supprimer un fichier envoyé
  static async delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM file_send WHERE id = ?';

      db.execute(query, [id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Récupérer les statistiques des fichiers envoyés
  static async getStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as totalFiles,
          COUNT(DISTINCT deposant_id) as totalDeposants,
          COUNT(DISTINCT banque_destinataire) as totalBanques,
          SUM(file_size) as totalSize,
          AVG(file_size) as averageSize,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sentCount,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as deliveredCount,
          COUNT(CASE WHEN status = 'read' THEN 1 END) as readCount,
          COUNT(CASE WHEN status = 'downloaded' THEN 1 END) as downloadedCount
        FROM file_send
      `;

      db.execute(query, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0]);
        }
      });
    });
  }

  // Récupérer la liste des banques destinataires
  static async getBanquesDestinataires() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT banque_destinataire, banque_code
        FROM file_send
        ORDER BY banque_destinataire
      `;

      db.execute(query, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Statistiques générales (toutes les banques)
  static async getStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as totalFiles,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN download_count ELSE 0 END) as totalDownloads,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN file_size ELSE 0 END) as totalSize,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recentUploads,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'read' THEN 1 ELSE 0 END) as \`read\`,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'downloaded' THEN 1 ELSE 0 END) as downloaded
        FROM file_send
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
            recentUploads: row.recentUploads || 0,
            filesByStatus: {
              sent: row.sent || 0,
              delivered: row.delivered || 0,
              read: row.read || 0,
              downloaded: row.downloaded || 0
            }
          });
        }
      });
    });
  }

  // Statistiques par banque
  static async getStatsByBank(banqueDestinataire) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as totalFiles,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN download_count ELSE 0 END) as totalDownloads,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN file_size ELSE 0 END) as totalSize,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recentUploads,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'read' THEN 1 ELSE 0 END) as \`read\`,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'downloaded' THEN 1 ELSE 0 END) as downloaded
        FROM file_send
        WHERE banque_destinataire = ?
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
            recentUploads: row.recentUploads || 0,
            filesByStatus: {
              sent: row.sent || 0,
              delivered: row.delivered || 0,
              read: row.read || 0,
              downloaded: row.downloaded || 0
            }
          });
        }
      });
    });
  }

  // Fichiers récents (toutes les banques)
  static async getRecentFiles(limit = 5) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM file_send 
        ORDER BY created_at DESC 
        LIMIT ?
      `;

      db.execute(query, [limit], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.map(row => new FileSend(row)));
        }
      });
    });
  }

  // Fichiers récents par banque
  static async getRecentFilesByBank(banqueDestinataire, limit = 5) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM file_send 
        WHERE banque_destinataire = ?
        ORDER BY created_at DESC 
        LIMIT ?
      `;

      db.execute(query, [banqueDestinataire, limit], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.map(row => new FileSend(row)));
        }
      });
    });
  }

  // Répartition des fichiers par banque
  static async getFilesByBank() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          banque_destinataire,
          COUNT(*) as count
        FROM file_send 
        GROUP BY banque_destinataire
        ORDER BY count DESC
      `;

      db.execute(query, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const filesByBank = {};
          result.forEach(row => {
            filesByBank[row.banque_destinataire] = row.count;
          });
          resolve(filesByBank);
        }
      });
    });
  }

  // Statistiques complètes (toutes les données sans filtre de période)
  static async getStatsComplete() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as totalFiles,
          SUM(download_count) as totalDownloads,
          SUM(file_size) as totalSize,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recentUploads,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as \`read\`,
          SUM(CASE WHEN status = 'downloaded' THEN 1 ELSE 0 END) as downloaded
        FROM file_send
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
            recentUploads: row.recentUploads || 0,
            filesByStatus: {
              sent: row.sent || 0,
              delivered: row.delivered || 0,
              read: row.read || 0,
              downloaded: row.downloaded || 0
            }
          });
        }
      });
    });
  }

  // Statistiques complètes par banque (toutes les données sans filtre de période)
  static async getStatsByBankComplete(banqueDestinataire) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as totalFiles,
          SUM(download_count) as totalDownloads,
          SUM(file_size) as totalSize,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recentUploads,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as \`read\`,
          SUM(CASE WHEN status = 'downloaded' THEN 1 ELSE 0 END) as downloaded
        FROM file_send
        WHERE banque_destinataire = ?
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
            recentUploads: row.recentUploads || 0,
            filesByStatus: {
              sent: row.sent || 0,
              delivered: row.delivered || 0,
              read: row.read || 0,
              downloaded: row.downloaded || 0
            }
          });
        }
      });
    });
  }
}

module.exports = FileSend;
