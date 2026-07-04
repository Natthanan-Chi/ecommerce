import type { ReactNode } from "react";
import AdminLayoutShell from "../../components/admin/AdminLayoutShell";

export const metadata = {
  title: "Admin — Zenith Store",
  description: "Zenith Store admin panel",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
