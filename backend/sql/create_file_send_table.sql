-- Création de la table file_send pour les fichiers envoyés par admin/nsia_vie aux banques
-- Cette table conserve les fichiers que les administrateurs et NSIA Vie envoient aux banques

CREATE TABLE IF NOT EXISTS file_send (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Informations du fichier
    original_name VARCHAR(255) NOT NULL COMMENT 'Nom original du fichier',
    file_name VARCHAR(255) NOT NULL COMMENT 'Nom du fichier sur le serveur',
    file_path VARCHAR(500) NOT NULL COMMENT 'Chemin complet du fichier',
    file_type VARCHAR(100) NOT NULL COMMENT 'Type MIME du fichier',
    file_size BIGINT NOT NULL COMMENT 'Taille du fichier en bytes',
    
    -- Description du lot de fichiers
    description VARCHAR(500) NOT NULL COMMENT 'Description du lot de fichiers',
    
    -- Informations du déposant (admin/nsia_vie qui envoie)
    deposant_id INT NOT NULL COMMENT 'ID de l\'utilisateur qui envoie',
    deposant_nom VARCHAR(255) NOT NULL COMMENT 'Nom du déposant',
    deposant_email VARCHAR(255) NOT NULL COMMENT 'Email du déposant',
    deposant_role ENUM('admin', 'nsia_vie') NOT NULL COMMENT 'Rôle du déposant',
    
    -- Informations de la banque destinataire
    banque_destinataire VARCHAR(255) NOT NULL COMMENT 'Nom de la banque destinataire',
    banque_code VARCHAR(50) NOT NULL COMMENT 'Code de la banque destinataire',
    
    -- Statut et métadonnées
    status ENUM('sent', 'delivered', 'read', 'downloaded') DEFAULT 'sent' COMMENT 'Statut du fichier',
    download_count INT DEFAULT 0 COMMENT 'Nombre de téléchargements',
    
    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de dernière modification',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date d\'envoi',
    delivered_at TIMESTAMP NULL COMMENT 'Date de livraison',
    read_at TIMESTAMP NULL COMMENT 'Date de lecture',
    last_download_at TIMESTAMP NULL COMMENT 'Date du dernier téléchargement',
    
    -- Index pour les performances
    INDEX idx_deposant_id (deposant_id),
    INDEX idx_banque_destinataire (banque_destinataire),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_file_type (file_type),
    
    -- Contraintes
    FOREIGN KEY (deposant_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contrainte d'unicité : un fichier avec le même nom ne peut pas être envoyé deux fois à la même banque
    UNIQUE KEY unique_file_per_banque (original_name, banque_destinataire)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des fichiers envoyés par admin/nsia_vie aux banques';

-- Insertion de données de test (optionnel)
INSERT INTO file_send (
    original_name, 
    file_name, 
    file_path, 
    file_type, 
    file_size, 
    description, 
    deposant_id, 
    deposant_nom, 
    deposant_email, 
    deposant_role, 
    banque_destinataire, 
    banque_code, 
    status
) VALUES 
(
    'rapport_mensuel_janvier.pdf',
    'file_1704067200000_rapport_mensuel_janvier.pdf',
    '/uploads/file_send/file_1704067200000_rapport_mensuel_janvier.pdf',
    'application/pdf',
    2048576,
    'Rapport mensuel janvier 2024',
    1,
    'Admin Principal',
    'admin@nsia.ci',
    'admin',
    'NSIA BANQUE',
    'NSIA',
    'sent'
),
(
    'instructions_securite.docx',
    'file_1704067300000_instructions_securite.docx',
    '/uploads/file_send/file_1704067300000_instructions_securite.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    1536000,
    'Instructions de sécurité pour les agences',
    2,
    'NSIA Vie Manager',
    'nsia.vie@nsia.ci',
    'nsia_vie',
    'NSIA BANQUE',
    'NSIA',
    'delivered'
);

