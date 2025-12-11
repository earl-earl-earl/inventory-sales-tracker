// app/sales/page.tsx
"use client";

import { useProtectedRoute } from "@/lib/hooks/useProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader, Plus, Search, Download, Trash2, TrendingUp, DollarSign, ShoppingCart, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/config/appwrite";
import { Query, ID } from "appwrite";
import type { Product, Sale } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { Tooltip } from "react-tooltip";

export default function SalesPage() {
  const { loading: authLoading } = useProtectedRoute();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    productId: "",
    quantitySold: "",
    dateSold: (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    })(),
  });

  // Fetch sales and products
  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, productsRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.SALES, [
          Query.orderDesc("dateSold"),
          Query.limit(100)
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS)
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
      
      setSales(salesWithProducts as unknown as Sale[]);
      setFilteredSales(salesWithProducts as unknown as Sale[]);
      setProducts(productsRes.documents as unknown as Product[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading]);

  // Filter sales
  useEffect(() => {
    let filtered = sales;

    if (searchTerm) {
      filtered = filtered.filter((sale) =>
        sale.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.dateSold);
        
        switch (dateFilter) {
          case "today":
            return saleDate >= today;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return saleDate >= weekAgo;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return saleDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredSales(filtered);
  }, [searchTerm, dateFilter, sales]);

  // Add sale
  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const product = products.find(p => p.$id === formData.productId);
    if (!product) {
      alert("Please select a product");
      return;
    }

    const quantitySold = parseInt(formData.quantitySold);
    
    // Prevent negative or zero quantities
    if (quantitySold <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }
    
    if (quantitySold > product.quantity) {
      alert(`Not enough stock! Available: ${product.quantity}`);
      return;
    }

    try {
      const totalSales = product.sellingPrice * quantitySold;
      const totalCost = product.costPrice * quantitySold;
      const profit = totalSales - totalCost;

      // Convert local datetime to ISO string for database
      // Parse the datetime-local value and create ISO string
      const [datePart, timePart] = formData.dateSold.split('T');
      const [year, month, day] = datePart.split('-');
      const [hour, minute] = timePart.split(':');
      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      const saleDateTime = localDate.toISOString();

      // Create sale record
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SALES,
        ID.unique(),
        {
          product: formData.productId,
          quantitySold: quantitySold,
          totalSales: totalSales,
          totalCost: totalCost,
          profit: profit,
          dateSold: saleDateTime,
        }
      );

      // Update product quantity
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        formData.productId,
        {
          quantity: product.quantity - quantitySold,
        }
      );

      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error adding sale:", error);
      alert("Failed to add sale");
    }
  };

  // Delete sale
  const handleDeleteSale = async (saleId: string, sale: Sale) => {
    if (!confirm("Are you sure you want to delete this sale? Stock will be restored.")) return;

    try {
      // Restore product quantity
      const product = products.find(p => p.$id === sale.product.$id);
      if (product) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          sale.product.$id,
          {
            quantity: product.quantity + sale.quantitySold,
          }
        );
      }

      // Delete sale
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SALES, saleId);
      fetchData();
    } catch (error) {
      console.error("Error deleting sale:", error);
      alert("Failed to delete sale");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Date", "Time", "Product", "Category", "Quantity Sold", "Total Sales", "Cost of Goods", "Profit"];
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

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Add UTF-8 BOM to prevent ##### issue in Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const resetForm = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    setFormData({
      productId: "",
      quantitySold: "",
      dateSold: `${year}-${month}-${day}T${hours}:${minutes}`,
    });
  };

  // Calculate totals
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalSales, 0);
  const totalCost = filteredSales.reduce((sum, sale) => sum + sale.totalCost, 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalTransactions = filteredSales.length;

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
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">Sales</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Track and manage all your sales transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Sales</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">₱{formatCurrency(totalSales)}</p>
              </div>
              <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                <DollarSign className="text-blue-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Profit</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">₱{formatCurrency(totalProfit)}</p>
              </div>
              <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                <TrendingUp className="text-green-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Cost of Goods</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">₱{formatCurrency(totalCost)}</p>
              </div>
              <div className="bg-orange-50 p-2 sm:p-3 rounded-lg">
                <ShoppingCart className="text-orange-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Transactions</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{totalTransactions}</p>
              </div>
              <div className="bg-purple-50 p-2 sm:p-3 rounded-lg">
                <Calendar className="text-purple-500" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 sm:px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                aria-label="Filter by date range"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 sm:gap-2 bg-primary-500 hover:bg-primary-600 text-white px-3 sm:px-4 py-2.5 text-sm rounded-lg transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span>Add Sale</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={32} className="text-primary-500 animate-spin" />
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingCart className="mx-auto text-gray-300 mb-3 sm:mb-4" size={40} />
              <p className="text-gray-500 text-base sm:text-lg">No sales found</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Record your first sale to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full mobile-card-table">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty Sold</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Sales</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost of Goods</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Profit</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.map((sale) => (
                    <tr key={sale.$id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4" data-label="Date">
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(sale.dateSold).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(sale.dateSold).toLocaleTimeString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4" data-label="Product">
                        <p className="font-medium text-gray-900">{sale.product?.name || "Unknown"}</p>
                      </td>
                      <td className="px-6 py-4" data-label="Category">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                          {sale.product?.category || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900" data-label="Qty">{sale.quantitySold}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900" data-label="Sales">₱{formatCurrency(sale.totalSales)}</td>
                      <td className="px-6 py-4 text-right text-gray-600" data-label="Cost">₱{formatCurrency(sale.totalCost)}</td>
                      <td className="px-6 py-4 text-right" data-label="Profit">
                        <span className={`font-semibold ${sale.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₱{formatCurrency(sale.profit)}
                        </span>
                      </td>
                      <td className="px-6 py-4" data-label="Actions">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteSale(sale.$id, sale)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            aria-label="Delete"
                            data-tooltip-id="delete"
                            data-tooltip-content="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Tooltip id="delete" place="bottom" style={{zIndex:9999}}></Tooltip>

      {/* Add Sale Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Record New Sale</h2>
            <form onSubmit={handleAddSale} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Select Product</label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Select product"
                >
                  <option value="">Choose a product</option>
                  {products.map((product) => (
                    <option key={product.$id} value={product.$id}>
                      {product.name} (Stock: {product.quantity}) - ₱{product.sellingPrice}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity Sold</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantitySold}
                  onChange={(e) => setFormData({ ...formData, quantitySold: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    formData.productId && formData.quantitySold && parseInt(formData.quantitySold) > (products.find(p => p.$id === formData.productId)?.quantity || 0)
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-primary-500'
                  }`}
                  placeholder="Enter quantity"
                  aria-label="Quantity sold"
                />
                {formData.productId && formData.quantitySold && (() => {
                  const product = products.find(p => p.$id === formData.productId);
                  const qty = parseInt(formData.quantitySold) || 0;
                  if (product) {
                    if (qty > product.quantity) {
                      return (
                        <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Not enough stock! Only {product.quantity} available
                        </p>
                      );
                    } else if (qty <= 0) {
                      return (
                        <p className="text-red-600 text-sm mt-1.5">Quantity must be greater than 0</p>
                      );
                    }
                  }
                  return null;
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dateSold}
                  onChange={(e) => setFormData({ ...formData, dateSold: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Sale date and time"
                />
              </div>

              {formData.productId && formData.quantitySold && (() => {
                const product = products.find(p => p.$id === formData.productId);
                const qty = parseInt(formData.quantitySold) || 0;
                if (product && qty > 0) {
                  const hasEnoughStock = qty <= product.quantity;
                  const totalSales = product.sellingPrice * qty;
                  const totalCost = product.costPrice * qty;
                  const profit = totalSales - totalCost;
                  return (
                    <div className={`p-4 rounded-lg ${
                      hasEnoughStock ? 'bg-blue-50' : 'bg-red-50'
                    }`}>
                      <p className="text-sm font-medium text-gray-700 mb-2">Sale Summary:</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Sales:</span>
                          <span className="font-semibold">₱{formatCurrency(totalSales)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cost:</span>
                          <span className="font-semibold">₱{formatCurrency(totalCost)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-100">
                          <span className="text-gray-700 font-medium">Profit:</span>
                          <span className="font-bold text-green-600">₱{formatCurrency(profit)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(() => {
                    if (!formData.productId || !formData.quantitySold) return true;
                    const product = products.find(p => p.$id === formData.productId);
                    const qty = parseInt(formData.quantitySold) || 0;
                    return !product || qty <= 0 || qty > product.quantity;
                  })()}
                  className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Record Sale
                </button>
              </div>
            </form>
          </div><Tooltip key={"Increase Stock"}></Tooltip>
        </div>
        
      )}
    </DashboardLayout>
  );
}