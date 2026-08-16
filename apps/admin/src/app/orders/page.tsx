"use client";

import { useEffect, useState } from "react";
import { api, ORDER_NEXT, type OrderRow } from "@/lib/api";

const inr = new Intl.NumberFormat("en-IN");
const SLOT_FMT = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

const STATUS_STYLE: Record<string, string> = {
  booked: "bg-rokkam/10 text-rokkam-deep",
  assigned: "bg-sand text-slate",
  enroute: "bg-amber/20 text-amber",
  verifying: "bg-amber/20 text-amber",
  deviation_pending: "bg-brick/10 text-brick",
  completed: "bg-rokkam text-white",
  cancelled: "bg-ink/10 text-slate",
  failed: "bg-brick/10 text-brick",
};

export default function OrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");

  function load() {
    api<OrderRow[]>(`/admin/orders${statusFilter ? `?status=${statusFilter}` : ""}`)
      .then(setRows)
      .catch((e) => setError(e.message));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [statusFilter]);

  async function transition(orderId: number, status: string) {
    setError("");
    try {
      await api(`/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Order queue</h1>
        <select
          className="rounded-xl border-2 border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-rokkam"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.keys(ORDER_NEXT).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {error && <p className="mt-3 rounded-lg bg-brick/10 px-3 py-2 text-sm font-medium text-brick">{error}</p>}
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-ink/5">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-slate">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Quote</th>
              <th className="px-4 py-3">₹</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Move to</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.order_id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-2.5 font-mono">{row.order_id}</td>
                <td className="px-4 py-2.5 font-medium">{row.device}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{row.quote_code}</td>
                <td className="px-4 py-2.5 font-mono font-semibold">₹{inr.format(row.amount_inr)}</td>
                <td className="px-4 py-2.5">{row.zone}</td>
                <td className="px-4 py-2.5 text-xs">{SLOT_FMT.format(new Date(row.slot_start))}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[row.status] ?? ""}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {(ORDER_NEXT[row.status] ?? []).map((next) => (
                      <button
                        key={next}
                        onClick={() => transition(row.order_id, next)}
                        className="rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-medium transition hover:border-rokkam hover:text-rokkam-deep"
                      >
                        {next}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
