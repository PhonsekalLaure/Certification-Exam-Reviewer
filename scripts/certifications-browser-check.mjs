import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1123-915-0_26.1123.915.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright");
const banks = Object.fromEntries(["html-css", "javascript"].map(id => [id, JSON.parse(readFileSync(new URL(`../src/data/${id}.json`, import.meta.url), "utf8"))]));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
const screenshotRequests = [];
page.on("request", request => { if (request.url().includes("/reviewers/")) screenshotRequests.push(request.url()); });
page.on("pageerror", e => errors.push(e.message));
mkdirSync("test-results", { recursive: true });
const report = [];
const pass = message => { report.push(message); console.log("PASS:", message); };
const nav = label => page.getByRole("navigation").getByRole("button", { name: new RegExp(`^${label}(?:\\s*\\d+)?$`) }).click();
const chooseCertification = async id => {
  await page.getByRole("combobox", { name: "Certification", exact: true }).selectOption(id);
  await page.locator(".certification-heading > strong").filter({ hasText: id === "ccst" ? "CCST Cybersecurity" : id === "html-css" ? "HTML & CSS" : "JavaScript" }).waitFor();
};
const readState = id => page.evaluate(key => JSON.parse(localStorage.getItem(key)), id === "ccst" ? "ccst-study-room:v1" : `studyroom:${id}:v1`);
try {
  await page.addInitScript(() => {
    if (!localStorage.getItem("ccst-study-room:v1")) localStorage.setItem("ccst-study-room:v1", JSON.stringify({ version: 1, bookmarks: ["q017"], cards: { q001: "known" }, results: {}, sessions: [], lastStudy: null }));
  });
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:3000");
  await page.getByRole("heading", { name: /Build confidence/ }).waitFor();
  assert.equal((await readState("ccst")).cards.q001, "known");
  await chooseCertification("html-css");
  assert.equal(await page.locator(".chapter-card").count(), 6);
  await nav("Bookmarks");
  await page.getByRole("heading", { name: "Keep the good questions close." }).waitFor();
  await nav("Chapters");
  await page.getByRole("searchbox").fill("family portrait");
  await page.getByRole("button", { name: "Bookmark question 2", exact: true }).click();
  await page.getByRole("button", { name: "Study this card", exact: true }).click();
  assert.ok(await page.locator('.flash-card .code-exhibit code').count());
  assert.equal(await page.locator('.flash-card img').count(), 0);
  assert.equal(await page.locator('.flash-card .answer-key').count(), 0);
  await page.getByRole("button", { name: "Reveal answer", exact: true }).click();
  await page.locator('.flash-card .answer-key').waitFor();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  const html = await readState("html-css");
  assert.equal(html.cards["html-css-q002"], "known");
  assert.deepEqual(html.bookmarks, ["html-css-q002"]);
  assert.equal(html.certificationId, "html-css");
  pass("HTML/CSS has six chapters, native text/code, working flashcards, and isolated bookmarks/ratings");

  for (const id of ["html-css", "javascript"]) {
    await chooseCertification(id);
    for (const q of banks[id].questions) {
      await nav("Chapters");
      await page.getByRole("searchbox").fill(q.prompt);
      await page.getByRole("button", { name: "Study this card", exact: true }).click();
      await page.locator(".flash-front h2").waitFor();
      assert.equal(await page.locator(".flash-front h2").textContent(), q.prompt);
      assert.equal(await page.locator(".flash-card img").count(), 0);
      assert.equal(await page.locator(".flash-card .answer-key").count(), 0);
      if (q.exhibit) assert.equal(await page.locator(".flash-card .code-exhibit code").first().textContent(), q.exhibit);
      if (q.type === "matching") assert.deepEqual(await page.locator(".recall-prompts li").allTextContents(), q.pairs.map(pair => pair.left));
      if (q.options.length) assert.equal(await page.locator(".flash-options p, .flash-front .quiz-option").count(), q.options.length);
      assert.equal(await page.locator(".code-exhibit img, .code-exhibit script, .code-exhibit iframe").count(), 0);
      await page.getByRole("button", { name: "Reveal answer", exact: true }).click();
      await page.locator(".flash-answer .answer-key").waitFor();
      if (q.answerExhibit) assert.equal(await page.locator(".flash-answer .code-exhibit code").textContent(), q.answerExhibit);
      if (q.type === "matching") assert.deepEqual(await page.locator(".answer-pairs dd").allTextContents(), q.pairs.map(pair => pair.right));
      assert.equal(await page.locator(".flash-card img").count(), 0);
    }
  }
  pass("All 45 exercises expose complete native prompts, code, choices, and answers without screenshots or executing markup");

  for (const id of ["html-css", "javascript"]) {
    await chooseCertification(id);
    await nav("Practice quizzes");
    await page.getByRole("button", { name: "All available", exact: true }).click();
    await page.getByRole("button", { name: "Start practice", exact: true }).click();
    const seen = [];
    while (true) {
      await page.locator(".quiz-question > h2").waitFor();
      const label = await page.locator('.quiz-question .flash-card-header button[aria-label*="question"]').getAttribute("aria-label");
      const q = banks[id].questions.find(q => q.number === Number(label.match(/question (\d+)/)[1]));
      assert.equal(q.status, "standard");
      seen.push(q.id);
      if (q.type === "matching") for (const pair of q.pairs) {
        if (pair.options) assert.deepEqual(await page.locator(`#match-${pair.id} option`).allTextContents(), ["Choose a match…", ...pair.options]);
        await page.locator(`#match-${pair.id}`).selectOption(pair.acceptedAnswers?.at(-1) ?? pair.right);
      }
      else for (const answer of q.correctIds) {
        const index = q.options.findIndex(o => o.id === answer);
        if (q.type === "ordering") await page.locator(".quiz-option").getByText(q.options[index].text, { exact: true }).click();
        else await page.getByRole("button", { name: new RegExp(`^${answer.toUpperCase()} `) }).click();
      }
      await page.getByRole("button", { name: "Submit answer", exact: true }).click();
      await page.getByRole("heading", { name: "You’ve got it.", exact: true }).waitFor();
      assert.equal(await page.locator(".match-wrong").count(), 0);
      assert.equal(await page.locator(".answer-key .eyebrow").textContent(), "REVIEWED ANSWER");
      const finish = page.getByRole("button", { name: "See results", exact: true });
      if (await finish.count()) { await finish.click(); break; }
      await page.getByRole("button", { name: "Next question", exact: true }).click();
    }
    assert.equal(seen.length, banks[id].questions.filter(q => q.scorable).length);
    assert.equal(new Set(seen).size, seen.length);
    const saved = await readState(id);
    assert.equal(saved.sessions[0].correct, seen.length);
    assert.equal(saved.sessions[0].total, seen.length);
    pass(`${id}: every standard item grades correctly in a complete shuffled quiz`);
  }

  await nav("Your progress");
  const js = await readState("javascript");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup", exact: true }).click();
  await (await downloadPromise).saveAs("test-results/javascript-backup.json");
  await chooseCertification("html-css");
  await nav("Your progress");
  await page.getByLabel("Choose a study backup").setInputFiles("test-results/javascript-backup.json");
  await page.getByRole("status").filter({ hasText: /different certification/ }).waitFor();
  assert.equal((await readState("html-css")).cards["html-css-q002"], "known");
  assert.deepEqual(await readState("javascript"), js);
  await chooseCertification("ccst");
  assert.deepEqual((await readState("ccst")).bookmarks, ["q017"]);
  assert.equal((await readState("ccst")).cards.q001, "known");
  pass("Legacy CCST progress survives switching; certification-mismatched backup is rejected without writes");

  await chooseCertification("javascript");
  await page.reload();
  await page.waitForFunction(() => document.querySelector('select[aria-label="Certification"]')?.value === "javascript");
  assert.equal((await readState("javascript")).sessions[0].correct, js.sessions[0].correct);
  await page.screenshot({ path: "test-results/javascript-desktop.png", fullPage: true, animations: "disabled" });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await nav("Flashcards");
  const code = page.locator(".flash-card .code-exhibit pre").first();
  await code.scrollIntoViewIfNeeded();
  assert.ok((await code.textContent()).includes('document.getElementById("tester")'));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Code scrolls inside the card");
  assert.equal(await page.locator(".flash-card img").count(), 0);
  await page.screenshot({ path: "test-results/javascript-text-mobile.png", fullPage: true, animations: "disabled" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/javascript-text-desktop.png", fullPage: true, animations: "disabled" });
  assert.deepEqual(screenshotRequests, []);
  pass("Mobile code stays readable in its own scroll area; the study flow makes no screenshot requests");
  assert.deepEqual(errors, []);
  writeFileSync("test-results/certifications-report.json", JSON.stringify({ passed: report, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: "test-results/certifications-failure.png", fullPage: true }).catch(() => {});
  console.error(await page.locator("body").innerText().catch(() => "No page"));
  throw error;
} finally { await browser.close(); }
