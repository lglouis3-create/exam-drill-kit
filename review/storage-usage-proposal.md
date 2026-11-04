# Storage use: a Settings display, a warning threshold, and the 4,000-answer limit

Proposal for Louis's approval (2026-11-03). Nothing here is built yet. Louis's instructions of 2026-11-03: "Keep every backup unless I explicitly delete it. Prepare the storage-usage display and warning proposal separately; recommend a threshold based on measured usage and storage behavior." and "Track the 4,000-answer limitation now and recommend when to address it, so we do not discover it only after it affects a profile."

Some of what this proposal counts exists only on the branch of pull request #32, which is open and held for Louis's approval:
- the copies Import keeps;
- Put back;
- "Delete the copies kept by Import";
- a file going into a new profile of its own.

The core on `main` has none of them. Where a figure depends on #32, the text says so.

## 1. What was measured

**Characters, not bytes.** Every size here is the length of the stored strings (keys and values), which is what `localStorage.getItem(k).length` returns. The bytes a browser writes to disk may differ.

**Characters stored per answer.** The Medicinal-chemistry page as built at d7331be recorded answers through its own `record()`. That build is the repository's `index.html`, opened from disk in Chromium; it was replaced on the live site on 2026-11-02 by e954e08. The table gives the stored lengths of the progress (`phar4342final:data:me`) and the answer history (`phar4342final:log:me`) after each number of answers. Script: `review/storage-measure/measure.js`; 479 questions, every seventh question in turn.

The answers are synthetic: one chosen option each, 4,000 ms, one in four wrong, no "I guessed", no select-all lists, no typed answers, no exam papers. Real answers of those kinds store longer entries, so these are lower figures.

| Answers recorded | Answers kept | Progress | History |
|---|---|---|---|
| 0 | 0 | 138 | 0 |
| 100 | 100 | 28,671 | 8,600 |
| 500 | 500 | 128,854 | 43,091 |
| 1,000 | 1,000 | 187,920 | 86,179 |
| 2,000 | 2,000 | 307,948 | 172,458 |
| 4,000 | 4,000 | 545,497 | 344,833 |
| 5,000 | 4,000 | 546,993 | 431,082 |

From these rows (each computed):
- The progress grows by (545,497 − 307,948) / 2,000 = 118.8 characters per answer between 2,000 and 4,000 answers, and stops growing at 4,000 kept answers: 546,993 characters at 5,000. The cap is the literal `4000` in `record()`, `core/shell.html:1210` on `main` (#32 names it `ANSWERS_MAX`).
- The history grows by (431,082 − 344,833) / 1,000 = 86.249 characters per entry. It keeps up to 20,000 entries (`LOG_MAX`, `core/shell.html:750` on `main`): 86.249 × 20,000 = 1,724,980 characters at that rate.
- With #32, each copy Import or Put back keeps is one copy of the progress: at most 546,993 characters.

**The limit.** In Chromium 153 (Playwright), one origin served over HTTP accepted 5,242,873 characters of keys and values before `setItem` threw `QuotaExceededError` (`review/storage-measure/quota.js`). This is a lower bound: the script's smallest piece is 10 characters plus its key, so it can stop up to about 15 characters short of 5 × 1,048,576 = 5,242,880.

MDN says browsers "can store up to 5 MiB of local storage, and 5 MiB of session storage per origin", and that quotas "apply to an entire origin, even if this origin is used to run several websites"<sup>1</sup>.

NOT RUN: Safari, on a Mac or on an iPhone or iPad; Firefox; HTTPS as GitHub Pages serves it.

**Shared by every drill.** Every drill site is on the one origin lglouis3-create.github.io: Medicinal-chemistry, Pharmacokinetics, BDK and Intro to Pharmacology all share that one limit.

## 2. What fills it, and what happens at the limit

What a profile can take:
- **One profile at both caps:** 546,993 + 1,724,980 = 2,271,973 characters, which is 43% of 5,242,873.
- **A preview** (`/preview/`, opened for each kit update Louis approves) copies every live key of its course into `<ns>-preview:*` the first time it opens (`core/shell.html` 590-604 on `main`). Nothing removes those copies. One full profile with its preview copy: 2 × 2,271,973 = 4,543,946 characters, 87%.
- **With #32, a file that goes into a new profile** adds that profile's progress and history: up to 2,271,973 more.
- **With #32, each Import replace** adds one copy, up to 546,993. Put back adds a copy and then removes one, so it needs room for one extra copy only while it runs.

What happens when the limit is reached, on `main` today:
- **Progress:** a save the browser refuses keeps the change on the page and shows the "did not save" notice, which points to Export progress (`saveWarn`).
- **History:** a refused history write deletes the oldest half of the history and tries again, repeatedly, with no notice (`saveLog`, `core/shell.html:770-776` on `main`). The history is written at once with each answer, while progress waits on a 150 ms timer. So near the limit, history entries can be deleted before any progress save is refused and the notice appears. The history is what fitting the memory model to Louis's own answers will use, and this deletion goes against "keep every backup".

## 3. Recommendation

**1. Settings shows, for this browser:**
- the characters the whole site stores (all keys of the origin, every drill) against 5,242,880, as a percentage;
- this drill's share, split into progress, history, preview copies and (with #32) the copies Import keeps, with their number;
- this profile's answers: kept (at most 4,000) and recorded in all (`DB.qn`, which keeps counting past 4,000).

**2. A warning,** in the Quiz tab and in Settings, worked out from what is stored rather than from a fixed percentage. It appears when the space left (5,242,880 minus what the site stores) is less than the larger of two needs:
- one more profile of the largest size this browser holds now (its progress plus its history): a new profile from Import, or a copy, can need that much;
- the live keys of a course on the core whose preview has not yet copied them: a preview's first opening copies all of them, every profile with its history and exam paper, in many writes.

With one course holding one profile at both caps, the warning starts just below 5,242,880 − 2,271,973 = 2,970,907 stored characters (57%): the preview need also counts that course's smaller keys, such as its exam paper. With smaller profiles it starts at 5,242,880 minus the larger need, so later. Only drills on the core can be split into profiles and courses. The other drills' keys (BDK's `bdk2:*`, Pharmacokinetics, Intro to Pharmacology) count in the site's total but not in either need. The warning:
- names the largest items;
- offers Export progress;
- with #32, offers "Delete the copies kept by Import", which deletes only after Louis confirms it.

**3. The history stops deleting entries when a write is refused.** A refused history write keeps the entry on the page and shows the "did not save" notice, as progress does, instead of cutting the oldest half. This is a change to progress storage, so it is its own pull request, for Louis's yes. Two deletions stay by design unless Louis decides otherwise: answers past the 4,000 kept (`core/shell.html:1210`) and history entries past 20,000 (`LOG_MAX`, the cuts at `:784` and `:813`).

**4. Preview copies are deleted only when Louis asks:** a "Delete this preview's copy of my progress" button on the preview page, after a confirmation. The live keys are never touched. The next time a preview opens, it copies the live keys again (`core/shell.html:599`), so the space is used again with each preview visit.

**What this needs from Louis:** a yes or no on 1-4, and the wording.

**Not measured:** Safari's real limit, and whether it counts characters or bytes. The display's stored lengths are exact either way. The denominator 5,242,880 and the warning point assume a limit in characters as Chromium has it. If Safari's limit were smaller or counted bytes, the warning could come too late there. A Safari measurement on Louis's iPhone or iPad (a page that runs `quota.js`'s loop) would settle it before the warning is relied on.

## 4. The 4,000-answer limit (tracked)

**What happens.** A profile keeps its latest 4,000 answers (`core/shell.html:1210` on `main`). Past that, its list no longer shows where it began. With #32, each round trip of a file between two devices then makes a new profile instead of a replace (#32, design choice 4). On `main` without #32, Import replaces the profile with the file as before.

**When to address it.** Before any one profile passes 4,000 kept answers. The counts of Louis's own profiles are not known in this session, because they exist only in his browsers. The core shows the count as "answered" on the Weak spots tab (`core/views.js` on `main`), and an export holds it.

**Recommendation:**
1. Show both counts in Settings (item 1 above) now.
2. Start the origin-chain change (a record of where a profile's list began, kept with it) as its own pull request once any of Louis's profiles passes 2,000 answers. That figure is a judgment, not a measurement: it leaves half the limit for the change to be built and checked.

## References

1. MDN Web Docs. Storage quotas and eviction criteria. Accessed November 3, 2026. https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
