/* =====================================================================
 * data/ui-text.js — THE STRING TABLE. Every player-facing UI string lives here;
 * ui.js hard-codes none. Copy: Tomek's "Clarity Pass v0.2" (§5 tooltips, §9.2
 * glossary, §9.3 guided Night 1, §9.4 how to play) and Zosia's tutorial copy.
 * ---------------------------------------------------------------------
 * RENAMING = ONE LINE in `terms` (e.g. TERM_QUESTIONS: 'Secrets'). Names are PENDING
 * Klaudia's pick; defaults follow the Clarity Pass page (Questions / Clues / Dread).
 * Template syntax:
 *   {t.KEY}  term as written      {T.KEY}  term with a capital first letter
 *   {#n:SINGULAR:PLURAL}  picks a term by the number in var n, e.g. "+{n} {#n:TERM_CLUE:TERM_CLUES}"
 *   {name}   a live value filled in by the game (lowercase keys)
 *   {C1} {C2} {POV} {HOST} {OBJECT}  character slots (skin.js; default = CAPS slot names)
 *   [text]   stage direction, rendered in italics
 * ===================================================================== */
var UI_TEXT = {
  // ---------- Terms (rename here; one line each) ----------
  terms: {
    TERM_QUESTION: 'Question', TERM_QUESTIONS: 'Questions',   // were Threads (pending: Questions / Secrets / Mysteries / Threads)
    TERM_CLUE: 'clue', TERM_CLUES: 'clues',                   // were progress
    TERM_DREAD: 'Dread',                                      // was pressure
    TERM_OMEN: 'bad omen',                                    // was STAR
    TERM_BAR: 'Bar', TERM_HELP: 'Help', TERM_NEED: 'need',
    TERM_NIGHT: 'night', TERM_NIGHTS: 'nights', TERM_DAWN: 'dawn',
    TERM_ACTION: 'action', TERM_ACTIONS: 'actions', TERM_ROLL: 'roll',
    TERM_DECK: 'deck', TERM_HAND: 'hand',
    ACT_MOVE: 'Move', ACT_SEARCH: 'Search', ACT_COMFORT: 'Comfort', ACT_PLAY: 'Play a card',
    ACT_END_TURN: 'End turn', ACT_END_ROUND: 'End night',
    ACT_DRAW: 'Draw', ACT_HOLD: 'Hold the door',               // only shown if rules.cutDrawAndHold is switched OFF
    STEP_DAWN: 'Answer the questions: spend clues',
    STEP_ADD_CARDS: 'Add to this roll',
    STAT_I: 'INSIGHT', STAT_N: 'NERVE', STAT_C: 'CARE',
    ZONE_HOUSE: 'House', ZONE_YARD: 'Yard', ZONE_TREELINE: 'Treeline',
    // v0.3 The Approach. TERM_PRESENCE is reskinned per direction (presence.dirs.<A|B>.terms below); this is the slot-generic default.
    TERM_PRESENCE: 'the Presence', TERM_APPROACH: 'Approach',
    TRACK_APPROACH_1: 'Treeline', TRACK_APPROACH_2: 'Yard', TRACK_APPROACH_3: 'Window', TRACK_APPROACH_4: 'Door', // same in A and B (Tomek)
    TERM_NEXT_NIGHT: 'Next night'
  },

  // ---------- Display names ----------
  zones: { house: '{T.ZONE_HOUSE}', yard: '{T.ZONE_YARD}', treeline: '{T.ZONE_TREELINE}' },
  stats: { INSIGHT: '{t.STAT_I}', NERVE: '{t.STAT_N}', CARE: '{t.STAT_C}' },
  // Question sentences (Zosia, slot versions). Costs come from config.js threads[] (3 / 4 / 2).
  questions: { T1: 'What is circling the house?', T2: 'What is {C1} hiding?', T3: 'Why are we here?' },
  cardCategories: { clue: 'Clue', calm: 'Calm', protect: 'Protect', utility: 'Utility' },
  cards: {
    photos:  { cat: 'clue',    name: 'Footprint Photos',      text: 'From the {t.ZONE_HOUSE}: {t.ACT_SEARCH} the {t.ZONE_YARD} without moving.', flavour: "{C2}'s photos, zoomed in until they are all pixels." },
    object:  { cat: 'clue',    name: 'The Object',            text: '+1 {t.TERM_CLUE} (+2 if you shared it).', flavour: 'Family handwriting, naming this exact cottage.' },
    story:   { cat: 'clue',    name: "The Host's Story",      text: '+1 {t.TERM_CLUE}.', flavour: '"Something walks round a house to keep it. Or to be let in."' },
    key:     { cat: 'clue',    name: 'Key on a String',       text: '{T.ACT_SEARCH} any zone without moving.', flavour: "The {HOST}'s key, warm from your pocket." },
    kompot:  { cat: 'calm',    name: 'Kompot',                text: '{T.TERM_DREAD} −1.', flavour: '"For the guests. Don\'t waste it."' },
    stove:   { cat: 'calm',    name: 'Stove Fire',            text: '{T.TERM_DREAD} −2.', flavour: 'Feed it. Keep it ticking. Keep it bright.' },
    blanket: { cat: 'calm',    name: 'Thick Blanket',         text: '{C1} comes back to the {t.ZONE_HOUSE}.', flavour: 'The {HOST} brought the thick one. Wrap her in it.' },
    later:   { cat: 'calm',    name: '"Later, Properly"',     text: 'No {t.TERM_ROLL}: {C1} comes one step closer, {t.TERM_DREAD} −1.', flavour: '"Can I tell you later? Properly. Not here."' },
    rule:    { cat: 'protect', name: "Mother's Rule",         text: 'Bar the door: cancel the next {t.TERM_NIGHT} event. Max 1 {t.TERM_BAR}.', flavour: '"Shut the gate after dark. Because I said so."' },
    chair:   { cat: 'protect', name: 'Chair Under the Handle', text: 'Bar the door: cancel the next {t.TERM_NIGHT} event. Max 1 {t.TERM_BAR}.', flavour: 'Wedge it tight. If it holds till morning, it was a good chair.' },
    torch:   { cat: 'utility', name: 'Torch',                 text: 'Your next {t.ACT_SEARCH} this {t.TERM_NIGHT} needs 1 less.', flavour: 'The beam stops exactly where the trees begin.' },
    phone:   { cat: 'utility', name: 'Phone at 4%',           text: 'Draw 2 cards.', flavour: "One bar of signal. One message you shouldn't read." },
    // v0.3 (presence on): replaces Kompot. Flavour = the direction's offering line (Tomek-approved), via '@dir:'.
    bread:   { cat: 'calm',    name: 'Bread and Salt',        text: '{T.TERM_DREAD} −1 and {t.TERM_PRESENCE} goes back to the {t.TRACK_APPROACH_1}.', flavour: '@dir:offeringAction' }, // v0.3.2 (Tomek): templated like every card; creature name by direction, generic Presence term with the Presence off
    pierogi: { cat: 'utility', name: 'Burnt Pierogi',         text: 'Ready a used {t.TERM_HELP} again.', flavour: 'Slightly burned. Still the best thing tonight.' } // only if rules.chairForPierogi is OFF
  },
  events: {
    footsteps: 'Footsteps', voice: 'The Voice', lights: 'The Lights Fail', gate: 'The Gate Creaks',
    message: 'Message: No Sender', silence: 'Silence', handle: 'The Door Handle', voice2: 'The Voice, Again'
  },
  eventEffects: {
    footsteps: '{T.TERM_DREAD} +1.', voice: '{T.TERM_DREAD} +1. {C1} is pulled one step outside.', lights: '{T.TERM_DREAD} +1. You lose a random card.',
    gate: '{T.TERM_DREAD} +1 if you are outside the {t.ZONE_HOUSE}.', message: '{T.TERM_DREAD} +1. {C1} is pulled one step outside.',
    silence: '{T.TERM_DREAD} +1. No card at the end of this {t.TERM_NIGHT}.', handle: '{T.TERM_DREAD} +2.', voice2: '{T.TERM_DREAD} +1. {C1} is pulled one step outside.'
  },

  // ---------- Persistent HUD (§5) ----------
  hud: {
    goal: 'Make it to {t.TERM_DAWN}. Find {t.TERM_CLUES}. Answer what you can.',
    goalTip: 'Make it to {t.TERM_DAWN}. Find {t.TERM_CLUES}. Answer what you can.',
    night: '{T.TERM_NIGHT} {n} of {total}',
    nightTip: '{T.TERM_NIGHT} {n} of {total}. {T.TERM_DAWN} comes after {t.TERM_NIGHT} {total}.',
    nightStepTip: '{T.TERM_NIGHT} {n}', dawnStepTip: '{T.TERM_DAWN}',
    actionsLeft: '{T.TERM_ACTIONS} left: {n}',
    actionsLeftTip: '{T.TERM_ACTIONS} left this {t.TERM_NIGHT}: {n}. You don\'t have to use them all.',
    dreadTitle: '{T.TERM_DREAD} {n} of {max}',
    dreadLabel: 'At {max}, the {t.TERM_NIGHT} breaks',
    dreadTip: '{T.TERM_DREAD}: {n} of {max}. At {max}, the {t.TERM_NIGHT} breaks. Rises with {t.TERM_NIGHT} events, ending a {t.TERM_NIGHT} in the {t.ZONE_TREELINE}, and {t.TERM_OMEN}s. {T.ACT_COMFORT} and some cards lower it.',
    dreadPipTip: '{T.TERM_DREAD} {n}',
    dreadBreakTip: 'At {max}, the {t.TERM_NIGHT} breaks: {C1} walks out.',
    cluesTitle: '{T.TERM_CLUES}: {n}',
    cluesTip: '{T.TERM_CLUES}: {n}. Spend them at {t.TERM_DAWN} to answer {t.TERM_QUESTIONS}. Unspent {t.TERM_CLUES} are lost.',
    questionsTitle: '{T.TERM_QUESTIONS}',
    questionTip: 'A {t.TERM_QUESTION} you can answer at {t.TERM_DAWN}. Costs {cost} {#cost:TERM_CLUE:TERM_CLUES}. Answered {t.TERM_QUESTIONS} shape what happens next.',
    questionProgress: '{have} of {cost} {#cost:TERM_CLUE:TERM_CLUES}',
    helpsTitle: '{T.TERM_HELP}',
    helpReady: 'ready', helpUsed: 'used', helpClose: 'close (+{bonus})',
    helpTipC1: '{C1} can help once: +{bonus} to a {t.STAT_C} {t.TERM_ROLL}, only while she is in the {t.ZONE_HOUSE}.{close}',
    helpTipC2: '{C2} can help once: +{bonus} to an {t.STAT_I} or {t.STAT_N} {t.TERM_ROLL}.{close}',
    helpCloseNote: ' You grew closer in the story, so her {t.TERM_HELP} is +{bonus}.',
    deck: 'Cards left: {n}', deckTip: 'Cards left: {n}. No reshuffle.',
    discard: 'Used: {n}', discardTip: 'Cards already played or added to a {t.TERM_ROLL}: {n}.',
    handTitle: 'Your {t.TERM_HAND}', handTip: 'Each card: PLAY it for its effect (1 {t.TERM_ACTION}) or add it to a {t.TERM_ROLL} for its icons (free). Not both.',
    eventTip: 'Tonight: {event}. {effect}',
    eventCancelled: 'Barred: cancelled.',
    tonight: 'Tonight',
    logTitle: 'What happened',
    hintsOff: 'Hide hints'
  },

  // ---------- Board (§5) ----------
  board: {
    zoneTip: { house: '{T.ZONE_HOUSE}. {T.ACT_SEARCH}: {t.TERM_NEED} {need}, +{gain} {#gain:TERM_CLUE:TERM_CLUES}. Safe.',
               yard: '{T.ZONE_YARD}. {T.ACT_SEARCH}: {t.TERM_NEED} {need}, +{gain} {#gain:TERM_CLUE:TERM_CLUES}.',
               treeline: '{T.ZONE_TREELINE}. {T.ACT_SEARCH}: {t.TERM_NEED} {need}, +{gain} {#gain:TERM_CLUE:TERM_CLUES}. Ending a {t.TERM_NIGHT} here: {t.TERM_DREAD} +1.' },
    zoneBadge: '{T.TERM_NEED} {need} · +{gain} {#gain:TERM_CLUE:TERM_CLUES}',
    moveHere: '{T.ACT_MOVE} here',
    tokenPOV: '{POV}', tokenC1: '{C1}', tokenC2: '{C2}',
    tokenPOVTip: 'You ({POV}). {T.ACT_MOVE} one step at a time.',
    tokenC1Tip: '{C1}. The voice is pulling her outside. If she ends a {t.TERM_NIGHT} in the {t.ZONE_TREELINE}: {t.TERM_DREAD} +1. Bring her home by {t.TERM_DAWN} to stay together.',
    tokenC2Tip: '{C2}. Stays in the {t.ZONE_HOUSE}. Can help with {t.STAT_I} and {t.STAT_N} {t.TERM_ROLL}s.',
    bar: 'Barred', barTip: 'Barred. The next {t.TERM_NIGHT} event is cancelled. Only one {t.TERM_BAR} at a time.',
    noBarTip: 'No {t.TERM_BAR} on the door.',
    playZone: 'Drop a card here to PLAY it', playZoneTip: 'Use a card\'s effect. Costs 1 {t.TERM_ACTION}. The card is discarded.'
  },

  // ---------- Actions (§5; the list itself is data-driven from CONFIG.uiActions) ----------
  actions: {
    move:        { label: '{T.ACT_MOVE}',     tip: '{T.ACT_MOVE} one step: {T.ZONE_HOUSE}, {T.ZONE_YARD}, {T.ZONE_TREELINE}. Further out = more {t.TERM_CLUES}, more danger.' },
    investigate: { label: '{T.ACT_SEARCH}',   tip: '{T.ACT_SEARCH} the {zone}: {t.TERM_NEED} {need}, about {pct}%, +{gain} {#gain:TERM_CLUE:TERM_CLUES}. Uses {t.STAT_I}.' },
    steady:      { label: '{T.ACT_COMFORT}',  tip: '{T.ACT_COMFORT}: {t.TERM_NEED} {need}, about {pct}%. Success: {t.TERM_DREAD} −1 and {C1} comes one step closer. Uses {t.STAT_C}.' },
    play:        { label: '{T.ACT_PLAY}',     tip: 'Use a card\'s effect. Costs 1 {t.TERM_ACTION}. The card is discarded.' },
    endTurn:     { label: '{T.ACT_END_TURN}', tip: 'End this {t.TERM_NIGHT}. Unused {t.TERM_ACTIONS} are lost.' },
    endRound:    { label: '{T.ACT_END_ROUND}', tip: 'End this {t.TERM_NIGHT}. Unused {t.TERM_ACTIONS} are lost.' },
    draw:        { label: '{T.ACT_DRAW}',     tip: 'Draw 1 card (1 {t.TERM_ACTION}). Cards left: {left}.' },
    holdDoor:    { label: '{T.ACT_HOLD}',     tip: '{T.ACT_HOLD}: {t.TERM_NEED} {need}, about {pct}%. Success: {t.TERM_BAR} on the door. Uses {t.STAT_N}. {T.ZONE_HOUSE} only.' },
    // extra preview details appended to the tips above
    moveExposure: ' Ending a {t.TERM_NIGHT} in the {t.ZONE_TREELINE}: {t.TERM_DREAD} +1.',
    withBest: ' With all matching cards added: about {pct}%.',
    omenNote: ' 1 in 6 is a {t.TERM_OMEN}: fail and {t.TERM_DREAD} +1.',
    endExposure: ' Ending here: {t.TERM_DREAD} +{n}.',
    endDraw: ' Then you draw a card.', endNoDraw: ' Silence: no card this {t.TERM_NIGHT}.',
    endDawn: ' After this, {t.TERM_DAWN}.'
  },

  // ---------- Why something is unavailable ----------
  reasons: {
    noActions: 'No {t.TERM_ACTIONS} left. {T.ACT_END_TURN} when ready.',
    notNow: 'Not now.',
    houseOnly: 'Only from the {t.ZONE_HOUSE}.',
    barDown: 'The door is already barred (only one {t.TERM_BAR} at a time).',
    deckEmpty: 'No cards left.',
    noUsedHelp: 'No {t.TERM_HELP} has been used yet.',
    povNotInHouse: 'Only from the {t.ZONE_HOUSE}.',
    notAdjacent: 'Only one step at a time.',
    discardFirst: 'Too many cards: discard down to {limit} first.',
    helpUsed: 'Already used.', helpWrongStat: 'Can\'t help with this {t.TERM_ROLL}.', helpNotHome: '{C1} must be in the {t.ZONE_HOUSE}.',
    tooExpensive: 'Not enough {t.TERM_CLUES}.',
    capBroken: 'The {t.TERM_NIGHT} broke: you can answer only {cap} {#cap:TERM_QUESTION:TERM_QUESTIONS}.',
    needTogether: 'Answering all three needs everyone together at {t.TERM_DAWN}.',
    tutorialLocked: 'Follow the highlighted step (or skip the tutorial).'
  },

  // ---------- Cards in hand (§5) ----------
  cardUi: {
    tip: 'PLAY: {effect} (1 {t.TERM_ACTION}). OR {t.STEP_ADD_CARDS}: +1 per matching icon (free). Not both.',
    playLabel: 'PLAY (1 {t.TERM_ACTION}):',
    addLabel: 'ADD TO ROLL',
    play: 'Play', playTip: 'PLAY: {effect} (1 {t.TERM_ACTION}). The card is discarded.',
    addHint: 'Add it inside a {t.TERM_ROLL}: open {T.ACT_SEARCH} or {T.ACT_COMFORT}.',
    iconTip: { I: '{T.STAT_I}: searching.', N: '{T.STAT_N}: holding your ground.', C: '{T.STAT_C}: comforting.' },
    categoryTip: '{cat} card',
    discard: 'Discard', discardTip: 'Too many cards (limit {limit}): discard this one.',
    discardPrompt: 'Too many cards: discard down to {limit}.',
    pierogiWhich: 'Ready whose {t.TERM_HELP}?'
  },

  // ---------- Roll dialog (§5, §9.1.3) ----------
  roll: {
    title: '{action}',
    titleSearch: '{T.ACT_SEARCH} the {zone}', titleComfort: '{T.ACT_COMFORT}', titleHold: '{T.ACT_HOLD}', titleCard: '{card}: {T.ACT_SEARCH} the {zone}',
    uses: 'Uses {stat}',
    need: '{T.TERM_NEED} {need}', needTip: 'Your total must reach {need}. Ties succeed.',
    total: 'Your total: {total}. {T.TERM_NEED}: {need}. Chance: about {pct}%.',
    parts: 'Base {base} + cards {icons} + {t.TERM_HELP} {help}',
    addTitle: '{T.STEP_ADD_CARDS}?', addTip: 'Add cards to this {t.TERM_ROLL}? Each matching icon gives +1. Added cards are discarded.',
    addNone: 'No cards with a matching icon.',
    addRow: '+{n}', addPlayInstead: 'or PLAY: {effect}',
    helpTitle: 'Ask for {t.TERM_HELP}',
    helpOffer: 'Ask {who} for help: +{bonus}{close}. Once per encounter.', helpCloseTag: ' (you\'re close)',
    zonePick: 'Which zone?',
    dice: 'The die', diceTip: 'One die: 1–3 adds 0, 4 is −1, 5 is +1, 6 is a {t.TERM_OMEN}.',
    faceTip: '{face}: {result}',
    faceZero: '+0', faceMinus: '−1', facePlus: '+1', faceOmen: '{T.TERM_OMEN}',
    resWin: 'success', resStrong: 'strong success', resFail: 'fail', resOmen: 'fail, {t.TERM_DREAD} +1',
    confirm: 'Roll', confirmTip: 'Roll the die. This uses 1 {t.TERM_ACTION}.',
    cancel: 'Cancel', cancelTip: 'Close without rolling. No {t.TERM_ACTION} is used.',
    success: 'Success!', strong: 'Strong success! +1 extra {t.TERM_CLUE}.', strongComfort: 'Strong success! {T.TERM_DREAD} −1 more.',
    fail: 'Not enough.', omen: '{T.TERM_OMEN}. The {t.TERM_ROLL} fails and {t.TERM_DREAD} rises by 1.',
    resultLine: 'Rolled {face}: total {total} vs {t.TERM_NEED} {need}.',
    continue: 'Continue'
  },

  // ---------- Animated changes & event log (§9.1.10-11) ----------
  feed: {
    dread: '{sign}{n} {t.TERM_DREAD}: {cause}',
    clues: '+{n} {#n:TERM_CLUE:TERM_CLUES}: {cause}',
    c1Out: '{C1} → {zone}: {cause}',
    c1In: '{C1} → {zone}: {cause}',
    bar: '{T.TERM_BAR} on the door: {cause}',
    barUsed: '{T.TERM_BAR} held: {cause} was cancelled',
    cause: { event: '{event}', card: '{card}', omen: '{T.TERM_OMEN}', comfort: '{T.ACT_COMFORT}', search: '{T.ACT_SEARCH} the {zone}',
             exposurePOV: 'you ended the {t.TERM_NIGHT} in the {t.ZONE_TREELINE}', exposureC1: '{C1} ended the {t.TERM_NIGHT} in the {t.ZONE_TREELINE}' }
  },

  // ---------- Night 2 hint line (§4.4); can be hidden ----------
  hints: {
    c1Out: '{C1} is in the {zone}. {T.ACT_COMFORT} can call her back.',
    highDread: '{T.TERM_DREAD} is {n}. {T.ACT_COMFORT} or a calming card lowers it.',
    searchOut: 'The {t.ZONE_YARD} gives more {t.TERM_CLUES} than the {t.ZONE_HOUSE}, for a little more risk.'
  },

  // ---------- Dawn screen (§4.6, §9.1.13) ----------
  dawn: {
    title: '{T.STEP_DAWN}',
    tip: '{T.STEP_DAWN}. Tap a {t.TERM_QUESTION} to answer it.',
    blurb: 'Tap a {t.TERM_QUESTION} to answer it.',
    clues: '{T.TERM_CLUES} left: {n}',
    warn: 'Unspent {t.TERM_CLUES} are lost.',
    broke: 'The {t.TERM_NIGHT} broke: you can answer only {cap} {#cap:TERM_QUESTION:TERM_QUESTIONS}.',
    together: 'Everyone together at {t.TERM_DAWN}: {yn}',
    togetherTip: 'Answering all three {t.TERM_QUESTIONS} needs everyone together.',
    answered: 'Answered', cost: '{cost} {#cost:TERM_CLUE:TERM_CLUES}',
    confirm: 'Done', confirmTip: 'Lock in your answers and see how the {t.TERM_NIGHT} ends.',
    yes: 'yes', no: 'no',
    earlyBanner: '{C1} walks out into the dark.', dawnBanner: 'Grey light. {T.TERM_DAWN}.'
  },

  // ---------- Recap after the outcome scene (Zosia) ----------
  recap: {
    some: '{C2}: So. We know {answered}. We still don\'t know {unanswered}.',
    all:  '{C2}: So. We know {answered}. Honestly? That\'s everything.',
    none: '{C2}: So. We still don\'t know {unanswered}. Not one thing.',
    join: ' and ',
    phrases: { T1: 'what was circling the house', T2: 'what {C1} was hiding', T3: 'why we came here' },
    tags: { // shown only if CONFIG.recapTagLines is ON
      togetherY: '{C1}: And we\'re all still here.',
      togetherN: '{C1}: And I\'m sorry I went out there.',
      shared: '{POV}: And now you\'ve all seen the {OBJECT}.',
      kept: '[The {OBJECT} stays in the {POV}\'s bag.]'
    }
  },

  // ---------- Screens, menu, buttons ----------
  ui: {
    brand: 'The Cottage', buildTag: 'greybox playtest · placeholder art & text',
    menu: 'Menu', menuTip: 'Tools: tutorial, stats, seed, debug, restart.',
    howToPlay: 'How to play', howToPlayTip: 'A short summary of the rules. Open it any time.',
    tutorial: 'Replay tutorial', tutorialTip: 'Restart the night with the guided first turn.',
    hints: 'Night 2 hint', hintsTip: 'Show or hide the hint line on {t.TERM_NIGHT} 2.',
    stats: 'Run stats', statsTip: 'See and download your saved runs (JSON/CSV) to send to the studio.',
    seed: 'Seed: {seed}', seedTip: 'The shuffle of this run. Same seed = same shuffle.',
    replaySeed: 'Replay this seed', replaySeedTip: 'Restart with the same shuffle.',
    debug: 'Debug panel', debugTip: 'Developer view of the game state and log (key: D).',
    restart: 'Restart', restartTip: 'Back to the title screen. The current run is not saved.',
    restartConfirm: 'Restart? The current run will not be saved.',
    close: 'Close', closeTip: 'Close this panel.',
    title: 'The Cottage', subtitle: 'Encounter prototype · greybox',
    titleBlurb: 'Something is circling the cottage. Make it to {t.TERM_DAWN}, find {t.TERM_CLUES}, and answer what you can. About 20–30 minutes. Your results are saved in this browser; please send them from Menu → Run stats at the end.',
    seedLabel: 'Seed (blank = random)', seedFieldTip: 'Leave blank for a random shuffle, or type a number to replay one.',
    namesLabel: 'Names', namesTip: 'Character names: slots (default) or a narrative direction.',
    namesSlots: 'Slots (COMPANION 1…)',
    testerLabel: 'Your name (optional)', testerTip: 'Saved with your results so the studio knows who played.',
    tutorialLabel: 'Guided first {t.TERM_NIGHT}', tutorialFieldTip: 'Walk through {t.TERM_NIGHT} 1 one step at a time. Recommended the first time.',
    start: 'Start', startTip: 'Play the short story intro, then the {t.TERM_NIGHT}.',
    skipIntro: 'Skip the story', skipIntroTip: 'Make the two story choices and go straight to the {t.TERM_NIGHT}.',
    quickSetup: 'Quick setup', beginNight: 'Begin the {t.TERM_NIGHT}', beginNightTip: 'Start {t.TERM_NIGHT} 1.',
    vnNext: 'Next', vnNextTip: 'Continue (Space or Enter).',
    vnSkip: 'Skip ahead', vnSkipTip: 'Jump to the next choice.',
    choice: 'Choice',
    placeholderScene: 'Placeholder scene: final text to come from the Narrative Writer.',
    resultsTitle: 'How the {t.TERM_NIGHT} went', flagsTitle: 'Story flags',
    flagQuestions: '{T.TERM_QUESTIONS} answered', flagTogether: 'Stayed together', flagDread: 'Final {t.TERM_DREAD}', flagHelp: '{T.TERM_HELP} used',
    flagBond: '{C1} bond (tonight)', flagFinalBond: 'Final bond {C1} / {C2}', flagKey: 'The {OBJECT}', flagClues: '{T.TERM_CLUES} found / spent / lost',
    flagNights: '{T.TERM_NIGHTS} played', flagPlays: 'Played vs added to rolls', none: 'none',
    savedNote: 'This run was saved ({n} in this browser).',
    playAgain: 'Play again', playAgainTip: 'A new run with a new shuffle.',
    replaySame: 'Same seed again', replaySameTip: 'Replay with the same shuffle.',
    sendStats: 'Send results', sendStatsTip: 'Open your saved runs to download them.',
    statsTitle: 'Run stats (this browser)',
    statsSummary: 'Runs: {runs} · outcomes {outcomes} · avg {t.TERM_CLUES} found {avg} · avg final {t.TERM_DREAD} {dread} · together {safe}/{runs}',
    copyJSON: 'Copy JSON', copyCSV: 'Copy CSV', dlJSON: 'Download JSON', dlCSV: 'Download CSV', clearStats: 'Clear all',
    copyTip: 'Copy to the clipboard.', dlTip: 'Save a file you can send to the studio.', clearTip: 'Delete all saved runs in this browser.',
    clearConfirm: 'Delete all saved runs in this browser?', copied: 'Copied.', clipBlocked: 'Clipboard blocked: select the text below.',
    statsNote: 'Results stay in this browser until you send them.',
    coachNext: 'Next', coachBack: 'Back', coachSkip: 'Skip tutorial', coachDone: 'Start playing',
    coachStep: 'Step {n} of {total}', coachTryIt: 'Try it: use the highlighted control.',
    coachNextTip: 'Next tip.', coachBackTip: 'Previous tip.', coachSkipTip: 'Close the tutorial; everything is unlocked.'
  },

  // ---------- Guided Night 1 (Clarity Pass §9.3; voice lines: Zosia) ----------
  // target: on-screen element id(s). allow: which controls are live (everything else dimmed/disabled).
  // await: what the player must do to advance ('trayOpen' | 'roll' | 'play:<cardId>' | 'endTurn'); no await = Next button.
  // Zosia, v0.3.1. Used as the voice of the 'presence' tour step (step 4; added at Tomek's request).
  tour: {
    presence: '{C2}: It\'s at the trees now. Every hour it comes a little closer. We don\'t fight it. We turn it away.'
  },
  onboarding: {
    steps: [
      { id: 'goal',      target: ['goalBanner', 'nightCounter'], text: 'Make it to {t.TERM_DAWN}. Find {t.TERM_CLUES}. Answer what you can.', voice: '{C2}: Six hours till light. We can do six hours.' },
      { id: 'questions', target: ['questions'], text: 'These are tonight\'s {t.TERM_QUESTIONS}. At {t.TERM_DAWN}, you spend {t.TERM_CLUES} to answer them.', voice: '{POV}: Something keeps circling this house. I want to know what.' },
      { id: 'event',     target: ['nightEvent', 'dread'], text: 'Each {t.TERM_NIGHT} starts with something outside. This raised {t.TERM_DREAD} to 1. At {max}, the {t.TERM_NIGHT} breaks.', voice: '{C1}: It\'s back. Under the window.' },
      // v0.3.1 (Tomek): shown only when the Presence is on (needsPresence); the tour renumbers itself
      { id: 'presence',  needsPresence: true, target: ['approach', 'nextEvent'], text: '{T.TERM_PRESENCE} moves along this track. Footprints on the next event bring it closer. {T.ACT_COMFORT} pushes it back, and Bread and Salt sends it back to the trees. If it reaches the {t.TRACK_APPROACH_4}, a {t.TERM_BAR} keeps it out.', voice: '@tour.presence' },
      { id: 'zones',     target: ['board'], text: 'Searching further out finds more {t.TERM_CLUES}, but it\'s more dangerous.', voice: '{C2}: The answers are out by the trees. So is whatever\'s walking.' },
      { id: 'search',    target: ['act-investigate'], allow: ['act-investigate'], await: 'trayOpen', text: '{T.ACT_SEARCH} for {t.TERM_CLUES} here. You have 2 {t.TERM_ACTIONS} each {t.TERM_NIGHT}.', voice: '{POV}: Start here, where it\'s warm. Kitchen first.' },
      { id: 'add',       target: ['rollAdd'], allow: ['tray'], await: 'roll', text: 'You can add matching cards to this {t.TERM_ROLL}: +1 each. Added cards are discarded.', voice: '{C2}: Use what we found today. That\'s what it\'s for.' },
      { id: 'clue',      target: ['rollResult', 'clues'], allow: ['tray'], text: 'You found a {t.TERM_CLUE}.', voice: '{POV}: The footprints stop at the door. Right at the door.' },
      { id: 'play',      target: ['card-@tutorialCard'], allow: ['card-@tutorialCard'], await: 'play:@tutorialCard', // @tutorialCard = CONFIG.tutorialHand[1] (Kompot, or Bread and Salt with the Presence on)
                    text: 'Or play a card for its effect. This costs an {t.TERM_ACTION}.', voice: '{C2}: Drink. The {HOST} said don\'t waste it, and I\'m scared of her.', // when the tour deals Kompot (Presence off)
                    // when the tour deals Bread and Salt (v0.3.1, Zosia): by Presence direction; 'neutral' = no direction (Presence off)
                    voiceBread: { A: '{C2}: Bread and salt, by the stove. The {HOST} says that\'s how you say please here.',
                                  B: '{POV}: [whispering] Bread and salt in the morning. I promise. [beat] I mean it.',
                                  neutral: '{C2}: Bread and salt. Old manners, but they still work.' } },
      { id: 'comfort',   target: ['tok-C1', 'act-steady'], text: 'If the voice pulls {C1} outside, {t.ACT_COMFORT} brings her back. Bring her home by {t.TERM_DAWN}.', voice: '{POV}: If she goes outside, I talk her home. Gently.' },
      { id: 'end',       target: ['act-end', 'deckPile'], allow: ['act-end'], await: 'endTurn', text: 'Out of {t.TERM_ACTIONS}. End the {t.TERM_NIGHT}: you draw a card. Five more {t.TERM_NIGHTS} till {t.TERM_DAWN}.', voice: '{C2}: One hour down. Five to go.' }
    ]
  },

  // ---------- v0.3 "The Approach" (Tension Pass v0.3 §8 tooltips; Zosia's A/B copy, Tomek-approved) ----------
  // Used only when CONFIG.presence.mode is not 'off'. Direction: CONFIG.presence.direction or ?presence=A|B.
  // `overrides` replace the normal string at the same path while the Presence is on (e.g. Door Handle is Dread +1 now).
  presence: {
    overrides: {
      eventEffects: { handle: '{T.TERM_DREAD} +1.' },
      cards: {
        rule:  { text: 'Bar the door: stops the next {t.TERM_NIGHT} event or one visit, whichever comes first. Max 1 {t.TERM_BAR}.' },
        chair: { text: 'Bar the door: stops the next {t.TERM_NIGHT} event or one visit, whichever comes first. Max 1 {t.TERM_BAR}.' }
      },
      board: { barTip: 'Barred. Stops the next {t.TERM_NIGHT} event or one visit from {t.TERM_PRESENCE}, whichever comes first. If {t.TERM_PRESENCE} will reach the {t.TRACK_APPROACH_4} that {t.TERM_NIGHT}, it is saved for the visit.' }
    },
    ui: {
      trackTitle: '{T.TERM_APPROACH}',
      trackTip: '{T.TERM_PRESENCE} is coming: {t.TRACK_APPROACH_1}, {t.TRACK_APPROACH_2}, {t.TRACK_APPROACH_3}, {t.TRACK_APPROACH_4}. If it reaches the {t.TRACK_APPROACH_4}: {t.TERM_DREAD} +1 and {C1} is pulled outside. A {t.TERM_BAR} stops it.',
      markerTip: '{T.TERM_PRESENCE}. You can\'t fight it. {T.ACT_COMFORT}, an offering or a {t.TERM_BAR} can turn it away.',
      spaceTip: '{space}',
      nextTitle: '{T.TERM_NEXT_NIGHT}',
      nextTip: 'Coming next {t.TERM_NIGHT}: {event}. Plan for it.',
      nextNone: '{T.TERM_DAWN} comes next.',
      footprintTip: 'Footprints: when this happens, {t.TERM_PRESENCE} comes 1 step closer.',
      lateBanner: 'The {t.TERM_NIGHT} is ending. {T.TERM_PRESENCE} moves faster.',
      searchPreview: ' Success draws {t.TERM_PRESENCE} 1 step closer.',
      comfortPreview: ' Success also turns {t.TERM_PRESENCE} back 1 step.',
      offeringTip: 'PLAY: {T.TERM_DREAD} −1 and {t.TERM_PRESENCE} goes back to the {t.TRACK_APPROACH_1}.',
      visitWarning: '{T.TERM_PRESENCE} will reach the {t.TRACK_APPROACH_4} next {t.TERM_NIGHT}. Turn it away or bar the door.',
      // v0.3.1 barSavesForVisit: shown instead when a Bar is up and the visit is coming
      visitWarningBarSaved: '{T.TERM_PRESENCE} will reach the {t.TRACK_APPROACH_4} next {t.TERM_NIGHT}. The {t.TERM_BAR} is saved for the visit, so the {t.TERM_NIGHT} event won\'t be stopped.',
      barTipSaved: 'Barred, and saved for the visit. {T.TERM_PRESENCE} reaches the {t.TRACK_APPROACH_4} next {t.TERM_NIGHT}, so the {t.TERM_BAR} stops the visit, not the {t.TERM_NIGHT} event.',
      nextBarSaved: 'The {t.TERM_BAR} is saved for the visit, so this event won\'t be stopped.',
      feedBarSaved: 'The {t.TERM_BAR} is saved for the visit',
      visitTitle: '{T.TERM_PRESENCE} is at the {t.TRACK_APPROACH_4}',
      visitEffect: '{T.TERM_DREAD} +1. {C1} is pulled outside.',
      blockedTitle: 'The {t.TERM_BAR} held',
      feedCloser: '{T.TERM_PRESENCE} → {space}: {cause}',
      feedBack: '{T.TERM_PRESENCE} ← {space}: {cause}',
      feedOffering: '{T.TERM_PRESENCE} goes back to the {t.TRACK_APPROACH_1}: {cause}',
      feedVisit: '{T.TERM_PRESENCE} visits: {t.TERM_DREAD} +1, {C1} pulled outside',
      feedBlocked: 'The {t.TERM_BAR} stopped the visit',
      cause: { footprint: 'footprints ({event})', late: 'the {t.TERM_NIGHT} is ending', searchPull: 'you searched the {t.ZONE_TREELINE}', comfortPush: '{T.ACT_COMFORT}',
               offering: '{card}', barHeld: 'the {t.TERM_BAR} held', visitDone: 'it leaves the door' },
      howTitle: '{T.TERM_PRESENCE}',
      howRules: [
        '{T.TERM_PRESENCE} walks the {t.TERM_APPROACH} track: {t.TRACK_APPROACH_1}, {t.TRACK_APPROACH_2}, {t.TRACK_APPROACH_3}, {t.TRACK_APPROACH_4}. You never fight it. You turn it away.',
        'Night events with footprints bring it 1 step closer; on {t.TERM_NIGHTS} 5 and 6 it takes 1 more step. Searching the {t.ZONE_TREELINE} draws it closer too. The next {t.TERM_NIGHT} event is always shown face up, so you can see it coming.',
        'At the {t.TRACK_APPROACH_4}: {t.TERM_DREAD} +1 and {C1} is pulled outside, unless a {t.TERM_BAR} is up. {T.ACT_COMFORT} turns it back 1 step; Bread and Salt sends it back to the {t.TRACK_APPROACH_1}.'
      ]
    },
    // Zosia's copy, verbatim (slot names written as {C1}/{C2}/{POV}/{HOST} so they follow the names setting). [brackets] = stage directions.
    // (Zosia's 'WHAT IT IS' lines are writer notes with a Questions spoiler: they stay in docs/copy only and are never rendered.)
    dirs: {
      A: {
        label: 'A · the domowik',
        terms: { TERM_PRESENCE: 'the domowik' },
        howTease: 'Something small walks the edge of the house in the dark.', // How to play, one line (v0.3.1)
        door: ['Three knocks, low on the door, like someone very short. Then the stove goes out.',
               'Something small rattles the handle, impatient, and every pan in the kitchen rings at once.',
               'A sigh at the keyhole, old and tired. The kitchen goes cold.'],
        c1: '{C1}: It sounds lonely. Someone should go out to it.',
        turnAway: {
          comfort: '{POV}: [the way the {HOST} talks to the stove] Dziadku, we\'re good guests. Go back to your warm corner.',
          offering: 'The heel of the bread, salted, and the last of supper, left by the stove. The pacing stops.',
          bar: 'The chair holds. On the other side, something small checks the door twice, and seems satisfied.'
        },
        tease: { footsteps: 'Small steps, circling. Counting the windows.', gate: 'Someone left the gate open. Someone minds.',
                 silence: 'The stove stops ticking. The house is listening.', handle: 'Something short is reaching for the handle.' },
        late: 'The sky over the trees goes grey, and the pacing gets faster, as if it knows.',
        search: '{POV}: Every step I take into the trees, I hear it hurry back toward the house, like I\'ve left a door open.',
        offeringAction: 'Leave bread and salt by the stove'
      },
      B: {
        label: 'B · the zmora',
        terms: { TERM_PRESENCE: 'the zmora' },
        howTease: 'Something walks barefoot around the cottage in the dark, looking for a way in.',
        door: ['The handle doesn\'t turn. Something comes through the keyhole anyway, thin as a straw.',
               'A weight settles on the end of the bed. Nobody is sitting there.',
               'Everyone\'s breath goes short at once, as if the air got heavy.'],
        c1: '{C1}: [sitting up, eyes open, not awake] I can\'t breathe in here. I need air.',
        turnAway: {
          comfort: '{C2}: [softly, by her ear] {C1}. {C1}, wake up. It\'s us.',
          offering: '{POV}: [whispering into the dark] Come in the morning. I\'ll give you bread and salt. [The weight lifts.]',
          bar: 'The chair holds, and the key stays half-turned in the lock. Nothing comes through the keyhole.'
        },
        tease: { footsteps: 'Bare feet in the wet grass. Nobody\'s shoes are missing.', gate: 'The gate swings. Whoever it is doesn\'t need it.',
                 silence: 'Even the breathing in the next room stops.', handle: 'The handle won\'t turn. It doesn\'t have to.' },
        late: 'The sky thins. Whatever is out there is in a hurry now: it has to be back in its own body before light.',
        search: '{POV}: Out here I can breathe. Back there someone can\'t, and it knows I\'m not watching.',
        offeringAction: 'Promise it bread in the morning'
      }
    }
  },

  // ---------- v0.4 "Stripped Core" (spec: gdd/v04/encounter-v0.4.md; used only while CONFIG.v04.enabled) ----------
  // terms: merged over `terms` above (Night -> Hour everywhere; the neutral creature name; the two boost icons).
  // overrides: replace the string at the same path. Everything else in this file stays as v0.3.2 and is used when v0.4 is off.
  // [COPY GAP] marks text we wrote (minimal, neutral) where the spec has none: listed for Zosia/Tomek in the README.
  v04: {
    terms: {
      TERM_NIGHT: 'hour', TERM_NIGHTS: 'hours', TERM_NEXT_NIGHT: 'Next hour',
      ACT_END_TURN: 'End hour', ACT_END_ROUND: 'End hour',
      TERM_PRESENCE: 'the creature',               // ?presence=A|B swaps in 'the domowik' / 'the zmora' (presence.dirs.*.terms)
      STAT_I: 'magnifier', STAT_C: 'heart'          // boost icons: magnifier = +1 to Search, heart = +1 to Comfort (no NERVE in v0.4)
    },
    // Title / one-screen intro (Zosia, FINAL, verbatim; one paragraph per line). Line 3 swaps by direction only when ?presence=A|B is set.
    intro: {
      title: 'The Cottage',
      lines: ['Your car died at the edge of the forest, and the only shelter is an empty cottage.',
              'Your friends have gone for help. They won\'t be back until morning.',
              '@creatureLine'],
      creatureLine: {
        neutral: 'Something is walking out by the trees. You can\'t fight it, but you can learn what it wants and keep it from the door.',
        A: 'Something small is walking the edge of the house. You can\'t fight it, but you can learn what it wants and keep it from the door.',
        B: 'Something is walking barefoot around the cottage. You can\'t fight it, but you can learn what it wants and keep it from the door.'
      },
      goal: 'Goal: Find {goal} {T.TERM_CLUES} before {t.TERM_DAWN} ({total} {t.TERM_NIGHTS}). Don\'t let {T.TERM_DREAD} reach {max}.' // numbers + terms from config / terms
    },
    // End screens (spec section 2, verbatim at the defaults; numbers from config)
    end: {
      // title + result_line (Ola's two end-screen boxes): read together they are the spec line verbatim
      win:        { title: 'Dawn.', result: 'You made it to morning, with {n} {t.TERM_CLUES}.' },
      lose_dread: { title: 'The dark got in.', result: 'You couldn\'t hold on until dawn.' }, // title: Tomek (overrides Zosia's keep of Dread hit max)
      lose_short: { title: 'Dawn came,', result: 'but you only found {n} of {goal} {t.TERM_CLUES}.' },
      rowClues: '{T.TERM_CLUES} found', rowDread: 'Final {t.TERM_DREAD}', rowHours: '{T.TERM_NIGHTS} played', rowVisits: 'Visits at the {t.TRACK_APPROACH_4}',
      playAgain: 'Play again', playAgainTip: 'Start a new game with a fresh shuffle.',
      playTutorial: 'Play with tutorial', playTutorialTip: 'Start a new game with the first two {t.TERM_NIGHTS} guided.'
    },
    cards: { // Zosia FINAL flavours for the 7 new cards; Warm Stove / Bar the Door reuse Chair / Stove Fire lines
      lookCloser: { cat: 'clue',    name: 'Look Closer',    text: '{T.ACT_SEARCH} an adjacent area without moving.', flavour: 'You don\'t have to go out there. Just look properly.' },
      luckyFind:  { cat: 'clue',    name: 'Lucky Find',     text: '+1 {t.TERM_CLUE}.', flavour: 'Under a loose board, wrapped and dry. Someone wanted it kept.' },
      sharpEyes:  { cat: 'clue',    name: 'Sharp Eyes',     text: 'Your next {t.ACT_SEARCH} this {t.TERM_NIGHT} is 1 easier.', flavour: 'Let your eyes adjust. The dark has edges.' },
      deepBreath: { cat: 'calm',    name: 'Deep Breath',    text: '{T.TERM_DREAD} −1.', flavour: 'In for four, out for four. The house is still here. So are you.' },
      warmStove:  { cat: 'calm',    name: 'Warm Stove',     text: '{T.TERM_DREAD} −2.', flavour: 'Feed it. Keep it ticking. Keep it bright.' },
      bread:      { cat: 'calm',    name: 'Bread and Salt', text: '{T.TERM_DREAD} −1 and {t.TERM_PRESENCE} goes back to the trees.', flavour: '@dir:offeringAction' },
      bar:        { cat: 'protect', name: 'Bar the Door',   text: 'Bar the door: stops the next event or one visit. Max 1 {t.TERM_BAR}.', flavour: 'Wedge it tight. If it holds till morning, it was a good chair.' },
      ward:       { cat: 'protect', name: 'Ward',           text: 'Push {t.TERM_PRESENCE} back 2 steps.', flavour: 'Scratched over the door frame, older than the paint. It still means "not here".' },
      shortcut:   { cat: 'utility', name: 'Shortcut',       text: '+1 move: move 1 area and {t.ACT_SEARCH} there, as one {t.TERM_ACTION}.', flavour: 'Through the gap in the fence. Quicker. Quieter.' },
      rummage:    { cat: 'utility', name: 'Rummage',        text: 'Draw 2 cards.', flavour: 'Every drawer in this kitchen is full of somebody else\'s useful things.' }
    },
    // the neutral creature (no direction set): Zosia FINAL door + Bread and Salt flavour; no voice lines
    neutralDir: {
      label: 'neutral · the creature', terms: {},
      howTease: '',
      door: ['The handle turns, slowly, as far as it will go. Then it lets go.'],
      turnAway: { comfort: '', offering: '', bar: '' }, tease: {}, late: '', search: '',
      offeringAction: 'Leave bread and salt on the step. Old manners still work.'
    },
    overrides: {
      events: { knocking: 'Knocking', whispers: 'Whispers', draught: 'Cold Draught', lights: 'Lights Fail' },
      eventEffects: {
        footsteps: '{T.TERM_DREAD} +1.', knocking: '{T.TERM_DREAD} +1.', whispers: '{T.TERM_DREAD} +1.', draught: '{T.TERM_DREAD} +1.', handle: '{T.TERM_DREAD} +1.',
        lights: '{T.TERM_DREAD} +1, and you lose a random card.',
        gate: '{T.TERM_DREAD} +1, and +1 more if you\'re outside the {t.ZONE_HOUSE}.',
        silence: '{T.TERM_DREAD} +1, and no card draw this {t.TERM_NIGHT}.'
      },
      hud: {
        goal: 'Find {goal} {t.TERM_CLUES} before {t.TERM_DAWN}. Don\'t let {T.TERM_DREAD} reach {max}.',
        goalTip: 'Find {goal} {t.TERM_CLUES} before {t.TERM_DAWN}. Don\'t let {T.TERM_DREAD} reach {max}. {T.TERM_DAWN} comes after {T.TERM_NIGHT} {total}.',
        nightTip: '{T.TERM_NIGHT} {n} of {total}. {T.TERM_DAWN} after {T.TERM_NIGHT} {total}.',
        dreadLabel: 'At {max}, you lose',
        dreadTip: '{T.TERM_DREAD}: {n} of {max}. At {max}, you lose. It rises with every event, a visit at the {t.TRACK_APPROACH_4}, ending an {t.TERM_NIGHT} in the {t.ZONE_TREELINE}, and {t.TERM_OMEN}s. {T.ACT_COMFORT} and calm cards lower it.',
        dreadBreakTip: 'At {max}, you lose.',
        cluesTip: '{T.TERM_CLUES}: {n} of {goal}. Find {goal} before {t.TERM_DAWN} to win.',
        clueGoal: '{T.TERM_CLUES}: {n} of {goal}',
        eventTip: 'This {t.TERM_NIGHT}: {event}. {effect}',
        tonight: 'This {t.TERM_NIGHT}'
      },
      board: {
        tokenPOVTip: 'You. {T.ACT_MOVE} one area at a time.',
        barTip: 'Barred. Stops the next event or one visit. If {t.TERM_PRESENCE} will reach the {t.TRACK_APPROACH_4} this {t.TERM_NIGHT}, the {t.TERM_BAR} is kept for the visit.'
      },
      actions: {
        investigate: { label: '{T.ACT_SEARCH}', tip: '{T.ACT_SEARCH} the {zone}: {t.TERM_NEED} {need}, about {pct}%, +{gain} {#gain:TERM_CLUE:TERM_CLUES}. Add {t.STAT_I} cards for +1 each.' },
        steady: { label: '{T.ACT_COMFORT}', tip: '{T.ACT_COMFORT}: {t.TERM_NEED} {need}, about {pct}%. Success: {t.TERM_DREAD} −1 (−2 on a strong success). Add {t.STAT_C} cards for +1 each.' }
      },
      cardUi: { iconTip: { I: 'Magnifier: +1 to a {T.ACT_SEARCH} {t.TERM_ROLL} if you add this card.', N: '', C: 'Heart: +1 to a {T.ACT_COMFORT} {t.TERM_ROLL} if you add this card.' } },
      roll: { uses: 'Add {stat} cards: +1 each', parts: 'Base {base} + cards {icons}', strongComfort: 'Strong success! {T.TERM_DREAD} −1 more.' },
      ui: {
        buildTag: 'v0.4.1 · greybox playtest · placeholder art',
        start: 'Start', startTip: 'Start {t.TERM_NIGHT} 1.',
        tutorialLabel: 'Guided first two {t.TERM_NIGHTS}', tutorialFieldTip: 'The first two {t.TERM_NIGHTS} step by step, then you play the rest alone. Recommended the first time.',
        tutorial: 'Replay tutorial', tutorialTip: 'Restart with the guided first two {t.TERM_NIGHTS}.',
        statsSummary: 'Runs: {runs} · results {outcomes} · avg {t.TERM_CLUES} {avg} · avg final {t.TERM_DREAD} {dread}',
        coachTryIt: 'Your turn: use what\'s highlighted.',
        coachSkipTip: 'Close the tutorial and play on your own. Everything unlocks.'
      },
      presence: { ui: {
        trackTip: '{T.TERM_PRESENCE} is coming: {t.TRACK_APPROACH_1}, {t.TRACK_APPROACH_2}, {t.TRACK_APPROACH_3}, {t.TRACK_APPROACH_4}. It comes 1 step closer every {t.TERM_NIGHT}, and 2 on {t.TERM_NIGHTS} {late}–{total}. At the {t.TRACK_APPROACH_4}: {t.TERM_DREAD} +1, unless a {t.TERM_BAR} stops it.',
        markerTip: '{T.TERM_PRESENCE}. You can\'t fight it. {T.ACT_COMFORT}, Bread and Salt, Ward or a {t.TERM_BAR} keep it away.',
        lateBanner: 'The last {t.TERM_NIGHTS}. It moves faster.',
        visitEffect: '{T.TERM_DREAD} +1.',
        feedVisit: '{T.TERM_PRESENCE} reached the {t.TRACK_APPROACH_4}: {t.TERM_DREAD} +1',
        cause: { footprint: 'footprints ({event})', hour: 'a new {t.TERM_NIGHT}', late: 'the last {t.TERM_NIGHTS}', searchPull: 'you searched the {t.ZONE_TREELINE}', comfortPush: '{T.ACT_COMFORT}',
                 offering: '{card}', ward: '{card}', barHeld: 'the {t.TERM_BAR} held', visitDone: 'it leaves the door' },
        howTitle: '{T.TERM_PRESENCE}',
        howRules: [
          '{T.TERM_PRESENCE} walks this track: {t.TRACK_APPROACH_1}, {t.TRACK_APPROACH_2}, {t.TRACK_APPROACH_3}, {t.TRACK_APPROACH_4}. It comes 1 step closer every {t.TERM_NIGHT}, and 2 steps on {t.TERM_NIGHTS} {late}–{total}. Searching the {t.ZONE_TREELINE} draws it 1 step closer.',
          'If it reaches the {t.TRACK_APPROACH_4}: {t.TERM_DREAD} +1 and it goes back to the {t.TRACK_APPROACH_1}. A {t.TERM_BAR} stops the visit instead. If it will reach the {t.TRACK_APPROACH_4} this {t.TERM_NIGHT}, the {t.TERM_BAR} is kept for the visit.',
          '{T.ACT_COMFORT} pushes it back 1 step, Ward 2 steps, and Bread and Salt sends it back to the trees.'
        ]
      } }
    },
    howToPlay: { // Zosia FINAL (Notion "v0.4 Stripped Core copy")
      title: 'How to play',
      body: [
        'You\'re alone in the cottage until morning. Find {goal} {t.TERM_CLUES} before {t.TERM_DAWN}, which comes after {T.TERM_NIGHT} {total}. If {t.TERM_DREAD} reaches {max}, it\'s over at once.',
        'Each {t.TERM_NIGHT} starts with an event: {t.TERM_DREAD} +1, sometimes with a twist. You can always see the next one coming. Then {t.TERM_PRESENCE} takes a step closer.',
        'Then you have 2 {t.TERM_ACTIONS}, in any order, and you can repeat one: {T.ACT_MOVE} 1 area; {T.ACT_SEARCH} where you are for {t.TERM_CLUES}; {T.ACT_COMFORT} to lower {t.TERM_DREAD}; or {T.ACT_PLAY}. You don\'t have to use both. {T.ACT_END_TURN} and you draw a card.',
        'Further out finds more {t.TERM_CLUES}, but it\'s harder to search (see the areas below). Ending an {t.TERM_NIGHT} in the {t.ZONE_TREELINE}: {t.TERM_DREAD} +1.',
        '{T.ACT_SEARCH} and {T.ACT_COMFORT} are {t.TERM_ROLL}s: one die decides, and you need to reach the number shown. Before you {t.TERM_ROLL}, add cards with the matching icon for +1 each. Added cards are used up.'
      ],
      glossaryTitle: 'Words',
      glossary: [
        ['{T.TERM_CLUES}', 'What you find by searching. You need {goal} by {t.TERM_DAWN}.'],
        ['{T.TERM_DREAD}', 'How frightened you are, 0 to {max}. At {max}, you lose.'],
        ['Play vs add to a {t.TERM_ROLL}', 'Every card can be played for its effect (1 {t.TERM_ACTION}) or added to a {t.TERM_ROLL} for +1 (free). Never both.'],
        ['Magnifier / heart', 'Magnifier cards add +1 to a {T.ACT_SEARCH}. Heart cards add +1 to {T.ACT_COMFORT}.'],
        ['{T.TERM_BAR}', 'Stops the next event or one visit at the {t.TRACK_APPROACH_4}. Only one at a time. If {t.TERM_PRESENCE} will reach the {t.TRACK_APPROACH_4} this {t.TERM_NIGHT}, the {t.TERM_BAR} waits for it.'],
        ['Strong success', 'Beat the number by 3 or more: +1 extra {t.TERM_CLUE} on a {T.ACT_SEARCH}, {t.TERM_DREAD} −1 more on {T.ACT_COMFORT}.'],
        ['{T.TERM_OMEN}', 'One die face in six. The {t.TERM_ROLL} fails and {t.TERM_DREAD} goes up by 1.']
      ]
    },
    // Guided Hours 1-2 (spec section 6; coach text VERBATIM at the defaults, numbers/names templated so config and ?presence=A|B reach them).
    // target: element ids to highlight; trayTarget: ids once the roll window is open. allow: live controls.
    // await: 'roll:<cardId>' = roll with that card added, then Continue · 'move:<zoneId>' · 'play:<cardId>' · 'endTurn' · 'modal' (handoff) · none = Next.
    onboarding: {
      steps: [
        { id: 'goal',     hour: 1, target: ['goalBanner', 'nightCounter'], text: 'Your goal: find {goal} {t.TERM_CLUES} before {t.TERM_DAWN}. {T.TERM_DAWN} comes after {total} {t.TERM_NIGHTS}. If {T.TERM_DREAD} reaches {max}, you lose.' },
        { id: 'event',    hour: 1, target: ['nightEvent', 'dread'], text: 'Every {t.TERM_NIGHT} starts with an event. This one raised {T.TERM_DREAD} to {dread}. {T.TERM_DREAD} is your danger meter. Keep it low.' },
        { id: 'creature', hour: 1, target: ['approach', 'nextEvent'], text: 'This is {t.TERM_PRESENCE}. You can\'t fight it. It comes one step closer every {t.TERM_NIGHT}. If it reaches the {t.TRACK_APPROACH_4}, {T.TERM_DREAD} goes up. The card on the right shows next {t.TERM_NIGHT}\'s event, so you can plan.' },
        { id: 'search',   hour: 1, target: ['act-investigate'], trayTarget: ['rollAdd', 'rollGo'], allow: ['act-investigate', 'tray'], await: 'roll:rummage', text: '{T.ACT_SEARCH} the {t.ZONE_HOUSE} for a {t.TERM_CLUE}. It\'s the safest place, but worth only 1 {t.TERM_CLUE}. You need 2. Add a card with a magnifier for +1, then {t.TERM_ROLL}. Cards you add are used up.' },
        { id: 'move',     hour: 1, target: ['clues', 'act-move', 'zone-yard'], allow: ['act-move', 'zone-yard'], await: 'move:yard', text: 'You found a {t.TERM_CLUE}. Now move to the {t.ZONE_YARD}. It\'s worth 2 {t.TERM_CLUES} but harder to search. {T.TERM_PRESENCE} isn\'t close yet, so it\'s safe to go out.' },
        { id: 'end',      hour: 1, target: ['act-end', 'deckPile'], allow: ['act-end'], await: 'endTurn', text: 'You\'ve used your 2 {t.TERM_ACTIONS} for this {t.TERM_NIGHT}. End the {t.TERM_NIGHT} and you\'ll draw a card.' },
        { id: 'warning',  hour: 2, target: ['approach', 'visitWarn', 'nextEvent'], text: '{T.TERM_PRESENCE} is at the {t.TRACK_APPROACH_3}. Next {t.TERM_NIGHT} it reaches the {t.TRACK_APPROACH_4}, and {T.TERM_DREAD} will go up. You have 2 {t.TERM_ACTIONS}: use one to search and one to turn it away.' },
        { id: 'search2',  hour: 2, target: ['act-investigate'], trayTarget: ['rollAdd', 'rollGo'], allow: ['act-investigate', 'tray'], await: 'roll:shortcut', text: '{T.ACT_SEARCH} the {t.ZONE_YARD} first while you\'re here. You need 3: add a magnifier card again.' },
        { id: 'bread',    hour: 2, target: ['card-bread'], allow: ['card-bread'], await: 'play:bread', text: 'Now play Bread and Salt. It lowers {T.TERM_DREAD} and sends {t.TERM_PRESENCE} back to the trees. {T.ACT_COMFORT} and Bar the Door also keep it away.' },
        { id: 'handoff',  hour: 2, target: [], await: 'modal', text: 'You\'re on your own for the last {left} {t.TERM_NIGHTS}. You need {more} more {t.TERM_CLUES}. Watch {T.TERM_DREAD} and {t.TERM_PRESENCE}, and hover over anything for a reminder.' }
      ]
    },
    you: 'You', // the player's token label (no character names in v0.4)
    rollNeedsCard: 'Add {card} to the {t.TERM_ROLL} first, then roll.'
  },

  // ---------- How to play (Clarity Pass §9.4, 153 words) ----------
  howToPlay: {
    title: 'How to play',
    body: [
      'Something is circling the cottage, and it wants {C1}. Your goal: make it to {t.TERM_DAWN}, find {t.TERM_CLUES}, and answer as many of tonight\'s three {t.TERM_QUESTIONS} as you can.',
      'Each {t.TERM_NIGHT}, something happens outside, and {t.TERM_DREAD} usually rises. Then you get two {t.TERM_ACTIONS}: {T.ACT_MOVE} between the {t.ZONE_HOUSE}, the {t.ZONE_YARD} and the {t.ZONE_TREELINE}; {T.ACT_SEARCH} for {t.TERM_CLUES}; {T.ACT_COMFORT} to lower {t.TERM_DREAD} and call {C1} back inside; or {T.ACT_PLAY} for its effect. You can end the {t.TERM_NIGHT} early.',
      'Searching and Comforting need a {t.TERM_ROLL}. Before you {t.TERM_ROLL}, you can add cards with matching icons, +1 each, but added cards are gone. Each companion can help once.',
      'Searching further out finds more {t.TERM_CLUES} but raises the danger. If {t.TERM_DREAD} reaches {max}, the {t.TERM_NIGHT} breaks: {C1} walks out and it\'s over.',
      'At {t.TERM_DAWN}, spend your {t.TERM_CLUES} to answer {t.TERM_QUESTIONS}. What you answer, and whether you stayed together, decides the next scene.'
    ],
    glossaryTitle: 'Words',
    glossary: [
      ['{T.TERM_QUESTIONS}', 'Three things you can find out tonight. At {t.TERM_DAWN}, spend {t.TERM_CLUES} to answer them; the answers change the next scene.'],
      ['{T.TERM_CLUES}', 'What you earn by searching. Spend them at {t.TERM_DAWN} on {t.TERM_QUESTIONS}; unspent {t.TERM_CLUES} are lost.'],
      ['Play vs add to a {t.TERM_ROLL}', 'Every card can either be played for its effect (costs 1 {t.TERM_ACTION}) or added to a {t.TERM_ROLL} for +1 per matching icon (free). Never both.'],
      ['{T.TERM_HELP}', 'Each companion can help once, +2 to a {t.TERM_ROLL} (+3 if you grew closer in the story), but only on her stats.'],
      ['{T.TERM_BAR}', 'A card puts a {t.TERM_BAR} on the door, which cancels the next {t.TERM_NIGHT} event. Only one at a time.'],
      ['{T.TERM_OMEN}', 'One die face in six. The {t.TERM_ROLL} fails and {t.TERM_DREAD} goes up by 1.'],
      ['{T.TERM_DREAD}', 'How close the {t.TERM_NIGHT} is to breaking. At {max}, {C1} walks out and the {t.TERM_NIGHT} ends.']
    ]
  }
};
if (typeof module !== 'undefined') module.exports = UI_TEXT;
