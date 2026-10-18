# Changelog

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
