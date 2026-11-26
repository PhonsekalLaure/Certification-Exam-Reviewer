"use client";
import { createContext, useContext, useMemo } from "react";
import type { Chapter, Question } from "./study";

export const certifications = [
  { id: "ccst", name: "CCST Cybersecurity", shortName: "CCST", topic: "cybersecurity", examCode: "CCST", description: "Network defense, security fundamentals, and incident response." },
  { id: "html-css", name: "HTML & CSS", shortName: "HTML & CSS", topic: "HTML and CSS", examCode: "98-383", description: "Document structure, selectors, responsive layouts, and media." },
  { id: "javascript", name: "JavaScript", shortName: "JavaScript", topic: "JavaScript", examCode: "98-382", description: "Types, arrays, dates, control flow, and browser scripting." },
] as const;
export type CertificationId = typeof certifications[number]["id"];
export type Certification = typeof certifications[number];
export interface QuestionBank { source: string; edition: string; chapters: Chapter[]; questions: Question[]; sourceFiles?: string[] }
interface ContextValue { certification: Certification; bank: QuestionBank; selectCertification: (id: CertificationId) => void; loading: boolean; loadError: string }
export const CertificationContext = createContext<ContextValue | null>(null);
export function useCertification() {
  const context = useContext(CertificationContext);
  if (!context) throw new Error("Study components must be inside a certification provider.");
  return context;
}
export function useQuestionBank() {
  const { bank } = useCertification();
  return useMemo(() => ({ ...bank, questionMap: new Map(bank.questions.map(q => [q.id, q])) }), [bank]);
}
