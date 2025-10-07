require('dotenv').config();
const BanqueProduct = require('../models/BanqueProduct');
const Banque = require('../models/Banque');

async function createBanqueProductsTable() {
  try {
    console.log('Création de la table banque_products...');
    await BanqueProduct.createTable();
    console.log('✅ Table banque_products créée avec succès');
    
    // Récupérer les banques existantes
    const banques = await Banque.findAll();
    console.log(`📊 ${banques.length} banques trouvées`);
    
    if (banques.length === 0) {
      console.log('⚠️  Aucune banque trouvée. Veuillez d\'abord créer des banques.');
      process.exit(0);
    }

    // Ajouter quelques produits de test pour chaque banque
    const sampleProducts = [
      {
        product_name: 'Compte Courant Premium',
        product_description: 'Compte courant avec services bancaires premium',
        product_price: 15.00,
        product_category: 'Comptes',
        stock: 1000
      },
      {
        product_name: 'Carte de Crédit Gold',
        product_description: 'Carte de crédit avec avantages et assurances',
        product_price: 25.00,
        product_category: 'Cartes',
        stock: 500
      },
      {
        product_name: 'Prêt Immobilier',
        product_description: 'Prêt immobilier à taux préférentiel',
        product_price: 0.00,
        product_category: 'Prêts',
        stock: 200
      },
      {
        product_name: 'Assurance Vie',
        product_description: 'Contrat d\'assurance vie avec épargne',
        product_price: 50.00,
        product_category: 'Assurances',
        stock: 300
      },
      {
        product_name: 'Placement Financier',
        product_description: 'Produit d\'épargne avec rendement garanti',
        product_price: 100.00,
        product_category: 'Placements',
        stock: 150
      }
    ];

    console.log('Ajout des produits de test pour chaque banque...');
    for (const banque of banques) {
      console.log(`\n🏦 Ajout de produits pour ${banque.nom}...`);
      
      // Ajouter 2-3 produits aléatoires par banque
      const productsToAdd = sampleProducts.slice(0, Math.floor(Math.random() * 3) + 2);
      
      for (const product of productsToAdd) {
        await BanqueProduct.createProduct(banque.id, product);
        console.log(`  ✅ Produit "${product.product_name}" ajouté`);
      }
    }

    console.log('\n🎉 Initialisation de la table banque_products terminée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

createBanqueProductsTable();
