# DataFlow Backend API

## Configuration

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de l'environnement
Copiez le fichier `env.example` vers `.env` :
```bash
cp env.example .env
```

### 3. Variables d'environnement (.env)
```env
# Configuration de la base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dataflow
DB_PORT=3306

# Configuration JWT
JWT_SECRET=dataflow-super-secret-key-2024

# Configuration du serveur
PORT=5000
NODE_ENV=development

# Configuration CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Base de données
Assurez-vous que :
- MySQL/XAMPP est en cours d'exécution
- La base de données `dataflow` existe
- Les tables sont créées (voir `database_schema.sql`)

### 5. Démarrage
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/forgot-password` - Récupération mot de passe
- `GET /api/auth/verify` - Vérification token JWT

### Test
- `GET /` - Test de l'API

## Structure MVC
```
backend/
├── config/
│   └── db.js          # Configuration base de données
├── controllers/
│   └── authController.js  # Contrôleur authentification
├── models/
│   └── User.js        # Modèle utilisateur
├── routes/
│   └── auth.js        # Routes authentification
├── server.js          # Serveur principal
├── package.json       # Dépendances
└── .env              # Variables d'environnement
```




