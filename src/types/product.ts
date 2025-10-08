export interface Banque {
  banque_id: number;
  banque_nom: string;
  banque_code: string;
  banque_active: boolean;
  total_products: number;
  active_products: number;
}

export interface BanqueProduct {
  id: number;
  banque_id: number;
  banque_nom: string;
  product_name: string;
  code_produit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBanqueProductData {
  product_name: string;
  code_produit: string;
}

export interface UpdateBanqueProductData {
  product_name?: string;
  code_produit?: string;
  is_active?: boolean;
}

export interface BanqueStats {
  total_products: number;
  active_products: number;
}
