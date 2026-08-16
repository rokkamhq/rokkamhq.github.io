"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, setSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totp_code: totp }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? "Login failed");
      setSession(body.token, body.role, body.name);
      router.push("/prices");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border-2 border-ink/10 bg-white px-4 py-3 text-ink outline-none focus:border-rokkam";

  return (
    <div className="mx-auto mt-20 max-w-sm">
      <h1 className="text-center text-3xl font-bold tracking-tight">
        రొక్కం <span className="text-rokkam">Admin</span>
      </h1>
      <form
        className="mt-8 space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5"
        onSubmit={(e) => {
          e.preventDefault();
          login();
        }}
      >
        <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={inputCls} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className={`${inputCls} font-mono`} inputMode="numeric" maxLength={6} placeholder="TOTP code (if enabled)" value={totp} onChange={(e) => setTotp(e.target.value)} />
        <button
          type="submit"
          disabled={busy || !email || !password}
          className="w-full rounded-full bg-rokkam px-6 py-3 font-semibold text-white transition enabled:hover:bg-rokkam-deep disabled:opacity-40"
        >
          Sign in
        </button>
        {error && <p className="rounded-lg bg-brick/10 px-3 py-2 text-sm font-medium text-brick">{error}</p>}
      </form>
    </div>
  );
}
