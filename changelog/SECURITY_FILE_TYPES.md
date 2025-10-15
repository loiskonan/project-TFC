# Types de Fichiers Dangereux - Sécurité des Uploads

## Types de fichiers à EXCLURE pour des raisons de sécurité

### 1. **Fichiers Exécutables** ⚠️ DANGER
- `.exe` - Exécutables Windows
- `.msi` - Installateurs Windows
- `.bat` - Scripts batch Windows
- `.cmd` - Commandes Windows
- `.com` - Exécutables DOS
- `.scr` - Screensavers (peuvent contenir du code malveillant)
- `.pif` - Fichiers d'information de programme
- `.vbs` - Scripts Visual Basic
- `.js` - JavaScript (peut être exécuté)
- `.jar` - Archives Java (peuvent contenir du code exécutable)

### 2. **Scripts et Code** ⚠️ DANGER
- `.php` - Scripts PHP
- `.asp` - Active Server Pages
- `.aspx` - ASP.NET
- `.jsp` - Java Server Pages
- `.py` - Scripts Python
- `.pl` - Scripts Perl
- `.rb` - Scripts Ruby
- `.sh` - Scripts Shell Unix/Linux
- `.ps1` - Scripts PowerShell
- `.cgi` - Scripts CGI

### 3. **Fichiers de Configuration Système** ⚠️ DANGER
- `.reg` - Registre Windows
- `.inf` - Fichiers d'information Windows
- `.sys` - Fichiers système
- `.dll` - Bibliothèques dynamiques
- `.ocx` - Contrôles ActiveX
- `.cab` - Archives Cabinet Windows

### 4. **Fichiers de Base de Données Sensibles** ⚠️ DANGER
- `.mdb` - Base de données Access
- `.accdb` - Base de données Access (nouveau format)
- `.db` - Bases de données SQLite
- `.sql` - Scripts SQL (peuvent contenir des injections)

### 5. **Fichiers de Configuration Réseau** ⚠️ DANGER
- `.htaccess` - Configuration Apache
- `.htpasswd` - Fichiers de mots de passe
- `.conf` - Fichiers de configuration
- `.ini` - Fichiers de configuration
- `.cfg` - Fichiers de configuration

### 6. **Fichiers de Log et Temporaires** ⚠️ RISQUE
- `.log` - Fichiers de journal
- `.tmp` - Fichiers temporaires
- `.temp` - Fichiers temporaires
- `.cache` - Fichiers de cache

## Types de fichiers AUTORISÉS (sécurisés)

### 1. **Documents Office** ✅ SÉCURISÉ
- `.pdf` - Documents PDF
- `.doc` - Documents Word
- `.docx` - Documents Word (nouveau format)
- `.xls` - Feuilles Excel
- `.xlsx` - Feuilles Excel (nouveau format)
- `.ppt` - Présentations PowerPoint
- `.pptx` - Présentations PowerPoint (nouveau format)
- `.txt` - Fichiers texte
- `.rtf` - Rich Text Format

### 2. **Images** ✅ SÉCURISÉ
- `.jpg` / `.jpeg` - Images JPEG
- `.png` - Images PNG
- `.gif` - Images GIF
- `.bmp` - Images Bitmap
- `.tiff` - Images TIFF
- `.svg` - Images vectorielles

### 3. **Archives** ✅ SÉCURISÉ (avec vérification)
- `.zip` - Archives ZIP
- `.rar` - Archives RAR
- `.7z` - Archives 7-Zip
- `.tar` - Archives TAR
- `.gz` - Archives GZIP

### 4. **Médias** ✅ SÉCURISÉ
- `.mp3` - Audio MP3
- `.mp4` - Vidéo MP4
- `.avi` - Vidéo AVI
- `.mov` - Vidéo QuickTime
- `.wav` - Audio WAV

## Recommandations de Sécurité

### 1. **Validation Multi-niveaux**
- Vérification de l'extension de fichier
- Vérification du MIME type
- Vérification du contenu du fichier (magic bytes)
- Scan antivirus (optionnel)

### 2. **Limitations**
- Taille maximale : 50MB
- Nombre de fichiers par upload : limité
- Types de fichiers : liste blanche uniquement

### 3. **Isolation**
- Stockage dans un répertoire isolé
- Pas d'exécution possible
- Accès en lecture seule

### 4. **Monitoring**
- Logs de tous les uploads
- Alertes pour les tentatives suspectes
- Audit régulier des fichiers uploadés

## Implémentation Recommandée

```javascript
const DANGEROUS_EXTENSIONS = [
  '.exe', '.msi', '.bat', '.cmd', '.com', '.scr', '.pif',
  '.vbs', '.js', '.jar', '.php', '.asp', '.aspx', '.jsp',
  '.py', '.pl', '.rb', '.sh', '.ps1', '.cgi', '.reg',
  '.inf', '.sys', '.dll', '.ocx', '.cab', '.mdb', '.accdb',
  '.db', '.sql', '.htaccess', '.htpasswd', '.conf', '.ini',
  '.cfg', '.log', '.tmp', '.temp', '.cache'
];

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.rtf', '.jpg', '.jpeg', '.png', '.gif', '.bmp',
  '.tiff', '.svg', '.zip', '.rar', '.7z', '.tar', '.gz',
  '.mp3', '.mp4', '.avi', '.mov', '.wav'
];
```
