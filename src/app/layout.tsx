import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Charis_SIL } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// Charis SIL is designed for phonetic text; every IPA symbol renders cleanly.
const charis = Charis_SIL({
  variable: "--font-charis",
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
});

const ui = Atkinson_Hyperlegible_Next({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Speaking English",
  description: "Practice for the Speaking English class: read British English IPA with spaced repetition.",
};

const nav = [
  { href: "/study", label: "Daily review" },
  { href: "/units", label: "Units" },
  { href: "/chart", label: "IPA chart" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${charis.variable} ${ui.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-xl font-bold text-ink">
              Speaking English
            </Link>
            <nav className="flex gap-4 text-sm">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="text-muted hover:text-ink">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
          British RP, EPD transcription · <Link href="/credits" className="underline">Audio credits</Link> ·{" "}
          <Link href="/teacher" className="underline">Teacher mode</Link>
        </footer>
      </body>
    </html>
  );
}
