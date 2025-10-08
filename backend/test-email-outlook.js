require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmailToOutlook() {
  console.log('🧪 Test d\'envoi d\'email vers Outlook...\n');

  // Test de la configuration SMTP
  console.log('1️⃣ Vérification de la configuration SMTP...');
  const configValid = await emailService.testConnection();
  
  if (!configValid) {
    console.log('❌ Configuration SMTP invalide. Vérifiez vos variables d\'environnement.');
    return;
  }

  console.log('✅ Configuration SMTP valide\n');

  // Données de test pour l'email
  const testData = {
    recipients: ['lois.konan@nsiaassurances.com'],
    fileData: {
      files: [
        {
          originalName: 'test-document.pdf',
          fileSize: 1024000
        },
        {
          originalName: 'rapport-excel.xlsx',
          fileSize: 2048000
        }
      ],
      banqueDestinataire: 'NSIA Assurances',
      description: 'Test d\'envoi d\'email vers Outlook',
      productName: 'Assurance Vie'
    },
    senderInfo: {
      senderName: 'Système DataFlow',
      senderRole: 'admin',
      senderBanque: 'NSIA Vie'
    },
    ccRecipients: ['admin@nextechcore.com']
  };

  console.log('2️⃣ Envoi de l\'email de test...');
  console.log(`📧 Destinataire: ${testData.recipients.join(', ')}`);
  console.log(`📋 CC: ${testData.ccRecipients.join(', ')}`);
  console.log(`📁 Fichiers: ${testData.fileData.files.length}`);
  console.log(`🏦 Banque: ${testData.fileData.banqueDestinataire}\n`);

  try {
    const result = await emailService.sendFileNotification(
      testData.recipients,
      testData.fileData,
      testData.senderInfo,
      testData.ccRecipients
    );

    if (result.success) {
      console.log('✅ Email envoyé avec succès !');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log('\n📬 Vérifiez votre boîte email Outlook :');
      console.log('   - Dossier principal');
      console.log('   - Dossier Spam/Junk (si nécessaire)');
    } else {
      console.log('❌ Échec de l\'envoi de l\'email');
      console.log(`Erreur: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
testEmailToOutlook()
  .then(() => {
    console.log('\n🏁 Test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

