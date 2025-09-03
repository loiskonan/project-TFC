# Changement de Description - Mois + Année

## Modification effectuée ✅

**Date :** 3 septembre 2025

**Changement :** Remplacement du champ de description libre par une liste déroulante pour le mois et un champ pour l'année dans la page d'upload.

## Fichiers modifiés

### 1. **Frontend - Composant Upload** (`src/components/Files/FileUpload.tsx`)

**Ajouts :**
```typescript
// Liste des mois
const MONTHS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  // ... tous les mois
  { value: '12', label: 'Décembre' }
];
```

**États modifiés :**
```typescript
// Avant
const [batchDescription, setBatchDescription] = useState('');

// Après
const [selectedMonth, setSelectedMonth] = useState('');
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
```

**Nouvelles fonctions :**
```typescript
// Générer la description à partir du mois et de l'année
const generateDescription = () => {
  if (!selectedMonth || !selectedYear) return '';
  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label;
  return `${monthLabel} ${selectedYear}`;
};
```

**Interface utilisateur :**
- **Avant :** Champ texte libre pour la description
- **Après :** 
  - Liste déroulante pour sélectionner le mois
  - Champ numérique pour l'année (2000-2100)
  - Affichage en temps réel de la description générée
  - Bouton "Effacer" pour réinitialiser les champs

## Fonctionnalités

1. **Sélection du mois :** Liste déroulante avec tous les mois en français
2. **Saisie de l'année :** Champ numérique avec validation (2000-2100)
3. **Description automatique :** Génération automatique de la description au format "Mois Année"
4. **Validation :** Les deux champs sont obligatoires
5. **Aperçu :** Affichage en temps réel de la description générée
6. **Réinitialisation :** Bouton pour effacer les sélections

## Exemples de descriptions générées

- "Janvier 2024"
- "Décembre 2023"
- "Mars 2025"

## Impact

- **Standardisation :** Toutes les descriptions suivent le même format
- **Simplicité :** Plus besoin de taper manuellement la description
- **Cohérence :** Format uniforme pour tous les uploads
- **Validation :** Évite les erreurs de saisie

## Résultat

La page d'upload utilise maintenant un système de sélection mois/année qui génère automatiquement une description standardisée au format "Mois Année".
