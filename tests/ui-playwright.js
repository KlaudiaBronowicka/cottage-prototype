/* Optional browser click-through test (not needed to play the game).
 * Needs playwright-core and a Chrome binary:
 *   NODE_PATH=/path/to/node_modules node tests/ui-playwright.js [chromePath]
 * Clicks through intro → encounter → allocation → outcome → stats for several seeds. */
'use strict';
var path = require('path');
var { chromium } = require('playwright-core');
var exe = process.argv[2] || '/usr/bin/google-chrome';
var url = 'file://' + path.resolve(__dirname, '..', 'index.html');

(async function () {
  var browser = await chromium.launch({ executablePath: exe, headless: true });
  var ctx = await browser.newContext({ acceptDownloads: true });
  var page = await ctx.newPage();
  var errors = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('dialog', function (d) { d.accept(); });
  var outcomes = {};
  for (var run = 0; run < 12; run++) {
    await page.goto(url + (run === 0 ? '?debug=1&skin=A' : ''));
    await page.fill('#inSeed', String(1000 + run));
    if (run % 2 === 0) {
      await page.click('#bStart');
      for (var i = 0; i < 80; i++) {
        if (await page.$('#inSeed')) break;
        if (await page.$('.zones')) break;
        if (run === 0) { var vt = await page.textContent('#app'); if (/\b[Tt]he (Hania|Ola|Kinga|Wanda|Irena)\b|\bthe the\b/i.test(vt)) errors.push('skin grammar (intro): ' + vt.slice(0, 120)); }
        var choice = await page.$('.choices button');
        if (choice) { await choice.click(); continue; }
        var next = await page.$('#bNext');
        if (next) { await next.click(); continue; }
      }
    } else {
      await page.click('#bSkip');
      await page.click('#bGo');
    }
    if (run === 0) await page.screenshot({ path: path.resolve(__dirname, 'screenshot-encounter.png'), fullPage: true });
    // encounter loop
    for (var step = 0; step < 400; step++) {
      if (await page.$('#bResolve')) break;
      if (await page.isVisible('#tGo')) {
        // commit the first commit-able card sometimes
        var c = await page.$('#overlayBox [data-c]'); if (c && step % 2) await c.click();
        await page.click('#tGo'); continue;
      }
      var disc = await page.$('[data-discard]'); if (disc) { await disc.click(); continue; }
      var btns = await page.$$('#app .actions button:not([disabled]), #app [data-play]:not([disabled])');
      if (!btns.length) break;
      var b = btns[(step * 7 + run) % btns.length];
      await b.click();
    }
    if (run === 0) await page.screenshot({ path: path.resolve(__dirname, 'screenshot-allocate.png'), fullPage: true });
    // allocation: some runs resolve nothing (to reach Outcome 3/3b); others try T3 then T1 when affordable
    for (var t of (run % 3 === 2 ? [] : ['T3', 'T1'])) {
      await page.click('[data-t="' + t + '"]');
      if (await page.isDisabled('#bResolve')) await page.click('[data-t="' + t + '"]');
    }
    await page.click('#bResolve');
    await page.waitForSelector('#bAgain');
    var title = await page.textContent('.vn .scene');
    var vnText = await page.textContent('.vn');
    if (run === 0 && /\b[Tt]he (Hania|Ola|Kinga|Wanda|Irena)\b|\bthe the\b/i.test(vnText)) errors.push('skin grammar (outro): ' + title);
    if (/\[|\]/.test(vnText)) errors.push('unrendered [stage direction] brackets in outro: ' + title);
    if (/Dawn, Together/.test(title) && !(await page.$('.vn em.dir'))) errors.push('3b stage directions not italic');
    outcomes[title] = (outcomes[title] || 0) + 1;
    if (run === 0) await page.screenshot({ path: path.resolve(__dirname, 'screenshot-outro.png'), fullPage: true });
  }
  // stats panel + downloads
  await page.click('#btnStats');
  var dl = page.waitForEvent('download'); await page.click('#sDlC'); var f = await dl;
  var csvPath = path.resolve(__dirname, 'sample-stats.csv'); await f.saveAs(csvPath);
  var dl2 = page.waitForEvent('download'); await page.click('#sDlJ'); var f2 = await dl2; await f2.saveAs(path.resolve(__dirname, 'sample-stats.json'));
  var csvText = require('fs').readFileSync(csvPath, 'utf8');
  var rows = csvText.trim().split('\n').length - 1;
  ['progressEarned','threadsResolved','escapedTogether','finalPressure','helpsUsed','c1BondChange','keyChoice','outcomeScene','roundsPlayed','plays','commits','playsVsCommits']
    .forEach(function (c) { if (csvText.split('\n')[0].split(',').indexOf(c) < 0) errors.push('CSV missing ' + c); });
  await page.click('#sClose');
  await page.click('#btnRestart');
  await browser.close();
  console.log('UI runs finished. Outcomes seen:', JSON.stringify(outcomes));
  console.log('Stats CSV rows:', rows);
  if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
  if (rows !== 12) { console.error('expected 12 stats rows'); process.exit(1); }
  console.log('UI CLICK-THROUGH PASSED');
})().catch(function (e) { console.error(e); process.exit(1); });
