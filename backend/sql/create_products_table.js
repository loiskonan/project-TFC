const Product = require('../models/Product');

async function createProductsTable() {
  try {
    console.log('Création de la table products...');
    await Product.createTable();
    console.log('✅ Table products créée avec succès');
    
    // Ajouter quelques produits de test
    const sampleProducts = [
      {
        name: 'Ordinateur Portable',
        description: 'Ordinateur portable haute performance pour le travail',
        price: 899.99,
        category: 'Informatique',
        stock: 25
      },
      {
        name: 'Souris Sans Fil',
        description: 'Souris ergonomique sans fil avec batterie longue durée',
        price: 29.99,
        category: 'Informatique',
        stock: 100
      },
      {
        name: 'Clavier Mécanique',
        description: 'Clavier mécanique avec switches Cherry MX',
        price: 149.99,
        category: 'Informatique',
        stock: 50
      },
      {
        name: 'Écran 24 pouces',
        description: 'Écran Full HD 24 pouces avec port HDMI',
        price: 199.99,
        category: 'Informatique',
        stock: 30
      },
      {
        name: 'Café Premium',
        description: 'Café arabica bio, torréfaction moyenne',
        price: 12.50,
        category: 'Boissons',
        stock: 200
      }
    ];

    console.log('Ajout des produits de test...');
    for (const product of sampleProducts) {
      await Product.create(product);
      console.log(`✅ Produit "${product.name}" ajouté`);
    }

    console.log('🎉 Initialisation de la table products terminée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

createProductsTable();


