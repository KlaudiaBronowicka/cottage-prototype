/* =====================================================================
 * game.js — pure encounter rules engine (no DOM). Runs in browser + node.
 * Implements "Cottage Paper Prototype Kit v0.1" rules. Numbers: config.js
 * ===================================================================== */
(function (root) {
  'use strict';

  // ---------- Seeded RNG (mulberry32) ----------
  function makeRng(seed) {
    var s = seed >>> 0;
    var rng = function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rng.int = function (n) { return Math.floor(rng() * n); };
    rng.shuffle = function (arr) {
      for (var i = arr.length - 1; i > 0; i--) { var j = rng.int(i + 1); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
      return arr;
    };
    return rng;
  }

  var STAT_OF_ICON = { I: 'INSIGHT', N: 'NERVE', C: 'CARE' };
  var ICON_OF_STAT = { INSIGHT: 'I', NERVE: 'N', CARE: 'C' };

  /**
   * createGame(cfg, opts)
   *  opts.seed        integer seed
   *  opts.bond        'C1' | 'C2'          (Beat 4 choice 1)
   *  opts.key         'SHARED' | 'KEPT'    (Beat 4 choice 2)
   *  opts.visited     ['3a','3b','3c']     (Beat 3 spots; faster variant removes unvisited cards)
   */
  function createGame(cfg, opts) {
    opts = opts || {};
    var seed = (opts.seed == null ? Math.floor(Math.random() * 1e9) : opts.seed) >>> 0;
    var rng = makeRng(seed);
    var zoneIds = cfg.zones.map(function (z) { return z.id; });
    var now = opts.now || function () { return Date.now(); }; // injectable clock (tests)

    var S = {
      seed: seed,
      round: 0,
      phase: 'setup',          // setup | actions | discard | allocate | done
      actionsLeft: 0,
      pressure: cfg.startPressure,
      maxPressureSeen: cfg.startPressure,
      pressureMaxed: false,
      progress: cfg.startProgress,
      progressEarned: 0,
      pov: 0, c1: 0,           // zone index (0 = House). COMPANION 2 always in House.
      povLeftHouse: false, c1EverOutside: false, roundStartedAt: [], endedAt: null,
      c1BroughtBack: false,
      deck: [], hand: [], discard: [], removed: [],
      events: [], eventsSeen: [],
      bars: 0,
      torch: 0,                // difficulty reduction for next Investigate this round
      silence: false,
      helps: { c1: { used: false, uses: 0 }, c2: { used: false, uses: 0 } },
      flags: { bond: opts.bond || 'C1', key: opts.key || 'SHARED', visited: opts.visited || ['3a', '3b', '3c'] },
      stats: { plays: 0, commits: 0, tests: 0, testSuccesses: 0, stars: 0, actions: {}, cardsPlayed: [], cardsCommitted: [], pressureByRound: [], progressByRound: [] },
      endReason: null,         // 'dawn' | 'pressure'
      roundsPlayed: 0,
      resolved: [],
      outcome: null,
      result: null,
      lastTest: null,
      log: []
    };

    function log(msg, kind) { S.log.push({ round: S.round, kind: kind || 'info', text: msg }); }
    function card(id) { for (var i = 0; i < cfg.deck.length; i++) if (cfg.deck[i].id === id) return cfg.deck[i]; return null; }
    function zoneName(i) { return cfg.zones[i].name; }
    function ended() { return S.phase === 'allocate' || S.phase === 'done'; }

    function changePressure(delta, why) {
      if (ended() || !delta) return;
      var before = S.pressure;
      S.pressure = Math.max(cfg.pressureMin, Math.min(cfg.pressureMax, S.pressure + delta));
      S.maxPressureSeen = Math.max(S.maxPressureSeen, S.pressure);
      log('Pressure ' + before + ' → ' + S.pressure + ' (' + why + ')', delta > 0 ? 'bad' : 'good');
      if (S.pressure >= cfg.pressureMax) earlyEnd();
    }
    function earlyEnd() {
      S.pressureMaxed = true;
      S.endReason = 'pressure';
      S.roundsPlayed = S.round;
      S.c1 = zoneIds.length - 1; S.c1EverOutside = true; // narrative: COMPANION 1 walks out (confirmed: bond -1, escaped N)
      log('EARLY END: pressure reached ' + cfg.pressureMax + '. COMPANION 1 walks out.', 'end');
      enterAllocate();
    }
    function enterAllocate() { S.endedAt = now(); S.phase = 'allocate'; S.actionsLeft = 0; snapshotRound(); }
    function snapshotRound() { S.stats.pressureByRound.push(S.pressure); S.stats.progressByRound.push(S.progress); }

    function drawCards(n, why) {
      var got = 0;
      for (var i = 0; i < n; i++) {
        if (!S.deck.length) { log('Deck is empty — no card drawn (no reshuffle).', 'warn'); break; }
        S.hand.push(S.deck.shift()); got++;
      }
      if (got) log('Drew ' + got + ' card(s)' + (why ? ' (' + why + ')' : '') + '.');
      return got;
    }
    function moveC1(delta, why) {
      var before = S.c1;
      S.c1 = Math.max(0, Math.min(zoneIds.length - 1, S.c1 + delta));
      if (S.c1 !== before) {
        if (S.c1 < before) S.c1BroughtBack = true;
        if (S.c1 > 0) S.c1EverOutside = true;
        log('COMPANION 1: ' + zoneName(before) + ' → ' + zoneName(S.c1) + ' (' + why + ')', delta > 0 ? 'bad' : 'good');
      }
    }
    function gainProgress(n, why) { S.progress += n; S.progressEarned += n; log('+' + n + ' progress (' + why + '). Total ' + S.progress + '.', 'good'); }

    // ---------- Setup ----------
    function setup() {
      var ids = cfg.deck.map(function (c) { return c.id; });
      if (cfg.fasterVariant) {
        ids = ids.filter(function (id) {
          var c = card(id);
          if (c.beat3 && S.flags.visited.indexOf(c.beat3) < 0) { S.removed.push(id); return false; }
          return true;
        });
        if (S.removed.length) log('Faster variant: removed ' + S.removed.join(', ') + ' (Beat 3 spot skipped).');
      }
      S.deck = rng.shuffle(ids);
      S.events = rng.shuffle(cfg.events.map(function (e) { return e.id; }));
      log('Seed ' + seed + '. Bond: ' + S.flags.bond + ', key: ' + S.flags.key + '. Pressure ' + S.pressure + ', progress ' + S.progress + '.');
      drawCards(cfg.startingHand, 'starting hand');
      startRound();
    }

    // ---------- Round ----------
    function startRound() {
      S.round++;
      S.roundStartedAt.push(now());
      S.torch = 0; S.silence = false;
      S.actionsLeft = cfg.actionsPerRound;
      S.phase = 'actions';
      log('— ROUND ' + S.round + ' —', 'round');
      // NIGHT
      var evId = S.events.shift();
      // RULED (Kostka 2026-10-18) (confirmed): 8 events / 6 rounds never runs out at default tuning; if rounds > events, seen events are reshuffled.
      if (!evId) { S.events = rng.shuffle(S.eventsSeen.slice()); evId = S.events.shift(); }
      var ev = null; for (var i = 0; i < cfg.events.length; i++) if (cfg.events[i].id === evId) ev = cfg.events[i];
      S.eventsSeen.push(evId);
      S.lastEvent = { id: evId, cancelled: false };
      if (S.bars > 0) {
        S.bars--; S.lastEvent.cancelled = true;
        log('NIGHT: ' + ev.name + ' — cancelled by a Bar (Bars left: ' + S.bars + ').', 'good');
        return;
      }
      log('NIGHT: ' + ev.name, 'event');
      if (ev.onlyIfPOVOutside && S.pov === 0) { log('POV is in the House — no effect.'); return; }
      if (ev.c1Out) moveC1(ev.c1Out, ev.name);
      if (ev.discardRandom) {
        for (var k = 0; k < ev.discardRandom && S.hand.length; k++) {
          var idx = rng.int(S.hand.length); var lost = S.hand.splice(idx, 1)[0]; S.discard.push(lost);
          log('Discarded at random: ' + card(lost).name + '.', 'bad');
        }
      }
      if (ev.noEndDraw) S.silence = true;
      if (ev.pressure) changePressure(ev.pressure, ev.name);
    }

    function endRound() {
      if (S.phase !== 'actions') return;
      // END: exposure
      if (S.pov === zoneIds.length - 1 && cfg.exposurePOV) changePressure(cfg.exposurePOV, 'POV in the Treeline');
      if (ended()) return;
      if (S.c1 === zoneIds.length - 1 && cfg.exposureC1) changePressure(cfg.exposureC1, 'COMPANION 1 in the Treeline');
      if (ended()) return;
      if (S.silence) log('Silence: no end-of-round draw.');
      else drawCards(1, 'end of round');
      if (S.hand.length > cfg.handLimit) { S.phase = 'discard'; log('Hand over limit (' + S.hand.length + '/' + cfg.handLimit + '): discard down.', 'warn'); return; }
      finishRound();
    }
    function finishRound() {
      snapshotRound();
      if (S.round >= cfg.rounds) {
        S.endReason = 'dawn'; S.roundsPlayed = S.round;
        log('DAWN after round ' + S.round + '.', 'end');
        S.endedAt = now();
        S.phase = 'allocate';
        return;
      }
      startRound();
    }
    function discardDown(cardId) {
      if (S.phase !== 'discard') return err('Not discarding now.');
      var i = S.hand.indexOf(cardId); if (i < 0) return err('Card not in hand.');
      S.hand.splice(i, 1); S.discard.push(cardId); log('Discarded ' + card(cardId).name + ' (hand limit).');
      if (S.hand.length <= cfg.handLimit) { S.phase = 'actions'; finishRound(); }
      return ok();
    }

    // ---------- Tests ----------
    function helpBonus(who) { return S.flags.bond === who.toUpperCase() ? cfg.helpBonusBonded : cfg.helpBonus; }
    function helpEligible(who, stat) {
      var h = cfg.helps[who]; if (!h) return { ok: false, why: 'unknown help' };
      if (S.helps[who].used) return { ok: false, why: 'already used' };
      if (h.stats.indexOf(stat) < 0) return { ok: false, why: 'not a ' + stat + ' helper' };
      if (h.onlyInHouse && S.c1 !== 0) return { ok: false, why: 'COMPANION 1 is not in the House' };
      return { ok: true, bonus: helpBonus(who) };
    }
    function previewTest(stat, difficulty, commits, helps) {
      commits = commits || []; helps = helps || [];
      var icon = ICON_OF_STAT[stat], icons = 0;
      commits.forEach(function (id) { card(id).icons.forEach(function (ic) { if (ic === icon) icons++; }); });
      var hb = 0; helps.forEach(function (w) { var e = helpEligible(w, stat); if (e.ok) hb += e.bonus; });
      return { base: cfg.testBase, icons: icons, help: hb, preDraw: cfg.testBase + icons + hb, difficulty: difficulty };
    }
    function runTest(label, stat, difficulty, commits, helps, forcedRoll) {
      commits = (commits || []).slice(); helps = (helps || []).slice();
      for (var i = 0; i < commits.length; i++) if (S.hand.indexOf(commits[i]) < 0) throw new Error('Committed card not in hand: ' + commits[i]);
      if (!cfg.allowBothHelpsOnOneTest && helps.length > 1) throw new Error('Only one Help per test.');
      helps.forEach(function (w) { var e = helpEligible(w, stat); if (!e.ok) throw new Error('Help ' + w + ' not usable: ' + e.why); });
      var pv = previewTest(stat, difficulty, commits, helps);
      commits.forEach(function (id) { S.hand.splice(S.hand.indexOf(id), 1); S.discard.push(id); S.stats.commits++; S.stats.cardsCommitted.push(id); });
      helps.forEach(function (w) { S.helps[w].used = true; S.helps[w].uses++; });
      var roll = forcedRoll || (rng.int(6) + 1);
      var tok = cfg.testBag[roll - 1];
      var star = tok === 'STAR';
      var total = pv.preDraw + (star ? 0 : tok);
      var success = !star && total >= difficulty;
      var strong = success && total >= difficulty + cfg.strongMargin;
      S.stats.tests++; if (success) S.stats.testSuccesses++; if (star) S.stats.stars++;
      var r = { label: label, stat: stat, difficulty: difficulty, base: pv.base, icons: pv.icons, help: pv.help, roll: roll, token: tok, star: star, total: total, success: success, strong: strong, commits: commits, helps: helps };
      S.lastTest = r;
      log(label + ' [' + stat + ' vs ' + difficulty + ']: base ' + pv.base + ' + icons ' + pv.icons + ' + help ' + pv.help + ' + draw ' + (star ? 'STAR' : (tok >= 0 ? '+' + tok : tok)) + ' (d6=' + roll + ') = ' + (star ? 'AUTO-FAIL' : total) + ' → ' + (star ? 'FAIL (STAR)' : strong ? 'STRONG SUCCESS' : success ? 'success' : 'fail'), success ? 'good' : 'bad');
      if (helps.length) helps.forEach(function (w) { log('Help used: ' + (w === 'c1' ? 'COMPANION 1' : 'COMPANION 2') + ' (+' + helpBonus(w) + ').'); });
      if (star) changePressure(cfg.starPressure, 'STAR');
      return r;
    }

    // ---------- Actions ----------
    function ok(extra) { return Object.assign({ ok: true }, extra || {}); }
    function err(msg) { return { ok: false, error: msg }; }
    function spend(name) { S.actionsLeft--; S.stats.actions[name] = (S.stats.actions[name] || 0) + 1; }
    function needAction() {
      if (S.phase !== 'actions') return 'Not in the action phase.';
      if (S.actionsLeft <= 0) return 'No actions left — end the round.';
      return null;
    }
    function badCommits(o, playedId) {
      var c = (o && o.commits) || [], seen = {};
      for (var i = 0; i < c.length; i++) {
        if (c[i] === playedId) return 'A card is played OR committed, never both.';
        if (S.hand.indexOf(c[i]) < 0) return 'Committed card not in hand: ' + c[i];
        if (seen[c[i]]) return 'Card committed twice.'; seen[c[i]] = 1;
      }
      return null;
    }

    function doInvestigate(zoneIdx, label, commits, helps, forcedRoll) {
      var z = cfg.zones[zoneIdx];
      var diff = Math.max(0, z.investigateDifficulty - S.torch);
      if (S.torch) log('Torch: difficulty ' + z.investigateDifficulty + ' → ' + diff + '.');
      S.torch = 0;
      var r = runTest(label + ' (' + z.name + ')', 'INSIGHT', diff, commits, helps, forcedRoll);
      if (r.success && !ended()) gainProgress(z.progress + (r.strong ? cfg.strongInvestigateBonus : 0), 'Investigate ' + z.name + (r.strong ? ', strong' : ''));
      return r;
    }

    var api = {
      state: S,
      cfg: cfg,
      card: card,
      zoneName: zoneName,
      previewTest: previewTest,
      helpEligible: helpEligible,
      helpBonus: helpBonus,

      move: function (toIdx) {
        var e = needAction(); if (e) return err(e);
        if (Math.abs(toIdx - S.pov) !== 1) return err('Move one zone at a time.');
        spend('move');
        log('Move: POV ' + zoneName(S.pov) + ' → ' + zoneName(toIdx) + '.');
        S.pov = toIdx; if (toIdx > 0) S.povLeftHouse = true; return ok();
      },
      investigate: function (o) {
        o = o || {}; var e = needAction() || badCommits(o); if (e) return err(e);
        spend('investigate');
        return ok({ test: doInvestigate(S.pov, 'Investigate', o.commits, o.helps, o.roll) });
      },
      steady: function (o) {
        o = o || {}; var e = needAction() || badCommits(o); if (e) return err(e);
        spend('steady');
        var r = runTest('Steady', 'CARE', cfg.steadyDifficulty, o.commits, o.helps, o.roll);
        if (r.success && !ended()) {
          moveC1(-1, 'Steady');
          changePressure(-(cfg.steadyPressureRelief + (r.strong ? cfg.strongSteadyBonus : 0)), 'Steady' + (r.strong ? ', strong' : ''));
        }
        return ok({ test: r });
      },
      holdDoor: function (o) {
        o = o || {}; var e = needAction() || badCommits(o); if (e) return err(e);
        if (zoneIds[S.pov] !== cfg.holdDoorZone) return err('Hold the door only works in the House.');
        if (!cfg.barsStack && S.bars > 0) return err('A Bar is already down — Bars do not stack (max 1).');
        spend('holdDoor');
        var r = runTest('Hold the door', 'NERVE', cfg.holdDoorDifficulty, o.commits, o.helps, o.roll);
        if (r.success && !ended()) { S.bars++; log('Bar placed (Bars: ' + S.bars + ').', 'good'); }
        return ok({ test: r });
      },
      drawAction: function () {
        var e = needAction(); if (e) return err(e);
        if (!S.deck.length) return err('Deck is empty.'); // RULED (Kostka 2026-10-18) (confirmed): Draw with an empty deck is not allowed (no reshuffle)
        spend('draw'); drawCards(1, 'Draw action'); return ok();
      },
      canPlay: function (id) {
        if (S.phase !== 'actions' || S.actionsLeft <= 0) return { ok: false, why: 'no action' };
        if (S.hand.indexOf(id) < 0) return { ok: false, why: 'not in hand' };
        var c = card(id);
        if (c.effect === 'investigateYardFromHouse' && cfg.photosRequiresHouse && S.pov !== 0) return { ok: false, why: 'POV must be in the House' };
        if (c.effect === 'readyHelp' && cfg.pierogiNeedsUsedHelp && !S.helps.c1.used && !S.helps.c2.used) return { ok: false, why: 'no Help has been used yet' };
        if (c.effect === 'placeBar' && !cfg.barsStack && S.bars > 0) return { ok: false, why: 'a Bar is already down (max 1)' };
        return { ok: true };
      },
      /** play(cardId, params) params: {zone, commits, helps, helpToReady, roll} */
      play: function (id, p) {
        p = p || {};
        var can = api.canPlay(id); if (!can.ok) return err('Cannot play: ' + can.why);
        var c = card(id);
        var bc = badCommits(p, id); if (bc) return err(bc);
        spend('play');
        S.hand.splice(S.hand.indexOf(id), 1); S.discard.push(id);
        S.stats.plays++; S.stats.cardsPlayed.push(id);
        log('PLAY ' + c.name + ': ' + c.text);
        var res = ok();
        switch (c.effect) {
          case 'investigateYardFromHouse': res.test = doInvestigate(1, c.name, p.commits, p.helps, p.roll); break;
          case 'investigateAnyZone':
            var zi = p.zone == null ? S.pov : p.zone;
            res.test = doInvestigate(zi, c.name, p.commits, p.helps, p.roll); break;
          case 'placeBar': S.bars++; log('Bar placed (Bars: ' + S.bars + ').', 'good'); break;
          case 'progressObject': gainProgress(S.flags.key === 'SHARED' ? c.valueShared : c.value, c.name + (S.flags.key === 'SHARED' ? ', SHARED' : '')); break;
          case 'progress': gainProgress(c.value, c.name); break;
          case 'torch': S.torch = c.value; log('Next Investigate this round: -' + c.value + ' difficulty.'); break;
          case 'c1Home': if (S.c1 > 0) moveC1(-S.c1, c.name); else log('COMPANION 1 is already in the House.'); break;
          case 'pressure': changePressure(c.value, c.name); break;
          case 'draw': drawCards(c.value, c.name); break;
          case 'readyHelp':
            var w = p.helpToReady || (S.helps.c1.used ? 'c1' : 'c2');
            if (S.helps[w].used) { S.helps[w].used = false; log((w === 'c1' ? 'COMPANION 1' : 'COMPANION 2') + "'s Help is ready again.", 'good'); }
            else log('No used Help to ready.');
            break;
          case 'c1InwardAndCalm': moveC1(-1, c.name); changePressure(c.value, c.name); break;
          default: log('Unknown effect ' + c.effect, 'warn');
        }
        return res;
      },
      endRound: function () {
        if (S.phase !== 'actions') return err('Not in the action phase.');
        if (S.actionsLeft > 0 && !cfg.allowPass) return err('Take all your actions first.');
        if (S.actionsLeft > 0) log('Passed ' + S.actionsLeft + ' unused action(s).');
        endRound(); return ok();
      },
      discardDown: discardDown,

      // ---------- Scoring ----------
      escapedTogether: function () { return !S.pressureMaxed && S.c1 === 0; },
      validateAllocation: function (ids) {
        ids = ids || [];
        var cost = 0, seen = {};
        for (var i = 0; i < ids.length; i++) {
          if (seen[ids[i]]) return err('Thread listed twice: ' + ids[i]); seen[ids[i]] = 1;
          var t = cfg.threads.filter(function (x) { return x.id === ids[i]; })[0];
          if (!t) return err('Unknown thread ' + ids[i]);
          cost += t.cost;
        }
        if (cost > S.progress) return err('Not enough progress (' + cost + ' > ' + S.progress + ').');
        if (S.pressureMaxed && ids.length > cfg.maxThreadsIfPressureMaxed) return err('Pressure reached ' + cfg.pressureMax + ': resolve at most ' + cfg.maxThreadsIfPressureMaxed + ' Thread.');
        if (cfg.allThreadsNeedEscapedTogether && ids.length >= cfg.threads.length && !api.escapedTogether()) return err('All three Threads also need Escaped together = Y.');
        return ok({ cost: cost });
      },
      allocate: function (ids) {
        if (S.phase !== 'allocate') return err('Not allocating now.');
        ids = (ids || []).slice().sort();
        var v = api.validateAllocation(ids); if (!v.ok) return v;
        S.resolved = ids;
        var esc = api.escapedTogether();
        var key = ids.join('+');
        var outcome;
        if (S.pressureMaxed || ids.length <= 1) outcome = (cfg.outcome3StayedVariant && !S.pressureMaxed && esc) ? '3b' : '3'; // RULED (Kostka 2026-10-18): '3b' = Dawn, Together (0-1 Threads, escaped Y)
        else if (ids.length === 3) outcome = '1';
        else outcome = { 'T1+T2': '2a', 'T1+T3': '2b', 'T2+T3': '2c' }[key];
        S.outcome = outcome;
        var bondChange = S.c1 === 0 ? (S.c1BroughtBack ? cfg.c1BondPlusIfBroughtBackAndHome : 0) : cfg.c1BondMinusIfOutside;
        var helpsUsed = [];
        if (S.helps.c1.uses) helpsUsed.push('C1' + (S.helps.c1.uses > 1 ? 'x' + S.helps.c1.uses : ''));
        if (S.helps.c2.uses) helpsUsed.push('C2' + (S.helps.c2.uses > 1 ? 'x' + S.helps.c2.uses : ''));
        var inserts = [];
        if (outcome === '3b') { if (ids.length === 1) inserts.push('together1', 'together1_' + ids[0]); else inserts.push('together0'); }
        if (!esc && outcome !== '3' && outcome !== '3b') inserts.push('escapedN');
        // RULED (Kostka 2026-10-18): the +3 Help bonus uses the Beat 4 choice, but the "bond raised" inserts use FINAL bond =
        //   Beat 4 choice (+1 to the chosen companion) + encounter bond change (COMPANION 1 only).
        var finalBondC1 = (S.flags.bond === 'C1' ? 1 : 0) + bondChange;
        var finalBondC2 = (S.flags.bond === 'C2' ? 1 : 0);
        if (finalBondC1 > 0) inserts.push('bondC1');
        if (finalBondC2 > 0) inserts.push('bondC2');
        inserts.push(S.flags.key === 'SHARED' ? 'shared' : 'kept');
        if (S.pressure >= cfg.highPressureInsert[0] && S.pressure <= cfg.highPressureInsert[1]) inserts.push('highPressure');
        S.result = {
          outcome: outcome, threadsResolved: ids, progressAtEnd: S.progress, progressSpent: v.cost, progressLost: S.progress - v.cost,
          escapedTogether: esc ? 'Y' : 'N', finalPressure: S.pressure, helpsUsed: helpsUsed, c1BondChange: bondChange,
          bondChoice: S.flags.bond, keyChoice: S.flags.key, finalBondC1: finalBondC1, finalBondC2: finalBondC2, inserts: inserts
        };
        log('RESOLVED: ' + (ids.length ? ids.join(', ') : 'none') + ' → Outcome ' + outcome + '. Escaped together ' + (esc ? 'Y' : 'N') + ', final pressure ' + S.pressure + ', C1 bond ' + (bondChange > 0 ? '+' : '') + bondChange + '.', 'end');
        S.phase = 'done';
        return ok({ result: S.result });
      },
      /** threads affordable combos (for UI hints and tests) */
      legalAllocations: function () {
        var ids = cfg.threads.map(function (t) { return t.id; }), out = [];
        for (var m = 0; m < (1 << ids.length); m++) {
          var pick = ids.filter(function (_, i) { return m & (1 << i); });
          if (api.validateAllocation(pick).ok) out.push(pick);
        }
        return out;
      }
    };

    setup();
    return api;
  }

  var Engine = { createGame: createGame, makeRng: makeRng, STAT_OF_ICON: STAT_OF_ICON, ICON_OF_STAT: ICON_OF_STAT };
  if (typeof module !== 'undefined') module.exports = Engine; else root.Engine = Engine;
})(this);
