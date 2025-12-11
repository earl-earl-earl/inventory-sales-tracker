// app/reports/page.tsx
"use client";

import { useProtectedRoute } from "@/lib/hooks/useProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader, FileText, Download, Calendar, TrendingUp, DollarSign, ShoppingBag, BarChart3, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/config/appwrite";
import { Query } from "appwrite";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Product, Sale } from "@/lib/types/database";

export default function ReportsPage() {
  const { loading: authLoading } = useProtectedRoute();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("all");
  const [reportType, setReportType] = useState<"inventory" | "sales" | "profit">("sales");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, salesRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.SALES, [
            Query.orderDesc("dateSold"),
            Query.limit(500)
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
        setFilteredSales(salesWithProducts as unknown as Sale[]);
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

  // Apply filters for sales
  useEffect(() => {
    let filtered = sales;

    // Date filter
    if (startDate) {
      filtered = filtered.filter(sale => 
        new Date(sale.dateSold) >= new Date(startDate)
      );
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter(sale => 
        new Date(sale.dateSold) <= endDateTime
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(sale => 
        sale.product?.category === categoryFilter
      );
    }

    setFilteredSales(filtered);
  }, [startDate, endDate, categoryFilter, sales]);

  // Apply filters for inventory
  useEffect(() => {
    let filtered = products;

    // Search filter
    if (inventorySearch) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(inventorySearch.toLowerCase())
      );
    }

    // Category filter
    if (inventoryCategoryFilter !== "all") {
      filtered = filtered.filter(product =>
        product.category === inventoryCategoryFilter
      );
    }

    setFilteredProducts(filtered);
  }, [inventorySearch, inventoryCategoryFilter, products]);

  // Get unique categories
  const categories = Array.from(
    new Set(products.map(p => p.category))
  );

  // Calculate metrics
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalSales, 0);
  const totalCost = filteredSales.reduce((sum, sale) => sum + sale.totalCost, 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalTransactions = filteredSales.length;

  // Group sales by date
  const salesByDate = filteredSales.reduce((acc, sale) => {
    const date = new Date(sale.dateSold).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, cost: 0, profit: 0, transactions: 0 };
    }
    acc[date].revenue += sale.totalSales;
    acc[date].cost += sale.totalCost;
    acc[date].profit += sale.profit;
    acc[date].transactions += 1;
    return acc;
  }, {} as Record<string, { date: string; revenue: number; cost: number; profit: number; transactions: number }>);

  const dailyData = Object.values(salesByDate).map(item => ({
    ...item,
    revenue: parseFloat(item.revenue.toFixed(2)),
    cost: parseFloat(item.cost.toFixed(2)),
    profit: parseFloat(item.profit.toFixed(2))
  }));

  // Product performance
  const productPerformance = filteredSales.reduce((acc, sale) => {
    const productName = sale.product?.name || "Unknown";
    if (!acc[productName]) {
      acc[productName] = { name: productName, quantity: 0, revenue: 0, profit: 0 };
    }
    acc[productName].quantity += sale.quantitySold;
    acc[productName].revenue += sale.totalSales;
    acc[productName].profit += sale.profit;
    return acc;
  }, {} as Record<string, { name: string; quantity: number; revenue: number; profit: number }>);

  const topProducts = Object.values(productPerformance)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Export functions
  const exportInventoryReport = () => {
    const headers = ["Product Name", "Category", "Cost Price", "Selling Price", "Quantity", "Stock Value", "Potential Revenue"];
    const rows = products.map((product) => [
      product.name,
      product.category,
      product.costPrice.toFixed(2),
      product.sellingPrice.toFixed(2),
      product.quantity,
      (product.costPrice * product.quantity).toFixed(2),
      (product.sellingPrice * product.quantity).toFixed(2),
    ]);

    downloadCSV(headers, rows, "inventory_report");
  };

  const exportSalesReport = () => {
    const headers = ["Date", "Time", "Product", "Category", "Quantity", "Revenue", "Cost", "Profit"];
    const rows = filteredSales.map((sale) => {
      const saleDate = new Date(sale.dateSold);
      return [
        saleDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        saleDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        sale.product?.name || "Unknown",
        sale.product?.category || "N/A",
        sale.quantitySold,
        sale.totalSales.toFixed(2),
        sale.totalCost.toFixed(2),
        sale.profit.toFixed(2),
      ];
    });

    downloadCSV(headers, rows, "sales_report");
  };

  const exportProfitReport = () => {
    const headers = ["Product", "Units Sold", "Total Revenue", "Total Cost", "Total Profit", "Profit Margin"];
    const rows = topProducts.map((product) => [
      product.name,
      product.quantity,
      product.revenue.toFixed(2),
      (product.revenue - product.profit).toFixed(2),
      product.profit.toFixed(2),
      ((product.profit / product.revenue) * 100).toFixed(2) + "%",
    ]);

    downloadCSV(headers, rows, "profit_report");
  };

  const downloadCSV = (headers: string[], rows: (string | number)[][], filename: string) => {
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Add UTF-8 BOM to prevent ##### issue in Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

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
          <h1 className="text-3xl font-heading font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Generate detailed reports and analyze your business performance</p>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setReportType("inventory")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium ${
                  reportType === "inventory"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ShoppingBag size={18} />
                Inventory
              </button>
              <button
                onClick={() => setReportType("sales")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium ${
                  reportType === "sales"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <DollarSign size={18} />
                Sales
              </button>
              <button
                onClick={() => setReportType("profit")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium ${
                  reportType === "profit"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <TrendingUp size={18} />
                Profit
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {reportType !== "inventory" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Start date"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="End date"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  aria-label="Filter by category"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {reportType !== "inventory" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₱{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <DollarSign className="text-blue-500" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₱{totalCost.toFixed(2)}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <ShoppingBag className="text-orange-500" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Profit</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">₱{totalProfit.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <TrendingUp className="text-green-500" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalTransactions}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <Calendar className="text-purple-500" size={20} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Content */}
        {reportType === "inventory" && (
          <div className="space-y-6">
            {/* Inventory Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <select
                    value={inventoryCategoryFilter}
                    onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    aria-label="Filter by category"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Current Inventory Status</h3>
                <button
                  onClick={exportInventoryReport}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  <Download size={18} />
                  Export Report
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size={32} className="text-primary-500 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Product</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Category</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Cost Price</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Selling Price</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Stock Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((product) => (
                        <tr key={product.$id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">₱{product.costPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">₱{product.sellingPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{product.quantity}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            ₱{(product.costPrice * product.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {reportType === "sales" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Sales Trend Over Time</h3>
                <button
                  onClick={exportSalesReport}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  <Download size={18} />
                  Export Report
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size={32} className="text-primary-500 animate-spin" />
                </div>
              ) : dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#2196F3" strokeWidth={2} name="Revenue (₱)" />
                    <Line type="monotone" dataKey="cost" stroke="#FF9800" strokeWidth={2} name="Cost (₱)" />
                    <Line type="monotone" dataKey="profit" stroke="#4CAF50" strokeWidth={2} name="Profit (₱)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No sales data for the selected period
                </div>
              )}
            </div>
          </div>
        )}

        {reportType === "profit" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Top Products by Revenue</h3>
                <button
                  onClick={exportProfitReport}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  <Download size={18} />
                  Export Report
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size={32} className="text-primary-500 animate-spin" />
                </div>
              ) : topProducts.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#2196F3" name="Revenue (₱)" radius={[8, 8, 0, 0]} minPointSize={5} />
                      <Bar dataKey="profit" fill="#4CAF50" name="Profit (₱)" radius={[8, 8, 0, 0]} minPointSize={5} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Product</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Units Sold</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Profit</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {topProducts.map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                            <td className="px-4 py-3 text-right">{product.quantity}</td>
                            <td className="px-4 py-3 text-right font-semibold">₱{product.revenue.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600">₱{product.profit.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                {((product.profit / product.revenue) * 100).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No profit data for the selected period
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}