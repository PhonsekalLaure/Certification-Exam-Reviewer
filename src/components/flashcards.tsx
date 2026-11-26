"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyActions } from "@/lib/store";
import { useQuestionBank } from "@/lib/certification-context";
import { gradeAnswer, isAnswerComplete, recordAnswer, shuffled, type StudyState, type CardRating, type Question } from "@/lib/study";
import { AnswerChoices, AnswerInstruction } from "./answer-choices";
import { LearningCounter } from "./learning-counter";
import { AnswerContent, BookmarkButton, ChapterSelect, EmptyState, Exhibit, QuestionBadge } from "./study-parts";

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
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const submittedRef = useRef(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const current = deck[index];
  const canAnswer = current && current.status !== "invalid" && (current.type === "single" || current.type === "multiple");
  const correctCount = deck.filter(q => state.results[q.id]?.lastCorrect === true).length;
  const learningCount = deck.filter(q => state.results[q.id]?.lastCorrect === false).length;

  const clearAnswer = useCallback(() => {
    setSelected([]); setChecked(null); submittedRef.current = false;
  }, []);
  function choose(id: string) {
    if (checked !== null || submittedRef.current) return;
    setSelected(previous => current.type === "single" ? [id] : previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
  }
  function submitAnswer() {
    if (!canAnswer || flipped || checked !== null || submittedRef.current || !isAnswerComplete(current, selected, {})) return;
    submittedRef.current = true;
    const correct = gradeAnswer(current, selected, {});
    setChecked(correct);
    updateStudy(s => ({ ...recordAnswer(s, current.id, correct), cards: { ...s.cards, [current.id]: correct ? "known" : "learning" } }));
    requestAnimationFrame(() => feedbackRef.current?.focus());
  }

  const move = useCallback((nextIndex: number) => {
    const next = deck[nextIndex];
    if (!next) return;
    setIndex(nextIndex); setFlipped(false); clearAnswer();
    updateStudy(s => ({ ...s, lastStudy: { mode: "flashcards", chapterId, questionId: next.id } }));
    requestAnimationFrame(() => questionRef.current?.focus());
  }, [deck, chapterId, clearAnswer, updateStudy]);
  function selectDeck(nextChapter: number, nextFilter: Filter) {
    const nextDeck = makeDeck(questions, nextChapter, nextFilter, state);
    setChapterId(nextChapter); setFilter(nextFilter); setDeck(nextDeck); setIndex(0); setFlipped(false); setFinished(false); clearAnswer();
    if (nextDeck[0]) updateStudy(s => ({ ...s, lastStudy: { mode: "flashcards", chapterId: nextChapter, questionId: nextDeck[0].id } }));
  }
  function shuffleDeck() {
    const nextDeck = shuffled(deck);
    setDeck(nextDeck); setIndex(0); setFlipped(false); setFinished(false); clearAnswer();
    if (nextDeck[0]) updateStudy(s => ({ ...s, lastStudy: { mode: "flashcards", chapterId, questionId: nextDeck[0].id } }));
  }
  function rate(rating: CardRating) {
    updateStudy(s => ({ ...s, cards: { ...s.cards, [current.id]: rating }, lastStudy: { mode: "flashcards", chapterId, questionId: deck[Math.min(index + 1, deck.length - 1)].id } }));
    if (index === deck.length - 1) setFinished(true); else move(index + 1);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.target as HTMLElement).closest("input, select, textarea, button, a, dialog") || event.altKey || event.ctrlKey || event.metaKey) return;
      if (finished || !current) return;
      if (event.key === " " && !canAnswer) { event.preventDefault(); setFlipped(f => !f); }
      const nextIndex = event.key === "ArrowLeft" ? index - 1 : event.key === "ArrowRight" ? index + 1 : -1;
      if (nextIndex >= 0 && nextIndex < deck.length) {
        event.preventDefault();
        move(nextIndex);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, index, deck.length, finished, canAnswer, move]);

  return <div className="study-view">
    <div className="page-heading"><div><span className="eyebrow">A LITTLE RECALL GOES A LONG WAY</span><h1>Flashcards</h1><p>Choose an answer, submit it, and learn from the explanation.</p></div><span className="heading-mark"><Sparkles size={30} /></span></div>
    <div className="filter-bar"><div><label htmlFor="flash-chapter">Chapter</label><ChapterSelect id="flash-chapter" value={chapterId} onChange={id => selectDeck(id, filter)} /></div><div><label htmlFor="card-filter">Show cards</label><select id="card-filter" value={filter} onChange={e => selectDeck(chapterId, e.target.value as Filter)}><option value="all">All cards</option><option value="bookmarks">Bookmarked</option><option value="learning">Still learning</option><option value="known">Got it</option><option value="unseen">Not studied yet</option></select></div><Button variant="outline" onClick={shuffleDeck} disabled={!deck.length}><Shuffle size={16} /> Shuffle</Button></div>
    {deck.length ? <><LearningCounter correct={correctCount} learning={learningCount} total={deck.length} scope="This deck" /><p className="counter-note">Based on your latest submitted answer to each question. Revealing an answer does not change these counts.</p></> : null}
    {!current ? <EmptyState title="A clean slate">There are no cards in this selection. Try another chapter or save a bookmark.<Button variant="outline" onClick={() => selectDeck(0, "all")}>Show all cards</Button></EmptyState> : finished ? <div className="session-complete"><div className="complete-icon"><Check size={34} /></div><span className="eyebrow">THAT’S A WRAP</span><h2>A little more confident.</h2><p>You reached the end of this {deck.length}-card deck. Your answers and ratings are saved.</p><div className="button-row"><Button onClick={() => { setFinished(false); move(0); }}><RotateCcw size={16} /> Review again</Button><Button variant="outline" onClick={() => practice(chapterId)}>Try a practice quiz <ArrowRight size={16} /></Button></div><Button variant="ghost" onClick={() => { setFinished(false); setFlipped(true); }}>Back to the last answer</Button></div> : <>
      <div className="deck-position"><span>{chapters.find(c => c.id === current.chapterId)?.title}</span><strong>{index + 1} <span>/ {deck.length}</span></strong></div>
      <section className={`flash-card ${flipped ? "is-flipped" : ""}`} aria-label={`Flashcard ${index + 1} of ${deck.length}`}>
        <div className="flash-card-header"><span className="eyebrow">QUESTION {String(current.number).padStart(3, "0")}</span><div className="inline"><QuestionBadge question={current} /><BookmarkButton question={current} saved={state.bookmarks.includes(current.id)} /></div></div>
        {flipped ? <div className="flash-answer" key={`${current.id}-back`}><AnswerContent question={current} /><Button variant="ghost" onClick={() => setFlipped(false)}><RotateCcw size={15} /> Show question</Button></div> : <div className={`flash-front ${canAnswer ? "flash-interactive" : ""}`} key={`${current.id}-front`}>
          <h2 ref={questionRef} tabIndex={-1}>{current.prompt}</h2>
          <Exhibit question={current} showPrompts />
          {canAnswer ? <>
            <AnswerInstruction question={current} />
            <AnswerChoices question={current} selected={selected} checked={checked} choose={choose} />
            {checked !== null ? <div className={`quiz-feedback ${checked ? "correct" : "wrong"}`} ref={feedbackRef} tabIndex={-1} role="status">
              <h3>{checked ? <CheckCircle2 size={22} aria-hidden="true" /> : <CircleHelp size={22} aria-hidden="true" />}{checked ? "Correct. You’ve got it!" : "Not quite. Let’s learn this one."}</h3>
              <AnswerContent question={current} />
            </div> : <div className="flash-submit-row"><Button onClick={submitAnswer} disabled={!selected.length}>Submit answer <Check size={16} /></Button><Button variant="ghost" onClick={() => setFlipped(true)}>Reveal answer</Button><span>Select {current.type === "multiple" ? current.correctIds.length + " answers" : "one answer"} to submit.</span></div>}
          </> : <>
            {current.options.length ? <div className="flash-options">{current.options.map(o => <p key={o.id}><span>{current.type === "ordering" ? "•" : o.id.toUpperCase()}</span>{o.text}</p>)}</div> : <p className="muted">Read the exercise, recall your answer, then reveal it to check yourself.</p>}
            <Button variant="secondary" onClick={() => setFlipped(true)}><RotateCcw size={16} /> Reveal answer</Button><span className="keyboard-hint">or press <kbd>space</kbd> when no control is focused</span>
          </>}
        </div>}
        <div className="flash-card-footer"><span>{checked !== null ? "Answer saved. Continue when you’re ready." : flipped ? "How well did you know this one?" : canAnswer ? "Your answer is checked only when you submit." : "Take a moment before you reveal."}</span>{state.cards[current.id] ? <span className={`rating-tag ${state.cards[current.id]}`}>{state.cards[current.id] === "known" ? "Got it" : "Still learning"}</span> : <span>Not rated yet</span>}</div>
      </section>
      <div className="flash-controls"><Button variant="outline" size="icon" aria-label="Previous card" disabled={index === 0} onClick={() => move(index - 1)}><ChevronLeft size={20} /></Button>
        {checked !== null ? <Button onClick={() => index === deck.length - 1 ? setFinished(true) : move(index + 1)}>{index === deck.length - 1 ? "Finish deck" : "Next card"}<ArrowRight size={17} /></Button> : canAnswer && !flipped ? <span className="browse-hint">Choose an answer above, or skip with the arrows.</span> : <div className="rating-controls"><Button variant="outline" disabled={!flipped} onClick={() => rate("learning")}><RotateCcw size={16} /> Still learning</Button><Button disabled={!flipped} onClick={() => rate("known")}><Check size={18} /> Got it</Button></div>}
        <Button variant="outline" size="icon" aria-label="Next card" disabled={index === deck.length - 1} onClick={() => move(index + 1)}><ChevronRight size={20} /></Button>
      </div>
      <p className="center-note">{canAnswer ? "Submitted answers save automatically. Use the arrows to skip or revisit a question." : "Reveal the answer, then rate your understanding. Use the arrows to browse."}</p>
    </>}
    <Button variant="ghost" onClick={() => selectDeck(0, "all")} className="back-link"><ArrowLeft size={15} /> All flashcards</Button>
  </div>;
}
