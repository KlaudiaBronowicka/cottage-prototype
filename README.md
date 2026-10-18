# The Cottage: encounter prototype (v0.3: The Approach)

This is a browser prototype of the **cottage encounter**. It exists to test whether the card encounter is fun. It is **not** the real game, and the tech here is **not** the engine choice. That choice still needs Klaudia's sign-off.

Sources: rules *Cottage Paper Prototype Kit v0.1* plus the approved **rule set v0.2** (Tomek's *Clarity Pass v0.2*, approved by Klaudia) and **v0.3 The Approach, Variant 1** (Presence track, face-up next event; Notion spec page 3fded9602b06819786a7e14c416bab93); VN and tutorial copy by the Narrative Writer (Zosia); art by the Concept Artist (Ola), *Wilcza Noc · Kolor*, prototype grade. See `CHANGELOG.md` for what changed.

## How to run
- **Play:** open `index.html` in a desktop browser (Chrome, Edge, Firefox, Safari; 1280×720 up to 1920×1080). No server, install or build step.
- **Single file:** `dist/cottage-prototype.html` has all code **and art** inlined (~8.7 MB). Rebuild with `python3 tools/bundle.py`.
- **URL options:** `?seed=1234` · `?skin=A|B|C` (name sets) · `?tutorial=1|0` (force the guided first night on/off) · `?icons=mono` (one-colour icons) · `?terms=TERM_QUESTIONS:Secrets,TERM_DREAD:Fear` (try other names live) · `?layout=1` (draw every layout box over the art) · `?debug=1` · `?tester=Name` · **v0.3:** `?presence=off|track|token` and/or `A|B` (comma list, e.g. `?presence=track,B`; A = domowik, B = zmora) · `?late=overlay|swap|none` (nights 5-6 look).

## What's playable
1. **Title** → story intro (VN) or *Skip the story* (two choices, then the night). *Guided first night* is ticked until you finish or skip it once.
2. **VN intro**: portraits with the speaker raised, a text box with a name tag, `[stage directions]` in italics. At the end of Beat 4 the three **Question cards slide in** as COMPANION 2 asks them (Zosia's copy).
3. **Encounter board** (1920×1080 stage scaled to the window): House / Yard / Treeline zones on the painted board, POV / COMPANION 1 / COMPANION 2 tokens (moves animate), Dread track, moon night counter (full → new → dawn), Question chips + clue counter, deck, Help portraits, the night event card, a one-line event log and a Bar on the door.
   - **Actions (rule set v0.2):** Move (click a highlighted zone), Search, Comfort, Play a card, End turn. Draw and Hold the door are cut.
   - **Cards:** hover to read the card at full size; click to pin it and press *Play*, or **drag it onto the board**. Adding cards to a roll is a step **inside the roll dialog**: matching cards glow and toggle with +1 each.
   - **Roll dialog:** need, base + cards + Help, exact chance, and all six die faces with what each would do; the rolled face is highlighted.
   - **Every change is shown with its cause** as a floating note (e.g. "+1 Dread: Footsteps", "COMPANION 1 → Yard: The Voice").
   - **Tooltips** on every control; Search/Comfort tooltips give the **real odds** (exact, from the test bag), with and without your matching cards.
4. **Guided Night 1** (Clarity Pass §9.3): 10 coach marks, only the highlighted control works, skippable, replayable from the Menu. Fixed first event (Footsteps), fixed cards (The Host's Story, Bread and Salt; Kompot with the Presence off), the first roll succeeds. Night 2 shows one hint line (can be hidden).
5. **Dawn:** tap Question cards to answer them; cost, caps and "everyone together" are explained on the cards.
6. **Outro:** outcome scene + inserts as VN, then the one-line recap (COMPANION 2), then the results table. Tag lines are behind `recapTagLines` (default OFF).
7. **Menu** (top bar): How to play (Clarity Pass §9.4 + glossary + zone plates), Replay tutorial, Night 2 hint, Run stats (copy/download JSON/CSV), Replay this seed, Debug panel (`D`), Restart.

## v0.3 The Approach (Variant 1, flag `presence.mode`, default `track`)
- **Approach track** (Treeline → Yard → Window → Door) next to the Dread track, with the Presence marker (A: domowik, B: zmora token).
- **Next event is face up** (`next_event_preview`, hover to zoom). Footprints on 4 of 8 events (Footsteps, The Gate Creaks, The Silence, The Door Handle); The Door Handle is now Dread +1.
- **Night order:** event → footprint step(s) (+1 more on nights 5-6) → visit check (a Bar blocks it) → Dread-6 check.
- **Treeline Search success** draws the Presence 1 closer; **Comfort success** turns it back 1.
- **Visit** at the Door: Dread +1 and COMPANION 1 one zone outward, Presence back to the Treeline. A Bar stops it instead (Bar used, Presence to the Yard). A Bar is used by whichever comes first, a night event or a visit.
- **Bread and Salt** (Calm, replaces Kompot): Dread −1 and the Presence back to the start. Flavour by direction (A "Leave bread and salt by the stove", B "Promise it bread in the morning").
- Visit warning line, late-nights banner and sky cross-fade (nights 5-6), Presence lines in hover tips and the roll dialog, How to play section, debug line, stats columns.
- **Copy:** Zosia's two directions (`data/ui-text.js → presence.dirs.A/B`), default A, `?presence=A|B`. The door line is picked by a seeded RNG separate from the dice. `[brackets]` = stage directions.
- `presence.mode: 'off'` gives the v0.2 game exactly (Kompot, old Handle, no track). `'token'` (Variant 2) is parked and falls back to the track rules (logged as `token>track`).
- All numbers are in `config.js → presence` (spaces, footprint events, steps, late nights, pull/push, visit effects, Bar return, offering card, door line count, late look).

### Questions for Tomek (design gaps: simplest reading taken, each behind config)
1. Late extra step: unconditional on nights 5-6, or only on footprint nights? Now unconditional (`lateStepNeedsFootprint: false`).
2. Does a Treeline Search from a card (Key on a String) pull the Presence? Now yes (`searchPullCountsCards: true`).
3. Visit warning: shown whenever the forecast says the next night reaches the Door (also from the Yard with late + footprint).
4. Dread 6 ends the night at once. With that, the order of visit vs. Dread-6 check makes no other difference.
5. Steps past the Door are lost (max one visit per night).
6. A visit caused by a mid-turn Treeline Search resolves straight away, not at the end of the night.
7. Direction A/B is independent of `?skin=`.
8. On night 6 the next-event slot shows "Dawn comes next".
9. Variant 2 (token) is parked; `token` uses the track rules.
10. Spec open question 3 (a stronger finale) is still open; nothing built.

### Expected art keys (all delivered by Ola, v0.3)
`approach/approach_track` + step tiles + name boxes · `presence_domowik_token_128/256`, `presence_zmora_token_128/256` · footprint icon (+ light) · `next_event` frame + `next_event_layout` · `late_nights_banner` box · `board/sky_late_overlay` · `board_bg_late` (+1280) · `fx/bar_on_door`, `fx/bar_visit_stopped` · `fx/door_handle_f1-4`, `fx/visit_frost_window_f1-4`, `fx/visit_frost_screen_f1-4` (8 fps, one frame with reduced motion) · `cards/bread_and_salt` · `card_frame_hand_*` + `card_panels_hand_*`. Missing: none (importer: 120 files).

## Where to change things
| What | File |
|---|---|
| **The Approach**: `presence` block (mode, direction, spaces, footprints, steps, visit, Bar, Bread and Salt, late look) | `config.js → presence` |
| Every gameplay number, the deck, the night events, **rule flags** (`rules: { cutDrawAndHold, endTurnButton, startZeroClues, chairForPierogi }`, all ON = v0.2), action list `uiActions`, `iconStyle`, `hintsNight2`, `recapTagLines`, tutorial event/cards | `config.js` |
| **Every player-facing UI word** (labels, tooltips, tutorial, How to play, recap, reasons). Renaming = one line in `terms` (e.g. `TERM_QUESTIONS: 'Secrets'`). Templates: `{t.KEY}`, `{T.KEY}` (capitalised), `{#n:SING:PLUR}`, `{C1}` etc. | `data/ui-text.js` |
| Story text (intro, choices, outcomes, inserts, event flavour) | `data/vn-text.js` |
| **Where things sit** on the stage: which manifest box each HUD element uses, overrides, token anchors per zone, hand card size + variant, Presence marker size, next-event zoom, fx fps | `data/board-layout.js` |
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
| `tools/` | `bundle.py` (single file), `import-art.js`, `art-fit-audit.js`, `sim-presence.js` (v0.3 balance sim), `card-sheet.js` (screenshot 23) |
| `screenshots/` | Current UI screenshots (regenerate: `ui-playwright.js --shots`) |

## Tests
- `node tests/smoke.js`: 4,000 seeded bot encounters (every 5th on the kit v0.1 rule set, so both stay working). Invariants (Dread range, card conservation, hand limit, max 1 Bar…), targeted rule checks incl. v0.2: start at 0 clues, Chair replaces Pierogi and places a Bar, Draw/Hold rejected, Comfort lowers Dread on every success, tutorial rig (200 seeds), Question costs 3/4/2, per-night stats. Last run: passed. Outcomes 1: 168, 2a: 308, 2b: 354, 2c: 76, 3: 2322, 3b: 772 (bots, not balance data).
- `node tests/skin-test.js`: 856 string×skin renders, no article before proper names, no "the the".
- `node tests/text-test.js`: 1,720 string-table templates resolve in all 4 name sets; one-line rename works; Zosia's copy verbatim; recap tags default OFF.
- `NODE_PATH=<playwright-core>/node_modules node tests/ui-playwright.js /usr/bin/google-chrome [--shots]`: guided Night 1 end to end (locked controls, skip, replay), 12 full runs (click and drag plays, roll dialog with adds/Help, dawn, outro, results), real-odds tooltip vs `odds.js`, `?terms=` rename, `?icons=mono`, 1920×1080, every image loads, stats CSV columns. Last run: passed, 0 console errors.

- `node tests/smoke.js` (v0.3): the 4,000 seeds also mix in presence off / token / direction B; targeted checks for footprints with a Bar, visit, Bar blocks a visit → Yard, Treeline pull, Comfort push, Bread and Salt, late step, forecast, off = v0.2, token fallback, direction doesn't change rules. Passed.
- `node tests/text-test.js`: also checks Zosia's v0.3 copy (32 lines verbatim, A and B complete) and the 10 tour voice lines. Passed.
- `node tools/sim-presence.js 5000`: win/visit/Bread and Salt stats vs presence off → `tests/sim-presence-report.txt`.
- `ui-playwright.js` (v0.3): runs with presence default / off / B / token / late=swap, Approach + next event shown iff on, zoom on hover, Presence lines in tips and the roll dialog, visit warning + late banner + sky, a visit with the banner, How to play (B), presence off board; screenshots 24-28. Passed, 0 console errors.
- `node tests/dist-check.js`: the single file loads with no external files and 0 console errors (screenshot 22).

## Art import notes
- The importer reads the cast (which `companions/<key>_*` files fill POV / COMPANION 1 / COMPANION 2) from `manifest.cast`. It skips anything in any `_retired/` folder or listed in `manifest.retired`, which covers the thread icon (retired 2026-10-18; Questions use the 3 Question icons). `tests/text-test.js` checks this.

## Art check: mismatches against the rendered result (v0.3 art)
Ola's 10 art-fit fixes are in, and `data/board-layout.js` now uses the manifest boxes, with only the overrides listed below. Checked with `tools/art-fit-audit.js` (`tests/art-fit-report.txt`), `?layout=1` and screenshots 09, 20, 24-28.
- The HUD takes 420 stage px (280 px at 1280×720, 39% of the height) above the zones. All live text fits in every card box (full frame at 750/340, hand variant), the Question cards, the next-event card (HUD size and zoom), the Tonight box on nights 5-6 and the HUD boxes. Tokens stand inside their zones and clear of the zone strips in House, Yard and Treeline.
- **No `event_card` box in v0.3:** tonight's event is drawn in `late_nights_banner` (override).
- **`event_log` (y836-872) overlaps the zones** (they end at y860) by ~24 px.
- **No box for the visit warning or the hint line:** explicit boxes in `board-layout.js` (`visitWarn`, `hint`).
- **`hand` is 200 px tall → hand cards are 143 px wide.** Hand-variant effect text is ~10.6 px at 1920 and ~7 px at 1280 (names ~9 / ~6 px), not the ~14.5 px in the fix note (which assumes 190 px cards). Hover zoom is 15 px.
- **`board/sky_late_overlay`:** most of the sky is behind the HUD, so the nights 5-6 cross-fade is subtle.
- **PNG-only files** (converted to WebP in our copy): `fx/visit_frost_screen_f1-4` (~1.9 MB as PNG), `board/sky_late_overlay`.
- The roll tray (our `tray` box) covers `questions_row` while rolling.
- Still open from v2: chair art leans on the door; Q2 phone not clearly face-down.

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

**v0.3 additions:** `presenceMode` (off/track, `token>track` when it falls back), `presenceDirection`, `presenceByNight`, `presenceVisits`, `presenceVisitsBlocked`, `offeringsPlayed` (Bread and Salt), `comfortPushes`, `searchPulls`, `presenceSteps`, `presenceClosest`; `perRound` entries end with `|P<position>`.

**v0.2 additions:** `rules` (active rule flags), `tutorial` (Y / N / `skipped@<step>`), `unusedActions`, `perRound` (one entry per night: `n<night>:<action counts>|p<plays>c<adds>h<helps>|D<dread>|C<clues>|<pov zone>/<C1 zone>`).
