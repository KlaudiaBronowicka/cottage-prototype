/* Single-file dist check + screenshot 22: NODE_PATH=... node tests/dist-check.js */
var { chromium } = require('playwright-core');
(async () => {
  var b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  var p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  var errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error'||m.type()==='warning') errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve(__dirname, '..') + '/dist/cottage-prototype.html?seed=3&tutorial=0');
  await p.click('#bSkip'); await p.click('#bGo'); await p.waitForTimeout(2800);
  await p.click('#act-investigate'); await p.click('#rollGo'); await p.click('#rollDone');
  for (let i=0;i<8;i++){ if (await p.$('[data-discard]')) await p.click('[data-discard]'); else if (await p.$('#act-end')) await p.click('#act-end'); await p.waitForTimeout(100);} 
  var bad = await p.$$eval('img', is => is.filter(i => i.complete && i.naturalWidth === 0).length);
  var n = await p.$$eval('img', is => is.length);
  await p.screenshot({ path: require('path').resolve(__dirname, '..') + '/screenshots/22-bundle-single-file.png' });
  console.log('dist: imgs', n, 'broken', bad, 'errors', errs.length ? errs : 'none'); if (bad || errs.length) process.exitCode = 1; else console.log('DIST CHECK PASSED');
  await b.close();
})();
