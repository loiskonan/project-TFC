require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmailConfiguration() {
  console.log('🧪 Test de la configuration email...\n');

  // Vérifier les variables d'environnement
  console.log('📋 Variables d\'environnement :');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'Non défini'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || 'Non défini'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || 'Non défini'}`);
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '***défini***' : 'Non défini'}`);
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'Non défini'}\n`);

  // Tester la connexion SMTP
  console.log('🔌 Test de connexion SMTP...');
  const connectionTest = await emailService.testConnection();
  
  if (!connectionTest) {
    console.log('❌ Échec du test de connexion SMTP');
    console.log('\n💡 Vérifiez :');
    console.log('1. Les variables d\'environnement dans .env');
    console.log('2. Les identifiants SMTP');
    console.log('3. La connexion internet');
    console.log('4. Les paramètres de sécurité du compte email');
    return;
  }

  // Test d'envoi d'email
  console.log('📧 Test d\'envoi d\'email...');
  
  const testRecipients = [process.env.SMTP_USER]; // Envoyer à soi-même pour le test
  const testFileData = {
    files: [
      { originalName: 'test-file.pdf', fileSize: 1024000 }
    ],
    banqueDestinataire: 'Banque Test',
    description: 'Test de notification email',
    productName: 'Produit Test'
  };
  
  const testSenderInfo = {
    senderName: 'Système Test',
    senderRole: 'admin',
    senderBanque: 'NSIA BANQUE'
  };

  const emailResult = await emailService.sendFileNotification(testRecipients, testFileData, testSenderInfo);
  
  if (emailResult.success) {
    console.log('✅ Email de test envoyé avec succès !');
    console.log(`📧 Message ID: ${emailResult.messageId}`);
    console.log('\n🎉 Configuration email validée !');
  } else {
    console.log('❌ Échec de l\'envoi de l\'email de test');
    console.log(`Erreur: ${emailResult.error}`);
  }
}

// Exécuter le test
testEmailConfiguration()
  .then(() => {
    console.log('\n✨ Test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
