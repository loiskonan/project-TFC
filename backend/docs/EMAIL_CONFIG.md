# Configuration Email pour DataFlow

## Variables d'environnement à ajouter au fichier .env

```bash
# Configuration Email pour les notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
FRONTEND_URL=http://localhost:3000
```

## Configuration Gmail

Pour utiliser Gmail comme service SMTP :

1. **Activez l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générez un mot de passe d'application** :
   - Allez dans Paramètres Google > Sécurité
   - Activez l'authentification à 2 facteurs
   - Générez un mot de passe d'application pour "Mail"
3. **Utilisez ce mot de passe** dans `SMTP_PASS`

## Configuration d'autres services SMTP

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Serveur SMTP personnalisé
```bash
SMTP_HOST=votre-serveur-smtp.com
SMTP_PORT=587
```

## Test de la configuration

Un script de test sera disponible pour vérifier la configuration email.

## Fonctionnalités

- ✅ Notifications automatiques lors de l'envoi de fichiers
- ✅ Emails HTML avec design professionnel
- ✅ Informations détaillées sur les fichiers envoyés
- ✅ Notifications différenciées selon le rôle de l'expéditeur
- ✅ Gestion des erreurs sans impact sur l'upload
