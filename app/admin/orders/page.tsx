"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, PackageCheck, RefreshCw, Save, Truck } from "lucide-react";
import {
  fetchAdminOrders,
  updateOrderAdminFields,
  type AdminOrder,
  type OrderStatus,
} from "../../../data/products";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

function customerName(order: AdminOrder) {
  const fullName = `${order.users?.first_name ?? ""} ${order.users?.last_name ?? ""}`.trim();
  return fullName || order.users?.email || "Unknown customer";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedId) ?? orders[0] ?? null,
    [orders, selectedId]
  );

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.status === "PENDING").length,
      shipped: orders.filter((order) => order.status === "SHIPPED").length,
      revenue: orders.reduce((sum, order) => sum + Number(order.grand_total), 0),
    }),
    [orders]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrders();
      setOrders(data);
      setSelectedId((current) => current ?? data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateLocalOrder = (id: string, patch: Partial<AdminOrder>) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, ...patch } : order))
    );
  };

  const saveOrder = async (order: AdminOrder) => {
    setSavingId(order.id);
    setError(null);
    try {
      await updateOrderAdminFields(order.id, {
        status: order.status,
        tracking_number: order.tracking_number?.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-8 max-w-screen-2xl">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Orders</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Review customer orders, fulfillment status, and tracking details.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          ["Total Orders", stats.total],
          ["Pending", stats.pending],
          ["Shipped", stats.shipped],
          ["Revenue", `$${stats.revenue.toFixed(2)}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <PackageCheck className="w-5 h-5 text-brand-400 mb-3" />
            <p className="text-2xl font-extrabold text-white">{value}</p>
            <p className="text-[11px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32 text-slate-500 gap-3">
          <Loader2 className="w-7 h-7 animate-spin" />
          <span className="text-sm">Loading orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-500">
          No orders yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_420px] gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-widest text-slate-500">
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={`cursor-pointer border-b border-slate-800/60 hover:bg-slate-800/50 ${
                      selectedOrder?.id === order.id ? "bg-slate-800/70" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-bold text-brand-300">
                        {order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-white">{customerName(order)}</p>
                      <p className="text-[11px] text-slate-500">{order.users?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-white">
                      ${Number(order.grand_total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedOrder && (
            <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5 h-fit">
              <div className="flex items-center gap-2 mb-5">
                <Truck className="w-5 h-5 text-brand-400" />
                <h2 className="font-extrabold text-white">Fulfillment</h2>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Status</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(event) =>
                      updateLocalOrder(selectedOrder.id, {
                        status: event.target.value as OrderStatus,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase text-slate-500">
                    Tracking Number
                  </span>
                  <input
                    value={selectedOrder.tracking_number ?? ""}
                    onChange={(event) =>
                      updateLocalOrder(selectedOrder.id, {
                        tracking_number: event.target.value,
                      })
                    }
                    placeholder="Optional tracking code"
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>
                <button
                  onClick={() => void saveOrder(selectedOrder)}
                  disabled={savingId === selectedOrder.id}
                  className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60"
                >
                  {savingId === selectedOrder.id ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Save className="w-4 h-4" /> Save Order
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-300">
                        {item.products?.title ?? "Deleted product"} x{item.quantity}
                      </span>
                      <span className="font-bold text-white">
                        ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase text-slate-500">Ship To</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {selectedOrder.shipping_address}
                </p>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
