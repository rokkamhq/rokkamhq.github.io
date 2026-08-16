import type { Metadata } from "next";
import { Anek_Telugu, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const anek = Anek_Telugu({
  variable: "--font-anek",
  subsets: ["latin", "telugu"],
  weight: ["500", "600", "700", "800"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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
    <html
      lang="en"
      className={`${inter.variable} ${anek.variable} ${jbMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
