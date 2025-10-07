const mysql = require('mysql2/promise');

class BanqueProduct {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS banque_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        banque_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        code_produit VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (banque_id) REFERENCES banques(id) ON DELETE CASCADE,
        INDEX idx_banque_id (banque_id),
        INDEX idx_code_produit (code_produit),
        INDEX idx_active (is_active),
        UNIQUE KEY unique_banque_code (banque_id, code_produit)
      )
    `;
    
    try {
      await this.pool.execute(createTableQuery);
      console.log('Table banque_products créée avec succès');
    } catch (error) {
      console.error('Erreur lors de la création de la table banque_products:', error);
      throw error;
    }
  }

  async getBanquesWithProducts() {
    const query = `
      SELECT 
        b.id as banque_id,
        b.nom as banque_nom,
        b.code as banque_code,
        b.is_active as banque_active,
        COUNT(bp.id) as total_products,
        COUNT(CASE WHEN bp.is_active = TRUE THEN 1 END) as active_products
      FROM banques b
      LEFT JOIN banque_products bp ON b.id = bp.banque_id
      GROUP BY b.id, b.nom, b.code, b.is_active
      ORDER BY b.nom ASC
    `;
    
    try {
      const [rows] = await this.pool.execute(query);
      return rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des banques avec produits:', error);
      throw error;
    }
  }

  async getProductsByBanque(banqueId) {
    const query = `
      SELECT 
        bp.*,
        b.nom as banque_nom
      FROM banque_products bp
      JOIN banques b ON bp.banque_id = b.id
      WHERE bp.banque_id = ?
      ORDER BY bp.created_at DESC
    `;
    
    try {
      const [rows] = await this.pool.execute(query, [banqueId]);
      return rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits de la banque:', error);
      throw error;
    }
  }

  async createProduct(banqueId, productData) {
    const { product_name, code_produit } = productData;
    const query = `
      INSERT INTO banque_products (banque_id, product_name, code_produit) 
      VALUES (?, ?, ?)
    `;
    
    try {
      const [result] = await this.pool.execute(query, [banqueId, product_name, code_produit]);
      return await this.getProductById(result.insertId);
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  }

  async getProductById(id) {
    const query = `
      SELECT 
        bp.*,
        b.nom as banque_nom
      FROM banque_products bp
      JOIN banques b ON bp.banque_id = b.id
      WHERE bp.id = ?
    `;
    
    try {
      const [rows] = await this.pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      throw error;
    }
  }

  async updateProduct(id, productData) {
    const fields = [];
    const values = [];

    Object.keys(productData).forEach(key => {
      if (productData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(productData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    values.push(id);
    const query = `UPDATE banque_products SET ${fields.join(', ')} WHERE id = ?`;

    try {
      await this.pool.execute(query, values);
      return await this.getProductById(id);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }
  }

  async deleteProduct(id) {
    const query = 'DELETE FROM banque_products WHERE id = ?';
    
    try {
      const [result] = await this.pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw error;
    }
  }

  async getCategories() {
    // Plus besoin de catégories, retourner un tableau vide
    return [];
  }

  async getBanqueStats(banqueId) {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_products
      FROM banque_products
      WHERE banque_id = ?
    `;
    
    try {
      const [rows] = await this.pool.execute(query, [banqueId]);
      return rows[0];
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}

module.exports = new BanqueProduct();
