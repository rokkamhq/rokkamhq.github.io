import type { Metadata } from "next";
// Self-hosted fonts (no build-time CDN fetch — CI-safe): Inter for UI,
// Anek Telugu for display + the wordmark, JetBrains Mono for money/IDs.
import "@fontsource-variable/inter";
import "@fontsource-variable/anek-telugu";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Rokkam — Sell your phone in Hyderabad. Paid in 60 minutes.",
    template: "%s · Rokkam",
  },
  description:
    "Sell your phone in Hyderabad & Secunderabad. 60-minute pickup, locked quote guarantee, certified data wipe, UPI cash before the agent leaves.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
