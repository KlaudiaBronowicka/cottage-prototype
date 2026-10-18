/* v0.4.2 tutorial regression (playwright-core + Chrome), desktop clicks AND phone taps:
 *   NODE_PATH=/path/to/node_modules node tests/tutorial-touch-playwright.js [chromePath] [--shots]
 * Klaudia's bug (v0.4.1, Chrome on Android): step 8 "Search the Yard ... add a magnifier card again" only accepted Shortcut.
 * If Shortcut was already spent (added with Rummage on step 4), Roll did nothing with any other magnifier card: a soft-lock.
 * Per device (1280x720 + 1920x1080 mouse, Pixel 7 portrait + landscape touch):
 *  A) all 10 steps through the UI only (taps on touch), checking every step advances
 *  B) Klaudia's state: Shortcut gone, Sharp Eyes in hand -> add Sharp Eyes, Roll -> step 9
 *  C) no magnifier card at all on step 8 -> Roll still works (never a soft-lock)
 *  D) gate: Roll with nothing added while a magnifier is in hand -> blocked with the generic message
 *  E) guided odds: total 3 vs need 3 shows 100% during the guided Hours (bad faces dimmed), 67% after the handoff
 *  F) step 4: a second card tap swaps the selection (one card per guided roll)
 *  G) coach text: 21px on the 1920 stage (>= 14px on screen at 1280x720 and up), line-height 1.25
 * 0 console errors / warnings. --shots writes screenshots/v042-*.png */
'use strict';
var path = require('path');
var { chromium, devices } = require('playwright-core');
var args = process.argv.slice(2), SHOTS = args.indexOf('--shots') >= 0;
var exe = args.filter(function (a) { return a[0] !== '-'; })[0] || '/usr/bin/google-chrome';
var root = path.resolve(__dirname, '..'), url = 'file://' + path.join(root, 'index.html'), shotDir = path.join(root, 'screenshots');
var UT = require('../data/ui-text.js');
function assert(c, m) { if (!c) throw new Error('ASSERT: ' + m); }
var P7 = devices['Pixel 7'];
var DEVICES = [
  { name: 'desktop-1280', opts: { viewport: { width: 1280, height: 720 } }, touch: false },
  { name: 'desktop-1920', opts: { viewport: { width: 1920, height: 1080 } }, touch: false },
  { name: 'pixel7-portrait', opts: Object.assign({}, P7), touch: true },
  { name: 'pixel7-landscape', opts: Object.assign({}, P7, { viewport: { width: P7.viewport.height, height: P7.viewport.width } }), touch: true }
];

(async function () {
  var browser = await chromium.launch({ executablePath: exe, headless: true }), passed = 0;
  for (var dev of DEVICES) {
    var ctx = await browser.newContext(dev.opts), page = await ctx.newPage(), errors = [];
    page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
    page.on('console', function (m) { if (m.type() === 'error' || m.type() === 'warning') errors.push('console: ' + m.text()); });
    page.on('dialog', function (d) { d.accept(); });
    var tap = async function (sel) { if (dev.touch) await page.tap(sel); else await page.click(sel); await page.waitForTimeout(250); };
    var step = async function () { var t = (await page.textContent('#coachBubble')) || ''; var m = /Step (\d+) of 10/.exec(t); return m ? +m[1] : 0; };
    var expectStep = async function (n, what) { var s = await step(); assert(s === n, dev.name + ': ' + what + ': expected step ' + n + ', got ' + s); };
    var total = async function () { return (await page.textContent('#tray .total')) || ''; };
    var start = async function (seed) { await page.goto(url + '?seed=' + seed + '&tutorial=1'); await tap('#bStart'); await page.waitForTimeout(2800); };
    var toStep8 = async function () {
      for (var i = 0; i < 3; i++) await tap('#coachNext');
      await expectStep(4, 'after 3 Next'); await tap('#act-investigate'); await tap('[data-commit="rummage"]'); await tap('#rollGo'); await page.waitForTimeout(300); await tap('#rollDone');
      await expectStep(5, 'step 4 roll'); await tap('#act-move'); await tap('#zone-yard');
      await expectStep(6, 'move to the Yard'); await tap('#act-end'); await page.waitForTimeout(2800);
      await expectStep(7, 'end Hour 1'); await tap('#coachNext'); await expectStep(8, 'warning Next');
    };
    var setHand = async function (fn) { await page.evaluate(fn); await page.evaluate(function () { window.__ui.renderEncounter(); }); };

    // A) the whole tutorial through the UI, with the coach-font + odds checks on the way
    await start(7);
    var font = await page.evaluate(function () { var b = document.getElementById('coachBubble'), sc = document.getElementById('stage').getBoundingClientRect().width / 1920, out = {};
      ['cstep', 'ctext'].forEach(function (c) { var e = b.querySelector('.' + c); var cs = getComputedStyle(e); out[c] = { screen: parseFloat(cs.fontSize), stage: parseFloat(cs.fontSize) / sc, lh: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) }; }); return out; });
    ['cstep', 'ctext'].forEach(function (c) { assert(Math.abs(font[c].stage - 21) < 0.2, dev.name + ': ' + c + ' is 21px on the stage: ' + JSON.stringify(font[c])); assert(Math.abs(font[c].lh - 1.25) < 0.02, dev.name + ': line-height 1.25'); if (!dev.touch) assert(font[c].screen >= 13.95, dev.name + ': ' + c + ' >= 14 screen px'); });
    for (var i = 0; i < 3; i++) { await expectStep(i + 1, 'tour'); await tap('#coachNext'); }
    await expectStep(4, 'search step'); await tap('#act-investigate');
    // F) one card per guided roll: Rummage, then Shortcut swaps it
    await tap('[data-commit="rummage"]'); await tap('[data-commit="shortcut"]');
    var on = await page.$$eval('#rollAdd .addrow.on', function (es) { return es.map(function (e) { return e.dataset.commit; }); });
    assert(on.length === 1 && on[0] === 'shortcut', dev.name + ': a second tap swaps the guided add: ' + on);
    // E) guided odds are the real (safe) odds: House need 2, total 3 -> 100%; bad faces dimmed
    assert(/about 100%/.test(await total()), dev.name + ': guided odds: ' + await total());
    assert((await page.$$('#tray .face.off')).length === 2, dev.name + ': omen and -1 faces dimmed in a guided roll');
    if (SHOTS && dev.name === 'pixel7-landscape') await page.screenshot({ path: path.join(shotDir, 'v042-02-step4-phone-landscape.png') });
    await tap('#rollGo'); await page.waitForTimeout(300); assert(await page.$('#rollResult'), dev.name + ': step 4 rolled with Shortcut (any magnifier)');
    await tap('#rollDone'); await expectStep(5, 'step 4 done');
    await tap('#act-move'); await tap('#zone-yard'); await expectStep(6, 'moved');
    await tap('#act-end'); await page.waitForTimeout(2800); await expectStep(7, 'Hour 2');
    await tap('#coachNext'); await expectStep(8, 'search2');
    await tap('#act-investigate');
    // D) Roll with nothing added while a magnifier is in hand: blocked, generic message, still step 8
    await tap('#rollGo'); assert(!(await page.$('#rollResult')), dev.name + ': Roll blocked with no card added');
    var toast = await page.evaluate(function () { var t = document.querySelector('.toast.warn'); return t ? t.textContent : ''; });
    assert(toast === 'Add a magnifier card to the roll first, then roll.', dev.name + ': gate message: ' + toast);
    await expectStep(8, 'blocked roll keeps step 8');
    await tap('[data-commit="rummage"]'); assert(/Your total: 3\. Need: 3\. Chance: about 100%/.test(await total()), dev.name + ': step 8 guided odds: ' + await total());
    await tap('#rollGo'); await page.waitForTimeout(300); await tap('#rollDone'); await expectStep(9, 'search2 done');
    await tap('#card-bread'); await tap('#zoomPlay'); await page.waitForTimeout(300); await expectStep(10, 'bread played');
    await tap('#coachNext');
    assert(await page.$eval('#coach', function (e) { return e.classList.contains('hidden'); }), dev.name + ': coach gone after the handoff');
    // E) after the handoff the same numbers show the full bag (4 of 6)
    await setHand(function () { var S = window.__game.state; S.phase = 'actions'; S.actionsLeft = 2; S.pov = 1; S.torch = 0; S.hand = ['luckyFind', 'deepBreath']; });
    await tap('#act-investigate'); await tap('[data-commit="luckyFind"]');
    assert(/Need: 3\. Chance: about 67%/.test(await total()), dev.name + ': normal odds after the tutorial: ' + await total());
    assert((await page.$$('#tray .face.off')).length === 0, dev.name + ': no dimmed faces after the tutorial');

    // B) Klaudia's exact state: Shortcut already spent, Sharp Eyes drawn
    await start(7); await page.evaluate(function () { window.__ui.U.tut.i = 0; });
    for (var k = 0; k < 3; k++) await tap('#coachNext');
    await tap('#act-investigate'); await tap('[data-commit="rummage"]'); await tap('#rollGo'); await page.waitForTimeout(300); await tap('#rollDone');
    await tap('#act-move'); await tap('#zone-yard'); await tap('#act-end'); await page.waitForTimeout(2800); await tap('#coachNext'); await expectStep(8, 'B: search2');
    await setHand(function () { var S = window.__game.state; S.hand = ['bread', 'bar', 'deepBreath', 'sharpEyes']; });
    await tap('#act-investigate'); await tap('[data-commit="sharpEyes"]');
    assert(/Your total: 3\. Need: 3\. Chance: about 100%/.test(await total()), dev.name + ': B odds: ' + await total());
    if (SHOTS && !dev.touch) { await page.mouse.move(1, 1); await page.waitForTimeout(300); }
    if (SHOTS && dev.name === 'desktop-1280') await page.screenshot({ path: path.join(shotDir, 'v042-01-step8-sharp-eyes-fixed-1280.png') });
    if (SHOTS && dev.name === 'pixel7-portrait') await page.screenshot({ path: path.join(shotDir, 'v042-03-step8-sharp-eyes-fixed-phone-portrait.png') });
    await tap('#rollGo'); await page.waitForTimeout(300); assert(await page.$('#rollResult'), dev.name + ': B: Roll works with Sharp Eyes (the v0.4.1 bug)');
    await tap('#rollDone'); await expectStep(9, 'B: Sharp Eyes roll advances');

    // C) no magnifier in hand on step 8: Roll is never blocked
    await start(7); for (var k2 = 0; k2 < 3; k2++) await tap('#coachNext');
    await tap('#act-investigate'); await tap('[data-commit="rummage"]'); await tap('#rollGo'); await page.waitForTimeout(300); await tap('#rollDone');
    await tap('#act-move'); await tap('#zone-yard'); await tap('#act-end'); await page.waitForTimeout(2800); await tap('#coachNext'); await expectStep(8, 'C: search2');
    await setHand(function () { var S = window.__game.state; S.hand = ['bread', 'bar', 'deepBreath', 'warmStove']; });
    await tap('#act-investigate'); await tap('#rollGo'); await page.waitForTimeout(300); assert(await page.$('#rollResult'), dev.name + ': C: Roll works with no magnifier in hand');
    await tap('#rollDone'); await expectStep(9, 'C: advances');

    assert(errors.length === 0, dev.name + ': console errors: ' + errors.join(' | '));
    console.log('PASS ' + dev.name + ' (' + (dev.touch ? 'taps' : 'clicks') + '): A full tutorial, B Klaudia state, C no magnifier, D gate, E odds, F swap, G coach font');
    passed++; await ctx.close();
  }
  await browser.close();
  console.log('tutorial-touch-playwright: ' + passed + '/' + DEVICES.length + ' devices passed, 0 console errors');
})().catch(function (e) { console.error(e); process.exit(1); });
