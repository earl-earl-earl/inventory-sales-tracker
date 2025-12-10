// app/page.tsx
"use client";

import { useProtectedRoute } from "@/lib/hooks/useProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader } from "lucide-react";

export default function Dashboard() {
  const { loading } = useProtectedRoute();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={32} className="text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="text-gray-600">Welcome to SmartStock!</p>
        {/* Add your dashboard content here */}
      </div>
    </DashboardLayout>
  );
}