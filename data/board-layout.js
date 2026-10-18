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
    // v0.4 layout v3 (Ola): questions_row and the two Help boxes are gone from the manifest. These are the v0.3 boxes, kept ONLY so the
    // v0.3.2 build (?v04=0) still renders (with greyboxes where its art was retired). Not used in v0.4.
    questions:    { x: 30, y: 242, w: 1500, h: 70 },
    clues:        'clue_counter',
    deck:         'deck',
    actions:      'action_buttons',
    hand:         'hand',
    helpC1:       { x: 1396, y: 841, w: 160, h: 200 },   // v0.3.2 only (see questions)
    helpC2:       { x: 1562, y: 841, w: 160, h: 200 },   // v0.3.2 only
    nextEvent:    'next_event_preview',    // v0.3 face-up next event (hover zooms it)
    eventLog:     'event_log',
    turn:         'actions_left_end_turn', // actions left + End turn
    barOnDoor:    'bar_on_door',
    door:         'door', doorHandle: 'door_handle', window: 'window', // visit FX anchors
    eventCard:    'event_card',            // tonight's event (layout v2 brought it back)
    lateBanner:   'late_nights_banner',    // nights 5-6 only
    visitWarn:    'visit_warning',
    hint:         'hint_line',             // v0.3 Night 2 hint line; v0.4: the tutorial coach strip (3 lines)
    coach:        'hint_line',             // v0.4 tutorial coach text sits here (Ola layout v3)
    tutorialModal:'tutorial_modal',        // v0.4 tutorial handoff (step 10)
    skipTutorial: 'skip_tutorial',         // v0.4 "Skip tutorial" corner button (tutorial only)
    tray:         'roll_tray',             // roll dialog (overlay box, in the zone band)
    // OVERRIDE (no manifest box): the night-start / visit banner, a transient overlay centred in the zone band
    banner:       { x: 460, y: 410, w: 1000, h: 220 }
  },
  // v0.3.2-only artist slots whose files/boxes were retired in v0.4 (so ?v04=0 still lays out its Question cards, Help portraits, plates)
  legacy: {
    questionLayout: { art: { x: 75, y: 80, w: 600, h: 400 }, question_text: { x: 70, y: 584, w: 610, h: 270 }, cost: { x: 70, y: 880, w: 610, h: 110 }, icon: { x: 315, y: 448, w: 120, h: 120 } },
    helpSlots: { stats: { x: 32, y: 248, w: 120, h: 52 }, text: { x: 28, y: 306, w: 264, h: 68 } },
    plateSlots: { title: { x: 24, y: 240, w: 200, h: 30 }, need_reward: { x: 24, y: 272, w: 432, h: 36 }, markers: { x: 24, y: 24, w: 432, h: 120 } }
  },
  zones: 'manifest',                                     // use manifest board.zones (house, yard, treeline)
  zoneStripH: 40,                                        // live text strip at the bottom of each zone box (6px from the bottom: y722-762; v0.4 zones y340 h428, art strip board/zone_strip_<zone>;
                                                         //   clear of the Yard footprint ring, which ends at about y703 in board_bg v3)
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
