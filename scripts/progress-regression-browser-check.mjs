// Regression checks for inactive certification stores and shuffled resume positions.
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1123-915-0_26.1123.915.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const baseURL = process.env.BASE_URL || "http://127.0.0.1:3000";
const errors = [];
const context = await browser.newContext();
context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
const page = await context.newPage();
const key = "studyroom:html-css:v1";
const nav = (target, name) => target.getByRole("navigation").getByRole("button", { name: new RegExp(`^${name}(?:\\s*\\d+)?$`) }).click();
const saved = target => target.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
async function select(target, id) {
  await target.getByRole("combobox", { name: "Certification", exact: true }).selectOption(id);
  await target.waitForFunction(id => {
    const picker = document.querySelector('select[aria-label="Certification"]');
    return picker?.value === id && !picker.disabled;
  }, id);
}

try {
  await page.goto(baseURL);
  await select(page, "html-css");
  await select(page, "ccst");
  const other = await context.newPage();
  await other.goto(baseURL);
  await select(other, "html-css");
  await nav(other, "Flashcards");
  await other.getByRole("button", { name: "Bookmark question 1", exact: true }).click();
  await other.getByRole("button", { name: "Reveal answer", exact: true }).click();
  await other.getByRole("button", { name: "Got it", exact: true }).click();

  await select(page, "html-css");
  await nav(page, "Bookmarks");
  await page.locator(".question-preview").waitFor();
  assert.equal(await page.locator(".question-preview").count(), 1);
  await nav(page, "Overview");
  assert.equal(await page.locator(".stats-grid > div").nth(2).locator("strong").textContent(), "1 cards");
  await nav(page, "Flashcards");
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  await page.getByRole("button", { name: "Bookmark question 2", exact: true }).click();
  assert.deepEqual((await saved(page)).bookmarks, ["html-css-q001", "html-css-q002"]);
  assert.equal((await saved(page)).cards["html-css-q001"], "known");
  console.log("PASS: Switching back refreshes another tab's progress and preserves it on the next save");

  // A missed reset must also clear the cached state, rather than resurrect it.
  await select(page, "ccst");
  await other.evaluate(key => localStorage.removeItem(key), key);
  await select(page, "html-css");
  await nav(page, "Bookmarks");
  await page.getByRole("heading", { name: "Keep the good questions close.", exact: true }).waitFor();
  await nav(page, "Flashcards");
  await page.getByRole("button", { name: "Bookmark question 1", exact: true }).click();
  assert.deepEqual((await saved(page)).bookmarks, ["html-css-q001"]);
  assert.deepEqual((await saved(page)).cards, {});
  console.log("PASS: Switching back also respects another tab's removed progress");

  // Deterministic shuffle: first card changes from question 3 to question 2.
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  assert.equal((await saved(page)).lastStudy.questionId, "html-css-q003");
  await page.evaluate(() => { Math.random = () => 0; });
  await page.getByRole("button", { name: "Shuffle", exact: true }).click();
  const displayed = await page.locator(".flash-front h2").textContent();
  assert.equal((await saved(page)).lastStudy.questionId, "html-css-q002");
  await page.reload();
  await page.waitForFunction(() => document.querySelector('select[aria-label="Certification"]')?.value === "html-css");
  await page.getByRole("button", { name: "Continue studying", exact: true }).click();
  assert.equal(await page.locator(".flash-front h2").textContent(), displayed);
  console.log("PASS: Reload and Continue studying resume the card displayed after shuffling");

  // A failed save must not discard in-memory changes when a store resubscribes.
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error("blocked"); }; });
  await page.getByRole("button", { name: "Bookmark question 2", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: /storage is unavailable/ }).waitFor();
  await select(page, "ccst");
  await select(page, "html-css");
  await nav(page, "Bookmarks");
  assert.equal(await page.locator(".question-preview").count(), 2);
  assert.deepEqual((await saved(page)).bookmarks, ["html-css-q001"]);
  // Continue working with completely unavailable storage as well.
  await page.evaluate(() => { Storage.prototype.getItem = () => { throw new Error("blocked"); }; });
  await select(page, "ccst");
  await select(page, "html-css");
  await nav(page, "Bookmarks");
  assert.equal(await page.locator(".question-preview").count(), 2);
  await page.getByRole("button", { name: "Remove bookmark for question 1", exact: true }).click();
  assert.equal(await page.locator(".question-preview").count(), 1);
  await select(page, "ccst");
  await select(page, "html-css");
  await nav(page, "Bookmarks");
  assert.equal(await page.locator(".question-preview").count(), 1);
  console.log("PASS: Session-only progress survives switching when storage writes or reads are blocked");
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
