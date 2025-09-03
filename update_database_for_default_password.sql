-- Script pour ajouter la gestion du mot de passe par défaut
USE dataflow;

-- Table de configuration système
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
);

-- Insérer le mot de passe par défaut initial (hashé)
-- Note: Ce hash correspond à 'dataflow@225' avec bcrypt et salt de 10 rounds
INSERT INTO system_config (config_key, config_value, description) VALUES
('default_password', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mot de passe par défaut hashé pour les nouveaux utilisateurs')
ON DUPLICATE KEY UPDATE config_value = config_value;

-- Vérifier l'insertion
SELECT * FROM system_config WHERE config_key = 'default_password';
