"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus } from "lucide-react";

const NAV_ITEMS = [
  { label: "All Products", href: "/products", icon: LayoutGrid, exact: true },
  { label: "Add New Product", href: "/products/new", icon: Plus, exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-5">
      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-2">
        Catalog
      </p>
      <ul className="space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-900/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
