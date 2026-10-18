/* =====================================================================
 * data/board-layout.js — WHERE THINGS SIT on the 1920x1080 encounter stage.
 * Data only: no game rules here, no layout numbers in ui.js.
 * Boxes come from the artist's manifest (assets/manifest.js → board.ui / board.zones)
 * unless overridden below; every override says why. The whole stage scales to the viewport.
 * v0.3 hooks (NOT built yet, per Tomek): a moving Presence token = add an entry to `tokens`
 * with an anchor per zone; a face-up next-night event = add a `nextEvent` box. Both are
 * positioned from this file, so the engine stays layout-free.
 * ===================================================================== */
var BOARD_LAYOUT = {
  stage: { w: 1920, h: 1080 },
  // name → manifest ui box id, or an explicit box {x,y,w,h}
  boxes: {
    goalBanner:   'goal_banner',
    nightCounter: 'night_counter',
    dread:        'dread_track',
    questions:    'questions_row',
    clues:        'clue_counter',
    deck:         'deck',
    eventCard:    'event_card',
    eventLog:     'event_log',
    turn:         'actions_left_end_turn',              // actions left + End turn (artist's box)
    // OVERRIDE: the artist's hand box (290..1630) has no room for the action buttons or the two Help portraits,
    // which have no box in the manifest. Split it: actions | hand | helps.
    actions:      { x: 190, y: 872, w: 290, h: 196 },
    hand:         { x: 500, y: 862, w: 930, h: 210 },
    helps:        { x: 1440, y: 868, w: 300, h: 200 },
    // OVERRIDE: manifest bar_on_door (468,330) sits on the roof; the cottage door in board_bg is at about x272, y505.
    barOnDoor:    { x: 236, y: 452, w: 72, h: 72 },
    hint:         { x: 560, y: 252, w: 800, h: 48 },     // Night 2 hint line (top of the zones)
    tray:         { x: 330, y: 240, w: 1260, h: 600 },   // roll dialog, over the zones
    banner:       { x: 460, y: 400, w: 1000, h: 220 }    // night-start banner
  },
  zones: 'manifest',                                     // use manifest board.zones (house, yard, treeline)
  zoneStripH: 70,                                        // live text strip at the bottom of each zone box
  // Token anchors as fractions (0..1) of each zone box: where each token's centre sits. Data-driven so a v0.3 Presence token can be added.
  tokenSize: 112,
  tokens: {
    POV: { house: [0.66, 0.62], yard: [0.42, 0.52], treeline: [0.40, 0.55] },
    C1:  { house: [0.84, 0.62], yard: [0.64, 0.52], treeline: [0.62, 0.55] },
    C2:  { house: [0.44, 0.64] }                         // COMPANION 2 never leaves the House
  },
  handCard: { w: 190, overlap: 26, liftOnHover: 60 },    // hand cards rise above the tray (y < 862) so they stay legible
  bgSmallBelow: 1300                                     // use board_bg_1280x720 when the board is shown at <= this many device pixels wide
};
if (typeof module !== 'undefined') module.exports = BOARD_LAYOUT;
