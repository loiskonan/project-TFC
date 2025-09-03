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

-- Table des actions (historique)
CREATE TABLE actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type ENUM('upload', 'download') NOT NULL,
    file_id INT NOT NULL,
    user_id INT NOT NULL,
    action_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_action_type (action_type),
    INDEX idx_user_id (user_id),
    INDEX idx_file_id (file_id),
    INDEX idx_created_at (created_at)
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

-- Table des permissions de fichiers
CREATE TABLE file_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NOT NULL,
    user_id INT NOT NULL,
    permission_type ENUM('read', 'write', 'admin') DEFAULT 'read',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INT NOT NULL,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_file_user (file_id, user_id),
    INDEX idx_file_id (file_id),
    INDEX idx_user_id (user_id)
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

-- Insertion d'actions de test
INSERT INTO actions (action_type, file_id, user_id, action_details) VALUES
('upload', 1, 1, '{"ip": "192.168.1.1", "user_agent": "Mozilla/5.0"}'),
('download', 1, 2, '{"ip": "192.168.1.2", "user_agent": "Mozilla/5.0"}'),
('upload', 2, 2, '{"ip": "192.168.1.3", "user_agent": "Mozilla/5.0"}'),
('download', 2, 1, '{"ip": "192.168.1.4", "user_agent": "Mozilla/5.0"}');

-- Insertion de permissions de test
INSERT INTO file_permissions (file_id, user_id, permission_type, granted_by) VALUES
(1, 2, 'read', 1),
(2, 1, 'read', 2),
(3, 2, 'read', 1);

-- Vues utiles pour les rapports
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.banque,
    COUNT(f.id) as total_files,
    SUM(f.file_size) as total_size,
    COUNT(a.id) as total_actions,
    u.last_login_at,
    u.created_at
FROM users u
LEFT JOIN files f ON u.id = f.uploaded_by
LEFT JOIN actions a ON u.id = a.user_id
GROUP BY u.id;

CREATE VIEW file_stats AS
SELECT 
    f.id,
    f.name,
    f.original_name,
    f.file_size,
    f.file_type,
    f.download_count,
    f.uploaded_at,
    u.name as uploaded_by_name,
    u.banque as uploaded_by_banque,
    COUNT(a.id) as action_count
FROM files f
LEFT JOIN users u ON f.uploaded_by = u.id
LEFT JOIN actions a ON f.id = a.file_id
GROUP BY f.id;

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

CREATE PROCEDURE GetUserActions(IN user_id INT, IN days_back INT)
BEGIN
    SELECT 
        a.*,
        f.name as file_name,
        f.original_name as file_original_name
    FROM actions a
    JOIN files f ON a.file_id = f.id
    WHERE a.user_id = user_id
    AND a.created_at >= DATE_SUB(NOW(), INTERVAL days_back DAY)
    ORDER BY a.created_at DESC;
END //

CREATE PROCEDURE GetBanqueStats(IN banque_name VARCHAR(255))
BEGIN
    SELECT 
        u.banque,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(f.id) as total_files,
        SUM(f.file_size) as total_size,
        COUNT(a.id) as total_actions
    FROM users u
    LEFT JOIN files f ON u.id = f.uploaded_by
    LEFT JOIN actions a ON u.id = a.user_id
    WHERE u.banque = banque_name
    GROUP BY u.banque;
END //

DELIMITER ;

-- Triggers pour maintenir la cohérence
DELIMITER //

CREATE TRIGGER update_download_count
AFTER INSERT ON actions
FOR EACH ROW
BEGIN
    IF NEW.action_type = 'download' THEN
        UPDATE files 
        SET download_count = download_count + 1 
        WHERE id = NEW.file_id;
    END IF;
END //

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
CREATE INDEX idx_actions_created_at_desc ON actions(created_at DESC);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Commentaires sur la structure
/*
Structure de la base de données DataFlow :

1. Table users : Stockage des utilisateurs avec email, mot de passe, rôle et banque
2. Table files : Gestion des fichiers uploadés
3. Table actions : Historique de toutes les actions (upload, download, etc.)
4. Table file_permissions : Permissions granulaires sur les fichiers
5. Vues : Rapports pré-calculés pour les statistiques
6. Procédures stockées : Fonctions réutilisables pour les requêtes courantes
7. Triggers : Mise à jour automatique des compteurs et timestamps

Notes :
- Les mots de passe sont hashés avec bcrypt
- Les rôles sont limités à 'admin' et 'user'
- Chaque utilisateur peut être associé à une banque
- Système de permissions granulaires pour les fichiers
- Historique complet des actions pour l'audit
*/
