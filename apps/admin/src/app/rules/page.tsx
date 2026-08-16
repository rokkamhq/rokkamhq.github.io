"use client";

import { useEffect, useState } from "react";
import { api, type RuleQuestion } from "@/lib/api";

export default function RulesPage() {
  const [category, setCategory] = useState<"phone" | "laptop">("phone");
  const [questions, setQuestions] = useState<RuleQuestion[]>([]);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  function load() {
    api<RuleQuestion[]>(`/admin/deductions?category=${category}`)
      .then(setQuestions)
      .catch((e) => setError(e.message));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [category]);

  async function save(optionId: number, type: string | null, raw: string) {
    const value = parseFloat(raw);
    if (type && Number.isNaN(value)) return;
    setError("");
    try {
      await api("/admin/deductions", {
        method: "PUT",
        body: JSON.stringify({ option_id: optionId, deduction_type: type, deduction_value: type ? value : null }),
      });
      setEdits((e) => ({ ...e, [optionId]: "" }));
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Deduction rules</h1>
        <div className="flex gap-2">
          {(["phone", "laptop"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                category === c ? "bg-rokkam text-white" : "bg-white text-slate ring-1 ring-ink/10"
              }`}
            >
              {c}s
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mt-3 rounded-lg bg-brick/10 px-3 py-2 text-sm font-medium text-brick">{error}</p>}
      <div className="mt-4 space-y-4">
        {questions.map((q) => (
          <div key={q.question_id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate">{q.section}</p>
            <p className="mt-1 font-semibold">{q.text}</p>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {q.options.map((o) => (
                  <tr key={o.option_id} className="border-t border-ink/5">
                    <td className="py-2 pr-4">{o.label}</td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {o.kills_deal ? (
                        <span className="rounded-full bg-brick/10 px-2 py-0.5 font-sans font-semibold text-brick">kills deal</span>
                      ) : o.deduction_type ? (
                        `${o.deduction_value}${o.deduction_type === "pct" ? "%" : " ₹"}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2">
                      {!o.kills_deal && o.deduction_type && (
                        <div className="flex justify-end gap-2">
                          <input
                            placeholder="new value"
                            className="w-24 rounded-lg border-2 border-ink/10 px-2 py-1 font-mono text-xs outline-none focus:border-rokkam"
                            value={edits[o.option_id] ?? ""}
                            onChange={(e) => setEdits((prev) => ({ ...prev, [o.option_id]: e.target.value }))}
                          />
                          <button
                            onClick={() => save(o.option_id, o.deduction_type, edits[o.option_id] ?? "")}
                            disabled={!edits[o.option_id]}
                            className="rounded-lg bg-rokkam px-3 py-1 text-xs font-semibold text-white enabled:hover:bg-rokkam-deep disabled:opacity-30"
                          >
                            Set
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
