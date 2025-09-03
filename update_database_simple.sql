-- Script simple pour ajouter les colonnes nécessaires à la table files
-- Exécutez ce script dans votre base de données MySQL

USE dataflow;

-- Ajouter la colonne description
ALTER TABLE files ADD COLUMN description TEXT AFTER original_name;

-- Ajouter la colonne deposant_nom
ALTER TABLE files ADD COLUMN deposant_nom VARCHAR(255) AFTER description;

-- Ajouter la colonne deposant_email
ALTER TABLE files ADD COLUMN deposant_email VARCHAR(255) AFTER deposant_nom;

-- Ajouter la colonne deposant_banque
ALTER TABLE files ADD COLUMN deposant_banque VARCHAR(255) AFTER deposant_email;

-- Mettre à jour les fichiers existants avec une description par défaut
UPDATE files SET description = 'Fichier uploadé sans description' WHERE description IS NULL OR description = '';

-- Mettre à jour les fichiers existants avec les informations du déposant
UPDATE files f 
JOIN users u ON f.uploaded_by = u.id 
SET f.deposant_nom = u.name,
    f.deposant_email = u.email,
    f.deposant_banque = u.banque
WHERE f.deposant_nom IS NULL;

-- Afficher la structure mise à jour
DESCRIBE files;
