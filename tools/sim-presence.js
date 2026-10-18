/* tools/sim-presence.js — rules sim for v0.3 The Approach vs presence OFF (rule set v0.2).
 * Run: node tools/sim-presence.js [runs=5000]   → prints a table and writes tests/sim-presence-report.txt
 * Bots (simple, same as the smoke test's spirit):
 *   random  — any legal action, random cards added to rolls
 *   smart   — calms when Dread is high, brings COMPANION 1 home, plays clue cards, searches the Yard (Treeline when Dread <= 2); IGNORES the Presence
 *   aware   — smart, plus reads the face-up next event: when a visit is forecast it plays Bread and Salt or a Bar,
 *             else Comforts; avoids Treeline searches when the Presence is at the Window
 * v0.3.1: rows with barSavesForVisit on (default) and off (= v0.3) for comparison.
 * "Win" = Outcome 1 (all three Questions, together). "Good" = Outcome 1 or 2x. "Broke" = Dread hit 6. */
'use strict';
var CONFIG = require('../config.js'), Engine = require('../game.js');
var N = +(process.argv[2] || 5000);
function pick(rng, a) { return a[rng.int(a.length)]; }
function matching(g, stat, ex) { var ic = Engine.ICON_OF_STAT[stat]; return g.state.hand.filter(function (id) { return id !== ex && g.card(id).icons.indexOf(ic) >= 0; }); }
function helps(g, stat) { return ['c1', 'c2'].filter(function (w) { return g.helpEligible(w, stat).ok; }); }
function step(g, rng, bot) {
  var S = g.state;
  if (S.phase === 'discard') return g.discardDown(pick(rng, S.hand));
  if (S.actionsLeft <= 0) return g.endRound();
  var playIf = function (eff) { return S.hand.filter(function (x) { return g.card(x).effect === eff && g.canPlay(x).ok; })[0]; };
  if (bot === 'random') {
    var o = [function () { return g.investigate({ commits: matching(g, 'INSIGHT').filter(function () { return rng() < 0.5; }) }); },
      function () { return g.steady({ commits: matching(g, 'CARE').filter(function () { return rng() < 0.5; }) }); }];
    if (S.pov > 0) o.push(function () { return g.move(S.pov - 1); }); if (S.pov < 2) o.push(function () { return g.move(S.pov + 1); });
    S.hand.forEach(function (id) { if (g.canPlay(id).ok) o.push(function () { return g.play(id, { zone: rng.int(3) }); }); });
    if (rng() < 0.08) return g.endRound();
    return pick(rng, o)();
  }
  var id, fc = bot === 'aware' && g.presenceForecast ? g.presenceForecast() : null;
  if (fc && fc.visit && S.bars === 0) {
    if ((id = playIf('offering') || playIf('placeBar'))) return g.play(id);
    if (S.presence.pos > 0 && S.actionsLeft > 0) return g.steady({ commits: matching(g, 'CARE'), helps: helps(g, 'CARE') });
  }
  if (S.pressure >= 3 && (id = playIf('pressure') || playIf('offering'))) return g.play(id);
  if (S.c1 > 0 && (id = playIf('c1InwardAndCalm') || playIf('c1Home'))) return g.play(id);
  if (S.c1 > 0 || S.pressure >= 4) return g.steady({ commits: matching(g, 'CARE'), helps: helps(g, 'CARE') });
  if ((id = playIf('progressObject') || playIf('progress'))) return g.play(id);
  if (S.pov === 0 && (id = playIf('investigateYardFromHouse'))) return g.play(id, { commits: matching(g, 'INSIGHT', id), helps: helps(g, 'INSIGHT') });
  var avoidTree = bot === 'aware' && S.presence && S.presence.pos >= 2;
  if ((id = playIf('investigateAnyZone'))) return g.play(id, { zone: avoidTree ? 1 : 2, commits: matching(g, 'INSIGHT', id), helps: helps(g, 'INSIGHT') });
  if ((id = playIf('placeBar')) && S.round < 6 && rng() < 0.5) return g.play(id);
  var target = !avoidTree && S.pressure <= 2 && S.actionsLeft === 2 ? 2 : 1; // Treeline only early in the night and when Dread is low (exposure)
  if (S.pov < target && S.round < 6) return g.move(S.pov + 1);
  if (S.pov > target) return g.move(S.pov - 1);
  return g.investigate({ commits: matching(g, 'INSIGHT'), helps: S.round >= 5 ? helps(g, 'INSIGHT') : [] });
}
function run(cfg, bot, seed) {
  var rng = Engine.makeRng(seed ^ 0x51a7), g = Engine.createGame(cfg, { seed: seed, bond: rng() < 0.5 ? 'C1' : 'C2', key: rng() < 0.5 ? 'SHARED' : 'KEPT' }), S = g.state, guard = 0;
  while (S.phase === 'actions' || S.phase === 'discard') { if (++guard > 500) throw new Error('stuck'); step(g, rng, bot); }
  var legal = g.legalAllocations().sort(function (a, b) { return b.length - a.length; }); g.allocate(legal[0]);
  return g;
}
function cfgFor(mode, save) { return Object.assign({}, CONFIG, { presence: Object.assign({}, CONFIG.presence, { mode: mode, barSavesForVisit: save }) }); }
var rows = [], out = [];
// rows: [presence mode, bot, barSavesForVisit] (v0.3.1: flag ON is the default; OFF rows = v0.3 for comparison)
var ROWS = [['off', 'smart', true], ['track', 'smart', true], ['track', 'aware', true], ['track', 'smart', false], ['track', 'aware', false],
            ['off', 'random', true], ['track', 'random', true]];
ROWS.forEach(function (row) {
  var mode = row[0], bot = row[1], save = row[2];
  (function () {
    var a = { held: 0, n: 0, win: 0, good: 0, broke: 0, clues: 0, visits: 0, anyVisit: 0, blocked: 0, offer: 0, offerGames: 0, offerHeld: 0, pushes: 0, pulls: 0, door: 0 };
    for (var s = 1; s <= N; s++) {
      var g = run(cfgFor(mode, save), bot, s), S = g.state, o = S.result.outcome, P = S.presence;
      a.n++; if (o === '1') a.win++; if (o === '1' || /^2/.test(o)) a.good++; if (S.pressureMaxed) a.broke++;
      a.clues += S.progressEarned + g.cfg.startProgress;
      var bread = mode === 'off' ? 'kompot' : 'bread', seen = S.discard.indexOf(bread) >= 0 || S.hand.indexOf(bread) >= 0;
      if (seen) a.offerHeld++;
      if (S.stats.cardsPlayed.indexOf(bread) >= 0) a.offerGames++;
      if (P) { a.visits += P.visits; if (P.visits) a.anyVisit++; a.blocked += P.blocked; a.offer += P.offerings; a.pushes += P.comfortPushes; a.pulls += P.searchPulls; a.held += P.barHeldForVisit || 0; }
    }
    var pc = function (x) { return (100 * x / a.n).toFixed(1) + '%'; }, av = function (x) { return (x / a.n).toFixed(2); };
    rows.push([mode, bot, mode === 'off' ? '-' : (save ? 'on' : 'off'), pc(a.win), pc(a.good), pc(a.broke), av(a.clues), mode === 'off' ? '-' : av(a.visits), mode === 'off' ? '-' : pc(a.anyVisit), mode === 'off' ? '-' : av(a.blocked),
      pc(a.offerGames) + ' (' + (a.offerHeld ? (100 * a.offerGames / a.offerHeld).toFixed(0) : 0) + '% of drawn)', mode === 'off' ? '-' : av(a.pushes), mode === 'off' ? '-' : av(a.pulls), mode === 'off' ? '-' : av(a.held)]);
  })();
});
var head = ['presence', 'bot', 'barSavesForVisit', 'win (Outcome 1)', 'good (1/2x)', 'Dread hit 6', 'mean clues', 'visits/run', 'runs with a visit', 'visits blocked/run', 'Kompot/Bread and Salt played', 'Comfort pushes/run', 'Treeline pulls/run', 'Bar held for visit/run'];
out.push('v0.3 The Approach sim · ' + N + ' runs per row · build ' + CONFIG.version + ' · ' + new Date().toISOString());
out.push('(presence OFF row: the card in that slot is Kompot, Dread -1; presence track: Bread and Salt)');
out.push(head.join(' | ')); rows.forEach(function (r) { out.push(r.join(' | ')); });
console.log(out.join('\n'));
require('fs').writeFileSync(__dirname + '/../tests/sim-presence-report.txt', out.join('\n') + '\n');
