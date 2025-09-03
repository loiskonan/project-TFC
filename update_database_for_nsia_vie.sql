-- Script de mise à jour pour ajouter le rôle NSIA Vie
-- À exécuter sur la base de données existante

USE dataflow;

-- Modifier la colonne role pour accepter le nouveau rôle
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'nsia_vie') DEFAULT 'user';

-- Vérifier que la modification a été appliquée
DESCRIBE users;

-- Afficher les rôles existants
SELECT DISTINCT role, COUNT(*) as count FROM users GROUP BY role;

-- Optionnel : Mettre à jour certains utilisateurs existants vers le nouveau rôle
-- UPDATE users SET role = 'nsia_vie' WHERE email LIKE '%nsia%' AND role = 'user';

-- Vérifier les contraintes de la base de données
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'dataflow' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'role';
