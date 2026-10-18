/* String-table checks: every template in data/ui-text.js resolves (terms exist, no stray slots) in every name skin,
 * renaming a term is a one-line change, and the Narrative Writer's tutorial copy is in place verbatim.
 * Run: node tests/text-test.js */
'use strict';
var assert = require('assert');
var UT = require('../data/ui-text.js'), TXT = require('../data/vn-text.js'), Skin = require('../skin.js'), CONFIG = require('../config.js');
function fmt(s, terms, skin) { // same grammar as ui.js fmt()
  return Skin.applySkin(String(s)
    .replace(/\{#(\w+):(\w+):(\w+)\}/g, function (m, n, a, b) { assert(terms[a] && terms[b], 'plural terms exist: ' + m); return terms[b]; })
    .replace(/\{([tT])\.(\w+)\}/g, function (m, c, k) { assert(terms[k] != null, 'term exists: ' + k); return terms[k]; })
    .replace(/\{([a-z]\w*)\}/g, 'X'), skin);
}
var count = 0;
function walk(o, path, fn) { if (typeof o === 'string') fn(o, path); else if (o && typeof o === 'object') Object.keys(o).forEach(function (k) { walk(o[k], path + '.' + k, fn); }); }
Object.keys(TXT.SKINS).forEach(function (sk) {
  walk(UT, 'UI_TEXT', function (s, p) {
    if (/^UI_TEXT\.terms\./.test(p)) return;
    var out = fmt(s, UT.terms, TXT.SKINS[sk]); count++;
    assert(!/\{[^}]*\}/.test(out), 'unresolved placeholder in ' + p + ' (' + sk + '): ' + out);
    assert(!/\bthe the\b/i.test(out), 'double article ' + p);
  });
});
// one-line rename
var t2 = Object.assign({}, UT.terms, { TERM_QUESTIONS: 'Secrets' });
assert(/Secrets/.test(fmt(UT.hud.questionsTitle, t2, TXT.SKINS.neutral)), 'renaming TERM_QUESTIONS flows through');
// every card in the deck (incl. Chair) has player-facing text + a category the art knows
CONFIG.deck.concat([CONFIG.chairCard]).forEach(function (c) { var u = UT.cards[c.id]; assert(u && u.name && u.text && u.flavour && ['clue', 'calm', 'protect', 'utility'].indexOf(u.cat) >= 0, 'card text ' + c.id); });
CONFIG.events.forEach(function (e) { assert(UT.events[e.id] && UT.eventEffects[e.id], 'event text ' + e.id); });
// Zosia's copy, verbatim (slot versions)
var beat4 = JSON.stringify(TXT.intro);
['Right. Three questions, and then nobody opens that door. One: what is circling the house?', '[gently, looking right at her] Two: what is {C1} hiding?',
 '[turning her phone face down] Pass.', "Three: why are we here, in this exact cottage? [The {POV}'s hand goes to {OBJECT}.]",
 "We don't need every answer tonight. We just need to make it to dawn."].forEach(function (l) { assert(beat4.indexOf(JSON.stringify(l).slice(1, -1)) >= 0, 'Beat 4 line: ' + l); });
var voices = UT.onboarding.steps.map(function (s) { return s.voice === '@tour.presence' ? UT.tour.presence : s.voice; }).filter(Boolean);
['{C2}: Six hours till light. We can do six hours.', '{POV}: Something keeps circling this house. I want to know what.', "{C1}: It's back. Under the window.",
 '{POV}: The footprints stop at the door. Right at the door.', "{C2}: Drink. The {HOST} said don't waste it, and I'm scared of her."].forEach(function (v) { assert(voices.indexOf(v) >= 0, 'coach voice: ' + v); });
assert.strictEqual(UT.onboarding.steps.length, 11, '11 coach steps (spec 9.3 + the Presence step, v0.3.1)');
assert.strictEqual(UT.onboarding.steps.filter(function (s) { return !s.needsPresence; }).length, 10, '10 coach steps with the Presence off');
var ids = UT.onboarding.steps.map(function (s) { return s.id; });
assert.strictEqual(ids.indexOf('presence'), ids.indexOf('event') + 1, 'Presence step right after the Dread step');
assert.deepStrictEqual(UT.onboarding.steps[ids.indexOf('presence')].target, ['approach', 'nextEvent'], 'Presence step highlights the Approach strip + next event');
assert(voices.indexOf("{C2}: It's at the trees now. Every hour it comes a little closer. We don't fight it. We turn it away.") >= 0, 'Presence step voice (tour.presence)');
// voices stay on their topics
var vOf = function (id) { return UT.onboarding.steps[ids.indexOf(id)].voice; };
assert.strictEqual(vOf('zones'), "{C2}: The answers are out by the trees. So is whatever's walking."); assert.strictEqual(vOf('search'), "{POV}: Start here, where it's warm. Kitchen first.");
assert.strictEqual(vOf('add'), "{C2}: Use what we found today. That's what it's for."); assert.strictEqual(vOf('comfort'), '{POV}: If she goes outside, I talk her home. Gently.');
assert.strictEqual(vOf('end'), '{C2}: One hour down. Five to go.');
assert.strictEqual(UT.cards.chair.flavour, 'Wedge it tight. If it holds till morning, it was a good chair.');
assert.deepStrictEqual(UT.questions, { T1: 'What is circling the house?', T2: 'What is {C1} hiding?', T3: 'Why are we here?' });
assert.strictEqual(CONFIG.recapTagLines, false, 'recap tag lines default OFF');
console.log('Resolved ' + count + ' string-table templates across ' + Object.keys(TXT.SKINS).length + ' name sets.');
console.log('ALL TEXT CHECKS PASSED');

// art manifest: nothing retired is referenced, cast comes from manifest.cast
(function () {
  var fs = require('fs'), src = fs.readFileSync(__dirname + '/../assets/manifest.js', 'utf8'), AM = require('../assets/manifest.js');
  if (/thread|_retired/.test(src)) throw new Error('assets/manifest.js references a retired asset');
  ['POV', 'C1', 'C2'].forEach(function (s) { if (!AM.cast || !AM.cast.slots[s]) throw new Error('cast slot missing from manifest: ' + s); });
  console.log('ART MANIFEST CHECK PASSED (no retired assets; cast from manifest.cast)');
})();

// v0.3 The Approach copy: both directions complete, verbatim against Zosia's file, door lines match config
(function () {
  var fs = require('fs'), UT2 = require('../data/ui-text.js'), CFG = require('../config.js');
  var D = UT2.presence.dirs, keys = function (o) { return Object.keys(o).sort().join(','); };
  if (keys(D.A) !== keys(D.B)) throw new Error('presence directions A/B have different keys');
  ['A', 'B'].forEach(function (d) {
    if (D[d].door.length !== CFG.presence.doorLineCount) throw new Error('door lines ' + d + ' != doorLineCount');
    CFG.presence.footprintEvents.forEach(function (e) { if (!D[d].tease[e]) throw new Error('missing tease ' + d + ' ' + e); });
  });
  var md = fs.readFileSync(__dirname + '/../docs/copy/v03-approach-copy-zosia.md', 'utf8');
  var unslot = function (s) { return s.replace(/\{C1\}/g, 'COMPANION 1').replace(/\{C2\}/g, 'COMPANION 2').replace(/\{POV\}/g, 'POV').replace(/\{HOST\}/g, 'HOST'); };
  var n = 0;
  ['A', 'B'].forEach(function (d) {
    var X = D[d], all = X.door.concat( [X.c1, X.turnAway.comfort, X.turnAway.offering, X.turnAway.bar, X.late, X.search, X.offeringAction]).concat(Object.keys(X.tease).map(function (k) { return X.tease[k]; }));
    all.forEach(function (line) {
      var l = unslot(line).replace(/^(COMPANION [12]|POV): /, '');
      if (md.indexOf(l) < 0) throw new Error('not verbatim in Zosia copy (' + d + '): ' + l);
      n++;
    });
  });
  // v0.3.1: tour step 8 lines (Bread and Salt by direction / neutral), How to play teases, tour.presence, verbatim
  var play = UT2.onboarding.steps.filter(function (s) { return s.id === 'play'; })[0];
  [[play.voiceBread.A, "{C2}: Bread and salt, by the stove. The {HOST} says that's how you say please here."],
   [play.voiceBread.B, '{POV}: [whispering] Bread and salt in the morning. I promise. [beat] I mean it.'],
   [play.voiceBread.neutral, '{C2}: Bread and salt. Old manners, but they still work.'],
   [play.voice, "{C2}: Drink. The {HOST} said don't waste it, and I'm scared of her."],
   [D.A.howTease, 'Something small walks the edge of the house at night.'],
   [D.B.howTease, 'Something walks barefoot around the cottage at night, looking for a way in.'],
   [UT2.tour.presence, "{C2}: It's at the trees now. Every hour it comes a little closer. We don't fight it. We turn it away."]
  ].forEach(function (p) { if (p[0] !== p[1]) throw new Error('v0.3.1 copy not verbatim: ' + p[0]); });
  // Bread and Salt FINAL text (Klaudia, v0.3.1): shown exactly
  if (UT2.cards.bread.text !== '{T.TERM_DREAD} −1 and {t.TERM_PRESENCE} goes back to the {t.TRACK_APPROACH_1}.') throw new Error('Bread and Salt effect text: expected the templated text (v0.3.2)');
  if (D.A.offeringAction !== 'Leave bread and salt by the stove' || D.B.offeringAction !== 'Promise it bread in the morning') throw new Error('Bread and Salt flavour A/B not final');
  // 'WHAT IT IS' writer notes (Questions spoiler) must not be in any player-facing source
  var whats = md.split('\n').filter(function (l) { return /^WHAT IT IS:/.test(l); }).map(function (l) { return l.replace(/^WHAT IT IS:\s*/, ''); })
    .reduce(function (a, l) { return a.concat(l.split(' / ')); }, []).map(function (l) { return unslot(l); });
  if (whats.length !== 4) throw new Error('expected 4 WHAT IT IS sentences in the copy doc, found ' + whats.length);
  var shipped = ['data/ui-text.js', 'data/vn-text.js', 'ui.js', 'index.html', 'config.js'].map(function (f) { return unslot(fs.readFileSync(__dirname + '/../' + f, 'utf8')).replace(/\\'/g, "'"); }).join('\n');
  whats.forEach(function (w) { [w, w.slice(0, 60), w.slice(-60)].forEach(function (frag) { if (shipped.indexOf(frag) >= 0) throw new Error('WHAT IT IS text is in a player-facing file: ' + frag); }); });
  if (/what:\s*\[/.test(fs.readFileSync(__dirname + '/../data/ui-text.js', 'utf8'))) throw new Error('presence.dirs.*.what still exists');
  console.log('WHAT IT IS CHECK PASSED (4 writer-note sentences found nowhere in the shipped text)');
  var steps = UT2.onboarding.steps.filter(function (s) { return s.voice; }).length;
  if (steps !== 11) throw new Error('all 11 tour steps should have Zosia voice lines, found ' + steps);
  console.log('PRESENCE COPY CHECK PASSED (' + n + ' lines verbatim, A and B complete; 11/11 tour voice lines)');
})();
