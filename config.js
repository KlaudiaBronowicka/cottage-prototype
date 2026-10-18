/* =====================================================================
 * config.js  —  ALL TUNING NUMBERS FOR THE COTTAGE ENCOUNTER PROTOTYPE
 * ---------------------------------------------------------------------
 * Source: "Cottage Paper Prototype Kit v0.1" (Game Designer, 18 Oct 2026).
 * Every value marked [T] in the kit is tunable here. Edit, save, reload.
 * Nothing else in the code holds a gameplay number.
 * Lines marked "RULED (Kostka 2026-10-18)" were spec gaps the Game Designer has ruled on.
 * ===================================================================== */
var CONFIG = {
  version: 'v0.4.1 Stripped Core (on kit-v0.1 + rules v0.2 + v0.3.2) / build 7',

  // ---------- Setup ----------
  startPressure: 0,          // pressure token starts here
  startProgress: 1,          // [T] "what you learned during the day" (rules.startZeroClues overrides to 0)
  startingHand: 5,           // [T] cards drawn at setup
  handLimit: 6,              // hand limit, checked at END of round (discard down)
  rounds: 6,                 // [T] DAWN after this many rounds
  actionsPerRound: 2,        // actions per round (repeats allowed)
  allowPass: true,           // RULED (Kostka 2026-10-18): actions are optional; the player may end the round with actions unspent

  // ---------- Pressure ----------
  pressureMax: 6,            // [T] reaching this ends the encounter immediately (COMPANION 1 walks out)
  pressureMin: 0,            // RULED (Kostka 2026-10-18): pressure floor 0 (track is 0-6) — confirmed
  exposurePOV: 1,            // [T] END: +pressure if the POV ends the round in the Treeline
  exposureC1: 1,             // [T] END: +pressure if COMPANION 1 ends the round in the Treeline
  highPressureInsert: [4, 5],// outcome insert "nobody slept" shows for final pressure in this range

  // ---------- Zones (order matters: index 0 = House, outward = higher index) ----------
  zones: [
    { id: 'house',    name: 'House',    investigateDifficulty: 2, progress: 1 }, // [T]
    { id: 'yard',     name: 'Yard',     investigateDifficulty: 3, progress: 2 }, // [T]
    { id: 'treeline', name: 'Treeline', investigateDifficulty: 4, progress: 3 }  // [T]
  ],
  holdDoorZone: 'house',     // Hold the door works only here

  // ---------- Tests ----------
  testBase: 2,               // [T] base value of every test
  steadyDifficulty: 2,       // [T] CARE test
  holdDoorDifficulty: 3,     // [T] NERVE test
  strongMargin: 3,           // [T] strong success if total >= difficulty + this
  strongInvestigateBonus: 1, // strong Investigate: +progress
  strongSteadyBonus: 1,      // strong Steady: extra -pressure
  starPressure: 1,           // STAR token: automatic fail and +this pressure
  // Test bag = d6. Index 0 is a roll of 1. Value 'STAR' = auto-fail. [T]
  testBag: [0, 0, 0, -1, +1, 'STAR'],
  steadyPressureRelief: 1,   // Steady success: pressure -this (and COMPANION 1 one zone toward House)

  // ---------- Bars ----------
  barsStack: false,          // RULED (Kostka 2026-10-18): Bars do NOT stack — max 1 Bar on the board; Hold the door / Mother's Rule are greyed out while one is down

  // ---------- Companion Help (each usable once; Burnt Pierogi readies one, if it is in the deck) ----------
  helpBonus: 2,              // [T] +2 to a test
  helpBonusBonded: 3,        // [T] +3 if her bond rose in Beat 4
  helps: {
    c1: { stats: ['CARE'],            onlyInHouse: true  },  // COMPANION 1: CARE tests, only while she is in the House
    c2: { stats: ['INSIGHT', 'NERVE'], onlyInHouse: false } // COMPANION 2: INSIGHT or NERVE tests
  },
  allowBothHelpsOnOneTest: true, // RULED (Kostka 2026-10-18): confirmed (Help follows the cards, so the two never share a stat anyway)

  // ---------- Bond change (flag out) ----------
  c1BondPlusIfBroughtBackAndHome: 1,  // [T] +1 if you moved her toward the House at least once AND she ends in the House
  c1BondMinusIfOutside: -1,           // [T] -1 if she ends outside the House

  // ---------- Threads (spend progress at the end, full cost each) ----------
  threads: [
    { id: 'T1', name: 'The Being',     cost: 3 },  // owner: the BEING
    { id: 'T2', name: 'The Companion', cost: 4 },  // owner: COMPANION 1
    { id: 'T3', name: 'The Past',      cost: 2 }   // owner: the POV, through the OBJECT
  ],
  maxThreadsIfPressureMaxed: 1,      // if pressure reached max you may resolve at most this many
  allThreadsNeedEscapedTogether: true,

  // ---------- Player deck (12 cards, fixed; no reshuffle when empty) ----------
  // name/text here are INTERNAL labels for the debug log. Player-facing card names, rules text and flavour: data/ui-text.js
  // icons: I = INSIGHT, N = NERVE, C = CARE. Committing gives +1 per matching icon.
  // effect: key handled in game.js; value = effect amount where relevant.
  deck: [
    { id: 'photos',   name: 'Footprint Photos',  icons: ['I','I'], effect: 'investigateYardFromHouse', text: 'Investigate the Yard without leaving the House.' },
    { id: 'rule',     name: "Mother's Rule",     icons: ['N'],     effect: 'placeBar',          text: 'Place a Bar: cancel the next Night event.', beat3: '3a' },
    { id: 'object',   name: 'The Object',        icons: ['I'],     effect: 'progressObject', value: 1, valueShared: 2, text: 'Gain 1 progress. If key choice = SHARED, gain 2 instead.', beat3: '3c' },
    { id: 'torch',    name: 'Torch',             icons: ['I','N'], effect: 'torch', value: 1,   text: 'Your next Investigate this round is 1 difficulty easier.' },
    { id: 'blanket',  name: 'Thick Blanket',     icons: ['C','C'], effect: 'c1Home',            text: '{C1} returns to the House.' },
    { id: 'kompot',   name: 'Kompot',            icons: ['C'],     effect: 'pressure', value: -1, text: 'Pressure -1.' },
    { id: 'story',    name: "The Host's Story",  icons: ['I','N'], effect: 'progress', value: 1, text: 'Gain 1 progress.' },
    { id: 'phone',    name: 'Phone at 4%',       icons: ['I'],     effect: 'draw', value: 2,    text: 'Draw 2 cards.' },
    { id: 'pierogi',  name: 'Burnt Pierogi',     icons: ['C','N'], effect: 'readyHelp',         text: "One companion's used Help becomes ready again." },
    { id: 'key',      name: 'Key on a String',   icons: ['N'],     effect: 'investigateAnyZone', text: 'Investigate any zone without moving there.' },
    { id: 'stove',    name: 'Stove Fire',        icons: ['N','C'], effect: 'pressure', value: -2, text: 'Pressure -2.' },
    { id: 'later',    name: '"Later, Properly"', icons: ['C','I'], effect: 'c1InwardAndCalm', value: -1, text: 'No test: {C1} moves one zone toward the House and pressure -1.', beat3: '3b' }
  ],
  // RULED (Kostka 2026-10-18): Footprint Photos = 1 action total incl. its Investigate test; POV must be in the House; investigates the Yard.
  //   Key on a String = 1 action total incl. its test; usable from any zone, on any zone (no setting needed).
  photosRequiresHouse: true,
  // RULED (Kostka 2026-10-18): Burnt Pierogi can't be played while no Help has been used (confirmed).
  pierogiNeedsUsedHelp: true,

  // ---------- Night events (8; one flipped per round, so 6 of 8 seen) ----------
  // pressure: change; c1Out: COMPANION 1 moves outward this many zones; discardRandom: cards;
  // onlyIfPOVOutside: effect only if POV is not in the House; noEndDraw: skip end-of-round draw.
  events: [
    { id: 'footsteps', name: 'Footsteps',          pressure: 1 },
    { id: 'voice',     name: 'The Voice',          pressure: 1, c1Out: 1 },
    { id: 'lights',    name: 'The Lights Fail',    pressure: 1, discardRandom: 1 },
    { id: 'gate',      name: 'The Gate Creaks',    pressure: 1, onlyIfPOVOutside: true },
    { id: 'message',   name: 'Message: No Sender', pressure: 1, c1Out: 1 },
    { id: 'silence',   name: 'Silence',            pressure: 1, noEndDraw: true },
    { id: 'handle',    name: 'The Door Handle',    pressure: 2 },
    { id: 'voice2',    name: 'The Voice, Again',   pressure: 1, c1Out: 1 }
  ],

  // ---------- VN-side options ----------
  // Faster VN variant: visit only 2 of the 3 Beat 3 spots; the skipped spot's card is removed from the deck.
  fasterVariant: false,
  beat3SpotsToVisit: 2,      // used only when fasterVariant = true

  // ---------- Rule set v0.2 (Clarity Pass, APPROVED by Klaudia via Tomek, 2026-10-18) ----------
  // Each change is a flag so it can be switched back. All ON = approved default.
  rules: {
    cutDrawAndHold: true,   // remove the Draw and Hold the door actions (4 actions: Move, Search, Comfort, Play a card)
    endTurnButton: true,    // explicit "End turn" button (actions are optional); OFF = old "End round" button
    startZeroClues: true,   // start with 0 clues instead of startProgress
    chairForPierogi: true   // replace Burnt Pierogi with Chair Under the Handle (below); drops the "ready a used Help" rule
  },
  chairCard: { id: 'chair', name: 'Chair Under the Handle', icons: ['N'], effect: 'placeBar', text: 'Place a Bar: cancel the next Night event.' },
  // Guided Night 1 (tutorial): fixed first event and these cards on top of the deck (INSIGHT card + calming card).
  tutorialEvent: 'footsteps',
  tutorialHand: ['story', 'kompot'],
  // Outcome recap (Narrative Writer): the COMPANION 2 line always shows; the extra tag lines only when this is ON.
  recapTagLines: false,

  // ---------- v0.3 "The Approach" (Tension Pass v0.3, Variant 1, APPROVED by Klaudia 18 Oct 2026) ----------
  // A PRESENCE walks a 4-space Approach track (Treeline > Yard > Window > Door). It is never fought, only turned away.
  // mode: 'off' = rule set v0.2 exactly · 'track' = Variant 1 (default) · 'token' = Variant 2 (PARKED, not built:
  //   falls back to 'track' and is logged as presenceMode 'token>track'). URL ?presence=off|track|token|A|B overrides.
  presence: {
    mode: 'track',
    direction: 'A',             // copy set in data/ui-text.js presence.dirs: 'A' = the domowik, 'B' = the zmora
    spaces: ['treeline', 'yard', 'window', 'door'], // track order; names in ui-text terms TRACK_APPROACH_1..4
    start: 0,                   // index into spaces: starts on the Treeline
    footprintEvents: ['footsteps', 'gate', 'silence', 'handle'], // a marked event steps the Presence when it resolves (even if a Bar cancels it)
    footprintSteps: 1,
    lateFromNight: 5,           // nights 5-6: extra step(s) each night
    lateExtraSteps: 1,
    lateStepNeedsFootprint: false, // GAP (Tomek): spec reads "1 extra step each night"; true = only on footprint nights
    treelineSearchSteps: 1,     // a successful Search OF the Treeline draws it closer
    searchPullCountsCards: true,// GAP (Tomek): Key on a String searching the Treeline counts too
    comfortPushBack: 1,         // a Comfort success turns it back this many spaces (not past the start)
    visitDread: 1,              // visit at the Door (no Bar): Dread +1 ...
    visitC1Out: 1,              // ... and COMPANION 1 one zone outward ...
    visitReturnTo: 0,           // ... then the Presence goes back to the Treeline
    barBlockReturnTo: 1,        // a Bar stops the visit (Bar used); the Presence falls back to the Yard
    barSavesForVisit: true,     // v0.3.1 (Tomek): if tonight's footprint step(s) take it to the Door, an up Bar is held for the visit
                                //   and the night event is NOT stopped. false = the Bar stops whichever comes first (v0.3).
    eventOverrides: { handle: { pressure: 1 } }, // The Door Handle: Dread +2 -> +1 (tuned)
    offeringCard: { id: 'bread', replaces: 'kompot', name: 'Bread and Salt', icons: ['C'], effect: 'offering', value: -1, text: 'Dread -1 and the Presence goes back to the Treeline.' },
    tutorialHand: ['story', 'bread'],
    doorLineCount: 3,           // visit lines per direction (data/ui-text.js); one is picked with the seeded RNG
    lateBoard: 'overlay'        // nights 5-6 look: 'overlay' = cross-fade the artist's sky_late_overlay over the board (default, Klaudia/Ola decision)
                                //   'swap' = swap to board_bg_late · 'none' = no change. URL ?late=overlay|swap|none overrides.
  },

  // ---------- v0.4 "Stripped Core" (APPROVED direction, Klaudia via Tomek, 18 Oct 2026; spec: gdd/v04/encounter-v0.4.md) ----------
  // enabled: true = v0.4 (default). false = the v0.3.2 build exactly (story, Questions, companions, Nights). URL ?v04=0|1 overrides.
  // Each sub-flag below returns its piece to v0.3.2 when switched off. Tested combinations: all ON (v0.4) and enabled:false (v0.3.2).
  v04: {
    enabled: true,
    noStory: true,          // no VN intro/outro/beats/spots/choices; the title shows the one-screen intro (Zosia) and starts straight on the board
    noQuestions: true,      // no Questions HUD, no dawn spend; outcomes win / lose_dread / lose_short
    noCompanions: true,     // no COMPANION tokens, no Help, no "pulled outside"; Comfort = Dread -1 and the creature back 1
    noNerve: true,          // cards carry one boost icon: I = magnifier (+1 to Search), C = heart (+1 to Comfort)
    turnName: 'hour',       // 'hour' = Hours everywhere (string table overrides in data/ui-text.js v04); 'night' = v0.3 wording
    clueGoal: 5,            // [T] win: reach dawn with this many clues and Dread under pressureMax
    hintsNight2: false,     // the old Night 2 hint line is gone
    encounterBonus: null,   // RESERVED hook (not built, no-op): later generic story bonus, e.g. 'extraActionHour1' | 'extraCard'
    // Presence pace: steps every Hour, +1 on Hours 5-6. Footprints OFF (fallback below).
    presence: {
      mode: 'track',
      direction: null,      // null = neutral "the creature"; ?presence=A|B swaps in the domowik / zmora name and art (flavour only)
      stepsPerHour: 1,
      lateFromHour: 5, lateExtraSteps: 1,
      footprints: false,    // true = fallback: footprints on footprintEvents, start on the Yard, stepsPerHour 0 (use fallbackPresence)
      footprintEvents: ['footsteps', 'knocking', 'whispers', 'lights', 'gate', 'silence', 'handle'], // all but Cold Draught (fallback only)
      start: 0, visitDread: 1, visitC1Out: 0, visitReturnTo: 0, barBlockReturnTo: 1, barSavesForVisit: true,
      treelineSearchSteps: 1, searchPullCountsCards: true, comfortPushBack: 1,
      offeringReturnTo: 0,  // Bread and Salt: back to the trees (Treeline), also in the footprint fallback where it starts on the Yard
      eventOverrides: {}, offeringCard: null, lateStepNeedsFootprint: false
    },
    // ?footprints=1 applies this on top (Tomek's fallback row in the sim: same balance)
    fallbackPresence: { footprints: true, start: 1, stepsPerHour: 0 },
    // 10 generic cards. icons: I = magnifier (+1 to Search), C = heart (+1 to Comfort). One icon each: 5 magnifier, 5 heart.
    deck: [
      { id: 'lookCloser', name: 'Look Closer',    icons: ['I'], effect: 'searchAdjacent',          text: 'Search an adjacent area without moving.' },
      { id: 'luckyFind',  name: 'Lucky Find',     icons: ['I'], effect: 'progress', value: 1,     text: '+1 clue.' },
      { id: 'sharpEyes',  name: 'Sharp Eyes',     icons: ['I'], effect: 'torch', value: 1,        text: 'Your next Search this hour is 1 easier.' },
      { id: 'deepBreath', name: 'Deep Breath',    icons: ['C'], effect: 'pressure', value: -1,    text: 'Dread -1.' },
      { id: 'warmStove',  name: 'Warm Stove',     icons: ['C'], effect: 'pressure', value: -2,    text: 'Dread -2.' },
      { id: 'bread',      name: 'Bread and Salt', icons: ['C'], effect: 'offering', value: -1,    text: 'Dread -1 and the creature goes back to the trees.' },
      { id: 'bar',        name: 'Bar the Door',   icons: ['C'], effect: 'placeBar',               text: 'Bar the door: stops the next event or one visit. Max 1 Bar.' },
      { id: 'ward',       name: 'Ward',           icons: ['C'], effect: 'pushBack', value: 2,     text: 'Push the creature back 2 steps.' },
      { id: 'shortcut',   name: 'Shortcut',       icons: ['I'], effect: 'moveSearch',             text: '+1 move: move 1 area and Search there, as one action.' },
      { id: 'rummage',    name: 'Rummage',        icons: ['I'], effect: 'draw', value: 2,         text: 'Draw 2 cards.' }
    ],
    // Card art: Ola's v0.4 delivery has art for all 10 cards (cards/art/<file>, mapped in tools/import-art.js); a missing file = placeholder in the category frame.
    // 8 events, all Dread +1; three twists. extraIfOutside: +n more if you're outside the House.
    events: [
      { id: 'footsteps', name: 'Footsteps',       pressure: 1 },
      { id: 'knocking',  name: 'Knocking',        pressure: 1 },
      { id: 'whispers',  name: 'Whispers',        pressure: 1 },
      { id: 'draught',   name: 'Cold Draught',    pressure: 1 },
      { id: 'handle',    name: 'The Door Handle', pressure: 1 },
      { id: 'lights',    name: 'Lights Fail',     pressure: 1, discardRandom: 1 },
      { id: 'gate',      name: 'The Gate Creaks', pressure: 1, extraIfOutside: 1 },
      { id: 'silence',   name: 'Silence',         pressure: 1, noEndDraw: true }
    ],
    // Tutorial: guided Hours 1-2 (10 steps, data/ui-text.js v04.onboarding), then a handoff, then tooltips only.
    tutorial: {
      guidedHours: 2,
      events: ['footsteps', 'knocking', 'draught'],
      hand: ['rummage', 'shortcut', 'bread', 'bar', 'deepBreath'],
      safeRolls: true       // guided rolls never show a bad omen or a -1 (the lesson always works)
    },
    // GAP (Tomek): Ward with the creature already at the trees has nothing to push. true = can't be played then (simplest UX); false = playable, no effect
    wardNeedsTarget: true,
    // GAP (Tomek): Shortcut "move 1 area and Search there". true = move either way (spec: "1 zone either way"); the card's move ignores Treeline exposure until End hour like a normal move.
    shortcutEitherWay: true
  },

  // ---------- UI action list (data-driven) ----------
  // Which actions the action bar offers, in order ('play' = Play a card; End turn is always shown).
  // rules.cutDrawAndHold removes 'draw' and 'holdDoor' from this list (and from the engine). Remove an id here to hide it.
  // Adding cards to a roll is a step inside the roll dialog, not an action.
  uiActions: ['move', 'investigate', 'steady', 'play', 'holdDoor', 'draw'],

  // ---------- Prototype / tooling ----------
  // RULED (Kostka 2026-10-18): Outcome 3 from DAWN with 0-1 Threads and Escaped together = Y uses the 'stayed together, little learned'
  //   variant 'Outcome 3b · Dawn, Together' (outcome code '3b'; Narrative Writer's text in data/vn-text.js).
  outcome3StayedVariant: true,

  iconStyle: 'colour',       // 'colour' = the artist's coloured icons (default) · 'mono' = one-colour icons. URL ?icons=mono overrides.
  hintsNight2: true,         // Clarity Pass 4.4: one hint line on Night 2 (players can hide it from the Menu)
  defaultSkin: 'neutral',    // name set from data/vn-text.js: 'neutral' (CAPS slots), 'A', 'B', 'C'. URL ?skin=A overrides.
  statsStorageKey: 'cottageProto.runs.v1'
};
if (typeof module !== 'undefined') module.exports = CONFIG;
