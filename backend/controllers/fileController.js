const File = require('../models/File');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

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

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier les types de fichiers autorisés
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

class FileController {
  // Upload d'un fichier
  static async uploadFile(req, res) {
    try {
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

        // Préparer les données du fichier avec informations du déposant
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
          message: 'Fichier uploadé avec succès',
          file: newFile
        });
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer tous les fichiers
  static async getAllFiles(req, res) {
    try {
      const files = await File.findAll();
      
      res.json({
        success: true,
        files: files
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer les fichiers d'un utilisateur
  static async getUserFiles(req, res) {
    try {
      const userId = req.user.id;
      const files = await File.findByUser(userId);
      
      res.json({
        success: true,
        files: files
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Télécharger un fichier
  static async downloadFile(req, res) {
    try {
      const { id } = req.params;
      const file = await File.findById(id);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'Fichier non trouvé'
        });
      }

      // Vérifier les permissions (pour l'instant, tous les utilisateurs peuvent télécharger)
      // TODO: Implémenter un système de permissions plus avancé

      const filePath = path.join(__dirname, '..', '..', file.file_path);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Fichier physique non trouvé'
        });
      }

      // Mettre à jour le compteur de téléchargements
      await File.updateDownloadCount(id);

      console.log(`📥 Téléchargement du fichier: ${file.original_name} (ID: ${id})`);
      console.log(`📁 Chemin du fichier: ${filePath}`);

      // Envoyer le fichier avec le nom original
      res.download(filePath, file.original_name, (err) => {
        if (err) {
          console.error('Erreur lors de l\'envoi du fichier:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Erreur lors de l\'envoi du fichier'
            });
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Supprimer un fichier
  static async deleteFile(req, res) {
    try {
      const { id } = req.params;
      const file = await File.findById(id);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'Fichier non trouvé'
        });
      }

      // Vérifier que l'utilisateur est le propriétaire ou un admin
      if (file.uploaded_by !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas les permissions pour supprimer ce fichier'
        });
      }

      await File.delete(id);

      res.json({
        success: true,
        message: 'Fichier supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer les statistiques des fichiers
  static async getFileStats(req, res) {
    try {
      const stats = await File.getStats();
      
      res.json({
        success: true,
        stats: stats
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = { FileController, upload };
