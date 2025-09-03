-- Script pour ajouter le champ description à la table files
USE dataflow;

-- Ajouter le champ description à la table files
ALTER TABLE files ADD COLUMN description TEXT NOT NULL AFTER original_name;

-- Mettre à jour les fichiers existants avec une description par défaut
UPDATE files SET description = 'Fichier uploadé sans description' WHERE description IS NULL OR description = '';

-- Vérifier la modification
DESCRIBE files;

-- Afficher les fichiers avec leurs descriptions
SELECT id, name, original_name, description, file_size, uploaded_at FROM files;
