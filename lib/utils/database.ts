/**
 * Database utility functions for common operations
 */

import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/config/appwrite";
import { Query, ID } from "appwrite";
import type { 
  Product, 
  CreateProductData, 
  UpdateProductData,
  Sale,
  CreateSaleData 
} from "@/lib/types/database";

/**
 * Product Operations
 */
export const productOperations = {
  // Get all products
  getAll: async (): Promise<Product[]> => {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      [Query.orderDesc("$createdAt")]
    );
    return response.documents as unknown as Product[];
  },

  // Get product by ID
  getById: async (productId: string): Promise<Product> => {
    const response = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      productId
    );
    return response as unknown as Product;
  },

  // Create new product
  create: async (data: CreateProductData): Promise<Product> => {
    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      ID.unique(),
      data
    );
    return response as unknown as Product;
  },

  // Update product
  update: async (productId: string, data: UpdateProductData): Promise<Product> => {
    const response = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      productId,
      data
    );
    return response as unknown as Product;
  },

  // Delete product
  delete: async (productId: string): Promise<void> => {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      productId
    );
  },

  // Get products by category
  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      [Query.equal("category", category)]
    );
    return response.documents as unknown as Product[];
  },

  // Get low stock products
  getLowStock: async (threshold: number = 10): Promise<Product[]> => {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      [Query.lessThan("quantity", threshold)]
    );
    return response.documents as unknown as Product[];
  }
};

/**
 * Sales Operations
 */
export const salesOperations = {
  // Get all sales
  getAll: async (limit: number = 100): Promise<Sale[]> => {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SALES,
      [Query.orderDesc("dateSold"), Query.limit(limit)]
    );
    return response.documents as unknown as Sale[];
  },

  // Get sale by ID
  getById: async (saleId: string): Promise<Sale> => {
    const response = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.SALES,
      saleId
    );
    return response as unknown as Sale;
  },

  // Create new sale
  create: async (data: CreateSaleData): Promise<Sale> => {
    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SALES,
      ID.unique(),
      data
    );
    return response as unknown as Sale;
  },

  // Delete sale
  delete: async (saleId: string): Promise<void> => {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.SALES,
      saleId
    );
  },

  // Get sales by date range
  getByDateRange: async (startDate: string, endDate: string): Promise<Sale[]> => {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SALES,
      [
        Query.greaterThanEqual("dateSold", startDate),
        Query.lessThanEqual("dateSold", endDate),
        Query.orderDesc("dateSold")
      ]
    );
    return response.documents as unknown as Sale[];
  },

  // Get today's sales
  getToday: async (): Promise<Sale[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SALES,
      [
        Query.greaterThanEqual("dateSold", today.toISOString()),
        Query.orderDesc("dateSold")
      ]
    );
    return response.documents as unknown as Sale[];
  }
};

/**
 * Analytics utilities
 */
export const analyticsUtils = {
  // Calculate total inventory value
  calculateInventoryValue: (products: Product[]): number => {
    return products.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
  },

  // Calculate total sales revenue
  calculateTotalSales: (sales: Sale[]): number => {
    return sales.reduce((sum, sale) => sum + sale.totalSales, 0);
  },

  // Calculate total profit
  calculateTotalProfit: (sales: Sale[]): number => {
    return sales.reduce((sum, sale) => sum + sale.profit, 0);
  },

  // Calculate total cost
  calculateTotalCost: (sales: Sale[]): number => {
    return sales.reduce((sum, sale) => sum + sale.totalCost, 0);
  },

  // Get profit per product
  calculateProfitPerItem: (product: Product): number => {
    return product.sellingPrice - product.costPrice;
  },

  // Get stock value for product
  calculateStockValue: (product: Product): number => {
    return product.costPrice * product.quantity;
  },

  // Get unique categories
  getUniqueCategories: (products: Product[]): string[] => {
    return Array.from(new Set(products.map(p => p.category)));
  },

  // Filter sales by date range
  filterSalesByDateRange: (sales: Sale[], startDate: Date, endDate: Date): Sale[] => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.dateSold);
      return saleDate >= startDate && saleDate <= endDate;
    });
  },

  // Get sales for today
  getTodaySales: (sales: Sale[]): Sale[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sales.filter(sale => {
      const saleDate = new Date(sale.dateSold);
      return saleDate >= today;
    });
  }
};
