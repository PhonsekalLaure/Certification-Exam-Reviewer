# HTML & CSS and JavaScript answer-key review

Reviewed on 2026-11-26 against the displayed code, MDN documentation, and executable examples. This is a local educational audit, not an official certification answer key. The original PDFs are unchanged.

All 45 exercises are now included in standard practice. **Corrected** identifies a repaired key or code error. **Adapted** identifies rewritten ambiguous wording or completed clipped exercises. Missing source text has not been represented as recovered text. **Verified** retains the key with a reviewed explanation. Some verified prompts have minor precision edits.

Source-era keys are archived in `scripts/source_reviewer_keys.json`; generated review metadata also retains original keys for corrected/adapted items. Regenerate with `python scripts/import_text_reviewers.py`. Existing question IDs and browser storage remain stable. Previous attempts lack individual selections, so historical scores are retained without retrospective regrading; new attempts use the reviewed keys.

## Audit results

### HTML & CSS

| Question | Review | Reviewed answer / reason |
| --- | --- | --- |
| 1 | Adapted | With no base element, a path-relative URL is resolved against the current document URL and keeps its server. images/logo.png cannot name another server. A network-path reference beginning //host is a different form and is outside this explicitly scoped question. |
| 2 | Adapted | img embeds the image, src identifies its resource, and alt supplies the text alternative. alt is useful when the image cannot be rendered and for assistive technology; a particular pre-download visual display is not guaranteed. |
| 3 | Verified | Use a:link for unvisited links, a:visited for visited links, a:hover for pointer hover, and a:active for activation. Keeping these equal-specificity rules in link, visited, hover, active order lets the interactive states override earlier colors. |
| 4 | Verified | No author CSS is supplied, so the browser uses its default stylesheet. User styles and browser preferences can also affect rendering. |
| 5 | Verified | The inline paragraph color is blue. The later internal h1 rule makes Awards maroon and the h2 rule makes Rock Climbing 101 blue. The unstyled paragraph uses black from the internal rule, which follows the external rule of equal specificity. |
| 6 | Corrected | Green is correct. The .light p selector directly sets the paragraph background and is more specific than p. Pink belongs to the enclosing div; background-color is not inherited. This corrects the PDF key, Pink. |
| 7 | Verified | The universal selector * matches every element. The other choices are combinators or an incomplete pseudo-class prefix. |
| 8 | Verified | h1 selects all h1 elements; text-align: center centers their inline content. |
| 9 | Adapted | CSS comments use /* ... */. em does not always refer to the root font size; rem does. Percentage references depend on the property and context, so width: 50% is not always half the viewport. A font-family fallback list helps when the preferred font is unavailable. These statements replace ambiguous source generalizations. |
| 10 | Corrected | Line 02 matches #style1, giving red text at 30px. Line 03 has no overriding color rule and inherits purple from body. The source final selection, red, is corrected to purple. |
| 11 | Verified | The doctype precedes html. The title belongs inside head; the visible greeting belongs inside body. Close each element in nesting order. |
| 12 | Corrected | The declaration is <!DOCTYPE html>, so the first blank inside angle brackets is !DOCTYPE html. html encloses head and body; Hello World belongs in body. The PDF misplaced the exclamation mark. A fixed head and title have been added to make the exercise complete. |
| 13 | Adapted | A head section can contain charset metadata and a title. This exercise explicitly requires charset before title, giving a unique order. The doctype belongs before html, header belongs in body, and </head> closes head. The malformed source diagram has been replaced with an adapted, complete exercise. |
| 14 | Adapted | link with rel="stylesheet" loads the CSS file; script with src loads JavaScript; title names the browser tab; noscript supplies fallback content when scripting is disabled. meta cannot link a stylesheet. Missing source choices and targets have been replaced with a complete adapted exercise. |
| 15 | Corrected | Use SmallLogo.png as the default, then min-width: 768px to switch to NormalLogo.png at 768px and above. A max-width query would reverse the requirement, including its boundary. The key now covers 767px, 768px, and wider viewports. |
| 16 | Adapted | Both spans explicitly use display: inline. A following paragraph can wrap beside a floated image and is not forced entirely below it. clear: both on the final paragraph moves it below preceding floats. Valid markup and explicit layout rules replace the source’s malformed, underspecified exhibit. |
| 17 | Corrected | The corrected .productBox selector matches the displayed div. #000000 is black and #00FF00 is green. The source’s .product versus productBox mismatch has been repaired; answer C remains correct. |
| 18 | Corrected | Use color, line-height, font-size, and font-style. #0000ff is valid blue; the source’s five-digit #000ff was invalid. The font size 1.5em is relative to the inherited font size, whereas line-height is explicitly 50px. |
| 19 | Corrected | #0000FF is blue, not red. repeat-x requests horizontal repetition and right positions the background image at the right edge. The second statement is now precise and true, correcting the source’s second No. |
| 20 | Adapted | Absolute positioning removes the element from normal flow. In this stated setup, offsets are measured from its nearest positioned ancestor’s containing block. Relative positioning instead offsets an element from its normal position and preserves its flow space. The source’s vague wording and Relative key have been corrected. |
| 21 | Verified | color sets blue, font-family selects Arial, font-size sets 20px, font-weight makes the text bold, and text-align centers inline content. |
| 22 | Adapted | Use img with src="contoso.png" and alt="Contoso Logo". alt is the image’s text alternative; title is advisory information and is not a substitute. |
| 23 | Verified | video controls provides the playback controls. A nested source points to HowTo.mp4 with MIME type video/mp4. The closing tag is video. Fallback child text is for browsers without video-element support; it is not a general codec-error message. |
| 24 | Adapted | Use img, src, and alt. HTML Icon is the text alternative explicitly required in the source prompt; the clipped attribute value is completed from that requirement. How and when alternative text appears visually depends on the browser. |

### JavaScript

| Question | Review | Reviewed answer / reason |
| --- | --- | --- |
| 1 | Corrected | Read the input’s value and the paragraph’s innerHTML, then call toLowerCase() on both strings. The paragraph is explicitly plain text here. This corrects the source’s invalid value/innerHTML selections in the normalization blanks. For arbitrary text content, textContent is preferable to serializing markup. |
| 2 | Verified | Reassigning the student parameter does not change sampleStudent. Mutating the object through course changes sampleCourse.name and grade. The final values are HTML Student, JavaScript, and 100. |
| 3 | Verified | shift removes 20, pop removes 80, push adds 10 at the end, and unshift adds 100 at the front. The final array is [100, 40, 60, 10]. |
| 4 | Corrected | The outputs are undefined, string, object, number, object. Arrays are objects: typeof does not return array. typeof null also returns object, a longstanding JavaScript behavior. Use Array.isArray when you need an array-specific test. |
| 5 | Verified | toFixed(digits) returns a string formatted with the specified number of decimal places for the stated range. toPrecision counts significant digits and toString interprets its argument as a radix. Binary floating-point representation can affect rounding. |
| 6 | Verified | The outer multiply reads 25 and 4, returning 100. When getProduct is invoked, its nested multiply reads the local 2 and 3, returning 6. Merely declaring getProduct does not execute its body. |
| 7 | Corrected | Both new Date() and new Date create a current Date when no arguments are passed, so both first-row choices are accepted. Date() without new returns a string. getMonth() reads the zero-based local month and setMonth(month + value) adjusts it. End-of-month overflow follows Date rules rather than clamping to the last day. |
| 8 | Corrected | Initialize numbers with [], append with push, advance j using j+2, and add numbers[j]. j = j++ restores the old value and can prevent termination. array[j] refers to a different, undeclared name. The corrected loop sums indices 0, 2, 4, 6, and 8. |
| 9 | Verified | The quoted destination is a String, 2489.58 is a Number, and true is a Boolean. These answer labels name the types; typeof would return lowercase strings. |
| 10 | Verified | Math.ceil rounds upward to 101, Math.floor rounds downward to 100, and Math.round(100.5) returns 101. |
| 11 | Adapted | Numeric Date months are zero-based: January is 0. Use 2017 for the year and 1 for the day. The clipped day argument has been supplied from the prompt’s explicit January 1 requirement. |
| 12 | Verified | && requires both warm weather and no rain. Only when that condition fails does the <= .5 fuel check choose the train; more fuel selects driving. |
| 13 | Verified | age < 5 &#124;&#124; age >= 65 covers both free groups. age >= 5 && age < 18 covers ages 5 through 17. The remaining ages keep the default price of 20. |
| 14 | Verified | switch (day) selects a branch; case "Wednesday": assigns 0.1 and break exits the switch. default: returns a zero discount for other strings. |
| 15 | Adapted | for traverses the supplied list, continue skips a null entry, and break stops at orange. The array is now an explicit function parameter and the clipped loop header is completed with a local index and i++; these are labeled adaptations, not recovered source text. |
| 16 | Corrected | Initialize i to start, test i >= 0, and decrement with --i. The source’s i > 0 omitted zero. The stated nonnegative integer input makes the endpoint behavior well defined. |
| 17 | Adapted | Use switch (month) and break after both completed cases. continue cannot end a switch case when no enclosing loop exists. The adapted function completes the clipped source with a 31-day default and a return; month indices are 0–11 and leap years are explicitly ignored. |
| 18 | Verified | Both statements are No. denominator = 0 assigns a falsy value, so the shown function always takes else and returns true. For the stated numeric inputs, denominator === 0 would implement the intended check; != would invert the intended test. |
| 19 | Verified | With x = 5 and y = 7, both comparisons joined by && are true; neither equality joined by &#124;&#124; is true; x !== 7 is true; and negating x == y gives true. |
| 20 | Adapted | prompt requests text (or returns null on cancel), alert displays an informational message, and confirm requests an OK/Cancel decision returning a Boolean. The PDF’s clipped scenarios have been replaced with these explicitly authored scenarios. |
| 21 | Verified | try protects the invocation and catch handles its thrown exception. The requested message is shown for any caught exception; it does not prove that a missing function was the cause. eval remains only as literal study code and is never run by the reviewer UI. |

## References

- [Resolving relative references](https://developer.mozilla.org/en-US/docs/Web/API/URL_API/Resolving_relative_references)
- [Window.prompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt)
- [CSS cascade and specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity)
- [Media-query width](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/width)
- [CSS background](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background)
- [CSS clear](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clear)
- [CSS positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position)
- [CSS hexadecimal colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/hex-color)
- [CSS length units](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length)
- [HTML head element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/head)
- [Image text alternatives](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)
- [HTML video element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video)
- [JavaScript guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration)
- [Date constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)
- [String.toLowerCase](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLowerCase)
- [JavaScript typeof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof)

## Verification

- Unit tests execute the bank’s filled JavaScript with a one-second timeout and independently specified expected outputs, including all 12 months, age/fuel boundaries, both accepted Date constructions, null skipping, and countdown zero.
- An isolated Chrome test checks actual CSS computed styles, float/clear geometry, 767/768/1024px backgrounds, and completed markup parsing. The application never executes study exhibits.
- The full browser flow covers every flashcard and all 45 standard quiz questions, including accepted alternate grading, per-row feedback, certification isolation, browser persistence, and legacy CCST data.
- CCST content and its source-key eligibility policy are unchanged.
