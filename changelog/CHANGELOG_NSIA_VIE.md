# Changelog - Ajout du rôle NSIA Vie

## Résumé des modifications

Ce document décrit les modifications apportées au système pour ajouter le nouveau rôle "NSIA Vie" et rendre le champ banque optionnel selon le rôle choisi.

## Modifications Backend

### 1. Base de données (database_schema.sql)
- **Modification** : Ajout du rôle `'nsia_vie'` dans l'ENUM de la colonne `role`
- **Avant** : `role ENUM('admin', 'user') DEFAULT 'user'`
- **Après** : `role ENUM('admin', 'user', 'nsia_vie') DEFAULT 'user'`

### 2. Contrôleur d'authentification (authController.js)
- **Modification** : Logique conditionnelle pour le champ banque
- **Détail** : Le champ banque est maintenant requis uniquement pour le rôle 'user'
- **Code** : `banque: role === 'user' ? banque : null`

### 3. Contrôleur utilisateur (userController.js)
- **Modification** : Validation conditionnelle du champ banque
- **Ajout** : Validation spécifique pour le rôle 'user' uniquement
- **Modification** : Liste des rôles valides incluant 'nsia_vie'

## Modifications Frontend

### 1. Types TypeScript (types/index.ts)
- **Modification** : Interface User mise à jour
- **Avant** : `role: 'admin' | 'user'`
- **Après** : `role: 'admin' | 'user' | 'nsia_vie'`

### 2. Gestion des utilisateurs (UserManagement.tsx)
- **Ajout** : Option "NSIA Vie" dans le sélecteur de rôle
- **Modification** : Affichage conditionnel du champ banque (uniquement pour 'user')
- **Ajout** : Styles spécifiques pour le rôle NSIA Vie (couleur orange)
- **Modification** : Validation frontend adaptée
- **Ajout** : Filtre par rôle incluant NSIA Vie

### 3. Navigation et accès (Sidebar.tsx, App.tsx)
- **Modification** : Accès aux rapports globaux pour NSIA Vie
- **Ajout** : Section "Rapports globaux" dans le menu NSIA Vie
- **Modification** : Titres personnalisés pour NSIA Vie
- **Exclusion** : Pas d'accès à la gestion des utilisateurs

### 4. Dashboard (Dashboard.tsx)
- **Modification** : Titres personnalisés pour NSIA Vie
- **Ajout** : Affichage "Vue d'ensemble - NSIA Vie"
- **Modification** : Labels des statistiques adaptés ("Fichiers NSIA", "Stockage NSIA")

## Logique métier

### Règles de validation du champ banque :
1. **Rôle 'admin'** : Champ banque non requis (optionnel)
2. **Rôle 'user'** : Champ banque requis
3. **Rôle 'nsia_vie'** : Champ banque non requis (optionnel)

### Affichage conditionnel :
- Le champ banque n'apparaît que pour le rôle 'user'
- Pour les administrateurs et NSIA Vie, le champ banque est masqué

### Accès aux sections :
1. **Rôle 'admin'** : Accès complet (gestion utilisateurs + rapports globaux)
2. **Rôle 'nsia_vie'** : Accès aux rapports globaux (sans gestion utilisateurs)
3. **Rôle 'user'** : Accès limité (pas de rapports globaux)

## Script de mise à jour

### Fichier : update_database_for_nsia_vie.sql
Ce script permet de mettre à jour une base de données existante :
- Modifie la colonne `role` pour accepter le nouveau rôle
- Vérifie que les modifications ont été appliquées
- Affiche les statistiques des rôles existants

## Instructions de déploiement

1. **Backup** : Sauvegarder la base de données existante
2. **Script SQL** : Exécuter `update_database_for_nsia_vie.sql`
3. **Redémarrage** : Redémarrer le serveur backend
4. **Test** : Vérifier la création d'utilisateurs avec le nouveau rôle

## Tests recommandés

1. Créer un utilisateur avec le rôle "NSIA Vie"
2. Vérifier que le champ banque n'est pas requis pour ce rôle
3. Créer un administrateur et vérifier que le champ banque est optionnel
4. Tester les filtres par rôle dans l'interface d'administration
5. Vérifier l'affichage des rôles dans les listes d'utilisateurs

## Compatibilité

- ✅ Compatible avec les utilisateurs existants
- ✅ Migration automatique de la base de données
- ✅ Interface utilisateur mise à jour
- ✅ Validation côté client et serveur
