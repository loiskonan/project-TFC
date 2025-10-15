# Changelog - Liste dynamique des banques

## 📋 Résumé des modifications

Migration de la liste codée en dur des banques vers une liste dynamique récupérée depuis la table `banques` de la base de données.

## 🔧 Problème identifié

### **Symptômes :**
- 🔒 **Liste statique** : Banques codées en dur dans le frontend
- 🔄 **Maintenance difficile** : Modification manuelle du code pour ajouter/supprimer des banques
- 📊 **Données désynchronisées** : Différence entre la base de données et l'interface
- 🎯 **Manque de flexibilité** : Pas de gestion dynamique des banques

### **Cause :**
La liste des banques était codée en dur dans le composant frontend au lieu d'être récupérée depuis la base de données.

## 🛠️ Solution appliquée

### **1. Modèle Banque.js - Gestion des banques**

```javascript
const db = require('../config/db');

class Banque {
  static async findAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, nom, code, is_active
        FROM banques
        WHERE is_active = TRUE
        ORDER BY nom ASC
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  static async getBanquesForFilter() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT nom
        FROM banques
        WHERE is_active = TRUE
        ORDER BY nom ASC
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results.map(row => row.nom));
        }
      });
    });
  }
}

module.exports = Banque;
```

### **2. Contrôleur userUploadController.js - Endpoint pour les banques**

```javascript
// Récupérer la liste des banques pour les filtres
static async getBanques(req, res) {
  try {
    const banques = await Banque.getBanquesForFilter();
    
    res.json({
      success: true,
      banques: banques
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des banques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
}
```

### **3. Routes userUploads.js - Nouvelle route**

```javascript
// Récupérer la liste des banques pour les filtres
router.get('/banques', UserUploadController.getBanques);
```

### **4. Hook useUserFiles.ts - Récupération des banques**

```typescript
export const useUserFiles = () => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banques, setBanques] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    fileType: 'all',
    banque: 'all'
  });

  const fetchBanques = async () => {
    try {
      const token = localStorage.getItem('dataflow_token');
      const response = await axios.get('http://localhost:5000/api/user-uploads/banques', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setBanques(response.data.banques);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des banques:', error);
    }
  };

  // Charger les fichiers et banques au montage du composant
  useEffect(() => {
    if (currentUser) {
      fetchUserFiles();
      fetchBanques();
    }
  }, []);

  return {
    files,
    pagination,
    isLoading,
    error,
    filters,
    banques,
    updateFilters,
    applyFilters,
    downloadFile,
    deleteFile,
    refreshFiles: fetchUserFiles
  };
};
```

### **5. Composant FileList.tsx - Liste dynamique**

```jsx
{/* Filtre par banque pour les admins/nsia_vie */}
{(currentUser?.role === 'admin' || currentUser?.role === 'nsia_vie') && (
  <div className="relative">
    <select
      value={filters.banque}
      onChange={(e) => handleBanqueChange(e.target.value)}
      className="pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="all">Toutes les banques</option>
      {banques.map((banque, index) => (
        <option key={index} value={banque}>
          {banque}
        </option>
      ))}
    </select>
  </div>
)}
```

## 🎯 Changements apportés

### **1. Backend - Modèle Banque.js**
- ✅ **Nouveau modèle** : Classe `Banque` pour gérer les banques
- ✅ **Méthode findAll()** : Récupération de toutes les banques actives
- ✅ **Méthode getBanquesForFilter()** : Récupération des noms pour les filtres
- ✅ **Tri alphabétique** : `ORDER BY nom ASC`
- ✅ **Filtrage actif** : `WHERE is_active = TRUE`

### **2. Backend - Contrôleur userUploadController.js**
- ✅ **Nouvelle méthode** : `getBanques()` pour récupérer la liste
- ✅ **Import du modèle** : `const Banque = require('../models/Banque')`
- ✅ **Gestion d'erreur** : Try-catch avec messages d'erreur
- ✅ **Réponse JSON** : Format standardisé avec `success` et `banques`

### **3. Backend - Routes userUploads.js**
- ✅ **Nouvelle route** : `GET /api/user-uploads/banques`
- ✅ **Authentification** : Route protégée par `authenticateToken`
- ✅ **Pas de restriction** : Accessible à tous les utilisateurs authentifiés

### **4. Frontend - Hook useUserFiles.ts**
- ✅ **État banques** : `useState<string[]>([])` pour stocker la liste
- ✅ **Fonction fetchBanques** : Récupération depuis l'API
- ✅ **Chargement automatique** : Appel au montage du composant
- ✅ **Gestion d'erreur** : Log des erreurs sans bloquer l'interface

### **5. Frontend - Composant FileList.tsx**
- ✅ **Liste dynamique** : `banques.map()` au lieu de liste statique
- ✅ **Props banques** : Récupération depuis le hook
- ✅ **Rendu conditionnel** : Affichage seulement pour admin/nsia_vie
- ✅ **Clés uniques** : `key={index}` pour chaque option

## 🔄 Flux de récupération des banques

### **1. Chargement initial**
1. **Montage composant** → `useEffect` se déclenche
2. **Vérification utilisateur** → `if (currentUser)`
3. **Appel API** → `fetchBanques()`
4. **Requête serveur** → `GET /api/user-uploads/banques`
5. **Réponse** → Liste des banques actives
6. **Mise à jour état** → `setBanques(response.data.banques)`

### **2. Affichage dans le filtre**
1. **Rendu conditionnel** → Vérification du rôle utilisateur
2. **Mapping des banques** → `banques.map((banque, index) => ...)`
3. **Options dynamiques** → `<option value={banque}>{banque}</option>`
4. **Sélection utilisateur** → `handleBanqueChange(e.target.value)`

### **3. Application du filtre**
1. **Sélection banque** → Mise à jour de `filters.banque`
2. **Clic "Appliquer"** → `handleApplyFilters()`
3. **Requête filtrée** → `fetchUserFiles(1)` avec filtre banque
4. **Résultats** → Fichiers de la banque sélectionnée

## 📊 Avantages de la liste dynamique

### **1. Flexibilité**
- 🔧 **Gestion facile** : Ajout/suppression via la base de données
- 📊 **Données cohérentes** : Même source de vérité
- 🎯 **Maintenance simplifiée** : Pas de modification de code

### **2. Performance**
- ⚡ **Chargement unique** : Une seule requête au montage
- 💾 **Cache local** : État React pour éviter les re-requêtes
- 🔄 **Mise à jour automatique** : Synchronisation avec la DB

### **3. Évolutivité**
- 📈 **Scalable** : Fonctionne avec n'importe quel nombre de banques
- 🔧 **Configurable** : Gestion via interface d'administration
- 🛡️ **Sécurisé** : Contrôle d'accès via authentification

## 🎮 Comportement utilisateur

### **Scénario 1 : Chargement initial**
- ✅ **Liste vide** : Pas de banques affichées pendant le chargement
- ✅ **Chargement** : Requête API en arrière-plan
- ✅ **Affichage** : Liste complète des banques actives

### **Scénario 2 : Filtrage par banque**
- ✅ **Sélection** : Choix dans la liste dynamique
- ✅ **Application** : Filtrage côté serveur
- ✅ **Résultats** : Fichiers de la banque sélectionnée

### **Scénario 3 : Ajout de banque**
- ✅ **Base de données** : Insertion dans la table `banques`
- ✅ **Interface** : Nouvelle banque visible au prochain chargement
- ✅ **Filtrage** : Nouvelle banque disponible dans les filtres

## 🚀 Déploiement

### **1. Redémarrage du serveur**
```bash
# Dans le dossier backend
npm restart
```

### **2. Test de la fonctionnalité**
- **Test 1** : Chargement initial → ✅ Liste des banques récupérée
- **Test 2** : Filtrage par banque → ✅ Filtrage fonctionnel
- **Test 3** : Ajout de banque → ✅ Nouvelle banque visible
- **Test 4** : Suppression de banque → ✅ Banque retirée de la liste

### **3. Vérification de la base de données**
```sql
-- Vérifier les banques actives
SELECT nom, code, is_active FROM banques WHERE is_active = TRUE;

-- Ajouter une nouvelle banque
INSERT INTO banques (nom, code) VALUES ('Nouvelle Banque', 'NOUV');

-- Désactiver une banque
UPDATE banques SET is_active = FALSE WHERE code = 'ANCIEN';
```

## 📝 Notes importantes

### **Structure de la table banques**
- **id** : Identifiant unique auto-incrémenté
- **nom** : Nom complet de la banque (affiché dans l'interface)
- **code** : Code unique de la banque
- **is_active** : Statut actif/inactif de la banque
- **created_at** : Date de création
- **updated_at** : Date de dernière modification

### **Gestion des banques**
- **Activation** : `UPDATE banques SET is_active = TRUE WHERE id = ?`
- **Désactivation** : `UPDATE banques SET is_active = FALSE WHERE id = ?`
- **Ajout** : `INSERT INTO banques (nom, code) VALUES (?, ?)`
- **Modification** : `UPDATE banques SET nom = ?, code = ? WHERE id = ?`

### **Performance**
- **Requête optimisée** : `SELECT DISTINCT nom` avec index
- **Cache côté client** : État React pour éviter les re-requêtes
- **Chargement unique** : Une seule requête au montage du composant

La liste dynamique des banques est maintenant active ! 🎯
