/* Browser click-through test (not needed to play). Needs playwright-core + Chrome:
 *   NODE_PATH=/path/to/node_modules node tests/ui-playwright.js [chromePath] [--shots]
 * - guided Night 1 end to end (coach steps, locked controls, skip)
 * - 12 full runs through intro/quick setup → encounter (click + drag) → dawn → outro → results → stats
 * - real odds in the Search tooltip, one-line renames (?terms=), one-colour icons (?icons=mono), skin grammar
 * - every <img> loads (art from assets/manifest.js); no console errors
 * --shots also writes the screenshots in screenshots/. */
'use strict';
var path = require('path'), fs = require('fs');
var { chromium } = require('playwright-core');
var args = process.argv.slice(2), SHOTS = args.indexOf('--shots') >= 0;
var exe = args.filter(function (a) { return a[0] !== '-'; })[0] || '/usr/bin/google-chrome';
var root = path.resolve(__dirname, '..'), url = 'file://' + path.join(root, 'index.html');
var shotDir = path.join(root, 'screenshots');
function assert(c, m) { if (!c) throw new Error('ASSERT: ' + m); }

(async function () {
  var browser = await chromium.launch({ executablePath: exe, headless: true });
  var ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
  var page = await ctx.newPage();
  var errors = [], BREAD_SEEN = {};
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error' || m.type() === 'warning') errors.push('console: ' + m.text()); });
  page.on('requestfailed', function (r) { errors.push('request failed: ' + r.url()); });
  page.on('dialog', function (d) { d.accept(); });
  async function shot(name, o) { if (!SHOTS) return; await page.mouse.move(1, 1); await page.waitForTimeout((o && o.wait) || 500); await page.screenshot({ path: path.join(shotDir, name + '.png') }); }
  async function brokenImages() { return page.$$eval('img', function (is) { return is.filter(function (i) { return i.complete && i.naturalWidth === 0; }).map(function (i) { return i.src; }); }); }
  var grammar = /\b[Tt]he (Hania|Ola|Kinga|Wanda|Irena)\b|\bthe the\b|⟦/i;

  // ---------- 1) guided Night 1 ----------
  await page.goto(url + '?seed=7&tutorial=1');
  await shot('01-title');
  await page.click('#bSkip'); await page.click('#bGo'); await page.waitForTimeout(2800);
  await shot('03-tutorial-step1-goal');
  for (var i = 0; i < 3; i++) await page.click('#coachNext');
  // step 4 (v0.3.1): the Presence, highlighting the Approach strip and the next event
  var cb = await page.textContent('#coachBubble');
  assert(/Step 4 of 11/.test(cb) && /moves along this track/.test(cb) && /It's at the trees now\. Every hour it comes a little closer\./.test(cb), 'tour step 4 = the Presence: ' + cb.slice(0, 120));
  assert((await page.$$('.coachRing')).length === 2, 'Presence step highlights the Approach strip and the next event');
  await shot('03b-tutorial-step4-presence');
  await page.click('#coachNext'); await page.click('#coachNext'); // step 5 zones -> step 6 Search
  await page.click('#act-steady', { force: true }); // locked during the tutorial
  assert(!(await page.$('#tray')), 'tutorial blocks non-highlighted controls');
  await page.click('#act-investigate'); await page.waitForTimeout(400);
  await shot('04-tutorial-step7-roll-dialog');
  var add = await page.$('[data-commit]'); if (add) await add.click();
  await page.click('#rollGo'); await page.waitForTimeout(700);
  assert(/Success/.test(await page.textContent('#rollResult')), 'tutorial first Search succeeds');
  await shot('05-tutorial-step8-clue');
  await page.click('#coachNext');
  var tutCard = await page.evaluate(function () { return window.__game.cfg.tutorialHand[1]; }); // Bread and Salt with the Presence on
  assert(tutCard === 'bread', 'tutorial play step uses Bread and Salt (presence on)');
  assert(/Bread and salt, by the stove\. The .+ says that's how you say please here\./.test(await page.textContent('#coachBubble')) && !/Drink\./.test(await page.textContent('#coachBubble')), 'tour step 9 (play) bubble shows the A line');
  await page.click('#card-' + tutCard); await page.waitForTimeout(300);
  await shot('06-tutorial-step9-play-card');
  await page.click('#zoomPlay'); await page.waitForTimeout(500);
  await page.click('#coachNext');
  await page.click('#act-end'); await page.waitForTimeout(2900);
  assert(await page.$eval('#coach', function (e) { return e.classList.contains('hidden'); }), 'tutorial finished after End turn');
  assert(await page.$('#hint'), 'Night 2 hint line shows');
  await shot('07-night2-hint');
  // real odds in the tooltip match odds.js
  await page.hover('#act-investigate'); await page.waitForTimeout(500);
  var tip = await page.textContent('#tip');
  var want = await page.evaluate(function () { var g = window.__game, S = g.state, z = g.cfg.zones[S.pov], need = Math.max(0, z.investigateDifficulty - S.torch); return Odds.pct(Odds.testOdds(g.cfg, g.previewTest('INSIGHT', need, [], []).preDraw, need).p); });
  assert(tip.indexOf('about ' + want + '%') >= 0, 'Search tooltip shows the real odds (' + want + '%): ' + tip);
  await shot('08-tooltip-real-odds', { wait: 0 });
  // replay tutorial from the menu, then skip it
  await page.click('#btnMenu'); await page.click('#mTut'); await page.waitForTimeout(400);
  assert(await page.$('#coachBubble'), 'Replay tutorial from the menu'); await page.click('#coachSkip');
  assert(await page.$eval('#coach', function (e) { return e.classList.contains('hidden'); }), 'tutorial skippable');

  // click a zone where nothing else (token, help, hand card) is on top, like a player would
  async function clickZone(id) {
    var pt = await page.evaluate(function (id) {
      var z = document.getElementById('zone-' + id), r = z.getBoundingClientRect();
      for (var fy = 0.15; fy < 0.95; fy += 0.1) for (var fx = 0.1; fx < 0.95; fx += 0.1) {
        var x = r.left + r.width * fx, y = r.top + r.height * fy, e = document.elementFromPoint(x, y);
        if (e && z.contains(e)) return { x: x, y: y };
      }
      return null;
    }, id);
    assert(pt, 'zone ' + id + ' has a clickable spot');
    if (pt) await page.mouse.click(pt.x, pt.y);
  }
  // ---------- 2) full runs ----------
  var outcomes = {}, dragPlays = 0;
  for (var run = 0; run < 12; run++) {
    // v0.3: presence track (A) by default; also off, direction B, token (parked → track) and the board-swap late look
    var pres = ['', '&presence=off', '&presence=B', '&presence=token', '', '&presence=track,B&late=swap'][run % 6];
    await page.goto(url + '?tutorial=0' + (run === 0 ? '&skin=A' : '') + pres);
    await page.fill('#inSeed', String(1000 + run));
    if (run % 2 === 0) {
      await page.click('#bStart');
      for (var k = 0; k < 120; k++) {
        if (await page.$('#act-end')) break;
        if (run === 0) { var vt = await page.textContent('#stage'); if (grammar.test(vt)) errors.push('skin grammar (intro): ' + vt.slice(0, 160)); }
        if (run === 2 && SHOTS && (await page.$('.vn-questions .qcard')) && !fs.existsSync(path.join(shotDir, '02-vn-intro-questions.png'))) await shot('02-vn-intro-questions', { wait: 800 });
        var ch = await page.$('.vn-choices button'); if (ch) { await ch.click(); continue; }
        var nx = await page.$('#bNext'); if (nx) { await nx.click(); continue; }
        await page.waitForTimeout(50);
      }
    } else { await page.click('#bSkip'); await page.click('#bGo'); }
    assert(await page.$('#act-end'), 'reached the encounter');
    await page.waitForTimeout(2700); // night banner
    var hasTrack = !!(await page.$('#approach')), hasNext = !!(await page.$('#nextEvent'));
    assert(hasTrack === (pres !== '&presence=off') && hasNext === hasTrack, 'Approach track + next event shown iff presence on (' + pres + ')');
    if (/B/.test(pres)) assert(/zmora/.test(await page.getAttribute('#approach', 'data-tip')), 'direction B names the zmora');
    if (run === 3) await shot('09-encounter-1280');
    if (run === 1) { // debug panel (key D) shows the state, then hide it again
      await page.keyboard.press('d'); assert(/seed <b>1001/.test(await page.innerHTML('#debug')), 'debug panel');
      if (SHOTS) await shot('21-debug-panel', { wait: 200 }); await page.keyboard.press('d');
    }
    var guard = 0;
    while (await page.$('#act-end')) {
      if (++guard > 140) throw new Error('stuck run ' + run);
      if (run === 0) { var et = await page.textContent('#stage'); if (grammar.test(et)) errors.push('skin grammar (board): ' + et.slice(0, 160)); }
      var disc = await page.$('[data-discard]'); if (disc) { await disc.click(); continue; }
      if (await page.$('#rollDone')) { if (run === 3 && SHOTS && !fs.existsSync(path.join(shotDir, '11-roll-result.png'))) await shot('11-roll-result', { wait: 300 }); await page.click('#rollDone'); continue; }
      if (await page.$('#rollGo')) {
        var adds = await page.$$('[data-commit]'); if (adds.length && guard % 2) await adds[0].click();
        var hp = await page.$('[data-help]:not([disabled])'); if (hp && run % 3 === 1) await hp.click();
        if (run === 3 && SHOTS && !fs.existsSync(path.join(shotDir, '10-roll-dialog.png'))) await shot('10-roll-dialog', { wait: 300 });
        await page.click('#rollGo'); await page.waitForTimeout(150); continue;
      }
      var st = await page.evaluate(function () { var S = window.__game.state; return { a: S.actionsLeft, pov: S.pov, c1: S.c1, p: S.pressure, phase: S.phase, play: S.hand.filter(function (id) { return window.__game.canPlay(id).ok; }) }; });
      if (st.phase !== 'actions') break;
      if (st.a <= 0) { await page.click('#act-end'); await page.waitForTimeout(150); continue; }
      var r = (guard * 7 + run * 3) % 10;
      if (st.play.length && r < 3) {
        var cid = st.play[guard % st.play.length];
        if (r === 0) { // drag to play (HTML5 drag events with a real DataTransfer)
          var dt = await page.evaluateHandle(function () { return new DataTransfer(); });
          await page.dispatchEvent('#card-' + cid, 'dragstart', { dataTransfer: dt });
          assert(await page.$eval('#dropPlay', function (e) { return e.classList.contains('show'); }), 'drop zone shows while dragging');
          await page.dispatchEvent('#dropPlay', 'dragover', { dataTransfer: dt });
          await page.dispatchEvent('#dropPlay', 'drop', { dataTransfer: dt });
          dragPlays++;
        }
        else { await page.click('#card-' + cid); await page.click('#zoomPlay'); }
      } else if (st.c1 > 0 || st.p >= 4 || r === 3) await page.click('#act-steady');
      else if (r === 4 && st.pov < 2 && run % 4 !== 0) await clickZone(['house', 'yard', 'treeline'][st.pov + 1]);
      else if (r === 5 && st.pov > 0) await clickZone(['house', 'yard', 'treeline'][st.pov - 1]);
      else if (r === 9) await page.click('#act-end');
      else await page.click('#act-investigate');
      await page.waitForTimeout(120);
    }
    // dawn
    await page.waitForSelector('#dawnDone');
    if (run === 3) await shot('12-dawn');
    var picks = run % 3 === 2 ? [] : ['T3', 'T1', 'T2'];
    for (var q of picks) { await page.click('.dq[data-q="' + q + '"]'); }
    if (await page.$eval('#dawnDone', function (b) { return b.disabled; })) { for (var q2 of picks) { var on = await page.$('.dq.on[data-q="' + q2 + '"]'); if (on) await on.click(); } }
    await page.click('#dawnDone');
    // outro VN → results
    for (var m = 0; m < 60 && !(await page.$('#bAgain')); m++) {
      if (run === 3 && m === 0) await shot('13-outro-vn');
      if (run === 0) { var ot = await page.textContent('#stage'); if (grammar.test(ot)) errors.push('skin grammar (outro): ' + ot.slice(0, 160)); }
      await page.click('#bNext'); await page.waitForTimeout(40);
    }
    assert(await page.$('#bAgain'), 'results screen');
    if (run === 3) await shot('14-results');
    var oc = await page.evaluate(function () { return window.__game.state.result.outcome; });
    outcomes[oc] = (outcomes[oc] || 0) + 1;
    var bad = await brokenImages(); assert(!bad.length, 'images load: ' + bad.join(', '));
  }
  // stats
  var nRuns = await page.evaluate(function () { return JSON.parse(localStorage.getItem(CONFIG.statsStorageKey) || '[]').length; });
  assert(nRuns >= 12, 'runs saved: ' + nRuns);
  await page.click('#bStats2'); await page.click('#sCopyC'); await page.waitForTimeout(200);
  var csv = await page.inputValue('#sOut'), header = csv.split('\n')[0];
  ['progressEarned', 'threadsResolved', 'escapedTogether', 'finalPressure', 'helpsUsed', 'c1BondChange', 'keyChoice', 'outcome', 'outcomeScene', 'roundsPlayed', 'playsVsCommits', 'rules', 'tutorial', 'perRound', 'unusedActions', 'presenceMode', 'presenceDirection', 'presenceByNight', 'presenceVisits', 'presenceVisitsBlocked', 'barHeldForVisit', 'offeringsPlayed', 'comfortPushes', 'searchPulls'].forEach(function (f) { assert(header.split(',').indexOf(f) >= 0, 'CSV has ' + f); });
  await shot('15-stats');
  await page.click('#ovClose');
  // how to play + menu
  await page.goto(url + '?seed=5&tutorial=0'); await page.click('#bSkip'); await page.click('#bGo'); await page.waitForTimeout(2700);
  await page.click('#btnMenu'); await shot('16-menu', { wait: 200 });
  await page.click('#mHow'); await page.waitForTimeout(200);
  assert(/Something is circling the cottage/.test(await page.textContent('#overlayBox')), 'How to play panel');
  await shot('17-how-to-play');
  // ---------- 3) renames, mono icons, layout boxes, 1920 ----------
  await page.goto(url + '?seed=5&tutorial=0&terms=TERM_QUESTIONS:Secrets,TERM_DREAD:Fear&icons=mono');
  await page.click('#bSkip'); await page.click('#bGo'); await page.waitForTimeout(2700);
  var tips = await page.$$eval('[data-tip]', function (e) { return e.map(function (x) { return x.getAttribute('data-tip'); }).join(' '); });
  assert(/Fear: /.test(tips), 'one-line rename (?terms=) flows into tooltips');
  assert(await page.evaluate(function () { return document.body.classList.contains('iconsMono'); }), 'one-colour icon switch');
  await shot('18-icons-mono-renamed');
  await page.goto(url + '?seed=5&tutorial=0&layout=1'); await page.click('#bSkip'); await page.click('#bGo'); await page.waitForTimeout(2700);
  await shot('19-layout-boxes-check');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(url + '?seed=5&tutorial=0'); await page.click('#bSkip'); await page.click('#bGo'); await page.waitForTimeout(2700);
  await page.click('#card-' + (await page.evaluate(function () { return window.__game.state.hand[0]; }))); await page.waitForTimeout(200);
  await shot('20-encounter-1920-card-zoom', { wait: 0 });
  var bad2 = await brokenImages(); assert(!bad2.length, 'images load at 1920');

  // ---------- 4) v0.3 The Approach ----------
  await page.goto(url + '?seed=5&tutorial=0'); await page.click('#bSkip'); await page.click('#bGo'); await page.waitForTimeout(2700);
  await page.hover('#nextEvent'); await page.waitForTimeout(500);
  assert(await page.$('#zoom.nezoom'), 'next event zooms on hover');
  await shot('24-approach-track-next-event', { wait: 0 });
  // search preview + Comfort preview carry the Presence lines
  await page.evaluate(function () { var S = window.__game.state; S.pov = 2; window.__ui.renderEncounter(); });
  assert(/closer/.test(await page.getAttribute('#act-investigate', 'data-tip')), 'Treeline Search tip has the Presence line');
  assert(/turns the domowik back/.test(await page.getAttribute('#act-steady', 'data-tip')), 'Comfort tip has the Presence line');
  await page.click('#act-investigate'); await page.waitForTimeout(300); assert(await page.$('#presencePreview'), 'roll dialog previews the Presence step'); await page.click('#rollCancel');
  // visit warning + late nights (sky cross-fade)
  await page.evaluate(function () { var g = window.__game, S = g.state; S.round = 5; S.presence.pos = 2; S.pov = 0; window.__ui.renderEncounter(); });
  await page.waitForTimeout(2800);
  assert(await page.$('#visitWarn') && await page.$('#lateBanner') && await page.$('#skyLate.on'), 'visit warning, late banner, late sky');
  await shot('25-visit-warning-late-nights', { wait: 0 });
  // v0.3.1 barSavesForVisit: a Bar up + visit coming -> warning and tooltips say the Bar is saved for the visit
  await page.evaluate(function () { var g = window.__game, S = g.state; S.bars = 1; S.presence.pos = 2; var i = S.events.indexOf('footsteps'); if (i >= 0) S.events.splice(i, 1); S.events.unshift('footsteps'); window.__ui.renderEncounter(); });
  assert(/saved for the visit/.test(await page.textContent('#visitWarn')), 'visit warning: Bar saved for the visit');
  assert(/saved for the visit/.test(await page.getAttribute('#door', 'data-tip')) && /saved for the visit/.test(await page.getAttribute('#nextEvent', 'data-tip')), 'Bar + next-event tooltips: saved for the visit');
  await shot('29-bar-saved-for-visit', { wait: 0 });
  // a visit: Window + successful Treeline Search
  await page.evaluate(function () { var g = window.__game, S = g.state; S.pov = 2; S.bars = 0; S.torch = 9; S.actionsLeft = 2; S.c1 = 0; g.investigate({ roll: 1 }); window.__ui.renderEncounter(); });
  await page.waitForSelector('.nightBanner.visit', { timeout: 6000 });
  assert(/The domowik is at the Door/i.test(await page.textContent('.nightBanner.visit')), 'visit banner with Zosia\'s door line');
  await shot('26-visit-banner', { wait: 300 });
  await page.goto(url + '?seed=5&tutorial=0&presence=B'); await page.click('#bSkip'); await page.click('#bGo'); await page.waitForTimeout(2700);
  await page.click('#btnMenu'); await page.click('#mHow'); await page.waitForTimeout(200);
  assert(/zmora/.test(await page.textContent('#howPresence')), 'How to play explains the Presence (B)');
  // v0.3.1: one-line tease, and the WHAT IT IS writer notes (Questions spoiler) are never rendered
  var md = fs.readFileSync(path.join(__dirname, '..', 'docs/copy/v03-approach-copy-zosia.md'), 'utf8');
  var WHATS = md.split('\n').filter(function (l) { return /^WHAT IT IS:/.test(l); }).map(function (l) { return l.replace(/^WHAT IT IS:\s*/, ''); })
    .reduce(function (a, l) { return a.concat(l.split(' / ')); }, []).map(function (l) { return l.replace(/COMPANION 1/g, ''); });
  assert(WHATS.length === 4, 'found the 4 WHAT IT IS sentences in the copy doc');
  async function noWhatItIs(where) {
    var txt = await page.evaluate(function () { return document.body.innerText + ' ' + Array.prototype.map.call(document.querySelectorAll('[data-tip]'), function (e) { return e.getAttribute('data-tip'); }).join(' '); });
    WHATS.forEach(function (w) { var frag = w.slice(-50); assert(txt.indexOf(frag) < 0, 'WHAT IT IS not rendered (' + where + '): ' + frag); });
  }
  assert(/Something walks barefoot around the cottage at night, looking for a way in\./.test(await page.textContent('#howPresence')), 'How to play tease (B)');
  var breadB = await page.evaluate(function () { var h = document.createElement('div'); h.innerHTML = window.__ui.cardHTML('bread', { w: 340 }).replace(/<img[^>]*>/g, ''); /* text only: no image loads to abort on navigation */ return { eff: h.querySelector('.c-effect').textContent, flav: h.querySelector('.c-flav').textContent }; });
  assert(/(^|\s)Dread −1 and the zmora goes back to the Treeline\.$/.test(breadB.eff.trim()) && breadB.flav.trim() === 'Promise it bread in the morning', 'Bread and Salt text (B): ' + JSON.stringify(breadB));
  BREAD_SEEN.B = breadB.eff.trim();
  await noWhatItIs('How to play B');
  await shot('27-how-to-play-presence-B');
  await page.click('#ovClose');
  await page.goto(url + '?seed=5&tutorial=0&presence=A'); await page.click('#bSkip'); await page.click('#bGo'); await page.waitForTimeout(2700);
  await page.click('#btnMenu'); await page.click('#mHow'); await page.waitForTimeout(200);
  assert(/Something small walks the edge of the house at night\./.test(await page.textContent('#howPresence')), 'How to play tease (A)');
  await noWhatItIs('How to play A'); await page.click('#ovClose');
  // Bread and Salt shows exactly the final text (effect; flavour by direction) in the hand and in the full card
  var breadA = await page.evaluate(function () { var h = document.createElement('div'); h.innerHTML = window.__ui.cardHTML('bread', { w: 340 }).replace(/<img[^>]*>/g, ''); /* text only: no image loads to abort on navigation */ return { eff: h.querySelector('.c-effect').textContent, flav: h.querySelector('.c-flav').textContent }; });
  assert(/(^|\s)Dread −1 and the domowik goes back to the Treeline\.$/.test(breadA.eff.trim()) && breadA.flav.trim() === 'Leave bread and salt by the stove', 'Bread and Salt text (A): ' + JSON.stringify(breadA));
  BREAD_SEEN.A = breadA.eff.trim();
  // tour step 8 line: A / B with Bread and Salt; Presence off deals Kompot and keeps the Kompot line
  var tourPlay = {};
  // Bread and Salt with the Presence off (no creature: generic term) and with a Dread rename via ?terms=
  for (var bq of [['off', '?presence=off', /(^|\s)Dread −1 and the Presence goes back to the Treeline\.$/], ['terms', '?terms=TERM_DREAD:Fear', /(^|\s)Fear −1 and the domowik goes back to the Treeline\.$/]]) {
    await page.goto(url + bq[1]); await page.waitForTimeout(150);
    var bt = await page.evaluate(function () { var h = document.createElement('div'); h.innerHTML = window.__ui.cardHTML('bread', { w: 340 }).replace(/<img[^>]*>/g, ''); /* text only: no image loads to abort on navigation */ return h.querySelector('.c-effect').textContent.trim(); });
    assert(bq[2].test(bt), 'Bread and Salt text (' + bq[0] + '): ' + bt); BREAD_SEEN[bq[0]] = bt;
  }
  for (var tp of ['A', 'B', 'off']) {
    await page.goto(url + '?presence=' + tp); await page.waitForTimeout(150);
    tourPlay[tp] = await page.evaluate(function () { var st = window.__ui.STEPS.filter(function (x) { return x.id === 'play'; })[0]; return { card: st.allow[0], voice: st.voice, n: window.__ui.STEPS.length, hasP: window.__ui.STEPS.some(function (x) { return x.id === 'presence'; }) }; });
  }
  assert(tourPlay.A.card === 'card-bread' && tourPlay.A.voice === "{C2}: Bread and salt, by the stove. The {HOST} says that's how you say please here.", 'tour step 8 line A');
  assert(tourPlay.B.card === 'card-bread' && tourPlay.B.voice === '{POV}: [whispering] Bread and salt in the morning. I promise. [beat] I mean it.', 'tour step 8 line B');
  assert(tourPlay.off.card === 'card-kompot' && /^\{C2\}: Drink\./.test(tourPlay.off.voice), 'tour step 8 with Presence off keeps the Kompot line');
  assert(tourPlay.off.n === 10 && !tourPlay.off.hasP && tourPlay.A.n === 11 && tourPlay.A.hasP, 'Presence tour step only when the Presence is on (11 vs 10 steps)');
  await page.goto(url + '?seed=5&tutorial=0&presence=off'); await page.click('#bSkip'); await page.click('#bGo'); await page.waitForTimeout(2700);
  assert(!(await page.$('#approach')) && (await page.$('#card-kompot') || true), 'presence off = v0.2 board');
  await shot('28-presence-off-v02');
  var bad3 = await brokenImages(); assert(!bad3.length, 'images load (v0.3)');

  console.log('Bread and Salt rendered:', JSON.stringify(BREAD_SEEN));
  assert(dragPlays > 0, 'some cards were played by drag'); console.log('UI runs: 12 + tutorial. Outcomes seen:', JSON.stringify(outcomes), '· runs saved', nRuns, '· drag plays', dragPlays);
  if (errors.length) { console.log('ERRORS:\n' + errors.join('\n')); process.exitCode = 1; } else console.log('UI CLICK-THROUGH PASSED (no console errors)');
  await browser.close();
})().catch(function (e) { console.error(e); process.exit(1); });
