import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Clear all Supabase auth data from storage
  const clearAuthStorage = () => {
    // Clear all localStorage keys related to Supabase auth
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') && key.includes('-auth-token')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Also clear any other auth-related data
    sessionStorage.clear();
  };

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle token expiration and logout
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      // Clear all auth data on sign out
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        clearAuthStorage();
        navigate("/");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: name,
        },
      },
    });
    
    if (error) return { error };
    
    // Check if user was created (email might already be registered)
    if (!data.user) {
      return { error: { message: "Este email já está registrado" } as any };
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Provide more user-friendly error messages
      if (error.message.includes("Invalid login credentials")) {
        return { error: { ...error, message: "Email ou senha incorretos" } };
      }
      return { error };
    }
    
    // Verify user exists
    if (!data.user) {
      return { error: { message: "Usuário não encontrado" } as any };
    }
    
    return { error: null };
  };

  const signOut = async () => {
    try {
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Clear local state
      setUser(null);
      setSession(null);
      
      // Clear all auth data from storage
      clearAuthStorage();
      
      // Navigate to auth page
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      // Even if signOut fails, clear local data
      setUser(null);
      setSession(null);
      clearAuthStorage();
      navigate("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
