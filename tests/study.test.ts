import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EMPTY_STATE, gradeAnswer, isAnswerComplete, parseStudyState, practicePool, shuffled, type Question } from "../src/lib/study.ts";

const bank = JSON.parse(readFileSync(new URL("../src/data/questions.json", import.meta.url), "utf8"));
const questions = bank.questions as Question[];
const ids = new Set(questions.map(q => q.id));
function question(number: number) { return questions.find(q => q.number === number)!; }

test("all 179 source questions have complete, internally consistent answer data", () => {
  assert.equal(questions.length, 179);
  assert.equal(ids.size, 179);
  assert.deepEqual(questions.map(q => q.number), Array.from({ length: 179 }, (_, i) => i + 1));
  assert.deepEqual(bank.chapters.map((c: { id: number }) => questions.filter(q => q.chapterId === c.id).length), [36, 31, 24, 42, 13, 19, 14]);
  for (const q of questions) {
    assert.ok(q.prompt.length > 10 && q.explanation.length > 30, q.id);
    assert.ok(q.sourcePage >= 2 && q.sourcePage <= 53, q.id);
    assert.ok(!/CCST Reviewer|STUDY EDITION|Term or statement/.test(q.explanation + q.prompt), q.id);
    if (q.type === "matching") {
      assert.ok(q.pairs.length >= 2, q.id);
      assert.equal(new Set(q.pairs.map(p => p.id)).size, q.pairs.length);
      assert.ok(q.pairs.every(p => p.left && p.right), q.id);
    } else if (q.status !== "invalid") {
      assert.ok(q.correctIds.length, q.id);
      assert.ok(q.correctIds.every(id => q.options.some(o => o.id === id)), q.id);
    }
  }
});

test("cross-page table rows and the complete log exhibit are retained", () => {
  assert.equal(question(60).pairs.length, 5);
  assert.equal(question(123).pairs.length, 4);
  assert.equal(question(160).pairs.length, 4);
  assert.equal(question(175).pairs.length, 4);
  assert.deepEqual(question(175).pairs.at(-1), { id: "pair-4", left: "Containment", right: "Compartmentalize and segment the Network to limit the spread of the Worm to areas already infected" });
  assert.equal(question(179).exhibit.split("\n").length, 13);
  assert.match(question(179).exhibit, /09:19:10/);
});

test("single and multiple answers are graded by IDs with no extra choices accepted", () => {
  assert.equal(gradeAnswer(question(6), ["a"], {}), true);
  assert.equal(gradeAnswer(question(6), ["b"], {}), false);
  assert.equal(gradeAnswer(question(19), ["d", "a", "b"], {}), true);
  assert.equal(gradeAnswer(question(19), ["a", "b"], {}), false);
  assert.equal(gradeAnswer(question(19), ["a", "b", "d", "e"], {}), false);
  assert.equal(gradeAnswer(question(19), ["a", "a", "b"], {}), false);
});

test("matching permits reused answers and ordering requires the exact sequence", () => {
  const q = question(62);
  const matches = Object.fromEntries(q.pairs.map(p => [p.id, p.right]));
  assert.equal(gradeAnswer(q, [], matches), true);
  assert.equal(gradeAnswer(q, [], { ...matches, "pair-1": "T" }), false);
  assert.equal(isAnswerComplete(q, [], { "pair-1": "F" }), false);
  assert.equal(gradeAnswer(question(151), ["a", "b", "c", "d"], {}), true);
  assert.equal(gradeAnswer(question(151), ["b", "a", "c", "d"], {}), false);
  assert.equal(isAnswerComplete(question(151), ["a", "b"], {}), false);
});

test("default quizzes omit qualified, historical, and invalid items", () => {
  const standard = practicePool(questions, 0, false);
  assert.equal(standard.length, 136);
  assert.ok(standard.every(q => q.status === "standard"));
  const extended = practicePool(questions, 0, true);
  assert.equal(extended.length, 177);
  assert.ok(extended.every(q => q.number !== 9 && q.number !== 82));
  assert.ok(practicePool(questions, 3, false).every(q => q.chapterId === 3));
  assert.equal(gradeAnswer(question(9), ["b"], {}), false);
});

test("shuffle preserves every item and leaves its input unchanged", () => {
  const original = ["a", "b", "c", "d"];
  const result = shuffled(original, () => .1);
  assert.deepEqual(original, ["a", "b", "c", "d"]);
  assert.deepEqual([...result].sort(), original);
  assert.notDeepEqual(result, original);
});

test("backups round-trip and reject corrupt or unsupported progress", () => {
  const state = { ...EMPTY_STATE, bookmarks: ["q001", "q001"], cards: { q002: "known" }, results: { q003: { attempts: 2, correct: 1, lastCorrect: true } }, sessions: [{ id: "session-1", date: "2026-11-26T10:00:00Z", total: 1, correct: 1, questionIds: ["q003"] }] };
  const parsed = parseStudyState(JSON.parse(JSON.stringify(state)), ids);
  assert.deepEqual(parsed.bookmarks, ["q001"]);
  assert.equal(parsed.results.q003.correct, 1);
  for (const value of [null, {}, { ...state, version: 2 }, { ...state, bookmarks: ["q999"] }, { ...state, cards: { q001: "garbage" } }, { ...state, results: { q003: { attempts: 1, correct: 9, lastCorrect: true } } }, { ...state, lastStudy: { mode: "flashcards", chapterId: 2, questionId: "bad" } }, { ...state, sessions: [{ id: "bad", date: "no date", total: 1, correct: 1, questionIds: ["q003"] }] }]) {
    assert.throws(() => parseStudyState(value, ids));
  }
});
