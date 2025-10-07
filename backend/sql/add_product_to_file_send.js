require('dotenv').config();
const mysql = require('mysql2/promise');

async function addProductToFileSend() {
  let connection;
  try {
    // Créer une connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    console.log('Ajout du champ product_id à la table file_send...');

    // Vérifier si la colonne existe déjà
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'file_send' AND COLUMN_NAME = 'product_id'
    `, [process.env.DB_NAME]);

    if (columns.length === 0) {
      // Ajouter la colonne product_id
      await connection.execute(`
        ALTER TABLE file_send 
        ADD COLUMN product_id INT NULL,
        ADD INDEX idx_product_id (product_id),
        ADD FOREIGN KEY (product_id) REFERENCES banque_products(id) ON DELETE SET NULL
      `);
      console.log('✅ Colonne product_id ajoutée avec succès');
    } else {
      console.log('ℹ️  La colonne product_id existe déjà');
    }

    console.log('🎉 Migration terminée avec succès !');
    console.log('📋 Structure mise à jour :');
    console.log('   - product_id (INT NULL)');
    console.log('   - Index sur product_id');
    console.log('   - Clé étrangère vers banque_products(id)');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addProductToFileSend();
