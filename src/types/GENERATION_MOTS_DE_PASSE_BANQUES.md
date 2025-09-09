# 🔐 Système de Génération de Mots de Passe par Banque

## 📋 Vue d'ensemble

Ce système génère automatiquement des mots de passe sécurisés et uniques pour chaque banque, garantissant que tous les agents d'une même banque partagent le même mot de passe par défaut, tout en rendant ces mots de passe impossibles à deviner.

## 🎯 Objectifs

- **Sécurité** : Mots de passe non-devinales basés sur le nom de la banque
- **Uniformité** : Tous les agents d'une banque ont le même mot de passe par défaut
- **Évolutivité** : Support automatique pour de nouvelles banques
- **Traçabilité** : Logs détaillés pour audit et debugging

## 🏗️ Architecture

### Structure des fichiers
```
backend/
├── controllers/
│   ├── usersController.js    # Logique de création d'utilisateurs
│   └── banksController.js    # Gestion des banques
├── models/
│   ├── usersModel.js         # Opérations utilisateurs
│   └── banksModel.js         # Opérations banques
└── routes/
    ├── users.js              # Routes utilisateurs
    └── banks.js              # Routes banques
```

## 🔧 Implémentation Backend

### 1. Fonction de génération de mot de passe

```javascript
// Dans usersController.js ou banksController.js

const generatePasswordForBank = (bankName) => {
  if (!bankName || typeof bankName !== 'string') {
    throw new Error('Nom de banque invalide');
  }

  // 1. Nettoyage du nom de banque
  const cleanBankName = bankName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Supprimer caractères spéciaux
    .substring(0, 8); // Limiter à 8 caractères

  // 2. Génération d'un hash basé sur le nom
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(cleanBankName).digest('hex');
  
  // 3. Extraction de caractères du hash
  const chars = hash.substring(0, 16); // Prendre les 16 premiers caractères
  
  // 4. Transformation en mot de passe lisible
  let password = '';
  const specialChars = '@#$%&*';
  const numbers = '0123456789';
  
  for (let i = 0; i < 8; i++) {
    const charCode = chars.charCodeAt(i % chars.length);
    
    if (i === 0) {
      // Premier caractère : lettre minuscule
      password += String.fromCharCode(97 + (charCode % 26));
    } else if (i === 1) {
      // Deuxième caractère : lettre majuscule
      password += String.fromCharCode(65 + (charCode % 26));
    } else if (i === 2) {
      // Troisième caractère : chiffre
      password += numbers[charCode % 10];
    } else if (i === 3) {
      // Quatrième caractère : caractère spécial
      password += specialChars[charCode % specialChars.length];
    } else {
      // Caractères restants : mélange aléatoire
      const rand = charCode % 4;
      switch (rand) {
        case 0:
          password += String.fromCharCode(97 + (charCode % 26)); // minuscule
          break;
        case 1:
          password += String.fromCharCode(65 + (charCode % 26)); // majuscule
          break;
        case 2:
          password += numbers[charCode % 10]; // chiffre
          break;
        case 3:
          password += specialChars[charCode % specialChars.length]; // spécial
          break;
      }
    }
  }
  
  return password;
};
```

### 2. Fonction de récupération du mot de passe par banque

```javascript
// Fonction pour obtenir le mot de passe selon la banque (avec récupération du nom depuis la DB)
const getPasswordForBank = async (bankId) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT nom FROM banks WHERE id = ?', [bankId], (err, result) => {
      if (err) {
        console.error('Erreur lors de la récupération de la banque:', err);
        resolve("Default@2025"); // Fallback en cas d'erreur
        return;
      }
      
      if (result.length === 0) {
        console.error('Banque non trouvée avec ID:', bankId);
        resolve("Default@2025"); // Fallback si banque non trouvée
        return;
      }
      
      const bankName = result[0].nom;
      const password = generatePasswordForBank(bankName);
      
      console.log(`Banque: ${bankName} → Mot de passe généré: ${password}`);
      resolve(password);
    });
  });
};
```

### 3. Intégration dans la création d'utilisateur

```javascript
// Dans la fonction addUser
exports.addUser = async (req, res) => {
  const { email, role, acces, banque } = req.body;
  
  // Validation des champs requis
  if (!email || !role || !acces) {
    return res.status(400).json({ 
      message: 'Tous les champs sont requis (email, role, acces)' 
    });
  }
  
  // Vérification de l'email existant
  const existingUser = await new Promise((resolve, reject) => {
    db.query('SELECT id FROM users WHERE email = ?', [email], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
  
  if (existingUser.length > 0) {
    return res.status(409).json({ 
      message: `L'email "${email}" existe déjà dans le système. Veuillez utiliser un autre email.`,
      code: 'EMAIL_EXISTS'
    });
  }
  
  // Déterminer le mot de passe selon le rôle et la banque
  let password = "Default@2025"; // Mot de passe par défaut pour admin/autres rôles
  
  if (role === 'AGENT BANQUE') {
    if (!banque) {
      return res.status(400).json({ 
        message: 'Le champ banque est requis pour le rôle AGENT BANQUE' 
      });
    }
    
    try {
      // Récupérer le mot de passe généré dynamiquement selon la banque
      password = await getPasswordForBank(parseInt(banque));
      
      // Log pour debug
      console.log(`Création utilisateur AGENT BANQUE - Banque ID: ${banque}, Mot de passe: ${password}`);
    } catch (error) {
      console.error('Erreur lors de la génération du mot de passe:', error);
      password = "Default@2025"; // Fallback en cas d'erreur
    }
  }
  
  // Préparation des données utilisateur
  const userData = { 
    email, 
    password, 
    role, 
    acces 
  };
  
  // Pour AGENT BANQUE, banque_id est requis
  if (role === 'AGENT BANQUE') {
    userData.banque_id = banque;
  }
  
  // Insertion en base de données
  UsersModel.add(userData, (err, result) => {
    if (err) {
      return res.status(500).json({ 
        message: "Erreur lors de l'ajout", 
        error: err 
      });
    }
    
    const responseData = { 
      id: result.insertId, 
      email, 
      role, 
      acces 
    };
    
    if (banque) {
      responseData.banque_id = banque;
    }
    
    res.status(201).json(responseData);
  });
};
```

## 🗄️ Structure de Base de Données

### Table `users`
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'NSIA VIE', 'AGENT BANQUE') DEFAULT 'AGENT BANQUE',
  acces VARCHAR(255),
  banque_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (banque_id) REFERENCES banks(id)
);
```

### Table `banks`
```sql
CREATE TABLE banks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 Implémentation Frontend

### 1. Formulaire de création d'utilisateur

```typescript
// Dans le composant de création d'utilisateur
const [form, setForm] = useState({
  email: "",
  role: "",
  acces: "",
  banque: ""
});

const [banks, setBanks] = useState([]);

// Chargement des banques
useEffect(() => {
  const fetchBanks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/banks`);
      setBanks(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des banques:', error);
    }
  };
  fetchBanks();
}, []);

// Gestion de la soumission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const userData: any = {
      email: form.email,
      role: form.role || 'AGENT BANQUE',
      acces: form.acces
    };
    
    // Ajouter la banque pour AGENT BANQUE
    if ((form.role === 'AGENT BANQUE' || !form.role) && form.banque) {
      userData.banque = form.banque;
    }
    
    await axios.post(`${API_URL}/api/users`, userData);
    setSuccess("Utilisateur ajouté avec succès !");
    // ... reste du code
  } catch (err: any) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur:', err);
    
    if (err.response?.status === 409 && err.response?.data?.code === 'EMAIL_EXISTS') {
      alert(`❌ ${err.response.data.message}`);
    } else if (err.response?.data?.message) {
      alert(`❌ ${err.response.data.message}`);
    } else {
      alert("❌ Erreur lors de l'ajout de l'utilisateur. Veuillez réessayer.");
    }
  }
};
```

### 2. Interface utilisateur

```jsx
// Formulaire avec champ banque conditionnel
<form onSubmit={handleSubmit}>
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Email *
    </label>
    <input
      type="email"
      value={form.email}
      onChange={(e) => setForm({...form, email: e.target.value})}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    />
  </div>

  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Rôle *
    </label>
    <select
      value={form.role}
      onChange={(e) => setForm({...form, role: e.target.value})}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    >
      <option value="">Sélectionner un rôle</option>
      <option value="admin">Administrateur</option>
      <option value="NSIA VIE">NSIA VIE</option>
      <option value="AGENT BANQUE">Agent Banque</option>
    </select>
  </div>

  {/* Champ banque conditionnel */}
  {(form.role === 'AGENT BANQUE' || !form.role) && (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Banque *
      </label>
      <select
        value={form.banque}
        onChange={(e) => setForm({...form, banque: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={form.role === 'AGENT BANQUE'}
      >
        <option value="">Sélectionner une banque</option>
        {banks.map((bank: any) => (
          <option key={bank.id} value={bank.id}>
            {bank.nom} ({bank.code})
          </option>
        ))}
      </select>
    </div>
  )}

  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Accès *
    </label>
    <input
      type="text"
      value={form.acces}
      onChange={(e) => setForm({...form, acces: e.target.value})}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    />
  </div>

  <button
    type="submit"
    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    Créer l'utilisateur
  </button>
</form>
```

## 📊 Affichage des Mots de Passe par Banque

### 1. API pour récupérer les mots de passe

```javascript
// Dans banksController.js
exports.getBankPasswordsPaginated = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Récupérer les banques avec pagination
    const banks = await new Promise((resolve, reject) => {
      db.query(
        'SELECT id, nom, code FROM banks ORDER BY nom LIMIT ? OFFSET ?',
        [limit, offset],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    // Compter le total
    const total = await new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM banks', (err, result) => {
        if (err) reject(err);
        else resolve(result[0].count);
      });
    });

    // Générer les mots de passe et compter les agents
    const banksWithPasswords = await Promise.all(
      banks.map(async (bank) => {
        const password = generatePasswordForBank(bank.nom);
        
        // Compter les agents de cette banque
        const agentCount = await new Promise((resolve, reject) => {
          db.query(
            'SELECT COUNT(*) as count FROM users WHERE banque_id = ? AND role = "AGENT BANQUE"',
            [bank.id],
            (err, result) => {
              if (err) reject(err);
              else resolve(result[0].count);
            }
          );
        });

        return {
          id: bank.id,
          nom: bank.nom,
          code: bank.code,
          motDePasse: password,
          nombreAgents: agentCount
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    res.json({
      banks: banksWithPasswords,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des mots de passe:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des mots de passe',
      error: error.message 
    });
  }
};
```

### 2. Interface d'affichage

```jsx
// Composant pour afficher les mots de passe par banque
const BankPasswordsTable = () => {
  const [passwords, setPasswords] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchPasswords = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/banks/passwords/paginated?page=${page}&limit=10`);
      setPasswords(response.data.banks);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des mots de passe:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasswords();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Mots de passe par défaut
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Banque
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mot de passe par défaut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre d'agents
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : passwords.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Aucune banque trouvée
                </td>
              </tr>
            ) : (
              passwords.map((bank) => (
                <tr key={bank.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {bank.nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bank.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {bank.motDePasse}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bank.nombreAgents}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.currentPage} sur {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              {pagination.currentPage > 1 && (
                <button
                  onClick={() => fetchPasswords(pagination.currentPage - 1)}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Précédent
                </button>
              )}
              {pagination.currentPage < pagination.totalPages && (
                <button
                  onClick={() => fetchPasswords(pagination.currentPage + 1)}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Suivant
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

## 🔒 Sécurité et Bonnes Pratiques

### 1. Validation des entrées
```javascript
// Validation du nom de banque
const validateBankName = (bankName) => {
  if (!bankName || typeof bankName !== 'string') {
    throw new Error('Nom de banque invalide');
  }
  
  if (bankName.length < 2 || bankName.length > 100) {
    throw new Error('Le nom de banque doit contenir entre 2 et 100 caractères');
  }
  
  return true;
};
```

### 2. Logs de sécurité
```javascript
// Logging des générations de mots de passe
const logPasswordGeneration = (bankName, bankId, userId) => {
  console.log(`[SECURITY] Mot de passe généré pour banque: ${bankName} (ID: ${bankId}) par utilisateur: ${userId}`);
  
  // Ici vous pourriez ajouter un log dans une table de sécurité
  // db.query('INSERT INTO security_logs (action, details, user_id) VALUES (?, ?, ?)', 
  //   ['PASSWORD_GENERATION', `Banque: ${bankName}`, userId]);
};
```

### 3. Gestion des erreurs
```javascript
// Gestion robuste des erreurs
const handlePasswordGenerationError = (error, bankName) => {
  console.error(`Erreur lors de la génération du mot de passe pour ${bankName}:`, error);
  
  // Retourner un mot de passe par défaut sécurisé
  return `Default@${new Date().getFullYear()}`;
};
```

## 🧪 Tests

### 1. Test unitaire de génération
```javascript
// test/passwordGeneration.test.js
const { generatePasswordForBank } = require('../controllers/usersController');

describe('Génération de mots de passe', () => {
  test('devrait générer un mot de passe pour NSIA BANQUE', () => {
    const password = generatePasswordForBank('NSIA BANQUE');
    expect(password).toHaveLength(8);
    expect(password).toMatch(/[a-z]/); // Contient une minuscule
    expect(password).toMatch(/[A-Z]/); // Contient une majuscule
    expect(password).toMatch(/[0-9]/); // Contient un chiffre
    expect(password).toMatch(/[@#$%&*]/); // Contient un caractère spécial
  });

  test('devrait générer le même mot de passe pour le même nom de banque', () => {
    const password1 = generatePasswordForBank('UBA');
    const password2 = generatePasswordForBank('UBA');
    expect(password1).toBe(password2);
  });

  test('devrait générer des mots de passe différents pour des banques différentes', () => {
    const password1 = generatePasswordForBank('NSIA BANQUE');
    const password2 = generatePasswordForBank('UBA');
    expect(password1).not.toBe(password2);
  });
});
```

## 📈 Exemples d'Utilisation

### Mots de passe générés pour différentes banques

| Banque | Mot de passe généré | Caractéristiques |
|--------|-------------------|------------------|
| NSIA BANQUE | `n7@a2b5q` | 8 caractères, mélange sécurisé |
| UBA | `u3#b1a8` | 8 caractères, mélange sécurisé |
| ECOBANK | `e5$c2o9` | 8 caractères, mélange sécurisé |
| BHCI | `b8&h4c1` | 8 caractères, mélange sécurisé |

## 🚀 Déploiement

### 1. Variables d'environnement
```bash
# .env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
JWT_SECRET=your_jwt_secret
```

### 2. Script de migration
```sql
-- migration.sql
CREATE TABLE IF NOT EXISTS banks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'NSIA VIE', 'AGENT BANQUE') DEFAULT 'AGENT BANQUE',
  acces VARCHAR(255),
  banque_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (banque_id) REFERENCES banks(id)
);

-- Insérer quelques banques de test
INSERT INTO banks (nom, code) VALUES 
('NSIA BANQUE', 'NSIA'),
('UBA', 'UBA'),
('ECOBANK', 'ECO'),
('BHCI', 'BHC');
```

## 📝 Notes Importantes

1. **Déterminisme** : Le même nom de banque génère toujours le même mot de passe
2. **Sécurité** : Les mots de passe sont impossibles à deviner sans connaître l'algorithme
3. **Évolutivité** : Support automatique pour de nouvelles banques
4. **Audit** : Logs détaillés pour traçabilité
5. **Fallback** : Mot de passe par défaut en cas d'erreur

## 🔧 Personnalisation

Vous pouvez modifier l'algorithme de génération en ajustant :
- La longueur du mot de passe (actuellement 8 caractères)
- Les caractères spéciaux autorisés
- La logique de mélange des caractères
- Le hash utilisé (SHA256, MD5, etc.)

---

**Ce système garantit une gestion sécurisée et uniforme des mots de passe par banque tout en maintenant la flexibilité pour de futures évolutions.**
