/* Card sheet screenshot 23 (full frame + hand variant, live text): NODE_PATH=... node tools/card-sheet.js */
var { chromium } = require('playwright-core');
(async () => {
  var b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  var p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + require('path').resolve(__dirname, '..') + '/index.html?tutorial=0');
  await p.evaluate(() => {
    var ids = Engine.effectiveConfig(CONFIG).deck.map(c => c.id);
    var h = document.createElement('div'); h.style.cssText = 'position:fixed;inset:0;z-index:999;background:#0c0e11;display:flex;flex-wrap:wrap;gap:14px;padding:14px;align-content:flex-start';
    h.innerHTML = ids.map(id => window.__ui.cardHTML(id, { w: 250 })).join('') + '<div style="flex-basis:100%"></div>' + ids.map(id => window.__ui.cardHTML(id, { w: 190, cls: 'compact', variant: 'hand' })).join('') + ['T1','T2','T3'].map(q => window.__ui.questionCardHTML(q, { w: 250, have: 2 })).join('');
    document.body.appendChild(h);
  });
  await p.waitForTimeout(800);
  await p.screenshot({ path: require('path').resolve(__dirname, '..') + '/screenshots/23-all-cards-live-text.png' });
  await b.close();
})();
