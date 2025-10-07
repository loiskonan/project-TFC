require('dotenv').config();
const BanqueProduct = require('../models/BanqueProduct');
const Banque = require('../models/Banque');

async function recreateBanqueProductsTable() {
  try {
    console.log('Suppression de l\'ancienne table banque_products...');
    
    // Supprimer l'ancienne table
    const dropQuery = 'DROP TABLE IF EXISTS banque_products';
    await BanqueProduct.pool.execute(dropQuery);
    console.log('✅ Ancienne table supprimée');
    
    console.log('Création de la nouvelle table banque_products simplifiée...');
    await BanqueProduct.createTable();
    console.log('✅ Nouvelle table banque_products créée avec succès');
    
    // Récupérer les banques existantes
    const banques = await Banque.findAll();
    console.log(`📊 ${banques.length} banques trouvées`);
    
    if (banques.length === 0) {
      console.log('⚠️  Aucune banque trouvée. Veuillez d\'abord créer des banques.');
      process.exit(0);
    }

    // Ajouter quelques produits de test simples pour chaque banque
    const sampleProducts = [
      'Compte Courant',
      'Carte de Crédit',
      'Prêt Immobilier',
      'Assurance Vie',
      'Placement Financier'
    ];

    console.log('Ajout des produits de test pour chaque banque...');
    for (const banque of banques) {
      console.log(`\n🏦 Ajout de produits pour ${banque.nom}...`);
      
      // Ajouter 2-3 produits aléatoires par banque
      const productsToAdd = sampleProducts.slice(0, Math.floor(Math.random() * 3) + 2);
      
      for (const productName of productsToAdd) {
        await BanqueProduct.createProduct(banque.id, { product_name: productName });
        console.log(`  ✅ Produit "${productName}" ajouté`);
      }
    }

    console.log('\n🎉 Migration de la table banque_products terminée avec succès');
    console.log('📋 Structure simplifiée :');
    console.log('   - id (INT PRIMARY KEY)');
    console.log('   - banque_id (INT FOREIGN KEY)');
    console.log('   - product_name (VARCHAR)');
    console.log('   - is_active (BOOLEAN)');
    console.log('   - created_at, updated_at (TIMESTAMP)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

recreateBanqueProductsTable();

