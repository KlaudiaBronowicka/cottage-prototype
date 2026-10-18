/* =====================================================================
 * data/board-layout.js — WHERE THINGS SIT on the 1920x1080 encounter stage.
 * Data only: no game rules here, no layout numbers in ui.js.
 * Boxes come from the artist's manifest (assets/manifest.js → board.ui / board.zones; Ola's
 * "v0.3 The Approach + art-fit fixes" layout) unless overridden below; every override says why.
 * The whole stage scales to the viewport.
 * A Variant 2 Presence TOKEN (parked) would add an entry to `tokens` with an anchor per zone.
 * ===================================================================== */
var BOARD_LAYOUT = {
  stage: { w: 1920, h: 1080 },
  // name → manifest ui box id, or an explicit box {x,y,w,h}
  boxes: {
    goalBanner:   'goal_banner',
    nightCounter: 'night_counter',
    dread:        'dread_track',
    approach:     'approach_track',        // v0.3 threat row, next to Dread
    questions:    'questions_row',
    clues:        'clue_counter',
    deck:         'deck',
    actions:      'action_buttons',
    hand:         'hand',
    helpC1:       'help_companion_1',
    helpC2:       'help_companion_2',
    nextEvent:    'next_event_preview',    // v0.3 face-up next event (hover zooms it)
    eventLog:     'event_log',
    turn:         'actions_left_end_turn', // actions left + End turn
    barOnDoor:    'bar_on_door',
    door:         'door', doorHandle: 'door_handle', window: 'window', // visit FX anchors
    // OVERRIDE: the v0.3 manifest has no box for TONIGHT's event card any more (v2 had event_card).
    // Tonight's event goes in the late_nights_banner slot of the threat row; on nights 5-6 that box also
    // carries the "night is ending" line, as the artist intended.
    eventCard:    'late_nights_banner',
    lateBanner:   'late_nights_banner',
    // no manifest boxes for these (text overlays at the top of the zones):
    visitWarn:    { x: 560, y: 428, w: 800, h: 46 },
    hint:         { x: 560, y: 482, w: 800, h: 48 },     // Night 2 hint line
    tray:         { x: 330, y: 250, w: 1260, h: 610 },   // roll dialog, over the zones
    banner:       { x: 460, y: 440, w: 1000, h: 220 }    // night-start / visit banner
  },
  zones: 'manifest',                                     // use manifest board.zones (house, yard, treeline)
  zoneStripH: 70,                                        // live text strip at the bottom of each zone box
  // Token anchors as fractions (0..1) of each zone box: where each token's centre sits.
  tokenSize: 112,
  tokens: {
    POV: { house: [0.62, 0.50], yard: [0.30, 0.46], treeline: [0.36, 0.48] },
    C1:  { house: [0.80, 0.50], yard: [0.70, 0.46], treeline: [0.66, 0.48] },
    C2:  { house: [0.44, 0.54] }                         // COMPANION 2 never leaves the House
  },
  handCard: { w: 143, overlap: 26, liftOnHover: 60, variant: 'hand' }, // 143x200 = the manifest hand box height; 'hand' = the artist's compact hand frame (bigger effect text), 'full' = v2 look
  presenceMarker: 82,                                    // token_128 at the track's 0.643 scale
  nextEventZoomW: 300,
  fxFps: 8,                                              // visit / Bar FX frame rate (artist: ~8 fps); prefers-reduced-motion shows one frame                                   // hover zoom of the next-event card (screen px)
  bgSmallBelow: 1300                                     // use the 1280x720 boards when shown at <= this many device pixels wide
};
if (typeof module !== 'undefined') module.exports = BOARD_LAYOUT;
