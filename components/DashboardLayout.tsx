// components/DashboardLayout.tsx
"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize state from localStorage using a lazy initializer
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const savedCollapsedState = localStorage.getItem("sidebarCollapsed");
    return savedCollapsedState !== null ? JSON.parse(savedCollapsedState) : false;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Update the left margin on large screens based on collapse state
  // Note: use lg:ml-20 when collapsed and lg:ml-80 when expanded to match Sidebar widths.
  const mainClass = `flex-1 transition-all duration-300 ${isCollapsed ? "lg:ml-20" : "lg:ml-80"}`;

  return (
    <div className="flex min-h-screen">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={mainClass}>
        <div className="p-6 lg:p-8 pt-20 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}