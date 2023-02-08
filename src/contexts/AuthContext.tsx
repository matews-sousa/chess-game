import React, { useContext, useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type User = SupabaseUser & {
  user_metadata: {
    firstName: string;
  };
};

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextProps>({} as AuthContextProps);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signUp = async (email: string, password: string, firstName: string) => {
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
        },
      },
    });
  };

  const signIn = async (email: string, password: string) => {
    await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    setLoading(true);
    supabase.auth.getUser().then((userRes) => {
      const {
        data: { user },
      } = userRes;
      setCurrentUser((user as User) ?? null);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser((session?.user as User) ?? null);
      setLoading(false);
    });
  }, []);

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useAuth = () => useContext(AuthContext);
