import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "HR Taskflow",
    template: "%s · HR Taskflow",
  },
  description: "ระบบติดตามงานหนังสือบุคลากรสำหรับหน่วยงาน HR",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-background"
        >
          ข้ามไปยังเนื้อหา
        </a>
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <div>
              <p className="text-xs tracking-wide text-gold">งานบุคลากร</p>
              <Link href="/" className="text-lg font-semibold">
                HR Taskflow
              </Link>
            </div>
            <nav aria-label="หลัก" className="flex gap-4 text-sm">
              <Link href="/tasks" className="underline-offset-4 hover:underline">
                รายการงาน
              </Link>
              <Link href="/tasks/new" className="underline-offset-4 hover:underline">
                เพิ่มงาน
              </Link>
            </nav>
          </div>
        </header>
        <main id="content" className="mx-auto w-full max-w-6xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
