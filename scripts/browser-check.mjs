// Development-only smoke checks. Uses the desktop's bundled Playwright runtime.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1123-915-0_26.1123.915.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright");
const bank = JSON.parse(readFileSync(new URL("../src/data/questions.json", import.meta.url), "utf8"));
const baseURL = process.env.BASE_URL || "http://127.0.0.1:3000";
const storageKey = "ccst-study-room:v1";
const browser = await chromium.launch({ channel: "chrome", headless: true });
mkdirSync("test-results", { recursive: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const report = [];
function passed(message) { report.push(message); console.log("PASS:", message); }
async function nav(label) { await page.getByRole("navigation").getByRole("button", { name: new RegExp(`^${label}(?:\\s*\\d+)?$`) }).click(); }
async function saved() { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey); }

try {
  await page.goto(baseURL);
  await page.getByRole("heading", { name: /Build confidence/ }).waitFor();
  await page.screenshot({ path: "test-results/overview-desktop.png", fullPage: true, animations: "disabled" });
  assert.equal(await page.locator(".chapter-card").count(), 7);
  passed("Overview renders all seven chapters with no hydration error");

  await nav("Chapters");
  await page.getByRole("searchbox").fill("Which protocol uses encryption for secure remote access");
  await page.getByRole("button", { name: "Bookmark question 17", exact: true }).click();
  await nav("Bookmarks");
  await page.getByRole("heading", { name: /Which protocol uses encryption for secure remote access/ }).waitFor();
  assert.deepEqual((await saved()).bookmarks, ["q017"]);
  await page.reload();
  await nav("Bookmarks");
  assert.equal(await page.locator(".question-preview").count(), 1);
  passed("Bookmark survives navigation and page reload");

  await page.getByRole("button", { name: "Study 1 saved cards" }).click();
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await page.getByRole("heading", { name: "C and D (both can secure remote access)", exact: true }).waitFor();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  assert.equal((await saved()).cards.q017, "known");
  await page.getByRole("heading", { name: "A little more confident." }).waitFor();
  await page.reload();
  await nav("Your progress");
  assert.equal((await saved()).cards.q017, "known");
  passed("Flashcard reveals the qualified answer and persists its rating");

  await nav("Practice quizzes");
  await page.getByLabel("What would you like to practice?").selectOption("7");
  await page.getByRole("button", { name: "All available", exact: true }).click();
  await page.getByRole("button", { name: "Start practice", exact: true }).click();
  let total = 0;
  const seenTypes = new Set();
  while (true) {
    await page.locator(".quiz-question > h2").waitFor();
    const text = await page.locator(".quiz-question > h2").innerText();
    const bookmarkLabel = await page.locator('.quiz-question button[aria-label*="question"]').getAttribute("aria-label");
    const number = Number(bookmarkLabel.match(/question (\d+)/)[1]);
    const q = bank.questions.find(q => q.number === number);
    assert.ok(q && q.prompt === text, text);
    seenTypes.add(q.type);
    if (q.type === "matching") {
      for (const pair of q.pairs) await page.locator(`#match-${pair.id}`).selectOption(pair.right);
    } else {
      for (const id of q.correctIds) await page.locator(".quiz-option").getByText(q.options.find(o => o.id === id).text, { exact: true }).click();
    }
    await page.getByRole("button", { name: "Submit answer", exact: true }).click();
    await page.getByRole("heading", { name: "You’ve got it.", exact: true }).waitFor();
    total++;
    const finish = page.getByRole("button", { name: "See results", exact: true });
    if (await finish.count()) { await finish.click(); break; }
    await page.getByRole("button", { name: "Next question", exact: true }).click();
  }
  assert.equal(total, 11);
  assert.ok(seenTypes.has("matching") && seenTypes.has("multiple") && seenTypes.has("single"));
  await page.getByRole("heading", { name: "Session complete.", exact: true }).waitFor();
  const progress = await saved();
  assert.equal(progress.sessions[0].correct, total);
  assert.equal(progress.sessions[0].total, total);
  await page.screenshot({ path: "test-results/practice-results.png", fullPage: true, animations: "disabled" });
  passed("Complete shuffled quiz grades single, multi-answer, and matching items and saves one session");

  await nav("Your progress");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup", exact: true }).click();
  const download = await downloadPromise;
  await download.saveAs("test-results/backup.json");
  assert.equal(JSON.parse(readFileSync("test-results/backup.json", "utf8")).sessions.length, 1);
  await page.getByRole("button", { name: "Reset this certification", exact: true }).click();
  await page.getByRole("button", { name: "Keep current progress", exact: true }).click();
  assert.equal((await saved()).sessions.length, 1);
  await page.getByRole("button", { name: "Reset this certification", exact: true }).click();
  await page.getByRole("button", { name: "Clear progress", exact: true }).click();
  assert.equal((await saved()).sessions.length, 0);
  await page.getByLabel("Choose a study backup").setInputFiles("test-results/backup.json");
  await page.getByRole("button", { name: "Restore backup", exact: true }).click();
  assert.equal((await saved()).sessions.length, 1);
  await page.getByLabel("Choose a study backup").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from('{"version":2}') });
  await page.getByRole("status").filter({ hasText: /not a supported/ }).waitFor();
  assert.equal((await saved()).sessions.length, 1);
  passed("Backup export, reset cancellation, confirmed reset, import, and corrupt backup rejection work");

  const second = await context.newPage();
  await second.goto(baseURL);
  await nav("Bookmarks");
  await page.getByRole("button", { name: "Remove bookmark for question 17" }).click();
  await second.getByRole("navigation").getByRole("button", { name: /^Bookmarks/ }).click();
  await second.getByRole("heading", { name: "Keep the good questions close." }).waitFor();
  await second.close();
  passed("Other open tabs receive bookmark changes");

  // Isolate an ordering item through the actual mistakes filter.
  await page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key));
    state.results = { q151: { attempts: 1, correct: 0, lastCorrect: false } };
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  await page.reload();
  await nav("Practice quizzes");
  await page.getByText("Focus on needs review", { exact: true }).click();
  await page.getByRole("button", { name: "Start practice", exact: true }).click();
  for (const id of ["d", "c", "b", "a"]) await page.locator(".quiz-option").getByText(bank.questions.find(q => q.number === 151).options.find(o => o.id === id).text, { exact: true }).click();
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await page.getByRole("heading", { name: "A good one to revisit.", exact: true }).waitFor();
  assert.equal(await page.locator(".quiz-option.wrong").count(), 4);
  await page.getByRole("button", { name: "See results", exact: true }).click();
  await page.getByRole("button", { name: "Retry missed questions", exact: true }).click();
  for (const id of ["a", "b", "c", "d"]) await page.locator(".quiz-option").getByText(bank.questions.find(q => q.number === 151).options.find(o => o.id === id).text, { exact: true }).click();
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await page.getByRole("heading", { name: "You’ve got it.", exact: true }).waitFor();
  assert.equal((await saved()).results.q151.lastCorrect, true);
  passed("Mistake filtering, wrong ordering feedback, and retrying missed questions work");

  await nav("Overview");
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `Overflow at ${width}px`);
    await page.screenshot({ path: `test-results/overview-${width}.png`, fullPage: true, animations: "disabled" });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await nav("Flashcards");
  await page.getByRole("button", { name: "Reveal answer" }).click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.equal(await page.locator(".skip-link").evaluate(el => el.getBoundingClientRect().bottom <= 0), true, "Skip link stays hidden until keyboard focus");
  await page.screenshot({ path: "test-results/flashcard-mobile.png", fullPage: true, animations: "disabled" });
  passed("Responsive layouts fit 390, 768, 1024, and 1440px; mobile navigation and flashcards work");

  const broken = await browser.newContext();
  await broken.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error("blocked"); }; });
  const blockedPage = await broken.newPage();
  await blockedPage.goto(baseURL);
  await blockedPage.getByRole("button", { name: "Let’s start studying", exact: true }).click();
  await blockedPage.getByRole("alert").filter({ hasText: /storage is unavailable/ }).waitFor();
  await blockedPage.getByRole("button", { name: "Reveal answer" }).click();
  passed("Blocked browser storage shows a clear session-only notice without breaking study");
  await broken.close();

  const corrupt = await browser.newContext();
  await corrupt.addInitScript(key => localStorage.setItem(key, "{broken json"), storageKey);
  const corruptPage = await corrupt.newPage();
  await corruptPage.goto(baseURL);
  await corruptPage.getByRole("alert").filter({ hasText: /could not be loaded/ }).waitFor();
  await corruptPage.getByRole("heading", { name: /Build confidence/ }).waitFor();
  passed("Corrupt stored progress falls back safely and explains how to restore a backup");
  await corrupt.close();
  assert.deepEqual(errors, []);
  writeFileSync("test-results/browser-report.json", JSON.stringify({ passed: report, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: "test-results/failure.png", fullPage: true, animations: "disabled" }).catch(() => {});
  console.error(await page.locator("body").innerText().catch(() => "No page"));
  throw error;
} finally {
  await browser.close();
}
