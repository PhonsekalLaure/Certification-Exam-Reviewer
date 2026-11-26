import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { completePractice, EMPTY_STATE, needsReview, parseStudyState, recordAnswer, studySummary, type PracticeDraft, type Question, type StudyState } from "../src/lib/study.ts";

const questions: Question[] = JSON.parse(readFileSync(new URL("../src/data/questions.json", import.meta.url), "utf8")).questions;
const ids = new Set(questions.map(q => q.id));
const q = questions.find(q => q.type === "single" && q.scorable)!;
const second = questions.find(item => item.id !== q.id && item.scorable)!;
const draft: PracticeDraft = { id: "quiz-1", mode: "test", chapterId: 0, includeNotes: false, index: 1, items: [q, second].map(item => ({ questionId: item.id, optionIds: item.options.map(o => o.id), matchOptions: [] })), flagged: [second.id], answers: { [q.id]: { selected: q.correctIds, matches: {}, submitted: true } } };
const state: StudyState = { ...EMPTY_STATE, activePractice: draft };

test("saved quizzes round-trip order, selections, flags, and position through backups", () => {
  const parsed = parseStudyState(JSON.parse(JSON.stringify(state)), ids);
  assert.deepEqual(parsed.activePractice, draft);
  assert.deepEqual(parsed.results, {});
  assert.equal(parseStudyState(EMPTY_STATE, ids).activePractice, undefined);
});

test("invalid saved quizzes cannot load foreign questions, duplicate questions, or corrupt selections", () => {
  const invalid = [
    { ...draft, index: 5 }, { ...draft, mode: "other" }, { ...draft, items: [] },
    { ...draft, items: [draft.items[0], draft.items[0]] },
    { ...draft, flagged: ["javascript-q001"] },
    { ...draft, items: [{ ...draft.items[0], questionId: "foreign" }] },
    { ...draft, answers: { foreign: draft.answers[q.id] } },
    { ...draft, answers: { [q.id]: { ...draft.answers[q.id], submitted: "yes" } } },
  ];
  for (const activePractice of invalid) assert.throws(() => parseStudyState({ ...state, activePractice }, ids));
});

test("test completion grades once, keeps actual answers, and leaves skips out of answer accuracy", () => {
  const completed = completePractice(state, draft.id, questions, "2026-11-26T10:00:00Z");
  assert.equal(completed.activePractice, null);
  assert.equal(completed.sessions[0].correct, 1);
  assert.equal(completed.sessions[0].total, 2);
  assert.deepEqual(completed.sessions[0].answers?.[q.id].selected, q.correctIds);
  assert.equal(completed.sessions[0].answers?.[second.id].submitted, false);
  assert.equal(completed.results[q.id].attempts, 1);
  assert.equal(completed.results[second.id], undefined);
  assert.equal(completePractice(completed, draft.id, questions, "2026-11-26T11:00:00Z"), completed);
  assert.equal(completePractice(state, "another-quiz", questions, "2026-11-26T10:00:00Z"), state);
  assert.deepEqual(parseStudyState(JSON.parse(JSON.stringify(completed)), ids).sessions, completed.sessions);
});

test("learning completion does not grade submitted answers a second time", () => {
  const learning = recordAnswer({ ...state, activePractice: { ...draft, mode: "learn" } }, q.id, true);
  assert.equal(completePractice(learning, draft.id, questions, "2026-11-26T10:00:00Z").results[q.id].attempts, 1);
});

test("needs review combines mistakes and confidence while latest accuracy counts each question once", () => {
  let progress = recordAnswer(EMPTY_STATE, q.id, false);
  assert.equal(needsReview(q.id, progress), true);
  assert.equal(progress.cards[q.id], undefined);
  progress = recordAnswer(progress, q.id, true);
  assert.equal(needsReview(q.id, progress), false);
  progress = { ...progress, cards: { [q.id]: "learning", [second.id]: "known" } };
  assert.equal(needsReview(q.id, progress), true);
  const summary = studySummary(questions, progress);
  assert.equal(summary.answered, 1);
  assert.equal(summary.latestCorrect, 1);
  assert.equal(summary.totals.attempts, 2);
  assert.equal(summary.known, 1);
});
