const Banque = require('../models/Banque');

// Service de validation dynamique pour les banques
class DynamicValidationService {
  // Cache pour les banques valides (évite les requêtes répétées)
  static banquesCache = null;
  static cacheExpiry = null;
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Récupérer les banques valides depuis la base de données
  static async getValidBanques() {
    try {
      // Vérifier le cache
      if (this.banquesCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
        return this.banquesCache;
      }

      // Récupérer depuis la base de données
      const banques = await Banque.getBanquesForFilter();
      
      // Mettre à jour le cache
      this.banquesCache = banques;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      
      console.log(`✅ Cache des banques mis à jour: ${banques.length} banques`);
      return banques;
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des banques:', error);
      
      // En cas d'erreur, utiliser le cache existant ou une liste de fallback
      if (this.banquesCache) {
        console.log('⚠️ Utilisation du cache existant en cas d\'erreur');
        return this.banquesCache;
      }
      
      // Liste de fallback en cas d'erreur critique
      console.log('⚠️ Utilisation de la liste de fallback');
      return ['NSIA BANQUE', 'SGBCI', 'UBA', 'ECOBANK', 'Banque Atlantique'];
    }
  }

  // Valider une banque contre la liste dynamique
  static async validateBanque(banqueValue) {
    if (!banqueValue || typeof banqueValue !== 'string') {
      return null;
    }

    const trimmedBanque = banqueValue.trim();
    const validBanques = await this.getValidBanques();
    
    return validBanques.includes(trimmedBanque) ? trimmedBanque : null;
  }

  // Invalider le cache (à appeler quand une banque est ajoutée/modifiée/supprimée)
  static invalidateCache() {
    this.banquesCache = null;
    this.cacheExpiry = null;
    console.log('🔄 Cache des banques invalidé');
  }

  // Obtenir les statistiques du cache
  static getCacheStats() {
    return {
      hasCache: !!this.banquesCache,
      cacheSize: this.banquesCache ? this.banquesCache.length : 0,
      expiresIn: this.cacheExpiry ? Math.max(0, this.cacheExpiry - Date.now()) : 0,
      isValid: this.cacheExpiry && Date.now() < this.cacheExpiry
    };
  }
}

module.exports = DynamicValidationService;
