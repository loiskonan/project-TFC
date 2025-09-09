# Nouvelle Fonctionnalité - Sélection de Banque pour Admins

## Fonctionnalité ajoutée ✅

**Date :** 3 septembre 2025

**Changement :** Ajout d'une interface de sélection de banque pour les administrateurs sur la page de dépôt.

## Description

Les administrateurs peuvent maintenant :
- Voir une liste de toutes les banques actives de la base de données
- Cliquer sur une banque pour la sélectionner
- Voir la banque sélectionnée en jaune (surbrillance)
- Recevoir une confirmation de la banque sélectionnée

## Fichier modifié

### **Frontend - Page Upload** (`src/components/Files/FileUpload.tsx`)

**Nouveaux états ajoutés :**
```typescript
// États pour la sélection de banque (admin)
const [banques, setBanques] = useState<Array<{id: number, nom: string}>>([]);
const [selectedBanque, setSelectedBanque] = useState<number | null>(null);
const [loadingBanques, setLoadingBanques] = useState(false);
```

**Fonction de récupération des banques :**
```typescript
const fetchBanques = async () => {
  setLoadingBanques(true);
  try {
    const token = localStorage.getItem('dataflow_token');
    const response = await axios.get('http://localhost:5000/api/banques/active', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      setBanques(response.data.banques);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des banques:', error);
  } finally {
    setLoadingBanques(false);
  }
};
```

**Fonction de sélection de banque :**
```typescript
const handleBanqueSelect = (banqueId: number) => {
  setSelectedBanque(banqueId);
  // Réinitialiser les autres états quand on change de banque
  setUploadQueue([]);
  setUploadStatus({});
  setError('');
  setSuccess('');
};
```

**Interface utilisateur :**
```typescript
{currentUser?.role === 'admin' && (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélectionner une banque</h3>
    
    {loadingBanques ? (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement des banques...</span>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banques.map((banque) => (
          <div
            key={banque.id}
            onClick={() => handleBanqueSelect(banque.id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedBanque === banque.id
                ? 'border-yellow-400 bg-yellow-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Building2 className={`h-6 w-6 ${
                selectedBanque === banque.id ? 'text-yellow-600' : 'text-gray-500'
              }`} />
              <div>
                <h4 className={`font-medium ${
                  selectedBanque === banque.id ? 'text-yellow-800' : 'text-gray-900'
                }`}>
                  {banque.nom}
                </h4>
                <p className={`text-sm ${
                  selectedBanque === banque.id ? 'text-yellow-600' : 'text-gray-500'
                }`}>
                  Cliquer pour sélectionner
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {selectedBanque && (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">
          Banque sélectionnée : {banques.find(b => b.id === selectedBanque)?.nom}
        </h4>
        <p className="text-sm text-blue-700">
          Vous pouvez maintenant déposer des fichiers pour cette banque.
        </p>
      </div>
    )}
  </div>
)}
```

## Fonctionnalités

### ✅ **Affichage des banques**
- Liste de toutes les banques actives de la base de données
- Chargement automatique au montage du composant
- Indicateur de chargement pendant la récupération

### ✅ **Sélection interactive**
- Cadres cliquables pour chaque banque
- Surbrillance jaune pour la banque sélectionnée
- Effet de survol (hover) pour une meilleure UX

### ✅ **Design responsive**
- Grille adaptative : 1 colonne sur mobile, 2 sur tablette, 3 sur desktop
- Icône Building2 de Lucide React pour représenter les banques
- Transitions fluides et animations

### ✅ **Feedback visuel**
- Confirmation de la banque sélectionnée
- Réinitialisation automatique des autres états
- Messages informatifs pour guider l'utilisateur

## États visuels

### **Banque non sélectionnée :**
- Bordure grise (`border-gray-200`)
- Fond blanc
- Icône grise (`text-gray-500`)
- Texte gris foncé

### **Banque sélectionnée :**
- Bordure jaune (`border-yellow-400`)
- Fond jaune clair (`bg-yellow-50`)
- Icône jaune (`text-yellow-600`)
- Texte jaune foncé (`text-yellow-800`)
- Ombre portée (`shadow-md`)

### **Effet de survol :**
- Bordure grise plus foncée (`hover:border-gray-300`)
- Ombre portée (`hover:shadow-md`)

## Utilisation

1. **Connexion admin** : L'administrateur se connecte avec son compte
2. **Accès à la page** : Il navigue vers la page de dépôt
3. **Sélection de banque** : Il voit la liste des banques et clique sur celle souhaitée
4. **Confirmation** : La banque sélectionnée s'affiche en jaune avec une confirmation
5. **Prochaines étapes** : L'interface peut être étendue pour permettre l'upload de fichiers pour la banque sélectionnée

## Résultat

L'interface admin est maintenant plus intuitive et permet une sélection claire de la banque cible pour les dépôts de fichiers.

