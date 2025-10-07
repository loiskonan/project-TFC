const mysql = require('mysql2/promise');

class Product {
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
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await this.pool.execute(createTableQuery);
      console.log('Table products créée avec succès');
    } catch (error) {
      console.error('Erreur lors de la création de la table products:', error);
      throw error;
    }
  }

  async findAll(filters = {}) {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.isActive);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    try {
      const [rows] = await this.pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  }

  async findById(id) {
    const query = 'SELECT * FROM products WHERE id = ?';
    
    try {
      const [rows] = await this.pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      throw error;
    }
  }

  async create(productData) {
    const { name, description, price, category, stock } = productData;
    const query = `
      INSERT INTO products (name, description, price, category, stock) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await this.pool.execute(query, [name, description, price, category, stock]);
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  }

  async update(id, productData) {
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
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;

    try {
      await this.pool.execute(query, values);
      return await this.findById(id);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }
  }

  async delete(id) {
    const query = 'DELETE FROM products WHERE id = ?';
    
    try {
      const [result] = await this.pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw error;
    }
  }

  async getCategories() {
    const query = 'SELECT DISTINCT category FROM products WHERE is_active = TRUE ORDER BY category';
    
    try {
      const [rows] = await this.pool.execute(query);
      return rows.map(row => row.category);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  }

  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_products,
        COUNT(CASE WHEN stock > 0 THEN 1 END) as products_in_stock,
        COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_products,
        AVG(price) as average_price,
        SUM(stock) as total_stock
      FROM products
    `;
    
    try {
      const [rows] = await this.pool.execute(query);
      return rows[0];
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}

module.exports = new Product();

