"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextValue {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  displayName: string;
  avatarUrl: string | null;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function nameFromUser(user: User | null) {
  if (!user) return "";
  const metadata = user.user_metadata ?? {};
  return (
    metadata.full_name ||
    metadata.name ||
    metadata.user_name ||
    metadata.preferred_username ||
    user.email ||
    "Customer"
  );
}

function avatarFromUser(user: User | null) {
  if (!user) return null;
  const metadata = user.user_metadata ?? {};
  return metadata.avatar_url || metadata.picture || null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function hydrateSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setIsLoading(false);
    }

    void hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGitHub = useCallback(async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo,
        scopes: "read:user user:email",
      },
    });

    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }, []);

  const user = session?.user ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      user,
      displayName: nameFromUser(user),
      avatarUrl: avatarFromUser(user),
      signInWithGitHub,
      signOut,
    }),
    [isLoading, session, user, signInWithGitHub, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
