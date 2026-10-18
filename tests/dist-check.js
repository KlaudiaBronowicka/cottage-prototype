/* Single-file dist check + screenshot: NODE_PATH=... node tests/dist-check.js. v0.4 run to an end screen, then the v0.3.2 build (?v04=0). */
var { chromium } = require('playwright-core');
(async () => {
  var b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  var p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  var errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error'||m.type()==='warning') errs.push(m.text()); });
  var D = 'file://' + require('path').resolve(__dirname, '..') + '/dist/cottage-prototype.html';
  await p.goto(D + '?seed=3&tutorial=0'); await p.click('#bStart'); await p.waitForTimeout(2800);
  await p.click('#act-investigate'); await p.click('#rollGo'); await p.click('#rollDone');
  await p.screenshot({ path: require('path').resolve(__dirname, '..') + '/screenshots/v04-22-bundle-single-file.png' });
  for (let i=0;i<40 && !(await p.$('#endScreen'));i++){ if (await p.$('[data-discard]')) await p.click('[data-discard]'); else if (await p.$('#act-end')) await p.click('#act-end'); await p.waitForTimeout(120);}
  if (!(await p.$('#endScreen'))) errs.push('v0.4 dist: no end screen');
  var bad = await p.$$eval('img', is => is.filter(i => i.complete && i.naturalWidth === 0).length);
  var n = await p.$$eval('img', is => is.length);
  await p.goto(D + '?seed=3&tutorial=0&v04=0'); await p.click('#bSkip'); await p.click('#bGo'); await p.waitForTimeout(2800);
  await p.click('#act-investigate'); await p.click('#rollGo'); await p.click('#rollDone');
  bad += await p.$$eval('img', is => is.filter(i => i.complete && i.naturalWidth === 0).length); n += await p.$$eval('img', is => is.length);
  console.log('dist: imgs', n, 'broken', bad, 'errors', errs.length ? errs : 'none'); if (bad || errs.length) process.exitCode = 1; else console.log('DIST CHECK PASSED');
  await b.close();
})();
