/**
 * Centralized database type definitions for the SmartStock system
 */

// Product types
export interface Product {
  $id: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface CreateProductData {
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
}

export interface UpdateProductData {
  name?: string;
  category?: string;
  costPrice?: number;
  sellingPrice?: number;
  quantity?: number;
}

// Sale types
export interface Sale {
  $id: string;
  product: {
    $id: string;
    name: string;
    category: string;
  };
  quantitySold: number;
  totalSales: number;
  totalCost: number;
  profit: number;
  dateSold: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface CreateSaleData {
  product: string; // Product ID
  quantitySold: number;
  totalSales: number;
  totalCost: number;
  profit: number;
  dateSold: string;
}

// Analytics types
export interface DailyMetrics {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  transactions: number;
}

export interface ProductPerformance {
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalInventoryValue: number;
  totalProducts: number;
  salesToday: number;
  profitToday: number;
  lowStockCount: number;
}

// Report filters
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  productId?: string;
}
