import { Models } from "appwrite";

// -----------------------------------------------------------------------------
// INTERFACES: These are like "Blueprints" for your objects.
// -----------------------------------------------------------------------------

export interface AuthContextType {
    // Appwrite returns a User object that includes an $id, name, email, etc.
    // We use "Models.User<Models.Preferences>" because that's the official type from the SDK.
    user: Models.User<Models.Preferences> | null; 
    
    // These are functions that return a Promise (async tasks)
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    
    // Simple boolean to track if we are currently fetching data
    loading: boolean;
}