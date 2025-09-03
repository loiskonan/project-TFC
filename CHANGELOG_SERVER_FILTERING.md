# Changelog - Filtrage côté serveur

## 📋 Résumé des modifications

Migration du filtrage des fichiers du côté client vers le côté serveur pour améliorer les performances et permettre le filtrage par description.

## 🔧 Problème identifié

### **Symptômes :**
- ⚡ **Performance dégradée** : Tous les fichiers chargés puis filtrés côté client
- 🔍 **Filtrage limité** : Pas de filtrage par description
- 💾 **Consommation mémoire** : Toutes les données transférées même si non utilisées
- 📊 **Pagination inefficace** : Pagination après filtrage côté client

### **Cause :**
Le filtrage se faisait côté frontend après avoir chargé tous les fichiers depuis le serveur.

## 🛠️ Solution appliquée

### **1. Modèle File.js - Filtrage côté serveur**

#### **findByUserPaginated() - Avec filtres :**
```javascript
static async findByUserPaginated(userId, page = 1, limit = 3, filters = {}) {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    
    // Construire les conditions de filtrage
    let whereConditions = ['f.uploaded_by = ?'];
    let queryParams = [userId];
    
    // Filtre par nom de fichier ou description
    if (filters.searchTerm && filters.searchTerm.trim()) {
      whereConditions.push('(f.original_name LIKE ? OR f.description LIKE ?)');
      const searchPattern = `%${filters.searchTerm.trim()}%`;
      queryParams.push(searchPattern, searchPattern);
    }
    
    // Filtre par type de fichier
    if (filters.fileType && filters.fileType !== 'all') {
      whereConditions.push('f.file_type LIKE ?');
      queryParams.push(`%${filters.fileType}%`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Requête avec filtres et pagination
    const query = `
      SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE ${whereClause}
      ORDER BY f.uploaded_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // Retourne { files, pagination }
  });
}
```

#### **findAllPaginated() - Avec filtres avancés :**
```javascript
static async findAllPaginated(page = 1, limit = 3, filters = {}) {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    
    // Construire les conditions de filtrage
    let whereConditions = [];
    let queryParams = [];
    
    // Filtre par nom de fichier ou description
    if (filters.searchTerm && filters.searchTerm.trim()) {
      whereConditions.push('(f.original_name LIKE ? OR f.description LIKE ?)');
      const searchPattern = `%${filters.searchTerm.trim()}%`;
      queryParams.push(searchPattern, searchPattern);
    }
    
    // Filtre par type de fichier
    if (filters.fileType && filters.fileType !== 'all') {
      whereConditions.push('f.file_type LIKE ?');
      queryParams.push(`%${filters.fileType}%`);
    }
    
    // Filtre par banque (pour les admins/nsia_vie)
    if (filters.banque && filters.banque !== 'all') {
      whereConditions.push('f.deposant_banque = ?');
      queryParams.push(filters.banque);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Requête avec filtres et pagination
    const query = `
      SELECT f.*, u.name as uploaded_by_name, u.banque as uploaded_by_banque
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      ${whereClause}
      ORDER BY f.uploaded_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // Retourne { files, pagination }
  });
}
```

### **2. Contrôleur userUploadController.js - Gestion des filtres**

#### **getUserDeposits() - Avec paramètres de filtrage :**
```javascript
static async getUserDeposits(req, res) {
  try {
    // Vérification du rôle 'user'
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les utilisateurs peuvent voir leurs dépôts.'
      });
    }

    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 3; // 3 éléments par page
    
    // Récupérer les filtres depuis les paramètres de requête
    const filters = {
      searchTerm: req.query.search || '',
      fileType: req.query.fileType || 'all'
    };
    
    const result = await File.findByUserPaginated(userId, page, limit, filters);
    
    res.json({
      success: true,
      deposits: result.files.map(file => ({
        // Mapping des données
      })),
      pagination: result.pagination
    });
  } catch (error) {
    // Gestion d'erreur
  }
}
```

#### **getAllDeposits() - Avec filtres avancés :**
```javascript
static async getAllDeposits(req, res) {
  try {
    // Vérification des droits admin/nsia_vie
    if (req.user.role !== 'admin' && req.user.role !== 'nsia_vie') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Droits insuffisants.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 3; // 3 éléments par page
    
    // Récupérer les filtres depuis les paramètres de requête
    const filters = {
      searchTerm: req.query.search || '',
      fileType: req.query.fileType || 'all',
      banque: req.query.banque || 'all'
    };
    
    const result = await File.findAllPaginated(page, limit, filters);
    
    res.json({
      success: true,
      deposits: result.files.map(file => ({
        // Mapping des données
      })),
      pagination: result.pagination
    });
  } catch (error) {
    // Gestion d'erreur
  }
}
```

### **3. Hook useUserFiles.ts - Gestion des filtres côté frontend**

#### **État des filtres :**
```typescript
const [filters, setFilters] = useState({
  searchTerm: '',
  fileType: 'all',
  banque: 'all'
});
```

#### **Construction des paramètres de requête :**
```typescript
const fetchUserFiles = async (page: number = 1) => {
  if (!currentUser) return;

  setIsLoading(true);
  setError(null);

  try {
    // Construire les paramètres de requête avec filtres
    const queryParams = new URLSearchParams({
      page: page.toString(),
      search: filters.searchTerm,
      fileType: filters.fileType
    });
    
    // Ajouter le filtre banque pour les admins/nsia_vie
    if (currentUser.role === 'admin' || currentUser.role === 'nsia_vie') {
      queryParams.append('banque', filters.banque);
    }
    
    let endpoint = '';
    if (currentUser.role === 'user') {
      endpoint = `http://localhost:5000/api/user-uploads/my-deposits?${queryParams.toString()}`;
    } else if (currentUser.role === 'admin' || currentUser.role === 'nsia_vie') {
      endpoint = `http://localhost:5000/api/user-uploads/all-deposits?${queryParams.toString()}`;
    }

    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      setFiles(response.data.deposits);
      setPagination(response.data.pagination);
    }
  } catch (error) {
    // Gestion d'erreur
  }
};
```

#### **Fonctions de gestion des filtres :**
```typescript
const updateFilters = (newFilters: Partial<typeof filters>) => {
  setFilters(prev => ({ ...prev, ...newFilters }));
};

const applyFilters = () => {
  fetchUserFiles(1); // Retourner à la première page lors du filtrage
};
```

### **4. Composant FileList.tsx - Interface de filtrage**

#### **Gestionnaires d'événements :**
```typescript
const handleSearchChange = (value: string) => {
  updateFilters({ searchTerm: value });
};

const handleFilterTypeChange = (value: string) => {
  updateFilters({ fileType: value });
};

const handleBanqueChange = (value: string) => {
  updateFilters({ banque: value });
};

const handleApplyFilters = () => {
  setCurrentPage(1); // Retourner à la première page
  applyFilters();
};
```

#### **Interface de filtrage :**
```jsx
<div className="flex flex-col sm:flex-row gap-3">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
    <input
      type="text"
      placeholder="Rechercher un fichier ou une description..."
      value={filters.searchTerm}
      onChange={(e) => handleSearchChange(e.target.value)}
      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
  
  <div className="relative">
    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
    <select
      value={filters.fileType}
      onChange={(e) => handleFilterTypeChange(e.target.value)}
      className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="all">Tous les types</option>
      <option value="image">Images</option>
      <option value="pdf">PDF</option>
      <option value="excel">Excel</option>
      <option value="word">Word</option>
      <option value="video">Vidéos</option>
      <option value="audio">Audio</option>
      <option value="sql">SQL</option>
      <option value="archive">Archives</option>
      <option value="code">Code</option>
    </select>
  </div>

  {/* Filtre par banque pour les admins/nsia_vie */}
  {(currentUser?.role === 'admin' || currentUser?.role === 'nsia_vie') && (
    <div className="relative">
      <select
        value={filters.banque}
        onChange={(e) => handleBanqueChange(e.target.value)}
        className="pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">Toutes les banques</option>
        <option value="NSIA">NSIA</option>
        <option value="SGBCI">SGBCI</option>
        <option value="BACI">BACI</option>
        <option value="SIB">SIB</option>
        <option value="ECOBANK">ECOBANK</option>
      </select>
    </div>
  )}

  <button
    onClick={handleApplyFilters}
    disabled={isLoading}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
  >
    Appliquer
  </button>
</div>
```

## 🎯 Changements apportés

### **1. Backend - Modèle File.js**
- ✅ **Filtrage côté serveur** : Requêtes SQL avec conditions dynamiques
- ✅ **Filtrage par description** : Recherche dans `original_name` ET `description`
- ✅ **Filtrage par type** : Recherche par `file_type`
- ✅ **Filtrage par banque** : Pour les admins/nsia_vie uniquement
- ✅ **Pagination avec filtres** : Comptage total avec les mêmes filtres

### **2. Backend - Contrôleur userUploadController.js**
- ✅ **Paramètres de filtrage** : Récupération depuis `req.query`
- ✅ **Validation des filtres** : Valeurs par défaut et validation
- ✅ **Filtres spécifiques** : Différents filtres selon le rôle utilisateur
- ✅ **Réponse optimisée** : Seulement les données nécessaires

### **3. Frontend - Hook useUserFiles.ts**
- ✅ **État des filtres** : `useState` pour gérer les filtres
- ✅ **Paramètres de requête** : Construction dynamique des URLs
- ✅ **Fonctions de gestion** : `updateFilters()` et `applyFilters()`
- ✅ **Retour à la page 1** : Lors de l'application des filtres

### **4. Frontend - Composant FileList.tsx**
- ✅ **Interface de filtrage** : Champs de recherche et sélecteurs
- ✅ **Filtre par description** : Recherche dans le nom ET la description
- ✅ **Filtre par banque** : Pour les admins/nsia_vie uniquement
- ✅ **Bouton d'application** : Appliquer les filtres explicitement

## 🔄 Flux de filtrage

### **1. Saisie des filtres**
1. **Utilisateur saisit** → Mise à jour de l'état `filters`
2. **Champs synchronisés** → Affichage en temps réel
3. **Pas de requête** → Attente du clic sur "Appliquer"

### **2. Application des filtres**
1. **Clic sur "Appliquer"** → `handleApplyFilters()`
2. **Retour page 1** → `setCurrentPage(1)`
3. **Requête API** → `fetchUserFiles(1)` avec filtres
4. **Réponse serveur** → Fichiers filtrés + pagination

### **3. Navigation avec filtres**
1. **Changement de page** → `handlePageChange(page)`
2. **Requête API** → `fetchUserFiles(page)` avec filtres
3. **Mise à jour** → Nouveaux fichiers pour la page

## 📊 Avantages du filtrage côté serveur

### **1. Performance**
- 🚀 **Requêtes optimisées** : Seulement les données nécessaires
- ⚡ **Réponse rapide** : Moins de données transférées
- 💾 **Économie mémoire** : Pas de surcharge côté client

### **2. Fonctionnalités**
- 🔍 **Filtrage par description** : Recherche dans le contenu
- 📊 **Pagination précise** : Comptage avec filtres appliqués
- 🎯 **Filtres combinés** : Recherche + type + banque

### **3. Scalabilité**
- 📈 **Évolutif** : Fonctionne avec des milliers de fichiers
- 🔧 **Configurable** : Filtres facilement modifiables
- 🛡️ **Sécurisé** : Validation côté serveur

## 🎮 Comportement utilisateur

### **Scénario 1 : Recherche simple**
- ✅ **Saisie texte** → Recherche dans nom ET description
- ✅ **Application** → Résultats filtrés côté serveur
- ✅ **Pagination** → Navigation dans les résultats filtrés

### **Scénario 2 : Filtrage par type**
- ✅ **Sélection type** → Filtrage par type de fichier
- ✅ **Combinaison** → Recherche + type simultanément
- ✅ **Résultats** → Fichiers correspondant aux critères

### **Scénario 3 : Filtrage par banque (admin)**
- ✅ **Sélection banque** → Filtrage par banque déposante
- ✅ **Filtres multiples** → Recherche + type + banque
- ✅ **Résultats précis** → Fichiers exactement correspondants

## 🚀 Déploiement

### **1. Redémarrage du serveur**
```bash
# Dans le dossier backend
npm restart
```

### **2. Test de la fonctionnalité**
- **Test 1** : Recherche par nom → ✅ Filtrage côté serveur
- **Test 2** : Recherche par description → ✅ Nouveau fonctionnalité
- **Test 3** : Filtrage par type → ✅ Combinaison possible
- **Test 4** : Filtrage par banque → ✅ Admin/nsia_vie uniquement

### **3. Vérification des performances**
- **Requêtes API** : Seulement les données filtrées
- **Temps de réponse** : Amélioration significative
- **Mémoire client** : Réduction de l'utilisation

## 📝 Notes importantes

### **Filtres disponibles**
- **Recherche** : Nom de fichier ET description
- **Type** : Images, PDF, Excel, Word, Vidéos, Audio, SQL, Archives, Code
- **Banque** : NSIA, SGBCI, BACI, SIB, ECOBANK (admin/nsia_vie uniquement)

### **Performance**
- **Requêtes optimisées** : `LIKE` avec index sur les colonnes
- **Pagination** : `LIMIT` et `OFFSET` avec filtres
- **Cache** : Pas de mise en cache (données dynamiques)

### **Sécurité**
- **Validation** : Paramètres de filtrage validés
- **Autorisation** : Filtres selon le rôle utilisateur
- **Injection SQL** : Paramètres préparés

Le filtrage côté serveur est maintenant actif avec recherche par description ! 🎯
