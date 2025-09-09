# Nouvelle Page - Gestion des Fichiers par Rôle

## Fonctionnalité ajoutée ✅

**Date :** 3 septembre 2025

**Description :** Ajout d'une nouvelle page dans la sidebar pour la gestion des fichiers avec des titres et fonctionnalités adaptés selon le rôle de l'utilisateur.

## Structure de la nouvelle page

### **Navigation Sidebar**

**Pour les utilisateurs (`user`) :**
- 📁 **"Fichiers envoyés"** → Page existante (FileList)
- 📥 **"Fichiers reçus"** → Nouvelle page (FileManagement)

**Pour les administrateurs (`admin`) et NSIA Vie (`nsia_vie`) :**
- 📁 **"Fichiers reçus"** → Page existante (FileList) 
- 📤 **"Fichiers envoyés"** → Nouvelle page (FileManagement)

## Fichiers créés/modifiés

### **1. Nouveau composant** (`src/components/Files/FileManagement.tsx`)

**Fonctionnalités principales :**

**Interface adaptée selon le rôle :**
```javascript
const getPageTitle = () => {
  if (isUser) {
    return `Fichiers envoyés${currentUser?.banque ? ` - ${currentUser.banque}` : ''}`;
  } else {
    return 'Fichiers reçus (Toutes les banques)';
  }
};
```

**Filtrage intelligent :**
- 🔍 **Recherche** : Par nom de fichier et description
- 🏦 **Banque** : Filtre par banque (admin/nsia_vie seulement)
- 📄 **Type** : PDF, Word, Excel, PowerPoint, Image, Archive
- 📅 **Date** : Filtre par période (à venir)

**Tableau des fichiers avec colonnes :**
- 📁 **Fichier** : Nom original + icône selon le type
- 📝 **Description** : Description du lot
- 📊 **Taille** : Taille formatée (KB, MB, GB)
- 👤 **Déposant** : Nom et email
- 🏦 **Banque** : Banque du déposant (admin/nsia_vie seulement)
- 📅 **Date** : Date d'upload formatée
- ⬇️ **Téléchargements** : Nombre de téléchargements
- 🔧 **Actions** : Bouton de téléchargement

**Pagination :**
- ✅ **10 fichiers par page**
- ✅ **Navigation** : Précédent/Suivant + numéros de page
- ✅ **Compteur** : "Affichage de X à Y sur Z fichiers"

### **2. Sidebar modifiée** (`src/components/Layout/Sidebar.tsx`)

**Nouvel élément de menu :**
```javascript
{ 
  id: 'file-management', 
  label: currentUser?.role === 'user' ? 'Fichiers reçus' : 'Fichiers envoyés', 
  icon: Download 
}
```

**Logique conditionnelle :**
- **User** : "Fichiers reçus" (voit les fichiers de toutes les banques)
- **Admin/NSIA Vie** : "Fichiers envoyés" (voit leurs propres fichiers)

### **3. App.tsx modifié**

**Import ajouté :**
```javascript
import FileManagement from './components/Files/FileManagement';
```

**Nouveau cas dans le switch :**
```javascript
case 'file-management':
  return <FileManagement />;
```

## Fonctionnalités par rôle

### **👤 Utilisateur (`user`)**
- 📥 **"Fichiers reçus"** : Voit tous les fichiers de toutes les banques
- 🔍 **Filtrage** : Par recherche, type, date
- ⬇️ **Téléchargement** : Tous les fichiers disponibles
- 📊 **Informations** : Déposant, banque, date, téléchargements

### **👑 Administrateur (`admin`)**
- 📤 **"Fichiers envoyés"** : Voit tous les fichiers uploadés
- 🔍 **Filtrage avancé** : Par banque, recherche, type, date
- ⬇️ **Téléchargement** : Tous les fichiers
- 📊 **Vue globale** : Toutes les banques et déposants

### **🏢 NSIA Vie (`nsia_vie`)**
- 📤 **"Fichiers envoyés"** : Voit tous les fichiers uploadés
- 🔍 **Filtrage avancé** : Par banque, recherche, type, date
- ⬇️ **Téléchargement** : Tous les fichiers
- 📊 **Vue globale** : Toutes les banques et déposants

## API utilisée

**Endpoint :** `GET /api/files`
**Paramètres :**
- `page` : Numéro de page
- `limit` : Nombre d'éléments par page (10)
- `search` : Recherche par nom/description
- `banque` : Filtre par banque
- `type` : Filtre par type de fichier
- `dateFrom` / `dateTo` : Filtre par période

**Réponse :**
```json
{
  "files": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalFiles": 47,
    "filesPerPage": 10
  }
}
```

## Résultat

La nouvelle page offre :

- ✅ **Navigation intuitive** : Titres adaptés selon le rôle
- ✅ **Filtrage puissant** : Recherche, banque, type, date
- ✅ **Interface moderne** : Tableau responsive avec icônes
- ✅ **Pagination efficace** : Navigation fluide entre les pages
- ✅ **Téléchargement sécurisé** : Avec nom de fichier original
- ✅ **Informations complètes** : Déposant, banque, statistiques

Les utilisateurs ont maintenant accès à une vue complète et organisée des fichiers selon leur rôle et leurs permissions ! 🎉

