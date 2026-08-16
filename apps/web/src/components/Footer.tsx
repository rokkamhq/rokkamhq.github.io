import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { t } from "@/lib/copy";

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <Wordmark inverted />
            <p className="text-sm text-sand/80">{t("footer.tagline")}</p>
            <p className="text-xs text-sand/50">{t("footer.languages")}</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-16 gap-y-2 text-sm text-sand/80">
            <Link href="/sell" className="hover:text-paper">
              {t("nav.sell")}
            </Link>
            <Link href="/#how" className="hover:text-paper">
              {t("nav.how")}
            </Link>
            <Link href="/#trust" className="hover:text-paper">
              {t("nav.trust")}
            </Link>
            <Link href="/#zones" className="hover:text-paper">
              Zones
            </Link>
          </nav>
        </div>
        <div className="mt-10 border-t border-paper/10 pt-6 text-xs leading-relaxed text-sand/50">
          <p>{t("footer.compliance")}</p>
          <p className="mt-2">
            © {new Date().getFullYear()} Rokkam · Hyderabad &amp; Secunderabad (GHMC) only
          </p>
        </div>
      </div>
    </footer>
  );
}
