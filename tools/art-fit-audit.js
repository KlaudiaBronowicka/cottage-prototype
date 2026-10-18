/* Art/text fit audit (playwright-core + Chrome):
 *   NODE_PATH=/path/to/node_modules node tools/art-fit-audit.js [chromePath]
 * Renders every card, Question card, zone plate, Help portrait and the Dread label with LIVE text in the
 * artist's boxes (assets/manifest.js) and reports any box whose text overflows, plus on-screen font sizes
 * at 1280x720 and 1920x1080. Writes tests/art-fit-report.txt. */
'use strict';
var path = require('path'), fs = require('fs');
var { chromium } = require('playwright-core');
var exe = process.argv[2] || '/usr/bin/google-chrome';
var BOARD_W_ZOOM = require('../data/board-layout.js').nextEventZoomW, HW0 = require('../data/board-layout.js').handCard.w;
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
      var ids = CONFIG.deck.map(function (c) { return c.id; }).concat(['chair', 'bread']).filter(function (x, i, a) { return a.indexOf(x) === i; });
      return { scale: scale, ids: ids };
    });
    // render cards via the UI's own component (exposed for tests)
    var cards = await p.evaluate(function (ids) {
      var rep = []; var host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;z-index:999;'; document.body.appendChild(host);
      ids.forEach(function (id) {
        [750, 340, BOARD_LAYOUT.handCard.w].forEach(function (w) {
          var hand = w === BOARD_LAYOUT.handCard.w;
          host.innerHTML = window.__ui.cardHTML(id, { w: w, cls: hand ? 'compact' : '', variant: hand ? BOARD_LAYOUT.handCard.variant : null });
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
      // v0.3 next-event card (artist's next_event_layout) at the HUD size and the hover zoom, for every event
      CONFIG.events.forEach(function (e) {
        [ASSET_MANIFEST.board.ui.next_event_preview.w, BOARD_LAYOUT.nextEventZoomW].forEach(function (w) {
          host.innerHTML = window.__ui.nextEventCard(e.id, { w: w });
          host.querySelectorAll('.c-box').forEach(function (bx) { var s = bx.firstElementChild; rep.push({ id: 'next event ' + e.id, w: w, box: bx.dataset.box, over: s.scrollHeight > bx.clientHeight + 1 || s.scrollWidth > bx.clientWidth + 1, font: parseFloat(getComputedStyle(s).fontSize), need: s.scrollHeight, have: bx.clientHeight }); });
        });
      });
      host.remove();
      // live HUD boxes on the stage
      var scale = document.getElementById('stage').getBoundingClientRect().width / 1920;
      document.querySelectorAll('#stage [data-box], #stage .zstrip, #stage .qchip .qtxt, #stage .evcard, #stage .hslot, #stage .visitWarn').forEach(function (bx) {
        if (bx.closest('.hcard') || bx.closest('.necard')) return; // measured above
        var s = bx.firstElementChild || bx, o = bx.scrollHeight > bx.clientHeight + 1 || bx.scrollWidth > bx.clientWidth + 1 || s.scrollHeight > bx.clientHeight + 1;
        rep.push({ id: 'stage ' + (bx.dataset.box || bx.className), w: 0, box: bx.dataset.box || bx.className, over: o, font: parseFloat(getComputedStyle(s).fontSize) * scale, need: s.scrollHeight, have: bx.clientHeight, screen: true });
      });
      // layout: HUD height above the zones, tokens inside their zone and clear of the zone strip
      var st = document.getElementById('stage').getBoundingClientRect(), zt = document.getElementById('zone-house').getBoundingClientRect().top - st.top;
      var geo = { hudPx: zt, hudPct: zt / st.height * 100, tokens: [] };
      return { rep: rep, scale: scale, geo: geo };
    }, res.ids);
    // token placement in every zone (POV + COMPANION 1), stage px
    var toks = await p.evaluate(function () {
      var g = window.__game, out = [];
      [0, 1, 2].forEach(function (z) {
        g.state.pov = z; g.state.c1 = z; window.__ui.renderEncounter();
        ['POV', 'C1', 'C2'].forEach(function (w) {
          var t = document.getElementById('tok-' + w); if (!t) return;
          t.style.transition = 'none'; t.style.transform = 'none'; // measure the resting place, not the move animation
          var zid = g.cfg.zones[w === 'C2' ? 0 : z].id, zb = document.getElementById('zone-' + zid), sc = document.getElementById('stage').getBoundingClientRect().width / 1920;
          var tr = t.getBoundingClientRect(), zr = zb.getBoundingClientRect(), strip = zb.querySelector('.zstrip').getBoundingClientRect();
          var inside = tr.left >= zr.left - 1 && tr.right <= zr.right + 1 && tr.top >= zr.top - 1, clear = tr.bottom <= strip.top + 1;
          if (!inside || !clear) out.push(w + ' in ' + zid + ': ' + (!inside ? 'outside the zone box' : 'overlaps the zone strip by ' + Math.round((tr.bottom - strip.top) / sc) + 'px'));
        });
      });
      g.state.pov = 0; g.state.c1 = 0;
      return out;
    });
    // late night (5-6) render: Tonight box with the late line
    var late = await p.evaluate(function () {
      var g = window.__game; g.state.round = 5; window.__ui.renderEncounter();
      var e = document.getElementById('nightEvent'), o = e.scrollHeight > e.clientHeight + 1;
      return { over: o, need: e.scrollHeight, have: e.clientHeight, sky: !!document.getElementById('skyLate') };
    });
    var handScale = cards.scale;
    out.push('== viewport ' + vp.join('x') + ' (stage scale ' + handScale.toFixed(3) + ') ==');
    var over = cards.rep.filter(function (r) { return r.over; });
    out.push('Overflowing boxes: ' + (over.length ? '' : 'none'));
    over.forEach(function (r) { out.push('  OVERFLOW ' + r.id + (r.w ? ' @' + r.w + 'px' : '') + ' box "' + r.box + '": text needs ' + r.need + 'px, box has ' + r.have + 'px'); });
    // on-screen font size of the effect text in the hand (190 stage px) and zoom
    var HW = HW0, eff190 = cards.rep.filter(function (r) { return r.w === HW && r.box === 'effect'; })[0], eff340 = cards.rep.filter(function (r) { return r.w === 340 && r.box === 'effect'; })[0];
    out.push('Card effect text on screen: hand (' + HW + 'px, hand variant) ' + (eff190.font * handScale).toFixed(1) + 'px, zoom ' + eff340.font.toFixed(1) + 'px (artist note: min 14px)');
    var nm = cards.rep.filter(function (r) { return r.w === HW && r.box === 'name'; })[0];
    out.push('Card name on screen in hand: ' + (nm.font * handScale).toFixed(1) + 'px');
    out.push('HUD above the zones: ' + Math.round(cards.geo.hudPx) + ' screen px (' + cards.geo.hudPct.toFixed(1) + '% of the stage height)');
    out.push('Tokens: ' + (toks.length ? toks.join('; ') : 'all inside their zone box and clear of the zone strip'));
    out.push('Nights 5-6 Tonight box (late_nights_banner): ' + (late.over ? 'OVERFLOW, needs ' + late.need + 'px, has ' + late.have + 'px' : 'fits') + '; sky overlay ' + (late.sky ? 'on' : 'off'));
    var ne = cards.rep.filter(function (r) { return /^next event/.test(r.id) && r.w < 200 && r.box === 'next_event.title'; })[0];
    if (ne) out.push('Next-event title on screen at the HUD size: ' + (ne.font * handScale).toFixed(1) + 'px (hover zoom ' + BOARD_W_ZOOM + 'px wide)');
    cards.rep.filter(function (r) { return r.screen && r.font < 11; }).forEach(function (r) { out.push('  SMALL TEXT ' + r.id + ': ' + r.font.toFixed(1) + 'px on screen'); });
    await p.close();
  }
  out.push('', '== checked by eye in the rendered game (screenshots 09, 20, 24-28) - notes for Ola, by manifest box name ==');
  [
    'board.ui_boxes: no "event_card" box in v0.3. Tonight\'s event is drawn in "late_nights_banner" (board-layout override eventCard -> late_nights_banner). Wanted: a home for tonight\'s event, or confirm late_nights_banner is it.',
    '"event_log" (y836-872) overlaps the zone boxes (zones end at y860) by ~24px; the last log line sits on the zone strip edge.',
    'No boxes for the visit warning or the coach/hint line: explicit boxes in board-layout.js (visitWarn 560,428,800,46; hint 560,482,800,48). Please add "visit_warning" + "hint_line" boxes.',
    '"hand" box is 200px tall, so hand cards are 143px wide (hand variant). Effect text measures ' + '(see above) ~10.6px at 1920 and ~7px at 1280, not the ~14.5px in the fix note (that figure assumes 190px-wide cards). Card names ~9px / ~6px. Either a taller hand box (~266px) or bigger hand-variant text boxes.',
    'board/sky_late_overlay: with the HUD at ~39% of the height most of the sky sits behind HUD panels, so the nights 5-6 cross-fade is subtle. Maybe more change lower on the board (fence/treeline).',
    'PNG-only (we convert to WebP in our repo, her files untouched): fx/visit_frost_screen_f1-4 (~1.9MB total as PNG), board/sky_late_overlay.',
    'Roll tray (our explicit "tray" box) covers "questions_row" while rolling; fine for now, flag if she wants the questions visible during rolls.',
    'All v0.3 keys present: approach track + 4 step tiles + name boxes, presence tokens A/B 128/256, footprint icons, next_event frame + layout, late_nights_banner, sky_late_overlay, board_bg_late, bar_on_door, bar_visit_stopped, door_handle / visit_frost_window / visit_frost_screen fx (4 frames each), bread_and_salt card art, card_frame_hand + card_panels_hand. Importer: 120 files, 0 missing.'
  ].forEach(function (l) { out.push('  - ' + l); });
  fs.writeFileSync(path.join(root, 'tests', 'art-fit-report.txt'), out.join('\n') + '\n');
  console.log(out.join('\n'));
  await b.close();
})().catch(function (e) { console.error(e); process.exit(1); });
