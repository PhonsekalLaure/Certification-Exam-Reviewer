"use client";

import { useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Check, HardDrive, History, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyActions } from "@/lib/store";
import { useQuestionBank, useCertification } from "@/lib/certification-context";
import { EMPTY_STATE, parseStudyState, type StudyState } from "@/lib/study";
import { Meter } from "./study-parts";

export function Progress({ state }: { state: StudyState }) {
  const { questions, chapters } = useQuestionBank();
  const { certification } = useCertification();
  const { updateStudy, importStudy } = useStudyActions();
  const [message, setMessage] = useState("");
  const [pendingImport, setPendingImport] = useState<StudyState | null>(null);
  const [action, setAction] = useState<"reset" | "import">("reset");
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const totals = Object.values(state.results).reduce((sum, r) => ({ attempts: sum.attempts + r.attempts, correct: sum.correct + r.correct }), { attempts: 0, correct: 0 });
  const studied = questions.filter(q => state.cards[q.id] || state.results[q.id]).length;
  const known = Object.values(state.cards).filter(r => r === "known").length;

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `${certification.id}-study-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Backup downloaded. Keep it somewhere safe to restore your progress later.");
  }
  async function readBackup(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("This file is too large to be a study backup.");
      const data = parseStudyState(JSON.parse(await file.text()), new Set(questions.map(q => q.id)), certification.id);
      setPendingImport(data); setAction("import"); dialog.current?.showModal();
    } catch (error) { setMessage(error instanceof SyntaxError ? "This file is not valid JSON. Choose an exported Study Room backup." : error instanceof Error ? error.message : "Could not read this backup."); }
    if (fileInput.current) fileInput.current.value = "";
  }
  function confirmAction() {
    if (action === "import" && pendingImport) { importStudy(pendingImport); setMessage("Backup restored. Your study progress is ready."); }
    else if (action === "reset") { updateStudy(() => ({ ...EMPTY_STATE })); setMessage("Progress cleared. A fresh start is ready when you are."); }
    setPendingImport(null); dialog.current?.close();
  }

  return <div className="progress-view"><div className="page-heading"><div><span className="eyebrow">SMALL STEPS ADD UP</span><h1>Look how far you’ve come.</h1><p>Your effort, chapter by chapter. Saved right here on this device.</p></div><span className="heading-mark"><History size={30} /></span></div>
    <div className="stats-grid progress-stats"><div><span>Questions studied</span><strong>{studied}<small> / {questions.length}</small></strong><p>Flashcards rated or answers checked</p></div><div><span>Practice accuracy</span><strong>{totals.attempts ? Math.round(totals.correct / totals.attempts * 100) : 0}<small>%</small></strong><p>{totals.correct} correct across {totals.attempts} answers</p></div><div><span>Feeling confident</span><strong>{known}<small> cards</small></strong><p>Flashcards you’ve marked “Got it”</p></div></div>
    <section className="panel chapter-progress"><div className="section-heading"><div><h2>Your chapter map</h2><p>A question counts as studied after a rating or checked answer.</p></div><span className="badge badge-green">{Math.round(studied / questions.length * 100)}% explored</span></div>{chapters.map(chapter => {
      const chapterQuestions = questions.filter(q => q.chapterId === chapter.id);
      const reviewed = chapterQuestions.filter(q => state.cards[q.id] || state.results[q.id]).length;
      const confident = chapterQuestions.filter(q => state.cards[q.id] === "known").length;
      return <div key={chapter.id} className="chapter-progress-row"><span className={`chapter-number chapter-color-${chapter.id}`}>{String(chapter.id).padStart(2, "0")}</span><div><h3>{chapter.title}</h3><span>{reviewed} / {chapter.count} studied · {confident} confident</span></div><Meter label={`${chapter.title}: study progress`} value={reviewed / chapter.count * 100} /><strong>{Math.round(reviewed / chapter.count * 100)}%</strong></div>;
    })}</section>
    <div className="progress-bottom"><section className="panel session-history"><div className="section-heading"><div><h2>Recent practice</h2><p>Your last completed sessions.</p></div><History size={20} /></div>{state.sessions.length ? state.sessions.slice(0, 8).map(session => <div className="history-row" key={session.id}><span className="history-icon"><Check size={17} /></span><div><strong>{session.total}-question practice</strong><span>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(session.date))}</span></div><strong>{session.correct}/{session.total}</strong><span className="badge badge-neutral">{Math.round(session.correct / session.total * 100)}%</span></div>) : <div className="history-empty"><History size={28} /><h3>Your first session is ahead.</h3><p>Complete a practice quiz to start your history.</p></div>}</section><section className="panel backup-panel"><span className="icon-tile"><HardDrive size={22} /></span><h2>Your progress belongs to you.</h2><p>Bookmarks, ratings, and quiz results are saved in this browser. They won’t sync to other devices. Export a backup before clearing browser data or switching devices.</p><div className="button-row"><Button variant="outline" onClick={exportBackup}><ArrowDownToLine size={16} /> Export backup</Button><Button variant="ghost" onClick={() => fileInput.current?.click()}><ArrowUpFromLine size={16} /> Import</Button></div><input ref={fileInput} aria-label="Choose a study backup" type="file" accept=".json,application/json" hidden onChange={e => void readBackup(e.target.files?.[0])} /><div className="reset-area"><Button variant="ghost" className="text-danger" onClick={() => { setAction("reset"); dialog.current?.showModal(); }}><Trash2 size={15} /> Reset all progress</Button></div></section></div>
    {message ? <div role="status" className="notice">{message}<Button variant="ghost" size="icon" aria-label="Dismiss message" onClick={() => setMessage("")}><X size={16} /></Button></div> : null}
    <dialog ref={dialog} className="confirm-dialog" aria-labelledby="confirm-title"><div className="dialog-top"><span className="icon-tile"><HardDrive size={23} /></span><Button variant="ghost" size="icon" aria-label="Close confirmation" onClick={() => dialog.current?.close()}><X size={20} /></Button></div><h2 id="confirm-title">{action === "reset" ? "Start with a clean slate?" : "Restore this backup?"}</h2><p>{action === "reset" ? "This clears bookmarks, flashcard ratings, and practice history for the current certification in this browser. Export a backup first if you want to keep them." : "This replaces the current certification’s study progress with the selected backup. Other certifications are kept."}</p><div className="button-row"><Button variant="outline" onClick={() => dialog.current?.close()}>Keep current progress</Button><Button variant={action === "reset" ? "danger" : "default"} onClick={confirmAction}>{action === "reset" ? "Clear progress" : "Restore backup"}</Button></div></dialog>
  </div>;
}
