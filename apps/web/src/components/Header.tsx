import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { t } from "@/lib/copy";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Rokkam home">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate md:flex">
          <Link href="/sell" className="hover:text-ink">
            {t("nav.sell")}
          </Link>
          <Link href="/#how" className="hover:text-ink">
            {t("nav.how")}
          </Link>
          <Link href="/#trust" className="hover:text-ink">
            {t("nav.trust")}
          </Link>
        </nav>
        <Link
          href="/sell"
          className="rounded-full bg-rokkam px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rokkam-deep"
        >
          {t("nav.cta")}
        </Link>
      </div>
    </header>
  );
}
