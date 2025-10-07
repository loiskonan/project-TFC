const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configuration du transporteur email
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true pour 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Envoyer une notification de nouveau fichier
  async sendFileNotification(recipients, fileData, senderInfo, ccRecipients = []) {
    try {
      const { files, banqueDestinataire, description, productName } = fileData;
      const { senderName, senderRole, senderBanque } = senderInfo;

      // Construire la liste des fichiers
      const fileList = files.map(file => 
        `• ${file.originalName} (${this.formatFileSize(file.fileSize)})`
      ).join('\n');

      // Déterminer le message selon le rôle de l'expéditeur
      let senderMessage = '';
      if (senderRole === 'admin') {
        senderMessage = `L'administrateur ${senderName} a envoyé des fichiers à votre banque.`;
      } else if (senderRole === 'nsia_vie') {
        senderMessage = `NSIA Vie (${senderName}) a envoyé des fichiers à votre banque.`;
      } else if (senderRole === 'user') {
        senderMessage = `Un collègue de votre banque (${senderName}) a envoyé des fichiers.`;
      }

      const mailOptions = {
        from: `"DataFlow System" <${process.env.SMTP_USER}>`,
        to: recipients.join(', '),
        cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
        subject: `📁 Nouveaux fichiers reçus - ${banqueDestinataire}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10105c, #d7990e); color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">📁 Nouveaux fichiers reçus</h1>
            </div>
            
            <div style="padding: 20px; background: #f9f9f9;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Bonjour,
              </p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                ${senderMessage}
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d7990e; margin-bottom: 20px;">
                <h3 style="color: #10105c; margin-top: 0;">📋 Détails de l'envoi</h3>
                <p><strong>Banque destinataire :</strong> ${banqueDestinataire}</p>
                <p><strong>Description :</strong> ${description}</p>
                ${productName ? `<p><strong>Produit associé :</strong> ${productName}</p>` : ''}
                <p><strong>Nombre de fichiers :</strong> ${files.length}</p>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10105c;">
                <h3 style="color: #10105c; margin-top: 0;">📄 Fichiers reçus</h3>
                <div style="font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px;">
                  ${fileList.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                   style="background: #10105c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  🔗 Accéder à l'application
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
                Cet email a été envoyé automatiquement par le système DataFlow.
              </p>
            </div>
          </div>
        `,
        text: `
Nouveaux fichiers reçus - ${banqueDestinataire}

${senderMessage}

Détails de l'envoi :
- Banque destinataire : ${banqueDestinataire}
- Description : ${description}
${productName ? `- Produit associé : ${productName}` : ''}
- Nombre de fichiers : ${files.length}

Fichiers reçus :
${fileList}

Accéder à l'application : ${process.env.FRONTEND_URL}
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de notification envoyé:', result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      return { success: false, error: error.message };
    }
  }

  // Formater la taille des fichiers
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Tester la configuration email
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Configuration email valide');
      return true;
    } catch (error) {
      console.error('❌ Erreur de configuration email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
