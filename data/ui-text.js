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
    ZONE_HOUSE: 'House', ZONE_YARD: 'Yard', ZONE_TREELINE: 'Treeline'
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
  onboarding: {
    steps: [
      { id: 'goal',      target: ['goalBanner', 'nightCounter'], text: 'Make it to {t.TERM_DAWN}. Find {t.TERM_CLUES}. Answer what you can.', voice: '{C2}: Six hours till light. We can do six hours.' },
      { id: 'questions', target: ['questions'], text: 'These are tonight\'s {t.TERM_QUESTIONS}. At {t.TERM_DAWN}, you spend {t.TERM_CLUES} to answer them.', voice: '{POV}: Something keeps circling this house. I want to know what.' },
      { id: 'event',     target: ['nightEvent', 'dread'], text: 'Each {t.TERM_NIGHT} starts with something outside. This raised {t.TERM_DREAD} to 1. At {max}, the {t.TERM_NIGHT} breaks.', voice: '{C1}: It\'s back. Under the window.' },
      { id: 'zones',     target: ['board'], text: 'Searching further out finds more {t.TERM_CLUES}, but it\'s more dangerous.' },
      { id: 'search',    target: ['act-investigate'], allow: ['act-investigate'], await: 'trayOpen', text: '{T.ACT_SEARCH} for {t.TERM_CLUES} here. You have 2 {t.TERM_ACTIONS} each {t.TERM_NIGHT}.' },
      { id: 'add',       target: ['rollAdd'], allow: ['tray'], await: 'roll', text: 'You can add matching cards to this {t.TERM_ROLL}: +1 each. Added cards are discarded.' },
      { id: 'clue',      target: ['rollResult', 'clues'], allow: ['tray'], text: 'You found a {t.TERM_CLUE}.', voice: '{POV}: The footprints stop at the door. Right at the door.' },
      { id: 'play',      target: ['card-kompot'], allow: ['card-kompot'], await: 'play:kompot', text: 'Or play a card for its effect. This costs an {t.TERM_ACTION}.', voice: '{C2}: Drink. The {HOST} said don\'t waste it, and I\'m scared of her.' },
      { id: 'comfort',   target: ['tok-C1', 'act-steady'], text: 'If the voice pulls {C1} outside, {t.ACT_COMFORT} brings her back. Bring her home by {t.TERM_DAWN}.' },
      { id: 'end',       target: ['act-end', 'deckPile'], allow: ['act-end'], await: 'endTurn', text: 'Out of {t.TERM_ACTIONS}. End the {t.TERM_NIGHT}: you draw a card. Five more {t.TERM_NIGHTS} till {t.TERM_DAWN}.' }
    ]
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
