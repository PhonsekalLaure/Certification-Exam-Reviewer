import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EMPTY_STATE, gradeAnswer, parseStudyState, practicePool, type Question, type StudyState } from "../src/lib/study.ts";

const load = (name: string) => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), "utf8"));
const banks = { ccst: load("questions"), "html-css": load("html-css"), javascript: load("javascript") };

test("certification banks preserve 179 CCST, 24 unique HTML/CSS, and 21 JavaScript source items", () => {
  assert.deepEqual(Object.values(banks).map(b => b.questions.length), [179, 24, 21]);
  assert.equal(new Set(Object.values(banks).flatMap(b => b.questions.map((q: Question) => q.id))).size, 224);
  for (const [id, bank] of Object.entries(banks)) {
    const questions = bank.questions as Question[];
    assert.deepEqual(questions.map(q => q.number), Array.from({ length: questions.length }, (_, i) => i + 1));
    for (const c of bank.chapters) assert.equal(questions.filter(q => q.chapterId === c.id).length, c.count);
    if (id !== "ccst") for (const q of questions) {
      assert.ok(q.id.startsWith(`${id}-`));
      assert.equal(q.contentFormat, "text");
      assert.equal("questionImages" in q, false, q.id);
      assert.equal("answerImages" in q, false, q.id);
      assert.equal("sourceTranscript" in q, false, q.id);
      assert.ok(q.prompt.length > 60, q.id);
      assert.ok(q.options.every(o => !/Option [A-D] in/.test(o.text)), q.id);
      assert.ok(q.pairs.every(p => !/^(Statement|Blank) \d/.test(p.left)), q.id);
      if (q.type === "matching") assert.ok(q.pairs.every(p => (p.options ?? q.matchOptions)?.includes(p.right)), q.id);
      if (q.type === "single" || q.type === "ordering") assert.ok(q.correctIds.every(answer => q.options.some(o => o.id === answer)), q.id);
    }
  }
  assert.ok(banks["html-css"].questions.every((q: Question) => q.sourceReferences?.length === 2));
});

test("new certification keys grade correctly and incomplete diagrams stay out of every quiz", () => {
  for (const bank of [banks["html-css"], banks.javascript]) for (const q of bank.questions as Question[]) {
    if (q.status === "invalid") {
      assert.ok(!practicePool(bank.questions, 0, true).includes(q));
      assert.equal(gradeAnswer(q, [], {}), false);
    } else {
      assert.equal(gradeAnswer(q, q.correctIds, Object.fromEntries(q.pairs.map(p => [p.id, p.right]))), true, q.id);
      if (q.status !== "standard") assert.ok(!practicePool(bank.questions, 0, false).includes(q));
    }
  }
  const yesNo = banks["html-css"].questions.find((q: Question) => q.number === 16);
  assert.deepEqual(yesNo.matchOptions, ["Yes", "No"]);
  assert.equal(gradeAnswer(yesNo, [], Object.fromEntries(yesNo.pairs.map((p: { id: string }) => [p.id, "No"]))), false);
});

test("legacy CCST backups remain valid while cross-certification imports are rejected, including empty backups", () => {
  const ccstIds = new Set<string>(banks.ccst.questions.map((q: Question) => q.id));
  const htmlIds = new Set<string>(banks["html-css"].questions.map((q: Question) => q.id));
  const jsIds = new Set<string>(banks.javascript.questions.map((q: Question) => q.id));
  const legacy: StudyState = { ...EMPTY_STATE, bookmarks: ["q017"], cards: { q001: "known" } };
  assert.equal(parseStudyState(legacy, ccstIds).cards.q001, "known");
  assert.equal(parseStudyState(legacy, ccstIds).certificationId, "ccst");
  assert.throws(() => parseStudyState(legacy, htmlIds, "html-css"), /different certification/);
  const html: StudyState = { ...EMPTY_STATE, certificationId: "html-css", bookmarks: ["html-css-q002"] };
  assert.equal(parseStudyState(html, htmlIds, "html-css").bookmarks[0], "html-css-q002");
  assert.throws(() => parseStudyState(html, jsIds, "javascript"), /different certification/);
  assert.throws(() => parseStudyState({ ...EMPTY_STATE, certificationId: "javascript" }, htmlIds, "html-css"), /different certification/);
  assert.throws(() => parseStudyState({ ...html, cards: { q001: "known" } }, htmlIds, "html-css"), /invalid flashcard/);
});


test("typed exercises retain code, full choices, caveats, and ordering distractors", () => {
  const html = banks["html-css"].questions as Question[];
  const js = banks.javascript.questions as Question[];
  const h = (n: number) => html.find(q => q.number === n)!;
  const j = (n: number) => js.find(q => q.number === n)!;
  assert.equal(h(4).options[0].text, "The browser default style will be used.");
  assert.equal(h(7).options[3].text, "*");
  assert.match(h(6).exhibit, /\.light p \{ background-color: green;/);
  assert.equal(h(6).status, "qualified");
  assert.equal(h(20).options[1].text, "Absolute positioning");
  assert.equal(h(20).options[2].text, "Relative positioning");
  assert.equal(h(20).status, "qualified");
  assert.match(j(2).exhibit, /course.grade = 100;/);
  assert.deepEqual(j(2).pairs[0].options, ["HTML Student", "JavaScript Student"]);
  assert.match(j(5).options[2].text, /value.toFixed\(digits\)/);
  assert.equal(j(3).options.length, 6);
  assert.equal(j(3).correctIds.length, 4);
  const wrong = ["extra-1", ...j(3).correctIds.slice(1)];
  assert.equal(gradeAnswer(j(3), wrong, {}), false);
  assert.equal(gradeAnswer(j(3), j(3).correctIds, {}), true);
  assert.ok(h(13).answerExhibit?.includes("Concept reference"));
  assert.ok(j(20).answerExhibit?.includes("scenario description clipped"));
});
