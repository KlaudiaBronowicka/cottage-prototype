/* Headless smoke test of the rules engine + stats export.
 * Run: node tests/smoke.js      (no installs needed)
 * Plays thousands of seeded encounters with random and heuristic bots,
 * checks invariants, and asserts every ending (1, 2a, 2b, 2c, 3) and both
 * end reasons (dawn, early pressure end) are reachable without errors. */
'use strict';
var assert = require('assert');
var CONFIG = require('../config.js');
var Engine = require('../game.js');
var Stats = require('../stats.js');
var TXT = require('../data/vn-text.js');

function pick(rng, a) { return a[rng.int(a.length)]; }

function eligibleHelps(g, stat) { return ['c1', 'c2'].filter(function (w) { return g.helpEligible(w, stat).ok; }); }
function matching(g, stat, exclude) {
  var ic = Engine.ICON_OF_STAT[stat];
  return g.state.hand.filter(function (id) { return id !== exclude && g.card(id).icons.indexOf(ic) >= 0; });
}

// One action by a bot. style: 'random' | 'smart' | 'reckless'
function botStep(g, rng, style) {
  var S = g.state;
  if (S.phase === 'discard') { return g.discardDown(pick(rng, S.hand)); }
  if (S.actionsLeft <= 0 || (style === 'random' && rng() < 0.08)) return g.endRound();
  if (style === 'reckless') {
    if (S.pov < 2) return g.move(S.pov + 1);
    return g.endRound();
  }
  var options = [];
  if (S.pov > 0) options.push(function () { return g.move(S.pov - 1); });
  if (S.pov < 2) options.push(function () { return g.move(S.pov + 1); });
  var commitSome = function (stat, ex) { var m = matching(g, stat, ex); return style === 'smart' ? m : m.filter(function () { return rng() < 0.5; }); };
  var helpSome = function (stat) { var h = eligibleHelps(g, stat); return style === 'smart' ? (S.round >= 4 ? h : []) : h.filter(function () { return rng() < 0.3; }); };
  options.push(function () { return g.investigate({ commits: commitSome('INSIGHT'), helps: helpSome('INSIGHT') }); });
  options.push(function () { return g.steady({ commits: commitSome('CARE'), helps: helpSome('CARE') }); });
  var hasAct = function (a) { return g.cfg.uiActions.indexOf(a) >= 0; }; // rule set v0.2 cuts Draw and Hold the door
  if (S.pov === 0 && hasAct('holdDoor')) options.push(function () { return g.holdDoor({ commits: commitSome('NERVE'), helps: helpSome('NERVE') }); });
  if (S.deck.length && hasAct('draw')) options.push(function () { return g.drawAction(); });
  S.hand.forEach(function (id) {
    if (!g.canPlay(id).ok) return;
    options.push(function () {
      var c = g.card(id);
      var p = {};
      if (c.effect === 'investigateAnyZone') p.zone = rng.int(3);
      if (c.effect === 'investigateAnyZone' || c.effect === 'investigateYardFromHouse') { p.commits = commitSome('INSIGHT', id); p.helps = helpSome('INSIGHT'); }
      if (c.effect === 'readyHelp') p.helpToReady = S.helps.c1.used ? 'c1' : 'c2';
      return g.play(id, p);
    });
  });
  if (style === 'smart') {
    // simple priorities: calm when high, bring C1 home, progress cards, else investigate yard with icons
    var playIf = function (eff) { var id = S.hand.filter(function (x) { return g.card(x).effect === eff && g.canPlay(x).ok; })[0]; return id; };
    var id;
    var fc = g.presenceForecast && g.presenceForecast();
    if (fc && fc.visit && S.bars === 0 && (id = playIf('offering') || playIf('placeBar'))) return g.play(id); // v0.3: read the face-up clock
    if (S.pressure >= 3 && (id = playIf('pressure') || playIf('offering'))) return g.play(id);
    if (S.c1 > 0 && (id = playIf('c1InwardAndCalm') || playIf('c1Home'))) return g.play(id);
    if (S.c1 > 0 || S.pressure >= 4) return g.steady({ commits: matching(g, 'CARE'), helps: eligibleHelps(g, 'CARE') });
    if ((id = playIf('progressObject') || playIf('progress'))) return g.play(id);
    if (S.pov === 0 && (id = playIf('investigateYardFromHouse'))) return g.play(id, { commits: matching(g, 'INSIGHT', id), helps: eligibleHelps(g, 'INSIGHT') });
    if ((id = playIf('investigateAnyZone'))) return g.play(id, { zone: 2, commits: matching(g, 'INSIGHT', id), helps: eligibleHelps(g, 'INSIGHT') });
    if ((id = playIf('placeBar')) && S.round < 6 && rng() < 0.5) return g.play(id);
    if (S.pov === 0 && S.round < 6 && S.bars === 0 && g.cfg.uiActions.indexOf('holdDoor') >= 0 && rng() < 0.3) return g.holdDoor({ commits: matching(g, 'NERVE') });
    return g.investigate({ commits: matching(g, 'INSIGHT'), helps: S.round >= 5 ? eligibleHelps(g, 'INSIGHT') : [] });
  }
  return pick(rng, options)();
}

function bestAllocation(g, rng, mode) {
  var legal = g.legalAllocations();
  if (mode === 'random') return pick(rng, legal);
  legal.sort(function (a, b) { return b.length - a.length; });
  return legal[0];
}

function playOne(seed, style, allocMode, opts) {
  opts = opts || {};
  var cfg = opts.cfg || CONFIG;
  var rng = Engine.makeRng(seed ^ 0x9e3779b9);
  var g = Engine.createGame(cfg, { seed: seed, bond: rng() < 0.5 ? 'C1' : 'C2', key: rng() < 0.5 ? 'SHARED' : 'KEPT', visited: opts.visited });
  var S = g.state, guard = 0;
  while (S.phase === 'actions' || S.phase === 'discard') {
    if (++guard > 500) throw new Error('stuck seed ' + seed);
    var before = S.actionsLeft, round = S.round;
    var r = botStep(g, rng, style);
    assert(r && typeof r.ok === 'boolean', 'action returns result');
    assert(S.pressure >= cfg.pressureMin && S.pressure <= cfg.pressureMax, 'pressure in range');
    assert(S.round <= cfg.rounds, 'round within limit');
    assert(S.actionsLeft >= 0, 'actions non-negative');
    if (S.phase === 'actions' && S.round !== round) assert(S.hand.length <= cfg.handLimit, 'hand limit after round end');
    // play-or-commit-never-both: total cards conserved
    var total = S.deck.length + S.hand.length + S.discard.length + S.removed.length;
    assert.strictEqual(total, g.cfg.deck.length, 'card conservation');
    assert(S.bars <= 1, 'max 1 Bar');
  }
  assert.strictEqual(S.phase, 'allocate');
  assert(S.endReason === 'dawn' || S.endReason === 'pressure');
  if (S.endReason === 'pressure') assert.strictEqual(S.pressure, cfg.pressureMax);
  if (S.endReason === 'dawn') assert.strictEqual(S.roundsPlayed, cfg.rounds);
  // invalid allocations are rejected
  assert(!g.allocate(['T1', 'T2', 'T3', 'T3']).ok || S.progress >= 12);
  var alloc = bestAllocation(g, rng, allocMode);
  var res = g.allocate(alloc);
  assert(res.ok, 'allocation ok: ' + JSON.stringify(res));
  assert.strictEqual(S.phase, 'done');
  var R = S.result;
  assert(TXT.outcomes[R.outcome], 'outcome has text: ' + R.outcome);
  R.inserts.forEach(function (k) { assert(TXT.inserts[k], 'insert text ' + k); });
  if (R.outcome === '1') { assert.strictEqual(R.escapedTogether, 'Y'); assert.strictEqual(R.threadsResolved.length, 3); }
  if (R.outcome === '3b') { assert.strictEqual(S.endReason, 'dawn'); assert.strictEqual(R.escapedTogether, 'Y'); assert(R.threadsResolved.length <= 1);
    assert(R.inserts.indexOf(R.threadsResolved.length ? 'together1' : 'together0') >= 0); }
  if (R.outcome === '3') assert(S.pressureMaxed || R.escapedTogether === 'N', 'plain Outcome 3 only for walk-out or C1 outside');
  // bond inserts follow FINAL bond
  assert.strictEqual(R.inserts.indexOf('bondC1') >= 0, R.finalBondC1 > 0);
  assert.strictEqual(R.inserts.indexOf('bondC2') >= 0, R.finalBondC2 > 0);
  assert(S.bars <= 1, 'Bars never stack');
  if (S.pressureMaxed) { assert.strictEqual(R.outcome, '3'); assert(R.threadsResolved.length <= 1); assert.strictEqual(R.escapedTogether, 'N'); }
  return g;
}

var outcomes = {}, ends = {}, n = 0, styles = ['random', 'smart', 'reckless'];
var progressSum = { smart: 0, random: 0 }, cnt = { smart: 0, random: 0 };
var store = new Stats.Store('test', null);
// rule set v0.2 (default, all flags ON) for most seeds; every 5th seed plays the kit v0.1 rules (all flags OFF) so both stay working
var LEGACY = Object.assign({}, CONFIG, { rules: { cutDrawAndHold: false, endTurnButton: false, startZeroClues: false, chairForPierogi: false }, presence: Object.assign({}, CONFIG.presence, { mode: 'off' }) });
// v0.3: presence modes off / track / token (token = parked Variant 2, runs the track rules) and both copy directions
function withPresence(mode, dir) { return Object.assign({}, CONFIG, { presence: Object.assign({}, CONFIG.presence, { mode: mode, direction: dir || 'A' }) }); }
var P_OFF = withPresence('off'), P_TOKEN = withPresence('token'), P_B = withPresence('track', 'B');
for (var seed = 1; seed <= 4000; seed++) {
  var style = styles[seed % 3];
  var g = playOne(seed, style, seed % 2 ? 'random' : 'max', { cfg: seed % 5 === 0 ? LEGACY : seed % 7 === 0 ? P_OFF : seed % 11 === 0 ? P_TOKEN : seed % 2 ? P_B : CONFIG });
  if (g.state.presence) { assert(g.state.presence.pos >= 0 && (g.state.presence.pos <= 2 || g.state.endReason === 'pressure'), 'Presence never rests on the Door (unless the visit broke the night)'); assert.strictEqual(g.state.presence.byNight.length, g.state.perRound.length); }
  else assert(g.cfg.presenceMode === 'off');
  n++;
  outcomes[g.state.result.outcome] = (outcomes[g.state.result.outcome] || 0) + 1;
  ends[g.state.endReason] = (ends[g.state.endReason] || 0) + 1;
  if (progressSum[style] != null) { progressSum[style] += g.state.progressEarned + g.cfg.startProgress; cnt[style]++; }
  if (seed <= 50) store.add(Stats.buildRecord(g, { runId: 'r' + seed, outcomeScene: TXT.outcomes[g.state.result.outcome].title, encounterSeconds: 0, totalSeconds: 0 }));
}
// faster variant: cards removed for unvisited spots
var fastCfg = Object.assign({}, CONFIG, { fasterVariant: true });
var gf = playOne(7, 'random', 'max', { cfg: fastCfg, visited: ['3a', '3c'] });
assert.deepStrictEqual(gf.state.removed, ['later'], 'faster variant removes the 3b card');

// determinism: same seed + same inputs = same log
var a = playOne(42, 'random', 'max'), b = playOne(42, 'random', 'max');
assert.deepStrictEqual(a.state.log, b.state.log, 'seeded runs are deterministic');

// targeted rule checks
(function () {
  var g = Engine.createGame(CONFIG, { seed: 5, bond: 'C1', key: 'SHARED' });
  var S = g.state;
  S.pressure = 5; S.pov = 2; S.c1 = 2; S.actionsLeft = 0;
  g.endRound();
  assert.strictEqual(S.phase, 'allocate', 'Treeline exposure at 5 triggers early end');
  assert.strictEqual(S.endReason, 'pressure');
  assert(!g.allocate(['T2', 'T3']).ok, 'max 1 thread after pressure 6');
})();
(function () {
  var g = Engine.createGame(CONFIG, { seed: 9, bond: 'C2', key: 'KEPT' });
  var S = g.state;
  S.hand = ['rule']; S.deck = S.deck.filter(function (x) { return x !== 'rule'; });
  var p0 = S.pressure;
  assert(g.play('rule').ok); assert.strictEqual(S.bars, 1);
  g.endRound(); // next night should be cancelled
  assert(S.lastEvent.cancelled, 'Bar cancels next event'); assert.strictEqual(S.bars, 0);
  // STAR forced roll: auto-fail +1 pressure
  var pr = S.pressure; var r = g.steady({ roll: 6 }).test;
  assert(r.star && !r.success); assert.strictEqual(S.pressure, Math.min(6, pr + 1));
  // tie succeeds: base 2 vs Steady 2 with roll 1 (0)
  r = g.steady({ roll: 1 }).test; assert(r.success, 'ties succeed');
  // help eligibility
  S.c1 = 1; assert(!g.helpEligible('c1', 'CARE').ok, 'C1 help only in House');
  assert(!g.helpEligible('c2', 'CARE').ok, 'C2 help not for CARE');
  assert.strictEqual(g.helpBonus('c2'), CONFIG.helpBonusBonded, 'bonded help +3');
})();

// RULED: Bars don't stack
(function () {
  var g = Engine.createGame(CONFIG, { seed: 11 }); var S = g.state;
  S.hand = ['rule', 'kompot']; S.deck = S.deck.filter(function (x) { return S.hand.indexOf(x) < 0; }); S.pov = 0; S.actionsLeft = 2;
  S.bars = 1;
  assert(!g.canPlay('rule').ok, "Mother's Rule blocked while a Bar is down");
  assert.strictEqual(S.actionsLeft, 2, 'blocked action costs nothing');
  var gl = Engine.createGame(LEGACY, { seed: 11 }); gl.state.pov = 0; gl.state.bars = 1;
  var r = gl.holdDoor({}); assert(!r.ok && /stack/.test(r.error), 'Hold the door (v0.1 rules) blocked while a Bar is down');
})();
// RULE SET v0.2 (approved): Draw + Hold the door cut, start at 0 clues, Chair Under the Handle replaces Burnt Pierogi
(function () {
  var g = Engine.createGame(CONFIG, { seed: 21 }), S = g.state, ids = g.cfg.deck.map(function (c) { return c.id; });
  assert.strictEqual(S.progress, 0, 'starts at 0 clues'); assert.strictEqual(ids.length, 12, '12-card deck');
  assert(ids.indexOf('chair') >= 0 && ids.indexOf('pierogi') < 0, 'Chair replaces Burnt Pierogi');
  assert.deepStrictEqual(g.cfg.uiActions, ['move', 'investigate', 'steady', 'play'], 'action list after cuts');
  assert(!g.drawAction().ok && !g.holdDoor({}).ok, 'Draw and Hold the door rejected'); assert.strictEqual(S.actionsLeft, 2);
  S.hand = ['chair', 'rule']; S.deck = S.deck.filter(function (x) { return S.hand.indexOf(x) < 0; });
  assert(g.play('chair').ok && S.bars === 1, 'Chair places a Bar'); assert(!g.canPlay('rule').ok, 'max 1 Bar');
  assert.strictEqual(g.cfg.chairCard.icons.join(''), 'N', 'Chair is a NERVE card');
  assert(CONFIG.deck.some(function (c) { return c.id === 'pierogi'; }), 'base config untouched (flag can be switched off)');
  // Comfort: EVERY success lowers Dread by 1 (strong: 1 more) and calls COMPANION 1 one step in
  S.pressure = 3; S.c1 = 2; S.actionsLeft = 2; var r = g.steady({ roll: 1 }).test; assert(r.success && !r.strong);
  assert.strictEqual(S.pressure, 2); assert.strictEqual(S.c1, 1);
  // the feed names the cause of every change (for the UI)
  var last = S.feed.filter(function (f) { return f.type === 'pressure'; }).pop(); assert.strictEqual(last.src.type, 'comfort');
})();
// guided Night 1: fixed first event + starting cards, first roll succeeds; skipping stops the rig
(function () {
  for (var sd = 1; sd <= 200; sd++) {
    var g = Engine.createGame(CONFIG, { seed: sd, tutorial: true }), S = g.state;
    assert.strictEqual(S.lastEvent.id, CONFIG.tutorialEvent); assert.strictEqual(S.pressure, 1, 'Footsteps raised Dread to 1');
    g.cfg.tutorialHand.forEach(function (id) { assert(S.hand.indexOf(id) >= 0, 'tutorial hand has ' + id); });
    assert(g.investigate({}).test.success, 'tutorial first Search succeeds (seed ' + sd + ')');
  }
  var g2 = Engine.createGame(CONFIG, { seed: 3, tutorial: true }); g2.endTutorial(); assert(g2.state.tutorialRollRigged && g2.state.tutorialSkipped);
})();

// ---------- v0.3 The Approach (Tension Pass v0.3, Variant 1) ----------
(function () {
  function fresh(seed, cfg) { var g = Engine.createGame(cfg || CONFIG, { seed: seed || 31, bond: 'C1', key: 'KEPT' }); return g; }
  function nextNight(g, evId) { var S = g.state; var i = S.events.indexOf(evId); if (i >= 0) S.events.splice(i, 1); S.events.unshift(evId); S.actionsLeft = 0; while (S.hand.length >= g.cfg.handLimit) S.discard.push(S.hand.pop()); g.endRound(); assert.strictEqual(S.phase, 'actions'); }
  var g = fresh(), S = g.state, P = S.presence;
  assert.strictEqual(g.cfg.presenceMode, 'track', 'presence defaults to track');
  assert(g.cfg.deck.some(function (c) { return c.id === 'bread'; }) && !g.cfg.deck.some(function (c) { return c.id === 'kompot'; }), 'Bread and Salt replaces Kompot');
  assert.strictEqual(g.cfg.deck.length, 12);
  assert.strictEqual(g.cfg.events.filter(function (e) { return e.id === 'handle'; })[0].pressure, 1, 'Door Handle eased to Dread +1');
  assert.deepStrictEqual(g.cfg.events.filter(function (e) { return e.footprint; }).map(function (e) { return e.id; }).sort(), ['footsteps', 'gate', 'handle', 'silence']);
  // footprint step happens even when a Bar cancels the event
  P.pos = 0; S.bars = 1; S.pressure = 0; S.pov = 0; S.c1 = 0; nextNight(g, 'footsteps');
  assert(S.lastEvent.cancelled && S.bars === 0 && P.pos === 1 && S.pressure === 0, 'Bar cancels event, Presence still steps');
  // non-footprint event (before nights 5-6): no step
  nextNight(g, 'voice'); assert.strictEqual(P.pos, 1, 'no footprint, no step');
  // visit (no Bar): Dread +1, COMPANION 1 one zone out, back to the Treeline
  S.c1 = 0; P.pos = 2; var d0 = S.pressure; nextNight(g, 'gate');
  assert.strictEqual(P.visits, 1); assert.strictEqual(P.pos, 0); assert.strictEqual(S.c1, 1); assert.strictEqual(S.pressure, d0 + 1 + (S.pov ? 1 : 0) /* gate hits only if POV outside */);
  assert(S.feed.some(function (f) { return f.type === 'visit' && f.line >= 0 && f.line < CONFIG.presence.doorLineCount; }), 'visit line index from seeded RNG');
  // a Bar consumed by the event leaves the visit unblocked; a Bar still up blocks the visit -> Yard
  var g2 = fresh(32), S2 = g2.state; S2.presence.pos = 2; S2.bars = 0; S2.actionsLeft = 2; S2.pov = 2;
  S2.hand = ['chair']; S2.deck = S2.deck.filter(function (x) { return x !== 'chair'; });
  assert(g2.play('chair').ok); var dd = S2.pressure;
  var r = g2.investigate({ roll: 5 }); // Treeline, base 2 + 1 vs 4 -> fail; force success with a better roll below
  if (!r.test.success) { S2.actionsLeft = 1; S2.torch = 5; r = g2.investigate({ roll: 1 }); }
  assert(r.test.success, 'search succeeded');
  assert.strictEqual(S2.presence.blocked, 1, 'Bar stopped the visit'); assert.strictEqual(S2.bars, 0); assert.strictEqual(S2.presence.pos, 1, 'blocked visit -> Yard');
  assert.strictEqual(S2.presence.searchPulls >= 1, true); assert(S2.pressure <= dd + 1);
  // Comfort success turns it back 1 (not past the start); Offering = Dread -1 and back to the start
  var g3 = fresh(33), S3 = g3.state; S3.presence.pos = 2; S3.actionsLeft = 2; S3.pressure = 3;
  assert(g3.steady({ roll: 1 }).test.success); assert.strictEqual(S3.presence.pos, 1); assert.strictEqual(S3.presence.comfortPushes, 1);
  S3.presence.pos = 0; S3.actionsLeft = 1; g3.steady({ roll: 1 }); assert.strictEqual(S3.presence.pos, 0); assert.strictEqual(S3.presence.comfortPushes, 1, 'no push counted at the start');
  S3.presence.pos = 2; S3.actionsLeft = 1; S3.hand = ['bread']; S3.deck = S3.deck.filter(function (x) { return x !== 'bread'; }); S3.pressure = 3;
  assert(g3.play('bread').ok); assert.strictEqual(S3.pressure, 2); assert.strictEqual(S3.presence.pos, 0); assert.strictEqual(S3.presence.offerings, 1);
  // late nights: 1 extra step each night from night 5, even on a non-footprint event
  var g4 = fresh(34), S4 = g4.state; while (S4.round < 4) { S4.pressure = 0; S4.c1 = 0; S4.pov = 0; nextNight(g4, 'voice'); }
  S4.presence.pos = 0; S4.c1 = 0; S4.pressure = 0; var fc = g4.presenceForecast(); S4.events = S4.events.filter(function (x) { return x !== 'lights'; }); S4.events.unshift('lights');
  fc = g4.presenceForecast(); assert(fc.late && fc.steps.total === 1 && !fc.visit);
  nextNight(g4, 'lights'); assert.strictEqual(S4.round, 5); assert.strictEqual(S4.presence.pos, 1, 'late night extra step');
  // forecast / visit warning: Window + footprint next
  S4.presence.pos = 2; S4.events = S4.events.filter(function (x) { return x !== 'silence'; }); S4.events.unshift('silence'); assert(g4.presenceForecast().visit, 'visit warning');
  S4.presence.pos = 1; assert(g4.presenceForecast().visit, 'Yard + footprint + late = visit');
  // v0.3.1 barSavesForVisit (default ON): tonight's footprint step reaches the Door -> the up Bar is held for the visit, the event is not stopped
  assert.strictEqual(CONFIG.presence.barSavesForVisit, true, 'barSavesForVisit defaults ON');
  var gh = fresh(40), SH = gh.state; SH.presence.pos = 2; SH.bars = 1; SH.pressure = 0; SH.pov = 0; SH.c1 = 0;
  SH.events = SH.events.filter(function (x) { return x !== 'footsteps'; }); SH.events.unshift('footsteps');
  var fch = gh.presenceForecast(); assert(fch.visit && fch.barSaved, 'forecast: Bar saved for the visit');
  nextNight(gh, 'footsteps');
  assert(!SH.lastEvent.cancelled && SH.lastEvent.barSaved, 'event NOT stopped when the Bar is saved for the visit');
  assert.strictEqual(SH.presence.barHeldForVisit, 1); assert.strictEqual(SH.presence.blocked, 1, 'held Bar blocks the visit');
  assert.strictEqual(SH.presence.visits, 0); assert.strictEqual(SH.bars, 0); assert.strictEqual(SH.presence.pos, CONFIG.presence.barBlockReturnTo);
  assert(SH.feed.some(function (f) { return f.type === 'barSaved'; }), 'barSaved feed entry');
  for (var gi = 0; gi < 20 && SH.phase === 'actions'; gi++) { SH.actionsLeft = 0; SH.pressure = 0; SH.bars = 0; while (SH.hand.length >= gh.cfg.handLimit) SH.discard.push(SH.hand.pop()); gh.endRound(); }
  if (SH.phase === 'allocate') gh.allocate([]);
  var recH = Stats.buildRecord(gh, {}); assert(recH.barHeldForVisit >= 1, 'stats: barHeldForVisit logged');
  // ... no visit coming: the Bar still stops the event (whichever comes first)
  var gn = fresh(41), SN = gn.state; SN.presence.pos = 0; SN.bars = 1; SN.pov = 0; SN.c1 = 0; nextNight(gn, 'footsteps');
  assert(SN.lastEvent.cancelled && SN.presence.barHeldForVisit === 0, 'no visit coming: Bar stops the event');
  // ... the late step counts: night 5, Window, non-footprint event -> held
  var gl = fresh(42), SL = gl.state; while (SL.round < 4) { SL.pressure = 0; SL.c1 = 0; SL.pov = 0; nextNight(gl, 'voice'); }
  SL.presence.pos = 2; SL.bars = 1; SL.pressure = 0; SL.c1 = 0; SL.pov = 0; nextNight(gl, 'voice');
  assert(!SL.lastEvent.cancelled && SL.presence.barHeldForVisit === 1 && SL.presence.blocked === 1, 'late step to the Door: Bar held');
  // ... flag OFF = v0.3: the Bar stops the event, the visit lands
  var P_NOSAVE = Object.assign({}, CONFIG, { presence: Object.assign({}, CONFIG.presence, { barSavesForVisit: false }) });
  var gf = fresh(40, P_NOSAVE), SF = gf.state; SF.presence.pos = 2; SF.bars = 1; SF.pressure = 0; SF.pov = 0; SF.c1 = 0;
  SF.events = SF.events.filter(function (x) { return x !== 'footsteps'; }); SF.events.unshift('footsteps');
  assert(!gf.presenceForecast().barSaved, 'flag off: nothing saved');
  nextNight(gf, 'footsteps');
  assert(SF.lastEvent.cancelled && SF.presence.visits === 1 && SF.presence.blocked === 0 && SF.presence.barHeldForVisit === 0, 'flag off: Bar used by the event, visit lands');
  // off = v0.2 exactly
  var go = fresh(35, P_OFF); assert.strictEqual(go.state.presence, null); assert(go.cfg.deck.some(function (c) { return c.id === 'kompot'; }));
  assert.strictEqual(go.cfg.events.filter(function (e) { return e.id === 'handle'; })[0].pressure, 2); assert.strictEqual(go.presenceForecast(), null);
  // token (Variant 2, parked) falls back to the track rules and says so in the stats
  var gt = fresh(36, P_TOKEN); assert.strictEqual(gt.cfg.presenceMode, 'track'); assert.strictEqual(gt.state.presence.asked, 'token');
  // direction is copy only: same seed, same game
  var a1 = playOne(77, 'smart', 'max', { cfg: CONFIG }), b1 = playOne(77, 'smart', 'max', { cfg: P_B });
  assert.deepStrictEqual(a1.state.log, b1.state.log, 'direction A/B does not change the rules');
})();
// Question costs (Narrative Writer's sentences: Being 3, Companion 4, Past 2)
assert.deepStrictEqual(CONFIG.threads.map(function (t) { return t.cost; }), [3, 4, 2], 'Question costs match the tutorial copy');

// RULED: Photos (House only, Yard) and Key (any zone -> any zone) cost 1 action incl. the test
(function () {
  var g = Engine.createGame(CONFIG, { seed: 12 }); var S = g.state;
  S.hand = ['photos', 'key']; S.deck = S.deck.filter(function (x) { return S.hand.indexOf(x) < 0; });
  S.pov = 1; S.actionsLeft = 2;
  assert(!g.canPlay('photos').ok, 'Photos needs the House');
  var r = g.play('key', { zone: 0, roll: 5 }); assert(r.ok && r.test, 'Key from the Yard on the House');
  assert.strictEqual(r.test.difficulty, CONFIG.zones[0].investigateDifficulty); assert.strictEqual(S.actionsLeft, 1, 'Key = 1 action total');
  S.pov = 0; var p = S.progress;
  r = g.play('photos', { roll: 5 }); assert(r.ok && r.test.difficulty === CONFIG.zones[1].investigateDifficulty, 'Photos investigates the Yard');
  assert.strictEqual(S.actionsLeft, 0, 'Photos = 1 action total');
  if (r.test.success) assert(S.progress >= p + CONFIG.zones[1].progress);
})();
// RULED: final bond drives inserts; Outcome 3b at dawn with 0-1 Threads and escaped Y
(function () {
  var g = Engine.createGame(CONFIG, { seed: 13, bond: 'C2', key: 'KEPT' }); var S = g.state;
  S.phase = 'allocate'; S.endReason = 'dawn'; S.c1 = 0; S.c1BroughtBack = true; S.progress = 2; S.pressure = 4;
  var R = g.allocate(['T3']).result;
  assert.strictEqual(R.outcome, '3b'); assert.strictEqual(R.finalBondC1, 1); assert.strictEqual(R.finalBondC2, 1);
  assert.deepStrictEqual(R.inserts, ['together1', 'together1_T3', 'bondC1', 'bondC2', 'kept', 'highPressure']);
  var g2 = Engine.createGame(CONFIG, { seed: 14, bond: 'C1', key: 'SHARED' }); var S2 = g2.state;
  S2.phase = 'allocate'; S2.endReason = 'dawn'; S2.c1 = 1; S2.progress = 0;
  var R2 = g2.allocate([]).result;
  assert.strictEqual(R2.outcome, '3', 'C1 outside at dawn -> plain Outcome 3'); assert.strictEqual(R2.finalBondC1, 0);
  assert(R2.inserts.indexOf('bondC1') < 0, 'Beat 4 +1 cancelled by encounter -1 -> no bond insert');
  var g3 = Engine.createGame(CONFIG, { seed: 15, bond: 'C1' }); g3.state.phase = 'allocate'; g3.state.endReason = 'dawn'; g3.state.c1 = 0;
  assert.deepStrictEqual(g3.allocate([]).result.inserts.slice(0, 1), ['together0']);
})();

// stats export
var runs = store.all();
var KIT_FIELDS = ['progressEarned', 'threadsResolved', 'escapedTogether', 'finalPressure', 'helpsUsed', 'c1BondChange', 'keyChoice', 'outcome', 'outcomeScene', 'roundsPlayed', 'plays', 'commits', 'playsVsCommits'];
runs.forEach(function (r) {
  Stats.COLUMNS.forEach(function (c) { assert(r[c] !== undefined, 'stats field present: ' + c); });
  KIT_FIELDS.forEach(function (c) { assert(Stats.COLUMNS.indexOf(c) >= 0, 'kit field in CSV: ' + c); });
  assert(r.outcomeScene, 'outcome scene recorded');
  assert(/^n1:/.test(r.perRound), 'per-night detail recorded'); assert(r.rules !== undefined);
  if (r.presenceMode !== 'off') assert(r.presenceByNight.split(' ').length === +r.roundsPlayed || r.endReason === 'pressure', 'presence per night');
});
var csv = Stats.toCSV(runs), json = JSON.parse(Stats.toJSON(runs));
assert.strictEqual(csv.trim().split('\n').length, runs.length + 1, 'csv rows');
assert.strictEqual(json.runs.length, 50);
require('fs').writeFileSync(__dirname + '/sample-stats.csv', csv); require('fs').writeFileSync(__dirname + '/sample-stats.json', Stats.toJSON(runs)); // example exports for the README

console.log('Played ' + n + ' encounters without errors.');
console.log('Outcomes:', JSON.stringify(outcomes));
console.log('End reasons:', JSON.stringify(ends));
console.log('Mean final progress (start + earned): smart ' + (progressSum.smart / cnt.smart).toFixed(2) + ', random ' + (progressSum.random / cnt.random).toFixed(2));
['1', '2a', '2b', '2c', '3', '3b'].forEach(function (o) { assert(outcomes[o] > 0, 'outcome ' + o + ' reachable'); });
assert(ends.dawn > 0 && ends.pressure > 0, 'both end reasons reachable');
console.log('ALL SMOKE CHECKS PASSED');
