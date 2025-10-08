require('dotenv').config();
const BanqueProduct = require('../models/BanqueProduct');

async function addCodeProduitField() {
  try {
    console.log('Ajout du champ code_produit à la table banque_products...');
    
    // Ajouter la colonne code_produit
    const addColumnQuery = `
      ALTER TABLE banque_products 
      ADD COLUMN code_produit VARCHAR(50) NOT NULL DEFAULT 'TEMP' AFTER product_name
    `;
    
    await BanqueProduct.pool.execute(addColumnQuery);
    console.log('✅ Colonne code_produit ajoutée');
    
    // Mettre à jour les codes existants avec des valeurs par défaut
    const updateQuery = `
      UPDATE banque_products 
      SET code_produit = CONCAT('PROD', LPAD(id, 3, '0'))
      WHERE code_produit = 'TEMP'
    `;
    
    await BanqueProduct.pool.execute(updateQuery);
    console.log('✅ Codes produits générés pour les produits existants');
    
    // Ajouter l'index et la contrainte unique
    const addIndexQuery = `
      ALTER TABLE banque_products 
      ADD INDEX idx_code_produit (code_produit),
      ADD UNIQUE KEY unique_banque_code (banque_id, code_produit)
    `;
    
    await BanqueProduct.pool.execute(addIndexQuery);
    console.log('✅ Index et contrainte unique ajoutés');
    
    // Vérifier les données
    const checkQuery = `
      SELECT 
        b.nom as banque_nom,
        bp.product_name,
        bp.code_produit,
        bp.is_active
      FROM banque_products bp
      JOIN banques b ON bp.banque_id = b.id
      ORDER BY b.nom, bp.code_produit
    `;
    
    const [rows] = await BanqueProduct.pool.execute(checkQuery);
    console.log('\n📋 Produits mis à jour :');
    rows.forEach(row => {
      console.log(`  ${row.banque_nom}: ${row.product_name} (${row.code_produit})`);
    });
    
    console.log('\n🎉 Migration terminée avec succès !');
    console.log('📋 Structure finale :');
    console.log('   - id (INT PRIMARY KEY)');
    console.log('   - banque_id (INT FOREIGN KEY)');
    console.log('   - product_name (VARCHAR)');
    console.log('   - code_produit (VARCHAR UNIQUE par banque)');
    console.log('   - is_active (BOOLEAN)');
    console.log('   - created_at, updated_at (TIMESTAMP)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

addCodeProduitField();


