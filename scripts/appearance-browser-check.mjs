import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1123-915-0_26.1123.915.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright");
const baseURL = process.env.BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1512, height: 1050 }, colorScheme: "light" });
const errors = [];
context.on("page", page => page.on("pageerror", e => errors.push(e.message)));
const page = await context.newPage();
page.setDefaultTimeout(12000);
mkdirSync("test-results/appearance", { recursive: true });
const nav = name => page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
const theme = value => page.getByRole("combobox", { name: "Color theme" }).selectOption(value);
const expectTheme = (target, value) => target.waitForFunction(value => document.documentElement.dataset.theme === value, value);
const screenshot = async name => {
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0,0); });
  await page.screenshot({ path: "test-results/appearance/" + name + ".png", fullPage: true, animations: "disabled" });
};

async function contrastCheck(label) {
  const failures = await page.evaluate(() => {
    const luminance = rgb => rgb.slice(0,3).map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((s,n,i) => s + n * [.2126,.7152,.0722][i],0);
    const parse = color => color.match(/[\d.]+/g)?.map(Number);
    const selectors = [".button", ".nav-item", ".eyebrow", ".focus-panel h2", ".focus-panel p", ".focus-subject", ".focus-actions > span", ".stats-grid > div > span", ".stats-grid p", ".chapter-card h3", ".chapter-card p", ".chapter-card-top > span:nth-child(2)", ".chapter-card-bottom", ".map-footnote", ".chapter-section-note", ".practice-footnote", ".study-tip > span:last-child", ".badge", ".page-heading p", ".counter-note", ".deck-position", ".option-letter", ".quiz-option", ".learning-counts div > span", ".source-reference", ".code-exhibit pre", ".answer-instruction"];
    const issues = [];
    for (const selector of selectors) for (const element of document.querySelectorAll(selector)) {
      const disabled = element.closest("button:disabled");
      if (!element.getClientRects().length || (disabled && !disabled.classList.contains("quiz-option"))) continue;
      const style = getComputedStyle(element);
      const fg = parse(style.color);
      let ancestor = element, bg;
      while (ancestor) {
        const color = parse(getComputedStyle(ancestor).backgroundColor);
        if (color && (color.length < 4 || color[3] === 1)) { bg = color; break; }
        ancestor = ancestor.parentElement;
      }
      if (!fg || !bg) continue;
      const a = luminance(fg), b = luminance(bg), ratio = (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      const min = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700) ? 3 : 4.5;
      if (ratio + .01 < min) issues.push({selector,text:element.textContent.slice(0,60),ratio:Number(ratio.toFixed(2)),min});
    }
    return issues;
  });
  if (failures.length) console.log("CONTRAST", label, JSON.stringify(failures));
  return failures;
}

try {
  await page.goto(baseURL);
  await page.getByRole("heading", { name: /Build confidence/ }).waitFor();
  await expectTheme(page, "light");
  const contrast = [];
  await screenshot("overview-light");
  contrast.push(...await contrastCheck("overview-light"));
  await theme("dark");
  await expectTheme(page, "dark");
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), "dark");
  await screenshot("overview-dark");
  contrast.push(...await contrastCheck("overview-dark"));
  await page.reload();
  await page.getByRole("combobox", { name: "Color theme" }).waitFor();
  assert.equal(await page.getByRole("combobox", { name: "Color theme" }).inputValue(), "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expectTheme(page, "dark");
  await theme("system");
  await expectTheme(page, "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expectTheme(page, "dark");
  const other = await context.newPage();
  await other.goto(baseURL);
  await other.getByRole("combobox", { name: "Color theme" }).waitFor();
  await theme("light");
  await expectTheme(other, "light");
  await other.close();
  console.log("PASS: Light/dark preference persists, follows the system when selected, and synchronizes across tabs");

  for (const value of ["light", "dark"]) {
    await theme(value);
    await nav("Chapters");
    assert.equal(await page.locator(".chapter-card").count(), 7);
    await screenshot("chapters-" + value);
    contrast.push(...await contrastCheck("chapters-" + value));
    await nav("Bookmarks");
    await screenshot("bookmarks-" + value);
    await nav("Flashcards");
    await screenshot("flashcards-" + value);
    contrast.push(...await contrastCheck("flashcards-" + value));
    await page.locator(".quiz-option").first().click();
    await page.getByRole("button", { name: "Submit answer", exact: true }).click();
    await page.locator(".quiz-feedback").waitFor();
    await page.locator(".answer-sources > summary").click();
    await screenshot("feedback-" + value);
    contrast.push(...await contrastCheck("feedback-" + value));
    await nav("Practice quizzes");
    await screenshot("practice-setup-" + value);
    await page.getByRole("button", { name: "Start practice", exact: true }).click();
    await screenshot("practice-session-" + value);
    contrast.push(...await contrastCheck("practice-" + value));
    await page.getByRole("button", { name: "Discard session", exact: true }).click();
    await screenshot("dialog-" + value);
    await page.getByRole("dialog").getByRole("button", { name: "Discard session", exact: true }).click();
    await nav("Your progress");
    await screenshot("progress-" + value);
    contrast.push(...await contrastCheck("progress-" + value));
    await nav("Overview");
    await screenshot("returning-overview-" + value);
    await page.getByRole("combobox", { name: "Certification", exact: true }).selectOption("javascript");
    await nav("Flashcards");
    await screenshot("code-" + value);
    contrast.push(...await contrastCheck("code-" + value));
    await page.getByRole("combobox", { name: "Certification", exact: true }).selectOption("ccst");
    for (const width of [1440,1024,768,390,320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, value + " overflow at " + width);
    }
    await page.setViewportSize({ width: 1512, height: 1050 });
  }
  assert.deepEqual(contrast, [], "Representative UI text meets WCAG AA contrast");
  console.log("PASS: Every study view, feedback, code, and dialogs render in both themes without horizontal overflow");

  const boot = await browser.newContext({ colorScheme: "dark" });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await boot.route("**/_next/static/chunks/**.js", async route => { await gate; await route.continue(); });
  const bootPage = await boot.newPage();
  await bootPage.goto(baseURL, { waitUntil: "commit" });
  try {
    await expectTheme(bootPage, "dark");
    assert.equal(await bootPage.getByRole("navigation").count(), 0, "Theme is applied before hydration");
  } finally { release(); }
  await bootPage.getByRole("combobox", { name: "Color theme" }).waitFor();
  await boot.close();
  const blocked = await browser.newContext({ colorScheme: "dark" });
  await blocked.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error("blocked"); };
    Storage.prototype.setItem = () => { throw new Error("blocked"); };
  });
  const blockedPage = await blocked.newPage();
  await blockedPage.goto(baseURL);
  await expectTheme(blockedPage, "dark");
  await blockedPage.getByRole("combobox", { name: "Color theme" }).selectOption("light");
  await expectTheme(blockedPage, "light");
  await blocked.close();
  assert.deepEqual(errors, []);
  console.log("PASS: Appearance initializes before hydration and remains usable with unavailable browser storage");
} finally { await browser.close(); }
