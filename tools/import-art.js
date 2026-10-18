#!/usr/bin/env node
/* =====================================================================
 * tools/import-art.js — wire the Concept Artist's delivery into the prototype.
 *   node tools/import-art.js [artDir=/workspace/cottage-art] [--dry-run]
 * Reads <artDir>/manifest.json (+ cards/card_layout.json), copies the WEB versions
 * (.webp for bitmaps, .svg for icons/glyphs) into assets/art/, and rewrites
 * assets/manifest.js. Anything missing stays null → the UI draws a greybox placeholder.
 * Never copied: _src/, _mock* (reference mock-ups), _board_zones_debug / _board_late_zones_debug (reference), icons/*_64 (raster fallbacks; we use the SVGs), burnt_pierogi (dropped in v0.2), anything under any _retired/ folder or in manifest.retired (e.g. the thread icon).
 * Cast (which companions/<key>_* files fill which slot) is read from manifest.cast, not hardcoded.
 * Kit card id → artist file name mapping is CARD_FILES below.
 * ===================================================================== */
'use strict';
var fs = require('fs'), path = require('path');
var args = process.argv.slice(2), dry = args.indexOf('--dry-run') >= 0;
var src = path.resolve(args.filter(function (a) { return a[0] !== '-'; })[0] || '/workspace/cottage-art');
var project = path.resolve(__dirname, '..');
var dstRoot = path.join(project, 'assets', 'art');
if (!fs.existsSync(path.join(src, 'manifest.json'))) { console.error('No manifest.json in ' + src); process.exit(1); }
var M = JSON.parse(fs.readFileSync(path.join(src, 'manifest.json'), 'utf8'));
var L = fs.existsSync(path.join(src, 'cards/card_layout.json')) ? JSON.parse(fs.readFileSync(path.join(src, 'cards/card_layout.json'), 'utf8')) : M.card_layout;

var CARD_FILES = { photos: 'footprint_photos', object: 'the_object', story: 'the_hosts_story', key: 'key_on_a_string', kompot: 'kompot',
  stove: 'stove_fire', blanket: 'thick_blanket', later: 'later_properly', rule: 'mothers_rule', chair: 'chair_under_the_handle',
  torch: 'torch', phone: 'phone_at_4', pierogi: null /* dropped: art not imported */,
  bread: 'bread_and_salt' /* v0.3 Offering card: expected from Ola, greybox until then */ };
var CATS = ['clue', 'calm', 'protect', 'utility'];
var copied = [], missing = [];
// start clean so files the artist dropped or renamed (and our old WebP conversions) don't linger
if (!dry && fs.existsSync(dstRoot)) fs.rmSync(dstRoot, { recursive: true, force: true });

// copy the best web version of <rel without extension>; prefer svg when allowed, else webp, else png
var RETIRED = [];
(M.retired || []).forEach(function (r) { var d = path.dirname(r.path); RETIRED.push(r.path); (r.also || []).forEach(function (f) { RETIRED.push(path.join(d, f)); }); });
function isRetired(rel) { return /(^|\/)_retired\//.test(rel) || RETIRED.indexOf(rel) >= 0 || RETIRED.some(function (r) { return path.basename(r) === path.basename(rel); }); }
function take(relNoExt, preferSvg) {
  var exts = preferSvg ? ['.svg', '.webp', '.png'] : ['.webp', '.png', '.jpg'];
  for (var i = 0; i < exts.length; i++) {
    var rel = relNoExt + exts[i], from = path.join(src, rel);
    if (isRetired(rel)) continue;
    if (fs.existsSync(from)) {
      var to = path.join(dstRoot, rel);
      if (!dry) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); }
      copied.push(rel); return 'assets/art/' + rel;
    }
  }
  missing.push(relNoExt); return null;
}
// (v0.3.1: every PNG now has the artist's own WebP twin, so our PNG→WebP conversion is gone; take() picks her .webp.)
function boxes(o) { var r = {}; Object.keys(o || {}).forEach(function (k) { var b = o[k]; if (b && b.x != null) r[k] = { x: b.x, y: b.y, w: b.w, h: b.h }; }); return r; }
function asset(p) { return (M.assets || []).filter(function (a) { return a.path === p; })[0] || {}; }

var out = {
  generatedBy: 'tools/import-art.js from ' + src + ' (' + (M.version || '?') + ')',
  style: M.style, palette: M.palette,
  card: {
    size: L.size, boxes: boxes(L.boxes), rollIconSlot: (L.boxes.roll_icons || {}).slot || 80, rollIconMax: (L.boxes.roll_icons || {}).max || 3,
    categories: L.categories,
    frame: { neutral: take('cards/card_frame') }, panels: { neutral: take('cards/card_panels') }, glyph: {}
  },
  cardArt: {},
  board: {
    bg: take('board/board_bg'), bgSmall: take('board/board_bg_1280x720'), size: M.board.size,
    zones: boxes(M.board.zones), ui: Object.assign(boxes(M.board.ui_boxes), boxes(M.board.overlay_boxes)), overlayIds: Object.keys(M.board.overlay_boxes || {}), hierarchy: M.board.hierarchy,
    plates: {}, plateSlots: boxes(asset('board/zone_house.png').slots)
  },
  dread: { track: take('dread/pressure_track'), size: asset('dread/pressure_track.png').size || [1400, 200], steps: [], label: null, tiles: [] },
  questions: { layout: boxes(M.question_layout), bg: {}, icon: {} },
  tokens: {}, portraits: {}, helps: {}, helpSlots: boxes((asset('companions/help_companion_1.png').slots) || {}),
  icons: { colour: {}, mono: {} }, moons: [], dawn: null
};
var HV = (L.variants || {}).hand;
if (HV) out.card.hand = { boxes: boxes(HV.boxes), rollIconSlot: (HV.boxes.roll_icons || {}).slot || 110, rollIconMax: (HV.boxes.roll_icons || {}).max || 3, frame: { neutral: take('cards/card_frame_hand') }, panels: { neutral: take('cards/card_panels_hand') } };
CATS.forEach(function (c) { if (HV) { out.card.hand.frame[c] = take('cards/card_frame_hand_' + c); out.card.hand.panels[c] = take('cards/card_panels_hand_' + c); } });
CATS.forEach(function (c) { out.card.frame[c] = take('cards/card_frame_' + c); out.card.panels[c] = take('cards/card_panels_' + c); out.card.glyph[c] = take('cards/glyphs/category_' + c, true); });
Object.keys(CARD_FILES).forEach(function (id) { out.cardArt[id] = CARD_FILES[id] ? take('cards/art/' + CARD_FILES[id]) : null; });
['house', 'yard', 'treeline'].forEach(function (z) { out.board.plates[z] = take('board/zone_' + z); });
var tr = asset('dread/pressure_track.png');
out.dread.steps = (tr.step_boxes || tr.steps || []).map(function (b) { return { step: b.step, x: b.x, y: b.y, w: b.w, h: b.h }; });
if (tr.label_box) out.dread.label = { x: tr.label_box.x, y: tr.label_box.y, w: tr.label_box.w, h: tr.label_box.h };
for (var i = 0; i <= 6; i++) out.dread.tiles.push(take('dread/pressure_step_' + i));
[['T1', 'being'], ['T2', 'companion'], ['T3', 'past']].forEach(function (q) { out.questions.bg[q[0]] = take('questions/question_' + q[1]); out.questions.icon[q[0]] = take('icons/question_' + q[1], true); });
// Cast from manifest.cast: each key (pov, companion_1, companion_2) is a file prefix; SLOT_OF maps it to the engine slot.
var SLOT_OF = { pov: 'POV', companion_1: 'C1', companion_2: 'C2' };
var castKeys = Object.keys(M.cast || {}).filter(function (k) { return k !== 'status' && k !== 'lineup'; });
if (!castKeys.length) { console.error('manifest.cast missing; expected keys ' + Object.keys(SLOT_OF).join(', ')); process.exit(1); }
out.cast = { status: (M.cast || {}).status || null, slots: {} };
castKeys.forEach(function (k) {
  var slot = SLOT_OF[k]; if (!slot) { console.error('Unknown cast key in manifest: ' + k); process.exit(1); }
  out.cast.slots[slot] = { key: k, description: M.cast[k] };
  out.tokens[slot] = take('companions/' + k + '_token_256'); out.portraits[slot] = take('companions/' + k + '_256');
  if (slot !== 'POV') out.helps[slot.toLowerCase()] = take('companions/help_' + k);
});
Object.keys(SLOT_OF).forEach(function (k) { if (castKeys.indexOf(k) < 0) console.warn('WARN cast slot not in manifest.cast: ' + k + ' (greybox)'); });
// icons: 'colour' = <id>_color where the artist made one (v0.3: stat icons now have colour versions), else the base file.
var ICONS = { CARE: 'care', INSIGHT: 'insight', NERVE: 'nerve', STAR: 'star', pressure: 'pressure', progress: 'progress', bar: 'bar', barOnDoor: 'bar_on_door', action: 'action', deck: 'deck' };
Object.keys(ICONS).forEach(function (k) {
  var col = fs.existsSync(path.join(src, 'icons/' + ICONS[k] + '_color.svg')) || fs.existsSync(path.join(src, 'icons/' + ICONS[k] + '_color.webp'));
  out.icons.colour[k] = take('icons/' + ICONS[k] + (col ? '_color' : ''), true);
  out.icons.mono[k] = fs.existsSync(path.join(src, 'icons/' + ICONS[k] + '_light.svg')) ? take('icons/' + ICONS[k] + '_light', true) : out.icons.colour[k];
});
out.icons.mono.barOnDoor = out.icons.mono.bar; // one-colour mode: plain bar instead of the coloured bar-on-door
for (var n = 1; n <= 6; n++) out.moons.push(take('icons/moon_' + n, true));
out.dawn = take('icons/dawn', true);
// v0.3 The Approach (Ola, manifest "v0.3 The Approach + art-fit fixes"). Missing files render as greyboxes.
var before = missing.length;
var PRES = { A: 'domowik', B: 'zmora' };
out.presence = {
  marker: take('icons/presence', true), markerA: take('presence/presence_' + PRES.A + '_token_128'), markerB: take('presence/presence_' + PRES.B + '_token_128'),
  artA: take('presence/presence_' + PRES.A + '_256'), artB: take('presence/presence_' + PRES.B + '_256'),
  track: take('approach/approach_track'), trackSize: asset('approach/approach_track.png').size || [1000, 280],
  steps: (asset('approach/approach_track.png').steps || []).map(function (b) { return { id: b.id, step: b.step, x: b.x, y: b.y, w: b.w, h: b.h, name: b.name_box ? boxes({ n: b.name_box }).n : null }; }),
  tiles: {}, footprint: take('icons/footprint', true), footprintLight: take('icons/footprint_light', true), appease: take('icons/appease', true),
  nextEventFrame: take('cards/next_event_frame'), nextEventSize: asset('cards/next_event_frame.png').size || [375, 525], nextEventLayout: boxes(M.next_event_layout),
  bar: take('fx/bar_on_door', true), barStopped: take('fx/bar_visit_stopped', true),
  handleFx: [1, 2, 3, 4].map(function (f) { return take('fx/visit_handle_f' + f, true); }),
  frostWindowFx: [1, 2, 3, 4].map(function (f) { return take('fx/visit_frost_window_f' + f); }),
  frostScreenFx: [1, 2, 3, 4].map(function (f) { return take('fx/visit_frost_screen_f' + f); }),
  barStoppedIcon: take('icons/bar_stopped', true), eventCardBack: take('cards/event_card_back')
};
['treeline', 'yard', 'window', 'door'].forEach(function (id, i) { out.presence.tiles[id] = take('approach/approach_step_' + (i + 1) + '_' + id); });
out.board.bgLate = take('board/board_bg_late'); out.board.bgLateSmall = take('board/board_bg_late_1280x720'); out.board.skyLate = take('board/sky_late_overlay');
var expectedV03 = missing.slice(before).concat(out.cardArt.bread ? [] : ['cards/art/bread_and_salt']);
missing = missing.slice(0, before).filter(function (m) { return m !== 'cards/art/bread_and_salt'; });

var js = '/* =====================================================================\n * assets/manifest.js — ART ASSET LAYER (GENERATED by tools/import-art.js — do not hand-edit)\n' +
  ' * Paths are relative to index.html. null = not delivered → greybox placeholder.\n' +
  ' * Boxes are artist pixels: cards in 750x1050, board in 1920x1080, Question cards in 750x1050.\n' +
  ' * Layout overrides/corrections live in data/board-layout.js.\n' +
  ' * ===================================================================== */\nvar ASSET_MANIFEST = ' + JSON.stringify(out, null, 1) + ';\nif (typeof module !== \'undefined\') module.exports = ASSET_MANIFEST;\n';
if (!dry) fs.writeFileSync(path.join(project, 'assets', 'manifest.js'), js);
console.log((dry ? '[dry run] ' : '') + 'copied ' + copied.length + ' files; missing ' + missing.length + (expectedV03.length ? '; v0.3 art not delivered yet (greybox): ' + expectedV03.length : '') + (missing.length ? ': ' + missing.join(', ') : ''));
if (expectedV03.length) console.log('v0.3 expected (greybox until delivered): ' + expectedV03.join(', '));
