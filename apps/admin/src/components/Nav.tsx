"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getToken } from "@/lib/api";

const LINKS = [
  { href: "/prices", label: "Prices" },
  { href: "/orders", label: "Orders" },
  { href: "/rules", label: "Rules" },
  { href: "/audit", label: "Audit" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-ink text-paper">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <span className="font-bold tracking-tight">
          రొక్కం <span className="text-sand/70">Admin</span>
        </span>
        <nav className="flex items-center gap-5 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname.startsWith(link.href) ? "font-semibold text-white" : "text-sand/70 hover:text-white"}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              clearSession();
              router.push("/");
            }}
            className="rounded-full border border-paper/20 px-3 py-1 text-xs text-sand/70 hover:text-white"
          >
            {getToken() ? "Sign out" : "Sign in"}
          </button>
        </nav>
      </div>
    </header>
  );
}
