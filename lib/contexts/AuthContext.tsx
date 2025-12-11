"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { account } from "@/lib/config/appwrite";
import { ID, Models } from "appwrite";
import { useRouter } from "next/navigation";
import { AuthContextType } from "../types/auth";
import { Loader } from "lucide-react";

// 1. CREATE CONTEXT
// We initialize it as 'undefined' because we haven't loaded the provider yet.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for the Provider (it just accepts children components)
interface AuthProviderProps {
    children: ReactNode;
}

// 2. THE PROVIDER COMPONENT
// This component wraps your entire app in layout.tsx
export const AuthProvider = ({ children }: AuthProviderProps) => {
    
    // STATE:
    // 'user' holds the logged-in user's data. It is either a User Object or null.
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    
    // 'loading' stops the app from showing the Wrong UI while we check if they are logged in.
    const [loading, setLoading] = useState(true);
    
    const router = useRouter();

    // 3. CHECK SESSION ON LOAD
    // This runs ONCE when the website first loads (refreshes).
    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        try {
            // Ask Appwrite: "Who is the current user?"
            const loggedInUser = await account.get();
            setUser(loggedInUser); // Success! We know who they are.
        } catch (error) {
            // Error means they are a Guest (not logged in).
            setUser(null);
        } finally {
            // Whether success or fail, we are done "loading".
            setLoading(false);
        }
    };

    // 4. LOGIN FUNCTION
    const login = async (email: string, password: string) => {
        try {
            // Step A: Create the session (The browser saves a cookie)
            await account.createEmailPasswordSession(email, password);
            
            // Step B: Fetch the user details immediately so the UI updates
            const loggedInUser = await account.get();
            setUser(loggedInUser);
            
            // Step C: Send them to the Dashboard
            router.push("/");
        } catch (error) {
            console.error("Login Failed:", error);
            // We re-throw the error so the Login Page can show a red alert box
            throw error;
        }
    };

    // 5. SIGNUP FUNCTION
    const signup = async (name: string, email: string, password: string) => {
        try {
            // Step A: Create the account in the database
            await account.create(ID.unique(), email, password, name);
            
            // Step B: Automatically log them in (User experience is better this way)
            await login(email, password);
        } catch (error) {
            console.error("Signup Failed:", error);
            throw error;
        }
    };

    // 6. LOGOUT FUNCTION
    const logout = async () => {
        try {
            // Delete the session from Appwrite
            await account.deleteSession("current");
            setUser(null);
            router.push("/signin"); // Send back to login screen
        } catch (error) {
            console.error("Logout Failed:", error);
        }
    };

    // Pack all these functions and values into one object
    const value = {
        user,
        login,
        signup,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {/* If we are loading, show a simple text. Otherwise, show the app. */}
            {loading ? <div className="h-screen w-screen flex items-center justify-center"><Loader size={48} className="text-primary-500 animate-spin"></Loader></div> : children}
        </AuthContext.Provider>
    );
};

// 7. CUSTOM HOOK
// This is a helper so you don't have to import useContext(AuthContext) every time.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};