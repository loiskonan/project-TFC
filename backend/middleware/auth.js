const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware pour vérifier l'authentification
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 Authentification - Méthode:', req.method, 'URL:', req.url);
    console.log('🔐 Headers:', req.headers);
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ Token manquant');
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    console.log('🔐 Token trouvé, vérification...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔐 Token décodé:', decoded);
    
    const user = await User.findById(decoded.id);
    console.log('🔐 Utilisateur trouvé:', user ? user.email : 'Non trouvé');

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.isActive) {
      console.log('❌ Compte désactivé');
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    console.log('✅ Authentification réussie pour:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error);
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// Middleware pour vérifier les droits d'administrateur
const requireAdmin = (req, res, next) => {
  console.log('👑 Vérification admin - Utilisateur:', req.user?.email, 'Rôle:', req.user?.role);
  
  if (!req.user) {
    console.log('❌ Pas d\'utilisateur authentifié');
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin') {
    console.log('❌ Accès refusé - Rôle insuffisant:', req.user.role);
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits d\'administrateur requis.'
    });
  }

  console.log('✅ Accès admin autorisé pour:', req.user.email);
  next();
};

// Middleware combiné pour les routes admin
const requireAuthAndAdmin = [authenticateToken, requireAdmin];

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAuthAndAdmin
};
