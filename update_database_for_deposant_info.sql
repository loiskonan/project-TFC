-- Script pour ajouter la description et les informations du déposant à la table files
-- Ce script ajoute d'abord la colonne description puis les colonnes pour stocker les informations du déposant

USE dataflow;

-- Étape 1: Ajouter la colonne description (si elle n'existe pas déjà)
ALTER TABLE files ADD COLUMN description TEXT AFTER original_name;

-- Étape 2: Mettre à jour les fichiers existants avec une description par défaut
UPDATE files SET description = 'Fichier uploadé sans description' WHERE description IS NULL OR description = '';

-- Étape 3: Ajouter les colonnes d'informations du déposant
ALTER TABLE files ADD COLUMN deposant_nom VARCHAR(255) AFTER description;
ALTER TABLE files ADD COLUMN deposant_email VARCHAR(255) AFTER deposant_nom;
ALTER TABLE files ADD COLUMN deposant_banque VARCHAR(255) AFTER deposant_email;

-- Mettre à jour les fichiers existants avec les informations du déposant
-- (basé sur les informations de l'utilisateur qui a uploadé)
UPDATE files f 
JOIN users u ON f.uploaded_by = u.id 
SET f.deposant_nom = u.name,
    f.deposant_email = u.email,
    f.deposant_banque = u.banque
WHERE f.deposant_nom IS NULL;

-- Afficher la structure mise à jour de la table files
DESCRIBE files;

-- Afficher quelques exemples de fichiers avec les nouvelles informations
SELECT id, name, original_name, description, deposant_nom, deposant_email, deposant_banque, uploaded_at 
FROM files 
LIMIT 5;
