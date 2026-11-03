# Storage use: a Settings display, a warning threshold, and the 4,000-answer limit

Proposal for Louis's approval (2026-11-03). Nothing here is built yet. Louis's instructions of 2026-11-03: "Keep every backup unless I explicitly delete it. Prepare the storage-usage display and warning proposal separately; recommend a threshold based on measured usage and storage behavior." and "Track the 4,000-answer limitation now and recommend when to address it, so we do not discover it only after it affects a profile."

## 1. What was measured

**Characters stored per answer.** The Medicinal-chemistry page as built at d7331be (its live build from 2026-11-01 until the kit update of 2026-11-03; the repository's `index.html`, opened from disk in Chromium) recorded answers through its own `record()`. The table gives the stored lengths, in characters, of the progress (`phar4342final:data:me`) and the answer history (`phar4342final:log:me`) after each number of answers (script: `review/storage-measure/measure.js`; 479 questions, every seventh question in turn).

| Answers recorded | Answers kept | Progress | History |
|---|---|---|---|
| 0 | 0 | 138 | 0 |
| 100 | 100 | 28,671 | 8,600 |
| 500 | 500 | 128,854 | 43,091 |
| 1,000 | 1,000 | 187,920 | 86,179 |
| 2,000 | 2,000 | 307,948 | 172,458 |
| 4,000 | 4,000 | 545,497 | 344,833 |
| 5,000 | 4,000 | 546,993 | 431,082 |

From these rows (arithmetic checked):
- The progress grows by (545,497 − 307,948) / 2,000 = 119.5 characters per answer between 2,000 and 4,000 answers, and stops growing at 4,000 answers (`ANSWERS_MAX` in `core/shell.html`): 546,993 characters at 5,000.
- The history grows by (431,082 − 344,833) / 1,000 = 86.2 characters per entry and keeps up to 20,000 entries (`LOG_MAX` in `core/shell.html`), which is 86.249 × 20,000 = 1,724,980 characters at that rate.
- Each copy Import or Put back keeps is one copy of the progress: at most 546,993 characters.

**The limit.** In Chromium 153 (Playwright), one origin served over HTTP accepted 5,242,873 characters of keys and values before `setItem` threw `QuotaExceededError` (`review/storage-measure/quota.js`). MDN states that browsers "can store up to 5 MiB of local storage ... per origin"<sup>1</sup>. Safari on an iPhone or iPad was not measured: NOT RUN.

**Shared by every drill.** Every drill site is on the one origin lglouis3-create.github.io, so all of them (Medicinal-chemistry, Pharmacokinetics, BDK, Intro to Pharmacology) share that one limit.

## 2. What this means

- One profile at both caps takes 546,993 + 1,724,980 = 2,271,973 characters, which is 43% of 5,242,873.
- That leaves 5,242,873 − 2,271,973 = 2,970,900 characters, room for 5 full-size copies (2,970,900 / 546,993 = 5.4), and less when other drills on the site hold progress too.
- When the limit is reached, the browser refuses saves. Every drill on the core then keeps the change on the page, says that it was not saved, and points to Export progress (`saveWarn`).
- Nothing is deleted automatically, by Louis's rule.

## 3. Recommendation

**Settings shows, for this browser:**
- the characters the whole site stores (all keys of the origin, every drill) against 5,242,880 (5 MiB), as a percentage;
- this drill's share, split into progress, history and the copies Import keeps, with the number of copies.

**A warning,** on Study and in Settings, when the site's total passes **4,148,887 characters (79%)**. Reasoning: 5,242,873 − 2 × 546,993 = 4,148,887, so the warning appears while at least two more full-size copies still fit. That is two more Import replaces or Put backs before a save can be refused. The warning:
- names the largest items;
- offers Export progress;
- offers "Delete the copies kept by Import", which deletes only after Louis confirms it, as today.

**What this needs from Louis:** approval of the display, the 79% threshold, and the wording.

**Not measured:** Safari's real limit on an iPhone or iPad, and whether Safari counts characters or bytes. The display would read the real stored lengths, so it stays correct either way. The threshold assumes the 5 MiB that MDN gives for every browser.

## 4. The 4,000-answer limit (tracked)

**What happens.** A profile keeps its latest 4,000 answers (`ANSWERS_MAX`). Past that, its list no longer shows where it began. Each round trip of a file between two devices then makes a new profile instead of a replace (#32, design choice 4). No answer is lost: the new profile holds the file's answers.

**When to address it.** Before any one profile passes 4,000 answers. The answer counts of Louis's own profiles are not known in this session, because they exist only in his browsers. To set the date, the next step is his current count per drill: the Progress tab shows it, or an export holds it.

**Recommendation:**
1. Show "answers kept: N of 4,000" in Settings now, with the display above.
2. Start the origin-chain change (a record of where a profile's list began, kept with it) as its own pull request once any profile of Louis's passes half the limit, 2,000 answers. At 119.5 characters per answer, a profile at 2,000 answers still has 2,000 to go.

## References

1. MDN Web Docs. Storage quotas and eviction criteria. Accessed November 3, 2026. https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
