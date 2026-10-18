/* v0.4 art/text fit audit (Ola layout v3, 2026-10-18), playwright-core + Chrome:
 *   NODE_PATH=/path/to/node_modules node tools/art-fit-v04.js [chromePath]
 * Renders the v0.4 build with live text in Ola's boxes (assets/manifest.js) at 1280x720 and 1920x1080 and reports:
 * card / next-event box overflow (all 10 cards, 8 events), HUD boxes, tokens vs zone strips, zone strips vs the footprint ring (~y703),
 * the zone-strip art size, the coach strip (hint_line, 120px in v0.4.1) and handoff (tutorial_modal) for every tutorial step, the late banner and
 * visit warning, card_inspect @380, and the three end screens (title / result_line / buttons / stats_row). Writes tests/art-fit-report-v041.txt (v0.4.2: coach lines + the 14px floor). */
'use strict';
var path = require('path'), fs = require('fs');
var { chromium } = require('playwright-core');
var exe = process.argv[2] || '/usr/bin/google-chrome';
var BL = require('../data/board-layout.js');
var root = path.resolve(__dirname, '..'), url = 'file://' + path.join(root, 'index.html');
function ov(r) { return r.need > r.have + 1; }
(async function () {
  var b = await chromium.launch({ executablePath: exe, headless: true });
  var out = ['v0.4.1 art-fit report (tools/art-fit-v04.js), stage 1920x1080 artist px unless "screen px"'], errs = [];
  for (var vp of [[1280, 720], [1920, 1080]]) {
    var p = await b.newPage({ viewport: { width: vp[0], height: vp[1] } });
    p.on('pageerror', function (e) { errs.push(e.message); }); p.on('console', function (m) { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(url + '?seed=5&tutorial=0'); await p.click('#bStart'); await p.waitForTimeout(2800);
    var r = await p.evaluate(function () {
      var rep = [], st = document.getElementById('stage'), sr = st.getBoundingClientRect(), sc = sr.width / 1920, M = ASSET_MANIFEST;
      function boxRep(id, host) { host.querySelectorAll('.c-box').forEach(function (bx) { if (getComputedStyle(bx).display === 'none') return; var s = bx.firstElementChild; if (!s) return; rep.push({ id: id, box: bx.dataset.box, need: s.scrollHeight, have: bx.clientHeight, wneed: s.scrollWidth, whave: bx.clientWidth, font: parseFloat(getComputedStyle(s).fontSize) }); }); }
      var host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;z-index:999;'; document.body.appendChild(host);
      var ids = window.__game.cfg.deck.map(function (c) { return c.id; }), noArt = [];
      ids.forEach(function (id) {
        if (!M.cardArt[id]) noArt.push(id);
        [750, 340, BOARD_LAYOUT.handCard.w, BOARD_LAYOUT.handCard.inspectW || 380].forEach(function (w) {
          var hand = w === BOARD_LAYOUT.handCard.w || w === (BOARD_LAYOUT.handCard.inspectW || 380);
          host.innerHTML = window.__ui.cardHTML(id, { w: w, cls: hand ? 'compact' : '', variant: hand ? BOARD_LAYOUT.handCard.variant : null });
          boxRep('card ' + id + ' @' + w + (w === (BOARD_LAYOUT.handCard.inspectW || 380) ? ' (inspect)' : ''), host);
        });
      });
      window.__game.cfg.events.forEach(function (e) { [M.board.ui.next_event_preview.w, BOARD_LAYOUT.nextEventZoomW].forEach(function (w) { host.innerHTML = window.__ui.nextEventCard(e.id, { w: w }); boxRep('next event ' + e.id + ' @' + w, host); }); });
      host.remove();
      var hud = [];
      ['goalBanner', 'nightCounter', 'clues', 'nightEvent', 'eventLog', 'nextEvent', 'turnBox', 'dread', 'actionsBox', 'deckPile'].forEach(function (id) {
        var e = document.getElementById(id); if (!e) { hud.push({ id: id, missing: true }); return; }
        hud.push({ id: id, need: e.scrollHeight, have: e.clientHeight, wneed: e.scrollWidth, whave: e.clientWidth, font: parseFloat(getComputedStyle(e.firstElementChild || e).fontSize) * sc });
      });
      var strips = Array.prototype.map.call(document.querySelectorAll('#stage .zone'), function (z) { var q = z.querySelector('.zstrip').getBoundingClientRect(); return { id: z.id.replace('zone-', ''), top: Math.round((q.top - sr.top) / sc), bottom: Math.round((q.bottom - sr.top) / sc), w: Math.round(q.width / sc), art: z.querySelector('.zstrip').classList.contains('art') }; });
      var cardFont = (function () { var e = document.querySelector('#stage .hcard [data-box="effect"] > *'); return e ? parseFloat(getComputedStyle(e).fontSize) * (document.querySelector('#stage .hcard').getBoundingClientRect().width / BOARD_LAYOUT.handCard.w) * (BOARD_LAYOUT.handCard.w / BOARD_LAYOUT.handCard.w) : null; })();
      var hc = document.querySelectorAll('#stage .hcard').length;
      return { rep: rep, hud: hud, strips: strips, sc: sc, noArt: noArt, hc: hc };
    });
    // zone strip art natural size
    var stripArt = await p.evaluate(function () { return Promise.all(['house', 'yard', 'treeline'].map(function (z) { return new Promise(function (res) { var u = ASSET_MANIFEST.board.zoneStrips[z]; if (!u) return res({ z: z, none: true }); var i = new Image(); i.onload = function () { res({ z: z, w: i.naturalWidth, h: i.naturalHeight }); }; i.onerror = function () { res({ z: z, err: true }); }; i.src = u; }); })); });
    var toks = await p.evaluate(function () {
      var g = window.__game, o = [];
      [0, 1, 2].forEach(function (z) { g.state.pov = z; window.__ui.renderEncounter(); var t = document.getElementById('tok-POV'); if (!t) { o.push('no POV token'); return; } t.style.transition = 'none'; t.style.transform = 'none';
        var zb = document.getElementById('zone-' + g.cfg.zones[z].id), sc = document.getElementById('stage').getBoundingClientRect().width / 1920, tr = t.getBoundingClientRect(), zr = zb.getBoundingClientRect(), s = zb.querySelector('.zstrip').getBoundingClientRect();
        if (tr.left < zr.left - 1 || tr.right > zr.right + 1 || tr.top < zr.top - 1) o.push('You in ' + g.cfg.zones[z].id + ': outside the zone box'); else if (tr.bottom > s.top + 1) o.push('You in ' + g.cfg.zones[z].id + ': overlaps the zone strip by ' + Math.round((tr.bottom - s.top) / sc) + 'px'); });
      g.state.pov = 0; window.__ui.renderEncounter(); return o;
    });
    var late = await p.evaluate(function () {
      var g = window.__game, S = g.state; S.round = 5; S.presence.pos = 2; S.bars = 0; var i = S.events.indexOf('footsteps'); if (i >= 0) S.events.splice(i, 1); S.events.unshift('footsteps'); window.__ui.renderEncounter();
      function fit(id) { var e = document.getElementById(id); if (!e) return null; var bb = e.closest('.hud') || e; return { need: bb.scrollWidth, have: bb.clientWidth, hneed: bb.scrollHeight, hhave: bb.clientHeight }; }
      var res = { lb: fit('lateBanner'), vw: fit('visitWarn'), sky: !!document.getElementById('skyLate') };
      S.round = 1; S.presence.pos = 0; window.__ui.renderEncounter(); return res;
    });
    // tutorial coach: every step in the hint_line strip (120px in v0.4.1) / the handoff in tutorial_modal
    var p2 = await b.newPage({ viewport: { width: vp[0], height: vp[1] } });
    await p2.goto(url + '?seed=7&tutorial=1'); await p2.click('#bStart'); await p2.waitForTimeout(2800);
    var coachRep = await p2.evaluate(function () {
      var o = [], n = window.__ui.STEPS.length, sc = document.getElementById('stage').getBoundingClientRect().width / 1920;
      for (var i = 0; i < n; i++) { window.__ui.tutGo(i); var bb = document.getElementById('coachBubble'); if (!bb) { o.push({ i: i + 1, missing: true }); continue; }
        var modal = window.__ui.STEPS[i].await === 'modal', box = ASSET_MANIFEST.board.ui[BOARD_LAYOUT.boxes[modal ? 'tutorialModal' : 'coach']];
        o.push({ i: i + 1, id: window.__ui.STEPS[i].id, modal: modal, need: Math.round(bb.getBoundingClientRect().height / sc), have: box.h, font: parseFloat(getComputedStyle(bb).fontSize),
          lines: (function () { var t = bb.querySelector('.ctext'); return t ? Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight)) : 0; })(), text: (bb.querySelector('.ctext') || {}).textContent }); }
      var sk = document.getElementById('skipTut'); return { steps: o, skip: sk ? { need: sk.scrollWidth, have: sk.clientWidth } : null };
    });
    await p2.close();
    // end screens
    var ends = [];
    for (var oc of ['win', 'lose_dread', 'lose_short']) {
      ends.push(await p.evaluate(function (oc) {
        var g = window.__game, S = g.state; S.progress = oc === 'win' ? 5 : 3; S.pressure = oc === 'lose_dread' ? 6 : 2; g.finishV04 ? g.finishV04() : null;
        if (S.phase !== 'done') { S.result = { outcome: oc, clues: S.progress, clueGoal: 5, finalPressure: S.pressure, hoursPlayed: 6, visits: 0, visitsBlocked: 0, cardsPlayed: 0 }; S.phase = 'done'; }
        S.result.outcome = oc; window.__ui.renderEncounter();
        var sc = document.getElementById('stage').getBoundingClientRect().width / 1920, bg = document.querySelector('.endbg');
        function f(id) { var e = document.getElementById(id); if (!e) return null; var s = e.firstElementChild || e; if (s === e) return { need: e.scrollWidth, have: e.clientWidth, hneed: e.scrollHeight, hhave: e.clientHeight, font: parseFloat(getComputedStyle(e).fontSize) * sc };
        return { need: Math.max(s.scrollWidth, e.scrollWidth), have: e.clientWidth, hneed: Math.max(s.getBoundingClientRect().height / sc, e.scrollHeight), hhave: e.clientHeight, font: parseFloat(getComputedStyle(s).fontSize) * sc }; }
        var es = document.getElementById('endStats'), er = es ? es.getBoundingClientRect() : null, srt = document.getElementById('stage').getBoundingClientRect();
        var sp = document.querySelector('.endStatsPanel'), send = document.getElementById('bStats2');
        function boxFit(el, name) { if (!el) return { name: name, missing: true }; var r = el.getBoundingClientRect(); return { name: name, top: Math.round((r.top - srt.top) / sc), bottom: Math.round((r.bottom - srt.top) / sc), w: Math.round(r.width / sc), h: Math.round(r.height / sc), need: el.scrollHeight, have: el.clientHeight, wneed: el.scrollWidth, whave: el.clientWidth }; }
        return { oc: oc, bg: bg ? bg.getAttribute('src') : null, title: f('endTitle'), result: f('endResult'), again: f('bAgain'), tut: f('bTutAgain'),
          stats: boxFit(es, 'run_stats'), panel: boxFit(sp, 'stats_row'), send: boxFit(send, 'send_results'),
          statsBottom: er ? Math.round((er.bottom - srt.top) / sc) : null };
      }, oc));
      await p.goto(url + '?seed=5&tutorial=0'); await p.click('#bStart'); await p.waitForTimeout(2600);
    }
    await p.close();
    // ---- report
    out.push('', '== viewport ' + vp.join('x') + ' (stage scale ' + r.sc.toFixed(3) + ') ==');
    var over = r.rep.filter(function (x) { return x.need > x.have + 1 || x.wneed > x.whave + 1; });
    out.push('Card / next-event boxes overflowing: ' + (over.length ? over.length : 'none'));
    over.forEach(function (x) { out.push('  OVERFLOW ' + x.id + ' "' + x.box + '": needs ' + x.need + 'x' + x.wneed + ', has ' + x.have + 'x' + x.whave); });
    out.push('Cards with no art file: ' + (r.noArt.length ? r.noArt.join(', ') : 'none (all 10 delivered)') + '; cards in hand at start: ' + r.hc);
    r.hud.forEach(function (h) { out.push('HUD ' + h.id + ': ' + (h.missing ? 'NOT RENDERED' : (h.need > h.have + 1 || h.wneed > h.whave + 1 ? 'OVERFLOW (needs ' + h.wneed + 'x' + h.need + ', has ' + h.whave + 'x' + h.have + ' css px)' : 'fits') + ', text ' + h.font.toFixed(1) + ' screen px')); });
    out.push('Zone strips (stage y): ' + r.strips.map(function (z) { return z.id + ' ' + z.top + '-' + z.bottom + ' w' + z.w + (z.art ? ' art' : ' NO ART'); }).join(', ') + '; footprint ring ends ~y723 -> ' + (r.strips.every(function (z) { return z.top >= 724; }) ? 'clear' : 'A STRIP CLIPS THE RING'));
    out.push('Zone strip art (natural px): ' + stripArt.map(function (a) { var z = r.strips.filter(function (s) { return s.id === a.z; })[0]; return a.z + ' ' + (a.none ? 'none' : a.err ? 'LOAD ERROR' : a.w + 'x' + a.h + (z && Math.abs(a.w / a.h - z.w / 40) > 0.05 ? ' (MISMATCH: zone strip is ' + z.w + 'x40)' : ' ok')); }).join(', '));
    out.push('Tokens: ' + (toks.length ? toks.join('; ') : 'You token inside its zone box and clear of the zone strip in all 3 zones'));
    var fs2 = function (f) { return !f ? 'NOT SHOWN' : (f.need > f.have + 1 || f.hneed > f.hhave + 1) ? 'OVERFLOW (needs ' + f.need + 'x' + f.hneed + ', has ' + f.have + 'x' + f.hhave + ')' : 'fits'; };
    out.push('Hour 5 late_nights_banner: ' + fs2(late.lb) + '; visit_warning: ' + fs2(late.vw) + '; sky_late_overlay ' + (late.sky ? 'on' : 'off'));
    coachRep.steps.forEach(function (c) { out.push('Coach step ' + c.i + ' (' + c.id + ', ' + (c.modal ? 'tutorial_modal' : 'hint_line') + '): ' + (c.missing ? 'NOT SHOWN' : c.need + ' of ' + c.have + 'px ' + (c.need > c.have + 1 ? 'TALLER THAN THE BOX by ' + (c.need - c.have) + 'px' : 'fits') + ', text ' + c.font.toFixed(1) + ' screen px' + (c.font < 13.95 ? ' (BELOW 14px: phone-size viewport, see README)' : '') + ', ' + c.lines + ' line(s)' + (!c.modal && c.lines > 3 ? ' MORE THAN 3 LINES, cut: "' + c.text + '"' : ''))); });
    out.push('skip_tutorial button: ' + (coachRep.skip ? (coachRep.skip.need > coachRep.skip.have + 1 ? 'OVERFLOW' : 'fits') : 'NOT SHOWN'));
    ends.forEach(function (e) {
      function bf(b) { if (!b) return 'missing'; if (b.missing) return b.name + ' MISSING'; var ovf = b.need > b.have + 1 || b.wneed > b.whave + 1; return b.name + ' y' + b.top + '-' + b.bottom + ' ' + b.w + 'x' + b.h + (ovf ? ' OVERFLOW' : ' fits'); }
      out.push('End ' + e.oc + ' (' + (e.bg ? path.basename(e.bg) : 'NO ART') + '): title ' + fs2(e.title) + ' ' + (e.title ? e.title.font.toFixed(0) + 'px' : '') + ', result_line ' + fs2(e.result) + ', play_again ' + fs2(e.again) + ', play_with_tutorial ' + fs2(e.tut) + '; ' + bf(e.panel) + '; ' + bf(e.stats) + '; ' + bf(e.send));
    });
    out.push('Footprint ring ~y723 (v0.4.1); zone strips should start at y728.');
  }
  out.push('', 'Console errors: ' + (errs.length ? errs.join(' | ') : '0'));
  fs.writeFileSync(path.join(root, 'tests', 'art-fit-report-v041.txt'), out.join('\n') + '\n');
  fs.writeFileSync(path.join(root, 'tests', 'art-fit-report-v04.txt'), out.join('\n') + '\n'); // keep the old name pointing at the latest
  console.log(out.join('\n'));
  await b.close();
})().catch(function (e) { console.error(e); process.exit(1); });
