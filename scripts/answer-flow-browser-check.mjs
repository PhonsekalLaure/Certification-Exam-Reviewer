// Regression coverage for selecting, submitting, and tracking learning progress.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1123-915-0_26.1123.915.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright");
const bank = JSON.parse(readFileSync(new URL("../src/data/questions.json", import.meta.url), "utf8"));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", e => errors.push(e.message));
page.setDefaultTimeout(12000);
mkdirSync("test-results", { recursive: true });
const nav = name => page.getByRole("navigation").getByRole("button", { name: new RegExp(`^${name}(?:\\s*\\d+)?$`) }).click();
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("ccst-study-room:v1")));
const counts = () => page.locator(".learning-counts > div > strong").allTextContents().then(values => values.map(Number));
const submit = () => page.getByRole("button", { name: "Submit answer", exact: true });
const choice = id => page.locator(".quiz-option").filter({ has: page.locator(".option-letter", { hasText: new RegExp(`^${id.toUpperCase()}$`) }) });
async function openCard(q) {
  await nav("Chapters");
  await page.getByRole("searchbox").fill(q.prompt);
  await page.locator(".question-preview").filter({ has: page.getByRole("heading", { name: q.prompt, exact: true }) }).getByRole("button", { name: "Study this card", exact: true }).click();
  await page.locator(".flash-front h2").waitFor();
}

try {
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:3000");
  const single = bank.questions.find(q => q.type === "single" && q.scorable);
  const multi = bank.questions.find(q => q.type === "multiple" && q.scorable);
  const singleDeckSize = bank.questions.filter(q => q.chapterId === single.chapterId).length;
  const multiDeckSize = bank.questions.filter(q => q.chapterId === multi.chapterId).length;
  await openCard(single);
  assert.deepEqual(await counts(), [0, 0, singleDeckSize]);
  assert.equal(await submit().isDisabled(), true);
  assert.equal(await page.locator(".answer-key").count(), 0);
  const wrong = single.options.find(o => !single.correctIds.includes(o.id)).id;
  await choice(single.correctIds[0]).click();
  await choice(wrong).focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator('.quiz-option[aria-pressed="true"]').count(), 1);
  assert.deepEqual(await counts(), [0, 0, singleDeckSize]);
  assert.equal((await saved()).results[single.id], undefined);
  await submit().evaluate(button => { button.click(); button.click(); });
  await page.getByRole("heading", { name: "Not quite. Let’s learn this one.", exact: true }).waitFor();
  assert.deepEqual(await counts(), [0, 1, singleDeckSize - 1]);
  assert.equal((await saved()).results[single.id].attempts, 1);
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains("quiz-feedback")), true);
  assert.equal((await saved()).cards[single.id], undefined);
  await page.getByRole("button", { name: "Still learning", exact: true }).click();
  assert.equal((await saved()).cards[single.id], "learning");
  assert.equal(await page.locator('.quiz-option:not(:disabled)').count(), 0);
  assert.equal(await page.locator('.quiz-option.wrong .option-result').textContent(), "Your answer");

  console.log("PASS: Keyboard letter selection, explicit submission, wrong-answer feedback, and duplicate-submit protection");

  await openCard(single);
  await choice(single.correctIds[0]).click();
  await submit().click();
  await page.getByRole("heading", { name: "Correct. You’ve got it!", exact: true }).waitFor();
  assert.deepEqual(await counts(), [1, 0, singleDeckSize - 1]);
  assert.equal((await saved()).results[single.id].attempts, 2);
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await page.reload();
  await nav("Flashcards");
  assert.deepEqual(await counts(), [1, 0, bank.questions.length - 1]);
  console.log("PASS: Correcting a missed question moves it between counters; totals survive reload without double counting");

  await openCard(multi);
  for (const id of multi.correctIds) await choice(id).click();
  await choice(multi.correctIds[0]).click();
  assert.equal(await page.locator('.quiz-option[aria-pressed="true"]').count(), multi.correctIds.length - 1);
  await choice(multi.correctIds[0]).click();
  await submit().click();
  await page.getByRole("heading", { name: "Correct. You’ve got it!", exact: true }).waitFor();
  assert.deepEqual(await counts(), [2, 0, multiDeckSize - 2]);
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await page.getByLabel("Show cards", { exact: true }).selectOption("known");
  assert.deepEqual(await counts(), [2, 0, 0]);
  await page.getByLabel("Show cards", { exact: true }).selectOption("all");
  await page.getByRole("button", { name: "Reveal answer", exact: true }).click();
  assert.deepEqual(await counts(), [2, 0, multiDeckSize - 2]);
  console.log("PASS: Multi-answer toggling, deck-scoped counts, and reveal-without-grading");

  await page.getByRole("combobox", { name: "Certification", exact: true }).selectOption("javascript");
  await page.locator(".certification-heading > strong").filter({ hasText: "JavaScript" }).waitFor();
  await nav("Flashcards");
  assert.deepEqual(await counts(), [0, 0, 21]);
  await nav("Practice quizzes");
  await page.getByRole("button", { name: "Start practice", exact: true }).click();
  assert.deepEqual(await counts(), [0, 0, 10]);
  const js = JSON.parse(readFileSync(new URL("../src/data/javascript.json", import.meta.url), "utf8"));
  for (let i = 0; i < 10; i++) {
    const prompt = await page.locator(".quiz-question > h2").textContent();
    const q = js.questions.find(q => q.prompt === prompt);
    if (q.type === "matching") {
      for (const pair of q.pairs) {
        const options = pair.options ?? q.matchOptions ?? [...new Set(q.pairs.map(p => p.right))];
        await page.locator(`#match-${pair.id}`).selectOption(i === 0 ? options.find(value => value !== pair.right && !pair.acceptedAnswers?.includes(value)) ?? pair.right : pair.right);
      }
    } else if (i === 0) {
      const distractor = q.options.find(o => !q.correctIds.includes(o.id));
      if (q.type === "ordering") for (const id of [...q.correctIds].reverse()) await page.locator(".quiz-option").getByText(q.options.find(o => o.id === id).text, { exact: true }).click();
      else await choice(distractor?.id ?? q.correctIds[0]).click();
    } else {
      for (const id of q.correctIds) {
        if (q.type === "ordering") await page.locator(".quiz-option").getByText(q.options.find(o => o.id === id).text, { exact: true }).click();
        else await choice(id).click();
      }
    }
    await submit().click();
    await page.locator(".quiz-feedback").waitFor();
    const [correct, learning, remaining] = await counts();
    assert.equal(correct + learning, i + 1);
    assert.equal(remaining, 9 - i);
    assert.equal(await page.locator('[role="progressbar"]').getAttribute("aria-valuenow"), String((i + 1) * 10));
    if (i < 9) await page.getByRole("button", { name: "Next question", exact: true }).click();
  }
  await page.getByRole("button", { name: "See results", exact: true }).click();
  await page.getByRole("heading", { name: "Session complete.", exact: true }).waitFor();
  console.log("PASS: Practice counters update on every submission through 100%, isolated from other certifications");

  const jsChoice = js.questions.find(q => q.type === "single");
  await openCard(jsChoice);
  await choice(jsChoice.correctIds[0]).click();
  assert.ok(await page.locator(".quiz-option").count() > 0);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `No overflow at ${width}px`);
    for (const box of await page.locator(".quiz-option").evaluateAll(elements => elements.map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })))) assert.ok(box.width >= 44 && box.height >= 44);
    await page.screenshot({ path: `test-results/answer-flow-${width}.png`, fullPage: true, animations: "disabled" });
  }
  await submit().click();
  await page.getByRole("heading", { name: "Correct. You’ve got it!", exact: true }).waitFor();
  const counter = await page.locator(".learning-counter").boundingBox();
  const feedbackHeading = await page.locator(".quiz-feedback > h3").boundingBox();
  assert.ok(counter.y >= 0 && counter.y + counter.height < 900, "Live counters stay visible while reading feedback");
  assert.ok(feedbackHeading.y >= counter.y + counter.height, "Sticky counters do not cover the focused feedback heading");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: "test-results/answer-feedback-mobile.png", animations: "disabled" });
  assert.deepEqual(errors, []);
  console.log("PASS: Desktop, tablet, and small mobile layouts fit without horizontal overflow or browser errors");
} finally {
  await browser.close();
}
