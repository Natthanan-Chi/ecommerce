"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutGrid,
  MessageCircle,
  MessageSquareText,
  PackageCheck,
} from "lucide-react";
import {
  fetchAdminChatSummary,
  subscribeToAdminChatChanges,
  type AdminChatSummary,
} from "../../data/chat";

const NAV_GROUPS = [
  {
    label: "Management",
    items: [
      { label: "Products", href: "/admin/products", icon: LayoutGrid, exact: false },
      { label: "Orders", href: "/admin/orders", icon: PackageCheck, exact: false },
      { label: "Reviews", href: "/admin/reviews", icon: MessageSquareText, exact: false },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "Live Chat", href: "/admin/chat", icon: MessageCircle, exact: false },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [chatSummary, setChatSummary] = useState<AdminChatSummary | null>(null);

  const loadChatSummary = useCallback(async () => {
    const summary = await fetchAdminChatSummary();
    setChatSummary(summary);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadChatSummary(), 0);
    const unsubscribe = subscribeToAdminChatChanges(() => void loadChatSummary());
    const interval = window.setInterval(() => void loadChatSummary(), 45000);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [loadChatSummary]);

  const chatBadgeCount = (chatSummary?.waitingAdmin ?? 0) + (chatSummary?.unread ?? 0);

  return (
    <nav className="flex-1 space-y-6 px-3 py-5">
      {NAV_GROUPS.map((group) => (
        <section key={group.label}>
          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-600">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map(({ label, href, icon: Icon, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-brand-600 text-white shadow-lg shadow-brand-900/30"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {href === "/admin/chat" && chatBadgeCount > 0 && (
                      <span
                        className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                          isActive ? "bg-white text-brand-700" : "bg-red-500 text-white"
                        }`}
                      >
                        {chatBadgeCount > 99 ? "99+" : chatBadgeCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
