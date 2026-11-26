"use client";

import { Check, X } from "lucide-react";
import type { Question } from "@/lib/study";

export function AnswerChoices({ question, options = question.options, selected, checked, choose }: {
  question: Question;
  options?: Question["options"];
  selected: string[];
  checked: boolean | null;
  choose: (id: string) => void;
}) {
  return <div className="quiz-options" role="group" aria-label={question.type === "ordering" ? "Actions to put in order" : "Answer choices"}>
    {options.map(option => {
      const isSelected = selected.includes(option.id);
      const isRight = question.type === "ordering"
        ? question.correctIds.includes(option.id) && selected.indexOf(option.id) === question.correctIds.indexOf(option.id)
        : question.correctIds.includes(option.id);
      const optionClass = checked === null ? isSelected ? "selected" : "" : isRight ? "correct" : isSelected ? "wrong" : "";
      return <button type="button" key={option.id} className={`quiz-option ${optionClass}`} aria-pressed={isSelected} disabled={checked !== null} onClick={() => choose(option.id)}>
        <span className="option-letter">{question.type === "ordering" ? (isSelected ? selected.indexOf(option.id) + 1 : "+") : option.id.toUpperCase()}</span>
        <span>{option.text}</span>
        {checked !== null && isRight ? <><span className="option-result">Correct answer</span><Check size={19} aria-hidden="true" /></> : checked !== null && isSelected ? <><span className="option-result">Your answer</span><X size={19} aria-hidden="true" /></> : <span aria-hidden="true" className={`option-indicator ${question.type === "multiple" ? "square" : ""}`}>{isSelected ? <Check size={12} /> : null}</span>}
      </button>;
    })}
  </div>;
}

export function AnswerInstruction({ question }: { question: Question }) {
  return <p className="answer-instruction">{question.type === "matching"
    ? "Choose a response for every statement or numbered blank. Choices may be reused."
    : question.type === "ordering"
      ? `Select ${question.correctIds.length} items in the correct order. Select an item again to remove it. Some choices may not be used.`
      : question.type === "multiple"
        ? `Select ${question.correctIds.length} answers, then submit. You can change your choices before submitting.`
        : "Select one answer by its letter or text, then submit. You can change it before submitting."}</p>;
}
