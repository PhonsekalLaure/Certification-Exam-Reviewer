"use client";

import { useRef, useState } from "react";
import { ArrowRight, Check, CheckCircle2, CircleHelp, ListChecks, RotateCcw, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyActions } from "@/lib/store";
import { useQuestionBank } from "@/lib/certification-context";
import { gradeAnswer, isAnswerComplete, practicePool, shuffled, type Question, type StudyState } from "@/lib/study";
import { AnswerContent, BookmarkButton, ChapterSelect, EmptyState, Exhibit, Meter, QuestionBadge } from "./study-parts";

interface QuizItem { question: Question; options: Question["options"]; matchOptions: string[] }
interface Response { question: Question; correct: boolean }

export function Practice({ state, initialChapter, flashcards }: { state: StudyState; initialChapter: number; flashcards: (chapterId: number) => void }) {
  const { questions, chapters } = useQuestionBank();
  const { updateStudy } = useStudyActions();
  const [chapterId, setChapterId] = useState(initialChapter);
  const [count, setCount] = useState("10");
  const [includeNotes, setIncludeNotes] = useState(false);
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [items, setItems] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<boolean | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [finished, setFinished] = useState(false);
  const [active, setActive] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const submittedRef = useRef(false);
  const pool = practicePool(questions, chapterId, includeNotes).filter(q => !mistakesOnly || state.results[q.id]?.lastCorrect === false);
  const item = items[index];
  const correctCount = responses.filter(r => r.correct).length;

  function startQuiz(source = pool) {
    const selectedQuestions = shuffled(source).slice(0, count === "all" ? source.length : Number(count));
    setItems(selectedQuestions.map(question => ({ question, options: shuffled(question.options), matchOptions: shuffled(question.matchOptions ?? [...new Set(question.pairs.map(p => p.right))]) })));
    setIndex(0); setSelected([]); setMatches({}); setChecked(null); setResponses([]); setFinished(false); setActive(true); submittedRef.current = false;
  }
  function checkAnswer() {
    if (checked !== null || submittedRef.current || !isAnswerComplete(item.question, selected, matches)) return;
    submittedRef.current = true;
    const correct = gradeAnswer(item.question, selected, matches);
    setChecked(correct);
    setResponses(r => [...r, { question: item.question, correct }]);
    updateStudy(s => {
      const previous = s.results[item.question.id] ?? { attempts: 0, correct: 0, lastCorrect: false };
      return { ...s, results: { ...s.results, [item.question.id]: { attempts: previous.attempts + 1, correct: previous.correct + Number(correct), lastCorrect: correct } } };
    });
    requestAnimationFrame(() => feedbackRef.current?.focus());
  }
  function next() {
    if (index < items.length - 1) {
      setIndex(i => i + 1); setSelected([]); setMatches({}); setChecked(null); submittedRef.current = false;
      requestAnimationFrame(() => questionRef.current?.focus());
    } else {
      setFinished(true);
      updateStudy(s => ({ ...s, sessions: [{ id: crypto.randomUUID(), date: new Date().toISOString(), total: responses.length, correct: correctCount, questionIds: responses.map(r => r.question.id) }, ...s.sessions].slice(0, 100) }));
    }
  }
  function choose(id: string) {
    if (checked !== null) return;
    if (item.question.type === "single") setSelected([id]);
    else setSelected(previous => previous.includes(id) ? previous.filter(x => x !== id) : [...previous, id]);
  }

  return <div className="study-view">
    <div className="page-heading"><div><span className="eyebrow">UNDERSTAND IT. THEN PUT IT TO WORK.</span><h1>Practice makes progress.</h1><p>{active && !finished ? "No rush. Work through one question at a time." : "A low-pressure check on what’s starting to stick."}</p></div><span className="heading-mark"><ListChecks size={31} /></span></div>
    {!active ? <div className="quiz-setup-grid"><section className="panel quiz-setup"><div className="section-title"><span className="icon-tile"><ListChecks size={21} /></span><div><h2>Make it your session</h2><p>Choose a chapter and a comfortable pace.</p></div></div><div className="form-field"><label htmlFor="quiz-chapter">What would you like to practice?</label><ChapterSelect id="quiz-chapter" value={chapterId} onChange={setChapterId} /></div><fieldset className="count-field"><legend>How many questions?</legend><div className="segmented">{["10", "20", "all"].map(value => <button key={value} aria-pressed={count === value} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value === "all" ? "All available" : value}</button>)}</div></fieldset><label className="check-field"><input type="checkbox" checked={mistakesOnly} onChange={e => setMistakesOnly(e.target.checked)} /><span><strong>Focus on my mistakes</strong><small>Questions you last answered incorrectly.</small></span></label><label className="check-field"><input type="checkbox" checked={includeNotes} onChange={e => setIncludeNotes(e.target.checked)} /><span><strong>Include questions with study notes</strong><small>Add qualified and historical answers, graded against the PDF’s key. Items with no valid choice stay excluded.</small></span></label><div className="setup-footer"><span><strong>{pool.length}</strong> available questions</span><Button onClick={() => startQuiz()} disabled={!pool.length}>Start practice <ArrowRight size={17} /></Button></div>{!pool.length ? <p className="source-note">No questions match these settings. Choose another chapter or turn off the mistakes filter.</p> : null}</section><aside className="quiz-aside"><div className="aside-art"><Target size={66} strokeWidth={1.2} /><span className="art-dot" /></div><span className="eyebrow">UNDERSTANDING OVER MEMORIZING</span><h2>Every answer is a chance to learn.</h2><p>You’ll get an explanation after each question, with context from your reviewer.</p><ul className="check-list"><li><Check size={16} /> Questions and choices are shuffled</li><li><Check size={16} /> No countdown, no pressure</li><li><Check size={16} /> Answers save as you go</li></ul><p className="small muted">Leaving a quiz ends that session. Checked answers remain in your progress.</p><Button variant="ghost" onClick={() => flashcards(chapterId)}>Warm up with flashcards <ArrowRight size={15} /></Button></aside></div> : finished ? <section className="quiz-results"><div className="results-header"><span className="eyebrow">ANOTHER STEP FORWARD</span><h2>Session complete.</h2><div className="score-circle"><strong>{Math.round(correctCount / responses.length * 100)}<span>%</span></strong></div><p><strong>{correctCount} of {responses.length}</strong> answers correct. Your progress is saved.</p><div className="button-row">{correctCount < responses.length ? <Button onClick={() => startQuiz(responses.filter(r => !r.correct).map(r => r.question))}><RotateCcw size={16} /> Retry missed questions</Button> : null}<Button variant="outline" onClick={() => setActive(false)}>New practice session <ArrowRight size={16} /></Button></div></div><h3 className="review-title">Your session, at a glance</h3><div className="result-list">{responses.map(r => <details key={r.question.id}><summary><span className={r.correct ? "result-correct" : "result-wrong"}>{r.correct ? <Check size={17} /> : <X size={17} />}</span><span><small>QUESTION {String(r.question.number).padStart(3, "0")}</small>{r.question.prompt}</span><CircleHelp size={18} /></summary><div className="result-detail"><AnswerContent question={r.question} /></div></details>)}</div></section> : item ? <div className="quiz-session"><div className="deck-position"><span>{chapters.find(c => c.id === item.question.chapterId)?.title}</span><strong>Question {index + 1} <span>of {items.length}</span></strong></div><Meter value={index / items.length * 100} label="Quiz completion" /><section className="quiz-question panel"><div className="flash-card-header"><QuestionBadge question={item.question} /><BookmarkButton question={item.question} saved={state.bookmarks.includes(item.question.id)} /></div><h2 tabIndex={-1} ref={questionRef}>{item.question.prompt}</h2><Exhibit question={item.question} /><p className="answer-instruction">{item.question.type === "matching" ? "Choose a response for every statement or numbered blank. Choices may be reused." : item.question.type === "ordering" ? `Select ${item.question.correctIds.length} items in the correct order. Tap a selected item again to remove it. Some choices may not be used.` : item.question.type === "multiple" ? `Select ${item.question.correctIds.length} answers, then check your response.` : "Choose the best answer."}</p>{includeNotes && item.question.status !== "standard" ? <p className="quiz-context">Study-note item · This is graded against the source key. The explanation provides the necessary context.</p> : null}
      {item.question.type === "matching" ? <div className="match-questions">{item.question.pairs.map(pair => <div key={pair.id} className={checked !== null ? matches[pair.id] === pair.right ? "match-correct" : "match-wrong" : ""}><label htmlFor={`match-${pair.id}`}>{pair.left}</label><select id={`match-${pair.id}`} value={matches[pair.id] ?? ""} disabled={checked !== null} onChange={e => setMatches(previous => ({ ...previous, [pair.id]: e.target.value }))}><option value="">Choose a match…</option>{(pair.options ?? item.matchOptions).map(option => <option key={option} value={option}>{option}</option>)}</select></div>)}</div> : <div className="quiz-options" role="group" aria-label={item.question.type === "ordering" ? "Actions to put in order" : "Answer choices"}>{item.options.map(option => {
        const isSelected = selected.includes(option.id);
        const isRight = item.question.type === "ordering" ? selected.indexOf(option.id) === item.question.correctIds.indexOf(option.id) : item.question.correctIds.includes(option.id);
        const optionClass = checked === null ? isSelected ? "selected" : "" : isRight ? "correct" : isSelected ? "wrong" : "";
        return <button key={option.id} className={`quiz-option ${optionClass}`} aria-pressed={isSelected} disabled={checked !== null} onClick={() => choose(option.id)}><span className="option-letter">{item.question.type === "ordering" ? (isSelected ? selected.indexOf(option.id) + 1 : "+") : option.id.toUpperCase()}</span><span>{option.text}</span>{checked !== null && isRight ? <Check size={19} /> : checked !== null && isSelected ? <X size={19} /> : <span className={`option-indicator ${item.question.type === "multiple" ? "square" : ""}`}>{isSelected ? <Check size={12} /> : null}</span>}</button>;
      })}</div>}
      {item.question.type === "ordering" && selected.length ? <p className="order-preview">Your order: {selected.map(id => item.question.options.find(option => option.id === id)?.text).join(" → ")}</p> : null}
      {checked !== null ? <div className={`quiz-feedback ${checked ? "correct" : "wrong"}`} ref={feedbackRef} tabIndex={-1} role="status"><h3>{checked ? <CheckCircle2 size={22} /> : <CircleHelp size={22} />}{checked ? "You’ve got it." : "A good one to revisit."}</h3><AnswerContent question={item.question} /></div> : null}
      <div className="quiz-actions"><span>{checked !== null ? "Your answer has been saved." : "Think about why, as well as what."}</span>{checked === null ? <Button onClick={checkAnswer} disabled={!isAnswerComplete(item.question, selected, matches)}>Check answer <Check size={16} /></Button> : <Button onClick={next}>{index === items.length - 1 ? "See results" : "Next question"}<ArrowRight size={16} /></Button>}</div></section><Button variant="ghost" onClick={() => setActive(false)}>End session</Button></div> : <EmptyState title="No questions here">Return to setup and choose another chapter.</EmptyState>}
  </div>;
}
