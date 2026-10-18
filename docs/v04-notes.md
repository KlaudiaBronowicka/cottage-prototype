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

## Questions for Tomek (design gaps: simplest reading, behind config)
1. **Ward with nothing to push** (creature on the Treeline): can't be played (`v04.wardNeedsTarget: true`). Should it be playable as a wasted card?
2. **Shortcut direction**: either neighbour (`v04.shortcutEitherWay: true`). Should it be outward only?
3. **Bread and Salt in the footprint fallback**: sends the creature to the Treeline (`presence.offeringReturnTo: 0`), not to the fallback start (Yard). With the start position, the fallback over-counted visits.
4. **Visit warning while a Bar is up** is hidden (spec §11). The v0.3 "Bar saved for the visit" line isn't used.
5. **Intro**: Zosia's one-screen intro is the title screen (Start goes straight to the board). The spec says "start straight on the board"; is one screen OK?
6. **Lose-dread line** "The night broke." still says *night* (spec verbatim) though everything else is *Hour*. Should it stay?
7. **End line split**: Ola's end screens have a title box and a result box, so each spec line is split at the full stop/comma (Dawn. | You made it, with N clues. · Dread hit 6. | The night broke. · Dawn came, | but you only found N of 5 clues.).
8. **Python sim Hour-6 forecast quirk** (above). Should the reference sim be fixed?
9. **Guided Hours 1-2 use safe rolls** (no bad omen, no −1) until the handoff (`v04.tutorial.safeRolls`). After the tutorial: 3 clues, Dread 1, creature on the Treeline.

## Art (Ola, v0.4 delivery): keys
All 10 cards (`cards/art/look_closer … bread_and_salt`), `icons/hour_1..6`, `icons/clue`, insight magnifier, `board/zone_strip_house|yard|treeline`, `end/win|dread|dawn_fail` (+1280x720), both boards and sky_late_overlay are imported (122 files, 0 missing). Nothing is outstanding for v0.4. Optional: the creature has no **neutral** art (it is direction-less by default in v0.4). The track marker uses the generic marker, and the visit banner shows no creature art unless `?presence=A|B`.

## Art-fit report, mismatches for Ola (`node tools/art-fit-v04.js` → `tests/art-fit-report-v04.txt`)
- **hint_line (coach strip) 1000×90**: Zosia/Tomek's tutorial copy at 19-20 px needs 107-109 px on steps 3 (creature), 4 (search), 5 (move) and 9 (bread). We set the strip text at 17 px (11.3 px on screen at 1280×720), so all 10 steps fit in 90. A box about 110-120 px tall (or wider) would allow 19-20 px.
- **night_counter 450×64**: "Hour 1 of 6" + 6 candles + dawn needed 466 px at our spacing. Fixed by tightening the candle gap to 2 px; candles are 40 px.
- **deck 120×180** (unchanged box): "Cards left / Used" needed 184 px. Fixed with a tighter line height.
- **End screens**: title / result_line / play_again / play_with_tutorial fit on all three screens at both sizes (title 72 px). Run stats + "Send results" have no box; we put a small strip at y966-1070 over the foreground snow. Is a box wanted?
- **Zone strips**: art is exactly 650/740/470×40 at y722-762; the footprint ring ends ~y703, clear.
- **tutorial_modal 800×360**: the handoff fits at 20 px. **skip_tutorial 150×64** fits.
- Hand: 190×266 cards, effect text 14.7 px at 1920 (9.8 px at 1280, under the 14 px artist note; same as v0.3). 6 cards need 1010 px of the 1190 hand box (7 after Rummage: 1176).
- **v0.3.2 only (`?v04=0`)**: the retired art shows greyboxes (moons → numbers, Questions, Help portraits, plates). `roll_icons` max 1 means 2-icon v0.3 cards show one icon. The Bar-saved visit warning needs 901 of 840 px (v0.4 hides that warning).

## Copy gaps (minimal neutral text written; for Zosia/Tomek, all in `data/ui-text.js → v04`)
- Card flavour lines: Look Closer, Lucky Find, Sharp Eyes, Deep Breath, Ward, Shortcut, Rummage (empty). Warm Stove / Bar the Door reuse the v0.3 stove/chair lines.
- Neutral creature lines: door line "Something tries the handle, slowly. Then it lets go."; Bread and Salt neutral flavour "Old manners. They still work."
- End-screen stat row labels; "Play again" / "Play with tutorial" tooltips.
- How to play (v0.4) page.
- Roll-window nudge when the tutorial's card isn't added yet (rollNeedsCard).
- Player token label "You"; coach chrome "Try it: use the highlighted control." and "Skip tutorial".
- Tour voice lines from v0.3 are dropped in v0.4 (no characters).
