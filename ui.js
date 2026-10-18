/* =====================================================================
 * ui.js — DOM UI for the cottage encounter. Rules: game.js. Numbers: config.js.
 * Every player-facing word: data/ui-text.js (UI) and data/vn-text.js (story).
 * Art: assets/manifest.js (generated). Positions: data/board-layout.js.
 * The encounter is drawn on a 1920x1080 stage that scales to the window.
 * ===================================================================== */
(function () {
  'use strict';
  var TXT = VN_TEXT, UT = UI_TEXT, A = ASSET_MANIFEST, BL = BOARD_LAYOUT;
  // v0.4 art (Ola layout v3) retired the moons, Questions, Help portraits and zone plates: the v0.3.2 build falls back to greyboxes
  if (!A.questions) A.questions = { layout: BL.legacy.questionLayout, bg: {}, icon: {} };
  A.helps = A.helps || {}; A.helpSlots = A.helpSlots || BL.legacy.helpSlots; A.moons = A.moons || []; A.hours = A.hours || [];
  A.board.plates = A.board.plates || {}; A.board.plateSlots = A.board.plateSlots || BL.legacy.plateSlots; A.board.zoneStrips = A.board.zoneStrips || {};
  var qs = new URLSearchParams(location.search);
  // v0.4 Stripped Core: CONFIG.v04.enabled (default ON); ?v04=0 = the v0.3.2 build, ?v04=1 forces v0.4
  var V4CFG = Object.assign({}, CONFIG.v04 || {}, { enabled: qs.get('v04') ? qs.get('v04') === '1' : !!(CONFIG.v04 && CONFIG.v04.enabled) });
  // v0.3 The Approach: ?presence=off|track|token and/or A|B (comma-separated, e.g. ?presence=track,B) override the Presence config
  // (v0.4: ?footprints=1 = Tomek's footprint fallback)
  var PURL = {};
  (qs.get('presence') || '').split(',').forEach(function (v) { v = v.trim(); if (/^(off|track|token)$/i.test(v)) PURL.mode = v.toLowerCase(); else if (/^[AB]$/i.test(v)) PURL.direction = v.toUpperCase(); });
  if (/^(overlay|swap|none)$/.test(qs.get('late') || '')) PURL.lateBoard = qs.get('late');
  if (V4CFG.enabled && qs.get('footprints') === '1') PURL.footprints = true;
  var cfg = Object.assign({}, CONFIG, { v04: V4CFG, presenceUrl: PURL });
  if (V4CFG.enabled) cfg.statsStorageKey = CONFIG.statsStorageKey.replace(/\.v1$/, '') + '.v04'; // v0.4 runs (and the tutorial-done flag) kept apart from v0.3 runs
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; // FX: show a single frame
  var stage = document.getElementById('stage'), wrap = document.getElementById('stageWrap');
  var layer = document.getElementById('layer');           // screen-pixel layer: tooltip, zoom, toasts
  var dbg = document.getElementById('debug');
  var overlay = document.getElementById('overlay'), overlayBox = document.getElementById('overlayBox');
  var coach = document.getElementById('coach');
  var store = new Stats.Store(cfg.statsStorageKey);
  var TUT_KEY = cfg.statsStorageKey + '.tutorialDone';
  var ECFG = Engine.effectiveConfig(cfg);                // config with the rule flags applied (for the UI before a game exists)
  var V4 = !!ECFG.v04on, PCFG = ECFG.presence;
  // direction: v0.3 = A unless B is set; v0.4 = neutral "the creature" unless ?presence=A|B (or CONFIG.v04.presence.direction) is set
  var PDIR = UT.presence.dirs[PCFG.direction] ? PCFG.direction : (V4 ? null : 'A');
  var PT = PDIR ? UT.presence.dirs[PDIR] : UT.v04.neutralDir;

  // URL overrides: ?skin=A ?seed=1 ?debug=1 ?icons=mono ?tutorial=0|1 ?terms=TERM_QUESTIONS:Secrets,TERM_DREAD:Fear ?layout=1
  var TERMS = Object.assign({}, UT.terms, V4 ? UT.v04.terms : {}, ECFG.presenceMode !== 'off' ? PT.terms : {});
  (qs.get('terms') || '').split(',').forEach(function (p) { var i = p.indexOf(':'); if (i > 0) TERMS[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  var ICON_STYLE = qs.get('icons') || cfg.iconStyle;

  var U = {
    screen: 'title', game: null,
    skin: qs.get('skin') || cfg.defaultSkin,
    seed: qs.get('seed') ? parseInt(qs.get('seed'), 10) : null,
    tester: qs.get('tester') || '',
    wantTutorial: qs.get('tutorial') ? qs.get('tutorial') === '1' : !safeGet(TUT_KEY),
    choices: { bond: null, key: null, visited: [] },
    steps: [], stepIdx: 0, revealed: [],
    tray: null, moveMode: false, pinned: null, alloc: [], lastRound: 0, feedSeen: 0,
    hints: ECFG.hintsNight2, tut: null, tutInfo: null,
    tStart: 0, tEncounter: 0, saved: false, runId: null, outroSteps: null, outroIdx: 0
  };
  if (qs.get('debug') === '1') dbg.classList.remove('hidden');
  if (qs.get('layout') === '1') document.body.classList.add('showLayout');
  if (ICON_STYLE === 'mono') document.body.classList.add('iconsMono');

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }

  // ---------- text ----------
  function names() { return TXT.SKINS[U.skin] || TXT.SKINS.neutral; }
  function cap(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function term(k) { return TERMS[k] != null ? TERMS[k] : '⟦' + k + '⟧'; }
  /** fill a string-table template: {t.KEY} {T.KEY} {#n:SING:PLUR} {var} then character slots via skin.js */
  function GV() { var G = U && U.game ? U.game.cfg : ECFG; return { max: G.pressureMax, goal: G.clueGoal, total: G.rounds, late: (G.presence || {}).lateFromNight }; } // config numbers every template may use
  function fmt(s, v) {
    v = Object.assign(GV(), v || {});
    s = String(s == null ? '' : s)
      .replace(/\{#(\w+):(\w+):(\w+)\}/g, function (m, n, a, b) { return term(+v[n] === 1 ? a : b); })
      .replace(/\{([tT])\.(\w+)\}/g, function (m, c, k) { var x = term(k); return c === 'T' ? cap(x) : x; })
      .replace(/\{([a-z]\w*)\}/g, function (m, k) { return k in v ? v[k] : m; });
    return Skin.applySkin(s, names());
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function dirs(html) { return html.replace(/\[([^\]]*)\]/g, '<em class="dir">$1</em>'); } // [stage direction] → italics
  function dig(o, path) { path.split('.').forEach(function (k) { o = o == null ? o : o[k]; }); return o; }
  function L(path) {
    var o = V4 ? dig(UT.v04.overrides, path) : null;          // v0.4 overrides
    if (o == null && V4 && /^cards\./.test(path)) o = dig(UT.v04, path); // v0.4 card text
    if (o == null && PON()) o = dig(UT.presence.overrides, path); // v0.3 overrides while the Presence is on
    if (o == null) o = dig(UT, path);
    if (typeof o === 'string' && o.indexOf('@dir:') === 0) o = dig(PT, o.slice(5)); // direction-specific line (v0.4 neutral: UT.v04.neutralDir)
    if (o == null) { console.warn('ui-text missing: ' + path); return '⟦' + path + '⟧'; }
    return o;
  }
  function PON() { return ECFG.presenceMode !== 'off'; }
  function H(s, v) { return dirs(esc(fmt(s, v))); }          // template → safe HTML
  function X(path, v) { return H(L(path), v); }              // string-table key → safe HTML
  function P(path, v) { return fmt(L(path), v); }            // string-table key → plain text
  function tipA(text) { return ' data-tip="' + esc(text) + '"'; }
  function zoneName(id) { return P('zones.' + id); }
  function statName(st) { return P('stats.' + st); }
  function cardName(id) { return P('cards.' + id + '.name'); }
  function eventName(id) { return P('events.' + id); }
  function lineParts(s) { // "{C2}: text" → speaker + text; "[...]" alone → narration
    var m = /^\{([A-Z0-9]+)\}: ([\s\S]*)$/.exec(s);
    return m ? { who: m[1], text: m[2] } : { narr: s };
  }

  // ---------- art (greybox fallback when a file is missing) ----------
  var MONO_ONLY = {}; // v0.3 art: every icon now has a colour version (care/insight/nerve/bar/action/deck _color); was ink-only in v2
  var ICON_OF_STAT = { INSIGHT: 'INSIGHT', NERVE: 'NERVE', CARE: 'CARE', I: 'INSIGHT', N: 'NERVE', C: 'CARE' };
  function iconSrc(id, onDark) {
    var set = (ICON_STYLE === 'mono' || (onDark && MONO_ONLY[id])) ? A.icons.mono : A.icons.colour;
    return set[id] || A.icons.colour[id] || null;
  }
  function icon(id, o) {
    o = o || {}; var src = iconSrc(id, o.dark), cls = 'ic ' + (o.cls || '');
    if (src) return '<img class="' + cls + '" src="' + src + '" alt="' + esc(o.alt || id) + '"' + (o.tip ? tipA(o.tip) : '') + '>';
    return '<span class="' + cls + ' gb"' + (o.tip ? tipA(o.tip) : '') + '>' + esc(String(id).charAt(0)) + '</span>';
  }
  function statIcon(st, o) { o = o || {}; var s = ICON_OF_STAT[st]; return icon(s, { dark: o.dark, cls: o.cls, alt: statName(s), tip: o.notip ? null : P('cardUi.iconTip.' + s.charAt(0)) }); }
  function img(src, cls, alt) { return src ? '<img class="' + cls + '" src="' + src + '" alt="' + esc(alt || '') + '" draggable="false">' : ''; }
  function box(b) { return 'left:' + b.x + 'px;top:' + b.y + 'px;width:' + b.w + 'px;height:' + b.h + 'px;'; }
  function pctBox(b, W, Hh) { return 'left:' + (b.x / W * 100) + '%;top:' + (b.y / Hh * 100) + '%;width:' + (b.w / W * 100) + '%;height:' + (b.h / Hh * 100) + '%;'; }
  function layoutBox(name) { if (name === 'fullStage') return { x: 0, y: 0, w: BL.stage.w, h: BL.stage.h }; var b = BL.boxes[name]; return typeof b === 'string' ? A.board.ui[b] : b; }
  function zoneBox(id) { return (BL.zones === 'manifest' ? A.board.zones : BL.zones)[id]; }
  function catOf(id) { return L('cards.' + id + '.cat'); }

  // ---------- card component: art, panels, frame, glyph, then live text (artist layer order) ----------
  function cardHTML(id, o) {
    o = o || {};
    var G = U.game, c = (G ? G.card(id) : null) || ECFG.deck.concat(V4 ? [] : [cfg.chairCard, CONFIG.presence.offeringCard || {}]).filter(function (x) { return x && x.id === id; })[0];
    var V = o.variant === 'hand' && A.card.hand ? A.card.hand : null; // the artist's compact hand frame (v0.3 art-fit fix)
    var cat = catOf(id), B = V ? V.boxes : A.card.boxes, W = A.card.size[0], Hh = A.card.size[1];
    var frame = (V || A.card).frame[cat] || (V || A.card).frame.neutral, panels = (V || A.card).panels[cat] || (V || A.card).panels.neutral;
    var slot = V ? V.rollIconSlot : A.card.rollIconSlot, rmax = V ? V.rollIconMax : A.card.rollIconMax;
    var art = cardArt(id);
    var pb = function (k) { return pctBox(B[k], W, Hh); };
    var rollIcons = c.icons.slice(0, rmax).map(function (ic, i) {
      var b = V ? { x: B.roll_icons.x + i * (slot + 8), y: B.roll_icons.y, w: slot, h: slot } : { x: B.roll_icons.x, y: B.roll_icons.y + i * (slot + 8), w: slot, h: slot };
      return '<div class="c-ricon" style="' + pctBox(b, W, Hh) + '">' + statIcon(ic, { dark: true, notip: true }) + '</div>';
    }).join('');
    return '<div class="card cat-' + cat + (V ? ' v-hand' : '') + (frame ? '' : ' gbcard') + (o.cls ? ' ' + o.cls : '') + '"' + (o.attrs || '') + ' style="width:' + (o.w || 190) + 'px">' +
      (art ? '<img class="c-art" style="' + pb('art') + '" src="' + art + '" alt="" draggable="false">' : '<div class="c-art gb" style="' + pb('art') + '">' + esc(cardName(id)) + '</div>') +
      (panels ? '<img class="c-layer" src="' + panels + '" alt="" draggable="false">' : '<div class="c-layer gbpanels"></div>') +
      (frame ? '<img class="c-layer" src="' + frame + '" alt="" draggable="false">' : '') +
      (A.card.glyph[cat] ? '<img class="c-glyph" style="' + pb('category_glyph') + '" src="' + A.card.glyph[cat] + '" alt="" draggable="false">' : '<div class="c-glyph gb" style="' + pb('category_glyph') + '"></div>') +
      '<div class="c-box c-name' + (cardName(id).length > 18 ? ' long' : '') + '" data-box="name" style="' + pb('name') + '"><span>' + esc(cardName(id)) + '</span></div>' + // long names shrink to fit (artist: hand name shrinks to 560px)
      '<div class="c-box c-cat" data-box="category_label" style="' + pb('category_label') + '"><span>' + esc(P('cardCategories.' + cat)) + '</span></div>' +
      '<div class="c-box c-rlabel" data-box="roll_label" style="' + pb('roll_label') + '"><span>' + X('cardUi.addLabel') + '</span></div>' + rollIcons +
      '<div class="c-box c-effect" data-box="effect" style="' + pb('effect') + '"><span><b class="c-playlbl">' + X('cardUi.playLabel') + '</b> ' + X('cards.' + id + '.text') + '</span></div>' +
      (B.flavour ? '<div class="c-box c-flav" data-box="flavour" style="' + pb('flavour') + '"><span>' + X('cards.' + id + '.flavour') + '</span></div>' : '') +
      (o.extra || '') + '</div>';
  }
  // card art from the manifest; none = placeholder in the category frame
  function cardArt(id) { return A.cardArt[id] || null; }
  function cardTip(id) { return P('cardUi.tip', { effect: P('cards.' + id + '.text') }); }

  // ---------- Question card (full) ----------
  function questionCardHTML(qid, o) {
    o = o || {};
    var th = ECFG.threads.filter(function (t) { return t.id === qid; })[0], Q = A.questions.layout, W = 750, Hh = 1050;
    var have = o.have == null ? null : Math.min(o.have, th.cost);
    var pips = ''; for (var i = 0; i < th.cost; i++) pips += '<span class="qpip' + (have != null && i < have ? ' on' : '') + '">' + icon('progress', { alt: '' }) + '</span>';
    return '<div class="qcard' + (o.cls ? ' ' + o.cls : '') + (A.questions.bg[qid] ? '' : ' gbq') + '"' + (o.attrs || '') + ' style="width:' + (o.w || 300) + 'px">' +
      img(A.questions.bg[qid], 'c-layer', '') +
      '<div class="c-box q-text" data-box="question_text" style="' + pctBox(Q.question_text, W, Hh) + '"><span>' + X('questions.' + qid) + '</span></div>' +
      '<div class="c-box q-cost" data-box="cost" style="' + pctBox(Q.cost, W, Hh) + '"><span>' +
        (have != null ? X('hud.questionProgress', { have: have, cost: th.cost }) : X('dawn.cost', { cost: th.cost })) + '<span class="qpips">' + pips + '</span></span></div>' +
      (o.extra || '') + '</div>';
  }

  // ---------- stage scaling ----------
  var SCALE = 1;
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    SCALE = Math.min(w / BL.stage.w, h / BL.stage.h);
    stage.style.transform = 'scale(' + SCALE + ')';
    stage.style.left = Math.round((w - BL.stage.w * SCALE) / 2) + 'px';
    stage.style.top = Math.round((h - BL.stage.h * SCALE) / 2) + 'px';
    U.bgSmallOk = BL.stage.w * SCALE * (window.devicePixelRatio || 1) <= BL.bgSmallBelow;
    U.bg = boardBg();
    Array.prototype.forEach.call(document.querySelectorAll('img.boardbg'), function (i) { if (U.bg && i.getAttribute('src') !== U.bg) i.src = U.bg; });
    placeCoach();
  }
  window.addEventListener('resize', fit);
  function boardBg() { // v0.3: the artist's late-nights board on nights 5-6 (Presence on)
    var late = U.screen === 'encounter' && U.game && PON() && PCFG.lateBoard === 'swap' && U.game.state.round >= U.game.cfg.presence.lateFromNight && A.board.bgLate;
    var big = late ? A.board.bgLate : A.board.bg, small = late ? A.board.bgLateSmall : A.board.bgSmall;
    return ((U.bgSmallOk && small) ? small : big) || null;
  }
  function bgHTML(cls) { U.bg = boardBg(); return U.bg ? '<img class="boardbg ' + (cls || '') + '" src="' + U.bg + '" alt="" draggable="false">' : '<div class="boardbg gbboard ' + (cls || '') + '"></div>'; }

  // ---------- TITLE ----------
  function renderTitle() {
    if (V4 && ECFG.noStory) return renderTitleV04();
    U.screen = 'title'; closeZoom(); endCoach(true);
    var skins = Object.keys(TXT.SKINS).map(function (k) { return '<option value="' + k + '"' + (k === U.skin ? ' selected' : '') + '>' + (k === 'neutral' ? esc(P('ui.namesSlots')) : k + ' · ' + esc(TXT.SKINS[k].POV)) + '</option>'; }).join('');
    stage.innerHTML = bgHTML('dim') +
      '<div class="title-panel">' +
        '<h1>' + X('ui.title') + '</h1><div class="sub">' + X('ui.subtitle') + '</div>' +
        '<p class="blurb">' + X('ui.titleBlurb') + '</p>' +
        '<div class="form">' +
          '<label' + tipA(P('ui.seedFieldTip')) + '>' + X('ui.seedLabel') + '<input id="inSeed" value="' + (U.seed != null ? U.seed : '') + '"></label>' +
          '<label' + tipA(P('ui.namesTip')) + '>' + X('ui.namesLabel') + '<select id="inSkin">' + skins + '</select></label>' +
          '<label' + tipA(P('ui.testerTip')) + '>' + X('ui.testerLabel') + '<input id="inTester" value="' + esc(U.tester) + '"></label>' +
          '<label class="chk"' + tipA(P('ui.tutorialFieldTip')) + '><input type="checkbox" id="inTut"' + (U.wantTutorial ? ' checked' : '') + '> ' + X('ui.tutorialLabel') + '</label>' +
        '</div>' +
        '<div class="btns"><button class="primary big" id="bStart"' + tipA(P('ui.startTip')) + '>' + X('ui.start') + '</button>' +
        '<button id="bSkip"' + tipA(P('ui.skipIntroTip')) + '>' + X('ui.skipIntro') + '</button></div>' +
        '<div class="buildtag">' + X('ui.buildTag') + ' · ' + esc(cfg.version) + '</div>' +
      '</div>';
    on('bStart', function () { readTitle(); startIntro(); });
    on('bSkip', function () { readTitle(); renderQuickChoices(); });
    renderDebug();
  }
  // v0.4: one screen, Zosia's intro (one paragraph per line; line 3 by direction only when one is set), then straight onto the board
  function introLines() {
    var I = UT.v04.intro;
    return I.lines.map(function (l) { return l === '@creatureLine' ? (PDIR && I.creatureLine[PDIR]) || I.creatureLine.neutral : l; });
  }
  function renderTitleV04() {
    U.screen = 'title'; closeZoom(); endCoach(true);
    stage.innerHTML = bgHTML('dim') +
      '<div class="title-panel v04" id="introPanel">' +
        '<h1 id="introTitle">' + H(UT.v04.intro.title) + '</h1>' +
        '<div class="intro" id="introText">' + introLines().map(function (l) { return '<p>' + H(l) + '</p>'; }).join('') +
        '<p class="goal" id="introGoal">' + H(UT.v04.intro.goal) + '</p></div>' +
        '<div class="form">' +
          '<label' + tipA(P('ui.seedFieldTip')) + '>' + X('ui.seedLabel') + '<input id="inSeed" value="' + (U.seed != null ? U.seed : '') + '"></label>' +
          '<label' + tipA(P('ui.testerTip')) + '>' + X('ui.testerLabel') + '<input id="inTester" value="' + esc(U.tester) + '"></label>' +
          '<label class="chk"' + tipA(P('ui.tutorialFieldTip')) + '><input type="checkbox" id="inTut"' + (U.wantTutorial ? ' checked' : '') + '> ' + X('ui.tutorialLabel') + '</label>' +
        '</div>' +
        '<div class="btns"><button class="primary big" id="bStart"' + tipA(P('ui.startTip')) + '>' + X('ui.start') + '</button></div>' +
        '<div class="buildtag">' + X('ui.buildTag') + ' · ' + esc(cfg.version) + '</div>' +
      '</div>';
    on('bStart', function () { readTitle(); startEncounter(); });
    renderDebug();
  }
  function readTitle() {
    var s = document.getElementById('inSeed').value.trim();
    U.seed = s ? (parseInt(s, 10) >>> 0) : newSeed();
    if (document.getElementById('inSkin')) U.skin = document.getElementById('inSkin').value;
    U.tester = document.getElementById('inTester').value.trim();
    U.wantTutorial = document.getElementById('inTut').checked;
    U.choices = { bond: null, key: null, visited: [] };
    U.tStart = Date.now(); U.saved = false; U.runId = Date.now().toString(36) + '-' + U.seed;
  }
  function newSeed() { return Math.floor(Math.random() * 1e9); }
  function on(id, fn) { var e = document.getElementById(id); if (e) e.onclick = fn; }
  function all(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }

  function renderQuickChoices() {
    U.screen = 'quick';
    function opts(key) { return TXT.choices[key].options.map(function (o, i) { return '<label class="opt"><input type="radio" name="' + key + '" value="' + o.value + '"' + (i === 0 ? ' checked' : '') + '> ' + H(o.label) + '</label>'; }).join(''); }
    stage.innerHTML = bgHTML('dim') + '<div class="title-panel"><h2>' + X('ui.quickSetup') + '</h2>' +
      '<p><b>' + H(TXT.choices.bond.prompt) + '</b></p>' + opts('bond') + '<p><b>' + H(TXT.choices.key.prompt) + '</b></p>' + opts('key') +
      '<div class="btns"><button class="primary big" id="bGo"' + tipA(P('ui.beginNightTip')) + '>' + X('ui.beginNight') + '</button></div></div>';
    on('bGo', function () {
      U.choices.bond = document.querySelector('input[name=bond]:checked').value;
      U.choices.key = document.querySelector('input[name=key]:checked').value;
      U.choices.visited = ['3a', '3b', '3c'];
      startEncounter();
    });
  }

  // ---------- VN player (intro and outro) ----------
  var CAST_ORDER = ['POV', 'C1', 'C2', 'HOST'];
  function sceneCast(lines) { var s = {}; lines.forEach(function (l) { if (l.who) s[l.who] = 1; }); return CAST_ORDER.filter(function (k) { return s[k]; }); }
  function startIntro() {
    U.screen = 'vn'; U.revealed = [];
    var steps = [];
    TXT.intro.forEach(function (sc) {
      if (sc.spots) { steps.push({ type: 'spots', scene: sc.scene }); return; }
      var cast = sceneCast(sc.lines || []);
      (sc.lines || []).forEach(function (l) { steps.push({ type: 'line', scene: sc.scene, line: l, cast: cast }); });
      (sc.choices || []).forEach(function (c) { steps.push({ type: 'choice', scene: sc.scene, key: c, cast: cast }); });
    });
    U.vn = { steps: steps, idx: 0, done: startEncounter };
    renderVN();
  }
  function expandSpots(scene, ids) {
    var add = [];
    ids.forEach(function (id) { var sp = TXT.spots[id], cast = sceneCast(sp.lines); sp.lines.forEach(function (l) { add.push({ type: 'line', scene: scene + ' · ' + fmt(sp.label), line: l, cast: cast }); }); });
    U.vn.steps.splice.apply(U.vn.steps, [U.vn.idx, 1].concat(add));
  }
  function portrait(who, active, speaking) {
    var src = A.portraits[who];
    var nm = Skin.speaker(who, names());
    return '<div class="vn-char' + (speaking ? ' speaking' : '') + (active ? '' : ' dim') + '" data-who="' + who + '">' +
      (src ? '<img src="' + src + '" alt="" draggable="false">' : '<div class="silhouette"><svg viewBox="0 0 100 100"><circle cx="50" cy="36" r="20"/><path d="M12 100 C14 70 32 60 50 60 C68 60 86 70 88 100 Z"/></svg></div>') +
      '<div class="vn-plate">' + esc(nm) + '</div></div>';
  }
  function renderVN() {
    var V = U.vn, st = V.steps[V.idx];
    if (!st) { V.done(); return; }
    if (st.type === 'spots') {
      var ids = Object.keys(TXT.spots);
      if (!cfg.fasterVariant) { U.choices.visited = ids; expandSpots(st.scene, ids); return renderVN(); }
      // faster variant: pick N of 3 (rare; plain list)
      stage.innerHTML = bgHTML('dim vnbg') + '<div class="vn-box"><div class="vn-name">' + X('ui.choice') + '</div><div class="vn-text">' +
        ids.map(function (id) { return '<label class="opt"><input type="checkbox" class="spot" value="' + id + '"> ' + H(TXT.spots[id].label) + '</label>'; }).join('') +
        '</div><div class="vn-nav"><button class="primary" id="bSpots">' + X('ui.vnNext') + '</button></div></div>';
      on('bSpots', function () {
        var pick = Array.prototype.map.call(document.querySelectorAll('.spot:checked'), function (x) { return x.value; });
        if (pick.length !== cfg.beat3SpotsToVisit) return;
        U.choices.visited = pick; expandSpots(st.scene, pick); renderVN();
      });
      return;
    }
    if (st.line && st.line.question && U.revealed.indexOf(st.line.question) < 0) U.revealed.push(st.line.question);
    var who = st.line && st.line.who, cast = st.cast || [];
    var chars = '<div class="vn-cast">' + cast.map(function (k) { return portrait(k, !who || k === who, k === who); }).join('') + '</div>';
    var qrow = U.revealed.length && U.screen === 'vn' ? '<div class="vn-questions">' + U.revealed.map(function (q) {
      return questionCardHTML(q, { w: 230, cls: st.line && st.line.question === q ? 'slidein' : '' });
    }).join('') + '</div>' : '';
    var head = '<div class="vn-scene">' + H(st.scene) + '</div>' + (st.warn ? '<div class="vn-warn">' + X('ui.placeholderScene') + '</div>' : '');
    if (st.type === 'choice') {
      var ch = TXT.choices[st.key];
      stage.innerHTML = bgHTML('dim vnbg') + head + chars + qrow + '<div class="vn-box"><div class="vn-name">' + X('ui.choice') + '</div><div class="vn-text">' + H(ch.prompt) + '</div>' +
        '<div class="vn-choices">' + ch.options.map(function (o, i) { return '<button data-i="' + i + '">' + H(o.label) + '</button>'; }).join('') + '</div></div>';
      all('.vn-choices button', function (b) {
        b.onclick = function () {
          var o = ch.options[+b.dataset.i]; U.choices[st.key] = o.value;
          if (o.after) V.steps.splice(V.idx + 1, 0, { type: 'line', scene: st.scene, line: { narr: o.after }, cast: st.cast });
          V.idx++; renderVN();
        };
      });
      return;
    }
    var l = st.line;
    stage.innerHTML = bgHTML('dim vnbg') + head + chars + qrow +
      '<div class="vn-box" id="vnBox">' + (l.narr ? '<div class="vn-text narr">' + H(l.narr) + '</div>'
        : '<div class="vn-name">' + esc(Skin.speaker(l.who, names())) + '</div><div class="vn-text">' + H(l.text) + '</div>') +
      '<div class="vn-nav"><button id="bSkipVN"' + tipA(P('ui.vnSkipTip')) + '>' + X('ui.vnSkip') + '</button><button class="primary" id="bNext"' + tipA(P('ui.vnNextTip')) + '>' + X('ui.vnNext') + ' ▸</button></div></div>';
    on('bNext', vnNext);
    document.getElementById('vnBox').onclick = function (e) { if (e.target.tagName !== 'BUTTON') vnNext(); };
    on('bSkipVN', function () {
      for (var i = V.idx + 1; i < V.steps.length; i++) {
        var s2 = V.steps[i]; if (s2.line && s2.line.question && U.revealed.indexOf(s2.line.question) < 0) U.revealed.push(s2.line.question);
        if (s2.type === 'choice' || s2.type === 'spots' || s2.stop) { V.idx = i; return renderVN(); }
      }
      V.idx = V.steps.length; renderVN();
    });
    renderDebug();
  }
  function vnNext() { U.vn.idx++; renderVN(); }

  // ---------- ENCOUNTER ----------
  function startEncounter(opt) {
    opt = opt || {};
    var tutorial = opt.tutorial != null ? opt.tutorial : U.wantTutorial;
    U.game = Engine.createGame(cfg, { seed: U.seed, bond: U.choices.bond || 'C1', key: U.choices.key || 'SHARED', visited: U.choices.visited.length ? U.choices.visited : ['3a', '3b', '3c'], tutorial: tutorial });
    if (!U.tStart) U.tStart = Date.now();
    if (!U.runId) U.runId = Date.now().toString(36) + '-' + U.game.state.seed;
    U.skyShown = false; U.bannerUntil = 0;
    U.tEncounter = Date.now(); U.tray = null; U.alloc = []; U.saved = false; U.moveMode = false; U.lastRound = 0; U.feedSeen = 0; U.outroSteps = null;
    U.tutInfo = { used: tutorial, skippedAt: null };
    window.__game = U.game; // console debugging
    U.screen = 'encounter';
    U.tut = tutorial ? { i: 0 } : null;
    renderEncounter();
  }
  function G_() { return U.game; }
  function canAct() { var S = U.game.state; return S.phase === 'actions' && S.actionsLeft > 0; }
  function zoneIdx(id) { for (var i = 0; i < ECFG.zones.length; i++) if (ECFG.zones[i].id === id) return i; return -1; }
  function band(p) { if (V4 && ECFG.noStory) return ''; for (var i = 0; i < TXT.pressureBands.length; i++) { var b = TXT.pressureBands[i]; if (p >= b.min && p <= b.max) return fmt(b.text); } return ''; }
  function evDef(id) { return U.game.cfg.events.filter(function (e) { return e.id === id; })[0]; }
  function oddsOf(stat, need, commits, helps) {
    var G = U.game, pv = G.previewTest(stat, need, commits || [], helps || []);
    return { pv: pv, o: Odds.testOdds(G.cfg, pv.preDraw, need) };
  }
  function bestCommits(stat, excludeId) {
    var G = U.game, ic = Engine.ICON_OF_STAT[stat];
    return G.state.hand.filter(function (id) { return id !== excludeId && G.card(id).icons.indexOf(ic) >= 0; });
  }
  function searchNeed(zi) { var G = U.game; return Math.max(0, G.cfg.zones[zi].investigateDifficulty - G.state.torch); }

  /** action bar entries, data-driven from cfg.uiActions (after rule flags) */
  function actionDefs() {
    var G = U.game, S = G.state, c = G.cfg, a = canAct(), out = [];
    c.uiActions.forEach(function (id) {
      var d = { id: id, label: P('actions.' + id + '.label'), ok: a, why: a ? '' : (S.phase === 'discard' ? P('reasons.discardFirst', { limit: c.handLimit }) : P('reasons.noActions')) };
      if (id === 'move') {
        d.tip = P('actions.move.tip') + (S.pov === c.zones.length - 2 ? P('actions.moveExposure') : '');
        d.run = function () { U.moveMode = !U.moveMode; renderEncounter(); };
      } else if (id === 'investigate') {
        var need = searchNeed(S.pov), z = c.zones[S.pov], r0 = oddsOf('INSIGHT', need), rb = oddsOf('INSIGHT', need, bestCommits('INSIGHT'));
        d.tip = P('actions.investigate.tip', { zone: zoneName(z.id), need: need, pct: Odds.pct(r0.o.p), gain: z.progress }) + (rb.o.p > r0.o.p ? P('actions.withBest', { pct: Odds.pct(rb.o.p) }) : '') + P('actions.omenNote') + (PON() && S.pov === c.zones.length - 1 ? P('presence.ui.searchPreview') : '');
        d.run = function () { openTray({ kind: 'investigate', stat: 'INSIGHT', zone: S.pov }); };
      } else if (id === 'steady') {
        var r1 = oddsOf('CARE', c.steadyDifficulty), r2 = oddsOf('CARE', c.steadyDifficulty, bestCommits('CARE'));
        d.tip = P('actions.steady.tip', { need: c.steadyDifficulty, pct: Odds.pct(r1.o.p) }) + (r2.o.p > r1.o.p ? P('actions.withBest', { pct: Odds.pct(r2.o.p) }) : '') + P('actions.omenNote') + (PON() ? P('presence.ui.comfortPreview') : '');
        d.run = function () { openTray({ kind: 'steady', stat: 'CARE' }); };
      } else if (id === 'play') {
        d.tip = P('actions.play.tip');
        d.run = function () { all('.hcard.playable', function (e) { e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); }); };
      } else if (id === 'holdDoor') {
        var r3 = oddsOf('NERVE', c.holdDoorDifficulty);
        if (a && S.pov !== zoneIdx(c.holdDoorZone)) { d.ok = false; d.why = P('reasons.houseOnly'); }
        else if (a && !c.barsStack && S.bars) { d.ok = false; d.why = P('reasons.barDown'); }
        d.tip = P('actions.holdDoor.tip', { need: c.holdDoorDifficulty, pct: Odds.pct(r3.o.p) });
        d.run = function () { openTray({ kind: 'holdDoor', stat: 'NERVE' }); };
      } else if (id === 'draw') {
        if (a && !S.deck.length) { d.ok = false; d.why = P('reasons.deckEmpty'); }
        d.tip = P('actions.draw.tip', { left: S.deck.length });
        d.run = function () { act(G.drawAction()); };
      } else return;
      out.push(d);
    });
    return out;
  }
  function endTurnTip() {
    var G = U.game, S = G.state, c = G.cfg, last = c.zones.length - 1, n = 0;
    if (S.pov === last) n += c.exposurePOV; if (S.c1 === last) n += c.exposureC1;
    return P(c.rules && c.rules.endTurnButton ? 'actions.endTurn.tip' : 'actions.endRound.tip') + (n ? P('actions.endExposure', { n: n }) : '') +
      (S.round >= c.rounds ? P('actions.endDawn') : S.silence ? P('actions.endNoDraw') : P('actions.endDraw'));
  }

  function tokenPos(who) {
    var G = U.game, S = G.state, zid = G.cfg.zones[who === 'POV' ? S.pov : who === 'C1' ? S.c1 : 0].id;
    var an = BL.tokens[who][zid] || BL.tokens[who].house, zb = zoneBox(zid);
    return { x: zb.x + an[0] * zb.w, y: zb.y + an[1] * zb.h, zone: zid };
  }
  function tokenHTML(who) {
    var p = tokenPos(who), s = BL.tokenSize, src = A.tokens[who];
    return '<div class="token tok-' + who + '" id="tok-' + who + '" style="left:' + (p.x - s / 2) + 'px;top:' + (p.y - s / 2) + 'px;width:' + s + 'px;height:' + s + 'px"' + tipA(P('board.token' + who + 'Tip')) + '>' +
      (src ? '<img src="' + src + '" alt="" draggable="false">' : '<div class="gbtok">' + esc(Skin.speaker(who, names()).charAt(0)) + '</div>') +
      '<div class="tok-name">' + esc(V4 && who === 'POV' ? P('v04.you') : Skin.speaker(who, names())) + '</div></div>';
  }

  function renderEncounter() {
    var G = U.game, S = G.state, c = G.cfg;
    if (S.phase === 'allocate') { closeZoom(); return renderDawn(); }
    if (S.phase === 'done') { closeZoom(); return V4 && G.cfg.noQuestions ? renderEndV04() : startOutro(); }
    var before = {}; ['POV', 'C1', 'C2'].forEach(function (w) { var e = document.getElementById('tok-' + w); if (e) before[w] = e.getBoundingClientRect(); });
    var a = canAct(), last = c.zones.length - 1;
    // zones
    var zones = c.zones.map(function (z, i) {
      var zb = zoneBox(z.id), canMove = a && Math.abs(i - S.pov) === 1;
      var need = Math.max(0, z.investigateDifficulty - S.torch);
      return '<div class="zone' + (i === S.pov ? ' here' : '') + (canMove ? ' movable' : '') + (canMove && U.moveMode ? ' moveHint' : '') + '" id="zone-' + z.id + '" data-zone="' + i + '" data-ctl="zone-' + z.id + '" style="' + box(zb) + '"' +
        tipA(P('board.zoneTip.' + z.id, { need: need, gain: z.progress }) + (canMove ? ' ' + P('board.moveHere') + '.' : '')) + '>' +
        (canMove ? '<div class="moveTag">' + X('board.moveHere') + ' ▸</div>' : '') +
        '<div class="zstrip' + (V4 && A.board.zoneStrips[z.id] ? ' art' : '') + '" style="height:' + BL.zoneStripH + 'px' + (V4 && A.board.zoneStrips[z.id] ? ';background-image:url(' + A.board.zoneStrips[z.id] + ')' : '') + '"><span class="zname">' + esc(zoneName(z.id)) + '</span><span class="zbadge">' + statIcon('INSIGHT', { dark: true, notip: true }) + X('board.zoneBadge', { need: need, gain: z.progress }) + '</span></div></div>';
    }).join('');
    var bar = S.bars ? '<div class="door" id="door" style="' + box(layoutBox('barOnDoor')) + '"' + tipA(barSavedNow() ? P('presence.ui.barTipSaved') : P('board.barTip')) + '>' + (PA('bar') && ICON_STYLE !== 'mono' ? '<img src="' + PA('bar') + '" alt="' + esc(P('board.bar')) + '">' : icon('barOnDoor', { alt: P('board.bar') })) + '</div>' : '';
    // top band
    var pips = ''; for (var k = 0; k < c.actionsPerRound; k++) pips += '<span class="apip' + (k < S.actionsLeft ? ' on' : '') + '">' + icon('action', { dark: true, alt: '' }) + '</span>';
    var endLbl = P(c.rules && c.rules.endTurnButton ? 'actions.endTurn.label' : 'actions.endRound.label');
    var turn = '<div class="hud turn" id="turnBox" style="' + box(layoutBox('turn')) + '"><div class="aleft"' + tipA(P('hud.actionsLeftTip', { n: S.actionsLeft })) + '><span>' + X('hud.actionsLeft', { n: S.actionsLeft }) + '</span><span class="apips">' + pips + '</span></div>' +
      '<button id="act-end" data-ctl="act-end" class="primary endturn' + (S.actionsLeft === 0 && S.phase === 'actions' ? ' nudge' : '') + '"' + (S.phase === 'actions' ? '' : ' disabled') + tipA(endTurnTip()) + '>' + esc(endLbl) + ' ▸</button></div>';
    var goal = '<div class="hud goal' + (V4 ? ' v04' : '') + '" id="goalBanner" style="' + box(layoutBox('goalBanner')) + '"' + tipA(P('hud.goalTip')) + '><span>' + X('hud.goal') + '</span>' +
      '<button id="btnMenu" class="menuBtn"' + tipA(P('ui.menuTip')) + '>☰ ' + X('ui.menu') + '</button></div>';
    var MI = V4 ? A.hours : A.moons; // v0.4: a candle burning down per Hour (icons/hour_1..6); v0.3: moons (retired art → numbers)
    var moons = ''; for (var r = 1; r <= c.rounds; r++) moons += '<span class="moon' + (r === S.round ? ' now' : r < S.round ? ' past' : '') + '"' + tipA(P('hud.nightStepTip', { n: r })) + '>' + img(MI[Math.min(r, MI.length) - 1], 'ic', '') + (MI[r - 1] ? '' : '<span class="gb">' + r + '</span>') + '</span>';
    moons += '<span class="moon dawn"' + tipA(P('hud.dawnStepTip')) + '>' + (A.dawn ? img(A.dawn, 'ic', '') : '<span class="gb">☀</span>') + '</span>';
    var night = '<div class="hud nightc' + (V4 ? ' v04' : '') + '" id="nightCounter" style="' + box(layoutBox('nightCounter')) + '"' + tipA(P('hud.nightTip', { n: S.round, total: c.rounds })) + '><div class="nlabel">' + X('hud.night', { n: S.round, total: c.rounds }) + '</div><div class="moons">' + moons + '</div></div>';
    // dread track
    var db = layoutBox('dread'), k2 = db.h / A.dread.size[1], tw = A.dread.size[0] * k2;
    var steps = A.dread.steps.map(function (s) {
      return '<div class="dstep' + (s.step === S.pressure ? ' now' : '') + (s.step === c.pressureMax ? ' brk' : '') + '" style="left:' + s.x * k2 + 'px;top:' + s.y * k2 + 'px;width:' + s.w * k2 + 'px;height:' + s.h * k2 + 'px"' + tipA(s.step === c.pressureMax ? P('hud.dreadBreakTip', { max: c.pressureMax }) : P('hud.dreadPipTip', { n: s.step })) + '>' +
        (A.dread.track ? '' : '<div class="gbstep" style="opacity:' + (0.25 + s.step / 8) + '"></div>') + '<span class="dnum">' + s.step + '</span>' + (s.step === S.pressure ? '<span class="dmark">' + icon('pressure', { alt: '' }) + '</span>' : '') + '</div>';
    }).join('');
    var lb = A.dread.label;
    var dread = '<div class="hud dread" id="dread" style="' + box(db) + '"' + tipA(P('hud.dreadTip', { n: S.pressure, max: c.pressureMax }) + ' ' + band(S.pressure)) + '>' +
      '<div class="dtrack" style="width:' + tw + 'px;height:' + db.h + 'px">' + (A.dread.track ? '<img src="' + A.dread.track + '" alt="" draggable="false">' : '') + steps +
      (lb ? '<div class="dlabel" data-box="dread.label_box" style="left:' + lb.x * k2 + 'px;top:' + lb.y * k2 + 'px;width:' + lb.w * k2 + 'px;height:' + lb.h * k2 + 'px"><span>' + X('hud.dreadTitle', { n: S.pressure, max: c.pressureMax }) + ' · ' + X('hud.dreadLabel', { max: c.pressureMax }) + '</span></div>' : '') + '</div></div>';
    // questions + clues
    var qb = layoutBox('questions');
    var qs2 = c.noQuestions ? '' : '<div class="hud questions" id="questions" style="' + box(qb) + '">' + c.threads.map(function (th) {
      var have = Math.min(S.progress, th.cost), qp = ''; for (var i = 0; i < th.cost; i++) qp += '<span class="qpip' + (i < have ? ' on' : '') + '"></span>';
      return '<div class="qchip" id="q-' + th.id + '" data-q="' + th.id + '"' + tipA(P('hud.questionTip', { cost: th.cost })) + '>' +
        (A.questions.bg[th.id] ? '<img class="qbg" src="' + A.questions.bg[th.id] + '" alt="" draggable="false">' : '') +
        '<div class="qicon">' + (A.questions.icon[th.id] ? '<img src="' + A.questions.icon[th.id] + '" alt="">' : '<span class="gb">?</span>') + '</div>' +
        '<div class="qtxt"><div class="qs">' + X('questions.' + th.id) + '</div><div class="qcost">' + X('hud.questionProgress', { have: have, cost: th.cost }) + ' <span class="qpips">' + qp + '</span></div></div></div>';
    }).join('') + '</div>';
    var clues = '<div class="hud clues' + (c.noQuestions ? ' cgoal' : '') + '" id="clues" style="' + box(layoutBox('clues')) + '"' + tipA(P('hud.cluesTip', { n: S.progress })) + '>' + icon(V4 && A.icons.colour.clue ? 'clue' : 'progress', { alt: '' }) + '<span class="cn">' + S.progress + (c.noQuestions ? '<small>/' + c.clueGoal + '</small>' : '') + '</span><span class="cl">' + esc(cap(term('TERM_CLUES'))) + '</span></div>';
    // bottom: deck, actions, hand, helps, event
    var deck = '<div class="hud deck" id="deckPile" style="' + box(layoutBox('deck')) + '"' + tipA(P('hud.deckTip', { n: S.deck.length }) + ' ' + P('hud.discardTip', { n: S.discard.length })) + '>' +
      '<div class="pile' + (S.deck.length ? '' : ' empty') + '">' + icon('deck', { dark: true, alt: '' }) + '<span class="pn">' + S.deck.length + '</span></div><div class="dlbl">' + X('hud.deck', { n: S.deck.length }) + '<br>' + X('hud.discard', { n: S.discard.length }) + '</div></div>';
    var acts = '<div class="hud actions" id="actionsBox" style="' + box(layoutBox('actions')) + '">' + actionDefs().map(function (d) {
      return '<button id="act-' + d.id + '" data-ctl="act-' + d.id + '" class="act' + (d.id === 'move' && U.moveMode ? ' on' : '') + '"' + (d.ok ? '' : ' disabled') + tipA(d.ok ? d.tip : d.why + ' ' + d.tip) + '>' + esc(d.label) + '</button>';
    }).join('') + '</div>';
    var hb = layoutBox('hand'), n = S.hand.length, cw = BL.handCard.w, ch = cw * A.card.size[1] / A.card.size[0];
    var step = n > 1 ? Math.min(cw + 12, (hb.w - cw) / (n - 1)) : 0, x0 = hb.x + (hb.w - (cw + step * (n - 1))) / 2;
    var inDiscard = S.phase === 'discard';
    var hand = S.hand.map(function (id, i) {
      var can = G.canPlay(id), playable = can.ok && !U.tray;
      var addable = U.tray && !U.tray.result && U.tray.cardId !== id && G.card(id).icons.indexOf(Engine.ICON_OF_STAT[U.tray.stat]) >= 0;
      return '<div class="hcard' + (playable ? ' playable' : '') + (addable ? ' addable' : '') + (U.tray && U.tray.commits.indexOf(id) >= 0 ? ' added' : '') + '" id="card-' + id + '" data-card="' + id + '" data-ctl="card-' + id + '" draggable="' + (playable ? 'true' : 'false') + '" style="left:' + (x0 + step * i) + 'px;top:' + (hb.y + Math.max(0, (hb.h - ch) / 2)) + 'px;width:' + cw + 'px;height:' + ch + 'px;z-index:' + (10 + i) + '">' +
        cardHTML(id, { w: cw, cls: 'compact', variant: BL.handCard.variant }) +
        (inDiscard ? '<button class="discardBtn" data-discard="' + id + '"' + tipA(P('cardUi.discardTip', { limit: c.handLimit })) + '>' + X('cardUi.discard') + '</button>' : '') + '</div>';
    }).join('');
    var handHead = inDiscard ? '<div class="handHead warn" style="left:' + hb.x + 'px;top:' + (hb.y - 210) + 'px;width:' + hb.w + 'px">' + X('cardUi.discardPrompt', { limit: c.handLimit }) + '</div>' : '';
    var helps = c.noCompanions ? '' : ['c1', 'c2'].map(function (w) {
      var used = S.helps[w].used, bonus = G.helpBonus(w), close = bonus === c.helpBonusBonded;
      var tip = P(w === 'c1' ? 'hud.helpTipC1' : 'hud.helpTipC2', { bonus: bonus, close: close ? P('hud.helpCloseNote', { bonus: bonus }) : '' });
      return '<div class="hud help' + (used ? ' used' : '') + '" id="help-' + w + '" style="' + box(layoutBox(w === 'c1' ? 'helpC1' : 'helpC2')) + '"' + tipA(tip) + '>' + (A.helps[w] ? '<img src="' + A.helps[w] + '" alt="" draggable="false">' : '<div class="gbhelp">' + esc(Skin.speaker(w.toUpperCase(), names())) + '</div>') +
        '<div class="hslot" data-box="help.text" style="' + pctBox(A.helpSlots.text, 320, 400) + '"><span><b>+' + bonus + '</b> ' + X(used ? 'hud.helpUsed' : 'hud.helpReady') + '</span></div></div>';
    }).join('');
    var ev = S.lastEvent, evb = layoutBox('eventCard'), lateInCard = BL.boxes.lateBanner === BL.boxes.eventCard;
    function lateLine(cls) { var LI = V4 ? A.hours : A.moons; return '<div class="' + cls + '" id="lateBanner"' + tipA(P('presence.ui.lateBanner')) + '>' + img(LI[Math.min(S.round, LI.length) - 1], 'ic', '') + '<span>' + X('presence.ui.lateBanner') + '</span></div>'; }
    var evFp = PON() && evDef(ev.id).footprint, late = isLate();
    var evHTML = '<div class="hud evcard' + (ev.cancelled ? ' cancelled' : '') + (late ? ' late' : '') + '" id="nightEvent" style="' + box(evb) + '"' + tipA(P('hud.eventTip', { event: eventName(ev.id), effect: ev.cancelled ? P('hud.eventCancelled') : P('eventEffects.' + ev.id) }) + ' ' + storyFlavour(ev.id) + (evFp ? ' ' + P('presence.ui.footprintTip') : '')) + '>' +
      '<div class="evn">' + esc(eventName(ev.id)) + '</div><div class="eve">' + (ev.cancelled ? X('hud.eventCancelled') : X('eventEffects.' + ev.id)) + '</div>' + (ev.cancelled ? icon('barOnDoor', { cls: 'evbar', alt: '' }) : '') + (evFp ? footprintMark('evfp') : '') +
      '<div class="evtonight">' + X('hud.tonight') + '</div>' + (late && lateInCard ? lateLine('evlate') : '') + '</div>';
    // nights 5-6: the thin late_nights_banner strip (layout v2); falls back to a line inside the event card if both share a box
    if (late && !lateInCard) evHTML += '<div class="hud lateBanner" style="' + box(layoutBox('lateBanner')) + '">' + lateLine('lbin') + '</div>';
    var feedAll = S.feed.map(feedText);
    var logHTML = '<div class="hud evlog" id="eventLog" style="' + box(layoutBox('eventLog')) + '"' + tipA(P('hud.logTitle') + ': ' + (feedAll.slice(-8).reverse().join(' · ') || '—')) + '><span>' + esc(feedAll[feedAll.length - 1] || '') + '</span></div>';
    // night 2 hint (Clarity Pass 4.4)
    var hint = '';
    if (U.hints && !U.tut && S.round === 2 && S.phase === 'actions') {
      var ht = S.c1 > 0 ? P('hints.c1Out', { zone: zoneName(c.zones[S.c1].id) }) : S.pressure >= 3 ? P('hints.highDread', { n: S.pressure }) : P('hints.searchOut');
      hint = '<div class="hint" id="hint" style="' + box(layoutBox('hint')) + '"><span>' + esc(ht) + '</span><button id="hintOff"' + tipA(P('ui.hintsTip')) + '>×</button></div>';
    }
    var skyLate = PON() && PCFG.lateBoard === 'overlay' && A.board.skyLate ? '<img class="skyLate' + (isLate() && U.skyShown ? ' on' : '') + '" id="skyLate" src="' + A.board.skyLate + '" alt="" draggable="false">' : '';
    stage.innerHTML = bgHTML('board') + skyLate + zones + bar + (c.noCompanions ? '' : tokenHTML('C2') + tokenHTML('C1')) + tokenHTML('POV') +
      turn + goal + night + dread + approachHTML() + nextEventHTML() + qs2 + clues + deck + acts + helps + evHTML + logHTML + hint +
      '<div class="dropPlay" id="dropPlay" style="' + box({ x: zoneBox('house').x, y: zoneBox('house').y, w: zoneBox('treeline').x + zoneBox('treeline').w - zoneBox('house').x, h: zoneBox('house').h }) + '"><span>' + X('board.playZone') + '</span></div>' +
      handHead + hand + (U.tray ? trayHTML() : '') + layoutOutlines() +
      (V4 && U.tut ? '<button class="hud skipTut" id="skipTut" style="' + box(layoutBox('skipTutorial')) + '"' + tipA(P('ui.coachSkipTip')) + '>' + X('ui.coachSkip') + '</button>' : ''); // v0.4: Skip tutorial stays in the corner
    wireEncounter();
    // animate token moves (FLIP)
    ['POV', 'C1'].forEach(function (w) {
      var e = document.getElementById('tok-' + w), b = before[w]; if (!e || !b) return;
      var nb = e.getBoundingClientRect(), dx = (b.left - nb.left) / SCALE, dy = (b.top - nb.top) / SCALE;
      if (Math.abs(dx) + Math.abs(dy) < 2) return;
      e.style.transition = 'none'; e.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      requestAnimationFrame(function () { requestAnimationFrame(function () { e.style.transition = 'transform .7s cubic-bezier(.3,.7,.2,1)'; e.style.transform = ''; }); });
    });
    if (S.round !== U.lastRound && S.phase === 'actions') { U.lastRound = S.round; nightBanner(); }
    if (skyLate && isLate() && !U.skyShown) { U.skyShown = true; var sk = document.getElementById('skyLate'); requestAnimationFrame(function () { requestAnimationFrame(function () { sk.classList.add('on'); }); }); } // cross-fade in
    spawnFeed();
    renderDebug(); placeCoach(); if (U.tut) setTimeout(placeCoach, 350);
  }
  function storyFlavour(evId) { return V4 && ECFG.noStory ? '' : fmt(TXT.events[evId] || ''); } // v0.3 story line under an event (none in v0.4)
  // ---------- v0.3 The Approach: track, face-up next event, visit warning, late-nights banner (greybox until Ola's art) ----------
  function PA(k) { return (A.presence || {})[k] || null; }      // expected manifest keys: see README "v0.3 art keys"
  function footprintMark(cls) { var f = PA('footprint'); return '<span class="fpmark ' + (cls || '') + '"' + tipA(P('presence.ui.footprintTip')) + '>' + (f ? '<img src="' + f + '" alt="">' : '<span class="gbfp">👣</span>') + '</span>'; }
  function approachHTML() {
    if (!PON()) return '';
    var G = U.game, S = G.state, sp = G.cfg.presence.spaces, fc = G.presenceForecast(), warn = !!(fc && fc.visit) && S.phase === 'actions' && !(V4 && S.bars); // v0.4: only while no Bar is up
    var ab = layoutBox('approach'), TS = PA('trackSize') || [1000, 280], k = ab.h / TS[1], mk = (PDIR && PA('marker' + PDIR)) || PA('marker'), ms = BL.presenceMarker;
    var steps = PA('steps') && PA('steps').length === sp.length ? PA('steps') : sp.map(function (id, i) { return { id: id, x: 20 + i * 245, y: 16, w: 200, h: 156, name: { x: 20 + i * 245, y: 190, w: 200, h: 66 } }; });
    var cells = steps.map(function (st, i) {
      var id = sp[i], nm = term('TRACK_APPROACH_' + (i + 1));
      var cell = '<div class="apsp sp-' + id + (i === S.presence.pos ? ' now' : '') + (i === sp.length - 1 ? ' door' : '') + (fc && i > S.presence.pos && i <= fc.reach ? ' next' : '') + (warn && i === sp.length - 2 ? ' warnstep' : '') + (PA('track') ? '' : ' gb') + '" data-space="' + id + '" style="left:' + st.x * k + 'px;top:' + st.y * k + 'px;width:' + st.w * k + 'px;height:' + st.h * k + 'px"' + tipA(P('presence.ui.spaceTip', { space: nm })) + '>' +
        (i === S.presence.pos ? '<span class="apmark" id="presenceMarker" style="width:' + ms + 'px;height:' + ms + 'px"' + tipA(P('presence.ui.markerTip')) + '>' + (mk ? '<img src="' + mk + '" alt="">' : '<span class="gbpres"></span>') + '</span>' : '') + '</div>';
      var nb = st.name || { x: st.x, y: st.y + st.h + 10, w: st.w, h: 60 };
      return cell + '<div class="apn" data-box="approach.name_box" style="left:' + nb.x * k + 'px;top:' + nb.y * k + 'px;width:' + nb.w * k + 'px;height:' + nb.h * k + 'px"><span>' + esc(nm) + '</span></div>';
    }).join('');
    return '<div class="hud approach' + (warn ? ' warn' : '') + '" id="approach" style="' + box(ab) + '"' + tipA(P('presence.ui.trackTip')) + '>' +
      (PA('track') ? '<img class="aptrack" src="' + PA('track') + '" alt="" draggable="false">' : '<div class="aptrack gbtrack"></div>') + cells + '</div>' +
      (warn ? '<div class="hud visitWarn' + (fc.barSaved ? ' barSaved' : '') + '" id="visitWarn" style="' + box(layoutBox('visitWarn')) + '">' + X(fc.barSaved ? 'presence.ui.visitWarningBarSaved' : 'presence.ui.visitWarning') + '</div>' : '');
  }
  /** the face-up next event, drawn at the artist's 375x525 frame size; o.w = display width */
  function nextEventCard(id, o) {
    o = o || {};
    var NS = PA('nextEventSize') || [375, 525], NL = PA('nextEventLayout') || {}, fr = PA('nextEventFrame'), pb = function (k) { return NL[k] ? pctBox(NL[k], NS[0], NS[1]) : ''; };
    var fp = id && evDef(id).footprint;
    return '<div class="necard' + (fr ? '' : ' gbne') + (o.cls ? ' ' + o.cls : '') + '" style="width:' + o.w + 'px;height:' + (o.w * NS[1] / NS[0]) + 'px">' +
      (fr ? '<img class="c-layer" src="' + fr + '" alt="" draggable="false">' : '') +
      '<div class="c-box ne-label" data-box="next_event.label" style="' + pb('label') + '"><span>' + X('presence.ui.nextTitle') + '</span></div>' +
      (id ? '<div class="c-box ne-title" data-box="next_event.title" style="' + pb('title') + '"><span>' + esc(eventName(id)) + '</span></div>' +
        (fp ? '<div class="ne-fp" style="' + pb('footprint_mark') + '"' + tipA(P('presence.ui.footprintTip')) + '>' + (PA('footprint') ? '<img src="' + PA('footprint') + '" alt="">' : '<span class="gbfp">👣</span>') + '</div>' : '') +
        '<div class="c-box ne-effect" data-box="next_event.effect" style="' + pb('effect') + '"><span>' + X('eventEffects.' + id) + '</span></div>' +
        (fp && PT.tease && PT.tease[id] ? '<div class="c-box ne-tease" data-box="next_event.foreshadow" style="' + pb('foreshadow') + '"><span>' + H(PT.tease[id]) + '</span></div>' : '')
       : '<div class="c-box ne-title" style="' + pb('title') + '"><span>' + X('presence.ui.nextNone') + '</span></div>') + '</div>';
  }
  function nextEventHTML() {
    if (!PON()) return '';
    var G = U.game, id = G.nextEventId(), b = layoutBox('nextEvent'), fp = id && evDef(id).footprint;
    var tip = id ? P('presence.ui.nextTip', { event: eventName(id) }) + ' ' + P('eventEffects.' + id) + (fp ? ' ' + P('presence.ui.footprintTip') : '') + (barSavedNow() ? ' ' + P('presence.ui.nextBarSaved') : '') : P('presence.ui.nextNone');
    return '<div class="hud nextev' + (fp ? ' fp' : '') + '" id="nextEvent" data-next="' + (id || '') + '" style="' + box(b) + '"' + tipA(tip) + '>' + nextEventCard(id, { w: b.w }) + '</div>';
  }
  function barSavedNow() { var fc = PON() && U.game ? U.game.presenceForecast() : null; return !!(fc && fc.barSaved); }
  function isLate() { var G = U.game; return PON() && G.state.round >= G.cfg.presence.lateFromNight; }
  function lineHTML(raw) { var lp = lineParts(raw); return lp.who ? '<b>' + esc(Skin.speaker(lp.who, names())) + ':</b> ' + H(lp.text) : H(lp.narr); }
  function flav(raw) { if (!raw) return null; return V4 && ECFG.noStory && lineParts(raw).who ? null : raw; } // v0.4: flavour narration only, no character voice lines
  // centre banners (night start, visit) queue so they never overlap
  function queueBanner(html, cls, ms) {
    var now = Date.now(), at = Math.max(now, U.bannerUntil || 0); ms = ms || 2600; U.bannerUntil = at + ms;
    setTimeout(function () {
      if (U.screen !== 'encounter') return;
      var el = document.createElement('div'); el.className = 'nightBanner ' + (cls || ''); el.style.cssText = box(layoutBox('banner')); el.style.animationDuration = ms + 'ms';
      el.innerHTML = html; stage.appendChild(el); setTimeout(function () { el.remove(); }, ms);
    }, at - now);
  }
  function playFrames(frames, boxName, ms, cls) { // FX frame strip over a board box (stage px), e.g. the turning door handle
    frames = (frames || []).filter(Boolean); if (!frames.length || U.screen !== 'encounter') return;
    var b = layoutBox(boxName); if (!b) return;
    var el = document.createElement('div'); el.className = 'fx ' + (cls || ''); el.style.cssText = box(b);
    var im = document.createElement('img'); im.src = frames[0]; im.alt = ''; el.appendChild(im); stage.appendChild(el);
    if (REDUCED) { im.src = frames[frames.length - 1]; setTimeout(function () { el.remove(); }, (ms || 600) + 600); return; } // prefers-reduced-motion: one still frame
    var i = 0, t = setInterval(function () { i++; if (i < frames.length) im.src = frames[i]; else { clearInterval(t); setTimeout(function () { el.remove(); }, ms || 600); } }, 1000 / (BL.fxFps || 8));
  }
  function visitBanner(f) {
    var fx = null, art = PDIR ? PA('art' + PDIR) : null;
    if (f.type === 'visit') { playFrames(PA('handleFx'), 'doorHandle', 900, 'handle'); playFrames(PA('frostWindowFx'), 'window', 1600, 'frost'); playFrames(PA('frostScreenFx'), 'fullStage', 1400, 'frostscreen'); }
    else if (PA('barStopped')) playFrames([PA('barStopped'), PA('barStopped'), PA('barStopped'), PA('barStopped'), PA('barStopped'), PA('barStopped')], 'barOnDoor', 1200, 'barstop');
    var door = flav(PT.door[f.line % PT.door.length]), c1 = ECFG.noCompanions ? null : flav(PT.c1), bl = flav(PT.turnAway.bar);
    if (f.type === 'visit') queueBanner((art ? '<img class="vart" src="' + art + '" alt="">' : '') + '<div class="nb1">' + X('presence.ui.visitTitle') + '</div>' + (door ? '<div class="nb4 vline">' + lineHTML(door) + '</div>' : '') + '<div class="nb3">' + X('presence.ui.visitEffect') + '</div>' + (c1 ? '<div class="nb4 vline">' + lineHTML(c1) + '</div>' : ''), 'visit', 4200);
    else queueBanner('<div class="nb1">' + X('presence.ui.blockedTitle') + '</div>' + (bl ? '<div class="nb4 vline">' + lineHTML(bl) + '</div>' : ''), 'blocked', 3400);
  }

  function layoutOutlines() { // ?layout=1 or Debug → "boxes": draws every layout box over the art to check alignment
    if (!document.body.classList.contains('showLayout')) return '';
    var o = '';
    Object.keys(A.board.ui).forEach(function (k) { o += '<div class="lo art" style="' + box(A.board.ui[k]) + '"><i>' + k + '</i></div>'; });
    Object.keys(A.board.zones).forEach(function (k) { o += '<div class="lo zonebox" style="' + box(A.board.zones[k]) + '"><i>zone ' + k + '</i></div>'; });
    Object.keys(BL.boxes).forEach(function (k) { if (typeof BL.boxes[k] !== 'string') o += '<div class="lo ovr" style="' + box(BL.boxes[k]) + '"><i>' + k + ' (override)</i></div>'; });
    return o;
  }
  function nightBanner() {
    var S = U.game.state, ev = S.lastEvent, late = isLate();
    var firstLate = late && S.round === U.game.cfg.presence.lateFromNight, lateLine = V4 ? P('presence.ui.lateBanner') : PT.late;
    queueBanner('<div class="nb1">' + X('hud.night', { n: S.round, total: U.game.cfg.rounds }) + '</div><div class="nb2">' + esc(eventName(ev.id)) + (PON() && evDef(ev.id).footprint ? footprintMark('nbfp') : '') + '</div><div class="nb3">' + (ev.cancelled ? X('hud.eventCancelled') : X('eventEffects.' + ev.id)) + '</div>' + (storyFlavour(ev.id) ? '<div class="nb4">' + esc(storyFlavour(ev.id)) + '</div>' : '') +
      (firstLate && lateLine ? '<div class="nb4 late">' + H(lateLine) + '</div>' : ''), late ? 'late' : '', firstLate ? 3600 : 2600);
  }

  function feedText(f) {
    if (f.type === 'presence' || f.type === 'visit' || f.type === 'visitBlocked' || f.type === 'barSaved') return presenceFeedText(f);
    if (f.type === 'barUsed' && f.src && f.src.type === 'visit') return P('presence.ui.feedBlocked');
    var cs = feedCause(f.src || {});
    if (f.type === 'pressure') return P('feed.dread', { sign: f.delta > 0 ? '+' : '−', n: Math.abs(f.delta), cause: cs });
    if (f.type === 'progress') return P('feed.clues', { n: f.delta, cause: cs });
    if (f.type === 'c1') return P(f.delta > 0 ? 'feed.c1Out' : 'feed.c1In', { zone: zoneName(U.game.cfg.zones[f.to].id), cause: cs });
    if (f.type === 'bar') return P('feed.bar', { cause: cs });
    if (f.type === 'barUsed') return P('feed.barUsed', { cause: cs });
    return '';
  }
  function presenceFeedText(f) {
    if (f.type === 'presence') {
      var pc = presenceCause(f.src || {});
      if (f.src && f.src.type === 'offering') return P('presence.ui.feedOffering', { cause: pc });
      return P(f.delta > 0 ? 'presence.ui.feedCloser' : 'presence.ui.feedBack', { space: term('TRACK_APPROACH_' + (f.to + 1)), cause: pc });
    }
    if (f.type === 'visit') return P('presence.ui.feedVisit');
    if (f.type === 'visitBlocked') return '';
    if (f.type === 'barSaved') return P('presence.ui.feedBarSaved');
    return '';
  }
  function presenceCause(s) {
    var k = s.type || '';
    return P('presence.ui.cause.' + k, { event: k === 'footprint' ? eventName(s.id) : '', card: k === 'offering' || k === 'ward' ? cardName(s.id) : '' });
  }
  function feedCause(s) {
    if (s.type === 'visit') return P('presence.ui.visitTitle');
    if (s.type === 'event') return P('feed.cause.event', { event: eventName(s.id) });
    if (s.type === 'card') return P('feed.cause.card', { card: cardName(s.id) });
    if (s.type === 'search') return P('feed.cause.search', { zone: zoneName(s.id) });
    return s.type ? P('feed.cause.' + s.type) : '';
  }
  function spawnFeed() {
    var S = U.game.state, fresh = S.feed.slice(U.feedSeen); U.feedSeen = S.feed.length;
    fresh.forEach(function (f, i) {
      if (f.type === 'visit' || f.type === 'visitBlocked') { visitBanner(f); return; } // the banner says it; no extra toast
      if (f.type === 'presence' && f.src && (f.src.type === 'visitDone' || f.src.type === 'barHeld')) return; // part of the visit banner
      var line = flav(f.type === 'presence' && f.src ? (f.src.type === 'comfortPush' ? PT.turnAway.comfort : f.src.type === 'offering' ? PT.turnAway.offering : f.src.type === 'searchPull' ? PT.search : null) : null);
      if (!feedText(f)) return;
      var tid = f.type === 'pressure' ? 'dread' : f.type === 'progress' ? 'clues' : f.type === 'c1' ? 'tok-C1' : f.type === 'bar' ? 'door' : (f.type === 'presence' || f.type === 'visit' || (f.type === 'barUsed' && f.src && f.src.type === 'visit')) ? 'approach' : 'nightEvent';
      setTimeout(function () {
        var t = document.getElementById(tid); if (!t) return;
        t.classList.remove('pulse'); void t.offsetWidth; t.classList.add('pulse');
        var r = t.getBoundingClientRect(), el = document.createElement('div');
        el.className = 'toast ' + (f.type === 'pressure' || f.type === 'presence' ? (f.delta > 0 ? 'bad' : 'good') : f.type === 'c1' ? (f.delta > 0 ? 'bad' : 'good') : f.type === 'visit' ? 'bad' : 'good');
        el.textContent = feedText(f);
        if (line) { var ln = document.createElement('div'); ln.className = 'tline'; ln.innerHTML = lineHTML(line); el.appendChild(ln); el.classList.add('voice'); }
        el.style.left = Math.max(8, Math.min(window.innerWidth - 340, r.left + r.width / 2 - 160)) + 'px';
        el.style.top = Math.min(window.innerHeight - 60, r.bottom + 6) + 'px';
        layer.appendChild(el); setTimeout(function () { el.remove(); }, 3200);
      }, 250 + i * 450);
    });
  }

  function act(res) {
    if (res && !res.ok) flashMsg(res.error);
    U.moveMode = false;
    renderEncounter();
  }
  function flashMsg(text) {
    var el = document.createElement('div'); el.className = 'toast warn center'; el.textContent = text;
    el.style.left = (window.innerWidth / 2 - 200) + 'px'; el.style.top = (window.innerHeight * 0.4) + 'px';
    layer.appendChild(el); setTimeout(function () { el.remove(); }, 2600);
  }
  function playCard(id) {
    var G = U.game, S = G.state, c = G.card(id), can = G.canPlay(id);
    closeZoom();
    if (!can.ok) { flashMsg(cardName(id) + ': ' + can.why); return; }
    if (c.effect === 'investigateYardFromHouse') return openTray({ kind: 'card', cardId: id, stat: 'INSIGHT', zone: 1 });
    if (c.effect === 'investigateAnyZone') return openTray({ kind: 'card', cardId: id, stat: 'INSIGHT', zone: S.pov, pickZone: true });
    if (c.effect === 'searchAdjacent' || c.effect === 'moveSearch') { // v0.4 Look Closer / Shortcut: pick an area next to you
      var adj = [S.pov - 1, S.pov + 1].filter(function (z) { return z >= 0 && z < G.cfg.zones.length && (c.effect !== 'moveSearch' || V4CFG.shortcutEitherWay || z > S.pov); });
      return openTray({ kind: 'card', cardId: id, stat: 'INSIGHT', zone: adj[adj.length - 1], pickZone: adj.length > 1, zones: adj, moveFirst: c.effect === 'moveSearch' });
    }
    if (c.effect === 'readyHelp' && S.helps.c1.used && S.helps.c2.used) {
      return openPanel('<h2>' + X('cardUi.pierogiWhich') + '</h2><div class="btns">' + ['c1', 'c2'].map(function (w) { return '<button data-w="' + w + '">' + esc(Skin.speaker(w.toUpperCase(), names())) + '</button>'; }).join('') + '</div>', function () {
        all('#overlayBox [data-w]', function (b) { b.onclick = function () { closeOverlay(); act(G.play(id, { helpToReady: b.dataset.w })); tutSignal('play:' + id); }; });
      });
    }
    var r = G.play(id); act(r); if (r.ok) tutSignal('play:' + id);
  }
  function wireEncounter() {
    var G = U.game, S = G.state;
    on('btnMenu', openMenu); on('skipTut', function () { skipCoach(); });
    on('act-end', function () { closeZoom(); var r = G.endRound(); act(r); if (r.ok) tutSignal('endTurn'); });
    actionDefs().forEach(function (d) { on('act-' + d.id, function () { if (d.ok) d.run(); }); });
    on('hintOff', function () { U.hints = false; renderEncounter(); });
    all('.zone', function (z) {
      z.onclick = function () { var i = +z.dataset.zone; if (canAct() && Math.abs(i - S.pov) === 1 && !U.tray) { var r = G.move(i); act(r); if (r.ok) tutSignal('move:' + G.cfg.zones[i].id); } };
    });
    // a token standing in a zone is part of it: clicking the token = clicking that zone (no dead spot on the board)
    ['POV', 'C1', 'C2'].forEach(function (w) {
      var t = document.getElementById('tok-' + w); if (!t) return;
      t.onclick = function () { var zi = w === 'POV' ? S.pov : w === 'C1' ? S.c1 : 0, z = document.querySelector('.zone[data-zone="' + zi + '"]'); if (z) z.click(); };
    });
    all('[data-discard]', function (b) { b.onclick = function (e) { e.stopPropagation(); act(G.discardDown(b.dataset.discard)); }; });
    var drop = document.getElementById('dropPlay');
    all('.hcard', function (h) {
      var id = h.dataset.card;
      h.onmouseenter = function () { if (!U.pinned) showZoom(id, h, false); };
      h.onmouseleave = function () { if (!U.pinned) closeZoom(); };
      h.onclick = function (e) {
        if (e.target.closest('[data-discard]')) return;
        if (U.tray && !U.tray.result) { toggleCommit(id); return; }
        e.stopPropagation(); showZoom(id, h, true);
      };
      h.ondragstart = function (e) { closeZoom(); e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; drop.classList.add('show'); h.classList.add('dragging'); };
      h.ondragend = function () { drop.classList.remove('show', 'over'); h.classList.remove('dragging'); };
    });
    drop.ondragover = function (e) { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = function () { drop.classList.remove('over'); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove('show', 'over'); var id = e.dataTransfer.getData('text/plain'); if (id && (!U.tut || tutAllows('card-' + id))) playCard(id); };
    var ne = document.getElementById('nextEvent');
    if (ne) { ne.onmouseenter = function () { showNEZoom(ne); }; ne.onmouseleave = function () { if (!U.pinned) closeZoom(); }; }
    all('.qchip', function (q) {
      q.onmouseenter = function () { showQZoom(q.dataset.q, q); };
      q.onmouseleave = function () { if (!U.pinned) closeZoom(); };
    });
    if (U.tray) wireTray();
  }

  // ---------- card zoom (screen pixels, readable at any window size) ----------
  function showZoom(id, anchor, pin) {
    closeZoom(); U.pinned = pin ? id : null;
    var G = U.game, can = G ? G.canPlay(id) : { ok: false }, S = G && G.state;
    var why = !can.ok ? (can.why === 'no action' ? P('reasons.noActions') : can.why) : '';
    var zw = Math.round(Math.min(340, window.innerHeight * 0.42)), r = anchor.getBoundingClientRect();
    var el = document.createElement('div'); el.id = 'zoom'; el.className = 'zoom' + (pin ? ' pinned' : '');
    el.innerHTML = cardHTML(id, { w: zw }) + (pin && S && S.phase === 'actions' ? '<div class="zoomBar"><button class="primary" id="zoomPlay" data-ctl="card-' + id + '"' + (can.ok ? '' : ' disabled') + tipA(can.ok ? P('cardUi.playTip', { effect: P('cards.' + id + '.text') }) : why) + '>' + X('cardUi.play') + ' · 1 ' + esc(term('TERM_ACTION')) + '</button>' +
      (can.ok ? '' : '<div class="zwhy">' + esc(why) + '</div>') + '<div class="zhint">' + X('cardUi.addHint') + '</div></div>' : '');
    layer.appendChild(el);
    var h = el.getBoundingClientRect().height;
    el.style.left = Math.max(8, Math.min(window.innerWidth - zw - 8, r.left + r.width / 2 - zw / 2)) + 'px';
    el.style.top = Math.max(8, r.top - h - 12) + 'px';
    on('zoomPlay', function (e) { e.stopPropagation(); playCard(id); });
    if (pin) placeCoach();
  }
  function showNEZoom(anchor) {
    closeZoom();
    var zw = Math.round(Math.min(BL.nextEventZoomW, window.innerHeight * 0.36)), r = anchor.getBoundingClientRect();
    var el = document.createElement('div'); el.id = 'zoom'; el.className = 'zoom nezoom';
    el.innerHTML = nextEventCard(U.game.nextEventId(), { w: zw }); layer.appendChild(el);
    var h = el.getBoundingClientRect().height;
    el.style.left = Math.max(8, Math.min(window.innerWidth - zw - 8, r.right - zw)) + 'px'; el.style.top = Math.max(8, r.top - h - 12) + 'px';
  }
  function showQZoom(qid, anchor) {
    closeZoom();
    var zw = Math.round(Math.min(300, window.innerHeight * 0.38)), r = anchor.getBoundingClientRect();
    var el = document.createElement('div'); el.id = 'zoom'; el.className = 'zoom';
    el.innerHTML = questionCardHTML(qid, { w: zw, have: U.game ? U.game.state.progress : null });
    layer.appendChild(el);
    el.style.left = Math.max(8, Math.min(window.innerWidth - zw - 8, r.left + r.width / 2 - zw / 2)) + 'px';
    el.style.top = Math.min(window.innerHeight - el.getBoundingClientRect().height - 8, r.bottom + 10) + 'px';
  }
  function closeZoom() { var had = U.pinned; U.pinned = null; var z = document.getElementById('zoom'); if (z) z.remove(); if (had && U.tut) placeCoach(); }
  document.addEventListener('click', function (e) { if (U.pinned && !e.target.closest('#zoom') && !e.target.closest('.hcard')) closeZoom(); });

  // ---------- ROLL DIALOG (adding cards is a step inside it) ----------
  function openTray(o) {
    closeZoom(); U.moveMode = false;
    U.tray = Object.assign({ commits: [], helps: [], result: null }, o);
    renderEncounter(); tutSignal('trayOpen');
  }
  function trayNeed() {
    var T = U.tray, c = U.game.cfg;
    if (T.kind === 'steady') return c.steadyDifficulty;
    if (T.kind === 'holdDoor') return c.holdDoorDifficulty;
    return searchNeed(T.zone);
  }
  function trayTitle() {
    var T = U.tray;
    if (T.kind === 'steady') return P('roll.titleComfort');
    if (T.kind === 'holdDoor') return P('roll.titleHold');
    if (T.kind === 'card') return P('roll.titleCard', { card: cardName(T.cardId), zone: zoneName(U.game.cfg.zones[T.zone].id) });
    return P('roll.titleSearch', { zone: zoneName(U.game.cfg.zones[T.zone].id) });
  }
  function toggleCommit(id) {
    var T = U.tray, G = U.game; if (!T || T.result || id === T.cardId) return;
    if (G.card(id).icons.indexOf(Engine.ICON_OF_STAT[T.stat]) < 0) return;
    var i = T.commits.indexOf(id); if (i >= 0) T.commits.splice(i, 1); else T.commits.push(id);
    renderEncounter();
  }
  function faceLabel(tok) { return tok === 'STAR' ? P('roll.faceOmen') : tok > 0 ? '+' + tok : tok < 0 ? '−' + (-tok) : '+0'; }
  function trayHTML() {
    var G = U.game, S = G.state, T = U.tray, need = trayNeed(), ic = Engine.ICON_OF_STAT[T.stat];
    var od = oddsOf(T.stat, need, T.commits, T.helps), pv = od.pv;
    var cands = S.hand.filter(function (id) { return id !== T.cardId && G.card(id).icons.indexOf(ic) >= 0; });
    var addRows = cands.length ? cands.map(function (id) {
      var n = G.card(id).icons.filter(function (x) { return x === ic; }).length, on = T.commits.indexOf(id) >= 0;
      return '<button class="addrow' + (on ? ' on' : '') + '" data-commit="' + id + '"' + (T.result ? ' disabled' : '') + tipA(P('roll.addTip')) + '>' +
        (A.cardArt[id] ? '<img src="' + A.cardArt[id] + '" alt="">' : '<span class="gbthumb"></span>') +
        '<span class="an">' + esc(cardName(id)) + '<small>' + X('roll.addPlayInstead', { effect: P('cards.' + id + '.text') }) + '</small></span>' +
        '<span class="av">' + X('roll.addRow', { n: n }) + ' ' + statIcon(T.stat, { notip: true }) + '</span><span class="ack">' + (on ? '✓' : '+') + '</span></button>';
    }).join('') : '<div class="none">' + X('roll.addNone') + '</div>';
    var helpRows = G.cfg.noCompanions ? '' : ['c1', 'c2'].map(function (w) {
      var e = G.helpEligible(w, T.stat), on = T.helps.indexOf(w) >= 0, close = G.helpBonus(w) === G.cfg.helpBonusBonded;
      var why = e.ok ? '' : S.helps[w].used ? P('reasons.helpUsed') : e.why.indexOf('House') >= 0 ? P('reasons.helpNotHome') : P('reasons.helpWrongStat');
      return '<button class="helprow' + (on ? ' on' : '') + '" data-help="' + w + '"' + (e.ok && !T.result ? '' : ' disabled') + tipA(e.ok ? P('roll.helpOffer', { who: Skin.speaker(w.toUpperCase(), names()), bonus: G.helpBonus(w), close: close ? P('roll.helpCloseTag') : '' }) : why) + '>' +
        (A.portraits[w.toUpperCase()] ? '<img src="' + A.portraits[w.toUpperCase()] + '" alt="">' : '') + '<span>' + esc(Skin.speaker(w.toUpperCase(), names())) + ' <b>+' + G.helpBonus(w) + '</b>' + (e.ok ? '' : '<small>' + esc(why) + '</small>') + '</span><span class="ack">' + (on ? '✓' : '+') + '</span></button>';
    }).join('');
    var r = T.result;
    var faces = od.o.faces.map(function (f) {
      var res = f.result === 'star' ? P('roll.resOmen') : f.result === 'strong' ? P('roll.resStrong') : f.result === 'success' ? P('roll.resWin') : P('roll.resFail');
      return '<div class="face ' + f.result + (r && r.roll === f.roll ? ' rolled' : '') + '"' + tipA(P('roll.faceTip', { face: f.roll, result: res })) + '><div class="fn">' + f.roll + '</div><div class="ft">' + (f.token === 'STAR' ? icon('STAR', { alt: '' }) : esc(faceLabel(f.token))) + '</div><div class="fr">' + esc(res) + '</div></div>';
    }).join('');
    var zonePick = T.pickZone && !r ? '<div class="zonepick">' + X('roll.zonePick') + ' ' + G.cfg.zones.map(function (z, i) {
      if (T.zones && T.zones.indexOf(i) < 0) return '';
      return '<button data-zonepick="' + i + '" class="' + (T.zone === i ? 'on' : '') + '">' + esc(zoneName(z.id)) + ' · ' + X('board.zoneBadge', { need: searchNeed(i), gain: z.progress }) + '</button>'; }).join('') + '</div>' : '';
    var resultBox = r ? '<div class="rollResult ' + (r.star ? 'omen' : r.success ? 'win' : 'fail') + '" id="rollResult"><div class="rr1">' +
      (r.star ? X('roll.omen') : r.strong ? X(T.kind === 'steady' ? 'roll.strongComfort' : 'roll.strong') : r.success ? X('roll.success') : X('roll.fail')) + '</div><div class="rr2">' +
      X('roll.resultLine', { face: r.roll, total: r.star ? '—' : r.total, need: r.difficulty }) + '</div>' +
      '<button class="primary" id="rollDone">' + X('roll.continue') + ' ▸</button></div>' : '';
    return '<div class="tray' + (r ? ' hasResult' : '') + '" id="tray" style="' + box(layoutBox('tray')) + '"><div class="trayHead"><div class="tt">' + esc(trayTitle()) + '</div>' +
      '<div class="tu">' + statIcon(T.stat, { notip: true }) + X('roll.uses', { stat: statName(T.stat) }) + '</div>' +
      '<div class="tneed"' + tipA(P('roll.needTip')) + '>' + X('roll.need', { need: need }) + '</div></div>' + zonePick +
      '<div class="trayBody"><div class="tcol"><div class="th">' + X('roll.addTitle') + '</div><div class="addlist" id="rollAdd">' + addRows + '</div>' +
        (helpRows ? '<div class="th">' + X('roll.helpTitle') + '</div><div class="helplist">' + helpRows + '</div>' : '') + '</div>' +
      '<div class="tcol right"><div class="parts">' + X('roll.parts', { base: pv.base, icons: pv.icons, help: pv.help }) + '</div>' +
        '<div class="total">' + X('roll.total', { total: pv.preDraw, need: need, pct: Odds.pct(od.o.p) }) + '</div>' + trayPresenceLine() +
        '<div class="th"' + tipA(P('roll.diceTip')) + '>' + X('roll.dice') + '</div><div class="faces">' + faces + '</div>' +
        (r ? resultBox : '<div class="tbtns"><button id="rollCancel"' + tipA(P('roll.cancelTip')) + '>' + X('roll.cancel') + '</button><button class="primary big" id="rollGo"' + tipA(P('roll.confirmTip')) + '>' + X('roll.confirm') + ' 🎲</button></div>') +
      '</div></div></div>';
  }
  function trayPresenceLine() { // v0.3: odds preview add-on (Search the Treeline / Comfort)
    if (!PON() || U.tray.result) return '';
    var G = U.game, T = U.tray, last = G.cfg.zones.length - 1, z = T.zone == null ? G.state.pov : T.zone;
    var search = (T.kind === 'investigate' || (T.kind === 'card' && G.cfg.presence.searchPullCountsCards)) && z === last;
    if (search) return '<div class="ppreview" id="presencePreview">' + X('presence.ui.searchPreview') + '</div>';
    if (T.kind === 'steady') return '<div class="ppreview" id="presencePreview">' + X('presence.ui.comfortPreview') + '</div>';
    return '';
  }
  function wireTray() {
    var G = U.game, T = U.tray;
    all('[data-commit]', function (b) { b.onclick = function () { toggleCommit(b.dataset.commit); }; });
    all('[data-help]', function (b) { b.onclick = function () { var i = T.helps.indexOf(b.dataset.help); if (i >= 0) T.helps.splice(i, 1); else T.helps.push(b.dataset.help); renderEncounter(); }; });
    all('[data-zonepick]', function (b) { b.onclick = function () { T.zone = +b.dataset.zonepick; renderEncounter(); }; });
    on('rollCancel', function () { U.tray = null; renderEncounter(); tutSignal('trayCancel'); });
    on('rollGo', function () {
      var ts = tutStep(), want = ts && /^roll:/.test(ts.await || '') ? ts.await.slice(5) : null;
      if (want && T.commits.indexOf(want) < 0) { flashMsg(P('v04.rollNeedsCard', { card: cardName(want) })); shakeCoach(); return; } // v0.4 guided roll: add the named card first
      var o = { commits: T.commits.slice(), helps: T.helps.slice() }, res;
      if (T.kind === 'investigate') res = G.investigate(o);
      else if (T.kind === 'steady') res = G.steady(o);
      else if (T.kind === 'holdDoor') res = G.holdDoor(o);
      else res = G.play(T.cardId, Object.assign(o, { zone: T.zone }));
      if (!res.ok) { flashMsg(res.error); return; }
      T.result = res.test; T.used = o.commits; T.commits = []; T.helps = [];
      renderEncounter(); tutSignal('roll'); if (T.kind === 'card') tutSignal('play:' + T.cardId);
    });
    on('rollDone', function () { var used = T.used || []; U.tray = null; renderEncounter(); used.forEach(function (id) { tutSignal('roll:' + id); }); });
  }

  // ---------- DAWN: answer the Questions ----------
  function clearToasts() { all('#layer .toast', function (t) { t.remove(); }); }
  function renderDawn() {
    U.screen = 'dawn'; clearToasts();
    var G = U.game, S = G.state, c = G.cfg;
    var v = G.validateAllocation(U.alloc), cost = 0;
    U.alloc.forEach(function (id) { cost += c.threads.filter(function (t) { return t.id === id; })[0].cost; });
    var left = S.progress - cost, esc2 = G.escapedTogether();
    var cards = c.threads.map(function (th) {
      var on = U.alloc.indexOf(th.id) >= 0, test = G.validateAllocation(on ? U.alloc : U.alloc.concat([th.id]));
      var why = on || test.ok ? '' : dawnReason(U.alloc.concat([th.id]));
      return '<div class="dq' + (on ? ' on' : '') + (why ? ' cant' : '') + '" data-q="' + th.id + '"' + tipA(why || P('dawn.tip')) + '>' +
        questionCardHTML(th.id, { w: 340, have: on ? th.cost : Math.min(left, th.cost), extra: on ? '<div class="stamp">' + X('dawn.answered') + '</div>' : '' }) + (why ? '<div class="dwhy">' + esc(why) + '</div>' : '') + '</div>';
    }).join('');
    stage.innerHTML = bgHTML('dim') + '<div class="dawnScreen">' +
      '<div class="dbanner ' + (S.pressureMaxed ? 'bad' : '') + '">' + X(S.pressureMaxed ? 'dawn.earlyBanner' : 'dawn.dawnBanner') + '</div>' +
      '<h2>' + X('dawn.title') + '</h2><div class="dsub">' + X('dawn.blurb') + '</div>' +
      '<div class="drow"><div class="dclues" id="clues">' + icon('progress', { alt: '' }) + '<span class="cn">' + left + '</span><span>' + X('dawn.clues', { n: left }) + '</span></div>' +
      '<div class="dtog"' + tipA(P('dawn.togetherTip')) + '>' + X('dawn.together', { yn: P(esc2 ? 'dawn.yes' : 'dawn.no') }) + '</div>' +
      (S.pressureMaxed ? '<div class="dwarn">' + X('dawn.broke', { cap: c.maxThreadsIfPressureMaxed }) + '</div>' : '') + '</div>' +
      '<div class="dcards">' + cards + '</div>' +
      (left > 0 ? '<div class="dwarn">' + X('dawn.warn') + '</div>' : '') +
      '<button class="primary big" id="dawnDone"' + (v.ok ? '' : ' disabled') + tipA(P('dawn.confirmTip')) + '>' + X('dawn.confirm') + '</button></div>';
    all('.dq', function (d) {
      d.onclick = function () {
        var id = d.dataset.q, i = U.alloc.indexOf(id);
        if (i >= 0) U.alloc.splice(i, 1);
        else { var nx = U.alloc.concat([id]); if (!G.validateAllocation(nx).ok) { flashMsg(dawnReason(nx)); return; } U.alloc = nx; }
        renderDawn();
      };
    });
    on('dawnDone', function () { var r = G.allocate(U.alloc); if (r.ok) startOutro(); else flashMsg(r.error); });
    renderDebug();
  }
  function dawnReason(ids) {
    var G = U.game, S = G.state, c = G.cfg, cost = 0;
    ids.forEach(function (id) { cost += c.threads.filter(function (t) { return t.id === id; })[0].cost; });
    if (cost > S.progress) return P('reasons.tooExpensive');
    if (S.pressureMaxed && ids.length > c.maxThreadsIfPressureMaxed) return P('reasons.capBroken', { cap: c.maxThreadsIfPressureMaxed });
    return P('reasons.needTogether');
  }

  // ---------- OUTRO: outcome scene → inserts → recap → results ----------
  function recapLines(R) {
    var ids = U.game.cfg.threads.map(function (t) { return t.id; });
    var ans = ids.filter(function (id) { return R.threadsResolved.indexOf(id) >= 0; }), un = ids.filter(function (id) { return ans.indexOf(id) < 0; });
    var j = function (l) { return l.map(function (id) { return L('recap.phrases.' + id); }).join(L('recap.join')); };
    var key = !ans.length ? 'recap.none' : !un.length ? 'recap.all' : 'recap.some';
    var out = [{ who: 'C2', text: fmt(L(key), { answered: j(ans), unanswered: j(un) }).replace(/^[^:]*: /, '') }];
    if (cfg.recapTagLines) {
      [R.escapedTogether === 'Y' ? 'togetherY' : 'togetherN', R.keyChoice === 'SHARED' ? 'shared' : 'kept'].forEach(function (k) { out.push(lineParts(L('recap.tags.' + k))); });
    }
    return out;
  }
  function startOutro() {
    clearToasts();
    var G = U.game, S = G.state, R = S.result, o = TXT.outcomes[R.outcome];
    if (!U.saved) {
      var now = Date.now();
      store.add(Stats.buildRecord(G, { runId: U.runId, skin: U.skin, tester: U.tester, presenceDirection: PON() ? PDIR : '', outcomeScene: o.title, encounterSeconds: Math.round((now - U.tEncounter) / 1000), totalSeconds: Math.round((now - U.tStart) / 1000),
        tutorial: U.tutInfo && U.tutInfo.used ? (U.tutInfo.skippedAt ? 'skipped@' + U.tutInfo.skippedAt : 'Y') : 'N' }));
      U.saved = true;
    }
    var lines = o.lines.slice(); R.inserts.forEach(function (k) { lines = lines.concat(TXT.inserts[k] || []); });
    var recap = recapLines(R), cast = sceneCast(lines.concat(recap));
    var steps = lines.map(function (l, i) { return { type: 'line', scene: o.title, line: l, cast: cast, warn: o.placeholder && i === 0 }; });
    recap.forEach(function (l, i) { steps.push({ type: 'line', scene: o.title, line: l, cast: cast, stop: i === 0 }); });
    U.screen = 'outro'; U.revealed = [];
    U.vn = { steps: steps, idx: 0, done: renderResults };
    renderVN();
  }
  function renderResults() {
    U.screen = 'results';
    var G = U.game, S = G.state, R = S.result, o = TXT.outcomes[R.outcome];
    var qn = R.threadsResolved.map(function (id) { return P('questions.' + id); }).join(' · ') || P('ui.none');
    var rows = [['ui.flagQuestions', qn], ['ui.flagTogether', P(R.escapedTogether === 'Y' ? 'dawn.yes' : 'dawn.no')], ['ui.flagDread', R.finalPressure + ' / ' + G.cfg.pressureMax],
      ['ui.flagHelp', R.helpsUsed.join(', ') || P('ui.none')], ['ui.flagBond', (R.c1BondChange > 0 ? '+' : '') + R.c1BondChange], ['ui.flagFinalBond', R.finalBondC1 + ' / ' + R.finalBondC2],
      ['ui.flagKey', R.keyChoice], ['ui.flagClues', S.progressEarned + ' / ' + R.progressSpent + ' / ' + R.progressLost], ['ui.flagNights', S.roundsPlayed + ' / ' + G.cfg.rounds],
      ['ui.flagPlays', S.stats.plays + ' / ' + S.stats.commits]];
    stage.innerHTML = bgHTML('dim') + '<div class="title-panel results"><h2>' + H(o.title) + '</h2><h3>' + X('ui.resultsTitle') + '</h3><table class="flags">' +
      rows.map(function (r) { return '<tr><th>' + X(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>' +
      '<p class="muted">' + X('ui.savedNote', { n: store.all().length }) + '</p>' +
      '<div class="btns"><button class="primary big" id="bAgain"' + tipA(P('ui.playAgainTip')) + '>' + X('ui.playAgain') + '</button><button id="bSame"' + tipA(P('ui.replaySameTip')) + '>' + X('ui.replaySame') + '</button><button id="bStats2"' + tipA(P('ui.sendStatsTip')) + '>' + X('ui.sendStats') + '</button></div></div>';
    on('bAgain', function () { U.seed = null; U.runId = null; U.tStart = 0; renderTitle(); });
    on('bSame', function () { U.runId = null; U.tStart = 0; renderTitle(); });
    on('bStats2', openStats);
    renderDebug();
  }

  // ---------- v0.4 END SCREEN: win / lose_dread / lose_short (spec section 2), Play again + Play with tutorial ----------
  function saveRun() {
    if (U.saved) return;
    var G = U.game, now = Date.now(), ti = U.tutInfo || {};
    store.add(Stats.buildRecord(G, { runId: U.runId, skin: U.skin, tester: U.tester, presenceDirection: PON() ? (PDIR || 'neutral') : '', outcomeScene: G.state.result.outcome,
      encounterSeconds: Math.round((now - U.tEncounter) / 1000), totalSeconds: Math.round((now - U.tStart) / 1000),
      tutorial: ti.used ? (ti.skippedAt ? 'skipped@' + ti.skippedAt : ti.completed ? 'completed' : 'Y') : 'N', tutorialSkippedAt: ti.skippedAt || '' }));
    U.saved = true;
  }
  function renderEndV04() {
    U.screen = 'results'; clearToasts(); endCoach(true); saveRun();
    var G = U.game, S = G.state, R = S.result, Pr = S.presence;
    var rows = [['v04.end.rowClues', R.clues + ' / ' + R.clueGoal], ['v04.end.rowDread', R.finalPressure + ' / ' + G.cfg.pressureMax], ['v04.end.rowHours', R.hoursPlayed + ' / ' + G.cfg.rounds]];
    if (Pr) rows.push(['v04.end.rowVisits', Pr.visits + ' (' + Pr.blocked + ')']);
    // Ola's end screens (end/win|dread|dawn_fail) with live text in end_screens.boxes: title, result_line, play_again, play_with_tutorial
    var E = A.end || { boxes: {}, bg: {}, bgSmall: {}, titleColour: {} }, EB = E.boxes, bg = (U.bgSmallOk && E.bgSmall[R.outcome]) || E.bg[R.outcome];
    var eb = function (k, d) { return box(EB[k] || d); };
    stage.innerHTML = (bg ? '<img class="boardbg endbg" src="' + bg + '" alt="" draggable="false">' : bgHTML('dim')) +
      '<div class="endScreen v04 ' + R.outcome + ' t-' + (E.titleColour[R.outcome] || 'paper') + '" id="endScreen" data-result="' + R.outcome + '">' +
      '<div class="endTitle" id="endTitle" style="' + eb('title', { x: 460, y: 96, w: 1000, h: 120 }) + '"><span>' + X('v04.end.' + R.outcome + '.title', { n: R.clues }) + '</span></div>' +
      '<div class="endResult" id="endResult" style="' + eb('result_line', { x: 460, y: 222, w: 1000, h: 64 }) + '"><span>' + X('v04.end.' + R.outcome + '.result', { n: R.clues }) + '</span></div>' +
      '<button class="primary big endBtn" id="bAgain" style="' + eb('play_again', { x: 610, y: 320, w: 340, h: 76 }) + '"' + tipA(P('v04.end.playAgainTip')) + '>' + X('v04.end.playAgain') + '</button>' +
      '<button class="big endBtn" id="bTutAgain" style="' + eb('play_with_tutorial', { x: 970, y: 320, w: 340, h: 76 }) + '"' + tipA(P('v04.end.playTutorialTip')) + '>' + X('v04.end.playTutorial') + '</button>' +
      '<div class="endStats" id="endStats">' + rows.map(function (r) { return '<span><b>' + X(r[0]) + '</b> ' + esc(r[1]) + '</span>'; }).join('') +
      '<span class="muted">' + X('ui.savedNote', { n: store.all().length }) + '</span><button id="bStats2"' + tipA(P('ui.sendStatsTip')) + '>' + X('ui.sendStats') + '</button></div></div>';
    on('bAgain', function () { U.seed = newSeed(); U.runId = null; U.tStart = 0; U.saved = false; startEncounter({ tutorial: false }); });
    on('bTutAgain', function () { U.seed = newSeed(); U.runId = null; U.tStart = 0; U.saved = false; U.wantTutorial = true; startEncounter({ tutorial: true }); });
    on('bStats2', openStats);
    renderDebug();
  }

  // ---------- overlays: menu, how to play, stats ----------
  function openPanel(html, wire) { overlay.classList.remove('hidden'); overlayBox.innerHTML = html + '<div class="btns"><button class="primary" id="ovClose"' + tipA(P('ui.closeTip')) + '>' + X('ui.close') + '</button></div>'; on('ovClose', closeOverlay); if (wire) wire(); }
  function closeOverlay() { overlay.classList.add('hidden'); overlayBox.innerHTML = ''; }
  function openMenu() {
    var G = U.game, inEnc = U.screen === 'encounter';
    var items = [
      ['mHow', 'ui.howToPlay', 'ui.howToPlayTip', true],
      ['mTut', 'ui.tutorial', 'ui.tutorialTip', inEnc],
      ['mHint', 'ui.hints', 'ui.hintsTip', inEnc && ECFG.hintsNight2, U.hints],
      ['mStats', 'ui.stats', 'ui.statsTip', true],
      ['mSeed', 'ui.replaySeed', 'ui.replaySeedTip', !!G],
      ['mDebug', 'ui.debug', 'ui.debugTip', true, !dbg.classList.contains('hidden')],
      ['mRestart', 'ui.restart', 'ui.restartTip', true]
    ];
    openPanel('<h2>' + X('ui.menu') + '</h2>' + (G ? '<div class="muted"' + tipA(P('ui.seedTip')) + '>' + X('ui.seed', { seed: G.state.seed }) + '</div>' : '') + '<div class="menuList">' +
      items.filter(function (i) { return i[3]; }).map(function (i) { return '<button id="' + i[0] + '"' + tipA(P(i[2])) + '>' + X(i[1]) + (i.length > 4 ? ' <b>' + (i[4] ? '✓' : '—') + '</b>' : '') + '</button>'; }).join('') + '</div>', function () {
      on('mHow', openHowTo);
      on('mTut', function () { closeOverlay(); U.wantTutorial = true; startEncounter({ tutorial: true }); });
      on('mHint', function () { U.hints = !U.hints; closeOverlay(); renderEncounter(); });
      on('mStats', openStats);
      on('mSeed', function () { closeOverlay(); U.seed = G.state.seed; startEncounter({ tutorial: false }); });
      on('mDebug', function () { closeOverlay(); toggleDebug(); });
      on('mRestart', function () { if (U.screen === 'title' || confirm(P('ui.restartConfirm'))) { closeOverlay(); U.game = null; U.seed = null; U.runId = null; U.tStart = 0; endCoach(true); renderTitle(); } });
    });
  }
  function openHowTo() {
    var HT = V4 ? UT.v04.howToPlay : UT.howToPlay, ps = A.board.plateSlots;
    var plates = ECFG.zones.map(function (z) {
      if (V4) return '<div class="plate strip"' + tipA(P('board.zoneTip.' + z.id, { need: z.investigateDifficulty, gain: z.progress })) + ' style="' + (A.board.zoneStrips[z.id] ? 'background-image:url(' + A.board.zoneStrips[z.id] + ')' : '') + '"><b>' + esc(zoneName(z.id)) + '</b> <span>' + X('board.zoneBadge', { need: z.investigateDifficulty, gain: z.progress }) + '</span></div>';
      var p = A.board.plates[z.id];
      return '<div class="plate"' + tipA(P('board.zoneTip.' + z.id, { need: z.investigateDifficulty, gain: z.progress })) + '>' + (p ? '<img src="' + p + '" alt="">' : '<div class="gbplate"></div>') +
        '<div class="c-box" data-box="plate.title" style="' + pctBox(ps.title, 480, 320) + '"><span>' + esc(zoneName(z.id)) + '</span></div>' +
        '<div class="c-box pnr" data-box="plate.need_reward" style="' + pctBox(ps.need_reward, 480, 320) + '"><span>' + X('board.zoneBadge', { need: z.investigateDifficulty, gain: z.progress }) + '</span></div></div>';
    }).join('');
    openPanel('<h2>' + H(HT.title) + '</h2><div class="howto">' + HT.body.map(function (p) { return '<p>' + H(p, { max: cfg.pressureMax }) + '</p>'; }).join('') + '</div>' +
      '<div class="plates">' + plates + '</div>' +
      (PON() ? '<h3>' + X('presence.ui.howTitle') + '</h3><div class="howto presence" id="howPresence">' + L('presence.ui.howRules').map(function (p) { return '<p>' + H(p) + '</p>'; }).join('') +
        (PT.howTease ? '<p class="tease">' + H(PT.howTease) + '</p>' : '') + '</div>' : '') +
      '<h3>' + H(HT.glossaryTitle) + '</h3><table class="gloss">' + HT.glossary.map(function (g) { return '<tr><th>' + H(g[0]) + '</th><td>' + H(g[1], { max: cfg.pressureMax }) + '</td></tr>'; }).join('') + '</table>');
  }
  function openStats() {
    var runs = store.all(), sm = Stats.summary(runs);
    var cols = V4 ? ['finishedAt', 'tester', 'seed', 'result', 'clues', 'finalPressure', 'hoursPlayed', 'visits', 'visitsBlocked', 'cardsPlayed', 'tutorial', 'encounterSeconds']
      : ['finishedAt', 'tester', 'seed', 'outcome', 'endReason', 'roundsPlayed', 'progressEarned', 'threadsResolved', 'escapedTogether', 'finalPressure', 'helpsUsed', 'playsVsCommits', 'tutorial', 'encounterSeconds'];
    openPanel('<h2>' + X('ui.statsTitle') + '</h2><p>' + X('ui.statsSummary', { runs: sm.runs, outcomes: JSON.stringify(sm.outcomes), avg: sm.avgProgressEarned, dread: sm.avgFinalPressure, safe: sm.escapedY }) + '</p>' +
      '<div class="tablewrap"><table class="stats"><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>' +
      runs.slice().reverse().map(function (r) { return '<tr>' + cols.map(function (c) { return '<td>' + esc(r[c] == null ? '' : r[c]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' +
      '<div class="btns"><button id="sCopyJ"' + tipA(P('ui.copyTip')) + '>' + X('ui.copyJSON') + '</button><button id="sCopyC"' + tipA(P('ui.copyTip')) + '>' + X('ui.copyCSV') + '</button>' +
      '<button id="sDlJ"' + tipA(P('ui.dlTip')) + '>' + X('ui.dlJSON') + '</button><button id="sDlC"' + tipA(P('ui.dlTip')) + '>' + X('ui.dlCSV') + '</button><button id="sClear"' + tipA(P('ui.clearTip')) + '>' + X('ui.clearStats') + '</button></div>' +
      '<p class="muted">' + X('ui.statsNote') + '</p><textarea id="sOut" readonly></textarea>', function () {
      function copy(txt) {
        document.getElementById('sOut').value = txt;
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { flashMsg(P('ui.copied')); }, function () { flashMsg(P('ui.clipBlocked')); });
        else flashMsg(P('ui.clipBlocked'));
      }
      function dl(txt, name, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
      function stamp() { return new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'); }
      on('sCopyJ', function () { copy(Stats.toJSON(store.all())); });
      on('sCopyC', function () { copy(Stats.toCSV(store.all(), V4 ? Stats.COLUMNS_V04 : null)); });
      on('sDlJ', function () { dl(Stats.toJSON(store.all()), 'cottage-runs-' + stamp() + '.json', 'application/json'); });
      on('sDlC', function () { dl(Stats.toCSV(store.all(), V4 ? Stats.COLUMNS_V04 : null), 'cottage-runs-' + (V4 ? 'v04-' : '') + stamp() + '.csv', 'text/csv'); });
      on('sClear', function () { if (confirm(P('ui.clearConfirm'))) { store.clear(); openStats(); } });
    });
  }

  // ---------- guided Night 1 (coach marks) ----------
  // v0.4: Tomek's 10 steps (guided Hours 1-2, then the handoff); v0.3: the guided Night 1
  var STEPS = V4 ? JSON.parse(JSON.stringify(UT.v04.onboarding.steps))
    : JSON.parse(JSON.stringify(UT.onboarding.steps.filter(function (st) { return !st.needsPresence || PON(); })).replace(/@tutorialCard/g, (ECFG.tutorialHand || [])[1] || 'kompot'));
  // tour play step: Kompot keeps its line; Bread and Salt gets the line for the Presence direction (neutral with no direction)
  STEPS.forEach(function (st) {
    if (st.voiceBread && ((ECFG.tutorialHand || [])[1] === 'bread')) st.voice = PON() ? (st.voiceBread[PDIR] || st.voiceBread.neutral) : st.voiceBread.neutral;
    delete st.voiceBread;
    if (st.voice === '@tour.presence') st.voice = UT.tour.presence;
  });
  function tutStep() { return U.tut ? STEPS[U.tut.i] : null; }
  function tutAllows(ctl) { var s = tutStep(); return !s || (s.allow || []).indexOf(ctl) >= 0; }
  function tutAdvance() {
    if (!U.tut) return;
    var s = tutStep();
    if (s && s.id === 'clue' && U.tray) { U.tray = null; }
    U.tut.i++;
    if (U.tut.i >= STEPS.length) { if (U.tutInfo) U.tutInfo.completed = true; if (U.game) U.game.endTutorial(); endCoach(); } // v0.4 handoff: tooltips only from here, guided rolls end
    if (U.screen === 'encounter') renderEncounter();
  }
  function tutSignal(sig) {
    var s = tutStep(); if (!s) return;
    if (sig === 'trayCancel' && s.id === 'add' && !V4) { U.tut.i = STEPS.map(function (x) { return x.id; }).indexOf('search'); placeCoach(); return; }
    if (s.await === sig) tutAdvance();
  }
  function endCoach(silent) {
    if (U.tut && !silent) safeSet(TUT_KEY, '1');
    U.tut = null; coach.classList.add('hidden'); coach.innerHTML = '';
  }
  function shakeCoach() { var b = document.getElementById('coachBubble'); if (b) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); } }
  function skipCoach() {
    var s = tutStep(); if (U.tutInfo) U.tutInfo.skippedAt = s ? s.id : null;
    if (U.game) U.game.endTutorial();
    safeSet(TUT_KEY, '1'); endCoach(true); renderEncounter();
  }
  function placeCoach() {
    var s = tutStep();
    if (!s || U.screen !== 'encounter') { coach.classList.add('hidden'); return; }
    var W = window.innerWidth, Hh = window.innerHeight, rects = [];
    var tg = U.tray && s.trayTarget ? (U.tray.result ? ['rollResult'] : s.trayTarget) : s.target; // v0.4: inside the roll window, highlight the adds + Roll, then the result
    (tg || []).forEach(function (id) { var e = document.getElementById(id); if (e) { var r = e.getBoundingClientRect(); if (r.width) rects.push(r); } });
    var zm = document.getElementById('zoom'); if (zm && zm.classList.contains('pinned') && (s.allow || []).some(function (x) { return /^card-/.test(x); })) rects.push(zm.getBoundingClientRect());
    var holes = rects.map(function (r) { return '<rect x="' + (r.left - 8) + '" y="' + (r.top - 8) + '" width="' + (r.width + 16) + '" height="' + (r.height + 16) + '" rx="10" fill="black"/>'; }).join('');
    var rings = rects.map(function (r) { return '<div class="coachRing" style="left:' + (r.left - 8) + 'px;top:' + (r.top - 8) + 'px;width:' + (r.width + 16) + 'px;height:' + (r.height + 16) + 'px"></div>'; }).join('');
    var voice = s.voice ? lineParts(s.voice) : null;
    var n = U.tut.i + 1;
    coach.innerHTML = '<svg class="coachShade" width="' + W + '" height="' + Hh + '"><defs><mask id="cm"><rect width="100%" height="100%" fill="white"/>' + holes + '</mask></defs><rect width="100%" height="100%" fill="rgba(5,8,12,.62)" mask="url(#cm)"/></svg>' + rings +
      '<div class="coachBubble" id="coachBubble"><div class="cstep">' + X('ui.coachStep', { n: n, total: STEPS.length }) + '</div>' +
      (voice ? '<div class="cvoice">' + (voice.who ? '<b>' + esc(Skin.speaker(voice.who, names())) + ':</b> ' + H(voice.text) : H(voice.narr)) + '</div>' : '') +
      '<div class="ctext">' + H(s.text, coachVars()) + '</div>' +
      (s.await && s.await !== 'modal' ? '<div class="ctry">' + X('ui.coachTryIt') + '</div>' : '') +
      '<div class="cbtns">' + (V4 ? '' : '<button id="coachSkip"' + tipA(P('ui.coachSkipTip')) + '>' + X('ui.coachSkip') + '</button>') +
      (U.tut.i > 0 && !s.await && !STEPS[U.tut.i - 1].await ? '<button id="coachBack"' + tipA(P('ui.coachBackTip')) + '>' + X('ui.coachBack') + '</button>' : '') +
      (s.await && s.await !== 'modal' ? '' : '<button class="primary" id="coachNext"' + tipA(P('ui.coachNextTip')) + '>' + X(n === STEPS.length ? 'ui.coachDone' : 'ui.coachNext') + ' ▸</button>') + '</div></div>';
    coach.classList.toggle('modal', s.await === 'modal');
    coach.classList.toggle('v04', V4);
    coach.classList.remove('hidden');
    var b = document.getElementById('coachBubble'), bw = b.offsetWidth, bh = b.offsetHeight, x, y;
    if (V4) { // v0.4 layout v3: coach text in the hint_line strip; the handoff in tutorial_modal (stage boxes → screen pixels)
      var sr = stage.getBoundingClientRect(), cb = layoutBox(s.await === 'modal' ? 'tutorialModal' : 'coach');
      b.style.left = (sr.left + cb.x * SCALE) + 'px'; b.style.top = (sr.top + cb.y * SCALE) + 'px'; b.style.width = (cb.w * SCALE) + 'px';
      b.style.minHeight = (cb.h * SCALE) + 'px'; b.style.fontSize = ((s.await === 'modal' ? 20 : 17) * SCALE) + 'px';
    } else if (rects.length) {
      var u = rects.reduce(function (a, r) { return { l: Math.min(a.l, r.left), t: Math.min(a.t, r.top), r: Math.max(a.r, r.right), b: Math.max(a.b, r.bottom) }; }, { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
      x = (u.l + u.r) / 2 - bw / 2;
      y = u.b + 18 + bh < Hh ? u.b + 18 : u.t - 18 - bh;
      if (y < 8) { y = Math.max(8, (u.t + u.b) / 2 - bh / 2); x = u.r + 18 + bw < W ? u.r + 18 : u.l - 18 - bw; }
    } else { x = W / 2 - bw / 2; y = Hh / 2 - bh / 2; }
    if (!V4) { b.style.left = Math.max(8, Math.min(W - bw - 8, x)) + 'px'; b.style.top = Math.max(8, Math.min(Hh - bh - 8, y)) + 'px'; }
    on('coachNext', function () { tutAdvance(); });
    on('coachBack', function () { U.tut.i--; renderEncounter(); });
    on('coachSkip', skipCoach);
  }
  function coachVars() { // live numbers for the coach text (v0.4 handoff: hours left after the guided ones, clues still needed)
    var G = U.game, S = G ? G.state : null, gh = ECFG.tutorialGuidedHours || 0;
    return { max: cfg.pressureMax, dread: S ? S.pressure : 0, left: G ? G.cfg.rounds - gh : 0, more: G ? Math.max(0, G.cfg.clueGoal - S.progress) : 0 };
  }
  // while a coach step is up, only the highlighted controls work (the Menu and the bubble always do)
  function tutBlock(e) {
    var s = tutStep(); if (!s || U.screen !== 'encounter') return;
    var t = e.target;
    if (t.closest('#coachBubble') || t.closest('#overlay') || t.closest('#btnMenu') || t.closest('#debug') || t.closest('#skipTut')) return;
    if (s.await === 'modal') { e.preventDefault(); e.stopPropagation(); shakeCoach(); return; }
    var allow = s.allow || [];
    if (t.closest('#tray') && allow.indexOf('tray') >= 0) return;
    var c = t.closest('[data-ctl]');
    if (c && allow.indexOf(c.dataset.ctl) >= 0) return;
    e.preventDefault(); e.stopPropagation();
    var b = document.getElementById('coachBubble'); if (b) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }
  }
  document.addEventListener('click', tutBlock, true);
  document.addEventListener('dragstart', tutBlock, true);

  // ---------- tooltips ----------
  var tipEl = document.createElement('div'); tipEl.id = 'tip'; tipEl.className = 'tip hidden'; layer.appendChild(tipEl);
  var tipTimer = null, tipFor = null;
  document.addEventListener('mouseover', function (e) {
    var t = e.target.closest && e.target.closest('[data-tip]');
    if (t === tipFor) return;
    tipFor = t; clearTimeout(tipTimer); tipEl.classList.add('hidden');
    if (!t) return;
    tipTimer = setTimeout(function () {
      tipEl.textContent = t.getAttribute('data-tip'); tipEl.classList.remove('hidden');
      var r = t.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      var y = r.bottom + 8 + h < window.innerHeight ? r.bottom + 8 : r.top - 8 - h;
      tipEl.style.left = Math.max(6, Math.min(window.innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px'; tipEl.style.top = Math.max(6, y) + 'px';
    }, 280);
  });

  // ---------- debug panel ----------
  function renderDebug() {
    if (dbg.classList.contains('hidden')) return;
    var G = U.game;
    var html = '<b>DEBUG</b> · screen ' + U.screen + ' · skin ' + U.skin + ' · icons ' + ICON_STYLE + ' · ' + esc(cfg.version) + ' · <button id="dbgBoxes">layout boxes</button><br>' +
      'rules ' + esc(JSON.stringify(cfg.rules)) + ' · tutorial ' + (U.tut ? STEPS[U.tut.i].id : 'off') + '<br>';
    if (G) {
      var S = G.state;
      html += 'seed <b>' + S.seed + '</b> · phase ' + S.phase + ' · round ' + S.round + '/' + G.cfg.rounds + ' · actions ' + S.actionsLeft + '<br>' +
        'pressure ' + S.pressure + ' (max seen ' + S.maxPressureSeen + ', maxed ' + S.pressureMaxed + ') · progress ' + S.progress + ' (earned ' + S.progressEarned + ')<br>' +
        'POV ' + G.cfg.zones[S.pov].id + ' · C1 ' + G.cfg.zones[S.c1].id + ' (brought back ' + S.c1BroughtBack + ') · bars ' + S.bars + ' · torch ' + S.torch + ' · silence ' + S.silence + '<br>' +
        (S.presence ? 'presence ' + S.presence.mode + (S.presence.asked !== S.presence.mode ? ' (asked ' + S.presence.asked + ')' : '') + ' · dir ' + PDIR + ' · pos ' + G.cfg.presence.spaces[S.presence.pos] + ' · visits ' + S.presence.visits + ' (blocked ' + S.presence.blocked + ') · offerings ' + S.presence.offerings + ' · pushes ' + S.presence.comfortPushes + ' · pulls ' + S.presence.searchPulls + ' · forecast ' + esc(JSON.stringify(G.presenceForecast())) + '<br>' : 'presence off<br>') +
        'helps c1 ' + (S.helps.c1.used ? 'used' : 'ready') + ' / c2 ' + (S.helps.c2.used ? 'used' : 'ready') + ' · bond ' + S.flags.bond + ' · key ' + S.flags.key + '<br>' +
        'hand [' + S.hand.join(', ') + ']<br>deck [' + S.deck.join(', ') + ']<br>discard [' + S.discard.join(', ') + ']<br>' +
        'night deck [' + S.events.join(', ') + '] · seen [' + S.eventsSeen.join(', ') + ']<br>' +
        'plays ' + S.stats.plays + ' · commits ' + S.stats.commits + ' · tests ' + S.stats.tests + ' (ok ' + S.stats.testSuccesses + ', omens ' + S.stats.stars + ')<br>' +
        (S.phase === 'allocate' ? 'legal allocations: ' + G.legalAllocations().map(function (a) { return '[' + a.join('+') + ']'; }).join(' ') + '<br>' : '') +
        (S.result ? 'result ' + esc(JSON.stringify(S.result)) + '<br>' : '') +
        '<div class="log">' + S.log.slice().reverse().map(function (l) { return '<div class="' + l.kind + '">R' + l.round + ' ' + esc(l.text) + '</div>'; }).join('') + '</div>';
    } else html += 'No encounter yet.';
    dbg.innerHTML = html;
    on('dbgBoxes', function () { document.body.classList.toggle('showLayout'); if (U.screen === 'encounter') renderEncounter(); });
  }
  function toggleDebug() { dbg.classList.toggle('hidden'); renderDebug(); }

  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'd' || e.key === 'D') toggleDebug();
    if (e.key === 'Escape') { if (!overlay.classList.contains('hidden')) closeOverlay(); else if (U.pinned) closeZoom(); else if (U.tray && !U.tray.result && !U.tut) { U.tray = null; renderEncounter(); } }
    if ((e.key === ' ' || e.key === 'Enter') && (U.screen === 'vn' || U.screen === 'outro') && document.getElementById('bNext') && overlay.classList.contains('hidden')) { e.preventDefault(); vnNext(); }
  });
  window.__ui = { STEPS: STEPS, U: U, fmt: fmt, P: P, cardHTML: cardHTML, questionCardHTML: questionCardHTML, nextEventCard: nextEventCard, renderEncounter: function () { renderEncounter(); }, tutGo: function (i) { if (U.tut) { U.tut.i = i; renderEncounter(); } } }; // for tests / audits

  fit();
  renderTitle();
})();
