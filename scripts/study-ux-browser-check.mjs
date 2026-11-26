// Saved sessions, navigation, delayed grading, and accessible drawer regression checks.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1123-915-0_26.1123.915.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright");
const bank = JSON.parse(readFileSync(new URL("../src/data/questions.json", import.meta.url), "utf8"));
const baseURL = process.env.BASE_URL || "http://127.0.0.1:3000";
const key = "ccst-study-room:v1";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
page.setDefaultTimeout(12000);
mkdirSync("test-results/ux-review", { recursive: true });
const nav = name => page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const current = async () => {
  const prompt = await page.locator(".quiz-question > h2").textContent();
  return bank.questions.find(q => q.prompt === prompt);
};
async function answerQuestion(q, wrong = false) {
  if (q.type === "matching") {
    for (const pair of q.pairs) await page.locator("#match-" + pair.id).selectOption(pair.right);
    if (wrong) {
      const pair = q.pairs[0];
      const other = (pair.options ?? q.matchOptions ?? q.pairs.map(p => p.right)).find(value => value !== pair.right && !pair.acceptedAnswers?.includes(value));
      await page.locator("#match-" + pair.id).selectOption(other);
    }
  } else {
    const ids = wrong ? q.type === "ordering" ? [...q.correctIds].reverse() : [q.options.find(o => !q.correctIds.includes(o.id)).id] : q.correctIds;
    for (const id of ids) await page.locator(".quiz-option").getByText(q.options.find(o => o.id === id).text, { exact: true }).click();
  }
}
try {
  await page.goto(baseURL);
  await nav("Practice quizzes");
  await page.getByRole("button", { name: "Start practice", exact: true }).click();
  const first = await current();
  await answerQuestion(first);
  await page.getByRole("button", { name: "Submit answer", exact: true }).evaluate(el => { el.click(); el.click(); });
  await page.locator(".quiz-feedback").waitFor();
  assert.equal((await saved()).results[first.id].attempts, 1);
  assert.equal((await saved()).cards[first.id], undefined, "Grading never changes confidence");
  assert.equal(await page.locator(".answer-comparison").count(), 1);
  assert.equal(await page.locator(".answer-sources").getAttribute("open"), null);
  await page.getByRole("button", { name: "Next question", exact: true }).click();
  const second = await current();
  await answerQuestion(second);
  await page.getByRole("button", { name: "Flag for review", exact: true }).click();
  await page.screenshot({ path: "test-results/ux-review/practice-desktop.png", fullPage: true });
  const before = (await saved()).activePractice;
  await page.reload();
  await page.locator(".quiz-session").waitFor();
  assert.deepEqual((await saved()).activePractice, before);
  assert.equal((await current()).id, second.id);
  await page.getByRole("button", { name: "Pause session", exact: true }).click();
  await page.getByRole("button", { name: /Resume quiz/ }).click();
  assert.equal((await current()).id, second.id);
  await page.goBack();
  await page.locator(".next-study-actions").waitFor();
  await page.goForward();
  await page.locator(".quiz-session").waitFor();
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  const secondTotal = (await saved()).results[second.id].attempts;
  await page.getByRole("button", { name: "Question 1, answered", exact: true }).click();
  await page.locator(".quiz-feedback").waitFor();
  assert.equal((await saved()).results[first.id].attempts, 1);
  assert.equal((await saved()).results[second.id].attempts, secondTotal);
  await page.getByRole("combobox", { name: "Certification", exact: true }).selectOption("javascript");
  await page.getByRole("button", { name: "Start practice", exact: true }).waitFor();
  await page.getByRole("combobox", { name: "Certification", exact: true }).selectOption("ccst");
  await page.locator(".quiz-session").waitFor();
  assert.equal((await current()).id, first.id);
  console.log("PASS: Quiz order, draft choices, flags, navigation history, certification isolation, and checked-answer locks survive resume");

  await page.getByRole("button", { name: "Finish session", exact: true }).click();
  await page.getByRole("button", { name: "Keep reviewing", exact: true }).click();
  assert.ok((await saved()).activePractice);
  await page.getByRole("button", { name: "Finish session", exact: true }).click();
  await page.getByRole("button", { name: "Finish and see results", exact: true }).click();
  await page.getByRole("heading", { name: "Session complete.", exact: true }).waitFor();
  assert.equal((await saved()).sessions[0].total, 10);
  assert.equal((await saved()).sessions[0].correct, 2);
  await nav("Your progress");
  await page.locator(".history-session > summary").first().click();
  await page.locator(".history-session .result-list > details > summary").first().click();
  assert.equal(await page.locator(".history-session .answer-comparison").first().isVisible(), true);
  console.log("PASS: Finishing confirms unanswered/flagged questions and preserves actual selections in history");

  await nav("Practice quizzes");
  await page.getByRole("button", { name: "At the end", exact: true }).click();
  await page.getByRole("button", { name: "Start practice", exact: true }).click();
  const testQuestion = await current();
  const previousResults = (await saved()).results;
  await answerQuestion(testQuestion);
  await page.getByRole("button", { name: "Save answer", exact: true }).click();
  assert.equal(await page.locator(".quiz-feedback, .answer-key, .count-correct").count(), 0);
  assert.deepEqual((await saved()).results, previousResults);
  await page.reload();
  await page.locator(".quiz-session").waitFor();
  assert.equal(await page.locator(".answer-key").count(), 0);
  // Revise a saved answer without receiving a grade.
  if (testQuestion.type === "matching") {
    const pair = testQuestion.pairs[0];
    await page.locator("#match-" + pair.id).selectOption("");
    await page.locator("#match-" + pair.id).selectOption(pair.right);
  } else {
    const id = testQuestion.correctIds[0];
    await page.locator(".quiz-option").getByText(testQuestion.options.find(o => o.id === id).text, { exact: true }).click();
    if (testQuestion.type !== "single") await page.locator(".quiz-option").getByText(testQuestion.options.find(o => o.id === id).text, { exact: true }).click();
  }
  await page.getByRole("button", { name: "Save answer", exact: true }).click();
  await page.getByRole("button", { name: "Finish session", exact: true }).click();
  await page.getByRole("button", { name: "Finish and see results", exact: true }).click();
  await page.getByRole("heading", { name: "Session complete.", exact: true }).waitFor();
  assert.equal((await saved()).results[testQuestion.id].attempts, (previousResults[testQuestion.id]?.attempts ?? 0) + 1);
  assert.equal((await saved()).sessions.length, 2);
  console.log("PASS: Test mode hides all grading, permits revisions, resumes without revealing answers, and grades once at finish");

  await nav("Practice quizzes");
  // Deterministic one-question quiz to check the shared review collection.
  const reviewQuestion = bank.questions.find(q => q.type === "single" && q.scorable);
  await page.evaluate(({key, id}) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.cards = {};
    state.results = { [id]: { attempts: 1, correct: 0, lastCorrect: false } };
    localStorage.setItem(key, JSON.stringify(state));
  }, {key, id: reviewQuestion.id});
  await page.reload();
  await page.getByLabel("Focus on needs review").check();
  await page.getByRole("button", { name: "Start practice", exact: true }).click();
  assert.equal((await current()).id, reviewQuestion.id);
  await answerQuestion(reviewQuestion, true);
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await nav("Overview");
  await page.getByRole("button", { name: /Review 1 question/ }).click();
  assert.equal(await page.locator(".flash-front h2").textContent(), reviewQuestion.prompt);
  await page.locator(".quiz-option").getByText(reviewQuestion.options.find(o => o.id === reviewQuestion.correctIds[0]).text, { exact: true }).click();
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  assert.equal((await saved()).cards[reviewQuestion.id], undefined);
  await page.getByRole("button", { name: "Still learning", exact: true }).click();
  await nav("Overview");
  assert.equal(await page.getByRole("button", { name: /Review 1 question/ }).count(), 1);
  await page.screenshot({ path: "test-results/ux-review/returning-overview.png", fullPage: true });
  console.log("PASS: Needs review combines practice mistakes and confidence without conflating grades and ratings");

  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole("button", { name: "Open navigation", exact: true });
  await menu.click();
  assert.equal(await page.locator(".main-shell").getAttribute("inert"), "");
  const links = page.locator(".sidebar").locator("a[href], button:not(:disabled)");
  await links.last().focus();
  await page.keyboard.press("Tab");
  assert.equal(await links.first().evaluate(el => document.activeElement === el), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".sidebar").evaluate(el => el.classList.contains("is-open")), false);
  assert.equal(await menu.evaluate(el => document.activeElement === el), true);
  assert.deepEqual(errors, []);
  console.log("PASS: Drawer traps focus, closes with Escape, and restores focus to its trigger");
} finally { await browser.close(); }
