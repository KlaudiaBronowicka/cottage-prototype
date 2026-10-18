# v0.4 "Stripped Core": notes for Tomek, Zosia and Ola (2026-10-18)

Spec: `gdd/v04/encounter-v0.4.md` (local copy; Notion not needed). Reference sim: `gdd/sim/sim_v04.py`.

## Sim parity (5000 runs/row, JS = `node tools/sim-v04.js 5000 11` on the real engine; Python = `results_v04_5000.txt`)
| Row / bot | JS win | Py win | JS Dread 6 | Py Dread 6 | JS short | Py short | JS clues | Py clues | JS visits | Py visits |
|---|---|---|---|---|---|---|---|---|---|---|
| FINAL naive | 6.9 | 6.5 | 28.2 | 29.0 | 64.9 | 64.5 | 2.12 | 2.12 | 1.81 | 1.83 |
| FINAL casual | 32.4 | 32.9 | 13.8 | 14.2 | 53.8 | 52.8 | 3.72 | 3.80 | 0.67 | 0.67 |
| FINAL smart | 47.9 | 46.2 | 16.1 | 16.1 | 36.0 | 37.8 | 4.01 | 3.99 | 0.54 | 0.54 |
| N=4 smart | 60.2 | 59.7 | | | | | | | | |
| N=6 smart | 26.8 | 25.7 | | | | | | | | |
| visit +2 smart | 39.0 | 37.6 | 32.7 | 31.9 | | | | | | |
| no late smart | **57.3** | 53.6 | 8.7 | 9.1 | | | | | | |
| Bar not saved smart | **52.8** | 49.3 | 12.1 | 11.6 | | | | | 1.12 | 1.13 |
| fallback smart | **47.2** | 44.9 | 16.2 | 16.5 | | | | | 0.62 | 0.64 |
| reference smart | **66.4** | 62.3 | 4.6 | 5.0 | | | | | | |

Bold = gap over 2 points (all smart-bot win rates). Cause: in Hour 6, `sim_v04.py`'s smart bot reads `ev[-1]` as a "next event" (2 events are still unseen), so it spends actions protecting against a visit that can't happen. The game shows no next event in Hour 6 ("Dawn comes next"). `node tools/sim-v04.js 5000 11 --pyquirk` copies the quirk and lands within about 1 point of Python on every row (smart: 45.8 / 58.7 / 24.9 / 37.3 / 53.8 / 49.2 / 44.9 / 62.7), see `tests/sim-v04-report-pyquirk.txt`. So the rules match, and the gap is in the bot.

## Tomek's rulings (v0.4.1)
1. **Ward with nothing to push** (`v04.wardNeedsTarget: true`): kept — can't be played when the creature is on the Treeline.
2. **Shortcut**: either neighbour (`v04.shortcutEitherWay: true`) — works either way.
3. **Bread and Salt in the footprint fallback**: sends the creature to the Treeline (`presence.offeringReturnTo: 0`), not to the fallback start (Yard).
4. **Visit warning under a Bar**: hidden (spec §11). The v0.3 "Bar saved for the visit" line isn't used in v0.4.
5. **Title / intro page**: OK — Zosia's one-screen intro stays; Start goes straight to the board.
6. **Lose-dread headlines** (overrides Zosia's keep of "Dread hit 6."): title **The dark got in.** · result **You couldn't hold on until dawn.** (was "The night broke.").
7. **End line split**: kept — Ola's title + result boxes (Dawn. / You made it to morning… · The dark got in. / You couldn't hold on… · Dawn came, / but you only found…).
8. **Reference sim**: our engine (`tools/sim-v04.js` / JS) is the reference; Tomek is fixing `sim_v04.py` to match (Hour-6 forecast quirk was on the Python side).
9. **Guided Hours 1-2 use safe rolls** (no bad omen, no −1) until the handoff (`v04.tutorial.safeRolls`). After the tutorial: 3 clues, Dread 1, creature on the Treeline. (unchanged)

## Remaining "night" wording in v0.4-visible strings (listed only; not changed in v0.4.1)
- `presence.dirs.A.howTease` / `B.howTease`: "…at night…" — shown in How to play when `?presence=A|B`.
- Everything else that said "night" goes through `{t.TERM_NIGHT}` → **hour** / `{T.TERM_NIGHT}` → **Hour** in v0.4.

## Art (Ola, v0.4.1 layout pass)
Re-imported. See cottage-art README v0.4.1. New keys: `end.statsPanel`, `presence.artNeutral`, `presence.markerNeutral`. Boxes: `card_inspect`, `card_inspect_bar`, `stats_row` / `run_stats` / `send_results`. Board art +20px; hint_line 120 → coach text 19px. Art-fit: `tests/art-fit-report-v041.txt`.

## Art (Ola, v0.4 delivery): keys
All 10 cards (`cards/art/look_closer … bread_and_salt`), `icons/hour_1..6`, `icons/clue`, insight magnifier, `board/zone_strip_house|yard|treeline`, `end/win|dread|dawn_fail` (+1280x720), both boards and sky_late_overlay are imported (122 files, 0 missing). Nothing is outstanding for v0.4. Optional: the creature has no **neutral** art (it is direction-less by default in v0.4). The track marker uses the generic marker, and the visit banner shows no creature art unless `?presence=A|B`.

## Art-fit report, mismatches for Ola (`node tools/art-fit-v04.js` → `tests/art-fit-report-v041.txt`)
v0.4.1 layout pass: **no overflows**. Zone strips at y728-768 (ring ~y723, clear). hint_line 120 → coach text 19 stage px (fits all 10 steps). night_counter 480 / deck 210 / roll_tray y364 / door FX +20y / end stats_row all fit. card_inspect @380 measured.
- **Note (1280×720 only):** coach text is 12.7 screen px (19 stage × 2/3). At 1920 it is 19 screen px. If the 14 px minimum applies to the coach at 1280, the strip would need a taller/wider box or a higher minimum font when the stage is scaled down.
- Hand effect text still 14.7 stage px → 9.8 screen at 1280 (same as v0.3; Ola called ADD TO ROLL 8.1 at inspect a label, not body).
- **v0.3.2 only (`?v04=0`)**: retired art → greyboxes; `roll_icons` max 1; Bar-saved visit warning still needs 901 of 840 px.

## Copy (Zosia FINAL, v0.4.1; all in `data/ui-text.js → v04`)
- Card flavours for the 7 new cards; Warm Stove / Bar the Door still reuse the v0.3 stove/chair lines.
- Neutral creature door + Bread and Salt flavour.
- End headlines, row labels ("Clues found", visits value "N · Bar held M"), Play again / Play with tutorial tips.
- How to play body (5 paragraphs) + glossary (incl. Strong success); Omen and presence howRules unchanged.
- `rollNeedsCard`, `ui.coachTryIt`, `ui.coachSkipTip` (v0.4 overrides). `you` / `coachSkip` kept.
- Tour voice lines from v0.3 are dropped in v0.4 (no characters).
