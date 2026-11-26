"use client";

import type { CSSProperties } from "react";
import { ArrowRight, BookMarked, BookOpen, CheckCheck, Coffee, Layers, ListChecks, MoveUpRight, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCertification, useQuestionBank } from "@/lib/certification-context";
import { studySummary, type StudyState } from "@/lib/study";
import { ChapterCard } from "./study-parts";
import type { FlashcardStart } from "./flashcards";

interface OverviewProps {
  state: StudyState;
  openChapter: (id: number) => void;
  study: (id: number, filter?: FlashcardStart["filter"], questionId?: string) => void;
  practice: (id: number) => void;
  allChapters: () => void;
}

export function Overview({ state, openChapter, study, practice, allChapters }: OverviewProps) {
  const { questions, chapters, questionMap } = useQuestionBank();
  const { certification } = useCertification();
  const { studied, known, answered, latestCorrect, needsReview } = studySummary(questions, state);
  const last = state.lastStudy && questionMap.get(state.lastStudy.questionId);
  const returning = Boolean(studied || last || state.activePractice || state.sessions.length);
  const unseen = questions.filter(q => !state.cards[q.id] && !state.results[q.id]).length;
  const chapter = chapters.find(c => c.id === (last?.chapterId ?? 1)) ?? chapters[0];
  const explored = Math.round(studied / questions.length * 100);
  const resume = () => state.activePractice ? practice(state.activePractice.chapterId) : study(last?.chapterId ?? 1, "all", last?.id);

  return <div className="dashboard">
    <div className="dashboard-intro">
      <div><span className="eyebrow">A LITTLE FOCUS. A LITTLE FURTHER.</span><h1>{returning ? "Ready for your next step?" : <>Build confidence.<em>One concept at a time.</em></>}</h1><p>{returning ? "Your progress is here. Let’s pick up the thread." : "A clear space to learn, practice, and make it stick."}</p></div>
      <span className="workspace-badge"><Sparkles size={15} aria-hidden="true" /> Your personal study space</span>
    </div>

    <div className="overview-top">
      <section className="focus-panel">
        <div className="focus-copy">
          <span className="eyebrow"><span className="focus-dot" />{state.activePractice ? "RIGHT WHERE YOU LEFT OFF" : last ? "KEEP THE MOMENTUM" : "START SOMETHING GOOD"}</span>
          <span className="focus-subject">{certification.name}</span>
          <h2>{state.activePractice ? <>A little more practice.<br />A lot more confidence.</> : chapter.title}</h2>
          <p>{state.activePractice ? "Your answers, place, and review flags are saved. Come back in." : last ? "Pick up your flashcards and keep building on what you know." : "Start with the foundations. There’s no rush to know it all."}</p>
          <div className="focus-actions"><Button onClick={resume}>{state.activePractice ? "Resume quiz" : last ? "Continue studying" : "Let’s start studying"}<ArrowRight size={17} /></Button><span>{state.activePractice ? "Question " + (state.activePractice.index + 1) + " of " + state.activePractice.items.length : chapter.count + " questions · At your own pace"}</span></div>
        </div>
        <div className="focus-art" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="art-cross">+</span><div className="study-book"><span>THE NEXT CHAPTER</span><BookOpen size={59} strokeWidth={1.1} /><strong>{String(chapter.id).padStart(2, "0")}</strong><small>SMALL STEPS. REAL PROGRESS.</small></div><span className="art-stamp"><CheckCheck size={20} /></span></div>
      </section>

      <section className="overview-map panel">
        <div className="section-heading"><h2>The bigger picture</h2><MoveUpRight size={17} aria-hidden="true" /></div>
        <div className="progress-orbit" style={{ "--progress": explored + "%" } as CSSProperties} role="img" aria-label={explored + "% of questions studied"}><div><strong>{explored}<span>%</span></strong><span>explored</span></div></div>
        <p><strong>{studied} of {questions.length}</strong> questions studied</p>
        <span className="map-footnote">Every question moves you forward.</span>
      </section>
    </div>

    <div className="stats-grid">
      <div><span><BookOpen size={17} /> Questions studied</span><strong>{studied}<small> / {questions.length}</small></strong><p>{questions.length - studied} still to discover</p></div>
      <div><span><Target size={17} /> Latest answer accuracy</span><strong>{answered ? Math.round(latestCorrect / answered * 100) : "—"}<small>{answered ? "%" : ""}</small></strong><p>{answered ? latestCorrect + " correct across " + answered + (answered === 1 ? " question" : " questions") : "Your baseline starts with one answer"}</p></div>
      <div><span><CheckCheck size={17} /> Marked “Got it”</span><strong>{known}<small> cards</small></strong><p>Confidence, in your own words</p></div>
    </div>

    {returning ? <section className="next-study-actions" aria-label="Your next study steps">
      <button className="next-study-card next-study-primary" onClick={() => study(0)}><Layers size={21} /><div><strong>Browse flashcards</strong><span>Explore your complete question bank</span></div><ArrowRight size={17} /></button>
      <button className="next-study-card" disabled={!needsReview} onClick={() => study(0, "learning")}><BookMarked size={21} /><div><strong>Review {needsReview} {needsReview === 1 ? "question" : "questions"}</strong><span>Give the tricky ones another look</span></div><ArrowRight size={17} /></button>
      <button className="next-study-card" disabled={!unseen} onClick={() => study(0, "unseen")}><Sparkles size={21} /><div><strong>Study {unseen} new {unseen === 1 ? "question" : "questions"}</strong><span>A fresh concept is waiting</span></div><ArrowRight size={17} /></button>
    </section> : null}

    <div className="dashboard-columns">
      <section className="chapter-section">
        <div className="section-heading"><div><span className="eyebrow">YOUR LEARNING PATH</span><h2>A chapter at a time.</h2></div><button className="text-link" onClick={allChapters}>View all chapters <ArrowRight size={15} /></button></div>
        <div className="chapter-grid">{chapters.map(c => <ChapterCard key={c.id} chapter={c} state={state} open={() => openChapter(c.id)} />)}</div>
        <div className="chapter-section-note"><span /> Study chapters organize your reviewer. They aren’t an official exam blueprint.</div>
      </section>
      <aside className="dashboard-aside">
        <section className="practice-invite"><span className="icon-tile"><ListChecks size={24} /></span><span className="eyebrow">TURN KNOWLEDGE INTO CONFIDENCE</span><h2>Put it into practice.</h2><p>A few questions. Useful explanations. A clearer picture of what’s sticking.</p><Button onClick={() => practice(0)} variant="outline">Take a practice quiz <ArrowRight size={16} /></Button><span className="practice-footnote">Learn as you go, or check answers at the end.</span></section>
        <section className="study-tip"><Coffee size={23} strokeWidth={1.5} aria-hidden="true" /><span className="eyebrow">A NOTE TO YOUR FUTURE SELF</span><p>“Understand the why.<br />The answer will follow.”</p><span>Small sessions add up. Keep going.</span></section>
      </aside>
    </div>
  </div>;
}
