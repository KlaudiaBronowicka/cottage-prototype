# Changelog

## v0.4.2: tutorial soft-lock fix + coach text floor (2026-10-18, Greg)
- **Bug (Klaudia, Chrome on Android):** tutorial step 8 ("Search the Yard … add a magnifier card again") only accepted **Shortcut**. Step 4 let you add both Rummage and Shortcut, so Shortcut could already be gone; then Roll did nothing with any other magnifier card (Sharp Eyes in her run) and the step never advanced. The only feedback was a 2.6s toast naming a card she didn't have. Not a touch issue: desktop clicks hit it too.
- **Fix:** guided Search steps (4 and 8) now gate on **any card with the roll's icon** (`await: 'roll:icon'`), matching the coach text. The step advances from the roll it was gated on (no per-card-id signal). Safety nets: a `roll:<cardId>` gate falls back to any matching card if that card isn't in hand, and to no card if the hand has none, so the tutorial can't soft-lock. Guided rolls take **one card at a time** (a second tap swaps it), which keeps a magnifier for step 8. New placeholder string `v04.rollNeedsIcon` ("Add a magnifier card to the roll first, then roll."), waiting on Zosia.
- **Guided odds:** the roll window showed 67% for 3 vs 3 in the guided Hours, but guided rolls never land on the omen or −1 face. `Odds.testOdds(…, { guided: true })` now shows the real odds (100% for 3 vs 3) and dims the two faces that can't come up. After the handoff, rolls show the normal odds again.
- **Coach text (Ola):** 21px on the 1920 stage (14px at 1280×720) with line-height 1.25 for every line: step label, "Your turn", text and buttons. The step label and "Your turn" share the first row, so the text keeps 3 lines in the 120px hint_line. The handoff uses 21px, with the text at 1.35em. All 10 steps fit at 21px; nothing needs cutting (creature step 3 uses all 3 lines). Tuning: `CONFIG.v04.tutorial.coachFont`. On phones the whole 1920 stage scales down, so text is smaller than 14px there (about 4.5px in portrait, 8px in landscape).
- **Tests:** new `tests/tutorial-touch-playwright.js`. It runs the full 10-step tutorial on 1280 and 1920 with clicks, and on Pixel 7 portrait and landscape with taps. It also covers Klaudia's exact state, a step 8 with no magnifier, the gate message, guided vs normal odds, the one-card swap and the coach font. `v04-test.js` has a new group for the gate data, guided odds and an engine face distribution check. `tools/art-fit-v04.js` now reports lines per step and the 14px floor.
- Build label `v0.4.2 … / build 8`.

## v0.4.1: Tomek rulings + Zosia FINAL copy (2026-10-18, Greg)
- **Lose-dread headlines (Tomek):** title "The dark got in." · result "You couldn't hold on until dawn." (was "Dread hit 6. / The night broke.").
- **End screen (Tomek):** Play again is the clear primary (ochre, autofocus / focused so Enter starts a fresh run with no tutorial); Play with tutorial stays secondary. Visit stat value reads "N · Bar held M".
- **Copy (Zosia FINAL):** 7 card flavours; neutral door + Bread and Salt; How to play (5 paragraphs + Strong success glossary row); end row labels / tips; `rollNeedsCard`; coach "Your turn…" / skip tip. `{T.TERM_NIGHT}` still renders **Hour**.
- **Docs:** Tomek's rulings recorded in `docs/v04-notes.md` (wardNeedsTarget kept, Shortcut either way, Bread and Salt → Treeline in the fallback, visit warning hidden under a Bar, title page OK, end lines split, our engine is the reference sim).
- **Art (Ola v0.4.1 layout pass):** re-imported. Board art +20px lower; hint_line 120; zones y364; night_counter 480; deck 210; roll_tray y364; door FX +20y. New `card_inspect` / `card_inspect_bar` (hand card at exactly 2×), `end/stats_panel` + run_stats/send_results boxes (old y966 strip dropped). Neutral creature `artNeutral` / `markerNeutral`. Coach text back at 19px; candle/deck spacing restored. Art-fit: `tests/art-fit-report-v041.txt`.
- Build label `v0.4.1 … / build 7`. `?v04=0` still plays the untouched v0.3.2 path.

## v0.4: Stripped Core (2026-10-18, Greg)
Spec `gdd/v04/encounter-v0.4.md`. Everything sits behind `CONFIG.v04` (on by default); **`?v04=0` plays the v0.3.2 build**.
- **Cut:** story/VN, Questions, companions, NERVE. **Night → Hour** everywhere (terms, HUD, log, tooltips, tutorial).
- **Goal:** 5 Clues by dawn (6 Hours) with Dread under 6 (`v04.clueGoal`). There are 3 end screens: win, Dread hit 6, Dawn came short. Each has Play again and Play with tutorial.
- **Creature (Approach track):** 1 step every Hour, +1 on Hours 5-6. A visit costs Dread +1 and sends it back to the Treeline. A Bar stops a visit (the Bar is held for a forecast visit, as in v0.3.1). Footprints are off, with `v04.fallbackPresence` as the config fallback (footprints on 7/8, start Yard, no base step). Direction neutral unless `?presence=A|B`.
- **Deck of 10:** Look Closer, Lucky Find, Sharp Eyes, Deep Breath, Warm Stove, Bar the Door, Ward, Shortcut, Rummage, Bread and Salt. **8 events:** all Dread +1. Twists: the Gate (+1 more if you're outside), Lights (discard 1), Silence (no end-of-Hour draw).
- **Tutorial:** 10 steps, verbatim copy. Guided Hours 1-2 with fixed events/hand and safe rolls, then a handoff modal. Skip tutorial sits in the corner.
- **Intro:** Zosia's FINAL copy, verbatim. Line 3 swaps only for `?presence=A|B`; the Goal line is built from config + the string table.
- **Art (Ola v0.4, layout v3):** re-imported (122 files). Additions: 10 card arts, hour candles, magnifier insight, clue icon, zone strips, 3 end screens, new boxes (hour counter, skip_tutorial, clue counter, coach in hint_line, tutorial_modal, hand for 6). Retired art is no longer loaded (moons, nerve, questions, companion tokens/portraits/help, zone plates). `tools/import-art.js` handles the new `retired` folder format. The v0.4 art-fit audit is `tools/art-fit-v04.js`.
- **Sim:** `tools/sim-v04.js` ports Tomek's 3 bots onto the real engine (8 rows). It matches `sim_v04.py` within 2 points except 4 smart rows (Python Hour-6 forecast quirk; `--pyquirk` reproduces it). See `docs/v04-notes.md`.
- **Stats:** separate v0.4 store (`cottageProto.runs.v04`) with v0.4 columns (result, clues, hours, visits, per-Hour line, tutorial skip step).
- **Tests:** new `tests/v04-test.js` (14 groups) and `tests/ui-playwright-v04.js` (intro A/B/neutral, full tutorial, skip, Look Closer/Shortcut pick, 3 end screens, 0 console errors). The v0.3 suites run with v0.4 off; v0.3 screenshots are in `screenshots/v03/`.
- Questions for Tomek, copy gaps and art-fit notes for Ola: `docs/v04-notes.md`.

## v0.3.2: Bread and Salt text templating (2026-10-18, Greg)
- Tomek: tour step 4 keeps the creature name (domowik/zmora) as built.
- Tomek: the Bread and Salt effect uses the same templating as every card: `{T.TERM_DREAD} −1 and {t.TERM_PRESENCE} goes back to the {t.TRACK_APPROACH_1}.` (real minus sign). Renders "Dread −1 and the domowik/zmora goes back to the Treeline."; with the Presence off, the generic term ("the Presence"); a Dread rename / `?terms=` reaches it. Text and Playwright tests updated (A, B, off, `?terms=TERM_DREAD:Fear`).

## v0.3.1: copy patch + Tomek's Bar ruling (2026-10-18, Greg)
- **Rule (Tomek), flag `presence.barSavesForVisit`, default ON:** if the face-up forecast shows tonight's footprint step(s) (incl. the nights 5-6 extra step) taking the Presence to the Door, an up Bar is held for the visit and the night event gets no Bar protection. Otherwise the Bar still stops whichever comes first. Visit warning, Bar tooltip and next-event tooltip say the Bar is saved for the visit; a toast notes it on the night. New stats column `barHeldForVisit`. Smoke tests: held Bar (footprint and late step), no visit coming, flag off. Sim rerun (`tests/sim-presence-report.txt`, rows with the flag on and off).
- Tomek confirmed v0.3 design readings 1-9 as built.
- **Tour (Tomek):** new step 4, right after the Dread step: highlights the Approach strip and the face-up next event; voice = Zosia's `tour.presence` line. Only when the Presence is on (11 steps; 10 with it off). Other voice lines stay on their topics. The coach text uses the Presence term, so it reads "The domowik/zmora moves along this track..." like the rest of the UI.
- **Copy (Zosia):** tour play step (now step 9) with Bread and Salt: direction A/B lines, neutral line with no direction; the Kompot line stays when the tour deals Kompot (Presence off). How to play: the "WHAT IT IS" writer notes are removed (Questions spoiler) and replaced by a one-line tease per direction; text and Playwright tests check they are never rendered. `tour.presence` stored in the text table. Patch copy saved in `docs/copy/v031-copy-patch.md`.
- Tokens on the board click through to their zone (v0.3 fix, kept).
- **Art: Ola's layout v2.** Re-imported from the manifest (board v2 repaint incl. late board + sky overlay, zone plates, Dread track 1400x300 + steps, Approach track + steps, FX frost WebPs); our PNG->WebP conversions are gone (she ships WebP for everything). `board.overlay_boxes` (roll_tray, door, door_handle, bar_on_door, window) are imported too. `data/board-layout.js` overrides removed for event_card (tonight's event is back there), late_nights_banner (thin strip, nights 5-6 only), visit_warning, hint_line, roll_tray; the only override left is the transient night/visit banner. HUD 356px; hand cards 190x266 (hand variant, effect 14.7px at 1920). Roll dialog set tighter to fit the 1000x400 roll_tray. Zone label strips 40px at y722-762 so they don't clip the Yard footprint ring. Late sky: straight linear 0->1 fade. Long card names shrink in the hand. Art-fit report regenerated with the questions_row and ring checks.
- **Bread and Salt FINAL text:** effect "Dread -1 and the Presence goes back to the Treeline." shown exactly (no term substitution); flavour A "Leave bread and salt by the stove", B "Promise it bread in the morning". Tested in text and Playwright tests.

## v0.3: The Approach, Variant 1 (2026-10-18, Greg)
**Rules (spec: Notion "The Approach", flag `presence.mode` = off | track | token, default track):**
- Approach track Treeline → Yard → Window → Door beside the Dread track; the next night event is face up.
- Footprints on Footsteps, The Gate Creaks, The Silence, The Door Handle; The Door Handle is now Dread +1.
- Night order: event → footprint step(s) (+1 on nights 5-6) → visit check (Bar blocks) → Dread-6 check.
- Treeline Search success: Presence 1 closer. Comfort success: Presence 1 back.
- Visit: Dread +1, COMPANION 1 one zone out, Presence back to the Treeline; a Bar blocks it (Bar used, Presence to the Yard). A Bar is used by whichever comes first.
- Kompot → **Bread and Salt** (Calm): Dread −1, Presence back to the start. The guided Night 1 now deals it.
- `off` = v0.2 exactly; `token` (Variant 2) is parked and falls back to track.
- Design gaps took the simplest reading behind config; see README "Questions for Tomek".

**UI:** Approach track + marker, next-event card with hover zoom, visit warning, visit banner (Zosia's door line, seeded), Bar-stopped banner, late-nights banner, Presence lines in tooltips and the roll dialog, How to play section, debug line. Tokens are clickable (they click their zone).

**Copy (Zosia):** both directions (A domowik, B zmora) verbatim in `data/ui-text.js → presence.dirs`, `?presence=A|B`, default A. Tour voice lines for the guided Night 1 added verbatim. The step numbers in her note matched our steps (4 zones, 5 Search, 6 add cards, 9 Comfort, 10 End turn), so no topic remapping was needed.

**Art (Ola v0.3 + 10 art-fit fixes):** re-imported from the manifest (120 files, 0 missing; PNG-only files converted to WebP). `data/board-layout.js` now uses the manifest boxes, with only the remaining overrides kept. Decisions applied: nights 5-6 cross-fade `sky_late_overlay` (CSS opacity; `presence.lateBoard: 'swap'` / `?late=swap` uses `board_bg_late`); hand cards use `card_frame_hand`/`card_panels_hand` (full frame for zoom and the roll dialog); fx at 8 fps with a single frame under prefers-reduced-motion. Art-fit report updated, with mismatches listed by box name.

**Stats:** presenceMode, presenceDirection, presenceByNight, presenceVisits, presenceVisitsBlocked, offeringsPlayed, comfortPushes, searchPulls, presenceSteps, presenceClosest; perRound `|P<pos>`.

**Tests:** smoke (mixed presence modes + targeted v0.3 rules), text (copy verbatim, A/B complete, tour lines), `tools/sim-presence.js`, Playwright v0.3 checks + screenshots 24-28 (0 console errors), `tests/dist-check.js`.

## v2: clarity pass + art (2026-10-18, Greg)

- Art manifest update (92 assets): the importer now reads the cast from `manifest.cast` and never references `_retired/` or `manifest.retired`, so the thread icon is excluded. Test added. v0.3 (The Approach: Presence track, face-up next event) is approved for after v0.2 and not started.
**Rule set v0.2 (approved by Klaudia via Tomek), default ON, each behind a flag in `config.js → rules`:**
- Draw and Hold the door actions cut (`cutDrawAndHold`). Actions: Move, Search, Comfort, Play a card, End turn (`endTurnButton`).
- Start at 0 clues (`startZeroClues`).
- Chair Under the Handle (Protect, NERVE, places a Bar) replaces Burnt Pierogi (`chairForPierogi`). Max 1 Bar unchanged.
- Adding cards to a roll is a step inside the roll dialog. Comfort lowers Dread by 1 on every success (was already so in the engine; now tested).

**UI rebuild:**
- 1920×1080 stage scaled to the window; everything placed from the artist's manifest boxes (`data/board-layout.js` lists the overrides).
- Real cards (art, panels, frame, glyph, live text), board with zones and tokens, Dread track, moon counter, Question chips, Help portraits, event card.
- Click or drag to play; matching cards glow in the roll dialog; exact odds and all six die faces shown.
- Every change animates with its cause; tooltips on every control with real odds.
- Guided Night 1 (10 coach marks, skippable, replayable), Night 2 hint, How to play panel, Menu for secondary tools.
- VN intro/outro with portraits, name tag and italic stage directions; Question cards slide in at the end of Beat 4; recap line after the outcome.
- All player-facing UI text in `data/ui-text.js`; one-line renames; `?terms=` to try names live.

**Text (Zosia):** end-of-Beat-4 Questions scene, coach-mark voice lines, Question sentences, Chair flavour, recap (tag lines behind `recapTagLines`, default OFF).

**Art (Ola):** imported with `tools/import-art.js` (WebP + SVG, 3.3 MB); coloured icons by default, `iconStyle: 'mono'` switch; greybox fallback for anything missing; `tools/art-fit-audit.js` checks live text against the boxes.

**Data hooks for v0.3 (not built):** zones, events and token anchors are data, ready for a Presence token and a face-up next-night event.

**Stats:** new columns `rules`, `tutorial`, `unusedActions`, `perRound`.

**Tests:** smoke (v0.2 + legacy rule sets), skin, new string-table test, Playwright rewritten for the new UI; screenshots in `screenshots/`.

## v1.2: skin grammar fix (3d46307)
Article-aware name substitution for `?skin=A/B/C`; skin grammar test.

## v1.1: Kostka's rulings (303194e)
No Bar stacking, Photos/Key 1 action, final-bond inserts, Outcome 3b, full kit per-run stats.

## v1.0: greybox prototype (5fbcc10)
Kit v0.1 engine, greybox UI, VN intro/outro, stats, debug, tests.
