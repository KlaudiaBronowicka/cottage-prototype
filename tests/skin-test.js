/* Name-substitution grammar test. Run: node tests/skin-test.js */
'use strict';
var assert = require('assert');
var Skin = require('../skin.js');
var TXT = require('../data/vn-text.js');
var CONFIG = require('../config.js');
var S = TXT.SKINS;

// 1) Specific cases
var A = S.A, B = S.B, N = S.neutral;
assert.strictEqual(Skin.applySkin('The {HOST} explains', A), 'Wanda explains');
assert.strictEqual(Skin.applySkin("on the {POV}'s lap", A), "on Hania's lap");
assert.strictEqual(Skin.applySkin("The {POV}'s own voice", A), "Hania's own voice");
assert.strictEqual(Skin.applySkin('Then, the {HOST} said', A), 'Then, Wanda said');
assert.strictEqual(Skin.applySkin('The {OBJECT}: this cottage', A), "Irena's address book: this cottage");
assert.strictEqual(Skin.applySkin('The {HOST} explains', B), 'The landlady explains');
assert.strictEqual(Skin.applySkin('ask the {HOST}', B), 'ask the landlady');
assert.strictEqual(Skin.applySkin('{HOST} waits', B), 'the landlady waits');
assert.strictEqual(Skin.speaker('HOST', B), 'The landlady');
assert.strictEqual(Skin.speaker('HOST', A), 'Wanda');
assert.strictEqual(Skin.applySkin('Other {THING} and theatre {C1}', A), 'Other {THING} and theatre Ola', 'unknown slots untouched; "theatre" is not an article');
// default CAPS text is unchanged
assert.strictEqual(Skin.applySkin('The {HOST} explains', N), 'The HOST explains');
assert.strictEqual(Skin.applySkin("on the {POV}'s lap", N), "on the POV's lap");
assert.strictEqual(Skin.applySkin("{C1}'s phone", N), "COMPANION 1's phone");
assert.strictEqual(Skin.applySkin('looking at {OBJECT}', N), 'looking at the OBJECT');

// 2) Sweep every string in the VN text and the deck through every skin
var strings = [];
(function walk(o) {
  if (typeof o === 'string') strings.push(o);
  else if (Array.isArray(o)) o.forEach(walk);
  else if (o && typeof o === 'object') Object.keys(o).forEach(function (k) { if (k !== 'SKINS') walk(o[k]); });
})(TXT);
CONFIG.deck.forEach(function (c) { strings.push(c.name, c.text, c.flavour); });
var naive = function (s, sk) { return s.replace(/\{(\w+)\}/g, function (m, k) { return typeof sk[k] === 'string' ? sk[k] : m; }); };
var checked = 0;
strings.forEach(function (s) {
  Object.keys(S).forEach(function (k) {
    var out = Skin.applySkin(s, S[k]);
    checked++;
    assert(!/\{(POV|C1|C2|HOST|BEING|OBJECT)\}/.test(out), 'slot left unreplaced: ' + out);
    assert(!/\bthe the\b/i.test(out), 'double article (' + k + '): ' + out);
    (S[k].proper || []).forEach(function (slot) {
      var name = S[k][slot].split(' ')[0];
      assert(!new RegExp('\\b[Tt]he ' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(out), 'article before proper name (' + k + '): ' + out);
    });
    // default CAPS text: identical to plain substitution, except where that would double the article
    if (k === 'neutral' && !/\bthe the\b/i.test(naive(s, S[k]))) assert.strictEqual(out, naive(s, S[k]), 'neutral text changed: ' + s);
  });
});
console.log('Skin grammar: ' + checked + ' string×skin renders checked.');
console.log('SKIN TEST PASSED');
