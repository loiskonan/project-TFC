// Script pour tester et corriger les noms de fichiers
const mysql = require('mysql2');

// Configuration de la base de données
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Ajoutez votre mot de passe si nécessaire
  database: 'dataflow'
});

async function testAndFixFilenames() {
  try {
    console.log('🔍 Vérification des noms de fichiers...');
    
    // Vérifier les fichiers actuels
    const [files] = await db.promise().query(`
      SELECT id, name, original_name, file_path 
      FROM files 
      LIMIT 10
    `);
    
    console.log('\n📋 Fichiers actuels :');
    files.forEach(file => {
      console.log(`ID: ${file.id}, Name: ${file.name}, Original: ${file.original_name}`);
    });
    
    // Compter les fichiers avec des noms incorrects
    const [countResult] = await db.promise().query(`
      SELECT COUNT(*) as count 
      FROM files 
      WHERE name LIKE 'files-%'
    `);
    
    console.log(`\n⚠️  Fichiers avec noms incorrects: ${countResult[0].count}`);
    
    if (countResult[0].count > 0) {
      console.log('\n🔧 Correction des noms de fichiers...');
      
      // Corriger les noms des fichiers
      const [updateResult] = await db.promise().query(`
        UPDATE files 
        SET name = CONCAT(
          SUBSTRING_INDEX(original_name, '.', 1), 
          '-', 
          SUBSTRING_INDEX(name, '-', -1)
        )
        WHERE name LIKE 'files-%' 
        AND original_name IS NOT NULL 
        AND original_name != ''
      `);
      
      console.log(`✅ ${updateResult.affectedRows} fichiers corrigés`);
      
      // Vérifier les résultats
      const [updatedFiles] = await db.promise().query(`
        SELECT id, name, original_name, file_path 
        FROM files 
        LIMIT 10
      `);
      
      console.log('\n📋 Fichiers après correction :');
      updatedFiles.forEach(file => {
        console.log(`ID: ${file.id}, Name: ${file.name}, Original: ${file.original_name}`);
      });
    } else {
      console.log('✅ Aucun fichier à corriger');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    db.end();
  }
}

// Exécuter le script
testAndFixFilenames();
