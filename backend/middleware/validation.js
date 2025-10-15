const { body, validationResult } = require('express-validator');

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validation pour l'authentification
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Mot de passe requis'),
  handleValidationErrors
];

// Validation pour la création d'utilisateur
const validateCreateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail()
    .trim(),
  body('role')
    .isIn(['admin', 'nsia_vie', 'user'])
    .withMessage('Rôle invalide'),
  body('banque')
    .optional()
    .custom((value, { req }) => {
      // Si le rôle est 'user', la banque est requise
      if (req.body.role === 'user') {
        if (!value || value.trim().length === 0) {
          throw new Error('La banque est requise pour les utilisateurs');
        }
        if (value.trim().length < 2 || value.trim().length > 100) {
          throw new Error('Le nom de banque doit contenir entre 2 et 100 caractères');
        }
        if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(value.trim())) {
          throw new Error('Le nom de banque ne peut contenir que des lettres, espaces, tirets et apostrophes');
        }
      }
      // Si le rôle est 'admin' ou 'nsia_vie', la banque doit être vide ou null
      else if (req.body.role === 'admin' || req.body.role === 'nsia_vie') {
        if (value && value.trim().length > 0) {
          throw new Error('Les administrateurs et NSIA Vie ne peuvent pas être rattachés à une banque');
        }
      }
      return true;
    }),
  handleValidationErrors
];

// Validation pour la création de banque
const validateCreateBanque = [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de banque doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
    .withMessage('Le nom de banque ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Le code doit contenir entre 2 et 20 caractères')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Le code ne peut contenir que des lettres majuscules et des chiffres'),
  handleValidationErrors
];

// Validation pour l'upload de fichier
const validateFileUpload = [
  body('description')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('La description doit contenir entre 5 et 500 caractères')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-'.,!?()]+$/)
    .withMessage('La description contient des caractères non autorisés'),
  handleValidationErrors
];

// Validation pour l'envoi de fichier
const validateFileSend = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('La description doit contenir entre 5 et 500 caractères')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-'.,!?()]+$/)
    .withMessage('La description contient des caractères non autorisés'),
  body('banqueDestinataire')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de banque destinataire doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
    .withMessage('Le nom de banque destinataire ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  handleValidationErrors
];

// Validation spéciale pour les uploads de fichiers (FormData)
const validateFileUploadFormData = (req, res, next) => {
  const errors = [];
  
  // Vérifier que req.body existe
  if (!req.body) {
    return next();
  }
  
  // Vérifier la description si elle est fournie
  if (req.body.description !== undefined && req.body.description !== null) {
    const description = String(req.body.description).trim();
    if (description && (description.length < 5 || description.length > 500)) {
      errors.push({
        field: 'description',
        message: 'La description doit contenir entre 5 et 500 caractères',
        value: description
      });
    }
    if (description && !/^[a-zA-ZÀ-ÿ0-9\s\-'.,!?()]+$/.test(description)) {
      errors.push({
        field: 'description',
        message: 'La description contient des caractères non autorisés',
        value: description
      });
    }
  }
  
  // Vérifier la banque destinataire si elle est fournie
  if (req.body.banqueDestinataire !== undefined && req.body.banqueDestinataire !== null) {
    const banque = String(req.body.banqueDestinataire).trim();
    if (banque && (banque.length < 2 || banque.length > 100)) {
      errors.push({
        field: 'banqueDestinataire',
        message: 'Le nom de banque destinataire doit contenir entre 2 et 100 caractères',
        value: banque
      });
    }
    if (banque && !/^[a-zA-ZÀ-ÿ\s\-']+$/.test(banque)) {
      errors.push({
        field: 'banqueDestinataire',
        message: 'Le nom de banque destinataire ne peut contenir que des lettres, espaces, tirets et apostrophes',
        value: banque
      });
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors
    });
  }
  
  next();
};

// Validation pour la mise à jour de profil
const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail()
    .trim(),
  handleValidationErrors
];

// Validation pour les paramètres de pagination
const validatePagination = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être un entier entre 1 et 100'),
  handleValidationErrors
];

// Validation pour les filtres de recherche
const validateSearchFilters = [
  body('searchTerm')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le terme de recherche ne peut dépasser 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-'.,!?()]*$/)
    .withMessage('Le terme de recherche contient des caractères non autorisés'),
  body('fileType')
    .optional()
    .isIn(['all', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'txt'])
    .withMessage('Type de fichier invalide'),
  body('status')
    .optional()
    .isIn(['all', 'sent', 'delivered', 'read', 'downloaded'])
    .withMessage('Statut invalide'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateCreateUser,
  validateCreateBanque,
  validateFileUpload,
  validateFileSend,
  validateFileUploadFormData,
  validateUpdateProfile,
  validatePagination,
  validateSearchFilters
};

  handleValidationErrors
;

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateCreateUser,
  validateCreateBanque,
  validateFileUpload,
  validateFileSend,
  validateFileUploadFormData,
  validateUpdateProfile,
  validatePagination,
  validateSearchFilters
};
