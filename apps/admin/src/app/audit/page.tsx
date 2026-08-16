"use client";

import { useEffect, useState } from "react";
import { api, type AuditRow } from "@/lib/api";

const TS_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<AuditRow[]>("/admin/audit?limit=200").then(setRows).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
      <p className="mt-1 text-sm text-slate">Append-only. Every price-affecting change lands here.</p>
      {error && <p className="mt-3 rounded-lg bg-brick/10 px-3 py-2 text-sm font-medium text-brick">{error}</p>}
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-ink/5">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-slate">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ink/5 align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-2.5 text-xs">{TS_FMT.format(new Date(row.ts))}</td>
                <td className="px-4 py-2.5 text-xs">{row.actor}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{row.action}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{row.entity}</td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate">
                  {row.before ? `${JSON.stringify(row.before)} → ` : ""}
                  {JSON.stringify(row.after)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
