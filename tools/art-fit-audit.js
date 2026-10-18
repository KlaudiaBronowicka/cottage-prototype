/* Art/text fit audit (playwright-core + Chrome):
 *   NODE_PATH=/path/to/node_modules node tools/art-fit-audit.js [chromePath]
 * Renders every card, Question card, zone plate, Help portrait and the Dread label with LIVE text in the
 * artist's boxes (assets/manifest.js) and reports any box whose text overflows, plus on-screen font sizes
 * at 1280x720 and 1920x1080. Writes tests/art-fit-report.txt. */
'use strict';
var path = require('path'), fs = require('fs');
var { chromium } = require('playwright-core');
var exe = process.argv[2] || '/usr/bin/google-chrome';
var root = path.resolve(__dirname, '..'), url = 'file://' + path.join(root, 'index.html');
(async function () {
  var b = await chromium.launch({ executablePath: exe, headless: true });
  var out = [];
  for (var vp of [[1280, 720], [1920, 1080]]) {
    var p = await b.newPage({ viewport: { width: vp[0], height: vp[1] } });
    await p.goto(url + '?seed=5&tutorial=0'); await p.click('#bSkip'); await p.click('#bGo'); await p.waitForTimeout(2800);
    var res = await p.evaluate(function () {
      var rep = [], scale = document.getElementById('stage').getBoundingClientRect().width / 1920;
      function over(el) { var s = el.firstElementChild || el; return s.scrollHeight > el.clientHeight + 1 || s.scrollWidth > el.clientWidth + 1; }
      function fpx(el) { var s = el.firstElementChild || el; return parseFloat(getComputedStyle(s).fontSize); }
      // full-size cards (artist pixels) for every card id, in a test host
      var host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-5000px;top:0;display:flex;flex-wrap:wrap;width:4000px'; document.body.appendChild(host);
      var ids = CONFIG.deck.map(function (c) { return c.id; }).concat(['chair']).filter(function (x, i, a) { return a.indexOf(x) === i; });
      return { scale: scale, ids: ids };
    });
    // render cards via the UI's own component (exposed for tests)
    var cards = await p.evaluate(function (ids) {
      var rep = []; var host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;z-index:999;'; document.body.appendChild(host);
      ids.forEach(function (id) {
        [750, 340, 190].forEach(function (w) {
          host.innerHTML = window.__ui.cardHTML(id, { w: w, cls: w === 190 ? 'compact' : '' });
          host.querySelectorAll('.c-box').forEach(function (bx) {
            if (getComputedStyle(bx).display === 'none') return;
            var s = bx.firstElementChild, o = s.scrollHeight > bx.clientHeight + 1 || s.scrollWidth > bx.clientWidth + 1;
            rep.push({ id: id, w: w, box: bx.dataset.box, over: o, font: parseFloat(getComputedStyle(s).fontSize), need: s.scrollHeight, have: bx.clientHeight });
          });
        });
      });
      ['T1', 'T2', 'T3'].forEach(function (q) {
        [750, 340, 230].forEach(function (w) {
          host.innerHTML = window.__ui.questionCardHTML(q, { w: w, have: 1 });
          host.querySelectorAll('.c-box').forEach(function (bx) { var s = bx.firstElementChild; rep.push({ id: 'question ' + q, w: w, box: bx.dataset.box, over: s.scrollHeight > bx.clientHeight + 1 || s.scrollWidth > bx.clientWidth + 1, font: parseFloat(getComputedStyle(s).fontSize), need: s.scrollHeight, have: bx.clientHeight }); });
        });
      });
      host.remove();
      // live HUD boxes on the stage
      var scale = document.getElementById('stage').getBoundingClientRect().width / 1920;
      document.querySelectorAll('#stage [data-box], #stage .zstrip, #stage .qchip .qtxt, #stage .evcard, #stage .hslot').forEach(function (bx) {
        if (bx.closest('.hcard')) return; // hand cards are measured above at 190px
        var s = bx.firstElementChild || bx, o = bx.scrollHeight > bx.clientHeight + 1 || bx.scrollWidth > bx.clientWidth + 1 || s.scrollHeight > bx.clientHeight + 1;
        rep.push({ id: 'stage ' + (bx.dataset.box || bx.className), w: 0, box: bx.dataset.box || bx.className, over: o, font: parseFloat(getComputedStyle(s).fontSize) * scale, need: s.scrollHeight, have: bx.clientHeight, screen: true });
      });
      return { rep: rep, scale: scale };
    }, res.ids);
    var handScale = cards.scale;
    out.push('== viewport ' + vp.join('x') + ' (stage scale ' + handScale.toFixed(3) + ') ==');
    var over = cards.rep.filter(function (r) { return r.over; });
    out.push('Overflowing boxes: ' + (over.length ? '' : 'none'));
    over.forEach(function (r) { out.push('  OVERFLOW ' + r.id + (r.w ? ' @' + r.w + 'px' : '') + ' box "' + r.box + '": text needs ' + r.need + 'px, box has ' + r.have + 'px'); });
    // on-screen font size of the effect text in the hand (190 stage px) and zoom
    var eff190 = cards.rep.filter(function (r) { return r.w === 190 && r.box === 'effect'; })[0], eff340 = cards.rep.filter(function (r) { return r.w === 340 && r.box === 'effect'; })[0];
    out.push('Card effect text on screen: hand ' + (eff190.font * handScale).toFixed(1) + 'px, zoom ' + eff340.font.toFixed(1) + 'px (artist note: min 14px)');
    var nm = cards.rep.filter(function (r) { return r.w === 190 && r.box === 'name'; })[0];
    out.push('Card name on screen in hand: ' + (nm.font * handScale).toFixed(1) + 'px');
    cards.rep.filter(function (r) { return r.screen && r.font < 11; }).forEach(function (r) { out.push('  SMALL TEXT ' + r.id + ': ' + r.font.toFixed(1) + 'px on screen'); });
    await p.close();
  }
  fs.writeFileSync(path.join(root, 'tests', 'art-fit-report.txt'), out.join('\n') + '\n');
  console.log(out.join('\n'));
  await b.close();
})().catch(function (e) { console.error(e); process.exit(1); });
