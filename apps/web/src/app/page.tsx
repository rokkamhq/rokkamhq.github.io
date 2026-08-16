import Link from "next/link";
import { t } from "@/lib/copy";
import { ZONES } from "@/lib/catalog";
import { whatsappLink } from "@/lib/site";

const heroLedger = [
  { label: "iPhone 13 · 128GB — base", amount: "₹24,500", kind: "base" },
  { label: "Glass cracked, display works", amount: "− ₹7,350", kind: "cut" },
  { label: "Battery health 80–85%", amount: "− ₹1,470", kind: "cut" },
  { label: "Original charger", amount: "+ ₹250", kind: "bonus" },
] as const;

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-rokkam">
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate">{t("hero.sub")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/sell"
                className="rounded-full bg-rokkam px-8 py-4 text-base font-semibold text-white shadow-lg shadow-rokkam/25 transition hover:bg-rokkam-deep"
              >
                {t("hero.cta")}
              </Link>
              <Link
                href="#how"
                className="rounded-full border border-ink/15 px-8 py-4 text-base font-semibold text-ink transition hover:border-ink/40"
              >
                {t("hero.cta2")}
              </Link>
            </div>
            {whatsappLink("Hi Rokkam! I want a price for my device.") && (
              <a
                href={whatsappLink("Hi Rokkam! I want a price for my device.")!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-rokkam-deep underline-offset-4 hover:underline"
              >
                💬 {t("hero.wa")} →
              </a>
            )}
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate">
              {[t("hero.badge.pickup"), t("hero.badge.upi"), t("hero.badge.wipe")].map((badge) => (
                <li key={badge} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rokkam" aria-hidden />
                  {badge}
                </li>
              ))}
            </ul>
          </div>

          {/* Sample deduction ledger — the trust product, visible from second one */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-6 rounded-[2rem] bg-rokkam/10 blur-2xl" aria-hidden />
            <div className="receipt-edge relative rounded-t-2xl bg-white p-6 shadow-xl ring-1 ring-ink/10">
              <p className="font-mono text-xs uppercase tracking-widest text-slate">
                Rokkam · live quote
              </p>
              <ul className="mt-4 space-y-3 border-t border-dashed border-ink/15 pt-4">
                {heroLedger.map((line, i) => (
                  <li
                    key={line.label}
                    className="flex items-baseline justify-between gap-4 animate-ledger-in"
                    style={{ animationDelay: `${0.35 + i * 0.5}s` }}
                  >
                    <span className="text-sm text-slate">{line.label}</span>
                    <span
                      className={`font-mono text-sm font-medium whitespace-nowrap ${
                        line.kind === "cut"
                          ? "text-brick"
                          : line.kind === "bonus"
                            ? "text-rokkam"
                            : "text-ink"
                      }`}
                    >
                      {line.amount}
                    </span>
                  </li>
                ))}
              </ul>
              <div
                className="mt-4 flex items-baseline justify-between border-t border-ink/15 pt-4 animate-ledger-in"
                style={{ animationDelay: "2.5s" }}
              >
                <span className="text-sm font-semibold text-ink">You get</span>
                <span className="font-mono text-2xl font-bold text-rokkam">₹15,930</span>
              </div>
              <p
                className="mt-3 rounded-lg bg-sand/60 px-3 py-2 text-xs font-medium text-slate animate-ledger-in"
                style={{ animationDelay: "3s" }}
              >
                🔒 Locked for 7 days. The agent&apos;s app cannot change it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section id="trust" className="bg-ink py-20 text-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("pillars.title")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {(
              [
                ["locked", "🔒"],
                ["speed", "⚡"],
                ["wipe", "🛡️"],
                ["legit", "📋"],
              ] as const
            ).map(([key, icon]) => (
              <div
                key={key}
                className="rounded-2xl border border-paper/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]"
              >
                <div className="text-2xl" aria-hidden>
                  {icon}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-paper">
                  {t(`pillars.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-sand/75">{t(`pillars.${key}.body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("how.title")}
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {([1, 2, 3, 4] as const).map((n) => (
              <li key={n} className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5">
                <span className="font-mono text-sm font-bold text-rokkam">0{n}</span>
                <h3 className="mt-2 font-semibold text-ink">{t(`how.step${n}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{t(`how.step${n}.body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Zones */}
      <section id="zones" className="py-8 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl bg-sand p-8 sm:p-12">
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
              {t("zones.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-slate">{t("zones.sub")}</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {ZONES.map((zone) => (
                <div key={zone.id} className="rounded-2xl bg-paper p-5 ring-1 ring-ink/5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate">
                      {zone.name}
                    </span>
                    <span className="rounded-full bg-rokkam/10 px-3 py-1 text-xs font-semibold text-rokkam-deep">
                      {zone.sla_label}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate">{zone.areas.join(" · ")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
            {t("faq.title")}
          </h2>
          <div className="mt-8 space-y-3">
            {([1, 2, 3, 4] as const).map((n) => (
              <details key={n} className="group rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                <summary className="cursor-pointer list-none font-semibold text-ink marker:hidden">
                  {t(`faq.q${n}`)}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate">{t(`faq.a${n}`)}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 rounded-3xl bg-rokkam p-8 text-center sm:p-12">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white">
              {t("hero.title")}
            </h2>
            <Link
              href="/sell"
              className="mt-6 inline-block rounded-full bg-white px-8 py-4 text-base font-semibold text-rokkam-deep transition hover:bg-sand"
            >
              {t("hero.cta")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
