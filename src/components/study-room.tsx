"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookMarked, BookOpen, Bookmark, ChevronRight, CircleHelp, HardDrive, Layers, LayoutGrid, ListChecks, Menu, Search, ShieldCheck, Sprout, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudy } from "@/lib/store";
import { useQuestionBank, useCertification, certifications, type CertificationId } from "@/lib/certification-context";
import { needsReview as questionNeedsReview, type Question, type StudyState } from "@/lib/study";
import { Flashcards, type FlashcardStart } from "./flashcards";
import { Practice } from "./practice";
import { Progress } from "./progress";
import { Overview } from "./overview";
import { ThemeControl } from "./theme-control";
import { AnswerContent, BookmarkButton, ChapterCard, EmptyState, Exhibit, QuestionBadge } from "./study-parts";

type View = "overview" | "chapters" | "flashcards" | "practice" | "bookmarks" | "progress";
const navigation = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "chapters", label: "Chapters", icon: BookOpen },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "practice", label: "Practice quizzes", icon: ListChecks },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "progress", label: "Your progress", icon: TrendingUp },
] as const;

function readLocation() {
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const view = navigation.find(item => item.id === params.get("view"))?.id ?? "overview";
  const chapter = Number(params.get("chapter")) || 0;
  const chapterId = Number.isInteger(chapter) && chapter >= 0 && chapter <= 7 ? chapter : 0;
  const filter = (["all", "bookmarks", "learning", "known", "unseen"] as const).find(value => value === params.get("filter")) ?? "all";
  return { view, chapterId, start: { chapterId, filter, questionId: params.get("question") ?? undefined } };
}

function writeLocation(view: View, chapterId = 0, start?: FlashcardStart) {
  const url = new URL(window.location.href);
  for (const key of ["view", "chapter", "filter", "question"]) url.searchParams.delete(key);
  if (view !== "overview") url.searchParams.set("view", view);
  if (chapterId) url.searchParams.set("chapter", String(chapterId));
  if (start && start.filter !== "all") url.searchParams.set("filter", start.filter);
  if (start?.questionId) url.searchParams.set("question", start.questionId);
  if (url.href !== window.location.href) window.history.pushState(null, "", url);
}

export function StudyRoom() {
  const { data: state, error, updateStudy } = useStudy();
  const { questions, questionMap, sourceFiles, source, chapters: bankChapters } = useQuestionBank();
  const { certification, selectCertification, loading, loadError } = useCertification();
  const [view, setView] = useState<View>(() => readLocation().view);
  const [chapterId, setChapterId] = useState(() => readLocation().chapterId);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [flashStart, setFlashStart] = useState<FlashcardStart>(() => readLocation().start);
  const [studyKey, setStudyKey] = useState(0);
  const about = useRef<HTMLDialogElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function restore() {
      const next = readLocation();
      setView(next.view); setChapterId(next.chapterId); setFlashStart(next.start);
      setStudyKey(k => k + 1); setMobileMenu(false);
      requestAnimationFrame(() => mainRef.current?.focus());
    }
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    if (!mobileMenu) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () => Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)") ?? []);
    controls()[0]?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setMobileMenu(false); }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && (document.activeElement === first || !sidebarRef.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !sidebarRef.current?.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    const mobile = window.matchMedia("(max-width:760px)");
    function handleResize() { if (!mobile.matches) setMobileMenu(false); }
    mobile.addEventListener("change", handleResize);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", handleKey); mobile.removeEventListener("change", handleResize); previous?.focus(); };
  }, [mobileMenu]);

  function go(next: View) {
    writeLocation(next);
    if (next === "flashcards") { setFlashStart({ chapterId: 0, filter: "all" }); setStudyKey(k => k + 1); }
    if (next === "practice") { setChapterId(0); setStudyKey(k => k + 1); }
    if (next === "chapters") setChapterId(0);
    setView(next); setMobileMenu(false); window.scrollTo({ top: 0 });
    requestAnimationFrame(() => mainRef.current?.focus());
  }
  function study(chapter: number, filter: FlashcardStart["filter"] = "all", questionId?: string) {
    writeLocation("flashcards", chapter, { chapterId: chapter, filter, questionId });
    setFlashStart({ chapterId: chapter, filter, questionId }); setStudyKey(k => k + 1); setView("flashcards"); setMobileMenu(false); window.scrollTo({ top: 0 });
    const first = questionId ? questionMap.get(questionId) : questions.find(q => (!chapter || q.chapterId === chapter) && (filter !== "bookmarks" || state.bookmarks.includes(q.id)) && (filter !== "learning" || questionNeedsReview(q.id, state)) && (filter !== "known" || state.cards[q.id] === "known") && (filter !== "unseen" || (!state.cards[q.id] && !state.results[q.id])));
    if (first) updateStudy(s => ({ ...s, lastStudy: { mode: "flashcards", chapterId: chapter, questionId: first.id } }));
  }
  function practice(chapter: number) { writeLocation("practice", chapter); setChapterId(chapter); setStudyKey(k => k + 1); setView("practice"); window.scrollTo({ top: 0 }); }
  function openChapter(chapter: number) { writeLocation("chapters", chapter); setChapterId(chapter); setView("chapters"); window.scrollTo({ top: 0 }); }

  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a>
    {mobileMenu ? <button className="sidebar-overlay" tabIndex={-1} aria-label="Close navigation" onClick={() => setMobileMenu(false)} /> : null}
    <aside ref={sidebarRef} className={`sidebar ${mobileMenu ? "is-open" : ""}`} role={mobileMenu ? "dialog" : undefined} aria-modal={mobileMenu || undefined} aria-label="Main navigation"><Button variant="ghost" size="icon" className="mobile-toggle drawer-close" aria-label="Close navigation" onClick={() => setMobileMenu(false)}><X size={22} /></Button><a href="#" className="brand" onClick={e => { e.preventDefault(); go("overview"); }}><span className="brand-mark"><BookOpen size={25} strokeWidth={1.7} /></span><span><strong>studyroom<span>·</span></strong><small>MAKE ROOM FOR LEARNING</small></span></a><div className="workspace-label"><span className="workspace-dot" /> A space for your next chapter</div><span className="nav-label">WORKSPACE</span><nav>{navigation.map(item => <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} aria-current={view === item.id ? "page" : undefined} onClick={() => go(item.id)}><item.icon size={19} strokeWidth={1.7} /><span>{item.label}</span>{item.id === "bookmarks" && state.bookmarks.length ? <span className="nav-count">{state.bookmarks.length}</span> : null}{item.id === "overview" && view === "overview" ? <span className="nav-active-dot" /> : null}</button>)}</nav><div className="sidebar-note"><span className="sidebar-note-icon"><Sprout size={25} strokeWidth={1.6} /></span><strong>A little, every day.</strong><p>You don’t have to learn it all at once. Just keep showing up.</p><span className="note-line" /></div><div className="sidebar-bottom"><button className="nav-item" onClick={() => about.current?.showModal()}><CircleHelp size={18} /> About this reviewer</button><div className="local-profile"><span className="profile-avatar"><BookOpen size={17} /></span><div><strong>Your study room</strong><span>Local. Private. Yours.</span></div><HardDrive size={16} /></div></div></aside>
    <div className="main-shell" inert={mobileMenu}><header className="topbar"><div className="inline"><Button variant="ghost" size="icon" className="mobile-toggle" aria-label={mobileMenu ? "Close navigation" : "Open navigation"} aria-expanded={mobileMenu} onClick={() => setMobileMenu(v => !v)}>{mobileMenu ? <X size={22} /> : <Menu size={22} />}</Button><span className="topbar-home">Workspace</span><ChevronRight size={13} /><strong>{navigation.find(n => n.id === view)?.label}</strong></div><div className="topbar-right"><ThemeControl /><span className={`save-status ${error ? "save-error" : ""}`}><span />{error ? "Session only" : "Saved on this device"}</span><label className="certification-picker"><span className="sr-only">Certification</span><select aria-label="Certification" value={certification.id} disabled={loading} onChange={e => selectCertification(e.target.value as CertificationId)}>{certifications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div></header>
    <main id="main-content" ref={mainRef} tabIndex={-1}>
      <div className="certification-heading"><span className="eyebrow">YOUR CERTIFICATION</span><strong>{certification.name}</strong><span>{questions.length} questions · {certification.examCode}</span>{loading ? <span role="status">Loading certification…</span> : null}</div>
      {loadError ? <div className="notice" role="alert">{loadError}</div> : null}
      {error ? <div role="alert" className="storage-warning"><HardDrive size={18} /><p>{error}</p><Button variant="outline" size="sm" onClick={() => go("progress")}>Backups</Button></div> : null}
      {view === "overview" ? <Overview state={state} openChapter={openChapter} study={study} practice={practice} allChapters={() => go("chapters")} /> : null}
      {view === "chapters" ? <ChapterBrowser state={state} chapterId={chapterId} setChapter={openChapter} study={study} practice={practice} /> : null}
      {view === "flashcards" ? <Flashcards key={studyKey} state={state} start={flashStart} practice={practice} /> : null}
      {view === "practice" ? <Practice key={studyKey} state={state} initialChapter={chapterId} flashcards={study} pause={() => go("overview")} /> : null}
      {view === "bookmarks" ? <Bookmarks state={state} study={study} browse={() => go("chapters")} /> : null}
      {view === "progress" ? <Progress state={state} /> : null}
    </main><footer className="site-footer"><span><ShieldCheck size={14} /> An independent certification study companion.</span><span>Less cramming. More understanding.</span></footer></div>
    <dialog ref={about} className="about-dialog" aria-labelledby="about-title"><div className="dialog-top"><span className="brand-mark"><ShieldCheck size={27} /></span><Button variant="ghost" size="icon" aria-label="Close about reviewer" onClick={() => about.current?.close()}><X size={21} /></Button></div><span className="eyebrow">A SPACE TO MAKE IT STICK</span><h2 id="about-title">Your personal study room.</h2><p>You’re studying <strong>{certification.name}</strong>: {questions.length} exercises organized into {bankChapters.length} chapters. Source documents: {(sourceFiles ?? [source]).join("; ")}. Source page references are included with every answer.</p><h3>Read the explanation, too.</h3><p>{questions.some(q => q.review) ? `All ${questions.length} answers have been reviewed for practice. Incorrect keys are corrected, and ambiguous or clipped exercises are adapted with complete wording. Each answer includes an explanation and reference; adaptations are labeled. Existing scores are retained, while new attempts use the reviewed keys. Code is displayed as text and is never executed by this reviewer.` : `Some source questions have overlapping choices, inaccurate marked keys, or incomplete answer diagrams. Notes explain the caveats. Practice uses ${questions.filter(q => q.scorable).length} standard items by default; you can opt into questions with study notes. Items without a complete key stay study-only. Code is displayed as text and is never executed.`}</p><h3>Everything stays on your device.</h3><p>No account or cloud database. Ratings, bookmarks, and results stay in this browser. Export a backup in Your progress to move them to another browser. A saved page is not a guarantee of offline access.</p><p className="small muted">Question numbering and source-page references are retained. Questions, code, statements, and answer choices are selectable text. Source excerpts with numbered blanks use matching controls; clipped or malformed source content is identified in the explanations. The chapter labels organize this reviewer and are not an official exam blueprint. Practice scores are learning feedback.</p><Button onClick={() => about.current?.close()}>Back to studying <ArrowRight size={16} /></Button></dialog>
  </div>;
}

function QuestionList({ items, state, study }: { items: Question[]; state: StudyState; study: (id: number, filter?: FlashcardStart["filter"], questionId?: string) => void }) {
  return <div className="question-list">{items.map(q => <article className="question-preview panel" key={q.id}><div className="question-preview-heading"><span className="eyebrow">QUESTION {String(q.number).padStart(3, "0")}</span><QuestionBadge question={q} />{q.status !== "standard" ? <span className="badge badge-amber">{q.status === "invalid" ? "Study only" : "Study note"}</span> : null}<BookmarkButton question={q} saved={state.bookmarks.includes(q.id)} /></div><h3>{q.prompt}</h3><Exhibit question={q} showPrompts /><div className="question-preview-footer"><span>Chapter {String(q.chapterId).padStart(2, "0")} · Source page {q.sourcePage}</span><Button variant="ghost" size="sm" onClick={() => study(q.chapterId, "all", q.id)}>Study this card <ArrowRight size={15} /></Button></div><details className="answer-preview"><summary>Read answer & explanation</summary><div><AnswerContent question={q} /></div></details></article>)}</div>;
}

function ChapterBrowser({ state, chapterId, setChapter, study, practice }: { state: StudyState; chapterId: number; setChapter: (id: number) => void; study: (id: number, filter?: FlashcardStart["filter"], questionId?: string) => void; practice: (id: number) => void }) {
  const { questions, chapters } = useQuestionBank();
  const [search, setSearch] = useState("");
  const chapter = chapters.find(c => c.id === chapterId);
  const items = questions.filter(q => (!chapterId || q.chapterId === chapterId) && `${q.number} ${q.prompt} ${q.options.map(o => o.text).join(" ")} ${q.explanation} ${q.exhibit} ${q.pairs.map(p => p.left).join(" ")}`.toLowerCase().includes(search.toLowerCase().trim()));
  return <div className="browse-view"><div className="page-heading"><div><span className="eyebrow">{chapters.length} CHAPTERS. A STRONGER FOUNDATION.</span><h1>{chapter ? chapter.title : "Follow your curiosity."}</h1><p>{chapter ? chapter.description : "Explore the topics, or find a concept you’d like to revisit."}</p></div><span className="heading-mark"><BookOpen size={30} /></span></div><div className="browse-toolbar"><label className="search-field"><Search size={18} /><span className="sr-only">Search questions, choices, and explanations</span><input type="search" placeholder="Find a question, topic, or keyword…" value={search} onChange={e => setSearch(e.target.value)} />{search ? <button aria-label="Clear search" onClick={() => setSearch("")}><X size={17} /></button> : <span className="search-label">Search</span>}</label>{chapter ? <div className="button-row"><Button variant="outline" onClick={() => study(chapterId)}><Layers size={16} /> Flashcards</Button><Button onClick={() => practice(chapterId)}>Practice <ArrowRight size={16} /></Button></div> : null}</div>{chapter ? <Button variant="ghost" className="back-link" onClick={() => { setChapter(0); setSearch(""); }}><ArrowLeft size={16} /> All chapters</Button> : null}{!chapterId && !search.trim() ? <div className="chapter-grid full-chapters">{chapters.map(c => <ChapterCard key={c.id} chapter={c} state={state} open={() => setChapter(c.id)} />)}</div> : <><div className="list-heading"><span>{items.length} {items.length === 1 ? "question" : "questions"}{search ? ` matching “${search}”` : " in this chapter"}</span><span>From your source reviewer</span></div>{items.length ? <QuestionList items={items} state={state} study={study} /> : <EmptyState title="No match this time">Try a shorter keyword, or explore another chapter.</EmptyState>}</>}</div>;
}

function Bookmarks({ state, study, browse }: { state: StudyState; study: (id: number, filter?: FlashcardStart["filter"], questionId?: string) => void; browse: () => void }) {
  const { questions } = useQuestionBank();
  const [search, setSearch] = useState("");
  const saved = questions.filter(q => state.bookmarks.includes(q.id));
  const items = saved.filter(q => q.prompt.toLowerCase().includes(search.trim().toLowerCase()));
  return <div><div className="page-heading"><div><span className="eyebrow">SAVE A THOUGHT FOR LATER</span><h1>Your bookmarks.</h1><p>A collection of concepts worth coming back to.</p></div><span className="heading-mark"><BookMarked size={30} /></span></div>{!saved.length ? <EmptyState title="Keep the good questions close." action={<Button onClick={browse}>Explore the chapters <ArrowRight size={16} /></Button>}>Tap the bookmark beside a question or flashcard. It’ll be waiting here when you need it.</EmptyState> : <><div className="browse-toolbar"><label className="search-field"><Search size={18} /><span className="sr-only">Search bookmarks</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a saved question…" /></label><Button onClick={() => study(0, "bookmarks")}><Layers size={16} /> Study {saved.length} saved cards</Button></div><div className="list-heading"><span>{items.length} saved questions</span><span>Your personal collection</span></div>{items.length ? <QuestionList items={items} state={state} study={study} /> : <EmptyState title="No bookmark matches">Try another keyword.</EmptyState>}</>}</div>;
}
