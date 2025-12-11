/**
 * Product type definitions for the inventory system
 */

export interface Product {
  $id: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  $createdAt: string;
  $updatedAt: string;
}

export interface CreateProductData {
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
}

export interface UpdateProductData {
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
}
