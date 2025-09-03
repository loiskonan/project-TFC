-- Script robuste pour ajouter la description et les informations du déposant à la table files
-- Ce script vérifie l'existence des colonnes avant de les ajouter

USE dataflow;

-- Fonction pour vérifier si une colonne existe
DELIMITER $$

-- Étape 1: Ajouter la colonne description (si elle n'existe pas déjà)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'dataflow' 
     AND TABLE_NAME = 'files' 
     AND COLUMN_NAME = 'description') = 0,
    'ALTER TABLE files ADD COLUMN description TEXT AFTER original_name',
    'SELECT "Column description already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Étape 2: Mettre à jour les fichiers existants avec une description par défaut
UPDATE files SET description = 'Fichier uploadé sans description' WHERE description IS NULL OR description = '';

-- Étape 3: Ajouter la colonne deposant_nom (si elle n'existe pas déjà)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'dataflow' 
     AND TABLE_NAME = 'files' 
     AND COLUMN_NAME = 'deposant_nom') = 0,
    'ALTER TABLE files ADD COLUMN deposant_nom VARCHAR(255) AFTER description',
    'SELECT "Column deposant_nom already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Étape 4: Ajouter la colonne deposant_email (si elle n'existe pas déjà)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'dataflow' 
     AND TABLE_NAME = 'files' 
     AND COLUMN_NAME = 'deposant_email') = 0,
    'ALTER TABLE files ADD COLUMN deposant_email VARCHAR(255) AFTER deposant_nom',
    'SELECT "Column deposant_email already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Étape 5: Ajouter la colonne deposant_banque (si elle n'existe pas déjà)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'dataflow' 
     AND TABLE_NAME = 'files' 
     AND COLUMN_NAME = 'deposant_banque') = 0,
    'ALTER TABLE files ADD COLUMN deposant_banque VARCHAR(255) AFTER deposant_email',
    'SELECT "Column deposant_banque already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DELIMITER ;

-- Étape 6: Mettre à jour les fichiers existants avec les informations du déposant
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
