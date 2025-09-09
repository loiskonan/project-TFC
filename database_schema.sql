-- Script SQL pour créer la base de données DataFlow
-- Création de la base de données
CREATE DATABASE IF NOT EXISTS dataflow_;
USE dataflow;

-- Table des utilisateurs
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'nsia_vie') DEFAULT 'user',
    banque VARCHAR(255) DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_banque (banque)
);

-- Table des fichiers
CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_file_type (file_type)
);


-- Table des banques
CREATE TABLE banques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_nom (nom),
    INDEX idx_code (code),
    INDEX idx_is_active (is_active)
);


-- Insertion de banques de test
INSERT INTO banques (nom, code) VALUES
('NSIA BANQUE', 'NSIA'),
('SGBCI', 'SGBCI'),
('Banque Atlantique', 'ATLANTIC');

-- Insertion d'utilisateurs de test
INSERT INTO users (email, password, role, banque, name) VALUES
('admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'NSIA BANQUE', 'Admin User'),
('user@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'SGBCI', 'Regular User'),
('manager@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'Banque Atlantique', 'Manager User');

-- Insertion de fichiers de test
INSERT INTO files (name, original_name, file_path, file_size, file_type, uploaded_by, is_public) VALUES
('presentation_2024.pdf', 'presentation.pdf', '/uploads/presentation_2024.pdf', 2048000, 'application/pdf', 1, TRUE),
('image_profile.jpg', 'image.jpg', '/uploads/image_profile.jpg', 1024000, 'image/jpeg', 2, FALSE),
('document_rapport.docx', 'document.docx', '/uploads/document_rapport.docx', 512000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1, TRUE);


-- Vues utiles pour les rapports
-- Procédures stockées utiles
DELIMITER //

CREATE PROCEDURE GetUserFiles(IN user_id INT)
BEGIN
    SELECT 
        f.*,
        u.name as uploaded_by_name,
        u.banque as uploaded_by_banque
    FROM files f
    JOIN users u ON f.uploaded_by = u.id
    WHERE f.uploaded_by = user_id
    ORDER BY f.uploaded_at DESC;
END //


CREATE PROCEDURE GetBanqueStats(IN banque_name VARCHAR(255))
BEGIN
    SELECT 
        u.banque,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(f.id) as total_files,
        SUM(f.file_size) as total_size
    FROM users u
    LEFT JOIN files f ON u.id = f.uploaded_by
    WHERE u.banque = banque_name
    GROUP BY u.banque;
END //

DELIMITER ;

-- Triggers pour maintenir la cohérence
DELIMITER //


CREATE TRIGGER update_user_last_login
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.last_login_at != OLD.last_login_at THEN
        SET NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
END //

DELIMITER ;

-- Index supplémentaires pour les performances
CREATE INDEX idx_files_uploaded_at_desc ON files(uploaded_at DESC);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Commentaires sur la structure
/*
Structure de la base de données DataFlow :

1. Table users : Stockage des utilisateurs avec email, mot de passe, rôle et banque
2. Table files : Gestion des fichiers uploadés
3. Table banques : Liste des banques partenaires
4. Procédures stockées : Fonctions réutilisables pour les requêtes courantes
5. Triggers : Mise à jour automatique des timestamps

Notes :
- Les mots de passe sont hashés avec bcrypt
- Les rôles sont limités à 'admin', 'user' et 'nsia_vie'
- Chaque utilisateur peut être associé à une banque
- Système de gestion des fichiers simplifié
*/
