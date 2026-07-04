"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck, Sparkles, UserCircle } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, user, displayName, signInWithGitHub, signOut } = useAuth();

  const handleGitHubSignIn = async () => {
    try {
      await signInWithGitHub();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to start GitHub sign in");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to sign out");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 py-8">
      <div className="max-w-md mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Customer Sign In</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Continue to your Zenith account
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Checking session...</span>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4">
                <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-green-900 dark:text-green-200 truncate">
                    Signed in as {displayName}
                  </p>
                  <p className="text-xs text-green-700/70 dark:text-green-300/70 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold py-3 transition cursor-pointer"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGitHubSignIn}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-sm font-bold py-3 hover:opacity-90 active:scale-[0.99] transition cursor-pointer"
            >
              <UserCircle className="w-5 h-5" />
              Continue with GitHub
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
