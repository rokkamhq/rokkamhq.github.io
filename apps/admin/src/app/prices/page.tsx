"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type PriceRow } from "@/lib/api";

const inr = new Intl.NumberFormat("en-IN");

export default function PricesPage() {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [filter, setFilter] = useState("");
  const [staleOnly, setStaleOnly] = useState(false);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");

  function load() {
    api<PriceRow[]>("/admin/prices").then(setRows).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  const visible = useMemo(() => {
    const q = filter.toLowerCase();
    return rows.filter(
      (r) =>
        (!staleOnly || r.stale) &&
        (!q || `${r.brand} ${r.model} ${r.label} ${r.category}`.toLowerCase().includes(q)),
    );
  }, [rows, filter, staleOnly]);

  async function save(row: PriceRow) {
    const price = parseInt(edits[row.variant_id] ?? "", 10);
    if (!price || price <= 0) return;
    setSaving(row.variant_id);
    setError("");
    try {
      await api("/admin/prices", {
        method: "PUT",
        body: JSON.stringify({ variant_id: row.variant_id, price_inr: price, note: "admin ui" }),
      });
      setEdits((e) => ({ ...e, [row.variant_id]: "" }));
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  const staleCount = rows.filter((r) => r.stale).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Price matrix</h1>
        <div className="flex items-center gap-3 text-sm">
          <input
            placeholder="Filter…"
            className="rounded-xl border-2 border-ink/10 bg-white px-3 py-2 outline-none focus:border-rokkam"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <label className="flex cursor-pointer items-center gap-1.5 font-medium">
            <input type="checkbox" checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} />
            Stale only ({staleCount})
          </label>
        </div>
      </div>
      {error && <p className="mt-3 rounded-lg bg-brick/10 px-3 py-2 text-sm font-medium text-brick">{error}</p>}
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-ink/5">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-slate">
            <tr>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3">Current ₹</th>
              <th className="px-4 py-3">Repriced</th>
              <th className="px-4 py-3">New price</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.variant_id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-2.5">
                  <span className="font-medium">{row.brand} {row.model}</span>
                  <span className="ml-2 rounded bg-sand px-1.5 py-0.5 text-[10px] uppercase text-slate">{row.category}</span>
                </td>
                <td className="px-4 py-2.5 font-mono">{row.label === "__base__" ? "base config" : row.label}</td>
                <td className="px-4 py-2.5 font-mono font-semibold">
                  {row.price_inr !== null ? `₹${inr.format(row.price_inr)}` : "—"}
                </td>
                <td className="px-4 py-2.5">
                  {row.stale ? (
                    <span className="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-semibold text-amber">
                      stale
                    </span>
                  ) : (
                    <span className="text-xs text-slate">{row.effective_from?.slice(0, 10)}</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-2">
                    <input
                      inputMode="numeric"
                      placeholder="₹"
                      className="w-24 rounded-lg border-2 border-ink/10 px-2 py-1 font-mono outline-none focus:border-rokkam"
                      value={edits[row.variant_id] ?? ""}
                      onChange={(e) =>
                        setEdits((prev) => ({ ...prev, [row.variant_id]: e.target.value.replace(/\D/g, "") }))
                      }
                    />
                    <button
                      onClick={() => save(row)}
                      disabled={saving === row.variant_id || !edits[row.variant_id]}
                      className="rounded-lg bg-rokkam px-3 py-1 text-xs font-semibold text-white transition enabled:hover:bg-rokkam-deep disabled:opacity-30"
                    >
                      Set
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
