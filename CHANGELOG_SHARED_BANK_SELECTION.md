# Modification - Interface de Sélection de Banque Commune

## Modification effectuée ✅

**Date :** 3 septembre 2025

**Changement :** L'interface de sélection de banques et de dépôt est maintenant accessible aux rôles `admin` et `nsia_vie`.

## Description

**Avant :** Seuls les administrateurs (`admin`) pouvaient accéder à l'interface de sélection de banques et de dépôt.

**Maintenant :** Les utilisateurs avec les rôles `admin` et `nsia_vie` peuvent tous les deux :
- Voir la liste des banques
- Sélectionner une banque
- Déposer des fichiers pour la banque sélectionnée

## Fichier modifié

### **Frontend - Page Upload** (`src/components/Files/FileUpload.tsx`)

**1. Commentaire mis à jour :**
```typescript
// AVANT
// États pour la sélection de banque (admin)

// MAINTENANT
// États pour la sélection de banque (admin et nsia_vie)
```

**2. useEffect modifié :**
```typescript
// AVANT
useEffect(() => {
  if (currentUser?.role === 'admin') {
    fetchBanques();
  }
}, [currentUser?.role]);

// MAINTENANT
useEffect(() => {
  if (currentUser?.role === 'admin' || currentUser?.role === 'nsia_vie') {
    fetchBanques();
  }
}, [currentUser?.role]);
```

**3. Condition d'affichage modifiée :**
```typescript
// AVANT
{currentUser?.role === 'admin' && (

// MAINTENANT
{(currentUser?.role === 'admin' || currentUser?.role === 'nsia_vie') && (
```

## Fonctionnalités communes

### **Pour les rôles `admin` et `nsia_vie` :**

✅ **Sélection de banque**
- Grille des banques cliquables
- Surbrillance jaune pour la banque sélectionnée
- Confirmation de la sélection

✅ **Formulaire de dépôt**
- Titre dynamique avec nom de la banque
- Zone d'upload (drag & drop + sélection manuelle)
- Description du lot (mois/année)
- Gestion des fichiers en attente

✅ **Workflow complet**
- Sélection → Confirmation → Dépôt → Upload
- Messages d'erreur/succès
- Validation des fichiers

## Différences avec les utilisateurs (`user`)

### **Utilisateurs (`user`) :**
- Interface simplifiée
- Pas de sélection de banque (utilise leur banque assignée)
- Titre : "Dépôt [Nom de leur banque]"

### **Admins et NSIA Vie :**
- Interface complète avec sélection de banque
- Peuvent choisir n'importe quelle banque
- Titre : "Dépôt [Banque sélectionnée]"

## Avantages

### **🎯 Cohérence des rôles**
- `admin` et `nsia_vie` ont des privilèges similaires
- Interface unifiée pour les deux rôles
- Même workflow de dépôt

### **💼 Flexibilité opérationnelle**
- Les utilisateurs NSIA Vie peuvent déposer pour différentes banques
- Pas de limitation à une seule banque
- Même niveau de contrôle que les admins

### **🔄 Maintenance simplifiée**
- Un seul code pour deux rôles
- Moins de duplication
- Plus facile à maintenir

## Résultat

L'interface de dépôt est maintenant accessible aux deux rôles privilégiés :
- ✅ **Administrateurs** : Accès complet
- ✅ **NSIA Vie** : Accès complet (même interface)
- ✅ **Utilisateurs** : Interface simplifiée (banque assignée uniquement)

Cette modification aligne les privilèges des rôles `admin` et `nsia_vie` pour la fonctionnalité de dépôt de fichiers.

