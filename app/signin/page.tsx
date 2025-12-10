"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Package, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await login(formData.email, formData.password);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || "Invalid email or password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-10 rounded-lg border border-gray-200">
                
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-lg mb-4">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold font-heading text-gray-900 mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-gray-500 font-sans">
                        Sign in to SmartStock
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <div className="relative">
                        <label className="block text-sm font-medium font-sans text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 font-sans rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-gray-900"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <label className="block text-sm font-medium font-sans text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-gray-900"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                ) : (
                                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start space-x-2 text-red-700 text-sm font-sans bg-red-50 border border-red-200 p-3 rounded-lg animate-shake">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent font-semibold rounded-lg text-white transition-colors duration-200 ${
                                loading 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-primary-500 hover:bg-primary-600 cursor-pointer'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 -mr-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Footer Link */}
                    <div className="text-center pt-4 border-t border-gray-200 mt-6">
                        <p className="text-sm text-gray-600">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}