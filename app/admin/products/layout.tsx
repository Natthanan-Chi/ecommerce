import type { ReactNode } from "react";
import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";
import AdminNav from "../../../components/admin/AdminNav";
import AdminGuard from "../../../components/admin/AdminGuard";

export const metadata = {
  title: "Admin — Zenith Store",
  description: "Product management admin panel",
};

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col sticky top-0 h-screen overflow-y-auto">
        {/* Brand header */}
        <div className="px-5 pt-6 pb-5 border-b border-slate-800">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Store
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white leading-tight tracking-tight">
                Admin Panel
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">Zenith Store</p>
            </div>
          </div>
        </div>

        {/* Navigation — client component for active state */}
        <AdminNav />

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 mt-auto">
          <p className="text-[10px] text-slate-700 select-none">Zenith Admin v1.0</p>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-auto">
        <AdminGuard>{children}</AdminGuard>
      </div>
    </div>
  );
}
