const crypto = require('crypto');

/**
 * Génère un mot de passe sécurisé et déterministe basé sur le nom de la banque
 * @param {string} bankName - Nom de la banque
 * @returns {string} - Mot de passe généré
 */
const generatePasswordForBank = (bankName) => {
  if (!bankName || typeof bankName !== 'string') {
    throw new Error('Nom de banque invalide');
  }

  // 1. Nettoyage du nom de banque
  const cleanBankName = bankName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Supprimer caractères spéciaux
    .substring(0, 8); // Limiter à 8 caractères

  // 2. Génération d'un hash basé sur le nom
  const hash = crypto.createHash('sha256').update(cleanBankName).digest('hex');
  
  // 3. Extraction de caractères du hash
  const chars = hash.substring(0, 16); // Prendre les 16 premiers caractères
  
  // 4. Transformation en mot de passe lisible
  let password = '';
  const specialChars = '@#$%&*';
  const numbers = '0123456789';
  
  for (let i = 0; i < 8; i++) {
    const charCode = chars.charCodeAt(i % chars.length);
    
    if (i === 0) {
      // Premier caractère : lettre minuscule
      password += String.fromCharCode(97 + (charCode % 26));
    } else if (i === 1) {
      // Deuxième caractère : lettre majuscule
      password += String.fromCharCode(65 + (charCode % 26));
    } else if (i === 2) {
      // Troisième caractère : chiffre
      password += numbers[charCode % 10];
    } else if (i === 3) {
      // Quatrième caractère : caractère spécial
      password += specialChars[charCode % specialChars.length];
    } else {
      // Caractères restants : mélange aléatoire
      const rand = charCode % 4;
      switch (rand) {
        case 0:
          password += String.fromCharCode(97 + (charCode % 26)); // minuscule
          break;
        case 1:
          password += String.fromCharCode(65 + (charCode % 26)); // majuscule
          break;
        case 2:
          password += numbers[charCode % 10]; // chiffre
          break;
        case 3:
          password += specialChars[charCode % specialChars.length]; // spécial
          break;
      }
    }
  }
  
  return password;
};

/**
 * Récupère le mot de passe pour une banque donnée
 * @param {string} bankName - Nom de la banque
 * @returns {string} - Mot de passe généré ou fallback
 */
const getPasswordForBank = (bankName) => {
  try {
    if (!bankName) {
      return "Default@2025"; // Fallback si pas de banque
    }
    
    const password = generatePasswordForBank(bankName);
    return password;
  } catch (error) {
    // En cas d'erreur, retourner un mot de passe par défaut sécurisé
    return "Default@2025";
  }
};

/**
 * Génère des mots de passe pour toutes les banques
 * @param {Array} banks - Liste des banques
 * @returns {Array} - Liste des banques avec leurs mots de passe
 */
const generatePasswordsForAllBanks = (banks) => {
  return banks.map(bank => ({
    ...bank,
    motDePasse: generatePasswordForBank(bank.nom)
  }));
};

module.exports = {
  generatePasswordForBank,
  getPasswordForBank,
  generatePasswordsForAllBanks
};
