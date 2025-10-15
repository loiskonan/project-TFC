// Middleware de sécurité SQL pour prévenir les injections
class SQLSecurityMiddleware {
  
  // Whitelist des valeurs autorisées pour chaque champ
  static ALLOWED_VALUES = {
    roles: ['admin', 'user', 'nsia_vie'],
    statuses: ['active', 'inactive'],
    banks: ['NSIA BANQUE', 'SGBCI', 'UBA', 'ECOBANK', 'Banque Atlantique'],
    fileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/zip', 'application/x-zip-compressed']
  };

  // Validation stricte des valeurs de filtres
  static validateFilterValue(value, allowedValues, fieldName = 'unknown') {
    if (!value || typeof value !== 'string') {
      console.warn(`Validation SQL: Valeur vide ou invalide pour ${fieldName}`);
      return null;
    }

    const trimmedValue = value.trim();
    if (!allowedValues.includes(trimmedValue)) {
      console.warn(`Validation SQL: Valeur non autorisée '${trimmedValue}' pour ${fieldName}`);
      return null;
    }

    return trimmedValue;
  }

  // Sanitisation des termes de recherche
  static sanitizeSearchTerm(searchTerm, maxLength = 100) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return null;
    }

    // Supprimer les caractères dangereux pour SQL
    const sanitized = searchTerm
      .replace(/[%_\\'";]/g, '') // Supprimer les caractères spéciaux SQL
      .replace(/[<>]/g, '') // Supprimer les caractères HTML
      .trim()
      .substring(0, maxLength);

    // Vérifier que le terme n'est pas vide après sanitisation
    if (sanitized.length === 0) {
      console.warn('Validation SQL: Terme de recherche vide après sanitisation');
      return null;
    }

    return sanitized;
  }

  // Validation des paramètres de pagination
  static validatePaginationParams(page, limit) {
    const validPage = Math.max(parseInt(page) || 1, 1);
    const validLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100); // Entre 1 et 100
    const validOffset = (validPage - 1) * validLimit;

    return {
      page: validPage,
      limit: validLimit,
      offset: validOffset
    };
  }

  // Validation des IDs numériques
  static validateNumericId(id, fieldName = 'id') {
    const numericId = parseInt(id);
    if (isNaN(numericId) || numericId <= 0) {
      console.warn(`Validation SQL: ID invalide '${id}' pour ${fieldName}`);
      return null;
    }
    return numericId;
  }

  // Construction sécurisée de requêtes WHERE
  static buildSecureWhereClause(conditions, params) {
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return { whereClause: '', params: [] };
    }

    // Vérifier que toutes les conditions sont des strings valides
    const validConditions = conditions.filter(condition => {
      if (typeof condition !== 'string' || condition.includes(';') || condition.includes('--')) {
        console.warn('Validation SQL: Condition WHERE suspecte détectée:', condition);
        return false;
      }
      return true;
    });

    const whereClause = validConditions.length > 0 ? `WHERE ${validConditions.join(' AND ')}` : '';
    
    return {
      whereClause,
      params: Array.isArray(params) ? params : []
    };
  }

  // Middleware pour valider les paramètres de requête
  static validateRequestParams(req, res, next) {
    try {
      // Valider les paramètres de pagination
      if (req.query.page || req.query.limit) {
        const pagination = this.validatePaginationParams(req.query.page, req.query.limit);
        req.query.page = pagination.page;
        req.query.limit = pagination.limit;
      }

      // Valider les filtres de recherche
      if (req.query.search) {
        req.query.search = this.sanitizeSearchTerm(req.query.search);
      }

      // Valider les filtres de rôle
      if (req.query.role) {
        req.query.role = this.validateFilterValue(req.query.role, this.ALLOWED_VALUES.roles, 'role');
      }

      // Valider les filtres de statut
      if (req.query.status) {
        req.query.status = this.validateFilterValue(req.query.status, this.ALLOWED_VALUES.statuses, 'status');
      }

      // Valider les filtres de banque
      if (req.query.banque) {
        req.query.banque = this.validateFilterValue(req.query.banque, this.ALLOWED_VALUES.banks, 'banque');
      }

      // Valider les IDs dans les paramètres de route
      if (req.params.id) {
        req.params.id = this.validateNumericId(req.params.id, 'route_id');
        if (!req.params.id) {
          return res.status(400).json({
            success: false,
            message: 'ID invalide dans l\'URL'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Erreur de validation des paramètres:', error);
      return res.status(400).json({
        success: false,
        message: 'Paramètres de requête invalides'
      });
    }
  }

  // Logging des tentatives d'injection SQL
  static logSuspiciousActivity(req, suspiciousValue, fieldName) {
    console.warn(`🚨 ACTIVITÉ SUSPECTE DÉTECTÉE:`);
    console.warn(`   IP: ${req.ip || req.connection.remoteAddress}`);
    console.warn(`   User-Agent: ${req.get('User-Agent')}`);
    console.warn(`   Champ: ${fieldName}`);
    console.warn(`   Valeur suspecte: ${suspiciousValue}`);
    console.warn(`   Timestamp: ${new Date().toISOString()}`);
    
    // Ici vous pourriez ajouter l'envoi vers un système de monitoring
    // ou une base de données de logs de sécurité
  }
}

module.exports = SQLSecurityMiddleware;

class SQLSecurityMiddleware {
  
  // Whitelist des valeurs autorisées pour chaque champ
  static ALLOWED_VALUES = {
    roles: ['admin', 'user', 'nsia_vie'],
    statuses: ['active', 'inactive'],
    banks: ['NSIA BANQUE', 'SGBCI', 'UBA', 'ECOBANK', 'Banque Atlantique'],
    fileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/zip', 'application/x-zip-compressed']
  };

  // Validation stricte des valeurs de filtres
  static validateFilterValue(value, allowedValues, fieldName = 'unknown') {
    if (!value || typeof value !== 'string') {
      console.warn(`Validation SQL: Valeur vide ou invalide pour ${fieldName}`);
      return null;
    }

    const trimmedValue = value.trim();
    if (!allowedValues.includes(trimmedValue)) {
      console.warn(`Validation SQL: Valeur non autorisée '${trimmedValue}' pour ${fieldName}`);
      return null;
    }

    return trimmedValue;
  }

  // Sanitisation des termes de recherche
  static sanitizeSearchTerm(searchTerm, maxLength = 100) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return null;
    }

    // Supprimer les caractères dangereux pour SQL
    const sanitized = searchTerm
      .replace(/[%_\\'";]/g, '') // Supprimer les caractères spéciaux SQL
      .replace(/[<>]/g, '') // Supprimer les caractères HTML
      .trim()
      .substring(0, maxLength);

    // Vérifier que le terme n'est pas vide après sanitisation
    if (sanitized.length === 0) {
      console.warn('Validation SQL: Terme de recherche vide après sanitisation');
      return null;
    }

    return sanitized;
  }

  // Validation des paramètres de pagination
  static validatePaginationParams(page, limit) {
    const validPage = Math.max(parseInt(page) || 1, 1);
    const validLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100); // Entre 1 et 100
    const validOffset = (validPage - 1) * validLimit;

    return {
      page: validPage,
      limit: validLimit,
      offset: validOffset
    };
  }

  // Validation des IDs numériques
  static validateNumericId(id, fieldName = 'id') {
    const numericId = parseInt(id);
    if (isNaN(numericId) || numericId <= 0) {
      console.warn(`Validation SQL: ID invalide '${id}' pour ${fieldName}`);
      return null;
    }
    return numericId;
  }

  // Construction sécurisée de requêtes WHERE
  static buildSecureWhereClause(conditions, params) {
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return { whereClause: '', params: [] };
    }

    // Vérifier que toutes les conditions sont des strings valides
    const validConditions = conditions.filter(condition => {
      if (typeof condition !== 'string' || condition.includes(';') || condition.includes('--')) {
        console.warn('Validation SQL: Condition WHERE suspecte détectée:', condition);
        return false;
      }
      return true;
    });

    const whereClause = validConditions.length > 0 ? `WHERE ${validConditions.join(' AND ')}` : '';
    
    return {
      whereClause,
      params: Array.isArray(params) ? params : []
    };
  }

  // Middleware pour valider les paramètres de requête
  static validateRequestParams(req, res, next) {
    try {
      // Valider les paramètres de pagination
      if (req.query.page || req.query.limit) {
        const pagination = this.validatePaginationParams(req.query.page, req.query.limit);
        req.query.page = pagination.page;
        req.query.limit = pagination.limit;
      }

      // Valider les filtres de recherche
      if (req.query.search) {
        req.query.search = this.sanitizeSearchTerm(req.query.search);
      }

      // Valider les filtres de rôle
      if (req.query.role) {
        req.query.role = this.validateFilterValue(req.query.role, this.ALLOWED_VALUES.roles, 'role');
      }

      // Valider les filtres de statut
      if (req.query.status) {
        req.query.status = this.validateFilterValue(req.query.status, this.ALLOWED_VALUES.statuses, 'status');
      }

      // Valider les filtres de banque
      if (req.query.banque) {
        req.query.banque = this.validateFilterValue(req.query.banque, this.ALLOWED_VALUES.banks, 'banque');
      }

      // Valider les IDs dans les paramètres de route
      if (req.params.id) {
        req.params.id = this.validateNumericId(req.params.id, 'route_id');
        if (!req.params.id) {
          return res.status(400).json({
            success: false,
            message: 'ID invalide dans l\'URL'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Erreur de validation des paramètres:', error);
      return res.status(400).json({
        success: false,
        message: 'Paramètres de requête invalides'
      });
    }
  }

  // Logging des tentatives d'injection SQL
  static logSuspiciousActivity(req, suspiciousValue, fieldName) {
    console.warn(`🚨 ACTIVITÉ SUSPECTE DÉTECTÉE:`);
    console.warn(`   IP: ${req.ip || req.connection.remoteAddress}`);
    console.warn(`   User-Agent: ${req.get('User-Agent')}`);
    console.warn(`   Champ: ${fieldName}`);
    console.warn(`   Valeur suspecte: ${suspiciousValue}`);
    console.warn(`   Timestamp: ${new Date().toISOString()}`);
    
    // Ici vous pourriez ajouter l'envoi vers un système de monitoring
    // ou une base de données de logs de sécurité
  }
}

module.exports = SQLSecurityMiddleware;



