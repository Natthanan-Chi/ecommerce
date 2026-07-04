"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthPanelSkeleton, CustomerErrorState } from "../../../components/customer/LoadingAndErrorStates";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [retryHref, setRetryHref] = useState("/login");

  useEffect(() => {
    let mounted = true;

    async function completeSignIn() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const nextParam = url.searchParams.get("next");
      const nextPath =
        nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
          ? nextParam
          : "/";
      if (mounted) {
        setRetryHref(nextPath.startsWith("/admin") ? "/admin/login" : "/login");
      }
      const oauthError = url.searchParams.get("error_description");
      const hashError = new URLSearchParams(url.hash.replace(/^#/, "")).get(
        "error_description"
      );

      if (oauthError || hashError) {
        if (mounted) setError(oauthError || hashError);
        return;
      }

      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();

      if (existingSession) {
        router.replace(nextPath);
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (mounted) setError(exchangeError.message);
          return;
        }

        router.replace(nextPath);
        return;
      }

      const retryTimer = window.setTimeout(async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          router.replace(nextPath);
        } else {
          setError("Could not find a completed Supabase sign-in session.");
        }
      }, 500);

      return () => window.clearTimeout(retryTimer);
    }

    let cleanupRetry: void | (() => void);
    void completeSignIn().then((cleanup) => {
      cleanupRetry = cleanup;
    });

    return () => {
      mounted = false;
      cleanupRetry?.();
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4">
      <section className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-xl shadow-slate-200/50 dark:shadow-black/20">
        {error ? (
          <CustomerErrorState
            title="Sign In Failed"
            message="We could not complete the Supabase sign-in flow."
            detail={error}
            actionLabel="Try Again"
            href={retryHref}
          />
        ) : (
          <AuthPanelSkeleton />
        )}
      </section>
    </main>
  );
}
