"use client";
import { createContext, useEffect, useState, useCallback } from "react";
import type { User, Session as AuthSession } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isConfigured: boolean; // false if env vars are missing
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
  isConfigured: false,
  signOut: async () => {},
});

/** Check if Supabase env vars are set */
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project-ref.supabase.co"
  );
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        setIsLoading(false);

        // (migration removed — Service Builder localStorage data no longer used)
      },
    );

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  const signOut = useCallback(async () => {
    if (!isConfigured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, [isConfigured]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isConfigured, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
