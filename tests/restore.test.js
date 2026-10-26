import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  NEW_PROGRAM, addDays, buildSession, dateKey, daysBetween, logSession, prescriptionText, programStatus, recentDays,
  setPhase, unlogSession,
} from "../src/restore.js";
import { BREATH_SECONDS, PHASES, PHASE_DAYS } from "../src/data/restoration.js";
import { buildTimeline, isRest } from "../src/timer.js";
import { breathPrompt, workoutTitle } from "../src/format.js";

const allDrills = PHASES.flatMap((p) => p.drills);

describe("restoration data", () => {
  test("four phases, each with a playlist and at least 3 drills", () => {
    assert.equal(PHASES.length, 4);
    for (const phase of PHASES) {
      assert.match(phase.playlist, /^https:\/\/www\.youtube\.com\/playlist\?list=/);
      assert.ok(phase.drills.filter((d) => !d.optional).length >= 3, phase.name);
    }
  });

  test("every drill is either breath-paced or rep-based, with what the screens need", () => {
    const ids = new Set();
    for (const d of allDrills) {
      assert.ok(!ids.has(d.id), `duplicate id ${d.id}`);
      ids.add(d.id);
      assert.ok(Boolean(d.breaths) !== Boolean(d.reps), `${d.id}: needs breaths or reps, not both`);
      if (d.reps) assert.match(d.reps, /\d/, `${d.id}: reps needs a number`);
      assert.ok(Number.isInteger(d.sets) && d.sets > 0, `${d.id}: sets`);
      assert.ok(Number.isInteger(d.restSeconds) && d.restSeconds > 0, `${d.id}: restSeconds`);
      assert.equal(typeof d.perSide, "boolean", `${d.id}: perSide`);
      assert.ok(d.purpose, `${d.id}: purpose`);
      assert.ok(d.checks.length > 0, `${d.id}: checks`);
      assert.ok(d.video || d.parts, `${d.id}: needs a video or parts`);
      const urls = [d.video, d.altVideo?.url, ...(d.parts ?? []).map((p) => p.video)].filter(Boolean);
      for (const url of urls) assert.match(url, /^https:\/\/youtu\.be\/[\w-]{11}$/, `${d.id}: ${url}`);
    }
  });
});

describe("dates", () => {
  test("dateKey uses the local calendar day", () => {
    assert.equal(dateKey(new Date(2026, 0, 5, 23, 30)), "2026-01-05");
  });

  test("addDays and daysBetween cross months, years and DST changes", () => {
    assert.equal(addDays("2026-10-26", 14), "2026-11-09");
    assert.equal(addDays("2026-12-30", 3), "2027-01-02");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
    assert.equal(daysBetween("2026-03-01", "2026-03-15"), 14); // US DST starts Mar 8
    assert.equal(daysBetween("2026-11-09", "2026-10-26"), -14);
  });
});

describe("program progress", () => {
  test("a new program hasn't started its 14 days", () => {
    const s = programStatus(NEW_PROGRAM, "2026-10-26");
    assert.equal(s.phase, PHASES[0]);
    assert.equal(s.started, false);
    assert.equal(s.ready, false);
    assert.equal(s.day, 0);
  });

  test("the first session starts the phase clock; logging twice in a day counts once", () => {
    let p = logSession(NEW_PROGRAM, "2026-10-26");
    p = logSession(p, "2026-10-26");
    assert.deepEqual(p.log, ["2026-10-26"]);
    assert.equal(p.phaseStartedOn, "2026-10-26");
    p = logSession(p, "2026-10-28");
    assert.equal(p.phaseStartedOn, "2026-10-26", "later sessions don't move the start");
    const s = programStatus(p, "2026-10-28");
    assert.equal(s.day, 3);
    assert.equal(s.sessionsInPhase, 2);
    assert.equal(s.loggedToday, true);
    assert.equal(s.unlocksOn, "2026-11-09");
  });

  test(`the next phase unlocks after ${PHASE_DAYS} days`, () => {
    const p = logSession(NEW_PROGRAM, "2026-10-26");
    assert.equal(programStatus(p, "2026-11-08").ready, false);
    assert.equal(programStatus(p, "2026-11-09").ready, true);
  });

  test("backfilled sessions are kept in date order and can be removed", () => {
    let p = logSession(NEW_PROGRAM, "2026-10-26");
    p = logSession(p, "2026-10-24");
    assert.deepEqual(p.log, ["2026-10-24", "2026-10-26"]);
    p = unlogSession(p, "2026-10-26");
    assert.deepEqual(p.log, ["2026-10-24"]);
  });

  test("changing phase restarts the count at the next session and keeps the log", () => {
    let p = logSession(NEW_PROGRAM, "2026-10-26");
    p = setPhase(p, 1);
    assert.equal(p.phase, 1);
    assert.equal(p.phaseStartedOn, null);
    assert.deepEqual(p.log, ["2026-10-26"]);
    p = logSession(p, "2026-11-10");
    assert.equal(p.phaseStartedOn, "2026-11-10");
    assert.equal(programStatus(p, "2026-11-10").sessionsInPhase, 1);
  });

  test("recentDays lists the last 7 days, oldest first", () => {
    const p = logSession(logSession(NEW_PROGRAM, "2026-10-20"), "2026-10-26");
    const days = recentDays(p, "2026-10-26");
    assert.equal(days.length, 7);
    assert.equal(days[0].day, "2026-10-20");
    assert.equal(days[6].day, "2026-10-26");
    assert.deepEqual(days.filter((d) => d.logged).map((d) => d.day), ["2026-10-20", "2026-10-26"]);
  });
});

describe("sessions", () => {
  test("optional drills are left out unless asked for", () => {
    const phase3 = PHASES[2];
    assert.equal(buildSession(2).main.length, phase3.drills.filter((d) => !d.optional).length);
    assert.equal(buildSession(2, { includeOptional: true }).main.length, phase3.drills.length);
  });

  test("sessions have a title and a sensible time estimate", () => {
    for (let i = 0; i < PHASES.length; i++) {
      const session = buildSession(i);
      assert.equal(workoutTitle(session), `${PHASES[i].name}: ${PHASES[i].weeks}`);
      assert.ok(session.estimatedTotalMinutes > 5 && session.estimatedTotalMinutes < 40,
        `${PHASES[i].name}: ${session.estimatedTotalMinutes} min`);
    }
  });

  test("prescription text", () => {
    const byId = Object.fromEntries(allDrills.map((d) => [d.id, d]));
    assert.equal(prescriptionText(byId["hip-lift"]), "2 sets × 8 breaths");
    assert.equal(prescriptionText(byId["sidelying-glute-max"]), "2 sets × 8 breaths each side");
    assert.equal(prescriptionText(byId["intro-abduct-shift"]), "3 sets × 5–8 breaths each side");
    assert.equal(prescriptionText(byId["hinged-split-squat"]), "2–3 sets × 8–10 slow reps each side");
    assert.equal(prescriptionText(byId["leg-foot-release"]), "1 set × 15 slow rolls per technique, each leg");
  });
});

describe("timeline", () => {
  const steps = buildTimeline(buildSession(1)); // phase 2: reps per side, then breath drills
  const work = steps.filter((s) => !isRest(s));

  test("every set, on both sides for one-sided drills", () => {
    const expected = PHASES[1].drills.reduce((n, d) => n + d.sets * (d.perSide ? 2 : 1), 0);
    assert.equal(work.length, expected);
    assert.deepEqual(work.slice(0, 4).map((s) => s.label),
      ["Set 1 of 2, left side", "Set 1 of 2, right side", "Set 2 of 2, left side", "Set 2 of 2, right side"]);
  });

  test("rep drills wait for a tap; breath drills are timed by breaths", () => {
    const pronation = work[0];
    assert.equal(pronation.kind, "set");
    assert.equal(pronation.durationSeconds, null);
    const glute = work.find((s) => s.title === "Sidelying Glute Max");
    assert.equal(glute.kind, "hold");
    assert.equal(glute.breaths, 8);
    assert.equal(glute.durationSeconds, 8 * BREATH_SECONDS);
    assert.match(glute.video, /^https:\/\/youtu\.be\//);
  });

  test("a short switch between sides, a rest between sets, none at the end", () => {
    assert.equal(steps[1].title, "Switch sides");
    assert.equal(steps[1].upNext, "Introductory Pronation Drill, set 1 of 2, right side");
    assert.equal(steps[3].title, "Rest");
    assert.ok(!isRest(steps.at(-1)));
  });

  test("each card is checked off by its last set", () => {
    const completes = steps.flatMap((s) => s.completes);
    assert.deepEqual(completes, PHASES[1].drills.map((_, i) => i));
  });
});

describe("breathPrompt", () => {
  test("breathes out, then in, counting breaths", () => {
    assert.equal(breathPrompt(0, 8, 10), "Breath 1 of 8 · Breathe out");
    assert.equal(breathPrompt(5, 8, 10), "Breath 1 of 8 · Breathe in");
    assert.equal(breathPrompt(23, 8, 10), "Breath 3 of 8 · Breathe out");
    assert.equal(breathPrompt(80, 8, 10), "Breath 8 of 8 · Breathe out", "never counts past the last breath");
  });
});
