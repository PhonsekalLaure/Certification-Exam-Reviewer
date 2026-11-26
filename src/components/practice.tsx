"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleHelp, Flag, ListChecks, Pause, RotateCcw, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyActions } from "@/lib/store";
import { useQuestionBank } from "@/lib/certification-context";
import { completePractice, gradeAnswer, isCorrectMatch, isAnswerComplete, needsReview, practicePool, recordAnswer, shuffled, type PracticeAnswer, type PracticeDraft, type PracticeSession, type Question, type StudyState } from "@/lib/study";
import { AnswerChoices, AnswerInstruction } from "./answer-choices";
import { LearningCounter } from "./learning-counter";
import { AnswerContent, BookmarkButton, ChapterSelect, EmptyState, Exhibit, QuestionBadge } from "./study-parts";

const blankAnswer: PracticeAnswer = { selected: [], matches: {}, submitted: false };

export function Practice({ state, initialChapter, flashcards, pause }: { state: StudyState; initialChapter: number; flashcards: (chapterId: number) => void; pause: () => void }) {
  const { questions, chapters, questionMap } = useQuestionBank();
  const { updateStudy } = useStudyActions();
  const [chapterId, setChapterId] = useState(initialChapter);
  const [count, setCount] = useState("10");
  const [includeNotes, setIncludeNotes] = useState(false);
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [mode, setMode] = useState<"learn" | "test">("learn");
  const [finishedId, setFinishedId] = useState<string | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const finishDialog = useRef<HTMLDialogElement>(null);
  const discardDialog = useRef<HTMLDialogElement>(null);
  const pool = practicePool(questions, chapterId, includeNotes).filter(q => !mistakesOnly || needsReview(q.id, state));
  const draft = state.activePractice;
  const session = state.sessions.find(s => s.id === finishedId);
  const item = draft?.items[draft.index];
  const question = item && questionMap.get(item.questionId);
  const answer = question && draft ? draft.answers[question.id] ?? blankAnswer : blankAnswer;
  const checked = draft?.mode === "learn" && answer.submitted ? answer.correct ?? (question ? gradeAnswer(question, answer.selected, answer.matches) : false) : null;
  const submitted = draft ? Object.values(draft.answers).filter(a => a.submitted).length : 0;
  const correctCount = draft ? Object.values(draft.answers).filter(a => a.submitted && a.correct).length : 0;

  function updateDraft(update: (draft: PracticeDraft) => PracticeDraft) {
    const id = draft?.id;
    updateStudy(s => s.activePractice?.id === id && s.activePractice ? { ...s, activePractice: update(s.activePractice) } : s);
  }
  function startQuiz(source = pool, retry = false) {
    const selectedQuestions = shuffled(source).slice(0, retry || count === "all" ? source.length : Number(count));
    if (!selectedQuestions.length) return;
    const activePractice: PracticeDraft = {
      id: crypto.randomUUID(), chapterId, mode, includeNotes, index: 0, answers: {}, flagged: [],
      items: selectedQuestions.map(q => ({ questionId: q.id, optionIds: (q.type === "ordering" ? shuffled(q.options) : q.options).map(o => o.id), matchOptions: shuffled(q.matchOptions ?? [...new Set(q.pairs.map(p => p.right))]) })),
    };
    updateStudy(s => ({ ...s, activePractice }));
    setFinishedId(null);
    requestAnimationFrame(() => questionRef.current?.focus());
  }
  function saveAnswer() {
    if (!draft || !question || checked !== null || !isAnswerComplete(question, answer.selected, answer.matches)) return;
    const id = draft.id;
    updateStudy(s => {
      const current = s.activePractice;
      if (!current || current.id !== id) return s;
      const saved = current.answers[question.id] ?? blankAnswer;
      if (saved.submitted || !isAnswerComplete(question, saved.selected, saved.matches)) return s;
      const correct = gradeAnswer(question, saved.selected, saved.matches);
      const next = current.mode === "learn" ? recordAnswer(s, question.id, correct) : s;
      return { ...next, activePractice: { ...current, answers: { ...current.answers, [question.id]: { ...saved, submitted: true, ...(current.mode === "learn" ? { correct } : {}) } } } };
    });
    if (draft.mode === "learn") requestAnimationFrame(() => feedbackRef.current?.focus());
  }
  function changeAnswer(change: (previous: PracticeAnswer) => PracticeAnswer) {
    if (!question || checked !== null) return;
    updateDraft(d => ({ ...d, answers: { ...d.answers, [question.id]: { ...change(d.answers[question.id] ?? blankAnswer), submitted: false } } }));
  }
  function choose(id: string) {
    if (!question) return;
    changeAnswer(previous => ({ ...previous, selected: question.type === "single" ? [id] : previous.selected.includes(id) ? previous.selected.filter(x => x !== id) : [...previous.selected, id] }));
  }
  function move(index: number) {
    updateDraft(d => ({ ...d, index: Math.max(0, Math.min(index, d.items.length - 1)) }));
    requestAnimationFrame(() => questionRef.current?.focus());
  }
  function finish() {
    if (!draft) return;
    const id = draft.id;
    updateStudy(s => completePractice(s, id, questions, new Date().toISOString()));
    finishDialog.current?.close();
    setFinishedId(id);
    requestAnimationFrame(() => resultsRef.current?.focus());
  }
  function requestFinish() {
    if (draft && (submitted < draft.items.length || draft.flagged.length)) finishDialog.current?.showModal();
    else finish();
  }

  return <div className="study-view">
    <div className="page-heading"><div><span className="eyebrow">UNDERSTAND IT. THEN PUT IT TO WORK.</span><h1>Practice makes progress.</h1><p>{draft ? (draft.mode === "test" ? "Test mode · Feedback appears at the end." : "Learn mode · Explanations after each answer.") + " Your session saves as you go." : "A low-pressure check on what’s starting to stick."}</p></div><span className="heading-mark"><ListChecks size={31} /></span></div>
    {session ? <SessionResults session={session} questionMap={questionMap} headingRef={resultsRef} retry={source => startQuiz(source, true)} newSession={() => setFinishedId(null)} /> : !draft ? <div className="quiz-setup-grid"><section className="panel quiz-setup"><div className="section-title"><span className="icon-tile"><ListChecks size={21} /></span><div><h2>Make it your session</h2><p>Choose a chapter and a comfortable pace.</p></div></div>
      <div className="form-field"><label htmlFor="quiz-chapter">What would you like to practice?</label><ChapterSelect id="quiz-chapter" value={chapterId} onChange={setChapterId} /></div>
      <fieldset className="count-field"><legend>How many questions?</legend><div className="segmented">{["10", "20", "all"].map(value => <button key={value} aria-pressed={count === value} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value === "all" ? "All available" : value}</button>)}</div></fieldset>
      <fieldset className="count-field"><legend>When should answers appear?</legend><div className="segmented">{(["learn", "test"] as const).map(value => <button key={value} aria-pressed={mode === value} className={mode === value ? "active" : ""} onClick={() => setMode(value)}>{value === "learn" ? "After each answer" : "At the end"}</button>)}</div><p className="field-help">{mode === "learn" ? "Learn mode: check an answer, then read its explanation." : "Test mode: save and revise answers freely. Results appear when you finish."}</p></fieldset>
      <label className="check-field"><input type="checkbox" checked={mistakesOnly} onChange={e => setMistakesOnly(e.target.checked)} /><span><strong>Focus on needs review</strong><small>Missed answers and cards you’ve marked “Still learning”.</small></span></label>
      {questions.some(q => !q.scorable && q.status !== "invalid") ? <label className="check-field"><input type="checkbox" checked={includeNotes} onChange={e => setIncludeNotes(e.target.checked)} /><span><strong>Include questions with study notes</strong><small>Add qualified and historical answers. Their explanations identify source-key caveats; items without a valid key stay excluded.</small></span></label> : null}
      <div className="setup-footer"><span><strong>{Math.min(pool.length, count === "all" ? pool.length : Number(count))}</strong> questions this session · {pool.length} available</span><Button onClick={() => startQuiz()} disabled={!pool.length}>Start practice <ArrowRight size={17} /></Button></div>{!pool.length ? <p className="source-note">No questions match these settings. Choose another chapter or turn off the review filter.</p> : null}
    </section><aside className="quiz-aside"><div className="aside-art"><Target size={66} strokeWidth={1.2} /></div><span className="eyebrow">UNDERSTANDING OVER MEMORIZING</span><h2>Study at your own pace.</h2><p>Skip a question, flag it for review, or use the navigator to revisit it. Your question order, answers, and position stay saved in this browser.</p><ul className="check-list"><li><Check size={16} /> Learn now or check answers at the end</li><li><Check size={16} /> No countdown, no pressure</li><li><Check size={16} /> Pause and resume whenever you need</li></ul><Button variant="ghost" onClick={() => flashcards(chapterId)}>Warm up with flashcards <ArrowRight size={15} /></Button></aside></div> : question && item ? <div className="quiz-session">
      <div className="deck-position"><span>{chapters.find(c => c.id === question.chapterId)?.title}</span><strong>Question {draft.index + 1} <span>of {draft.items.length}</span></strong></div>
      {draft.mode === "learn" ? <LearningCounter correct={correctCount} learning={submitted - correctCount} total={draft.items.length} scope="This practice session" /> : <div className="notice" role="status">{submitted} of {draft.items.length} answers saved. Feedback stays hidden until you finish.</div>}
      <details className="question-navigator panel" open={draft.items.length <= 20}><summary>Question navigator · {submitted} answered · {draft.flagged.length} flagged</summary><p>✓ Answered · ⚑ Flagged · Empty numbers still need an answer</p><div>{draft.items.map((entry, index) => <button key={entry.questionId} className={(draft.answers[entry.questionId]?.submitted ? "is-answered " : "") + (draft.flagged.includes(entry.questionId) ? "is-flagged" : "")} aria-current={index === draft.index ? "step" : undefined} aria-label={"Question " + (index + 1) + ", " + (draft.answers[entry.questionId]?.submitted ? "answered" : "unanswered") + (draft.flagged.includes(entry.questionId) ? ", flagged" : "")} onClick={() => move(index)}>{index + 1}{draft.answers[entry.questionId]?.submitted ? <Check size={12} aria-hidden="true" /> : null}{draft.flagged.includes(entry.questionId) ? <Flag size={12} aria-hidden="true" /> : null}</button>)}</div></details>
      <section className="quiz-question panel"><div className="flash-card-header"><QuestionBadge question={question} /><div className="button-row"><Button variant="ghost" size="sm" aria-pressed={draft.flagged.includes(question.id)} onClick={() => updateDraft(d => ({ ...d, flagged: d.flagged.includes(question.id) ? d.flagged.filter(id => id !== question.id) : [...d.flagged, question.id] }))}><Flag size={16} />{draft.flagged.includes(question.id) ? "Flagged for review" : "Flag for review"}</Button><BookmarkButton question={question} saved={state.bookmarks.includes(question.id)} /></div></div>
        <h2 key={question.id} tabIndex={-1} ref={questionRef}>{question.prompt}</h2><Exhibit question={question} /><AnswerInstruction question={question} />
        {draft.includeNotes && question.status !== "standard" ? <p className="quiz-context">Study-note item · This is graded against the source key. The explanation provides the necessary context.</p> : null}
        {question.type === "matching" ? <div className="match-questions">{question.pairs.map(pair => <div key={pair.id} className={checked !== null ? isCorrectMatch(pair, answer.matches[pair.id]) ? "match-correct" : "match-wrong" : ""}><label htmlFor={"match-" + pair.id}>{pair.left}</label><select id={"match-" + pair.id} value={answer.matches[pair.id] ?? ""} disabled={checked !== null} onChange={e => { const value = e.target.value; changeAnswer(previous => ({ ...previous, matches: { ...previous.matches, [pair.id]: value } })); }}><option value="">Choose a match…</option>{(pair.options ?? item.matchOptions).map(option => <option key={option} value={option}>{option}</option>)}</select></div>)}</div> : <AnswerChoices question={question} options={item.optionIds.map(id => question.options.find(o => o.id === id)).filter((o): o is Question["options"][number] => Boolean(o))} selected={answer.selected} checked={checked} choose={choose} />}
        {question.type === "ordering" && answer.selected.length ? <p className="order-preview">Your order: {answer.selected.map(id => question.options.find(option => option.id === id)?.text).join(" → ")}</p> : null}
        {checked !== null ? <div className={"quiz-feedback " + (checked ? "correct" : "wrong")} ref={feedbackRef} tabIndex={-1} role="status"><h3>{checked ? <CheckCircle2 size={22} /> : <CircleHelp size={22} />}{checked ? "You’ve got it." : "A good one to revisit."}</h3><AnswerContent question={question} response={answer} /></div> : null}
        <div className="quiz-actions"><span role="status">{answer.submitted ? "Your answer has been saved." : "Select your answer above, then submit."}</span>{checked === null && !(draft.mode === "test" && answer.submitted) ? <Button onClick={saveAnswer} disabled={!isAnswerComplete(question, answer.selected, answer.matches)}>{draft.mode === "test" ? "Save answer" : "Submit answer"} <Check size={16} /></Button> : <Button onClick={() => draft.index === draft.items.length - 1 ? requestFinish() : move(draft.index + 1)}>{draft.index === draft.items.length - 1 ? "See results" : "Next question"}<ArrowRight size={16} /></Button>}</div>
        <div className="quiz-browse-actions"><Button variant="ghost" disabled={draft.index === 0} onClick={() => move(draft.index - 1)}><ArrowLeft size={15} />Previous question</Button><Button variant="ghost" onClick={() => move((draft.index + 1) % draft.items.length)}>{answer.submitted ? "Browse next question" : "Skip question"}<ArrowRight size={15} /></Button></div>
      </section><div className="session-actions"><Button variant="outline" onClick={pause}><Pause size={16} />Pause session</Button><Button variant="outline" onClick={requestFinish}>Finish session</Button><Button variant="ghost" className="text-danger" onClick={() => discardDialog.current?.showModal()}>Discard session</Button></div>
    </div> : <EmptyState title="This saved question is unavailable">Discard this session to choose a new set.<Button onClick={() => discardDialog.current?.showModal()}>Discard session</Button></EmptyState>}
    <dialog ref={finishDialog} className="confirm-dialog" aria-labelledby="finish-title"><h2 id="finish-title">Finish this session?</h2><p>{draft ? (draft.items.length - submitted) + " unanswered · " + draft.flagged.length + " flagged for review. Unanswered questions receive no credit in this session’s score. Only submitted answers affect your answer accuracy." : "Your results are ready."}</p><div className="button-row"><Button variant="outline" autoFocus onClick={() => finishDialog.current?.close()}>Keep reviewing</Button><Button onClick={finish}>Finish and see results</Button></div></dialog>
    <dialog ref={discardDialog} className="confirm-dialog" aria-labelledby="discard-title"><h2 id="discard-title">Discard this session?</h2><p>This removes the unfinished quiz. Previously checked learning-mode answers remain in your progress. Test-mode answers won’t be graded.</p><div className="button-row"><Button variant="outline" autoFocus onClick={() => discardDialog.current?.close()}>Keep session</Button><Button variant="danger" onClick={() => { updateStudy(s => ({ ...s, activePractice: null })); discardDialog.current?.close(); }}>Discard session</Button></div></dialog>
  </div>;
}

export function SessionReview({ session, questionMap }: { session: PracticeSession; questionMap: Map<string, Question> }) {
  return <div className="result-list">{session.questionIds.map(id => {
    const question = questionMap.get(id);
    if (!question) return null;
    const response = session.answers?.[id];
    return <details key={id}><summary><span className={!response ? "muted" : response.correct ? "result-correct" : "result-wrong"}>{!response ? <CircleHelp size={17} /> : response.correct ? <Check size={17} /> : <X size={17} />}</span><span><small>QUESTION {String(question.number).padStart(3, "0")} · {response ? !response.submitted ? "Unanswered" : response.correct ? "Correct" : "Needs review" : "Earlier session"}</small>{question.prompt}</span><CircleHelp size={18} /></summary><div className="result-detail"><AnswerContent question={question} response={response} />{!session.answers ? <p className="field-help">Answer selections weren’t stored for this earlier session.</p> : null}</div></details>;
  })}</div>;
}

function SessionResults({ session, questionMap, headingRef, retry, newSession }: { session: PracticeSession; questionMap: Map<string, Question>; headingRef: React.RefObject<HTMLHeadingElement | null>; retry: (questions: Question[]) => void; newSession: () => void }) {
  const missed = session.questionIds.filter(id => !session.answers?.[id]?.correct).map(id => questionMap.get(id)).filter((q): q is Question => Boolean(q));
  const answered = Object.values(session.answers ?? {}).filter(a => a.submitted).length;
  return <section className="quiz-results"><LearningCounter correct={session.correct} learning={answered - session.correct} total={session.total} scope="Session results" /><div className="results-header"><span className="eyebrow">ANOTHER STEP FORWARD</span><h2 ref={headingRef} tabIndex={-1}>Session complete.</h2><div className="score-circle"><strong>{Math.round(session.correct / session.total * 100)}<span>%</span></strong></div><p><strong>{session.correct} of {session.total}</strong> answers correct. Your progress is saved.</p><div className="button-row">{missed.length ? <Button onClick={() => retry(missed)}><RotateCcw size={16} />Retry missed questions</Button> : null}<Button variant="outline" onClick={newSession}>New practice session <ArrowRight size={16} /></Button></div></div><h3 className="review-title">Your session, at a glance</h3><SessionReview session={session} questionMap={questionMap} /></section>;
}
