/* =====================================================================
 * skin.js — name-slot substitution for VN text ({POV}, {HOST}, ...).
 * Handles the article in front of a slot, so reskinned text stays grammatical:
 *   proper name  (listed in the skin's `proper`):  "the {HOST}" → "Wanda", "The {POV}'s" → "Hania's"
 *   own article  (value starts with "the "):        "The {HOST}" → "The landlady", "the {BEING}" → "the domowik"
 *   plain noun   (anything else, e.g. default CAPS): left exactly as written → "the HOST", "The POV's"
 * Runs in browser and node.
 * ===================================================================== */
(function (root) {
  'use strict';
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function applySkin(str, skin) {
    skin = skin || {};
    var proper = skin.proper || [];
    return String(str == null ? '' : str).replace(/\b(the|The) \{([A-Z0-9]+)\}|\{([A-Z0-9]+)\}/g, function (m, art, k1, k2) {
      var key = k1 || k2, val = skin[key];
      if (typeof val !== 'string') return m;            // unknown slot: leave untouched
      var isProper = proper.indexOf(key) >= 0, ownArticle = /^the /i.test(val);
      if (!art) return val;                              // bare {SLOT}
      if (isProper) return val;                          // drop "the"/"The" before a proper name (names are already capitalised)
      if (ownArticle) return art === 'The' ? cap(val) : val; // value brings its own article; keep the template's case
      return art + ' ' + val;                            // plain noun: keep the template's article as written
    });
  }
  // Speaker label for a slot (capitalised so "the landlady" shows as "The landlady").
  function speaker(key, skin) { var v = skin && skin[key]; return typeof v === 'string' ? cap(v) : key; }
  var Skin = { applySkin: applySkin, speaker: speaker };
  if (typeof module !== 'undefined') module.exports = Skin; else root.Skin = Skin;
})(this);
