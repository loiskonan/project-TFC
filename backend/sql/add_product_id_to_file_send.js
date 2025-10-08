const mysql = require('mysql2/promise');
require('dotenv').config();

async function addProductIdToFileSend() {
  let connection;
  
  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dataflow',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connexion à la base de données établie');

    // Vérifier si la colonne product_id existe déjà
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'file_send' AND COLUMN_NAME = 'product_id'
    `, [process.env.DB_NAME || 'dataflow']);

    if (columns.length > 0) {
      console.log('⚠️  La colonne product_id existe déjà dans la table file_send');
      return;
    }

    // Ajouter la colonne product_id
    console.log('🔄 Ajout de la colonne product_id à la table file_send...');
    
    await connection.execute(`
      ALTER TABLE file_send 
      ADD COLUMN product_id INT NULL,
      ADD INDEX idx_product_id (product_id),
      ADD CONSTRAINT fk_file_send_product_id 
        FOREIGN KEY (product_id) REFERENCES banque_products(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    `);

    console.log('✅ Colonne product_id ajoutée avec succès à la table file_send');
    console.log('✅ Index et contrainte de clé étrangère créés');

    // Vérifier la structure de la table
    const [tableStructure] = await connection.execute(`
      DESCRIBE file_send
    `);

    console.log('\n📋 Structure actuelle de la table file_send:');
    tableStructure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${column.Key ? `[${column.Key}]` : ''}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la colonne product_id:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter le script
addProductIdToFileSend()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });

