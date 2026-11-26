# Certification Study Room

A personal certification reviewer built with Next.js, React, TypeScript, Tailwind CSS, and a shadcn/ui Button. The app exports as a static website. No database, login, Supabase, analytics, or runtime API is required.

## Local use

Use Node.js 24 LTS. Run `npm install` once, then `npm run dev` and open http://127.0.0.1:3000.

For the static version, run `npm run build`, then `npm run preview`. The dependency-free preview serves `out/` on this device. Any static host can serve that output directory. Stop one local server before starting the other on the same port.

## Certifications

Choose a certification in the header. Chapters, flashcards, practice, bookmarks, and progress are scoped to that certification. Selection is remembered in the browser. New question banks load when selected; questions and code are rendered directly as text.

| Set | Source items | Chapters | Source files |
| --- | ---: | ---: | --- |
| CCST Cybersecurity | 179 | 7 | CCST_Cybersecurity_Reviewer_2026_NEW.docx.pdf |
| HTML & CSS | 24 | 6 | HTML and CSS 1.pdf; HTML and CSS 2.pdf |
| JavaScript | 21 | 6 | JavaScript.pdf |

The documents live in the adjacent `Certification Exam Reviewer Documents` directory. Both HTML/CSS documents contain the same 24 numbered exercises; they are one study set with references to both files. Original question numbers are retained. Chapters are study groupings, not an official exam blueprint. Source exam codes label the supplied materials; the app makes no claim about current certification availability.

All 45 HTML/CSS and JavaScript exercises are native text: prompts, code blocks, statements, dropdown options, ordering choices, answer keys, and explanations. HTML/CSS/JavaScript source text is rendered as escaped React content and is never executed. No screenshots or OCR transcripts are loaded by the study interface. Code blocks preserve whitespace and can scroll horizontally on small screens. Numbered tokens such as [1] identify blanks; flashcards show the response prompts without revealing their answers.

The source transcriptions are in `scripts/text_reviewer_content.py`; explicit key corrections and adapted exercises are in `scripts/reviewed_answers.py`. `scripts/import_text_reviewers.py` rebuilds the two JSON banks without PDF, OCR, or image dependencies. `scripts/source_reviewer_keys.json` preserves the previous source-era keys for audit and deterministic regeneration. Source question IDs, numbering, pages, and certification storage keys are retained.

All **24 HTML/CSS and 21 JavaScript** exercises now use reviewed answers and are included in standard practice. Incorrect keys are corrected. Clipped or ambiguous exercises have complete, explicitly adapted wording; these carry an Adapted label and explain the changes. Answer panels link to documentation and distinguish reviewed answers from original source answers. Both valid `new Date()` / `new Date` first-row answers are accepted. See `docs/answer-key-review.md` for the audit.

CCST remains separate: 136 standard questions by default, with its original source caveats and optional study-note items. All 224 items remain available as flashcards. Practice scores are learning feedback, not an exam-readiness prediction.

## Answering and learning progress

Multiple-choice flashcards and practice questions let learners select a letter or its full answer row, change their selection, and explicitly submit. Multi-answer questions allow several selections. Submitted choices lock while the answer and explanation appear. Revealing a flashcard without submitting keeps the self-rating flow and does not add a graded attempt.

A live counter stays visible while scrolling: **Correct**, **Needs learning**, and **Not answered**. Flashcards count the latest submitted result per question within the selected deck, so correcting a mistake moves it between categories without counting it twice. Practice counts submissions within the current session, including the final question. Answers save to the existing certification-specific browser storage.

## Browser data and compatibility

Progress is private to the current browser profile and site origin. It does not sync between devices. Export a backup in Your progress before clearing site data or switching browsers.

- The existing `ccst-study-room:v1` key and CCST question IDs are retained, so prior progress and version-1 backups keep working.
- HTML/CSS uses `studyroom:html-css:v1`; JavaScript uses `studyroom:javascript:v1`. New question IDs are certification-prefixed.
- Backups identify their certification. Import validates both identity and question IDs before asking to replace anything. Import and reset affect only the selected certification, including when the backup is empty.
- Ratings, bookmarks, checked-answer totals, last flashcard position, and up to 100 completed practice sessions are stored. Unfinished quiz order is not resumed after leaving the view or reloading.
- Storage failures show a notice and keep changes in memory for the session. Corrupt stored data and incompatible backups are handled without breaking study. Other tabs receive storage updates.

Existing attempt totals and completed scores are retained. Earlier selections were not stored, so old scores cannot be regraded; new attempts use the reviewed keys. Bookmarks and flashcard ratings remain compatible.

There is no service worker; offline access is not guaranteed.

## Checks

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

`scripts/answer-flow-browser-check.mjs` checks keyboard selection, submission guards, multi-answer toggling, live and persisted counters, correction of mistakes, certification isolation, and responsive answer controls at 320–1440px. `scripts/browser-check.mjs` exercises the original CCST flow. `scripts/certifications-browser-check.mjs` verifies all standard HTML/CSS and JavaScript quiz items, native text/code rendering and screenshot-free study flows, switch persistence, legacy CCST data, progress isolation, and wrong-certification backup rejection. `scripts/verify-reviewed-answers.mjs` independently checks the repaired CSS/HTML in Chrome, including computed styles, float geometry, and breakpoint boundaries. `tests/reviewed-answers.test.ts` executes JavaScript examples with timeouts and independently specified expected outputs and boundary cases. The browser scripts use the desktop’s bundled Playwright by default; another installation can be supplied through `PLAYWRIGHT_MODULE`. `BASE_URL` selects the preview origin.

`scripts/progress-regression-browser-check.mjs` checks progress updates made in another tab while a certification is inactive, removed progress, resume after shuffling, and preservation of session-only progress when browser storage is blocked. It uses the same `BASE_URL` and `PLAYWRIGHT_MODULE` settings as the other browser checks.

`scripts/startup-navigation-browser-check.mjs` checks delayed and failed saved-certification downloads, startup with unavailable browser storage, and shared button/arrow-key flashcard navigation, including question focus, answer reset, saved position, and deck boundaries.

## Updating source content

Run `python scripts/import_text_reviewers.py` after editing a reviewed transcription in `scripts/text_reviewer_content.py`. This authoring command requires only Python’s standard library. It is idempotent: it restores the archived source-era keys, applies transcription, then applies the explicit audit in `scripts/reviewed_answers.py`. Edit that audit for deliberate key changes and document why. Do not edit generated JSON alone or overwrite the archived source-era keys.

`scripts/import_pdf.py` imports the CCST PDF and checks its separate quick-answer key. The older `scripts/import_visual_reviewers.py` is now an archival inspection helper: it renders/OCRs the supplied PDFs into `tmp/reviewer-import`, including reference-only banks and contact sheets. It does not replace the website’s text banks or publish images. That archival helper requires pypdf/Pillow, Poppler, and English Windows OCR.

The generated screenshots previously used by the app are archived under `docs/source-exhibits/`, outside the published `public` directory. The original PDFs remain in the sibling documents folder.
