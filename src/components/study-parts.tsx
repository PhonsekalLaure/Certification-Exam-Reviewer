"use client";

import { Bookmark, Check, Info, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuestionBank } from "@/lib/certification-context";
import type { Question, Chapter, StudyState } from "@/lib/study";
import { useStudyActions } from "@/lib/store";


export function BookmarkButton({ question, saved }: { question: Question; saved: boolean }) {
  const { updateStudy } = useStudyActions();
  function toggleBookmark(id: string) { updateStudy(s => ({ ...s, bookmarks: s.bookmarks.includes(id) ? s.bookmarks.filter(x => x !== id) : [...s.bookmarks, id] })); }
  return <Button variant="ghost" size="icon" aria-label={`${saved ? "Remove bookmark for" : "Bookmark"} question ${question.number}`} aria-pressed={saved} onClick={() => toggleBookmark(question.id)} className={saved ? "is-bookmarked" : ""}><Bookmark size={19} fill={saved ? "currentColor" : "none"} /></Button>;
}

export function ChapterSelect({ value, onChange, id = "chapter-select" }: { value: number; onChange: (value: number) => void; id?: string }) {
  const { chapters } = useQuestionBank();
  return <select id={id} value={value} onChange={event => onChange(Number(event.target.value))}><option value={0}>All chapters</option>{chapters.map(c => <option key={c.id} value={c.id}>{String(c.id).padStart(2, "0")} · {c.title}</option>)}</select>;
}

export function Meter({ value, label, className = "" }: { value: number; label: string; className?: string }) {
  return <div className={`meter ${className}`} role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function QuestionBadge({ question }: { question: Question }) {
  const labels = { single: "Single answer", multiple: "Multiple answers", matching: "Matching", ordering: "Put in order", reference: "Source exercise" };
  return <span className="badge badge-neutral">{labels[question.type]}</span>;
}

export function SourceNote({ question }: { question: Question }) {
  if (question.status === "standard") return null;
  return <div className="source-note"><Info size={17} /><div><strong>{question.status === "invalid" ? "Study-only question" : question.status === "historical" ? "Historical guidance" : "Answer needs context"}</strong><p>{question.studyNote ?? (question.status === "invalid" ? "The source has no complete valid answer key. This card is excluded from quizzes." : question.status === "historical" ? "The source discusses older guidance. Read the explanation for the relevant edition and current context." : "The source qualifies this answer or identifies overlapping choices. The explanation is part of the answer.")}</p></div></div>;
}

export function CodeExhibit({ text, label, blanks = false }: { text: string; label: string; blanks?: boolean }) {
  return <figure className="code-exhibit"><figcaption>{label}{blanks ? <span>Numbered tokens are blanks</span> : null}</figcaption><pre tabIndex={0} aria-label={label}><code>{text.split(/(\[\d+\])/).map((part, index) => blanks && /^\[\d+\]$/.test(part) ? <mark key={index}>{part}</mark> : part)}</code></pre></figure>;
}

export function Exhibit({ question, showPrompts = false }: { question: Question; showPrompts?: boolean }) {
  return <>{question.exhibit ? question.contentFormat === "text" ? <CodeExhibit text={question.exhibit} label={`Code and markup for question ${question.number}`} blanks={question.type === "matching"} /> : <pre className="log-exhibit" tabIndex={0} aria-label="Code or log exhibit">{question.exhibit}</pre> : null}{showPrompts && question.type === "matching" ? <div className="recall-prompts"><span className="eyebrow">CONSIDER EACH RESPONSE</span><ol>{question.pairs.map(pair => <li key={pair.id}>{pair.left}</li>)}</ol></div> : null}</>;
}

export function AnswerContent({ question }: { question: Question }) {
  const { source, edition } = useQuestionBank();
  return <>
    <div className="answer-key"><span className="eyebrow">SOURCE ANSWER</span><h3>{question.type === "matching" ? "The matching pairs" : question.answerLabel}</h3></div>
    <SourceNote question={question} />
    {question.type === "matching" ? <dl className="answer-pairs">{question.pairs.map(pair => <div key={pair.id}><dt>{pair.left}</dt><dd>{pair.right}</dd></div>)}</dl> : question.status !== "invalid" ? <ul className="correct-answers">{question.correctIds.map((id, i) => <li key={id}><span>{question.type === "ordering" ? i + 1 : <Check size={16} />}</span>{question.options.find(o => o.id === id)?.text}</li>)}</ul> : null}
    {question.answerExhibit ? <CodeExhibit text={question.answerExhibit} label="Source answer and study reference" /> : null}
    <div className="explanation"><h4>Why this answer?</h4><p>{question.explanation}</p></div>
    <p className="source-reference">{edition} · {question.sourceFile ?? source}, page {question.sourcePage} · Question {String(question.number).padStart(3, "0")}</p>
    {question.sourceReferences && question.sourceReferences.length > 1 ? <p className="source-reference">Also supplied in: {question.sourceReferences.slice(1).map(ref => `${ref.file}, page ${ref.page}`).join("; ")}</p> : null}
  </>;
}

export function EmptyState({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><BookOpen size={28} /></span><h2>{title}</h2><p>{children}</p>{action}</div>;
}

export function ChapterCard({ chapter, state, open }: { chapter: Chapter; state: StudyState; open: () => void }) {
  const { questions } = useQuestionBank();
  const studied = questions.filter(q => q.chapterId === chapter.id && (state.cards[q.id] || state.results[q.id])).length;
  return <button className={`chapter-card chapter-color-${chapter.id}`} onClick={open}>
    <div className="chapter-card-top"><span className="chapter-number">{String(chapter.id).padStart(2, "0")}</span><span>{chapter.count} questions</span><ArrowRight size={18} className="chapter-arrow" /></div>
    <h3>{chapter.title}</h3><p>{chapter.description}</p>
    <Meter value={studied / chapter.count * 100} label={`${chapter.title}: ${studied} of ${chapter.count} studied`} />
    <div className="chapter-card-bottom"><span>{studied ? `${studied} of ${chapter.count} studied` : "A fresh start"}</span><span>{Math.round(studied / chapter.count * 100)}%</span></div>
  </button>;
}

