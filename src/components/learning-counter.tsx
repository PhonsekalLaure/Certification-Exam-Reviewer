import { CheckCircle2, Circle, Sprout } from "lucide-react";
import { Meter } from "./study-parts";

export function LearningCounter({ correct, learning, total, scope }: { correct: number; learning: number; total: number; scope: string }) {
  const answered = correct + learning;
  return <section className="learning-counter" aria-label={`${scope} progress`}>
    <div className="learning-counter-heading"><strong>{scope}</strong><span>{answered} of {total} answered</span></div>
    <div className="learning-counts" aria-live="polite" aria-atomic="true">
      <div className="count-correct"><CheckCircle2 size={19} aria-hidden="true" /><strong>{correct}</strong><span>Correct</span></div>
      <div className="count-learning"><Sprout size={19} aria-hidden="true" /><strong>{learning}</strong><span>Needs review</span></div>
      <div className="count-unanswered"><Circle size={19} aria-hidden="true" /><strong>{Math.max(0, total - answered)}</strong><span>Not answered</span></div>
    </div>
    <Meter value={total ? answered / total * 100 : 0} label={`${scope} questions answered`} />
  </section>;
}
