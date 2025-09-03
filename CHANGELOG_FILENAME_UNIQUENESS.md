# Modification de la Vérification d'Unicité - Nom de Fichier

## Modification effectuée ✅

**Date :** 3 septembre 2025

**Changement :** Remplacement de la vérification d'unicité de la description par une vérification d'unicité du nom de fichier par banque.

## Problème résolu

**Avant :** Le système vérifiait l'unicité de la description par banque, ce qui empêchait d'avoir plusieurs fichiers avec la même description.

**Maintenant :** Le système vérifie l'unicité du nom de fichier par banque, ce qui empêche d'avoir plusieurs fichiers avec le même nom dans la même banque.

## Fichiers modifiés

### 1. **Backend - Modèle File** (`backend/models/File.js`)

**Méthode remplacée :**
```javascript
// AVANT
static async descriptionExists(description, deposantBanque) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) as count 
      FROM files 
      WHERE description = ? AND deposant_banque = ?
    `;
    db.query(query, [description.trim(), deposantBanque], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0].count > 0);
      }
    });
  });
}

// MAINTENANT
static async fileNameExists(originalName, deposantBanque) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) as count 
      FROM files 
      WHERE original_name = ? AND deposant_banque = ?
    `;
    db.query(query, [originalName, deposantBanque], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0].count > 0);
      }
    });
  });
}
```

### 2. **Backend - Contrôleur Upload Simple** (`backend/controllers/userUploadController.js`)

**Vérification modifiée :**
```javascript
// AVANT
const descriptionExists = await File.descriptionExists(description, req.user.banque);
if (descriptionExists) {
  return res.status(400).json({
    success: false,
    message: `Une description identique existe déjà pour votre banque. Veuillez utiliser une description différente.`
  });
}

// MAINTENANT
const fileNameExists = await File.fileNameExists(req.file.originalname, req.user.banque);
if (fileNameExists) {
  return res.status(400).json({
    success: false,
    message: `Un fichier avec le nom "${req.file.originalname}" existe déjà pour votre banque. Veuillez renommer le fichier ou utiliser un autre fichier.`
  });
}
```

### 3. **Backend - Contrôleur Upload Multiple** (`backend/controllers/userUploadController.js`)

**Vérification batch modifiée :**
```javascript
// AVANT
const descriptionExists = await File.descriptionExists(description, req.user.banque);
if (descriptionExists) {
  return res.status(400).json({
    success: false,
    message: `Une description identique existe déjà pour votre banque. Veuillez utiliser une description différente.`
  });
}

// MAINTENANT
const duplicateFiles = [];
for (const file of req.files) {
  const fileNameExists = await File.fileNameExists(file.originalname, req.user.banque);
  if (fileNameExists) {
    duplicateFiles.push(file.originalname);
  }
}

if (duplicateFiles.length > 0) {
  return res.status(400).json({
    success: false,
    message: `Les fichiers suivants existent déjà pour votre banque : ${duplicateFiles.join(', ')}. Veuillez renommer ces fichiers ou utiliser d'autres fichiers.`
  });
}
```

## Avantages de cette modification

### ✅ **Logique plus intuitive**
- Les utilisateurs s'attendent à ce que chaque fichier ait un nom unique
- Plus naturel de vérifier l'unicité du nom que de la description

### ✅ **Flexibilité des descriptions**
- Plusieurs fichiers peuvent maintenant avoir la même description
- Permet de grouper des fichiers par description (ex: "Documents de janvier 2025")

### ✅ **Prévention des conflits**
- Évite les écrasements accidentels de fichiers
- Maintient l'intégrité des données par banque

### ✅ **Messages d'erreur clairs**
- Indique précisément quel fichier pose problème
- Guide l'utilisateur vers la solution (renommer ou changer de fichier)

## Impact sur les utilisateurs

### **Upload Simple**
- Si un fichier avec le même nom existe déjà → Message d'erreur avec le nom du fichier
- L'utilisateur doit renommer le fichier ou en choisir un autre

### **Upload Multiple**
- Si plusieurs fichiers ont des noms en conflit → Message d'erreur avec la liste des fichiers
- Tous les fichiers sont rejetés si au moins un nom est en conflit

### **Par banque**
- L'unicité est vérifiée par banque
- Deux banques différentes peuvent avoir des fichiers avec le même nom
- Chaque banque a son propre espace de noms

## Résultat

Le système d'upload est maintenant plus logique et intuitif :
- ✅ **Vérification par nom de fichier** au lieu de description
- ✅ **Messages d'erreur précis** avec les noms des fichiers
- ✅ **Flexibilité des descriptions** pour grouper les fichiers
- ✅ **Prévention des conflits** par banque
