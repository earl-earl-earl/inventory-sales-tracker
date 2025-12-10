// lib/useProtectedRoute.ts
"use client";

import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export function useProtectedRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is done, then check if user exists
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  return { user, loading };
}