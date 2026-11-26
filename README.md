# Certification Study Room

A personal certification reviewer built with Next.js, React, TypeScript, Tailwind CSS, and a shadcn/ui Button. The app exports as a static website. No database, login, Supabase, analytics, or runtime API is required.

## Local use

Use Node.js 24 LTS. Run `npm install` once, then `npm run dev` and open http://127.0.0.1:3000.

For the static version, run `npm run build`, then `npm run preview`. The dependency-free preview serves `out/` on this device. Any static host can serve that output directory. Stop one local server before starting the other on the same port.

## Certifications

Choose a certification in the header. Chapters, flashcards, practice, bookmarks, and progress are scoped to that certification. Selection is remembered in the browser. New question banks load when selected; source exhibits use native lazy loading.

| Set | Source items | Chapters | Source files |
| --- | ---: | ---: | --- |
| CCST Cybersecurity | 179 | 7 | CCST_Cybersecurity_Reviewer_2026_NEW.docx.pdf |
| HTML & CSS | 24 | 6 | HTML and CSS 1.pdf; HTML and CSS 2.pdf |
| JavaScript | 21 | 6 | JavaScript.pdf |

The documents live in the adjacent `Certification Exam Reviewer Documents` directory. Both HTML/CSS documents contain the same 24 numbered exercises; they are one study set with references to both files. Original question numbers are retained. Chapters are study groupings, not an official exam blueprint. Source exam codes label the supplied materials; the app makes no claim about current certification availability.

All 45 HTML/CSS and JavaScript exercises are native text: prompts, code blocks, statements, dropdown options, ordering choices, answer keys, and explanations. HTML/CSS/JavaScript source text is rendered as escaped React content and is never executed. No screenshots or OCR transcripts are loaded by the study interface. Code blocks preserve whitespace and can scroll horizontally on small screens. Numbered tokens such as [1] identify blanks; flashcards show the response prompts without revealing their answers.

The reviewed transcriptions are in `scripts/text_reviewer_content.py`; `scripts/import_text_reviewers.py` rebuilds the two JSON banks without PDF, OCR, or image dependencies. Original source-page references and stable question/option/pair IDs are retained. Cosmetic spacing and instructions are adapted for the web controls. Clipped portions are explicitly identified. Educational reconstructions for incomplete source keys are labeled Concept reference and remain study-only.

Some supplied keys are incomplete or incorrect. These items have visible notes and are excluded from standard practice. The optional study-notes filter admits qualified keys and explicitly grades against the retained source key; incomplete source items always remain study-only. The detailed transcription exposed additional source problems, so standard practice now includes 136 CCST, 11 HTML/CSS, and 14 JavaScript items. All 224 items remain available as flashcards. Practice scores are learning feedback, not an exam-readiness prediction.

## Browser data and compatibility

Progress is private to the current browser profile and site origin. It does not sync between devices. Export a backup in Your progress before clearing site data or switching browsers.

- The existing `ccst-study-room:v1` key and CCST question IDs are retained, so prior progress and version-1 backups keep working.
- HTML/CSS uses `studyroom:html-css:v1`; JavaScript uses `studyroom:javascript:v1`. New question IDs are certification-prefixed.
- Backups identify their certification. Import validates both identity and question IDs before asking to replace anything. Import and reset affect only the selected certification, including when the backup is empty.
- Ratings, bookmarks, checked-answer totals, last flashcard position, and up to 100 completed practice sessions are stored. Unfinished quiz order is not resumed after leaving the view or reloading.
- Storage failures show a notice and keep changes in memory for the session. Corrupt stored data and incompatible backups are handled without breaking study. Other tabs receive storage updates.

There is no service worker; offline access is not guaranteed.

## Checks

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

`scripts/browser-check.mjs` exercises the original CCST flow. `scripts/certifications-browser-check.mjs` verifies all standard HTML/CSS and JavaScript quiz items, native text/code rendering and screenshot-free study flows, switch persistence, legacy CCST data, progress isolation, and wrong-certification backup rejection. The browser scripts use the desktop’s bundled Playwright by default; another installation can be supplied through `PLAYWRIGHT_MODULE`. `BASE_URL` selects the preview origin.

## Updating source content

Run `python scripts/import_text_reviewers.py` after editing a reviewed transcription in `scripts/text_reviewer_content.py`. This authoring command requires only Python’s standard library. It is idempotent and retains the existing question IDs and original marked answer keys. To change a key deliberately, edit the bank and document why; do not silently turn a flawed source key into a different answer.

`scripts/import_pdf.py` imports the CCST PDF and checks its separate quick-answer key. The older `scripts/import_visual_reviewers.py` is now an archival inspection helper: it renders/OCRs the supplied PDFs into `tmp/reviewer-import`, including reference-only banks and contact sheets. It does not replace the website’s text banks or publish images. That archival helper requires pypdf/Pillow, Poppler, and English Windows OCR.

The generated screenshots previously used by the app are archived under `docs/source-exhibits/`, outside the published `public` directory. The original PDFs remain in the sibling documents folder.
