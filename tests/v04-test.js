/* v0.4 "Stripped Core" engine + text tests (CONFIG.v04 on, the default). Run: node tests/v04-test.js */
'use strict';
var assert = require('assert');
var CONFIG = require('../config.js'), Engine = require('../game.js'), Stats = require('../stats.js');
var UT = require('../data/ui-text.js');
var n = 0; function t(name, fn) { fn(); n++; }
function cfgWith(pr, extra) {
  var v = Object.assign({}, CONFIG.v04, extra || {}, { presence: Object.assign({}, CONFIG.v04.presence, pr || {}) });
  return Object.assign({}, CONFIG, { v04: v });
}
function game(o) { o = o || {}; var g = Engine.createGame(o.cfg || CONFIG, { seed: o.seed || 3, tutorial: o.tutorial }); return g; }
function setEvents(g, ids) { var S = g.state; ids.slice().reverse().forEach(function (id) { var i = S.events.indexOf(id); if (i >= 0) S.events.splice(i, 1); S.events.unshift(id); }); }
function give(g, id) { var S = g.state; [S.deck, S.discard, S.hand].forEach(function (a) { var i = a.indexOf(id); if (i >= 0) a.splice(i, 1); }); S.hand.push(id); }
function endHour(g) { var S = g.state; var r = g.endRound(); while (S.phase === 'discard') g.discardDown(S.hand[S.hand.length - 1]); return r; }

t('config: v0.4 is on by default, 10 cards, 8 events, goal 5 by Hour 6, Dread max 6', function () {
  var g = game(), c = g.cfg;
  assert.ok(c.v04on); assert.strictEqual(c.deck.length, 10); assert.strictEqual(c.events.length, 8);
  assert.strictEqual(c.clueGoal, 5); assert.strictEqual(c.rounds, 6); assert.strictEqual(c.pressureMax, 6);
  assert.strictEqual(c.threads.length, 0); assert.ok(c.noQuestions && c.noCompanions && c.noStory);
  assert.deepStrictEqual(c.deck.map(function (x) { return x.id; }).sort(), ['bar', 'bread', 'deepBreath', 'lookCloser', 'luckyFind', 'rummage', 'sharpEyes', 'shortcut', 'ward', 'warmStove']);
  assert.strictEqual(g.state.progress, 0); assert.strictEqual(g.state.presence.pos, 1, 'starts on the Treeline, 1 step at Hour 1');
});
t('every v0.4 card / event has text (string table)', function () {
  CONFIG.v04.deck.forEach(function (c) { assert.ok(UT.v04.cards[c.id] && UT.v04.cards[c.id].name, 'card text ' + c.id); });
  CONFIG.v04.events.forEach(function (e) { assert.ok((UT.v04.overrides.events || {})[e.id] || UT.events[e.id], 'event name ' + e.id); assert.ok((UT.v04.overrides.eventEffects || {})[e.id] || UT.eventEffects[e.id], 'event effect ' + e.id); });
});
t('creature: 1 step per Hour, +1 on Hours 5-6; footprints off', function () {
  // direct: presence steps by Hour from a fresh game, Bar every Hour so no visits disturb the walk
  var cfg = cfgWith({}, {}); var g2 = Engine.createGame(cfg, { seed: 8 }), S2 = g2.state, seen = [];
  for (var hr = 1; hr < 6 && S2.phase === 'actions'; hr++) { var before = S2.presence.pos; S2.presence.pos = 0; S2.bars = 0; endHour(g2); if (S2.phase !== 'actions') break; seen.push(S2.presence.pos); }
  // Hours 2..5 start: steps 1,1,1,2 (+ Gate's extra if outside, Shortcut/Search pulls not used)
  seen.forEach(function (p, k) { var hour = k + 2, ev = S2.eventsSeen[k + 1]; var exp = hour >= 5 ? 2 : 1; /* you stay in the House, so the Gate adds nothing */ assert.ok(p === Math.min(3, exp) || (p === 0 && exp >= 3), 'Hour ' + hour + ' (' + ev + ') pos ' + p + ' expected ' + exp); });
  assert.strictEqual(g2.cfg.events.filter(function (e) { return e.footprint; }).length, 0, 'no footprint events in v0.4');
});
t('visit: Dread +1, creature back to the Treeline; a Bar stops it and is used up', function () {
  var g = game({ seed: 5 }), S = g.state;
  setEvents(g, ['draught']); S.presence.pos = 2; S.bars = 0; var d0 = S.pressure;
  endHour(g); // Hour 2 start: 1 step → Door → visit
  assert.strictEqual(S.presence.visits, 1); assert.ok(S.pressure >= d0 + 1 + 1, 'visit +1 and draught +1'); assert.strictEqual(S.presence.pos, CONFIG.v04.presence.visitReturnTo);
  var g2 = game({ seed: 5 }), S2 = g2.state; setEvents(g2, ['draught']); S2.presence.pos = 2; S2.bars = 1; var d1 = S2.pressure;
  endHour(g2);
  assert.strictEqual(S2.presence.visits, 0); assert.strictEqual(S2.presence.blocked, 1); assert.strictEqual(S2.bars, 0); assert.strictEqual(S2.presence.pos, CONFIG.v04.presence.barBlockReturnTo);
});
t('cards: Lucky Find +1 clue, Deep Breath / Warm Stove Dread, Sharp Eyes -1 need, Rummage draws 2, Bar max 1', function () {
  var g = game({ seed: 6 }), S = g.state; S.pressure = 3;
  give(g, 'luckyFind'); assert.ok(g.play('luckyFind').ok); assert.strictEqual(S.progress, 1);
  give(g, 'deepBreath'); assert.ok(g.play('deepBreath').ok); assert.strictEqual(S.pressure, 2);
  S.actionsLeft = 3; give(g, 'warmStove'); assert.ok(g.play('warmStove').ok); assert.strictEqual(S.pressure, 0);
  give(g, 'sharpEyes'); assert.ok(g.play('sharpEyes').ok); assert.strictEqual(S.torch, 1);
  S.actionsLeft = 3; var h = S.hand.length; give(g, 'rummage'); var dl = S.deck.length; assert.ok(g.play('rummage').ok); assert.strictEqual(S.hand.length, h + Math.min(2, dl));
  give(g, 'bar'); assert.ok(g.play('bar').ok); assert.strictEqual(S.bars, 1);
  S.actionsLeft = 3; S.hand.push('bar'); assert.strictEqual(g.canPlay('bar').ok, false, 'max 1 Bar');
});
t('cards: Ward pushes back 2 (needs a target), Bread and Salt Dread -1 + back to the Treeline', function () {
  var g = game({ seed: 7 }), S = g.state;
  give(g, 'ward'); S.presence.pos = 0; assert.strictEqual(g.canPlay('ward').ok, !CONFIG.v04.wardNeedsTarget);
  S.presence.pos = 2; assert.ok(g.play('ward').ok); assert.strictEqual(S.presence.pos, 0);
  S.pressure = 2; S.presence.pos = 2; give(g, 'bread'); assert.ok(g.play('bread').ok); assert.strictEqual(S.pressure, 1); assert.strictEqual(S.presence.pos, 0);
});
t('cards: Look Closer searches the area next to you; Shortcut moves 1 and searches', function () {
  var g = game({ seed: 9 }), S = g.state; S.actionsLeft = 3;
  give(g, 'lookCloser'); var r = g.play('lookCloser', { zone: 1, roll: 5 }); assert.ok(r.ok, r.error); assert.strictEqual(S.pov, 0); assert.ok(r.test);
  give(g, 'lookCloser'); assert.strictEqual(g.play('lookCloser', { zone: 2 }).ok, false, 'not adjacent');
  give(g, 'shortcut'); var r2 = g.play('shortcut', { zone: 1, roll: 1 }); assert.ok(r2.ok, r2.error); assert.strictEqual(S.pov, 1);
});
t('events: Gate Dread +1 more if you are outside, Lights discard 1', function () {
  var g = game({ seed: 10 }), S = g.state; setEvents(g, ['gate']); S.pov = 1; S.presence.pos = 0; S.pressure = 0; endHour(g);
  assert.strictEqual(S.pressure, 2, 'gate outside: +1 +1');
  var g2 = game({ seed: 10 }), S2 = g2.state; setEvents(g2, ['gate']); S2.pov = 0; S2.presence.pos = 0; S2.pressure = 0; endHour(g2);
  assert.strictEqual(S2.pressure, 1, 'gate inside: +1');
  var g3 = game({ seed: 12 }), S3 = g3.state; setEvents(g3, ['lights']); var h3 = S3.hand.length; endHour(g3);
  assert.ok(S3.discard.length >= 1, 'lights discards');
});
t('outcomes: win at dawn with 5 clues; lose_short; lose_dread', function () {
  var g = game({ seed: 13 }), S = g.state; S.progress = 5;
  for (var k = 0; k < 8 && S.phase !== 'done'; k++) { S.pressure = 0; S.presence.pos = 0; endHour(g); }
  assert.strictEqual(S.phase, 'done'); assert.strictEqual(S.result.outcome, 'win'); assert.strictEqual(S.result.hoursPlayed, 6);
  var g2 = game({ seed: 13 }), S2 = g2.state; S2.progress = 4;
  for (k = 0; k < 8 && S2.phase !== 'done'; k++) { S2.pressure = 0; S2.presence.pos = 0; endHour(g2); }
  assert.strictEqual(S2.result.outcome, 'lose_short');
  var g3 = game({ seed: 13 }), S3 = g3.state; S3.progress = 5; S3.pressure = 5; give(g3, 'deepBreath');
  setEvents(g3, ['draught']); endHour(g3);
  assert.strictEqual(S3.phase, 'done'); assert.strictEqual(S3.result.outcome, 'lose_dread');
});
t('tutorial: fixed events + hand, safe guided rolls (no bad omen) until the handoff', function () {
  var g = game({ seed: 7, tutorial: true }), S = g.state, tc = CONFIG.v04.tutorial;
  assert.deepStrictEqual(S.events.slice(0, 2), tc.events.slice(1, 3)); assert.strictEqual(S.eventsSeen[0], tc.events[0]);
  tc.hand.forEach(function (id) { assert.ok(S.hand.indexOf(id) >= 0, 'tutorial hand has ' + id); });
  var bad = 0; for (var i = 0; i < 40; i++) { S.actionsLeft = 3; var r = g.investigate({}); if (r.test && (r.test.star || r.test.face === 'STAR')) bad++; S.pressure = 0; }
  assert.strictEqual(bad, 0, 'no bad omen while guided'); g.endTutorial(); assert.strictEqual(S.tutorialGuided, false);
});
t('fallback: footprints:true + footprint events, no base step', function () {
  var cfg = cfgWith(Object.assign({}, CONFIG.v04.fallbackPresence)); var g = Engine.createGame(cfg, { seed: 2 });
  assert.ok(g.cfg.events.some(function (e) { return e.footprint; })); assert.strictEqual(g.cfg.presence.stepsPerHour, 0); assert.strictEqual(g.cfg.presence.start, 1); assert.ok(g.state.presence.pos >= 1 && g.state.presence.pos <= 2, 'start 1 (+1 if Hour 1 left footprints)');
});
t('v0.3.2 stays reachable: CONFIG.v04.enabled = false gives the v0.3 deck, Questions and companions', function () {
  var c = Object.assign({}, CONFIG, { v04: Object.assign({}, CONFIG.v04, { enabled: false }) }); var g = Engine.createGame(c, { seed: 1 });
  assert.ok(!g.cfg.v04on); assert.ok(g.cfg.threads.length > 0); assert.ok(g.cfg.deck.some(function (x) { return x.id === 'kompot' || x.id === 'stove'; }));
});
t('stats: v0.4 record and CSV columns', function () {
  var g = game({ seed: 13 }), S = g.state; S.progress = 5;
  for (var k = 0; k < 8 && S.phase !== 'done'; k++) { S.pressure = 0; S.presence.pos = 0; endHour(g); }
  var rec = Stats.buildRecord(g, { tutorial: null }); assert.strictEqual(rec.result, 'win'); assert.strictEqual(rec.clues, 5);
  var csv = Stats.toCSV([rec], Stats.COLUMNS_V04); assert.ok(csv.split('\n')[0].indexOf('result') >= 0); assert.ok(csv.split('\n')[1].indexOf('win') >= 0);
});
t('text: Zosia intro verbatim (neutral, A, B) + Goal line from config', function () {
  var I = UT.v04.intro;
  assert.strictEqual(I.title, 'The Cottage');
  assert.strictEqual(I.creatureLine.neutral, 'Something is walking out by the trees. You can\'t fight it, but you can learn what it wants and keep it from the door.');
  assert.strictEqual(I.creatureLine.A, 'Something small is walking the edge of the house. You can\'t fight it, but you can learn what it wants and keep it from the door.');
  assert.strictEqual(I.creatureLine.B, 'Something is walking barefoot around the cottage. You can\'t fight it, but you can learn what it wants and keep it from the door.');
  assert.ok(I.lines.indexOf('Your car died at the edge of the forest, and the only shelter is an empty cottage.') >= 0);
  assert.ok(I.lines.indexOf('Your friends have gone for help. They won\'t be back until morning.') >= 0);
  assert.ok(/\{goal\}/.test(I.goal) && /\{max\}/.test(I.goal) && /\{total\}/.test(I.goal), 'goal line numbers come from config');
  assert.strictEqual(UT.v04.onboarding.steps.length, 10);
});
t('v0.4.2 guided rolls: generic magnifier gate + real (safe-face) odds', function () {
  var Odds = require('../odds.js');
  var st = UT.v04.onboarding.steps, byId = {}; st.forEach(function (s) { byId[s.id] = s; });
  assert.strictEqual(byId.search.await, 'roll:icon', 'step 4 accepts any magnifier card (coach text says "a card with a magnifier")');
  assert.strictEqual(byId.search2.await, 'roll:icon', 'step 8 accepts any magnifier card (v0.4.1 insisted on Shortcut: Klaudia soft-lock)');
  st.forEach(function (s) { assert.ok(!/^roll:(?!icon$)/.test(s.await || ''), 'no step gates on one card id: ' + s.id); });
  assert.strictEqual(UT.v04.rollNeedsIcon, 'Add a {stat} card to the {t.TERM_ROLL} first, then roll.');
  // total 3 vs need 3: 4 of 6 faces in a normal roll (67%), 4 of 4 safe faces in a guided roll (100%)
  assert.strictEqual(Odds.pct(Odds.testOdds(CONFIG, 3, 3).p), 67);
  var g = Odds.testOdds(CONFIG, 3, 3, { guided: true });
  assert.strictEqual(Odds.pct(g.p), 100); assert.strictEqual(g.pStar, 0); assert.strictEqual(g.faces.filter(function (f) { return f.off; }).length, 2);
  assert.strictEqual(Odds.pct(Odds.testOdds(CONFIG, 2, 3, { guided: true }).p), 25, 'no card added on the Yard: only the +1 face wins');
  // the engine's guided roll matches: every safe face equally likely, never STAR / -1
  var game = Engine.createGame(CONFIG, { seed: 3, tutorial: true }), S = game.state, seen = {};
  for (var i = 0; i < 4000; i++) { S.actionsLeft = 2; S.phase = 'actions'; S.pov = 1; S.torch = 0; S.pressure = 0; S.hand = ['luckyFind']; var r = game.investigate({ commits: ['luckyFind'] }).test; seen[r.roll] = (seen[r.roll] || 0) + 1; assert.ok(r.success, 'guided 3 vs 3 always succeeds'); }
  assert.ok(!seen[4] && !seen[6], 'no -1 / omen face in a guided roll');
  [1, 2, 3, 5].forEach(function (f) { assert.ok(Math.abs(seen[f] / 4000 - 0.25) < 0.04, 'safe face ' + f + ' ~25%: ' + seen[f]); });
  assert.strictEqual(CONFIG.v04.tutorial.coachFont.stagePx, 21); assert.strictEqual(CONFIG.v04.tutorial.coachFont.lineHeight, 1.25);
});
console.log('v04-test: ' + n + ' checks passed');
