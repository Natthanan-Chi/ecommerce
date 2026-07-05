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
  signInWithGitHub: (options?: { next?: string }) => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signUpWithEmailPassword: (email: string, password: string) => Promise<void>;
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
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;
        setSession(data.session);
      } catch (err) {
        console.warn("[auth] Unable to hydrate saved session:", err);
        if (mounted) setSession(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
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

  const signInWithGitHub = useCallback(async (options?: { next?: string }) => {
    const next = options?.next;
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    const redirectTo = safeNext
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`
      : `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo,
        scopes: "read:user user:email",
      },
    });

    if (error) throw new Error(error.message);
  }, []);

  const signInWithEmailPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw new Error(error.message);
  }, []);

  const signUpWithEmailPassword = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim();
    const name = normalizedEmail.split("@")[0] || "Customer";
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: name,
          name,
        },
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
      signInWithEmailPassword,
      signUpWithEmailPassword,
      signOut,
    }),
    [
      isLoading,
      session,
      user,
      signInWithGitHub,
      signInWithEmailPassword,
      signUpWithEmailPassword,
      signOut,
    ]
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
