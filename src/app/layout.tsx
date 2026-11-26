import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Room — Certification Exam Reviewer",
  description: "Study CCST Cybersecurity, HTML & CSS, and JavaScript with flashcards, practice quizzes, bookmarks, and progress saved on your device.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
