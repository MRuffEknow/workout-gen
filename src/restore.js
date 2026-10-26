// Body restoration program: turns a phase into a session the timer can run,
// and tracks progress (which phase, days in it, sessions logged).
// Pure functions with no DOM access, so they're unit tested.
//
// Dates are local calendar days as "YYYY-MM-DD" strings, so a session at
// 11 pm and one at 7 am the next morning land on different days.

import { BREATH_SECONDS, PHASES, PHASE_DAYS } from "./data/restoration.js";

// ── Dates ──────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, "0");

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Day arithmetic in UTC so daylight-saving changes can't shift a day.
const toUtc = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const DAY_MS = 86_400_000;

export function addDays(key, days) {
  const d = new Date(toUtc(key) + days * DAY_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export const daysBetween = (from, to) => Math.round((toUtc(to) - toUtc(from)) / DAY_MS);

// ── Program state ──────────────────────────────────────────────────

// { phase: 0–3, phaseStartedOn: date or null, log: [dates], includeOptional }
// phaseStartedOn stays null until the first session, so opening the tab
// doesn't start the 14-day clock.
export const NEW_PROGRAM = { phase: 0, phaseStartedOn: null, log: [], includeOptional: false };

export function programStatus(program, today) {
  const phase = PHASES[program.phase];
  const started = program.phaseStartedOn != null;
  const daysIn = started ? daysBetween(program.phaseStartedOn, today) : 0;
  const unlocksOn = started ? addDays(program.phaseStartedOn, PHASE_DAYS) : null;
  const sessionsInPhase = started ? program.log.filter((d) => d >= program.phaseStartedOn).length : 0;
  return {
    phase,
    started,
    day: started ? daysIn + 1 : 0, // day 1 is the start date
    ready: started && daysIn >= PHASE_DAYS,
    unlocksOn,
    sessionsInPhase,
    loggedToday: program.log.includes(today),
  };
}

/** Logs a session on `day` (once per day) and starts the phase clock if needed. */
export function logSession(program, day) {
  const log = program.log.includes(day) ? program.log : [...program.log, day].sort();
  return { ...program, log, phaseStartedOn: program.phaseStartedOn ?? day };
}

export function unlogSession(program, day) {
  return { ...program, log: program.log.filter((d) => d !== day) };
}

/** Moves to another phase; its 14 days start with the next session. */
export function setPhase(program, phase) {
  return { ...program, phase, phaseStartedOn: null };
}

/** The last `count` days ending today, oldest first, with whether each was logged. */
export function recentDays(program, today, count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const day = addDays(today, i - count + 1);
    return { day, logged: program.log.includes(day) };
  });
}

// ── Sessions ───────────────────────────────────────────────────────

// Rough time for one rep-based set on one side when the guide doesn't say.
const SECONDS_PER_REP = 4;
const SIDE_SWITCH_SECONDS = 10;

const topOfRange = (text) => Number(text.match(/(\d+)(?:\D+(\d+))?/).slice(1).filter(Boolean).at(-1));

function setSeconds(drill) {
  if (drill.breaths) return drill.breaths * BREATH_SECONDS;
  return drill.setSeconds ?? topOfRange(drill.reps) * SECONDS_PER_REP;
}

export function amountText(drill) {
  if (drill.breaths) return `${drill.breathsText ?? drill.breaths} breaths`;
  return drill.reps;
}

export function prescriptionText(drill) {
  const sets = drill.setsText ?? drill.sets;
  return `${sets} ${sets === 1 ? "set" : "sets"} × ${amountText(drill)}${drill.perSide ? " each side" : ""}`;
}

function estimatedMinutes(drills) {
  const seconds = drills.reduce((total, d) => {
    const sides = d.perSide ? 2 : 1;
    const work = d.sets * sides * setSeconds(d);
    const switches = d.sets * (sides - 1) * SIDE_SWITCH_SECONDS;
    return total + work + switches + d.sets * d.restSeconds;
  }, 0);
  return seconds / 60;
}

/**
 * A workout-shaped session for a phase, so the existing workout and timer
 * screens can show and run it. inputs.style "restore" picks its timeline.
 */
export function buildSession(phaseIndex, { includeOptional = false } = {}) {
  const phase = PHASES[phaseIndex];
  const drills = phase.drills.filter((d) => includeOptional || !d.optional);
  return {
    inputs: { style: "restore" },
    phaseIndex,
    title: `${phase.name}: ${phase.weeks}`,
    warmup: [],
    messages: [],
    main: drills.map((drill) => ({
      drill,
      exercise: { name: drill.name, unilateral: drill.perSide, video: drill.video },
      sets: drill.sets,
      restSeconds: drill.restSeconds,
    })),
    estimatedTotalMinutes: estimatedMinutes(drills),
  };
}
