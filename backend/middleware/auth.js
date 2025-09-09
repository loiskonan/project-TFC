const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware pour vérifier l'authentification
const authenticateToken = async (req, res, next) => {
  try {
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// Middleware pour vérifier les droits d'administrateur
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits d\'administrateur requis.'
    });
  }

  next();
};

// Middleware pour vérifier les droits d'admin ou nsia_vie
const requireAdminOrNsiaVie = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'nsia_vie') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits d\'administrateur ou NSIA Vie requis.'
    });
  }

  next();
};

// Middleware combiné pour les routes admin
const requireAuthAndAdmin = [authenticateToken, requireAdmin];

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminOrNsiaVie,
  requireAuthAndAdmin
};
