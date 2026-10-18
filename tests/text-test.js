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
var voices = UT.onboarding.steps.map(function (s) { return s.voice; }).filter(Boolean);
['{C2}: Six hours till light. We can do six hours.', '{POV}: Something keeps circling this house. I want to know what.', "{C1}: It's back. Under the window.",
 '{POV}: The footprints stop at the door. Right at the door.', "{C2}: Drink. The {HOST} said don't waste it, and I'm scared of her."].forEach(function (v) { assert(voices.indexOf(v) >= 0, 'coach voice: ' + v); });
assert.strictEqual(UT.onboarding.steps.length, 10, '10 coach steps (spec 9.3)');
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
