import axios from 'axios';
import { Banque, BanqueProduct, CreateBanqueProductData, UpdateBanqueProductData, BanqueStats } from '../types/product';

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}:5000/api`;

class BanqueProductService {
  private getAuthHeaders() {
    const token = localStorage.getItem('dataflow_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getAllBanquesWithProducts(): Promise<Banque[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/banque-products/banques`, {
        headers: this.getAuthHeaders()
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des banques avec produits:', error);
      throw error;
    }
  }

  async getProductsByBanque(banqueId: number): Promise<BanqueProduct[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/banque-products/banques/${banqueId}/products`, {
        headers: this.getAuthHeaders()
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des produits de la banque:', error);
      throw error;
    }
  }

  async createProduct(banqueId: number, productData: CreateBanqueProductData): Promise<BanqueProduct> {
    try {
      const response = await axios.post(`${API_BASE_URL}/banque-products/banques/${banqueId}/products`, productData, {
        headers: this.getAuthHeaders()
      });

      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  }

  async updateProduct(id: number, productData: UpdateBanqueProductData): Promise<BanqueProduct> {
    try {
      const response = await axios.put(`${API_BASE_URL}/banque-products/products/${id}`, productData, {
        headers: this.getAuthHeaders()
      });

      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/banque-products/products/${id}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw error;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/banque-products/categories`, {
        headers: this.getAuthHeaders()
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  }

  async getBanqueStats(banqueId: number): Promise<BanqueStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}/banque-products/banques/${banqueId}/stats`, {
        headers: this.getAuthHeaders()
      });

      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // Nouvelle méthode pour récupérer les produits par nom de banque (pour les utilisateurs)
  async getProductsByBanqueName(banqueName: string): Promise<BanqueProduct[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-products/banques/${encodeURIComponent(banqueName)}/products`, {
        headers: this.getAuthHeaders()
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des produits de la banque:', error);
      throw error;
    }
  }
}

export const banqueProductService = new BanqueProductService();
