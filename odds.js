/* =====================================================================
 * odds.js — exact outcome odds for a test, from the real test bag in config.js.
 * The draw is one token from CONFIG.testBag (a d6), so odds are exact (no sampling).
 * Pure functions; runs in browser and node.
 * ===================================================================== */
(function (root) {
  'use strict';
  /** testOdds(cfg, preDraw, difficulty) → { p, pStrong, pStar, faces:[{roll, token, total, result}] }
   *  result: 'star' | 'fail' | 'success' | 'strong'
   *  opts.guided (v0.4.2): the guided tutorial rolls (game.js runTest, S.tutorialGuided) never land on the bad omen or a
   *  negative face; those faces are re-rolled uniformly onto the safe ones, so they are flagged off:true and left out of p. */
  function testOdds(cfg, preDraw, difficulty, opts) {
    var guided = !!(opts && opts.guided), faces = [], n = 0, win = 0, strong = 0, star = 0;
    cfg.testBag.forEach(function (tok, i) {
      var f = { roll: i + 1, token: tok };
      if (guided && (tok === 'STAR' || tok < 0)) f.off = true; else n++;
      if (tok === 'STAR') { f.result = 'star'; f.total = null; if (!f.off) star++; }
      else {
        f.total = preDraw + tok;
        f.result = f.total >= difficulty + cfg.strongMargin ? 'strong' : f.total >= difficulty ? 'success' : 'fail';
        if (!f.off) { if (f.result !== 'fail') win++; if (f.result === 'strong') strong++; }
      }
      faces.push(f);
    });
    return { p: win / n, pStrong: strong / n, pStar: star / n, faces: faces };
  }
  function pct(x) { return Math.round(x * 100); }
  var Odds = { testOdds: testOdds, pct: pct };
  if (typeof module !== 'undefined') module.exports = Odds; else root.Odds = Odds;
})(this);
