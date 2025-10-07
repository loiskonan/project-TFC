const FileSend = require('../models/FileSend');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const emailService = require('../services/emailService');
const UserNotificationService = require('../services/userNotificationService');

class FileSendController {
  constructor() {
    // Configuration du stockage des fichiers
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/file_send');
        
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // Générer un nom de fichier unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const fileName = `file_${uniqueSuffix}_${file.originalname}`;
        cb(null, fileName);
      }
    });

    // Configuration de multer
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max par fichier
        files: 10 // Maximum 10 fichiers par upload
      },
      fileFilter: (req, file, cb) => {
        // Autoriser tous les types de fichiers pour l'instant
        // Vous pouvez ajouter des restrictions ici si nécessaire
        cb(null, true);
      }
    });
  }

  // Upload d'un seul fichier
  uploadSingle = (req, res) => {
    this.upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'Erreur lors de l\'upload du fichier',
          error: err.message
        });
      }

      try {
        // Vérifier que le fichier a été uploadé
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'Aucun fichier fourni'
          });
        }

        // Récupérer les données du formulaire
        const {
          description,
          banqueDestinataire,
          banqueCode
        } = req.body;

        // Validation des données
        if (!description || !banqueDestinataire) {
          // Supprimer le fichier uploadé en cas d'erreur
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            success: false,
            message: 'Description et banque destinataire sont obligatoires'
          });
        }

        // Vérifier si un fichier avec le même nom existe déjà pour cette banque
        const fileNameExists = await FileSend.fileNameExists(req.file.originalname, banqueDestinataire);
        if (fileNameExists) {
          // Supprimer le fichier uploadé en cas d'erreur
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            success: false,
            message: `Un fichier avec le nom "${req.file.originalname}" existe déjà pour la banque "${banqueDestinataire}". Veuillez utiliser un nom différent.`
          });
        }

        // Données du fichier à enregistrer
        const fileData = {
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          description,
          deposantId: req.user.id,
          deposantNom: req.user.name,
          deposantEmail: req.user.email,
          deposantRole: req.user.role,
          banqueDestinataire,
          banqueCode: banqueCode || banqueDestinataire,
          status: 'sent'
        };

        // Enregistrer en base de données
        const result = await FileSend.create(fileData);

        res.status(201).json({
          success: true,
          message: 'Fichier envoyé avec succès',
          data: {
            id: result.id,
            originalName: result.originalName,
            fileName: result.fileName,
            fileSize: result.fileSize,
            description: result.description,
            banqueDestinataire: result.banqueDestinataire,
            status: result.status,
            createdAt: result.createdAt
          }
        });

      } catch (error) {
        
        // Supprimer le fichier uploadé en cas d'erreur
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
          error: error.message
        });
      }
    });
  };

  // Upload de plusieurs fichiers
  uploadMultiple = (req, res) => {
    this.upload.array('files', 10)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'Erreur lors de l\'upload des fichiers',
          error: err.message
        });
      }

      try {
        // Vérifier que des fichiers ont été uploadés
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Aucun fichier fourni'
          });
        }

        // Récupérer les données du formulaire
        const {
          description,
          banqueDestinataire,
          banqueCode,
          file_products
        } = req.body;
        
        // Parser les produits si c'est un JSON string
        let parsedProducts = file_products;
        if (typeof file_products === 'string') {
          try {
            parsedProducts = JSON.parse(file_products);
          } catch (error) {
            console.error('Error parsing file_products:', error);
            parsedProducts = [];
          }
        }

        // Validation des données
        if (!description || !banqueDestinataire) {
          // Supprimer tous les fichiers uploadés en cas d'erreur
          req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
          return res.status(400).json({
            success: false,
            message: 'Description et banque destinataire sont obligatoires'
          });
        }

        // Vérifier que tous les fichiers ont un produit associé
        if (!parsedProducts || !Array.isArray(parsedProducts) || parsedProducts.length !== req.files.length) {
          // Supprimer tous les fichiers uploadés en cas d'erreur
          req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
          return res.status(400).json({
            success: false,
            message: 'Chaque fichier doit avoir un produit associé'
          });
        }

        // Vérifier les noms de fichiers en lot
        const duplicateFiles = [];
        for (const file of req.files) {
          const fileNameExists = await FileSend.fileNameExists(file.originalname, banqueDestinataire);
          if (fileNameExists) {
            duplicateFiles.push(file.originalname);
          }
        }

        if (duplicateFiles.length > 0) {
          // Supprimer tous les fichiers uploadés en cas d'erreur
          req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
          return res.status(400).json({
            success: false,
            message: `Les fichiers suivants existent déjà pour la banque "${banqueDestinataire}": ${duplicateFiles.join(', ')}`
          });
        }

        // Préparer les données des fichiers
        const filesData = req.files.map((file, index) => ({
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          description,
          deposantId: req.user.id,
          deposantNom: req.user.name,
          deposantEmail: req.user.email,
          deposantRole: req.user.role,
          banqueDestinataire,
          banqueCode: banqueCode || banqueDestinataire,
          productId: parseInt(parsedProducts[index]),
          status: 'sent'
        }));

        // Enregistrer en base de données
        const result = await FileSend.createMultiple(filesData);

        // Envoyer des notifications email aux utilisateurs de la banque destinataire
        try {
          await this.sendFileNotifications(result.files, banqueDestinataire, description, req.user);
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi des notifications email:', emailError);
          // Ne pas faire échouer l'upload si l'email échoue
        }

        res.status(201).json({
          success: true,
          message: `${req.files.length} fichier(s) envoyé(s) avec succès`,
          data: {
            totalFiles: req.files.length,
            files: result.files.map(file => ({
              id: file.id,
              originalName: file.originalName,
              fileName: file.fileName,
              fileSize: file.fileSize,
              description: file.description,
              banqueDestinataire: file.banqueDestinataire,
              productId: file.productId,
              status: file.status,
              createdAt: file.createdAt
            }))
          }
        });

      } catch (error) {
        
        // Supprimer tous les fichiers uploadés en cas d'erreur
        if (req.files) {
          req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        }

        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
          error: error.message
        });
      }
    });
  };

  // Récupérer les fichiers envoyés par l'utilisateur connecté
  getMySentFiles = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        searchTerm = '',
        banqueDestinataire = '',
        status = '',
        product = ''
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        searchTerm,
        banqueDestinataire,
        status,
        product
      };

      const files = await FileSend.findByDeposant(req.user.id, options);
      const total = await FileSend.countByDeposant(req.user.id, options);

      res.json({
        success: true,
        data: {
          files: files.map(file => ({
            id: file.id,
            originalName: file.originalName,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            description: file.description,
            banqueDestinataire: file.banqueDestinataire,
            banqueCode: file.banqueCode,
            status: file.status,
            downloadCount: file.downloadCount,
            createdAt: file.createdAt,
            sentAt: file.sentAt,
            deliveredAt: file.deliveredAt,
            readAt: file.readAt,
            lastDownloadAt: file.lastDownloadAt,
            productId: file.productId,
            productName: file.productName,
            productCode: file.productCode,
            productId: file.productId,
            productName: file.productName,
            productCode: file.productCode
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  };

  // Récupérer tous les fichiers envoyés (pour admin/nsia_vie)
  getAllSentFiles = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        searchTerm = '',
        banqueDestinataire = '',
        deposantRole = '',
        status = '',
        fileType = '',
        product = ''
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        searchTerm,
        banqueDestinataire,
        deposantRole,
        status,
        fileType,
        product
      };

      const files = await FileSend.findAllPaginated(options);
      const total = await FileSend.countAll(options);

      res.json({
        success: true,
        data: {
          files: files.map(file => ({
            id: file.id,
            originalName: file.originalName,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            description: file.description,
            deposantNom: file.deposantNom,
            deposantEmail: file.deposantEmail,
            deposantRole: file.deposantRole,
            banqueDestinataire: file.banqueDestinataire,
            banqueCode: file.banqueCode,
            status: file.status,
            downloadCount: file.downloadCount,
            createdAt: file.createdAt,
            sentAt: file.sentAt,
            deliveredAt: file.deliveredAt,
            readAt: file.readAt,
            lastDownloadAt: file.lastDownloadAt,
            productId: file.productId,
            productName: file.productName,
            productCode: file.productCode
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  };

  // Récupérer les fichiers reçus par la banque de l'utilisateur (pour tous les utilisateurs)
  getReceivedFiles = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        searchTerm = '',
        status = '',
        fileType = ''
      } = req.query;

      // Pour les utilisateurs normaux, filtrer par leur banque
      const banqueDestinataire = req.user.banque || '';
      
      if (!banqueDestinataire && req.user.role === 'user') {
        return res.status(400).json({
          success: false,
          message: 'Banque non définie pour cet utilisateur'
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        searchTerm,
        banqueDestinataire,
        status,
        fileType
      };

      const files = await FileSend.findAllPaginated(options);
      const total = await FileSend.countAll(options);

      res.json({
        success: true,
        data: {
          files: files.map(file => ({
            id: file.id,
            originalName: file.originalName,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            description: file.description,
            deposantNom: file.deposantNom,
            deposantEmail: file.deposantEmail,
            deposantRole: file.deposantRole,
            banqueDestinataire: file.banqueDestinataire,
            banqueCode: file.banqueCode,
            status: file.status,
            downloadCount: file.downloadCount,
            createdAt: file.createdAt,
            sentAt: file.sentAt,
            deliveredAt: file.deliveredAt,
            readAt: file.readAt,
            lastDownloadAt: file.lastDownloadAt,
            productId: file.productId,
            productName: file.productName,
            productCode: file.productCode
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  };

  // Télécharger un fichier envoyé
  downloadFile = async (req, res) => {
    try {
      const { id } = req.params;

      // Récupérer les informations du fichier directement par ID
      const file = await FileSend.findById(id);

      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'Fichier non trouvé'
        });
      }

      // Vérifier que le fichier existe sur le disque
      if (!fs.existsSync(file.filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Fichier non trouvé sur le serveur'
        });
      }

      // Mettre à jour le statut et le compteur de téléchargements
      await FileSend.updateStatus(id, 'downloaded');

      // Télécharger le fichier
      res.download(file.filePath, file.originalName, (err) => {
        if (err) {
          res.status(500).json({
            success: false,
            message: 'Erreur lors du téléchargement du fichier'
          });
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  };

  // Récupérer les statistiques des fichiers envoyés
  getStats = async (req, res) => {
    try {
      const stats = await FileSend.getStats();
      const banques = await FileSend.getBanquesDestinataires();

      res.json({
        success: true,
        data: {
          stats: {
            totalFiles: stats.totalFiles || 0,
            totalDeposants: stats.totalDeposants || 0,
            totalBanques: stats.totalBanques || 0,
            totalSize: stats.totalSize || 0,
            averageSize: Math.round(stats.averageSize || 0),
            sentCount: stats.sentCount || 0,
            deliveredCount: stats.deliveredCount || 0,
            readCount: stats.readCount || 0,
            downloadedCount: stats.downloadedCount || 0
          },
          banques: banques.map(banque => ({
            name: banque.banque_destinataire,
            code: banque.banque_code
          }))
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  };

  // Supprimer un fichier envoyé
  deleteFile = async (req, res) => {
    try {
      const { id } = req.params;

      // Récupérer les informations du fichier
      const files = await FileSend.findAllPaginated({ page: 1, limit: 1 });
      const file = files.find(f => f.id == id);

      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'Fichier non trouvé'
        });
      }

      // Vérifier que l'utilisateur peut supprimer ce fichier
      if (file.deposantId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas l\'autorisation de supprimer ce fichier'
        });
      }

      // Supprimer le fichier du disque
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }

      // Supprimer de la base de données
      await FileSend.delete(id);

      res.json({
        success: true,
        message: 'Fichier supprimé avec succès'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  };

  // Statistiques pour admin/nsia_vie (toutes les banques)
  getStats = async (req, res) => {
    try {
      const stats = await FileSend.getStats();
      const recentFiles = await FileSend.getRecentFiles(5);
      const filesByBank = await FileSend.getFilesByBank();

      res.json({
        success: true,
        data: {
          totalFiles: stats.totalFiles,
          totalDownloads: stats.totalDownloads,
          totalSize: stats.totalSize,
          recentUploads: stats.recentUploads,
          filesByStatus: stats.filesByStatus,
          filesByBank,
          recentFiles: recentFiles.map(file => ({
            id: file.id,
            originalName: file.originalName,
            fileSize: file.fileSize,
            fileType: file.fileType,
            deposantNom: file.deposantNom,
            banqueDestinataire: file.banqueDestinataire,
            createdAt: file.createdAt,
            downloadCount: file.downloadCount
          }))
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  };

  // Statistiques pour utilisateurs normaux (leur banque uniquement)
  getStatsUser = async (req, res) => {
    try {
      const banqueDestinataire = req.user.banque || '';
      
      if (!banqueDestinataire) {
        return res.status(400).json({
          success: false,
          message: 'Banque non définie pour cet utilisateur'
        });
      }

      const stats = await FileSend.getStatsByBank(banqueDestinataire);
      const recentFiles = await FileSend.getRecentFilesByBank(banqueDestinataire, 5);

      res.json({
        success: true,
        data: {
          totalFiles: stats.totalFiles,
          totalDownloads: stats.totalDownloads,
          totalSize: stats.totalSize,
          recentUploads: stats.recentUploads,
          filesByStatus: stats.filesByStatus,
          recentFiles: recentFiles.map(file => ({
            id: file.id,
            originalName: file.originalName,
            fileSize: file.fileSize,
            fileType: file.fileType,
            deposantNom: file.deposantNom,
            banqueDestinataire: file.banqueDestinataire,
            createdAt: file.createdAt,
            downloadCount: file.downloadCount
          }))
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  };

  // Statistiques complètes pour admin/nsia_vie (toutes les données sans filtre de période)
  async getStatsComplete(req, res) {
    try {
      const stats = await FileSend.getStatsComplete();
      const recentFiles = await FileSend.getRecentFiles(5);
      const filesByBank = await FileSend.getFilesByBank();

      res.json({
        success: true,
        data: {
          totalFiles: stats.totalFiles,
          totalDownloads: stats.totalDownloads,
          totalSize: stats.totalSize,
          recentUploads: stats.recentUploads,
          filesByStatus: stats.filesByStatus,
          filesByBank,
          recentFiles: recentFiles.map(file => ({
            id: file.id,
            originalName: file.original_name,
            fileSize: file.file_size,
            fileType: file.file_type,
            deposantNom: file.deposant_nom,
            banqueDestinataire: file.banque_destinataire,
            created_at: file.created_at,
            downloadCount: file.download_count
          }))
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  }

  // Statistiques complètes pour utilisateurs normaux (toutes leurs données sans filtre de période)
  async getStatsUserComplete(req, res) {
    try {
      const banqueDestinataire = req.user.banque || '';
      
      if (!banqueDestinataire) {
        return res.status(400).json({
          success: false,
          message: 'Banque non définie pour cet utilisateur'
        });
      }

      const stats = await FileSend.getStatsByBankComplete(banqueDestinataire);
      const recentFiles = await FileSend.getRecentFilesByBank(banqueDestinataire, 5);

      res.json({
        success: true,
        data: {
          totalFiles: stats.totalFiles,
          totalDownloads: stats.totalDownloads,
          totalSize: stats.totalSize,
          recentUploads: stats.recentUploads,
          filesByStatus: stats.filesByStatus,
          recentFiles: recentFiles.map(file => ({
            id: file.id,
            originalName: file.original_name,
            fileSize: file.file_size,
            fileType: file.file_type,
            deposantNom: file.deposant_nom,
            banqueDestinataire: file.banque_destinataire,
            created_at: file.created_at,
            downloadCount: file.download_count
          }))
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  }

  // Envoyer des notifications email pour les nouveaux fichiers
  async sendFileNotifications(files, banqueDestinataire, description, sender) {
    try {
      // Récupérer les emails des utilisateurs de la banque destinataire
      let recipientEmails = [];
      let ccEmails = [];
      
      if (sender.role === 'user') {
        // Si c'est un user qui envoie, notifier admin et nsia_vie
        recipientEmails = await UserNotificationService.getEmailsByRole(['admin', 'nsia_vie']);
        // En copie : tous les autres users de sa banque
        ccEmails = await UserNotificationService.getEmailsByBanqueExcludingSender(sender.banque, sender.id);
      } else {
        // Si c'est admin/nsia_vie qui envoie, notifier tous les users de la banque destinataire
        recipientEmails = await UserNotificationService.getEmailsByBanque(banqueDestinataire);
        // En copie : tous les autres admin et nsia_vie
        ccEmails = await UserNotificationService.getEmailsByRoleExcludingSender(['admin', 'nsia_vie'], sender.id);
      }

      if (recipientEmails.length === 0) {
        console.log(`⚠️ Aucun utilisateur trouvé pour la banque ${banqueDestinataire}`);
        return;
      }

      // Récupérer le nom du produit si disponible
      let productName = null;
      if (files.length > 0 && files[0].productId) {
        try {
          const BanqueProduct = require('../models/BanqueProduct');
          const product = await BanqueProduct.getProductById(files[0].productId);
          if (product) {
            productName = product.product_name;
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du produit:', error);
        }
      }

      // Préparer les données pour l'email
      const fileData = {
        files: files.map(file => ({
          originalName: file.originalName,
          fileSize: file.fileSize
        })),
        banqueDestinataire,
        description,
        productName
      };

      const senderInfo = {
        senderName: sender.name,
        senderRole: sender.role,
        senderBanque: sender.banque
      };

      // Envoyer l'email
      const emailResult = await emailService.sendFileNotification(recipientEmails, fileData, senderInfo, ccEmails);
      
      if (emailResult.success) {
        const ccMessage = ccEmails.length > 0 ? ` (${ccEmails.length} en copie)` : '';
        console.log(`✅ Notifications envoyées à ${recipientEmails.length} utilisateur(s) de ${banqueDestinataire}${ccMessage}`);
      } else {
        console.error('❌ Échec de l\'envoi des notifications:', emailResult.error);
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi des notifications:', error);
      throw error;
    }
  }
}

module.exports = new FileSendController();
