-- Script pour insérer des données de test pour les banques
USE dataflow;

-- Supprimer les données existantes pour éviter les doublons
DELETE FROM banques;

-- Réinitialiser l'auto-increment
ALTER TABLE banques AUTO_INCREMENT = 1;

-- Insérer les banques de test
INSERT INTO banques (nom, code, is_active) VALUES
('NSIA BANQUE', 'NSIA', TRUE),
('SGBCI', 'SGBCI', TRUE),
('Banque Atlantique', 'ATLANTIC', TRUE),
('BACI', 'BACI', TRUE),
('SIB', 'SIB', TRUE),
('ECOBANK', 'ECOBANK', TRUE);

-- Vérifier les données insérées
SELECT id, nom, code, is_active, created_at FROM banques ORDER BY nom;

-- Afficher le nombre total de banques
SELECT COUNT(*) as total_banques FROM banques WHERE is_active = TRUE;
