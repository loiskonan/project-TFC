# Changelog - API Upload Utilisateurs

## 📋 Résumé des changements

Création d'une nouvelle API spécifique pour les uploads d'utilisateurs avec informations complètes du déposant.

## 🗄️ Modifications de la base de données

### Script SQL à exécuter : `update_database_for_deposant_info.sql`

```sql
-- Ajouter les colonnes d'informations du déposant
ALTER TABLE files ADD COLUMN deposant_nom VARCHAR(255) AFTER description;
ALTER TABLE files ADD COLUMN deposant_email VARCHAR(255) AFTER deposant_nom;
ALTER TABLE files ADD COLUMN deposant_banque VARCHAR(255) AFTER deposant_email;
```

### Nouvelles colonnes dans la table `files` :

- `deposant_nom` : Nom du déposant
- `deposant_email` : Email du déposant  
- `deposant_banque` : Banque du déposant

## 🔧 Nouveaux fichiers créés

### 1. `backend/controllers/userUploadController.js`
- Contrôleur spécifique pour les uploads d'utilisateurs
- Validation du rôle 'user' uniquement
- Vérification de la banque assignée
- Stockage des informations complètes du déposant

### 2. `backend/routes/userUploads.js`
- Routes spécifiques pour l'API d'upload utilisateurs
- Protection par authentification
- Contrôle d'accès par rôle

## 🚀 Nouvelles routes API

### Base URL : `/api/user-uploads`

| Méthode | Route | Description | Accès |
|---------|-------|-------------|-------|
| POST | `/upload` | Upload d'un fichier | Utilisateurs uniquement |
| GET | `/my-deposits` | Mes dépôts | Utilisateurs uniquement |
| GET | `/all-deposits` | Tous les dépôts | Admin + NSIA Vie |
| GET | `/stats` | Statistiques | Tous les rôles |

## 🔒 Contrôles de sécurité

### Upload de fichiers :
- ✅ Rôle 'user' uniquement
- ✅ Banque assignée obligatoire
- ✅ Description obligatoire
- ✅ Types de fichiers autorisés
- ✅ Taille max : 50MB

### Accès aux dépôts :
- ✅ Utilisateurs : leurs propres dépôts uniquement
- ✅ Admin/NSIA Vie : tous les dépôts
- ✅ Authentification requise

## 📊 Informations stockées par fichier

```json
{
  "id": 1,
  "name": "fichier-123456789.pdf",
  "originalName": "document.pdf",
  "description": "Description du lot",
  "deposantNom": "John Doe",
  "deposantEmail": "john@example.com",
  "deposantBanque": "NSIA BANQUE",
  "fileSize": 2048000,
  "fileType": "application/pdf",
  "uploadedAt": "2024-01-15T10:30:00Z"
}
```

## 🔄 Modifications du frontend

### `src/components/Files/FileUpload.tsx`
- ✅ Utilise la nouvelle route `/api/user-uploads/upload`
- ✅ Affichage conditionnel selon le rôle
- ✅ Titre personnalisé avec nom de la banque

## 🎯 Fonctionnalités

### Pour les utilisateurs (rôle 'user') :
- ✅ Upload de fichiers avec description de lot
- ✅ Informations du déposant automatiquement ajoutées
- ✅ Affichage "Dépôt [Nom de la banque]"
- ✅ Interface d'upload complète

### Pour les autres rôles :
- ✅ Affichage "Dépôt [Rôle]"
- ✅ Message "Contenu à définir"

## 📝 Notes importantes

1. **Exécution du script SQL** : Nécessaire pour ajouter les nouvelles colonnes
2. **Redémarrage du serveur** : Requis après l'ajout des nouvelles routes
3. **Migration des données existantes** : Le script met à jour les fichiers existants
4. **Compatibilité** : L'ancienne API `/api/files` reste disponible

## 🚀 Déploiement

1. Exécuter le script SQL
2. Redémarrer le serveur backend
3. Tester l'upload avec un utilisateur 'user'
4. Vérifier les informations du déposant en base
