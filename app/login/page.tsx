"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowLeft, Loader2, Mail, ShieldCheck, Sparkles, UserCircle } from "lucide-react";
import { type OAuthProvider, useAuth } from "../../components/AuthProvider";
import { AuthPanelSkeleton } from "../../components/customer/LoadingAndErrorStates";

export default function LoginPage() {
  const router = useRouter();
  const {
    isLoading,
    user,
    displayName,
    signInWithOAuth,
    signInWithEmailPassword,
    signUpWithEmailPassword,
    signOut,
  } = useAuth();
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setError(null);
    setMessage(null);
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      setError(
        provider === "google"
          ? "ไม่สามารถเริ่มเข้าสู่ระบบด้วย Google ได้"
          : "ไม่สามารถเริ่มเข้าสู่ระบบด้วย GitHub ได้"
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAuthMode("sign-in");
      setEmail("");
      setPassword("");
      setMessage(null);
      setError(null);
      router.replace("/login");
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      setError("ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (authMode === "sign-in") {
        await signInWithEmailPassword(email, password);
        router.push("/account");
      } else {
        await signUpWithEmailPassword(email, password);
        setMessage("สร้างบัญชีเรียบร้อยแล้ว หากระบบเปิดยืนยันอีเมล กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ");
        setAuthMode("sign-in");
      }
      setPassword("");
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      setError("ไม่สามารถดำเนินการด้วยอีเมลได้ กรุณาตรวจสอบข้อมูลและลองใหม่");
    } finally {
      setIsSubmitting(false);
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
          กลับไปหน้าร้าน
        </Link>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">เข้าสู่ระบบลูกค้า</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เข้าสู่บัญชี Zenith ของคุณ
              </p>
            </div>
          </div>

          {isLoading ? (
            <AuthPanelSkeleton />
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4">
                <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-green-900 dark:text-green-200 truncate">
                    เข้าสู่ระบบในชื่อ {displayName}
                  </p>
                  <p className="text-xs text-green-700/70 dark:text-green-300/70 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/account")}
                  className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold py-3 transition cursor-pointer"
                >
                  ไปที่บัญชีของฉัน
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
                {[
                  { value: "sign-in", label: "เข้าสู่ระบบ" },
                  { value: "sign-up", label: "สร้างบัญชี" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setAuthMode(option.value as "sign-in" | "sign-up");
                      setError(null);
                      setMessage(null);
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-extrabold transition ${
                      authMode === option.value
                        ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    อีเมล
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="customer@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    รหัสผ่าน
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    autoComplete={authMode === "sign-in" ? "current-password" : "new-password"}
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {authMode === "sign-in" ? "เข้าสู่ระบบด้วยอีเมล" : "สร้างบัญชีลูกค้า"}
                </button>
              </form>

              {message && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                  {message}
                </p>
              )}
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">หรือ</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              <button
                type="button"
                onClick={() => void handleOAuthLogin("google")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-bold py-3 hover:bg-slate-50 active:scale-[0.99] transition cursor-pointer dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-red-500">
                  G
                </span>
                เข้าสู่ระบบด้วย Google
              </button>

              <button
                type="button"
                onClick={() => void handleOAuthLogin("github")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-sm font-bold py-3 hover:opacity-90 active:scale-[0.99] transition cursor-pointer"
              >
                <UserCircle className="w-5 h-5" />
                เข้าสู่ระบบด้วย GitHub
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
