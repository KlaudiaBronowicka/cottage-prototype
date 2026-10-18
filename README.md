# The Cottage: encounter prototype (v2: art + clarity pass)

This is a browser prototype of the **cottage encounter**. It exists to test whether the card encounter is fun. It is **not** the real game, and the tech here is **not** the engine choice. That choice still needs Klaudia's sign-off.

Sources: rules *Cottage Paper Prototype Kit v0.1* plus the approved **rule set v0.2** (Tomek's *Clarity Pass v0.2*, approved by Klaudia); VN and tutorial copy by the Narrative Writer (Zosia); art by the Concept Artist (Ola), *Wilcza Noc · Kolor*, prototype grade. See `CHANGELOG.md` for what changed.

## How to run
- **Play:** open `index.html` in a desktop browser (Chrome, Edge, Firefox, Safari; 1280×720 up to 1920×1080). No server, install or build step.
- **Single file:** `dist/cottage-prototype.html` has all code **and art** inlined (~4.4 MB). Rebuild with `python3 tools/bundle.py`.
- **URL options:** `?seed=1234` · `?skin=A|B|C` (name sets) · `?tutorial=1|0` (force the guided first night on/off) · `?icons=mono` (one-colour icons) · `?terms=TERM_QUESTIONS:Secrets,TERM_DREAD:Fear` (try other names live) · `?layout=1` (draw every layout box over the art) · `?debug=1` · `?tester=Name`.

## What's playable
1. **Title** → story intro (VN) or *Skip the story* (two choices, then the night). *Guided first night* is ticked until you finish or skip it once.
2. **VN intro**: portraits with the speaker raised, a text box with a name tag, `[stage directions]` in italics. At the end of Beat 4 the three **Question cards slide in** as COMPANION 2 asks them (Zosia's copy).
3. **Encounter board** (1920×1080 stage scaled to the window): House / Yard / Treeline zones on the painted board, POV / COMPANION 1 / COMPANION 2 tokens (moves animate), Dread track, moon night counter (full → new → dawn), Question chips + clue counter, deck, Help portraits, the night event card, a one-line event log and a Bar on the door.
   - **Actions (rule set v0.2):** Move (click a highlighted zone), Search, Comfort, Play a card, End turn. Draw and Hold the door are cut.
   - **Cards:** hover to read the card at full size; click to pin it and press *Play*, or **drag it onto the board**. Adding cards to a roll is a step **inside the roll dialog**: matching cards glow and toggle with +1 each.
   - **Roll dialog:** need, base + cards + Help, exact chance, and all six die faces with what each would do; the rolled face is highlighted.
   - **Every change is shown with its cause** as a floating note (e.g. "+1 Dread: Footsteps", "COMPANION 1 → Yard: The Voice").
   - **Tooltips** on every control; Search/Comfort tooltips give the **real odds** (exact, from the test bag), with and without your matching cards.
4. **Guided Night 1** (Clarity Pass §9.3): 10 coach marks, only the highlighted control works, skippable, replayable from the Menu. Fixed first event (Footsteps), fixed cards (The Host's Story, Kompot), the first roll succeeds. Night 2 shows one hint line (can be hidden).
5. **Dawn:** tap Question cards to answer them; cost, caps and "everyone together" are explained on the cards.
6. **Outro:** outcome scene + inserts as VN, then the one-line recap (COMPANION 2), then the results table. Tag lines are behind `recapTagLines` (default OFF).
7. **Menu** (top bar): How to play (Clarity Pass §9.4 + glossary + zone plates), Replay tutorial, Night 2 hint, Run stats (copy/download JSON/CSV), Replay this seed, Debug panel (`D`), Restart.

## Where to change things
| What | File |
|---|---|
| Every gameplay number, the deck, the night events, **rule flags** (`rules: { cutDrawAndHold, endTurnButton, startZeroClues, chairForPierogi }`, all ON = v0.2), action list `uiActions`, `iconStyle`, `hintsNight2`, `recapTagLines`, tutorial event/cards | `config.js` |
| **Every player-facing UI word** (labels, tooltips, tutorial, How to play, recap, reasons). Renaming = one line in `terms` (e.g. `TERM_QUESTIONS: 'Secrets'`). Templates: `{t.KEY}`, `{T.KEY}` (capitalised), `{#n:SING:PLUR}`, `{C1}` etc. | `data/ui-text.js` |
| Story text (intro, choices, outcomes, inserts, event flavour) | `data/vn-text.js` |
| **Where things sit** on the stage: which manifest box each HUD element uses, overrides, token anchors per zone, hand card size | `data/board-layout.js` |
| Art paths + the artist's pixel boxes (generated) | `assets/manifest.js` ← `node tools/import-art.js /workspace/cottage-art` |

The engine has no layout or art knowledge; zones, events and token anchors are data, so a moving Presence token or a face-up next-night event (v0.3) can be added as data plus a small engine change.

## Art integration
- `tools/import-art.js` reads Ola's `manifest.json` + `cards/card_layout.json`, copies the **web versions** (WebP bitmaps, SVG icons/glyphs, 76 files, 3.3 MB) into `assets/art/` and writes `assets/manifest.js`. Not copied: `_src/`, `_mock*`, the debug board, `burnt_pierogi` (dropped), the `thread` icons (not used; Questions use the 3 Question icons).
- **Cards** are layered exactly as specified: art (600×400 at 75,162) → `card_panels_<cat>` → `card_frame_<cat>` → category glyph → live text and stat icons in the `card_layout.json` boxes (sizes in container units, so they scale). Categories: Clue = Photos, Object, Host's Story, Key · Calm = Kompot, Stove, Blanket, "Later, Properly" · Protect = Mother's Rule, Chair Under the Handle · Utility = Torch, Phone.
- **Board:** `board_bg` (1920) or `board_bg_1280x720` when the board is shown ≤1300 device pixels wide. Zones from `board.zones`, HUD from `board.ui_boxes` (overrides listed in `data/board-layout.js`).
- **Icons:** coloured by default (`iconStyle: 'colour'`); `'mono'` / `?icons=mono` switches to one-colour. The stat icons, Bar, action and deck icons exist only in ink + paper, so on dark panels the paper (`_light`) version is used in both modes.
- **Greybox fallback:** any missing file renders a CSS placeholder of the same size (set a path to `null` in `assets/manifest.js` to see it).
- **Fit audit:** `NODE_PATH=… node tools/art-fit-audit.js` renders every card / Question / HUD box with live text and writes `tests/art-fit-report.txt`.

## File map
| File | What |
|---|---|
| `index.html`, `style.css` | Page shell and styling (artist palette) |
| `config.js` | Tuning, deck, events, rule flags |
| `data/ui-text.js` · `data/vn-text.js` | String table · story text |
| `data/board-layout.js` · `assets/manifest.js` · `assets/art/` | Layout data · generated art manifest · art files |
| `game.js` | Pure rules engine (no DOM), seeded RNG; `effectiveConfig()` applies the rule flags; structured `feed` of changes with causes |
| `odds.js` | Exact test odds from the test bag |
| `stats.js` | Per-run records, localStorage, JSON/CSV |
| `skin.js` | Article-aware name substitution |
| `ui.js` | Rendering and input only |
| `tests/` | `smoke.js`, `skin-test.js`, `text-test.js`, `ui-playwright.js`, `art-fit-report.txt`, sample stats |
| `tools/` | `bundle.py` (single file), `import-art.js`, `art-fit-audit.js` |
| `screenshots/` | Current UI screenshots (regenerate: `ui-playwright.js --shots`) |

## Tests
- `node tests/smoke.js`: 4,000 seeded bot encounters (every 5th on the kit v0.1 rule set, so both stay working). Invariants (Dread range, card conservation, hand limit, max 1 Bar…), targeted rule checks incl. v0.2: start at 0 clues, Chair replaces Pierogi and places a Bar, Draw/Hold rejected, Comfort lowers Dread on every success, tutorial rig (200 seeds), Question costs 3/4/2, per-night stats. Last run: passed. Outcomes 1: 168, 2a: 308, 2b: 354, 2c: 76, 3: 2322, 3b: 772 (bots, not balance data).
- `node tests/skin-test.js`: 856 string×skin renders, no article before proper names, no "the the".
- `node tests/text-test.js`: 1,720 string-table templates resolve in all 4 name sets; one-line rename works; Zosia's copy verbatim; recap tags default OFF.
- `NODE_PATH=<playwright-core>/node_modules node tests/ui-playwright.js /usr/bin/google-chrome [--shots]`: guided Night 1 end to end (locked controls, skip, replay), 12 full runs (click and drag plays, roll dialog with adds/Help, dawn, outro, results), real-odds tooltip vs `odds.js`, `?terms=` rename, `?icons=mono`, 1920×1080, every image loads, stats CSV columns. Last run: passed, 0 console errors.

## Art import notes
- The importer reads the cast (which `companions/<key>_*` files fill POV / COMPANION 1 / COMPANION 2) from `manifest.cast`. It skips anything in any `_retired/` folder or listed in `manifest.retired`, which covers the thread icon (retired 2026-10-18; Questions use the 3 Question icons). `tests/text-test.js` checks this.

## Art check: mismatches against the rendered result
Checked with `tools/art-fit-audit.js` (report: `tests/art-fit-report.txt`) and `?layout=1` (screenshot `19-layout-boxes-check.png`).
- **Card boxes (`cards/card_layout.json`): all live text fits** for all 12 cards at 750, 340 and 190 px wide. But at hand size the text is too small to read: effect text is 5.6 px on screen at 1280×720 (8.4 px at 1920×1080) against the artist's "min 14 px". The hand shows art + name; hover or click zooms the card to 340 px, where effect text is 15 px. A compact hand layout (name + icons + one-line effect) would help.
- **`board.ui_boxes.bar_on_door` (468,330 56×56) is on the roof.** The README's door position (x496,y430) is the roof edge above the right window. The real door in `board_bg` is at about x272,y505, so the layout override uses 236,452 72×72.
- **`board.ui_boxes.hand` (290..1630) leaves no room for the action buttons or the two Help portraits**, and the manifest has no box for either. The override splits it into actions 190..480, hand 500..1430 and helps 1440..1740. Hand cards (190×266) rise above the hand box to y≈804 so they stay legible.
- **`dread/pressure_track.png` → `label_box` (24,176,1352,22) is only 13 px tall** at the `dread_track` box height (track scaled ×0.6), which is 9 screen px at 1280×720. "At 6, the night breaks" is set at 18 px and spills about 12 px below the box. Also, the track's 7:1 aspect makes it 123 px tall at the box width of 860, so it is fitted by height (840×120).
- **`companions/help_companion_*.png` → `slots.text` (170,306,126,70)** is 57×32 px at the displayed size (147 px wide), so "+3 / ready" only fits at 15 px. Longer states such as "close (+3)" won't fit.
- **Question cards (`question_layout`):** the baked `icon` box (y 448–568) overlaps the top of `question_text` (y 520–850) by 48 px. Centred sentences don't collide at current lengths, but a 3-line sentence would.
- **Zone boxes line up** with the painted House, Yard and Treeline, and their bottom edge (y 810) meets the hand tray. Note that the closed footprint ring is centred inside the House box (around x620), so the Yard box mostly shows the gate, lamp and fence.
- **`icons/dawn` has a square slate background** while `moon_1..6` are round. It reads as a different object in the counter. Moon order is correct: moon_1 is full and moon_6 is new.
- **No coloured stat icons were delivered.** care, insight, nerve, bar, action and deck are ink + paper only, so "coloured by default" applies only to star, pressure, progress, bar_on_door, the Question icons and the moons.
- **Board softness:** at 1280×720 the native `board_bg_1280x720` is used and looks fine. At 1920×1080 the 1920 file is shown 1:1, and because it is a 1.5× upscale it looks visibly soft next to the crisp card art and tokens (mostly the ink lines on the cottage and the birches). On 2× displays it is soft at any size. A native 1920 (or 2560) render would fix it.

## Open questions
- Names (Questions / Clues / Dread) are still pending Klaudia's pick. The defaults follow the Clarity Pass page, and any of them can be renamed in one line or live with `?terms=`.
- The art mapping is approved (Tomek). The Footprint Photos art shows the camera with COMPANION 1's raincoat, while the card belongs to COMPANION 2. This is art only, with no code impact.
- Ola flagged two art issues still open: the chair leans against the door instead of wedging under the handle, and in the Q2 art the phone isn't clearly face-down.

## Rulings on the former spec gaps (marked `RULED (Kostka 2026-10-18)` in code)
> Since rule set v0.2, Hold the door and Burnt Pierogi are out of the default deck/actions; the rulings below still apply when those flags are switched off.
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

**v0.2 additions:** `rules` (active rule flags), `tutorial` (Y / N / `skipped@<step>`), `unusedActions`, `perRound` (one entry per night: `n<night>:<action counts>|p<plays>c<adds>h<helps>|D<dread>|C<clues>|<pov zone>/<C1 zone>`).
