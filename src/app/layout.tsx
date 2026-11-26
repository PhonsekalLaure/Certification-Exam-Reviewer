import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Room — Certification Exam Reviewer",
  description: "Study CCST Cybersecurity, HTML & CSS, and JavaScript with flashcards, practice quizzes, bookmarks, and progress saved on your device.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#f5f4f0", colorScheme: "light dark" };

// Apply appearance before the first paint; this script contains no user content.
const themeScript = `(()=>{let p="system";try{const s=localStorage.getItem("studyroom:theme");if(s==="light"||s==="dark")p=s}catch{}const t=p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p;document.documentElement.dataset.theme=t;document.documentElement.dataset.themePreference=p;document.querySelector('meta[name="theme-color"]')?.setAttribute("content",t==="dark"?"#171b1d":"#f5f4f0")})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script id="theme-init" dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>;
}
