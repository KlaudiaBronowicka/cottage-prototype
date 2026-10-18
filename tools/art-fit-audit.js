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
      // (a) questions_row: height and Question text fit
      var qr = document.getElementById('questions'), sc0 = st.width / 1920;
      geo.q = { h: qr.getBoundingClientRect().height, chips: Array.prototype.map.call(document.querySelectorAll('#stage .qchip'), function (c) {
        var t = c.querySelector('.qtxt'), cr = c.getBoundingClientRect(), tr = t.getBoundingClientRect();
        return { font: parseFloat(getComputedStyle(t).fontSize) * sc0, fits: tr.top >= cr.top - 0.5 && tr.bottom <= cr.bottom + 0.5 && t.scrollWidth <= t.clientWidth + 1, need: Math.round(tr.height / sc0), have: Math.round(cr.height / sc0) }; }) };
      // (b) zone label strips vs the Yard footprint ring (ring ends at about y720 on board_bg v2)
      geo.strips = Array.prototype.map.call(document.querySelectorAll('#stage .zone'), function (z) { var r = z.querySelector('.zstrip').getBoundingClientRect(); return { id: z.id, top: Math.round((r.top - st.top) / sc0), bottom: Math.round((r.bottom - st.top) / sc0) }; });
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
    // late night (5-6) render: the late_nights_banner strip, and the visit_warning strip (both texts, incl. the Bar-saved one)
    var late = await p.evaluate(function () {
      var g = window.__game, S = g.state; S.round = 5; S.presence.pos = 2; S.bars = 0; window.__ui.renderEncounter();
      function fit(id) { var e = document.getElementById(id); if (!e) return null; var b = e.closest('.hud') || e; return { over: b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1, need: b.scrollWidth, have: b.clientWidth }; }
      var lb = fit('lateBanner'), vw = fit('visitWarn');
      S.bars = 1; var i = S.events.indexOf('footsteps'); if (i >= 0) S.events.splice(i, 1); S.events.unshift('footsteps'); window.__ui.renderEncounter();
      var vs = fit('visitWarn'); S.bars = 0; S.presence.pos = 0; S.round = 1; window.__ui.renderEncounter();
      return { lb: lb, vw: vw, vs: vs, sky: !!document.getElementById('skyLate') };
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
    var fitS = function (f) { return !f ? 'NOT SHOWN' : f.over ? 'OVERFLOW (needs ' + f.need + 'px, has ' + f.have + 'px)' : 'fits'; };
    out.push('late_nights_banner (nights 5-6): ' + fitS(late.lb) + '; visit_warning: ' + fitS(late.vw) + ', Bar-saved text: ' + fitS(late.vs) + '; sky overlay ' + (late.sky ? 'on' : 'off'));
    out.push('(a) questions_row: ' + Math.round(cards.geo.q.h) + ' screen px tall; Question text ' + cards.geo.q.chips.map(function (c) { return c.font.toFixed(1) + 'px ' + (c.fits ? 'fits' : 'DOES NOT FIT') + ' (' + c.need + ' of ' + c.have + ' stage px)'; }).join(' / '));
    out.push('(b) zone label strips (stage y): ' + cards.geo.strips.map(function (z) { return z.id.replace('zone-', '') + ' ' + z.top + '-' + z.bottom; }).join(', ') + '; footprint ring ends ~y720 -> ' + (cards.geo.strips.every(function (z) { return z.top >= 721; }) ? 'no strip clips the ring' : 'A STRIP CLIPS THE RING'));
    var ne = cards.rep.filter(function (r) { return /^next event/.test(r.id) && r.w < 200 && r.box === 'next_event.title'; })[0];
    if (ne) out.push('Next-event title on screen at the HUD size: ' + (ne.font * handScale).toFixed(1) + 'px (hover zoom ' + BOARD_W_ZOOM + 'px wide)');
    cards.rep.filter(function (r) { return r.screen && r.font < 11; }).forEach(function (r) { out.push('  SMALL TEXT ' + r.id + ': ' + r.font.toFixed(1) + 'px on screen'); });
    await p.close();
  }
  out.push('', '== layout v2 (Ola, 2026-10-18), checked in the rendered game (screenshots 09, 10, 20, 24-29) - notes for Ola, by box name ==');
  [
    'All board-layout overrides the manifest covers are gone: event_card, late_nights_banner, visit_warning, hint_line, roll_tray (overlay), door / door_handle / bar_on_door / window (overlay) now come straight from the manifest. One override left: the night-start / visit "banner" (no manifest box; transient overlay at 460,410 1000x220 in the zone band).',
    'roll_tray (1000x400): the roll dialog fits only with tighter type (title 28px, rows 16px, die faces 20px at 1920 = ~11-13px at 1280). Workable; a taller tray (~460) would let it breathe.',
    'Zone label strips: we set them 40px tall, 6px from the zone bottom (y722-762) so they stay clear of the footprint ring (prints end at ~y720). The plate art strip (zone_*.png slots, 80/320 of the plate) would be ~103px at the 412px zone height and would cover the ring\'s bottom row.',
    'Hand cards are 190x266 (hand variant): effect text 14.7px at 1920 / 9.8px at 1280, names 15.2 / 10.1px, as in her note.',
    'sky_late_overlay now covers the zone band: straight linear 0 -> 1 fade over 2.4s.',
    'Every file is her WebP now (our PNG->WebP conversions removed). Not copied (not for shipping / not used): cards/_mock/*, board/_board*_debug.jpg, icons/*_64 (we use the SVGs).',
    'Hand-variant name box (560px): "Chair Under the Handle" does not fit at 60px; names over 18 characters shrink to 42px (5.6cqw), as her note allows.',
    'Importer: 120 files, 0 missing.'
  ].forEach(function (l) { out.push('  - ' + l); });
  fs.writeFileSync(path.join(root, 'tests', 'art-fit-report.txt'), out.join('\n') + '\n');
  console.log(out.join('\n'));
  await b.close();
})().catch(function (e) { console.error(e); process.exit(1); });
