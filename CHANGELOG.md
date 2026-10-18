# Changelog

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
