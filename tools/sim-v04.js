/* tools/sim-v04.js — v0.4 "Stripped Core" balance sim, driving the REAL engine (game.js) with ports of the
 * three bots in Tomek's gdd/sim/sim_v04.py (naive / casual / smart), same rows as his results table.
 * Run: node tools/sim-v04.js [runs=5000] [seed=11]  → prints a table and writes tests/sim-v04-report.txt
 * Seeds: run i uses engine seed (seed*100000 + i). Python's Mersenne Twister and our mulberry32 can't share a stream,
 * so the comparison is statistical (5000 runs per row: ~±1.4 points at 95% for a 46% rate). */
'use strict';
var CONFIG = require('../config.js'), Engine = require('../game.js');
var N = +(process.argv[2] || 5000), SEED = +(process.argv[3] || 11);
// --pyquirk: reproduce sim_v04.py's smart bot reading a "next event" during Hour 6 (its ev[-1] still has 2 unseen events), so it
// protects against a visit that can't happen. The game shows no next event in Hour 6 ("Dawn comes next"), so the default is off.
var PYQ = process.argv.indexOf('--pyquirk') >= 0;
var ID = { adjacent: 'lookCloser', clue1: 'luckyFind', easier: 'sharpEyes', calm1: 'deepBreath', calm2: 'warmStove', offer: 'bread', bar: 'bar', push2: 'ward', movesearch: 'shortcut', draw2: 'rummage' };
var KEEP = ['offer', 'bar', 'calm2', 'adjacent', 'movesearch', 'clue1'].map(function (k) { return ID[k]; });
function chance(tot, diff, bag) { return bag.filter(function (t) { return t !== 'STAR' && tot + t >= diff; }).length / 6; }

function play(g, bot) {
  var S = g.state, C = g.cfg, P = C.presence, smart = bot === 'smart', adds = bot !== 'naive', base = C.testBase;
  var has = function (e) { var id = ID[e]; return S.hand.indexOf(id) >= 0 ? id : null; };
  var icons = function (i) { return S.hand.filter(function (id) { return g.card(id).icons[0] === i; }).length; };
  var need = function () { return C.clueGoal - S.progress; };
  var hour0 = function () { return S.round - 1; }; // python's 0-based hour
  function stepsFor(evId, hourNum) { // hourNum 1-based
    var ev = C.events.filter(function (e) { return e.id === evId; })[0];
    return (P.stepsPerHour || 0) + (ev && ev.footprint ? 1 : 0) + (hourNum >= P.lateFromNight ? P.lateExtraSteps : 0);
  }
  function threatNext() { var nx = PYQ ? S.events[0] : g.nextEventId(); if (!nx) return false; /* PYQ: python's ev[-1] also "forecasts" a 7th Hour */ return S.presence.pos + stepsFor(nx, S.round + 1) >= 3 && !S.bars; }
  function commitsFor(icon, diff, ex) {
    if (!adds) return [];
    var nd = diff - base, cand = S.hand.filter(function (id) { return id !== ex && g.card(id).icons[0] === icon; });
    cand = cand.filter(function (id) { return KEEP.indexOf(id) < 0; }).concat(cand.filter(function (id) { return KEEP.indexOf(id) >= 0; })); // python: sorted by "in keep", stable
    var out = [], tot = 0;
    for (var i = 0; i < cand.length; i++) { if (tot >= nd + 1) break; if (KEEP.indexOf(cand[i]) >= 0 && tot >= nd) break; out.push(cand[i]); tot++; }
    return out;
  }
  function needOf(z) { return Math.max(0, C.zones[z].investigateDifficulty - S.torch); }
  function search(z, viaCard) {
    var c = commitsFor('I', needOf(z), viaCard); // python plays the card first, then picks the adds from what's left
    if (viaCard) return g.play(viaCard, { zone: z, commits: c });
    return g.investigate({ commits: c });
  }
  function comfort() { return g.steady({ commits: commitsFor('C', C.steadyDifficulty) }); }
  function evSearch(z, extra) {
    var d = C.zones[z].investigateDifficulty - (S.torch ? 1 : 0);
    var tot = base + Math.min(icons('I') - (extra || 0), Math.max(0, d - base + 1));
    return chance(tot, d, C.testBag) * C.zones[z].progress;
  }
  function pickZone() {
    var sI = icons('I') + (S.torch ? 1 : 0), z = 0;
    if (S.pressure <= 3 && sI >= 1) z = 1;
    if (S.pressure <= 1 && sI >= 2) z = 2;
    if (smart) { if (need() <= 0) return 0; if (z === 2 && S.presence.pos + P.treelineSearchSteps >= 2) z = 1; }
    return z;
  }
  function protect() {
    var list = ['offer', 'bar', 'push2'];
    for (var i = 0; i < list.length; i++) { var c = has(list[i]); if (c && !(list[i] === 'bar' && S.bars)) { var r = g.play(c); if (r.ok) return r; } }
    return null;
  }
  function calmCard() { var l = ['calm2', 'calm1', 'offer']; for (var i = 0; i < l.length; i++) { var c = has(l[i]); if (c) return g.play(c); } return null; }
  function actSmart(aLeft) {
    var nd = need(), hl = C.rounds - hour0();
    if (threatNext() && !(nd <= 0 && S.pressure + P.visitDread < C.pressureMax - 1 && hl <= 1)) {
      var r = protect(); if (r) return;
      if (S.pressure + P.visitDread >= 4 && S.presence.pos >= 2) return comfort();
    }
    var line = hl > 2 ? 3 : 4; if (nd <= 0) line = 2;
    if (S.pressure >= line + (aLeft === 2 && nd > 0 ? 1 : 0)) {
      if (calmCard()) return;
      if (S.pov === 2) return g.move(1);
      return comfort();
    }
    if (nd <= 0) {
      if (!S.bars && has('bar')) return g.play(has('bar'));
      if (S.pov === 2) return g.move(1);
      return comfort();
    }
    var c = has('clue1'); if (c) return g.play(c);
    c = has('draw2'); if (c && S.hand.length <= 2) return g.play(c);
    var opts = [[evSearch(S.pov), 'here']];
    var treeOk = S.pressure <= 2 && S.presence.pos + P.treelineSearchSteps < 3 && hl > 1;
    [S.pov - 1, S.pov + 1].forEach(function (z) {
      if (z >= 0 && z <= 2 && (z < 2 || treeOk)) {
        if (has('adjacent') && z > S.pov) opts.push([evSearch(z), 'adj', z]);
        if (has('movesearch') && z > S.pov) opts.push([evSearch(z), 'ms', z]);
        if (aLeft === 2 && z > S.pov) opts.push([evSearch(z) / 2 * 1.6, 'mv', z]);
      }
    });
    if (S.pov === 2 && !treeOk) opts.push([evSearch(1) / 2 * 1.6 + 0.5, 'mv', 1]);
    var best = opts[0]; opts.forEach(function (o) { if (o[0] > best[0]) best = o; }); // python max(): first of equals
    if (best[1] === 'adj') return search(best[2], has('adjacent'));
    if (best[1] === 'ms') return search(best[2], has('movesearch'));
    if (best[1] === 'mv') return g.move(best[2]);
    c = has('easier');
    if (c && S.pov > 0 && !S.torch && evSearch(S.pov) < C.zones[S.pov].progress * 0.6) return g.play(c);
    return search(S.pov);
  }
  function act(aLeft) {
    if (smart) return actSmart(aLeft);
    var nd = need();
    var danger = S.presence && S.presence.pos >= 2 && !S.bars && bot !== 'naive';
    if (danger) { if (protect()) return; }
    if (S.pressure >= 4 || (S.pressure >= 3 && aLeft === 1)) {
      if (calmCard()) return;
      if (S.pov === 2) return g.move(1);
      return comfort();
    }
    var c = has('clue1'); if (c) return g.play(c);
    c = has('draw2'); if (c && S.hand.length <= 3) return g.play(c);
    var z = pickZone();
    c = has('adjacent'); if (c && S.pov < 2 && z > S.pov) return search(S.pov + 1, c);
    c = has('movesearch'); if (c && z > S.pov) return search(S.pov + 1, c);
    if (S.pov > z && !(S.pov === 1 && S.pressure <= 3)) return g.move(S.pov - 1);
    if (S.pov < z && aLeft === 2) return g.move(S.pov + 1);
    c = has('easier'); if (c && S.pov > 0 && !S.torch) return g.play(c);
    return search(S.pov);
  }
  var guard = 0;
  while (S.phase === 'actions' || S.phase === 'discard') {
    if (++guard > 400) throw new Error('stuck');
    if (S.phase === 'discard') { g.discardDown(S.hand[S.hand.length - 1]); continue; } // python: hand.pop()
    if (S.actionsLeft <= 0) { g.endRound(); continue; }
    var a = S.actionsLeft, r = act(a);
    if (S.phase === 'actions' && S.actionsLeft === a) { if (r && !r.ok) throw new Error('bot made an illegal move: ' + r.error); g.endRound(); }
  }
  return g;
}
function cfgWith(o) {
  var v = Object.assign({}, CONFIG.v04, { presence: Object.assign({}, CONFIG.v04.presence, o.presence || {}) });
  if (o.N) v.clueGoal = o.N;
  if (o.events) v.events = o.events;
  return Object.assign({}, CONFIG, { v04: v });
}
function stats(cfg, bot) {
  var a = { win: 0, d6: 0, short: 0, clues: 0, visits: 0, v1: 0, blocked: 0 };
  for (var i = 1; i <= N; i++) {
    var g = play(Engine.createGame(cfg, { seed: SEED * 100000 + i }), bot), S = g.state, o = S.result.outcome;
    if (o === 'win') a.win++; else if (o === 'lose_dread') a.d6++; else a.short++;
    a.clues += S.progress; a.visits += S.presence.visits; if (S.presence.visits) a.v1++; a.blocked += S.presence.blocked;
  }
  var r = function (x) { return +(x / N).toFixed(3); };
  return { win: r(a.win), dread6: r(a.d6), short: r(a.short), clues: +(a.clues / N).toFixed(2), visits: +(a.visits / N).toFixed(2), visit1: +(a.v1 / N).toFixed(2), blocked: +(a.blocked / N).toFixed(2) };
}
var midEvents = CONFIG.v04.events.map(function (e) { return e.id === 'gate' ? Object.assign({}, e, { pressure: 0 }) : e; }); // v0.3-style Gate: +1 only outside
var ROWS = [
  ['FINAL v0.4 (N=5, steps every hour, +1 on hours 5-6, visit Dread +1)', {}],
  ['  same, N=4', { N: 4 }], ['  same, N=6', { N: 6 }],
  ['  same, visit Dread +2', { presence: { visitDread: 2 } }],
  ['  same, no late escalation', { presence: { lateExtraSteps: 0 } }],
  ['  same, Bar not saved for the visit', { presence: { barSavesForVisit: false } }],
  ['Fallback: footprints on 7/8, start on Yard, N=5', { presence: { footprints: true } }],
  ['Reference: v0.3-style footprints 4/8, start Treeline, N=5', { presence: { footprints: true, footprintEvents: ['footsteps', 'gate', 'silence', 'handle'] }, events: midEvents, ref: true }]
];
var out = ['v0.4 Stripped Core sim on the real engine (tools/sim-v04.js), ' + N + ' runs per row, seed ' + SEED + (PYQ ? ', --pyquirk (Hour 6 forecast like sim_v04.py)' : '') + ', build ' + CONFIG.version];
ROWS.forEach(function (row) {
  var cfg = cfgWith(row[1]);
  if (row[1].ref) cfg.v04.fallbackPresence = { footprints: true, start: 0, stepsPerHour: 0 };
  out.push('== ' + row[0]);
  ['naive', 'casual', 'smart'].forEach(function (b) { out.push('   ' + b + ' ' + JSON.stringify(stats(cfg, b))); });
});
console.log(out.join('\n'));
require('fs').writeFileSync(__dirname + '/../tests/sim-v04-report' + (PYQ ? '-pyquirk' : '') + '.txt', out.join('\n') + '\n');
