-- Script pour créer la table banques si elle n'existe pas
USE dataflow;

-- Vérifier si la table existe
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema = 'dataflow' AND table_name = 'banques';

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS banques (
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

-- Insérer des données de test si la table est vide
INSERT IGNORE INTO banques (nom, code, is_active) VALUES
('NSIA BANQUE', 'NSIA', TRUE),
('SGBCI', 'SGBCI', TRUE),
('Banque Atlantique', 'ATLANTIC', TRUE),
('BACI', 'BACI', TRUE),
('SIB', 'SIB', TRUE),
('ECOBANK', 'ECOBANK', TRUE);

-- Vérifier les données
SELECT id, nom, code, is_active FROM banques ORDER BY nom;
