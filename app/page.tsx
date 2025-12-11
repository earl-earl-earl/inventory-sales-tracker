// app/page.tsx
"use client";

import { useProtectedRoute } from "@/lib/hooks/useProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader, Package, DollarSign, TrendingUp, AlertCircle, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/config/appwrite";
import { Query } from "appwrite";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Product, Sale } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const { loading: authLoading } = useProtectedRoute();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, salesRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.SALES, [
            Query.orderDesc("dateSold"),
            Query.limit(100)
          ])
        ]);
        
        // Map sales with full product data from products list
        const salesWithProducts = (salesRes.documents as unknown as Sale[]).map(sale => {
          const productId = typeof sale.product === 'string' ? sale.product : sale.product?.$id;
          const product = (productsRes.documents as unknown as Product[]).find(p => p.$id === productId);
          return {
            ...sale,
            product: product ? {
              $id: product.$id,
              name: product.name,
              category: product.category
            } : sale.product
          };
        });
        
        setProducts(productsRes.documents as unknown as Product[]);
        setSales(salesWithProducts as unknown as Sale[]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [authLoading]);

  // Calculate metrics
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
  const totalProducts = products.length;
  
  // Today's sales (filter by today's date)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.dateSold);
    return saleDate >= today;
  });
  
  const salesToday = todaySales.reduce((sum, sale) => sum + sale.totalSales, 0);
  const profitToday = todaySales.reduce((sum, sale) => sum + sale.profit, 0);
  
  // Low stock items
  const lowStockItems = products.filter(p => p.quantity < 10);
  
  // Sales trend for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  
  const salesTrend = last7Days.map(date => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const daySales = sales.filter(sale => {
      const saleDate = new Date(sale.dateSold);
      return saleDate >= dayStart && saleDate <= dayEnd;
    });
    
    const revenue = daySales.reduce((sum, sale) => sum + sale.totalSales, 0);
    const profit = daySales.reduce((sum, sale) => sum + sale.profit, 0);
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: parseFloat(revenue.toFixed(2)),
      profit: parseFloat(profit.toFixed(2))
    };
  });
  
  // Category distribution
  const categoryData = products.reduce((acc, product) => {
    const existing = acc.find(item => item.name === product.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: product.category, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);
  
  // Top selling products
  const productSales = sales.reduce((acc, sale) => {
    const productName = sale.product?.name || "Unknown";
    if (!acc[productName]) {
      acc[productName] = 0;
    }
    acc[productName] += sale.quantitySold;
    return acc;
  }, {} as Record<string, number>);
  
  const topProducts = Object.entries(productSales)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0'];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={32} className="text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Welcome back! Here&apos;s your business overview</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Inventory Value */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                <Package className="text-blue-500" size={20} />
              </div>
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <ArrowUp size={12} />
              </span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Inventory Value</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₱{formatCurrency(totalInventoryValue)}</p>
            <p className="text-xs text-gray-400 mt-1 sm:mt-2">Capital in stock</p>
          </div>

          {/* Total Products */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-purple-50 p-2 sm:p-3 rounded-lg">
                <Package className="text-purple-500" size={20} />
              </div>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Products</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
            <p className="text-xs text-gray-400 mt-1 sm:mt-2">Unique items</p>
          </div>

          {/* Sales Today */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                <DollarSign className="text-green-500" size={20} />
              </div>
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <ArrowUp size={12} />
                Today
              </span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Sales Today</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₱{formatCurrency(salesToday)}</p>
            <p className="text-xs text-gray-400 mt-1 sm:mt-2">{todaySales.length} transactions</p>
          </div>

          {/* Profit Today */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-orange-50 p-2 sm:p-3 rounded-lg">
                <TrendingUp className="text-orange-500" size={20} />
              </div>
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <ArrowUp size={12} />
                Today
              </span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Profit Today</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₱{formatCurrency(profitToday)}</p>
            <p className="text-xs text-gray-400 mt-1 sm:mt-2">Net earnings</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Sales Trend (Last 7 Days)</h3>
            {loading ? (
              <div className="h-48 sm:h-64 flex items-center justify-center">
                <Loader size={32} className="text-primary-500 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#2196F3" strokeWidth={2} name="Revenue (₱)" />
                  <Line type="monotone" dataKey="profit" stroke="#4CAF50" strokeWidth={2} name="Profit (₱)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Inventory by Category</h3>
            {loading ? (
              <div className="h-48 sm:h-64 flex items-center justify-center">
                <Loader size={32} className="text-primary-500 animate-spin" />
              </div>
            ) : categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Top Selling Products</h3>
            {loading ? (
              <div className="h-48 sm:h-64 flex items-center justify-center">
                <Loader size={32} className="text-primary-500 animate-spin" />
              </div>
            ) : topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                  />
                  <Bar dataKey="quantity" fill="#2196F3" radius={[8, 8, 0, 0]} name="Units Sold" minPointSize={10} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No sales data yet
              </div>
            )}
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Low Stock Alert</h3>
              <span className="bg-orange-50 text-orange-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {lowStockItems.length} items
              </span>
            </div>
            <div className="space-y-2 sm:space-y-3 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="h-48 sm:h-64 flex items-center justify-center">
                  <Loader size={32} className="text-primary-500 animate-spin" />
                </div>
              ) : lowStockItems.length > 0 ? (
                lowStockItems.map((product) => (
                  <div key={product.$id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-orange-500" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                    </div>
                    <span className="font-bold text-orange-600">{product.quantity} left</span>
                  </div>
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <Package size={48} className="mb-2" />
                  <p>All products are well stocked!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}