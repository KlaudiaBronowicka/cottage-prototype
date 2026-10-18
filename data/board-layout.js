/* =====================================================================
 * data/board-layout.js — WHERE THINGS SIT on the 1920x1080 encounter stage.
 * Data only: no game rules here, no layout numbers in ui.js.
 * Boxes come from the artist's manifest (assets/manifest.js → board.ui / board.zones; Ola's
 * layout v2, 2026-10-18; overlay boxes such as roll_tray and the door FX anchors are merged into board.ui) unless overridden below; every override says why.
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
    eventCard:    'event_card',            // tonight's event (layout v2 brought it back)
    lateBanner:   'late_nights_banner',    // nights 5-6 only
    visitWarn:    'visit_warning',
    hint:         'hint_line',             // Night 2 hint line
    tray:         'roll_tray',             // roll dialog (overlay box, in the zone band)
    // OVERRIDE (no manifest box): the night-start / visit banner, a transient overlay centred in the zone band
    banner:       { x: 460, y: 410, w: 1000, h: 220 }
  },
  zones: 'manifest',                                     // use manifest board.zones (house, yard, treeline)
  zoneStripH: 40,                                        // live text strip at the bottom of each zone box (6px from the bottom: y722-762,
                                                         //   clear of the Yard footprint ring, which ends at about y720 in board_bg v2)
  // Token anchors as fractions (0..1) of each zone box: where each token's centre sits.
  tokenSize: 112,
  tokens: {
    POV: { house: [0.62, 0.50], yard: [0.30, 0.46], treeline: [0.36, 0.48] },
    C1:  { house: [0.80, 0.50], yard: [0.70, 0.46], treeline: [0.66, 0.48] },
    C2:  { house: [0.44, 0.54] }                         // COMPANION 2 never leaves the House
  },
  handCard: { w: 190, overlap: 26, liftOnHover: 60, variant: 'hand' }, // 190x266 = the manifest hand box (layout v2); 'hand' = the artist's hand frame, 'full' = v2 look
  presenceMarker: 82,                                    // token_128 at the track's 0.643 scale
  nextEventZoomW: 300,                                   // hover zoom of the next-event card (stage px)
  fxFps: 8,                                              // visit / Bar FX frame rate (artist: ~8 fps); prefers-reduced-motion shows one frame
  bgSmallBelow: 1300                                     // use the 1280x720 boards when shown at <= this many device pixels wide
};
if (typeof module !== 'undefined') module.exports = BOARD_LAYOUT;
