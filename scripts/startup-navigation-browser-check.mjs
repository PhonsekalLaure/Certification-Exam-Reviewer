// Regression checks for saved-certification startup and flashcard navigation.
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1123-915-0_26.1123.915.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const baseURL = process.env.BASE_URL || "http://127.0.0.1:3000";
const errors = [];
function rememberJavaScript() {
  // New pages also run init scripts on about:blank, which has no local storage.
  try { localStorage.setItem("studyroom:active-certification", "javascript"); } catch { /* Seed once the site origin is available. */ }
}
async function newContext() {
  const context = await browser.newContext();
  context.on("page", page => {
    page.setDefaultTimeout(15000);
    page.on("pageerror", error => errors.push(error.message));
  });
  return context;
}
async function interceptJavaScriptBank(context, handleBank) {
  await context.route("**/_next/static/chunks/**", async route => {
    if (route.request().resourceType() !== "script") return route.continue();
    const response = await route.fetch();
    const body = await response.text();
    if (body.includes('"javascript-q001"')) return handleBank(route, response, body);
    await route.fulfill({ response, body });
  });
}
const nav = (page, name) => page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
const focusedQuestion = page => page.waitForFunction(() => document.activeElement === document.querySelector(".flash-front h2"));
const position = page => page.evaluate(() => JSON.parse(localStorage.getItem("ccst-study-room:v1"))?.lastStudy?.questionId);

try {
  const delayed = await newContext();
  await delayed.addInitScript(rememberJavaScript);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const intercepted = Promise.withResolvers();
  await interceptJavaScriptBank(delayed, async (route, response, body) => {
    intercepted.resolve();
    await gate;
    await route.fulfill({ response, body });
  });
  const startup = await delayed.newPage();
  await startup.goto(baseURL, { waitUntil: "domcontentloaded" });
  await intercepted.promise;
  try {
    await startup.getByRole("status").filter({ hasText: "Loading your saved certification…" }).waitFor();
    assert.equal(await startup.locator("main").getAttribute("aria-busy"), "true");
    assert.equal(await startup.getByRole("navigation").count(), 0);
    assert.equal(await startup.getByRole("button", { name: "Start practice", exact: true }).count(), 0);
    assert.equal(await startup.locator(".quiz-session").count(), 0);
    assert.equal(await startup.evaluate(() => localStorage.getItem("ccst-study-room:v1")), null);
  } finally {
    release();
  }
  await startup.locator(".certification-heading > strong").filter({ hasText: "JavaScript" }).waitFor();
  assert.equal(await startup.locator(".startup-loading").count(), 0);
  await nav(startup, "Practice quizzes");
  await startup.getByRole("button", { name: "Start practice", exact: true }).click();
  await startup.locator(".quiz-session").waitFor();
  assert.equal(await startup.getByLabel("Certification", { exact: true }).inputValue(), "javascript");
  console.log("PASS: Delayed saved certification shows a loading state before any study controls become available");
  await delayed.close();

  const failed = await newContext();
  await failed.addInitScript(rememberJavaScript);
  await interceptJavaScriptBank(failed, route => route.abort());
  const fallback = await failed.newPage();
  await fallback.goto(baseURL);
  await fallback.getByRole("alert").filter({ hasText: "The saved certification could not be loaded" }).waitFor();
  assert.equal(await fallback.getByLabel("Certification", { exact: true }).inputValue(), "ccst");
  assert.equal(await fallback.locator(".startup-loading").count(), 0);
  await nav(fallback, "Practice quizzes");
  await fallback.getByRole("button", { name: "Start practice", exact: true }).click();
  await fallback.locator(".quiz-session").waitFor();
  console.log("PASS: A failed saved-certification download exits loading with a notice and usable CCST fallback");
  await failed.close();

  const blocked = await newContext();
  await blocked.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error("blocked"); }; });
  const blockedPage = await blocked.newPage();
  await blockedPage.goto(baseURL);
  await blockedPage.getByRole("heading", { name: /Build confidence/ }).waitFor();
  assert.equal(await blockedPage.getByLabel("Certification", { exact: true }).inputValue(), "ccst");
  assert.equal(await blockedPage.locator(".startup-loading").count(), 0);
  await blocked.close();
  console.log("PASS: Unavailable selection storage falls back without leaving startup stuck");

  const keyboard = await newContext();
  const page = await keyboard.newPage();
  await page.goto(baseURL);
  await nav(page, "Flashcards");
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  await focusedQuestion(page);
  assert.equal(await position(page), "q002");
  await page.keyboard.press("ArrowRight");
  await focusedQuestion(page);
  assert.equal(await position(page), "q003");
  await page.keyboard.press("ArrowLeft");
  await focusedQuestion(page);
  assert.equal(await position(page), "q002");
  await page.keyboard.press("ArrowLeft");
  await focusedQuestion(page);
  assert.equal(await position(page), "q001");
  await page.keyboard.press("ArrowLeft");
  await focusedQuestion(page);
  assert.equal(await position(page), "q001");
  assert.match(await page.locator(".deck-position > strong").textContent(), /^1 /);

  const choice = page.locator(".quiz-option").first();
  await choice.click();
  await page.keyboard.press("ArrowRight");
  assert.equal(await position(page), "q001", "Arrow keys on controls do not change cards");
  assert.equal(await page.locator('.quiz-option[aria-pressed="true"]').count(), 1);
  await page.locator(".flash-front h2").focus();
  await page.keyboard.press("ArrowRight");
  await focusedQuestion(page);
  assert.equal(await position(page), "q002");
  assert.equal(await page.locator('.quiz-option[aria-pressed="true"]').count(), 0);
  assert.equal(await page.getByRole("button", { name: "Submit answer", exact: true }).isDisabled(), true);
  assert.equal(await page.locator(".quiz-feedback").count(), 0);
  await page.getByRole("button", { name: "Previous card", exact: true }).click();
  await focusedQuestion(page);
  assert.equal(await position(page), "q001");
  console.log("PASS: Buttons and arrow keys preserve focus, save position, reset answers, and respect controls and deck bounds");
  await keyboard.close();
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
