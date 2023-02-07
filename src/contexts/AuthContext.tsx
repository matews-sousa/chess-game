import React, { useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextProps {
  currentUser: User | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextProps>({} as AuthContextProps);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    console.log(data, error);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log(data, error);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    console.log(error);
  };

  useEffect(() => {
    setLoading(true);
    supabase.auth.getUser().then((userRes) => {
      const {
        data: { user },
      } = userRes;
      setCurrentUser(user ?? null);
    });

    supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useAuth = () => useContext(AuthContext);
