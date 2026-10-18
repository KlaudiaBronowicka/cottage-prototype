/* =====================================================================
 * stats.js — per-run playtest stats, stored in localStorage.
 * One record per finished run. Export as JSON or CSV for testers.
 * ===================================================================== */
(function (root) {
  'use strict';
  // Kit v0.1 observation sheet "Record per run" fields (all present): progress earned | Threads resolved | escaped together |
  // final pressure | Help used | bond change | key choice | outcome scene | rounds played | plays vs commits.
  // Plus "Watch for" items that can be measured automatically, and run metadata.
  var COLUMNS = [
    // run metadata
    'runId', 'finishedAt', 'build', 'seed', 'skin', 'tester',
    // kit "Record per run"
    'progressEarned', 'threadsResolved', 'escapedTogether', 'finalPressure', 'helpsUsed', 'c1BondChange', 'keyChoice',
    'outcome', 'outcomeScene', 'roundsPlayed', 'plays', 'commits', 'playsVsCommits',
    // kit "Watch for" (automatic part)
    'encounterSeconds', 'secondsPerRound', 'povLeftHouse', 'c1EverOutside', 'c1EndedOutside',
    // supporting detail
    'endReason', 'totalSeconds', 'actionsTaken', 'startProgress', 'progressAtEnd', 'progressSpent', 'progressLost', 'threadsOpen', 'T1', 'T2', 'T3',
    'maxPressure', 'pressureByRound', 'progressByRound', 'bondChoice', 'finalBondC1', 'finalBondC2', 'beat3Visited',
    'tests', 'testSuccesses', 'stars', 'cardsPlayed', 'cardsCommitted', 'actionCounts',
    // v0.2: rule set, tutorial, unused actions, per-night detail
    'rules', 'tutorial', 'unusedActions', 'perRound',
    // v0.3 The Approach: Presence logging (Tension Pass §9.11)
    'presenceMode', 'presenceDirection', 'presenceByNight', 'presenceVisits', 'presenceVisitsBlocked', 'barHeldForVisit', 'offeringsPlayed', 'comfortPushes', 'searchPulls', 'presenceSteps', 'presenceClosest'];

  // v0.4 Stripped Core (spec section 8.16): result, clues, final Dread, hours played, visits, visits blocked, cards played by id,
  // tutorial completed/skipped and the step where it was skipped. "Night" columns are named per Hour.
  var COLUMNS_V04 = ['runId', 'finishedAt', 'build', 'seed', 'tester',
    'result', 'clues', 'clueGoal', 'finalPressure', 'maxPressure', 'hoursPlayed', 'visits', 'visitsBlocked', 'barHeldForVisit',
    'cardsPlayed', 'cardsCommitted', 'plays', 'commits', 'tutorial', 'tutorialSkippedAt',
    'encounterSeconds', 'secondsPerHour', 'totalSeconds', 'actionCounts', 'unusedActions', 'tests', 'testSuccesses', 'stars', 'povLeftHouse',
    'pressureByHour', 'cluesByHour', 'perHour', 'presenceMode', 'presenceDirection', 'presenceByHour', 'offeringsPlayed', 'comfortPushes', 'searchPulls', 'presenceSteps', 'presenceClosest'];

  function buildRecord(game, meta) {
    if (game.cfg.noQuestions) return buildRecordV04(game, meta);
    var S = game.state, R = S.result, cfg = game.cfg, Pr = S.presence;
    var open = cfg.threads.map(function (t) { return t.id; }).filter(function (id) { return R.threadsResolved.indexOf(id) < 0; });
    var actions = 0; for (var k in S.stats.actions) actions += S.stats.actions[k];
    return {
      runId: meta.runId, finishedAt: new Date().toISOString(), build: cfg.version, seed: S.seed, skin: meta.skin || '', tester: meta.tester || '',
      outcome: R.outcome, endReason: S.endReason, roundsPlayed: S.roundsPlayed, actionsTaken: actions,
      startProgress: cfg.startProgress, progressEarned: S.progressEarned, progressAtEnd: R.progressAtEnd, progressSpent: R.progressSpent, progressLost: R.progressLost,
      threadsResolved: R.threadsResolved.join('+'), threadsOpen: open.join('+'),
      T1: R.threadsResolved.indexOf('T1') >= 0 ? 1 : 0, T2: R.threadsResolved.indexOf('T2') >= 0 ? 1 : 0, T3: R.threadsResolved.indexOf('T3') >= 0 ? 1 : 0,
      escapedTogether: R.escapedTogether, finalPressure: R.finalPressure, maxPressure: S.maxPressureSeen,
      pressureByRound: S.stats.pressureByRound.join(' '), progressByRound: S.stats.progressByRound.join(' '),
      helpsUsed: R.helpsUsed.join('+'), c1BondChange: R.c1BondChange, bondChoice: R.bondChoice, keyChoice: R.keyChoice,
      beat3Visited: S.flags.visited.join('+'),
      plays: S.stats.plays, commits: S.stats.commits, tests: S.stats.tests, testSuccesses: S.stats.testSuccesses, stars: S.stats.stars,
      cardsPlayed: S.stats.cardsPlayed.join(' '), cardsCommitted: S.stats.cardsCommitted.join(' '),
      actionCounts: Object.keys(S.stats.actions).map(function (k) { return k + ':' + S.stats.actions[k]; }).join(' '),
      encounterSeconds: meta.encounterSeconds, totalSeconds: meta.totalSeconds,
      outcomeScene: meta.outcomeScene || '', playsVsCommits: S.stats.plays + ':' + S.stats.commits,
      secondsPerRound: secondsPerRound(S), povLeftHouse: S.povLeftHouse ? 'Y' : 'N', c1EverOutside: S.c1EverOutside ? 'Y' : 'N',
      c1EndedOutside: S.c1 > 0 ? 'Y' : 'N', finalBondC1: R.finalBondC1, finalBondC2: R.finalBondC2,
      rules: Object.keys(cfg.rules || {}).filter(function (k) { return cfg.rules[k]; }).join('+'),
      tutorial: meta.tutorial || (S.tutorial ? 'Y' : 'N'),
      unusedActions: S.roundsPlayed * cfg.actionsPerRound - actions,
      // one entry per night: n<round>:<action counts>|p<plays>c<commits>h<helps>|D<dread>|C<clues>|<pov>/<c1>
      perRound: (S.perRound || []).map(function (r) {
        return 'n' + r.round + ':' + (Object.keys(r.actions).map(function (k) { return k + r.actions[k]; }).join('.') || '-') + '|p' + r.plays + 'c' + r.commits + 'h' + r.helps + '|D' + r.dread + '|C' + r.clues + '|' + r.pov + '/' + r.c1 + (r.presence != null ? '|P' + r.presence : '');
      }).join(' '),
      // Presence position per night is a track index: 0 Treeline, 1 Yard, 2 Window, 3 Door
      presenceMode: Pr ? (Pr.asked !== Pr.mode ? Pr.asked + '>' + Pr.mode : Pr.mode) : 'off',
      presenceDirection: Pr ? (meta.presenceDirection || (cfg.presence && cfg.presence.direction) || '') : '',
      presenceByNight: Pr ? Pr.byNight.join(' ') : '', presenceVisits: Pr ? Pr.visits : '', presenceVisitsBlocked: Pr ? Pr.blocked : '',
      barHeldForVisit: Pr ? Pr.barHeldForVisit : '', offeringsPlayed: Pr ? Pr.offerings : '', comfortPushes: Pr ? Pr.comfortPushes : '', searchPulls: Pr ? Pr.searchPulls : '',
      presenceSteps: Pr ? Pr.steps : '', presenceClosest: Pr ? Pr.closest : ''
    };
  }

  function buildRecordV04(game, meta) {
    var S = game.state, R = S.result, cfg = game.cfg, Pr = S.presence, actions = 0;
    for (var k in S.stats.actions) actions += S.stats.actions[k];
    return {
      runId: meta.runId, finishedAt: new Date().toISOString(), build: cfg.version, seed: S.seed, tester: meta.tester || '',
      result: R.outcome, outcome: R.outcome, clues: R.clues, clueGoal: R.clueGoal, finalPressure: R.finalPressure, maxPressure: S.maxPressureSeen,
      hoursPlayed: R.hoursPlayed, endReason: S.endReason, visits: R.visits, visitsBlocked: R.visitsBlocked, barHeldForVisit: Pr ? Pr.barHeldForVisit : '',
      cardsPlayed: S.stats.cardsPlayed.join(' '), cardsCommitted: S.stats.cardsCommitted.join(' '), plays: S.stats.plays, commits: S.stats.commits,
      tutorial: meta.tutorial || (S.tutorial ? 'Y' : 'N'), tutorialSkippedAt: meta.tutorialSkippedAt || '',
      encounterSeconds: meta.encounterSeconds, secondsPerHour: secondsPerRound(S), totalSeconds: meta.totalSeconds,
      actionCounts: Object.keys(S.stats.actions).map(function (k) { return k + ':' + S.stats.actions[k]; }).join(' '),
      unusedActions: S.roundsPlayed * cfg.actionsPerRound - actions, tests: S.stats.tests, testSuccesses: S.stats.testSuccesses, stars: S.stats.stars,
      povLeftHouse: S.povLeftHouse ? 'Y' : 'N',
      pressureByHour: S.stats.pressureByRound.join(' '), cluesByHour: S.stats.progressByRound.join(' '),
      // one entry per Hour: h<hour>:<action counts>|p<plays>c<commits>|D<dread>|C<clues>|<pov>|P<creature>
      perHour: (S.perRound || []).map(function (r) {
        return 'h' + r.round + ':' + (Object.keys(r.actions).map(function (k) { return k + r.actions[k]; }).join('.') || '-') + '|p' + r.plays + 'c' + r.commits + '|D' + r.dread + '|C' + r.clues + '|' + r.pov + (r.presence != null ? '|P' + r.presence : '');
      }).join(' '),
      presenceMode: Pr ? Pr.mode : 'off', presenceDirection: Pr ? (meta.presenceDirection || '') : '',
      presenceByHour: Pr ? Pr.byNight.join(' ') : '', offeringsPlayed: Pr ? Pr.offerings : '', comfortPushes: Pr ? Pr.comfortPushes : '', searchPulls: Pr ? Pr.searchPulls : '',
      presenceSteps: Pr ? Pr.steps : '', presenceClosest: Pr ? Pr.closest : ''
    };
  }

  // seconds spent in each round (space-separated), from the engine's round start timestamps to the end of the encounter
  function secondsPerRound(S) {
    var t = S.roundStartedAt || [], out = [];
    for (var i = 0; i < t.length; i++) { var end = i + 1 < t.length ? t[i + 1] : (S.endedAt || t[i]); out.push(Math.round((end - t[i]) / 1000)); }
    return out.join(' ');
  }

  function Store(key, storage) {
    this.key = key;
    this.storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.mem = [];
  }
  Store.prototype.all = function () {
    if (!this.storage) return this.mem.slice();
    try { return JSON.parse(this.storage.getItem(this.key) || '[]'); } catch (e) { return []; }
  };
  Store.prototype.add = function (rec) {
    var a = this.all(); a.push(rec);
    if (this.storage) { try { this.storage.setItem(this.key, JSON.stringify(a)); } catch (e) { this.mem = a; } } else this.mem = a;
    return a.length;
  };
  Store.prototype.clear = function () { if (this.storage) this.storage.removeItem(this.key); this.mem = []; };

  function toJSON(runs) { return JSON.stringify({ exportedAt: new Date().toISOString(), runs: runs }, null, 2); }
  function csvCell(v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCSV(runs, cols) {
    cols = cols || COLUMNS;
    var lines = [cols.join(',')];
    runs.forEach(function (r) { lines.push(cols.map(function (c) { return csvCell(r[c]); }).join(',')); });
    return lines.join('\n') + '\n';
  }
  function summary(runs) {
    var s = { runs: runs.length, outcomes: {}, avgProgressEarned: 0, avgFinalPressure: 0, escapedY: 0, early: 0, threadRate: { T1: 0, T2: 0, T3: 0 }, plays: 0, commits: 0 };
    runs.forEach(function (r) {
      s.outcomes[r.outcome] = (s.outcomes[r.outcome] || 0) + 1;
      s.avgProgressEarned += +(r.progressEarned != null ? r.progressEarned : r.clues); s.avgFinalPressure += +r.finalPressure;
      if (r.escapedTogether === 'Y') s.escapedY++; if (r.endReason === 'pressure') s.early++;
      s.threadRate.T1 += +r.T1; s.threadRate.T2 += +r.T2; s.threadRate.T3 += +r.T3;
      s.plays += +r.plays; s.commits += +r.commits;
    });
    if (runs.length) { s.avgProgressEarned = +(s.avgProgressEarned / runs.length).toFixed(2); s.avgFinalPressure = +(s.avgFinalPressure / runs.length).toFixed(2); }
    return s;
  }

  var Stats = { COLUMNS: COLUMNS, COLUMNS_V04: COLUMNS_V04, buildRecord: buildRecord, Store: Store, toJSON: toJSON, toCSV: toCSV, summary: summary };
  if (typeof module !== 'undefined') module.exports = Stats; else root.Stats = Stats;
})(this);
