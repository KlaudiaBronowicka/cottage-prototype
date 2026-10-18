/* v0.4 "Stripped Core" browser click-through (playwright-core + Chrome):
 *   NODE_PATH=/path/to/node_modules node tests/ui-playwright-v04.js [chromePath] [--shots]
 * - intro: Zosia's final copy verbatim (neutral; line 3 swaps only for ?presence=A|B), Goal line from config
 * - the 10-step tutorial end to end (blocked controls, safe rolls, handoff modal), then play out to an end screen
 * - Skip tutorial (corner button), Look Closer / Shortcut area pick, all 3 end screens with Ola's art
 * - every <img> loads; 0 console errors / warnings. --shots writes screenshots/v04-*.png */
'use strict';
var path = require('path'), fs = require('fs');
var { chromium } = require('playwright-core');
var args = process.argv.slice(2), SHOTS = args.indexOf('--shots') >= 0;
var exe = args.filter(function (a) { return a[0] !== '-'; })[0] || '/usr/bin/google-chrome';
var root = path.resolve(__dirname, '..'), url = 'file://' + path.join(root, 'index.html'), shotDir = path.join(root, 'screenshots');
var UT = require('../data/ui-text.js'), CONFIG = require('../config.js');
function assert(c, m) { if (!c) throw new Error('ASSERT: ' + m); }
var LINE2 = 'Your car died at the edge of the forest, and the only shelter is an empty cottage.', LINE3 = 'Your friends have gone for help. They won\'t be back until morning.';
var CRE = { neutral: 'Something is walking out by the trees. You can\'t fight it, but you can learn what it wants and keep it from the door.',
  A: 'Something small is walking the edge of the house. You can\'t fight it, but you can learn what it wants and keep it from the door.',
  B: 'Something is walking barefoot around the cottage. You can\'t fight it, but you can learn what it wants and keep it from the door.' };
var GOAL = 'Goal: Find ' + CONFIG.v04.clueGoal + ' Clues before dawn (' + CONFIG.rounds + ' hours). Don\'t let Dread reach ' + CONFIG.pressureMax + '.';

(async function () {
  var browser = await chromium.launch({ executablePath: exe, headless: true });
  var ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  var page = await ctx.newPage(), errors = [], n = 0;
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error' || m.type() === 'warning') errors.push('console: ' + m.text()); });
  page.on('requestfailed', function (r) { errors.push('request failed: ' + r.url()); });
  page.on('dialog', function (d) { d.accept(); });
  async function shot(name) { if (!SHOTS) return; await page.mouse.move(1, 1); await page.waitForTimeout(500); await page.screenshot({ path: path.join(shotDir, 'v04-' + name + '.png') }); }
  async function broken() { return page.$$eval('img', function (is) { return is.filter(function (i) { return i.complete && i.naturalWidth === 0; }).map(function (i) { return i.src; }); }); }
  async function coach() { return (await page.textContent('#coachBubble')) || ''; }
  async function st() { return page.evaluate(function () { var S = window.__game.state; return { clues: S.progress, dread: S.pressure, pos: S.presence.pos, hour: S.round, phase: S.phase, a: S.actionsLeft, pov: S.pov, hand: S.hand.slice() }; }); }
  async function playOut() { for (var k = 0; k < 60; k++) { var s = await st(); if (s.phase === 'done') return; if (s.phase === 'discard') { await page.click('[data-discard]'); continue; } await page.click('#act-end'); await page.waitForTimeout(150); } }

  // 1) intro copy: neutral, then A / B
  for (var d of ['', 'A', 'B']) {
    await page.goto(url + '?seed=7' + (d ? '&presence=' + d : ''));
    var lines = await page.$$eval('#introText p', function (ps) { return ps.map(function (p) { return p.textContent; }); });
    assert(await page.textContent('#introTitle') === 'The Cottage', 'intro title');
    assert(lines[0] === LINE2 && lines[1] === LINE3 && lines[2] === CRE[d || 'neutral'], 'intro lines (' + (d || 'neutral') + '): ' + JSON.stringify(lines));
    assert(lines[3] === GOAL, 'Goal line: ' + lines[3]);
    assert(!/PLACEHOLDER/i.test(await page.textContent('#introText')), 'no placeholder marker');
    n++;
  }
  await page.goto(url + '?seed=7'); await shot('01-intro');
  assert(/v0\.4/.test(await page.textContent('.buildtag')), 'build label v0.4');

  // 2) the 10-step tutorial
  await page.goto(url + '?seed=7&tutorial=1'); await page.click('#bStart'); await page.waitForTimeout(2800);
  assert(await page.$('#skipTut'), 'Skip tutorial corner button'); assert(!(await page.$('#questions')), 'no Questions row'); assert(!(await page.$('#tok-C1')), 'no companions');
  assert(/Hour 1 of 6/.test(await page.textContent('#nightCounter')), 'Hour counter: ' + await page.textContent('#nightCounter'));
  await shot('02-tutorial-step1');
  for (var i = 0; i < 3; i++) await page.click('#coachNext');
  assert(/Step 4 of 10/.test(await coach()), 'step 4');
  await page.click('#act-move', { force: true }); assert(/Step 4 of 10/.test(await coach()), 'blocked control keeps step 4');
  await page.click('#act-investigate'); await page.waitForTimeout(300); await shot('03-tutorial-search');
  await page.click('#rollGo'); await page.waitForTimeout(200); assert(!(await page.$('#rollResult')), 'Roll blocked until the card is added');
  await page.click('[data-commit="rummage"]'); await page.click('#rollGo'); await page.waitForTimeout(500);
  assert(/success|clue/i.test(await page.textContent('#rollResult')), 'guided roll is safe');
  await page.click('#rollDone'); await page.waitForTimeout(300); assert(/Step 5 of 10/.test(await coach()), 'step 5');
  await page.click('#act-move'); await page.click('#zone-yard', { force: true }); await page.waitForTimeout(400);
  assert(/Step 6 of 10/.test(await coach()), 'step 6'); await page.click('#act-end'); await page.waitForTimeout(3000);
  assert(/Step 7 of 10/.test(await coach()), 'step 7'); await shot('04-tutorial-hour2'); await page.click('#coachNext');
  await page.click('#act-investigate'); await page.click('[data-commit="shortcut"]'); await page.click('#rollGo'); await page.waitForTimeout(400); await page.click('#rollDone'); await page.waitForTimeout(300);
  assert(/Step 9 of 10/.test(await coach()), 'step 9');
  await page.click('#card-bread'); await page.waitForTimeout(300); await page.click('#zoomPlay'); await page.waitForTimeout(500);
  assert(/Step 10 of 10/.test(await coach()), 'step 10 handoff'); await shot('05-tutorial-handoff');
  var s1 = await st(); assert(s1.clues === 3 && s1.dread === 1 && s1.pos === 0, 'after the guided Hours: 3 clues, Dread 1, creature on the Treeline: ' + JSON.stringify(s1));
  await page.click('#coachNext'); await page.waitForTimeout(300);
  assert(await page.$eval('#coach', function (e) { return e.classList.contains('hidden'); }), 'coach gone after the handoff'); assert(!(await page.$('#skipTut')), 'Skip gone');
  await playOut(); await page.waitForTimeout(500);
  assert(await page.$('#endScreen'), 'end screen'); await shot('06-end-after-tutorial'); n++;

  // 3) Skip tutorial from the corner, Look Closer / Shortcut area pick
  await page.goto(url + '?seed=21&tutorial=1'); await page.click('#bStart'); await page.waitForTimeout(2800);
  await page.click('#skipTut'); await page.waitForTimeout(300);
  assert(await page.$eval('#coach', function (e) { return e.classList.contains('hidden'); }), 'skip closes the coach');
  await page.evaluate(function () { var S = window.__game.state; ['lookCloser', 'shortcut'].forEach(function (id) { [S.deck, S.discard, S.hand].forEach(function (a) { var i = a.indexOf(id); if (i >= 0) a.splice(i, 1); }); S.hand.push(id); }); window.__ui.renderEncounter(); });
  await page.click('#card-lookCloser'); await page.waitForTimeout(300); await page.click('#zoomPlay'); await page.waitForTimeout(300);
  assert(await page.$('#tray'), 'Look Closer opens the roll window');
  var picks = await page.$$eval('[data-zonepick]', function (b) { return b.length; }), tt = await page.textContent('#tray .tt');
  assert(picks === 0 && /Yard/.test(tt), 'Look Closer from the House: the Yard, no pick (one neighbour): ' + tt);
  await page.click('#rollGo'); await page.waitForTimeout(400); await page.click('#rollDone'); await page.waitForTimeout(300);
  assert((await st()).pov === 0, 'Look Closer does not move you');
  await page.click('#card-shortcut'); await page.waitForTimeout(300); await page.click('#zoomPlay'); await page.waitForTimeout(300); await shot('07-shortcut-pick');
  await page.click('#rollGo'); await page.waitForTimeout(400); await page.click('#rollDone'); await page.waitForTimeout(300);
  assert((await st()).pov === 1, 'Shortcut moves you 1 area');
  // from the Yard: two neighbours → the area pick shows House and Treeline
  await page.evaluate(function () { var S = window.__game.state; S.actionsLeft = 2; var i = S.discard.indexOf('lookCloser'); if (i >= 0) S.discard.splice(i, 1); S.hand.push('lookCloser'); window.__ui.renderEncounter(); });
  await page.click('#card-lookCloser'); await page.waitForTimeout(300); await page.click('#zoomPlay'); await page.waitForTimeout(300);
  var picks2 = await page.$$eval('[data-zonepick]', function (b) { return b.map(function (x) { return x.dataset.zonepick; }); });
  assert(picks2.sort().join() === '0,2', 'Look Closer from the Yard: House or Treeline (got ' + picks2 + ')'); await shot('07b-look-closer-pick');
  await page.click('[data-zonepick="2"]'); await page.waitForTimeout(200); assert(/Treeline/.test(await page.textContent('#tray .tt')), 'picked the Treeline');
  await page.click('#rollGo'); await page.waitForTimeout(400); await page.click('#rollDone'); await page.waitForTimeout(300); n++;

  // 4) all 3 end screens (Ola's art; title + result_line read as the spec line)
  for (var oc of [['win', 31], ['lose_dread', 0], ['lose_short', 0]]) {
    await page.goto(url + '?seed=5&tutorial=0'); await page.click('#bStart'); await page.waitForTimeout(2600);
    await page.evaluate(function (oc) { var g = window.__game, S = g.state; S.progress = oc === 'win' ? 5 : 2; if (oc === 'lose_dread') { S.pressure = 5; } }, oc[0]);
    if (oc[0] === 'lose_dread') { for (var k = 0; k < 10; k++) { var s = await st(); if (s.phase === 'done') break; await page.evaluate(function () { window.__game.state.pressure = 5; }); if (s.phase === 'discard') { await page.click('[data-discard]'); continue; } await page.click('#act-end'); await page.waitForTimeout(150); } }
    else { for (var k2 = 0; k2 < 30; k2++) { var s2 = await st(); if (s2.phase === 'done') break; await page.evaluate(function () { var S = window.__game.state; S.pressure = 0; }); if (s2.phase === 'discard') { await page.click('[data-discard]'); continue; } await page.click('#act-end'); await page.waitForTimeout(150); } }
    await page.waitForTimeout(500);
    var res = await page.getAttribute('#endScreen', 'data-result'); assert(res === oc[0], 'end screen ' + oc[0] + ' got ' + res);
    var bgSrc = await page.getAttribute('.endbg', 'src'); assert(bgSrc && /end\//.test(bgSrc), 'end art ' + bgSrc);
    var line = (await page.textContent('#endTitle')) + ' ' + (await page.textContent('#endResult'));
    var expect = { win: 'Dawn. You made it, with 5 clues.', lose_dread: 'Dread hit 6. The night broke.', lose_short: 'Dawn came, but you only found 2 of 5 clues.' }[oc[0]];
    assert(line === expect, 'end line ' + oc[0] + ': ' + line);
    await shot('08-end-' + oc[0]); n++;
  }
  await page.click('#bTutAgain'); await page.waitForTimeout(400); assert(await page.$('#introPanel') || await page.$('#coachBubble'), 'Play with tutorial goes back in');
  var br = await broken(); assert(!br.length, 'broken images ' + br.join(', '));
  assert(!errors.length, 'console errors:\n' + errors.join('\n'));
  console.log('UI V04 PLAYWRIGHT PASSED (' + n + ' groups; 0 console errors)');
  await browser.close();
})().catch(function (e) { console.error(e); process.exit(1); });
