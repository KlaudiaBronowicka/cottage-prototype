# The Cottage: encounter prototype (greybox, throwaway)

This is a browser prototype of the **cottage encounter**. It exists to test whether the card encounter is fun. It is **not** the real game, and the tech here is **not** the engine choice. That choice still needs Klaudia's sign-off.

Rules source: *Cottage Paper Prototype Kit v0.1* (Game Designer, 18 Oct 2026). VN text source: *Cottage Encounter: Paper Prototype Outline* (Narrative Writer). All text is placeholder.

## Play online

[Play the prototype](https://klaudiabronowicka.github.io/cottage-prototype/)

## How to run
- **Play:** open `index.html` in any modern browser (double-click it). You don't need a server, an install or a build step.
- **Single-file version:** `dist/cottage-prototype.html` has everything inlined. Send it as one file or drop it on any static host. If you change the source, rebuild it with `python3 tools/bundle.py`.
- **URL options:** `?seed=1234` (replay a seed), `?skin=A|B|C` (reskin names from data/vn-text.js), `?debug=1` (open the debug panel), `?tester=Name`. The same query string works on the [live site](https://klaudiabronowicka.github.io/cottage-prototype/).

## How to update
Push to `main`. The workflow in `.github/workflows/pages.yml` deploys the repository root to GitHub Pages (no build step). The live site usually updates within a couple of minutes after that workflow finishes. If you also want the single-file copy refreshed, run `python3 tools/bundle.py` and commit `dist/cottage-prototype.html` in the same push.

## What's playable
1. **Title.** Set a seed, a name set and a tester name. Start with the story intro, or skip straight to the two Beat 4 choices.
2. **VN intro.** A trimmed Beat 1 to Beat 4, with the bond choice (C1/C2) and the key choice (SHARED/KEPT), then night two.
3. **Encounter.** The kit's loop, 6 rounds:
   - Night event.
   - 2 actions: Move, Investigate, Steady, Hold the door, Play a card, or Draw.
   - End: Treeline exposure, a draw, and the hand limit.
   - Tests are 2 + committed icons + Help + a d6 bag draw. STAR is an auto-fail plus 1 pressure. Ties succeed. A margin of 3 or more is a strong success.
   - Also in: 12-card fixed deck, 8 Night events, Bars (max 1), COMPANION 1's position, both Helps (+3 if bonded), Torch.
   - The encounter ends early the moment pressure hits 6. Otherwise dawn comes after round 6.
4. **Allocation.** Spend progress on Threads, paying the full cost of each.
   - Pressure 6 means at most 1 Thread.
   - All three Threads need Escaped together = Y.
5. **Outro.** One of the outcome scenes 1, 2a, 2b, 2c, 3 or 3b (Dawn, Together), with inserts, plus the flags-out table.
6. **Stats.** Every finished run is saved to `localStorage`. Click **Stats** for the table and summary, and for **Copy/Download JSON or CSV**.
7. **Debug.** The **Debug** button or the `D` key shows the full state and the action log, including the seed, deck and night deck.
8. **Restart.** The top-right button. The outro also has *Play again* and *Replay same seed*.

## How to change tuning
Every gameplay number is in **`config.js`**, with comments. The kit's [T] values are marked [T]. Edit, save and reload. Examples:
- `rounds`, `pressureMax`, `startProgress`, `startingHand`, `handLimit`, `actionsPerRound`
- `zones[]`: investigate difficulty and progress per zone
- `testBase`, `steadyDifficulty`, `holdDoorDifficulty`, `strongMargin`, `testBag`
- `helpBonus` / `helpBonusBonded`, `threads[]` costs, `deck[]` (cards, icons, effects), `events[]`
- `fasterVariant: true` turns on the 2-of-3 Beat 3 spots variant. The skipped spot's card is removed.

All VN text is in **`data/vn-text.js`**: intro, choices, event flavour, pressure bands, Thread questions, outcome scenes and inserts. The writer can swap lines there without touching code. Tokens such as `{C1}` are filled in from the name set.

**Writing slots:** write them the way the default CAPS text reads, for example "the {HOST}" or "The {POV}'s". `skin.js` handles the article:
- Each skin lists its proper names in `proper`. The article in front of those is dropped: "The {HOST} explains" becomes "Wanda explains", and "the {POV}'s lap" becomes "Hania's lap".
- A value that starts with "the " brings its own article: "The {HOST}" becomes "The landlady", never "The the landlady".
- Anything else, including the default CAPS names, is left exactly as written.

## File map
| File | What |
|---|---|
| `index.html` | Page shell and script load order |
| `style.css` | Greybox styling |
| `config.js` | **All tuning numbers** and the deck and event lists |
| `data/vn-text.js` | **All placeholder VN text** and the name sets |
| `game.js` | Pure rules engine (no DOM) with a seeded RNG (mulberry32). Runs in browser and node |
| `stats.js` | Per-run stats records, localStorage store, JSON/CSV export |
| `ui.js` | DOM rendering and input only |
| `skin.js` | Article-aware name substitution for `?skin=A/B/C` |
| `tests/smoke.js` | Headless engine test: `node tests/smoke.js` |
| `tests/skin-test.js` | Name-grammar test: `node tests/skin-test.js` |
| `tests/ui-playwright.js` | Optional browser click-through. Needs `playwright-core` and Chrome |
| `tools/bundle.py` | Builds `dist/cottage-prototype.html` (single file) |

## Tests
- `node tests/smoke.js` plays 4,000 seeded encounters with random, heuristic and reckless bots.
  - Invariants checked: pressure range, card conservation, the hand limit, the round limit, and max 1 Bar.
  - Targeted rule checks: Bar cancels, no Bar stacking (and blocked actions cost nothing), STAR, ties, Help eligibility, early end, the 1-Thread cap, Photos and Key action cost and zones, final-bond inserts, and Outcome 3b plus its inserts.
  - Also asserts that all 6 outcomes and both end reasons are reached, and that every stats column is present in the CSV/JSON export.
  - Last run: all passed. Outcomes: 1: 227, 2a: 315, 2b: 324, 2c: 81, 3: 2376, 3b: 677. These are bot numbers, not balance data.
- `node tests/skin-test.js` runs targeted name-grammar cases, then renders every VN and card string through every skin (788 renders). For skins A, B and C it asserts there is no article before a proper name, no "the the" and no unreplaced slot. For the default CAPS text it asserts the output is unchanged.
- `NODE_PATH=<dir with playwright-core>/node_modules node tests/ui-playwright.js /usr/bin/google-chrome` clicks through 12 full runs in headless Chrome. The first run uses skin A and is checked for article-before-name errors in the intro and outro.
  - Covers the intro and skip paths, allocation, outro, and stats download.
  - Checks that stage-direction brackets render in italics and that the CSV header has the kit fields.
  - Last run: passed with 0 console errors, and Outcomes 3, 3b and 2b were seen.

## Rulings on the former spec gaps (marked `RULED (Kostka 2026-10-18)` in code)
The Game Designer (Kostka) ruled on every gap on 2026-10-18. All smaller assumptions were confirmed.
1. **Actions are optional.** You may end a round with actions unspent (`allowPass: true`).
2. **Bars do NOT stack.** There is at most 1 Bar on the board (`barsStack: false`). While one is down, Hold the door and Mother's Rule are greyed out with a note, and the engine refuses them without spending an action.
3. **Footprint Photos and Key on a String** each cost 1 action in total, including their Investigate test. Committed cards, Help and Torch apply to that test.
   - Photos: the POV must be in the House. It investigates the Yard.
   - Key: usable from any zone, on any zone.
4. **Help follows the cards.** COMPANION 1 gives +CARE, only while she is in the House. COMPANION 2 gives +INSIGHT or +NERVE.
5. **Bond.** The +3 Help bonus uses the Beat 4 choice. The outcome "bond raised" inserts use the **final bond**:
   - COMPANION 1 = (Beat 4 choice was C1 ? 1 : 0) + encounter bond change.
   - COMPANION 2 = (Beat 4 choice was C2 ? 1 : 0).
   - An insert shows when that value is > 0, so both, one or neither can appear.
6. **Outcome 3b, "Dawn, Together".** Used when dawn is reached with 0-1 Threads and Escaped together = Y.
   - The text is the Narrative Writer's (Bajka, 2026-10-18).
   - Its own insert comes first: one resolved Thread gets "We got one answer" plus the line for that Thread; zero Threads gets "We know we're bad at sleeping".
   - Then the general inserts follow: bond, SHARED/KEPT, high pressure.
   - Plain Outcome 3 stays for the pressure-6 walk-out, and for dawn with COMPANION 1 outside the House.
   - `[Bracketed]` text in any VN line renders as italic stage directions.

Confirmed small assumptions:
- The pressure floor is 0.
- Pierogi can't be played until a Help has been used.
- Draw is disabled when the deck is empty, and there is no reshuffle.
- Both Helps may go on one test.
- At an early end, COMPANION 1 goes to the Treeline, so bond -1 and Escaped together = N.
- The night deck reshuffles only if `rounds` > 8.
- Torch lasts until the end of the round.
- The Lights Fail with an empty hand discards nothing.
- A STAR is never a strong success.
- A Help used twice shows as `C1x2`.
- Allocation is the player's free choice of any legal set.

## Stats: fields logged per run
Every finished run is saved to `localStorage` (key `cottageProto.runs.v1`). **Stats** has Copy/Download for **JSON** and **CSV** with these exact columns, in this order.

**Kit v0.1 observation sheet, "Record per run" (all included):**
| Kit field | Column(s) |
|---|---|
| progress earned | `progressEarned` (earned during the encounter, excluding the starting progress) |
| Threads resolved | `threadsResolved` (e.g. `T1+T3`) |
| escaped together | `escapedTogether` (Y/N) |
| final pressure | `finalPressure` |
| Help used | `helpsUsed` (e.g. `C1+C2`, `C1x2`) |
| bond change | `c1BondChange` (encounter change: +1/0/-1) |
| key choice | `keyChoice` (SHARED/KEPT) |
| outcome scene | `outcome` (1/2a/2b/2c/3/3b) and `outcomeScene` (scene title) |
| rounds played | `roundsPlayed` |
| plays vs commits | `plays`, `commits`, `playsVsCommits` (`plays:commits`) |

**Kit "Watch for" items that can be measured automatically:**
- `encounterSeconds`
- `secondsPerRound` (space-separated)
- `povLeftHouse` (Y/N)
- `c1EverOutside` (Y/N)
- `c1EndedOutside` (Y/N)

**Run metadata:** `runId`, `finishedAt`, `build`, `seed`, `skin`, `tester`.

**Supporting detail:**
- `endReason` (dawn/pressure), `totalSeconds`, `actionsTaken`
- `startProgress`, `progressAtEnd`, `progressSpent`, `progressLost`
- `threadsOpen`, `T1`, `T2`, `T3` (0/1)
- `maxPressure`, `pressureByRound`, `progressByRound`
- `bondChoice`, `finalBondC1`, `finalBondC2`, `beat3Visited`
- `tests`, `testSuccesses`, `stars`
- `cardsPlayed`, `cardsCommitted`, `actionCounts`

The rest of the observation sheet needs a human observer: hesitation, reading the Threads, cost vs story talk, reactions, the rules-question tally and the post-play questions.
