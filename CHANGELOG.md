# Changelog

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
