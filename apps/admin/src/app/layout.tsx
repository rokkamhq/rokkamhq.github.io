import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Rokkam Admin",
  description: "Price matrix, deduction rules, order queue",
  robots: { index: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
