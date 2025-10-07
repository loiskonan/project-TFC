const File = require('../models/File');
const Banque = require('../models/Banque');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const emailService = require('../services/emailService');
const UserNotificationService = require('../services/userNotificationService');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Extensions de fichiers dangereux à bloquer
const DANGEROUS_EXTENSIONS = [
  '.exe', '.msi', '.bat', '.cmd', '.com', '.scr', '.pif',
  '.vbs', '.js', '.jar', '.php', '.asp', '.aspx', '.jsp',
  '.py', '.pl', '.rb', '.sh', '.ps1', '.cgi', '.reg',
  '.inf', '.sys', '.dll', '.ocx', '.cab', '.mdb', '.accdb',
  '.db', '.sql', '.htaccess', '.htpasswd', '.conf', '.ini',
  '.cfg', '.log', '.tmp', '.temp', '.cache'
];

// Extensions de fichiers autorisés
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.rtf', '.jpg', '.jpeg', '.png', '.gif', '.bmp',
  '.tiff', '.svg', '.zip', '.rar', '.7z', '.tar', '.gz',
  '.mp3', '.mp4', '.avi', '.mov', '.wav'
];

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Bloquer les extensions dangereuses
    if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
      return cb(new Error(`Type de fichier dangereux non autorisé: ${fileExtension}`), false);
    }
    
    // Accepter les extensions autorisées
    if (ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return cb(null, true);
    }
    
    // Bloquer les autres types par défaut
    return cb(new Error(`Type de fichier non autorisé: ${fileExtension}`), false);
  }
});

class UserUploadController {
  // Upload d'un fichier par un utilisateur (rôle 'user' uniquement)
  static async uploadFile(req, res) {
    try {
      // Vérifier que l'utilisateur a le rôle 'user'
      if (req.user.role !== 'user') {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Seuls les utilisateurs peuvent déposer des fichiers.'
        });
      }

      // Vérifier que l'utilisateur a une banque assignée
      if (!req.user.banque) {
        return res.status(400).json({
          success: false,
          message: 'Vous devez avoir une banque assignée pour déposer des fichiers.'
        });
      }

      // Utiliser multer pour gérer l'upload
      upload.single('file')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message || 'Erreur lors de l\'upload'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'Aucun fichier fourni'
          });
        }

        const { description } = req.body;
        
        if (!description || description.trim().length === 0) {
          // Supprimer le fichier uploadé si pas de description
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            success: false,
            message: 'La description est obligatoire'
          });
        }

        // Vérifier que le nom de fichier n'existe pas déjà pour cette banque
        try {
          const fileNameExists = await File.fileNameExists(req.file.originalname, req.user.banque);
          if (fileNameExists) {
            // Supprimer le fichier uploadé
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
              success: false,
              message: `Un fichier avec le nom "${req.file.originalname}" existe déjà pour votre banque. Veuillez renommer le fichier ou utiliser un autre fichier.`
            });
          }
        } catch (error) {
          // Supprimer le fichier uploadé
          fs.unlinkSync(req.file.path);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification du nom de fichier'
          });
        }

        // Préparer les données du fichier avec informations complètes du déposant
        const fileData = {
          name: req.file.filename,
          originalName: req.file.originalname,
          description: description.trim(),
          deposantNom: req.user.name,
          deposantEmail: req.user.email,
          deposantBanque: req.user.banque,
          filePath: req.file.path.replace(path.join(__dirname, '..', '..'), ''),
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          uploadedBy: req.user.id,
          isPublic: false
        };

        // Sauvegarder en base de données
        const fileId = await File.create(fileData);
        const newFile = await File.findById(fileId);

        res.status(201).json({
          success: true,
          message: 'Fichier déposé avec succès',
          file: {
            id: newFile.id,
            name: newFile.name,
            originalName: newFile.original_name,
            description: newFile.description,
            deposantNom: newFile.deposant_nom,
            deposantEmail: newFile.deposant_email,
            deposantBanque: newFile.deposant_banque,
            fileSize: newFile.file_size,
            fileType: newFile.file_type,
            uploadedAt: newFile.uploaded_at
          }
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Upload de plusieurs fichiers avec transaction
  static async uploadMultipleFiles(req, res) {
    try {
      // Vérifier que l'utilisateur a le rôle 'user'
      if (req.user.role !== 'user') {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Seuls les utilisateurs peuvent déposer des fichiers.'
        });
      }

      // Vérifier que l'utilisateur a une banque assignée
      if (!req.user.banque) {
        return res.status(400).json({
          success: false,
          message: 'Vous devez avoir une banque assignée pour déposer des fichiers.'
        });
      }

      // Utiliser multer pour gérer l'upload multiple
      upload.array('files', 10)(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message || 'Erreur lors de l\'upload'
          });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Aucun fichier fourni'
          });
        }

        // Récupérer la description et les produits après le traitement multer
        const { description, file_products } = req.body;
        
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
        
        if (!description || description.trim().length === 0) {
          // Supprimer tous les fichiers uploadés
          req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
          
          return res.status(400).json({
            success: false,
            message: 'La description est obligatoire'
          });
        }

        // Vérifier que tous les fichiers ont un produit associé
        if (!parsedProducts || !Array.isArray(parsedProducts) || parsedProducts.length !== req.files.length) {
          // Supprimer tous les fichiers uploadés
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

        // Vérifier que les noms de fichiers n'existent pas déjà pour cette banque
        try {
          const duplicateFiles = [];
          for (const file of req.files) {
            const fileNameExists = await File.fileNameExists(file.originalname, req.user.banque);
            if (fileNameExists) {
              duplicateFiles.push(file.originalname);
            }
          }
          
          if (duplicateFiles.length > 0) {
            // Supprimer tous les fichiers uploadés
            req.files.forEach(file => {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            });
            
            return res.status(400).json({
              success: false,
              message: `Le(s) fichier(s) suivant(s) existe(nt) déjà  : ${duplicateFiles.join(', ')}. Veuillez renommer ce(s) fichier(s) ou utiliser d'autre(s) fichier(s).`
            });
          }
        } catch (error) {
          // Supprimer tous les fichiers uploadés
          req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
          
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification des noms de fichiers'
          });
        }

        const uploadedFiles = [];
        const errors = [];
        const uploadedFilePaths = [];

        // Première passe : valider tous les fichiers
        for (const file of req.files) {
          try {
            // Accepter tous les types de fichiers
            // Note: La validation du type de fichier est désactivée pour permettre tous les formats

            uploadedFilePaths.push(file.path);
          } catch (error) {
            errors.push({
              fileName: file.originalname,
              error: 'Erreur lors de la validation du fichier'
            });
            // Supprimer le fichier uploadé
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          }
        }

        // Si il y a des erreurs, tout annuler
        if (errors.length > 0) {
          // Supprimer tous les fichiers uploadés
          uploadedFilePaths.forEach(filePath => {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });

          return res.status(400).json({
            success: false,
            message: 'Échec de l\'upload - certains fichiers ne sont pas autorisés',
            errors: errors,
            failedFiles: errors.map(e => e.fileName)
          });
        }

        // Deuxième passe : sauvegarder en base de données avec transaction
        const db = require('../config/db');
        
        // Utiliser une connexion du pool pour la transaction
        db.getConnection((err, connection) => {
          if (err) {
            // Supprimer tous les fichiers uploadés
            uploadedFilePaths.forEach(filePath => {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            });

            return res.status(500).json({
              success: false,
              message: 'Erreur lors de l\'obtention d\'une connexion'
            });
          }

          // Commencer la transaction
          connection.beginTransaction(async (err) => {
            if (err) {
              connection.release();
              // Supprimer tous les fichiers uploadés
              uploadedFilePaths.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                }
              });

              return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'initialisation de la transaction'
              });
            }

            try {
              for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const productId = parseInt(parsedProducts[i]);
                
                const fileData = {
                  name: file.filename,
                  originalName: file.originalname,
                  description: description.trim(),
                  deposantNom: req.user.name,
                  deposantEmail: req.user.email,
                  deposantBanque: req.user.banque,
                  filePath: file.path.replace(path.join(__dirname, '..', '..'), ''),
                  fileSize: file.size,
                  fileType: file.mimetype,
                  uploadedBy: req.user.id,
                  isPublic: false,
                  productId: productId
                };

                const fileId = await File.create(fileData);
                const newFile = await File.findById(fileId);
                
                uploadedFiles.push({
                  id: newFile.id,
                  name: newFile.name,
                  originalName: newFile.original_name,
                  description: newFile.description,
                  deposantNom: newFile.deposant_nom,
                  deposantEmail: newFile.deposant_email,
                  deposantBanque: newFile.deposant_banque,
                  fileSize: newFile.file_size,
                  fileType: newFile.file_type,
                  uploadedAt: newFile.uploaded_at,
                  productId: newFile.product_id
                });
              }

              // Valider la transaction
              connection.commit(async (err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    // Supprimer tous les fichiers uploadés
                    uploadedFilePaths.forEach(filePath => {
                      if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                      }
                    });

                    res.status(500).json({
                      success: false,
                      message: 'Erreur lors de la validation de la transaction'
                    });
                  });
                }

                connection.release();
                
                // Envoyer des notifications email aux autres utilisateurs de la banque
                try {
                  await UserUploadController.sendFileNotifications(uploadedFiles, req.user.banque, description, req.user);
                } catch (emailError) {
                  console.error('Erreur lors de l\'envoi des notifications email:', emailError);
                  // Ne pas faire échouer l'upload si l'email échoue
                }
                
                res.status(201).json({
                  success: true,
                  message: `Tous les fichiers (${uploadedFiles.length}) ont été déposés avec succès`,
                  files: uploadedFiles,
                  totalFiles: uploadedFiles.length
                });
              });

            } catch (error) {
              // Annuler la transaction
              connection.rollback(() => {
                connection.release();
                // Supprimer tous les fichiers uploadés
                uploadedFilePaths.forEach(filePath => {
                  if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                  }
                });

                res.status(500).json({
                  success: false,
                  message: 'Erreur lors de la sauvegarde en base de données',
                  error: error.message
                });
              });
            }
          });
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer les fichiers déposés par l'utilisateur connecté avec pagination et filtres
  static async getUserDeposits(req, res) {
    try {
      // Vérifier que l'utilisateur a le rôle 'user'
      if (req.user.role !== 'user') {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Seuls les utilisateurs peuvent voir leurs dépôts.'
        });
      }

      // Vérifier que l'utilisateur a une banque assignée
      if (!req.user.banque) {
        return res.status(400).json({
          success: false,
          message: 'Banque non définie pour cet utilisateur'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = 10; // 10 éléments par page
      
      // Récupérer les filtres depuis les paramètres de requête
      const filters = {
        searchTerm: req.query.search || '',
        fileType: req.query.fileType || 'all',
        banque: req.user.banque, // Filtrer par banque de l'utilisateur
        product: req.query.product || 'all'
      };
      
      const result = await File.findByBanquePaginated(req.user.banque, page, limit, filters);
      
      res.json({
        success: true,
        deposits: result.files.map(file => ({
          id: file.id,
          name: file.name,
          originalName: file.original_name,
          description: file.description,
          deposantNom: file.deposant_nom,
          deposantEmail: file.deposant_email,
          deposantBanque: file.deposant_banque,
          fileSize: file.file_size,
          fileType: file.file_type,
          downloadCount: file.download_count,
          uploadedAt: file.uploaded_at,
          productId: file.product_id,
          productName: file.product_name,
          productCode: file.code_produit
        })),
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer tous les dépôts (pour les administrateurs et NSIA Vie) avec pagination et filtres
  static async getAllDeposits(req, res) {
    try {
      // Vérifier que l'utilisateur a les droits d'administration
      if (req.user.role !== 'admin' && req.user.role !== 'nsia_vie') {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Droits insuffisants.'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = 10; // 10 éléments par page
      
      // Récupérer les filtres depuis les paramètres de requête
      const filters = {
        searchTerm: req.query.search || '',
        fileType: req.query.fileType || 'all',
        banque: req.query.banque || 'all',
        product: req.query.product || 'all'
      };
      
      const result = await File.findAllPaginated(page, limit, filters);
      
      res.json({
        success: true,
        deposits: result.files.map(file => ({
          id: file.id,
          name: file.name,
          originalName: file.original_name,
          description: file.description,
          deposantNom: file.deposant_nom,
          deposantEmail: file.deposant_email,
          deposantBanque: file.deposant_banque,
          fileSize: file.file_size,
          fileType: file.file_type,
          downloadCount: file.download_count,
          uploadedAt: file.uploaded_at,
          uploadedByName: file.uploaded_by_name,
          productId: file.product_id,
          productName: file.product_name,
          productCode: file.code_produit
        })),
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Obtenir les statistiques des dépôts
  static async getDepositStats(req, res) {
    try {
      const stats = await File.getStats();
      
      res.json({
        success: true,
        stats: {
          totalDeposits: stats.total_files,
          totalSize: stats.total_size,
          totalDownloads: stats.total_downloads,
          uniqueDepositors: stats.unique_uploaders
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer la liste des banques pour les filtres
  static async getBanques(req, res) {
    try {
      const banques = await Banque.getBanquesForFilter();
      
      res.json({
        success: true,
        banques: banques
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Statistiques pour admin/nsia_vie (réceptions de toutes les banques)
  static async getStatsReceptions(req, res) {
    try {
      const stats = await File.getStatsReceptions();
      const recentFiles = await File.getRecentFilesReceptions(5);
      const filesByBank = await File.getFilesByBankReceptions();

      res.json({
        success: true,
        data: {
          totalFiles: stats.totalFiles,
          totalDownloads: stats.totalDownloads,
          totalSize: stats.totalSize,
          recentUploads: stats.recentUploads,
          filesByBank,
          recentFiles: recentFiles.map(file => ({
            id: file.id,
            original_name: file.original_name,
            file_size: file.file_size,
            file_type: file.file_type,
            deposant_nom: file.deposant_nom,
            deposant_banque: file.deposant_banque,
            created_at: file.created_at,
            download_count: file.download_count
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

  // Statistiques pour utilisateurs normaux (leurs envois)
  static async getStatsUser(req, res) {
    try {
      const banqueDestinataire = req.user.banque || '';
      
      if (!banqueDestinataire) {
        return res.status(400).json({
          success: false,
          message: 'Banque non définie pour cet utilisateur'
        });
      }

      const stats = await File.getStatsByBank(banqueDestinataire);
      const recentFiles = await File.getRecentFilesByBank(banqueDestinataire, 5);

      res.json({
        success: true,
        data: {
          totalFiles: stats.totalFiles,
          totalDownloads: stats.totalDownloads,
          totalSize: stats.totalSize,
          recentUploads: stats.recentUploads,
          recentFiles: recentFiles.map(file => ({
            id: file.id,
            original_name: file.original_name,
            file_size: file.file_size,
            file_type: file.file_type,
            deposant_nom: file.deposant_nom,
            deposant_banque: file.deposant_banque,
            created_at: file.created_at,
            download_count: file.download_count
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

  // Statistiques complètes pour admin/nsia_vie (réceptions de toutes les banques sans filtre de période)
  static async getStatsReceptionsComplete(req, res) {
    try {
      const stats = await File.getStatsReceptionsComplete();
      const recentFiles = await File.getRecentFilesReceptions(5);
      const filesByBank = await File.getFilesByBankReceptions();

      res.json({
        success: true,
        data: {
          totalFiles: stats.totalFiles,
          totalDownloads: stats.totalDownloads,
          totalSize: stats.totalSize,
          recentUploads: stats.recentUploads,
          filesByBank,
          recentFiles: recentFiles.map(file => ({
            id: file.id,
            original_name: file.original_name,
            file_size: file.file_size,
            file_type: file.file_type,
            deposant_nom: file.deposant_nom,
            deposant_banque: file.deposant_banque,
            created_at: file.created_at,
            download_count: file.download_count
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

  // Statistiques complètes pour utilisateurs normaux (leurs envois sans filtre de période)
  static async getStatsUserComplete(req, res) {
    try {
      const banqueDestinataire = req.user.banque || '';
      
      if (!banqueDestinataire) {
        return res.status(400).json({
          success: false,
          message: 'Banque non définie pour cet utilisateur'
        });
      }

      const stats = await File.getStatsByBankComplete(banqueDestinataire);
      const recentFiles = await File.getRecentFilesByBank(banqueDestinataire, 5);

      res.json({
        success: true,
        data: {
          totalFiles: stats.totalFiles,
          totalDownloads: stats.totalDownloads,
          totalSize: stats.totalSize,
          recentUploads: stats.recentUploads,
          recentFiles: recentFiles.map(file => ({
            id: file.id,
            original_name: file.original_name,
            file_size: file.file_size,
            file_type: file.file_type,
            deposant_nom: file.deposant_nom,
            deposant_banque: file.deposant_banque,
            created_at: file.created_at,
            download_count: file.download_count
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

  // Envoyer des notifications email pour les nouveaux fichiers déposés
  static async sendFileNotifications(files, banqueDestinataire, description, sender) {
    try {
      // Récupérer les emails des admin et nsia_vie (pour être notifiés des dépôts des users)
      const recipientEmails = await UserNotificationService.getEmailsByRole(['admin', 'nsia_vie']);
      // En copie : tous les autres users de sa banque
      const ccEmails = await UserNotificationService.getEmailsByBanqueExcludingSender(sender.banque, sender.id);

      if (recipientEmails.length === 0) {
        console.log(`⚠️ Aucun admin ou NSIA Vie trouvé pour recevoir les notifications`);
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
        console.log(`✅ Notifications envoyées à ${recipientEmails.length} admin/NSIA Vie${ccMessage}`);
      } else {
        console.error('❌ Échec de l\'envoi des notifications:', emailResult.error);
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi des notifications:', error);
      throw error;
    }
  }
}

module.exports = UserUploadController;
