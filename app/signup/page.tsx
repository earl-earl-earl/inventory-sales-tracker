"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { User, Mail, Lock, CheckCircle, Eye, EyeOff, Package, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function SignupPage() {
    const { signup } = useAuth();
    
    const [formData, setFormData] = useState({ 
        name: "", 
        email: "", 
        password: "", 
        confirmPassword: "" 
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return { strength: 0, label: "", color: "" };
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        if (strength <= 2) return { strength: 33, label: "Weak", color: "bg-red-500" };
        if (strength <= 3) return { strength: 66, label: "Medium", color: "bg-yellow-500" };
        return { strength: 100, label: "Strong", color: "bg-green-500" };
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError("Name is required");
            return false;
        }
        if (!formData.email.trim()) {
            setError("Email is required");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError("Invalid email address");
            return false;
        }
        if (!formData.password) {
            setError("Password is required");
            return false;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            await signup(formData.name, formData.email, formData.password);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || "Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-10 rounded-lg border border-gray-200">
                
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-lg mb-4">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold font-heading text-gray-900 mb-2">
                        SmartStock
                    </h1>
                    <p className="text-gray-500 font-sans">
                        Create your account to get started
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Name Input */}
                    <div className="relative">
                        <label className="block text-sm font-sans font-medium text-gray-700 mb-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-gray-900"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                        <label className="block text-sm font-sans font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-gray-900"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <label className="block text-sm font-sans font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-gray-900"
                                placeholder="Create a strong password"
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
                        {/* Password Strength Indicator */}
                        {formData.password && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-sans text-gray-600">Password strength:</span>
                                    <span className={`text-xs font-sans font-medium ${
                                        passwordStrength.label === 'Weak' ? 'text-red-600' :
                                        passwordStrength.label === 'Medium' ? 'text-yellow-600' :
                                        'text-green-600'
                                    }`}>{passwordStrength.label}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color} ${
                                            passwordStrength.strength === 33 ? 'w-1/3' :
                                            passwordStrength.strength === 66 ? 'w-2/3' :
                                            'w-full'
                                        }`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password Input */}
                    <div className="relative">
                        <label className="block text-sm font-sans font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CheckCircle className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-gray-900"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
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
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="ml-2 -mr-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Footer Link */}
                    <div className="text-center font-sans pt-4 border-t border-gray-200 mt-6">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link href="/signin" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
