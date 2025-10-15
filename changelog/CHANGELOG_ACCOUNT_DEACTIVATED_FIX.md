# Correction - Erreur "Compte désactivé"

## Problème résolu ✅

**Date :** 3 septembre 2025

**Problème :** Les utilisateurs recevaient le message "Compte désactivé" lors de la connexion, même si leur compte était actif dans la base de données (`is_active = 1`).

## Cause du problème

Dans le modèle `User.js`, la méthode `findByEmail` utilisait `SELECT *` au lieu de mapper explicitement le champ `is_active` vers `isActive`. Cela causait :

1. Le champ `is_active` était récupéré tel quel depuis la base de données
2. Dans le contrôleur d'authentification, le code vérifiait `!user.isActive`
3. Comme `user.isActive` était `undefined`, `!user.isActive` retournait `true`
4. L'utilisateur recevait le message "Compte désactivé"

## Fichier modifié

### **Backend - Modèle User** (`backend/models/User.js`)

**Méthode `findByEmail` corrigée :**
```javascript
// AVANT
static async findByEmail(email) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
}

// MAINTENANT
static async findByEmail(email) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id, email, password, role, banque, name, created_at as createdAt, last_login_at as lastLoginAt, is_active as isActive FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
}
```

## Comparaison avec les autres méthodes

Les autres méthodes du modèle User mappaient déjà correctement les champs :

- `findById` : ✅ `is_active as isActive`
- `findByIdWithPassword` : ✅ `is_active as isActive`
- `findAll` : ✅ `is_active as isActive`
- `findByEmail` : ❌ `SELECT *` (maintenant corrigé)

## Résultat

Maintenant, lors de la connexion :
- ✅ Le champ `isActive` est correctement mappé depuis `is_active`
- ✅ La vérification `!user.isActive` fonctionne correctement
- ✅ Les utilisateurs actifs peuvent se connecter sans problème
- ✅ Seuls les utilisateurs vraiment désactivés (`is_active = 0`) recevront le message "Compte désactivé"

## Test

Pour vérifier que la correction fonctionne :
1. Essayez de vous connecter avec un compte actif
2. Le message "Compte désactivé" ne devrait plus apparaître
3. La connexion devrait réussir normalement

