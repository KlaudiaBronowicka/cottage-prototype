/* =====================================================================
 * ui.js — greybox DOM UI. All rules live in game.js; numbers in config.js;
 * text in data/vn-text.js. This file only renders and routes clicks.
 * ===================================================================== */
(function () {
  'use strict';
  var cfg = CONFIG, TXT = VN_TEXT;
  var qs = new URLSearchParams(location.search);
  var app = document.getElementById('app');
  var dbg = document.getElementById('debug');
  var overlay = document.getElementById('overlay'), overlayBox = document.getElementById('overlayBox');
  var store = new Stats.Store(cfg.statsStorageKey);

  var U = {
    screen: 'title', game: null,
    skin: qs.get('skin') || cfg.defaultSkin,
    seed: qs.get('seed') ? parseInt(qs.get('seed'), 10) : null,
    tester: qs.get('tester') || '',
    choices: { bond: null, key: null, visited: [] },
    steps: [], stepIdx: 0, spotPick: [],
    test: null, alloc: [], msg: null, lastResult: null,
    tStart: 0, tEncounter: 0, saved: false, runId: null
  };
  if (qs.get('debug') === '1') dbg.classList.remove('hidden');

  // ---------- helpers ----------
  function names() { return TXT.SKINS[U.skin] || TXT.SKINS.neutral; }
  function t(s) { return Skin.applySkin(s, names()); } // article-aware slot substitution (skin.js)
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function T(s) { return esc(t(s)); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d; }
  function on(id, fn) { var e = document.getElementById(id); if (e) e.onclick = fn; }
  function icons(arr) { return arr.map(function (i) { return '<span class="icon" title="' + Engine.STAT_OF_ICON[i] + '">' + i + '</span>'; }).join(''); }
  function zoneIdx(id) { for (var i = 0; i < cfg.zones.length; i++) if (cfg.zones[i].id === id) return i; return -1; }
  function newSeed() { return Math.floor(Math.random() * 1e9); }

  // ---------- TITLE ----------
  function renderTitle() {
    U.screen = 'title';
    var skins = Object.keys(TXT.SKINS).map(function (k) { return '<option value="' + k + '"' + (k === U.skin ? ' selected' : '') + '>' + k + (k === 'neutral' ? ' (CAPS slots)' : ' — ' + TXT.SKINS[k].POV) + '</option>'; }).join('');
    app.innerHTML =
      '<div class="panel"><h1>' + T(TXT.title) + '</h1><p class="muted">' + T(TXT.subtitle) + '</p>' +
      '<p>' + T(TXT.encounterGoal) + ' About 20–30 minutes. Your run stats are saved in this browser — please send them with <b>Stats → Download</b> at the end.</p>' +
      '<div class="row"><label>Seed <input id="inSeed" size="12" placeholder="random" value="' + (U.seed != null ? U.seed : '') + '"></label>' +
      '<label>Names <select id="inSkin">' + skins + '</select></label>' +
      '<label>Tester name (optional) <input id="inTester" size="14" value="' + esc(U.tester) + '"></label></div>' +
      '<p><button class="primary" id="bStart">Start (with story intro)</button> <button id="bSkip">Skip intro → straight to the encounter</button></p></div>';
    on('bStart', function () { readTitle(); startIntro(); });
    on('bSkip', function () { readTitle(); renderQuickChoices(); });
    renderDebug();
  }
  function readTitle() {
    var s = document.getElementById('inSeed').value.trim();
    U.seed = s ? (parseInt(s, 10) >>> 0) : newSeed();
    U.skin = document.getElementById('inSkin').value;
    U.tester = document.getElementById('inTester').value.trim();
    U.choices = { bond: null, key: null, visited: [] };
    U.tStart = Date.now(); U.saved = false; U.runId = Date.now().toString(36) + '-' + U.seed;
    document.getElementById('seedLabel').textContent = 'seed ' + U.seed;
  }
  function renderQuickChoices() {
    U.screen = 'quick';
    function opts(key) { return TXT.choices[key].options.map(function (o) { return '<label><input type="radio" name="' + key + '" value="' + o.value + '"' + (o === TXT.choices[key].options[0] ? ' checked' : '') + '> ' + T(o.label) + '</label><br>'; }).join(''); }
    app.innerHTML = '<div class="panel"><h2>Quick setup (skipping the VN)</h2><p><b>' + T(TXT.choices.bond.prompt) + '</b><br>' + opts('bond') + '</p><p><b>' + T(TXT.choices.key.prompt) + '</b><br>' + opts('key') + '</p><button class="primary" id="bGo">Begin the night</button></div>';
    on('bGo', function () {
      U.choices.bond = document.querySelector('input[name=bond]:checked').value;
      U.choices.key = document.querySelector('input[name=key]:checked').value;
      U.choices.visited = ['3a', '3b', '3c'];
      startEncounter();
    });
  }

  // ---------- VN INTRO ----------
  function startIntro() {
    U.screen = 'vn'; U.steps = []; U.stepIdx = 0;
    TXT.intro.forEach(function (sc) {
      if (sc.spots) { U.steps.push({ type: 'spots', scene: sc.scene }); return; }
      (sc.lines || []).forEach(function (l) { U.steps.push({ type: 'line', scene: sc.scene, line: l }); });
      (sc.choices || []).forEach(function (c) { U.steps.push({ type: 'choice', scene: sc.scene, key: c }); });
    });
    U.steps.push({ type: 'toEncounter' });
    renderVN();
  }
  function expandSpots(scene, ids) {
    var add = [];
    ids.forEach(function (id) { var sp = TXT.spots[id]; sp.lines.forEach(function (l) { add.push({ type: 'line', scene: scene + ' — ' + t(sp.label), line: l }); }); });
    U.steps.splice.apply(U.steps, [U.stepIdx, 1].concat(add));
  }
  // [Bracketed] text = stage direction, rendered in italics.
  function dirs(html) { return html.replace(/\[([^\]]*)\]/g, '<em class="dir">$1</em>'); }
  function lineHTML(l) {
    if (l.narr) return '<div class="narr">' + dirs(T(l.narr)) + '</div>';
    return '<div class="who">' + esc(Skin.speaker(l.who, names())) + '</div><div>' + dirs(T(l.text)) + '</div>';
  }
  function renderVN() {
    var st = U.steps[U.stepIdx];
    if (!st) return;
    if (st.type === 'toEncounter') { startEncounter(); return; }
    if (st.type === 'spots') {
      var all = Object.keys(TXT.spots);
      if (!cfg.fasterVariant) { U.choices.visited = all; expandSpots(st.scene, all); return renderVN(); }
      // faster variant: choose N of 3
      app.innerHTML = '<div class="vn"><div class="scene">' + T(st.scene) + '</div><div class="box"><div>Visit ' + cfg.beat3SpotsToVisit + ' of ' + all.length + ' spots. (The skipped spot\'s card is removed from the deck.)</div><div class="choices">' +
        all.map(function (id) { return '<label><input type="checkbox" class="spot" value="' + id + '"> ' + T(TXT.spots[id].label) + '</label><br>'; }).join('') +
        '</div><div class="nav"><button class="primary" id="bSpots">Go</button></div></div></div>';
      on('bSpots', function () {
        var ids = Array.prototype.map.call(document.querySelectorAll('.spot:checked'), function (x) { return x.value; });
        if (ids.length !== cfg.beat3SpotsToVisit) { alert('Pick exactly ' + cfg.beat3SpotsToVisit + '.'); return; }
        U.choices.visited = ids; expandSpots(st.scene, ids); renderVN();
      });
      return;
    }
    if (st.type === 'choice') {
      var ch = TXT.choices[st.key];
      app.innerHTML = '<div class="vn"><div class="scene">' + T(st.scene) + '</div><div class="box"><div class="who">Choice</div><div>' + T(ch.prompt) + '</div><div class="choices">' +
        ch.options.map(function (o, i) { return '<button data-i="' + i + '">' + T(o.label) + '</button>'; }).join('') + '</div></div></div>';
      Array.prototype.forEach.call(app.querySelectorAll('.choices button'), function (b) {
        b.onclick = function () {
          var o = ch.options[+b.dataset.i]; U.choices[st.key] = o.value;
          if (o.after) U.steps.splice(U.stepIdx + 1, 0, { type: 'line', scene: st.scene, line: { narr: o.after } });
          U.stepIdx++; renderVN();
        };
      });
      return;
    }
    app.innerHTML = '<div class="vn"><div class="scene">' + T(st.scene) + '</div><div class="box">' + lineHTML(st.line) +
      '<div class="nav"><button id="bSkipVN">Skip to choices</button><button class="primary" id="bNext">Next ▸</button></div></div></div>';
    on('bNext', function () { U.stepIdx++; renderVN(); });
    on('bSkipVN', function () {
      // jump to the next choice (or the encounter), still expanding spots
      for (var i = U.stepIdx + 1; i < U.steps.length; i++) { var ty = U.steps[i].type; if (ty === 'choice' || ty === 'toEncounter' || ty === 'spots') { U.stepIdx = i; break; } }
      renderVN();
    });
    document.getElementById('bNext').focus();
  }

  // ---------- ENCOUNTER ----------
  function startEncounter() {
    U.game = Engine.createGame(cfg, { seed: U.seed, bond: U.choices.bond || 'C1', key: U.choices.key || 'SHARED', visited: U.choices.visited.length ? U.choices.visited : ['3a', '3b', '3c'] });
    U.tEncounter = Date.now(); U.test = null; U.alloc = []; U.msg = null; U.lastResult = null; U.saved = false;
    window.__game = U.game; // handy for playtest debugging in the console
    U.screen = 'encounter';
    renderEncounter();
  }

  function band(p) { for (var i = 0; i < TXT.pressureBands.length; i++) { var b = TXT.pressureBands[i]; if (p >= b.min && p <= b.max) return t(b.text); } return ''; }

  function renderEncounter() {
    var G = U.game, S = G.state;
    if (S.phase === 'allocate') return renderAllocate();
    if (S.phase === 'done') return renderOutro();
    var n = names();
    var track = ''; for (var p = 0; p <= cfg.pressureMax; p++) track += '<span class="' + (p === S.pressure ? 'on ' : '') + (p === cfg.pressureMax ? 'max' : '') + '">' + p + '</span>';
    var ev = S.lastEvent, evDef = cfg.events.filter(function (e) { return e.id === ev.id; })[0];
    var zones = cfg.zones.map(function (z, i) {
      var toks = '';
      if (S.pov === i) toks += '<span class="tok pov">' + esc(n.POV) + '</span>';
      if (S.c1 === i) toks += '<span class="tok c1">' + esc(n.C1) + '</span>';
      if (i === 0) toks += '<span class="tok">' + esc(n.C2) + '</span>';
      return '<div class="zone' + (S.pov === i ? ' here' : '') + '"><b>' + z.name + '</b> <span class="muted">Investigate ' + z.investigateDifficulty + ' → +' + z.progress + ' progress' + (i === cfg.zones.length - 1 ? ' · end round here: pressure +1' : '') + '</span><div>' + toks + '</div></div>';
    }).join('');
    var threads = cfg.threads.map(function (th) { return '<div class="thread"><b>' + th.id + ' · ' + th.name + '</b> — cost ' + th.cost + '<br><span class="muted">' + T(TXT.threads[th.id]) + '</span></div>'; }).join('');
    var helps = ['c1', 'c2'].map(function (w) {
      var h = cfg.helps[w];
      return '<div>' + esc(w === 'c1' ? n.C1 : n.C2) + ' Help: <b>' + (S.helps[w].used ? 'used' : 'ready') + '</b> (+' + G.helpBonus(w) + ' to ' + h.stats.join('/') + (h.onlyInHouse ? ', only while she is in the House' : '') + ')</div>';
    }).join('');
    var inDiscard = S.phase === 'discard';
    var hand = S.hand.map(function (id) {
      var c = G.card(id), can = G.canPlay(id);
      var btn = inDiscard ? '<button data-discard="' + id + '">Discard</button>'
        : '<button data-play="' + id + '"' + (can.ok ? '' : ' disabled title="' + esc(can.why) + '"') + '>Play (1 action)</button>' + (can.ok || can.why === 'no action' ? '' : '<div class="muted">' + esc(can.why) + '</div>');
      return '<div class="card"><div class="nm">' + T(c.name) + '</div><div class="ic">' + icons(c.icons) + '</div><div class="fx">' + T(c.text) + '</div><div class="fl">' + T(c.flavour) + '</div>' + btn + '</div>';
    }).join('') || '<span class="muted">No cards in hand.</span>';
    var a = S.phase === 'actions' && S.actionsLeft > 0;
    var inHouse = S.pov === zoneIdx(cfg.holdDoorZone);
    var moves = '';
    if (S.pov > 0) moves += '<button id="aIn"' + (a ? '' : ' disabled') + '>Move → ' + cfg.zones[S.pov - 1].name + '</button>';
    if (S.pov < cfg.zones.length - 1) moves += '<button id="aOut"' + (a ? '' : ' disabled') + '>Move → ' + cfg.zones[S.pov + 1].name + '</button>';

    app.innerHTML =
      '<div class="panel"><div class="row"><div class="col">' +
        '<span class="stat">Round <b>' + S.round + '</b>/' + cfg.rounds + '</span>' +
        '<span class="stat">Actions left <b>' + S.actionsLeft + '</b></span>' +
        '<span class="stat">Progress <b>' + S.progress + '</b></span>' +
        '<span class="stat">Bar <b>' + (S.bars ? 'DOWN' : 'none') + '</b></span>' +
        (S.torch ? '<span class="stat">Torch <b>-' + S.torch + '</b></span>' : '') +
        '<span class="stat muted">Deck ' + S.deck.length + ' · discard ' + S.discard.length + '</span>' +
      '</div><div><h3>Pressure</h3><div class="track">' + track + '</div><div class="muted">' + esc(band(S.pressure)) + '</div></div></div></div>' +
      '<div class="panel event"><b>Night ' + S.round + ': ' + esc(evDef.name) + '</b>' + (ev.cancelled ? ' — <span class="good">cancelled by a Bar</span>' : '') + '<br><span class="muted">' + T(TXT.events[ev.id] || '') + '</span></div>' +
      (U.msg ? '<div class="panel ' + (U.msg.kind || '') + '">' + esc(U.msg.text) + '</div>' : '') +
      (U.lastResult ? '<div class="panel result">' + esc(U.lastResult) + '</div>' : '') +
      '<div class="panel"><div class="zones">' + zones + '</div></div>' +
      '<div class="panel actions"><h3>' + (inDiscard ? 'Hand over limit — discard down to ' + cfg.handLimit : 'Actions') + '</h3>' +
        (inDiscard ? '' :
        moves +
        '<button id="aInv"' + (a ? '' : ' disabled') + '>Investigate ' + cfg.zones[S.pov].name + ' (INSIGHT ' + Math.max(0, cfg.zones[S.pov].investigateDifficulty - S.torch) + ')</button>' +
        '<button id="aSteady"' + (a ? '' : ' disabled') + '>Steady (CARE ' + cfg.steadyDifficulty + ')</button>' +
        '<button id="aHold"' + (a && inHouse && (cfg.barsStack || !S.bars) ? '' : ' disabled title="' + (!inHouse ? 'House only' : (!cfg.barsStack && S.bars) ? 'A Bar is already down (max 1)' : 'No action left') + '"') + '>Hold the door (NERVE ' + cfg.holdDoorDifficulty + ')</button>' +
        (!cfg.barsStack && S.bars ? '<span class="muted"> A Bar is down: the next Night event is cancelled. Bars don\'t stack, so Hold the door and Mother\'s Rule are unavailable until it is used.</span>' : '') +
        '<button id="aDraw"' + (a && S.deck.length ? '' : ' disabled') + '>Draw 1</button>' +
        '<button id="aEnd" class="primary">' + (S.actionsLeft > 0 ? 'End round (pass ' + S.actionsLeft + ')' : 'End round ▸') + '</button>') +
      '</div>' +
      '<div class="panel"><h3>Hand (' + S.hand.length + '/' + cfg.handLimit + ') — Play for the effect (1 action) or commit to a test for icons (free)</h3><div class="cards">' + hand + '</div></div>' +
      '<div class="row"><div class="panel col"><h3>Threads (pay at the end)</h3>' + threads + '</div><div class="panel col"><h3>Companion Help (once each)</h3>' + helps + '</div></div>';

    on('aIn', function () { act(G.move(S.pov - 1)); });
    on('aOut', function () { act(G.move(S.pov + 1)); });
    on('aInv', function () { openTest({ kind: 'investigate', stat: 'INSIGHT', zone: S.pov }); });
    on('aSteady', function () { openTest({ kind: 'steady', stat: 'CARE' }); });
    on('aHold', function () { openTest({ kind: 'holdDoor', stat: 'NERVE' }); });
    on('aDraw', function () { act(G.drawAction()); });
    on('aEnd', function () { U.lastResult = null; act(G.endRound()); });
    Array.prototype.forEach.call(app.querySelectorAll('[data-play]'), function (b) { b.onclick = function () { playCard(b.dataset.play); }; });
    Array.prototype.forEach.call(app.querySelectorAll('[data-discard]'), function (b) { b.onclick = function () { act(G.discardDown(b.dataset.discard)); }; });
    renderDebug();
  }

  function act(res) {
    U.msg = res && !res.ok ? { kind: 'warn', text: res.error } : null;
    if (res && res.test) U.lastResult = describeTest(res.test);
    renderEncounter();
  }
  function describeTest(r) {
    var tok = r.star ? 'STAR' : (r.token >= 0 ? '+' + r.token : String(r.token));
    return r.label + ' — ' + r.stat + ' vs ' + r.difficulty + '\n' +
      'base ' + r.base + ' + icons ' + r.icons + ' + help ' + r.help + ' + draw ' + tok + ' (d6 rolled ' + r.roll + ') = ' + (r.star ? 'auto-fail' : r.total) + '\n' +
      (r.star ? '✶ STAR: automatic fail, pressure +' + cfg.starPressure : r.strong ? 'STRONG SUCCESS' : r.success ? 'Success' : 'Fail');
  }

  function playCard(id) {
    var G = U.game, c = G.card(id);
    if (c.effect === 'investigateYardFromHouse') return openTest({ kind: 'play', cardId: id, stat: 'INSIGHT', zone: 1 });
    if (c.effect === 'investigateAnyZone') return openTest({ kind: 'play', cardId: id, stat: 'INSIGHT', zone: U.game.state.pov, chooseZone: true });
    if (c.effect === 'readyHelp') {
      var S = G.state, used = ['c1', 'c2'].filter(function (w) { return S.helps[w].used; });
      if (used.length > 1) {
        var w = confirm('Ready ' + names().C1 + "'s Help? (Cancel = " + names().C2 + "'s)") ? 'c1' : 'c2';
        return act(G.play(id, { helpToReady: w }));
      }
      return act(G.play(id, { helpToReady: used[0] }));
    }
    act(G.play(id));
  }

  // ---------- Test panel (commit cards + Help before the draw) ----------
  function openTest(o) {
    U.test = { kind: o.kind, stat: o.stat, cardId: o.cardId, zone: o.zone, chooseZone: o.chooseZone, commits: [], helps: [] };
    renderTest();
  }
  function testDifficulty() {
    var G = U.game, S = G.state, x = U.test;
    if (x.kind === 'steady') return cfg.steadyDifficulty;
    if (x.kind === 'holdDoor') return cfg.holdDoorDifficulty;
    return Math.max(0, cfg.zones[x.zone].investigateDifficulty - S.torch);
  }
  function renderTest() {
    var G = U.game, S = G.state, x = U.test, n = names();
    var icon = Engine.ICON_OF_STAT[x.stat];
    var label = x.kind === 'play' ? G.card(x.cardId).name : ({ investigate: 'Investigate', steady: 'Steady', holdDoor: 'Hold the door' })[x.kind];
    var cards = S.hand.filter(function (id) { return id !== x.cardId; }).map(function (id) {
      var c = G.card(id), m = c.icons.filter(function (i) { return i === icon; }).length, sel = x.commits.indexOf(id) >= 0;
      return '<div class="card' + (sel ? ' sel' : '') + '"><div class="nm">' + T(c.name) + '</div><div class="ic">' + icons(c.icons) + '</div><div class="fx muted">' + T(c.text) + '</div><div>+' + m + ' to this test</div><button data-c="' + id + '">' + (sel ? 'Un-commit' : 'Commit') + '</button></div>';
    }).join('') || '<span class="muted">No cards to commit.</span>';
    var helps = ['c1', 'c2'].map(function (w) {
      var e = G.helpEligible(w, x.stat), sel = x.helps.indexOf(w) >= 0;
      return '<label' + (e.ok ? '' : ' class="muted"') + '><input type="checkbox" data-h="' + w + '"' + (sel ? ' checked' : '') + (e.ok ? '' : ' disabled') + '> ' + esc(w === 'c1' ? n.C1 : n.C2) + ' Help ' + (e.ok ? '+' + e.bonus + ' ' + T(TXT.helpLines[w]) : '(' + esc(e.why) + ')') + '</label><br>';
    }).join('');
    var zoneSel = x.chooseZone ? '<p>Zone: ' + cfg.zones.map(function (z, i) { return '<label><input type="radio" name="tz" value="' + i + '"' + (i === x.zone ? ' checked' : '') + '> ' + z.name + ' (' + z.investigateDifficulty + ' → +' + z.progress + ')</label> '; }).join('') + '</p>' : '';
    var diff = testDifficulty();
    var pv = G.previewTest(x.stat, diff, x.commits, x.helps);
    overlay.classList.remove('hidden');
    overlayBox.innerHTML = '<h2>' + T(label) + ' — ' + x.stat + ' test, difficulty ' + diff + '</h2>' + zoneSel +
      '<p>Total = base ' + pv.base + ' + icons ' + pv.icons + ' + help ' + pv.help + ' = <b>' + pv.preDraw + '</b> before the draw. ' +
      'Draw (d6): 1–3 = 0 · 4 = −1 · 5 = +1 · 6 = STAR (fail, pressure +' + cfg.starPressure + '). Strong success at ' + (diff + cfg.strongMargin) + '+.</p>' +
      '<h3>Commit cards (free, discarded; matching ' + icon + ' icons count)</h3><div class="cards">' + cards + '</div>' +
      '<h3>Help</h3>' + helps +
      '<p><button class="primary" id="tGo">Draw &amp; resolve</button> <button id="tCancel">Cancel</button></p>';
    Array.prototype.forEach.call(overlayBox.querySelectorAll('[data-c]'), function (b) {
      b.onclick = function () { var i = x.commits.indexOf(b.dataset.c); if (i >= 0) x.commits.splice(i, 1); else x.commits.push(b.dataset.c); renderTest(); };
    });
    Array.prototype.forEach.call(overlayBox.querySelectorAll('[data-h]'), function (b) {
      b.onchange = function () { var i = x.helps.indexOf(b.dataset.h); if (i >= 0) x.helps.splice(i, 1); else x.helps.push(b.dataset.h); renderTest(); };
    });
    Array.prototype.forEach.call(overlayBox.querySelectorAll('input[name=tz]'), function (b) { b.onchange = function () { x.zone = +b.value; renderTest(); }; });
    on('tCancel', function () { closeOverlay(); U.test = null; });
    on('tGo', function () {
      var p = { commits: x.commits.slice(), helps: x.helps.slice() }, res;
      if (x.kind === 'investigate') res = G.investigate(p);
      else if (x.kind === 'steady') res = G.steady(p);
      else if (x.kind === 'holdDoor') res = G.holdDoor(p);
      else { p.zone = x.zone; res = G.play(x.cardId, p); }
      closeOverlay(); U.test = null; act(res);
    });
  }
  function closeOverlay() { overlay.classList.add('hidden'); overlayBox.innerHTML = ''; }

  // ---------- Allocation ----------
  function renderAllocate() {
    U.screen = 'allocate';
    var G = U.game, S = G.state;
    var v = G.validateAllocation(U.alloc);
    var cost = 0; U.alloc.forEach(function (id) { cost += cfg.threads.filter(function (x) { return x.id === id; })[0].cost; });
    var head = S.endReason === 'pressure' ? '<p class="bad">' + T(TXT.earlyEnd) + '</p><p>Pressure reached ' + cfg.pressureMax + ': you may resolve at most ' + cfg.maxThreadsIfPressureMaxed + ' Thread.</p>' : '<p>' + T(TXT.dawn) + '</p>';
    var threads = cfg.threads.map(function (th) {
      var sel = U.alloc.indexOf(th.id) >= 0;
      return '<div class="thread' + (sel ? ' on' : '') + '"><label><input type="checkbox" data-t="' + th.id + '"' + (sel ? ' checked' : '') + '> <b>' + th.id + ' · ' + th.name + '</b> — cost ' + th.cost + '</label><br><span class="muted">' + T(TXT.threads[th.id]) + '</span></div>';
    }).join('');
    app.innerHTML = '<div class="panel"><h2>' + (S.endReason === 'pressure' ? 'The night breaks' : 'Dawn') + '</h2>' + head +
      '<p>Progress: <b>' + S.progress + '</b> · selected cost: <b>' + cost + '</b> · unspent progress is lost. Escaped together: <b>' + (G.escapedTogether() ? 'Y' : 'N') + '</b> (needed for all three).</p>' +
      threads + (v.ok ? '' : '<p class="warn">' + esc(v.error) + '</p>') +
      '<button class="primary" id="bResolve"' + (v.ok ? '' : ' disabled') + '>Resolve ' + (U.alloc.length ? U.alloc.join(' + ') : 'nothing') + '</button></div>';
    Array.prototype.forEach.call(app.querySelectorAll('[data-t]'), function (b) {
      b.onchange = function () { var i = U.alloc.indexOf(b.dataset.t); if (i >= 0) U.alloc.splice(i, 1); else U.alloc.push(b.dataset.t); renderAllocate(); };
    });
    on('bResolve', function () { var r = G.allocate(U.alloc); if (r.ok) renderOutro(); else { U.msg = { text: r.error }; renderAllocate(); } });
    renderDebug();
  }

  // ---------- OUTRO ----------
  function renderOutro() {
    U.screen = 'outro';
    var G = U.game, S = G.state, R = S.result, o = TXT.outcomes[R.outcome];
    if (!U.saved) {
      var now = Date.now();
      store.add(Stats.buildRecord(G, { runId: U.runId, skin: U.skin, tester: U.tester, outcomeScene: o.title, encounterSeconds: Math.round((now - U.tEncounter) / 1000), totalSeconds: Math.round((now - U.tStart) / 1000) }));
      U.saved = true;
    }
    var lines = o.lines.map(function (l) { return '<div class="box">' + lineHTML(l) + '</div>'; }).join('');
    var ins = R.inserts.map(function (k) { return TXT.inserts[k].map(function (l) { return '<div class="box">' + lineHTML(l) + '</div>'; }).join(''); }).join('');
    var flags = [['Threads resolved', R.threadsResolved.join(', ') || 'none'], ['Escaped together', R.escapedTogether], ['Final pressure', R.finalPressure],
      ['Help used', R.helpsUsed.join(', ') || 'none'], [names().C1 + ' bond change (encounter)', (R.c1BondChange > 0 ? '+' : '') + R.c1BondChange], ['Beat 4 bond', R.bondChoice],
      ['Final bond ' + names().C1 + ' / ' + names().C2, R.finalBondC1 + ' / ' + R.finalBondC2], ['Key choice', R.keyChoice],
      ['Progress earned / at end / lost', S.progressEarned + ' / ' + R.progressAtEnd + ' / ' + R.progressLost], ['Rounds played', S.roundsPlayed + (S.endReason === 'pressure' ? ' (early end)' : ' (dawn)')],
      ['Plays vs commits', S.stats.plays + ' vs ' + S.stats.commits]];
    app.innerHTML = '<div class="vn"><div class="scene">' + esc(o.title) + '</div>' + (o.placeholder ? '<div class="box warn">Placeholder scene: final text to come from the Narrative Writer.</div>' : '') + lines + (ins ? '<div class="scene" style="margin-top:10px">Inserts</div>' + ins : '') + '</div>' +
      '<div class="panel"><h3>Flags out</h3><table>' + flags.map(function (f) { return '<tr><th>' + esc(f[0]) + '</th><td>' + esc(f[1]) + '</td></tr>'; }).join('') + '</table>' +
      '<p class="muted">This run was saved to Stats (' + store.all().length + ' run(s) in this browser).</p>' +
      '<p><button class="primary" id="bAgain">Play again (new seed)</button> <button id="bSame">Replay same seed</button> <button id="bStats2">Stats / send results</button></p></div>';
    on('bAgain', function () { U.seed = null; renderTitle(); });
    on('bSame', function () { renderTitle(); });
    on('bStats2', openStats);
    renderDebug();
  }

  // ---------- Stats panel ----------
  function openStats() {
    var runs = store.all(), sm = Stats.summary(runs);
    var cols = ['finishedAt', 'tester', 'seed', 'outcome', 'endReason', 'roundsPlayed', 'progressEarned', 'threadsResolved', 'escapedTogether', 'finalPressure', 'helpsUsed', 'c1BondChange', 'keyChoice', 'playsVsCommits', 'encounterSeconds'];
    overlay.classList.remove('hidden');
    overlayBox.innerHTML = '<h2>Run stats (this browser)</h2>' +
      '<p>Runs: <b>' + sm.runs + '</b> · outcomes: ' + esc(JSON.stringify(sm.outcomes)) + ' · avg progress earned ' + sm.avgProgressEarned + ' · avg final pressure ' + sm.avgFinalPressure +
      ' · escaped together ' + sm.escapedY + '/' + sm.runs + ' · early ends ' + sm.early + ' · threads T1/T2/T3 ' + sm.threadRate.T1 + '/' + sm.threadRate.T2 + '/' + sm.threadRate.T3 + ' · plays/commits ' + sm.plays + '/' + sm.commits + '</p>' +
      '<div style="overflow:auto"><table><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>' +
      runs.slice().reverse().map(function (r) { return '<tr>' + cols.map(function (c) { return '<td>' + esc(r[c] == null ? '' : r[c]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' +
      '<p><button id="sCopyJ">Copy JSON</button> <button id="sCopyC">Copy CSV</button> <button id="sDlJ">Download JSON</button> <button id="sDlC">Download CSV</button> <button id="sClear">Clear all stats</button> <button class="primary" id="sClose">Close</button></p>' +
      '<p class="muted">Send the downloaded file (or pasted text) to the studio. Stats stay only in this browser.</p><textarea id="sOut" readonly placeholder="Copied text appears here too, in case clipboard access is blocked."></textarea>';
    function copy(txt) {
      document.getElementById('sOut').value = txt;
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { flash('Copied.'); }, function () { flash('Clipboard blocked — select the text below.'); });
      else flash('Select the text below and copy it.');
    }
    function dl(txt, name, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    function stamp() { return new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'); }
    on('sCopyJ', function () { copy(Stats.toJSON(store.all())); });
    on('sCopyC', function () { copy(Stats.toCSV(store.all())); });
    on('sDlJ', function () { dl(Stats.toJSON(store.all()), 'cottage-runs-' + stamp() + '.json', 'application/json'); });
    on('sDlC', function () { dl(Stats.toCSV(store.all()), 'cottage-runs-' + stamp() + '.csv', 'text/csv'); });
    on('sClear', function () { if (confirm('Delete all saved runs in this browser?')) { store.clear(); openStats(); } });
    on('sClose', closeOverlay);
  }
  function flash(m) { var o = document.getElementById('sOut'); if (o) o.placeholder = m; var b = document.createElement('div'); b.className = 'muted'; b.textContent = m; overlayBox.appendChild(b); setTimeout(function () { b.remove(); }, 2500); }

  function openRules() {
    overlay.classList.remove('hidden');
    overlayBox.innerHTML = '<h2>Quick rules</h2><ul>' +
      '<li><b>Goal:</b> ' + T(TXT.encounterGoal) + ' Dawn comes after round ' + cfg.rounds + '. If pressure reaches ' + cfg.pressureMax + ', ' + T('{C1}') + ' walks out and it ends at once.</li>' +
      '<li><b>Each round:</b> a Night event, then ' + cfg.actionsPerRound + ' actions (Move, Investigate, Steady, Hold the door [House only], Play a card, Draw). End: +1 pressure for you and for ' + T('{C1}') + ' if in the Treeline; draw 1; hand limit ' + cfg.handLimit + '.</li>' +
      '<li><b>Tests:</b> ' + cfg.testBase + ' + matching icons on committed cards + Help + a d6 draw (1–3: 0, 4: −1, 5: +1, 6: STAR = fail and +1 pressure). Ties succeed. Beat it by ' + cfg.strongMargin + ' for a strong success.</li>' +
      '<li><b>Cards:</b> Play for the effect (costs an action) OR commit to a test for icons (free). Never both.</li>' +
      '<li><b>At the end:</b> spend progress to resolve Threads (full cost). All three also need you to escape together.</li></ul><button class="primary" id="rClose">Close</button>';
    on('rClose', closeOverlay);
  }

  // ---------- Debug panel ----------
  function renderDebug() {
    if (dbg.classList.contains('hidden')) return;
    var G = U.game;
    var html = '<b>DEBUG</b> · screen ' + U.screen + ' · skin ' + U.skin + ' · build ' + esc(cfg.version) + '<br>';
    if (G) {
      var S = G.state;
      html += 'seed <b>' + S.seed + '</b> · phase ' + S.phase + ' · round ' + S.round + '/' + cfg.rounds + ' · actions ' + S.actionsLeft + '<br>' +
        'pressure ' + S.pressure + ' (max seen ' + S.maxPressureSeen + ', maxed ' + S.pressureMaxed + ') · progress ' + S.progress + ' (earned ' + S.progressEarned + ')<br>' +
        'POV ' + cfg.zones[S.pov].name + ' · C1 ' + cfg.zones[S.c1].name + ' (brought back ' + S.c1BroughtBack + ') · bars ' + S.bars + ' · torch ' + S.torch + ' · silence ' + S.silence + '<br>' +
        'helps c1 ' + (S.helps.c1.used ? 'used' : 'ready') + ' / c2 ' + (S.helps.c2.used ? 'used' : 'ready') + ' · bond ' + S.flags.bond + ' · key ' + S.flags.key + '<br>' +
        'hand [' + S.hand.join(', ') + ']<br>deck [' + S.deck.join(', ') + ']<br>discard [' + S.discard.join(', ') + ']<br>' +
        'night deck [' + S.events.join(', ') + '] · seen [' + S.eventsSeen.join(', ') + ']<br>' +
        'plays ' + S.stats.plays + ' · commits ' + S.stats.commits + ' · tests ' + S.stats.tests + ' (ok ' + S.stats.testSuccesses + ', stars ' + S.stats.stars + ')<br>' +
        (S.phase === 'allocate' ? 'legal allocations: ' + G.legalAllocations().map(function (a) { return '[' + a.join('+') + ']'; }).join(' ') + '<br>' : '') +
        (S.result ? 'result ' + esc(JSON.stringify(S.result)) + '<br>' : '') +
        '<div class="log">' + S.log.slice().reverse().map(function (l) { return '<div class="' + l.kind + '">R' + l.round + ' ' + esc(l.text) + '</div>'; }).join('') + '</div>';
    } else html += 'No encounter yet.';
    dbg.innerHTML = html;
  }
  function toggleDebug() { dbg.classList.toggle('hidden'); renderDebug(); }

  on('btnDebug', toggleDebug);
  on('btnStats', openStats);
  on('btnRules', openRules);
  on('btnRestart', function () { if (U.screen === 'title' || confirm('Restart? The current run will not be saved.')) { closeOverlay(); U.game = null; U.seed = null; document.getElementById('seedLabel').textContent = ''; renderTitle(); } });
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'd' || e.key === 'D') toggleDebug();
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) { closeOverlay(); U.test = null; }
  });

  renderTitle();
})();
