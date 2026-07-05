"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import AdminGuard from "./AdminGuard";
import AdminNav from "./AdminNav";
import AdminUserControls from "./AdminUserControls";

export default function AdminLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="admin-theme flex min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 pb-5 pt-6 dark:border-slate-800">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:hover:text-slate-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Store
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white">
                Zenith Admin
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">Zenith Store</p>
            </div>
          </div>
        </div>

        <AdminNav />

        <div className="mt-auto">
          <AdminUserControls />
        </div>
      </aside>

      <div className="flex-1 min-w-0 overflow-auto">
        <AdminGuard>{children}</AdminGuard>
      </div>
    </div>
  );
}
