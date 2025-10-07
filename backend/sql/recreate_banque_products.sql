-- Script SQL pour recréer la table banque_products avec la structure simplifiée
-- Supprime l'ancienne table et recrée avec seulement les champs essentiels

-- Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS banque_products;

-- Créer la nouvelle table simplifiée
CREATE TABLE banque_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  banque_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (banque_id) REFERENCES banques(id) ON DELETE CASCADE,
  INDEX idx_banque_id (banque_id),
  INDEX idx_active (is_active)
);

-- Insérer des données de test
INSERT INTO banque_products (banque_id, product_name, is_active) VALUES
-- Produits pour AFG (id=1)
(1, 'Compte Courant', TRUE),
(1, 'Carte de Crédit', TRUE),
(1, 'Prêt Immobilier', TRUE),

-- Produits pour ecobank (id=2)
(2, 'Compte Courant', TRUE),
(2, 'Carte de Crédit', TRUE),
(2, 'Prêt Immobilier', TRUE),

-- Produits pour NSIA BANQUE (id=3)
(3, 'Compte Courant', TRUE),
(3, 'Carte de Crédit', TRUE),
(3, 'Prêt Immobilier', TRUE),
(3, 'Assurance Vie', TRUE);

-- Vérifier les données insérées
SELECT 
  b.nom as banque_nom,
  bp.product_name,
  bp.is_active,
  bp.created_at
FROM banque_products bp
JOIN banques b ON bp.banque_id = b.id
ORDER BY b.nom, bp.product_name;

