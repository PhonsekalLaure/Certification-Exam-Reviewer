"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyActions } from "@/lib/store";
import { useQuestionBank } from "@/lib/certification-context";
import { shuffled, type StudyState, type CardRating, type Question } from "@/lib/study";
import { AnswerContent, BookmarkButton, ChapterSelect, EmptyState, Exhibit, Meter, QuestionBadge } from "./study-parts";

type Filter = "all" | "bookmarks" | "learning" | "known" | "unseen";
export interface FlashcardStart { chapterId: number; filter: Filter; questionId?: string }

function makeDeck(questions: Question[], chapterId: number, filter: Filter, state: StudyState) {
  return questions.filter(q => (!chapterId || q.chapterId === chapterId) && (filter === "all" || (filter === "bookmarks" && state.bookmarks.includes(q.id)) || (filter === "learning" && state.cards[q.id] === "learning") || (filter === "known" && state.cards[q.id] === "known") || (filter === "unseen" && !state.cards[q.id] && !state.results[q.id])));
}

export function Flashcards({ state, start, practice }: { state: StudyState; start: FlashcardStart; practice: (chapterId: number) => void }) {
  const { questions, chapters } = useQuestionBank();
  const { updateStudy } = useStudyActions();
  const [chapterId, setChapterId] = useState(start.chapterId);
  const [filter, setFilter] = useState<Filter>(start.filter);
  const [deck, setDeck] = useState(() => makeDeck(questions, start.chapterId, start.filter, state));
  const [index, setIndex] = useState(() => Math.max(0, makeDeck(questions, start.chapterId, start.filter, state).findIndex(q => q.id === start.questionId)));
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const current = deck[index];

  function move(nextIndex: number) {
    setIndex(nextIndex); setFlipped(false);
    const next = deck[nextIndex];
    if (next) updateStudy(s => ({ ...s, lastStudy: { mode: "flashcards", chapterId, questionId: next.id } }));
  }
  function selectDeck(nextChapter: number, nextFilter: Filter) {
    const nextDeck = makeDeck(questions, nextChapter, nextFilter, state);
    setChapterId(nextChapter); setFilter(nextFilter); setDeck(nextDeck); setIndex(0); setFlipped(false); setFinished(false);
    if (nextDeck[0]) updateStudy(s => ({ ...s, lastStudy: { mode: "flashcards", chapterId: nextChapter, questionId: nextDeck[0].id } }));
  }
  function rate(rating: CardRating) {
    updateStudy(s => ({ ...s, cards: { ...s.cards, [current.id]: rating }, lastStudy: { mode: "flashcards", chapterId, questionId: deck[Math.min(index + 1, deck.length - 1)].id } }));
    if (index === deck.length - 1) setFinished(true); else move(index + 1);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.target as HTMLElement).closest("input, select, textarea, button, a, dialog") || event.altKey || event.ctrlKey || event.metaKey) return;
      if (finished) return;
      if (event.key === " " && current && !finished) { event.preventDefault(); setFlipped(f => !f); }
      const nextIndex = event.key === "ArrowLeft" ? index - 1 : event.key === "ArrowRight" ? index + 1 : -1;
      if (nextIndex >= 0 && nextIndex < deck.length) {
        setIndex(nextIndex); setFlipped(false);
        updateStudy(s => ({ ...s, lastStudy: { mode: "flashcards", chapterId, questionId: deck[nextIndex].id } }));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, index, deck, chapterId, finished, updateStudy]);

  return <div className="study-view">
    <div className="page-heading"><div><span className="eyebrow">A LITTLE RECALL GOES A LONG WAY</span><h1>Flashcards</h1><p>Think it through. Turn it over. Make it stick.</p></div><span className="heading-mark"><Sparkles size={30} /></span></div>
    <div className="filter-bar"><div><label htmlFor="flash-chapter">Chapter</label><ChapterSelect id="flash-chapter" value={chapterId} onChange={id => selectDeck(id, filter)} /></div><div><label htmlFor="card-filter">Show cards</label><select id="card-filter" value={filter} onChange={e => selectDeck(chapterId, e.target.value as Filter)}><option value="all">All cards</option><option value="bookmarks">Bookmarked</option><option value="learning">Still learning</option><option value="known">Got it</option><option value="unseen">Not studied yet</option></select></div><Button variant="outline" onClick={() => { setDeck(shuffled(deck)); setIndex(0); setFlipped(false); setFinished(false); }} disabled={!deck.length}><Shuffle size={16} /> Shuffle</Button></div>
    {!current ? <EmptyState title="A clean slate">There are no cards in this selection. Try another chapter or save a bookmark.<Button variant="outline" onClick={() => selectDeck(0, "all")}>Show all cards</Button></EmptyState> : finished ? <div className="session-complete"><div className="complete-icon"><Check size={34} /></div><span className="eyebrow">THAT’S A WRAP</span><h2>A little more confident.</h2><p>You reached the end of this {deck.length}-card deck. Your ratings are saved.</p><div className="button-row"><Button onClick={() => { setFinished(false); move(0); }}><RotateCcw size={16} /> Review again</Button><Button variant="outline" onClick={() => practice(chapterId)}>Try a practice quiz <ArrowRight size={16} /></Button></div><Button variant="ghost" onClick={() => { setFinished(false); setFlipped(true); }}>Back to the last answer</Button></div> : <>
      <div className="deck-position"><span>{chapters.find(c => c.id === current.chapterId)?.title}</span><strong>{index + 1} <span>/ {deck.length}</span></strong></div>
      <Meter value={(index + 1) / deck.length * 100} label="Position in flashcard deck" />
      <section className={`flash-card ${flipped ? "is-flipped" : ""}`} aria-label={`Flashcard ${index + 1} of ${deck.length}`}>
        <div className="flash-card-header"><span className="eyebrow">QUESTION {String(current.number).padStart(3, "0")}</span><div className="inline"><QuestionBadge question={current} /><BookmarkButton question={current} saved={state.bookmarks.includes(current.id)} /></div></div>
        {flipped ? <div className="flash-answer" key={`${current.id}-back`}><AnswerContent question={current} /><Button variant="ghost" onClick={() => setFlipped(false)}><RotateCcw size={15} /> Show question</Button></div> : <div className="flash-front" key={`${current.id}-front`}><h2>{current.prompt}</h2><Exhibit question={current} showPrompts />{current.options.length ? <div className="flash-options">{current.options.map(o => <p key={o.id}><span>{current.type === "ordering" ? "•" : o.id.toUpperCase()}</span>{o.text}</p>)}</div> : <p className="muted">Read the exercise, recall your answer, then reveal it to check yourself.</p>}<Button variant="secondary" onClick={() => setFlipped(true)}><RotateCcw size={16} /> Reveal answer</Button><span className="keyboard-hint">or press <kbd>space</kbd> when no control is focused</span></div>}
        <div className="flash-card-footer"><span>{flipped ? "How well did you know this one?" : "Take a moment before you reveal."}</span>{state.cards[current.id] ? <span className={`rating-tag ${state.cards[current.id]}`}>{state.cards[current.id] === "known" ? "Got it" : "Still learning"}</span> : <span>Not rated yet</span>}</div>
      </section>
      <div className="flash-controls"><Button variant="outline" size="icon" aria-label="Previous card" disabled={index === 0} onClick={() => move(index - 1)}><ChevronLeft size={20} /></Button><div className="rating-controls"><Button variant="outline" disabled={!flipped} onClick={() => rate("learning")}><RotateCcw size={16} /> Still learning</Button><Button disabled={!flipped} onClick={() => rate("known")}><Check size={18} /> Got it</Button></div><Button variant="outline" size="icon" aria-label="Next card" disabled={index === deck.length - 1} onClick={() => move(index + 1)}><ChevronRight size={20} /></Button></div>
      <p className="center-note">Rate a card to save your progress. Use the arrows to browse without changing a rating.</p>
    </>}
    <Button variant="ghost" onClick={() => selectDeck(0, "all")} className="back-link"><ArrowLeft size={15} /> All flashcards</Button>
  </div>;
}
