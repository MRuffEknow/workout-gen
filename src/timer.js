// Workout timer: turns a workout into a list of steps, and a small engine that
// moves through them. Pure functions of (timeline, timer state, now), with no
// DOM access, so it's unit tested like the generator.
//
// All timing is based on timestamps rather than a ticking counter: phones
// pause JavaScript when the screen locks, so on return the engine works out
// where you should be instead of losing time.

import { STYLE_PRESETS } from "./config.js";

const REST_KINDS = ["rest", "round-rest", "circuit-change"];
const letter = (block) => String.fromCharCode(65 + block);

export const isRest = (s) => REST_KINDS.includes(s.kind);

// ── Timeline ───────────────────────────────────────────────────────

// Step fields:
//   kind            warmup | set | rest | work | round-rest | circuit-change | hold | amrap | emom | for-time
//   label           small line above the title ("Set 2 of 4", "Round 1 of 3")
//   title           the big line: exercise name, "Rest", or the WOD name
//   detail          reps or instructions
//   durationSeconds null = waits for a tap (lifting sets)
//   countUp         show elapsed time instead of remaining (for-time WODs)
//   halfwayCue      beep halfway through (switch sides)
//   exerciseIndex   which card this step belongs to (null for rests/warm-up)
//   completes       card indexes to check off when this step ends
//   upNext          title of the next non-rest step
function step(fields) {
  return {
    label: "", detail: "", durationSeconds: null, exerciseIndex: null, completes: [], ...fields,
  };
}

function restStep(seconds, kind = "rest", title = "Rest", label = "") {
  return step({ kind, title, label, durationSeconds: seconds });
}

function warmupSteps(workout) {
  return workout.warmup.map((item) => step({
    kind: "warmup", label: "Warm-up", title: item.exercise.name, detail: item.prescription,
    durationSeconds: item.estimatedSeconds,
  }));
}

// "8–12" → "8–12 reps", "3–6 each side" → "3–6 reps each side"; timed holds stay as-is.
function repsDetail(item) {
  if (item.exercise.measure === "time") return item.reps;
  return item.reps.replace(/^([\d–-]+)/, "$1 reps");
}

// Lifting: each set waits for a tap, then a rest countdown starts.
function liftingSteps(workout) {
  const steps = [];
  workout.main.forEach((item, index) => {
    for (let set = 1; set <= item.sets; set++) {
      steps.push(step({
        kind: "set", label: `Set ${set} of ${item.sets}`, title: item.exercise.name, detail: repsDetail(item),
        exerciseIndex: index, completes: set === item.sets ? [index] : [],
      }));
      steps.push(restStep(item.restSeconds));
    }
  });
  steps.pop(); // no rest after the final set
  return steps;
}

// Circuits: work/rest through the stations, a longer rest between rounds,
// and a changeover between circuit A and B.
function circuitSteps(workout) {
  const { workSeconds, restSeconds } = STYLE_PRESETS.circuit;
  const multiple = workout.blocks.length > 1;
  const steps = [];

  workout.blocks.forEach((block, b) => {
    const stations = workout.main.map((item, index) => ({ item, index })).filter(({ item }) => item.block === b);
    for (let round = 1; round <= block.rounds; round++) {
      const label = `${multiple ? `Circuit ${letter(b)}, round` : "Round"} ${round} of ${block.rounds}`;
      stations.forEach(({ item, index }, s) => {
        const unilateral = item.exercise.unilateral;
        steps.push(step({
          kind: "work", label, title: item.exercise.name,
          detail: unilateral ? "Switch sides halfway" : "",
          durationSeconds: workSeconds, halfwayCue: unilateral, exerciseIndex: index,
          completes: round === block.rounds ? [index] : [],
        }));
        const lastStation = s === stations.length - 1;
        if (!lastStation) steps.push(restStep(restSeconds));
        else if (round < block.rounds) steps.push(restStep(workout.roundRestSeconds, "round-rest", "Rest", "Between rounds"));
      });
    }
    if (b < workout.blocks.length - 1) {
      steps.push(restStep(workout.circuitChangeSeconds, "circuit-change", `Set up circuit ${letter(b + 1)}`, "Changeover"));
    }
  });
  return steps;
}

// Mobility: timed holds, one per side for one-sided stretches.
function mobilitySteps(workout) {
  const holdSeconds = STYLE_PRESETS.mobility.workSeconds;
  const steps = [];
  workout.main.forEach((item, index) => {
    const sides = item.exercise.unilateral ? ["left side", "right side"] : [null];
    for (let set = 1; set <= item.sets; set++) {
      sides.forEach((side, i) => {
        const lastHold = set === item.sets && i === sides.length - 1;
        steps.push(step({
          kind: "hold", label: `Set ${set} of ${item.sets}${side ? `, ${side}` : ""}`, title: item.exercise.name,
          durationSeconds: holdSeconds, exerciseIndex: index, completes: lastHold ? [index] : [],
        }));
      });
      steps.push(restStep(item.restSeconds));
    }
  });
  steps.pop();
  return steps;
}

function wodSteps(workout) {
  const { wod, main } = workout;
  const all = main.map((_, i) => i);
  const cap = wod.timeCapMinutes;

  if (wod.format === "amrap") {
    return [step({
      kind: "amrap", label: "As many rounds as possible", title: wod.name, detail: wod.structure,
      durationSeconds: cap * 60, completes: all,
    })];
  }
  if (wod.format === "emom") {
    return Array.from({ length: cap }, (_, m) => {
      // Rotating EMOMs do one movement per minute; others do the whole list each minute.
      const item = wod.rotate ? main[m % main.length] : null;
      return step({
        kind: "emom", label: `Minute ${m + 1} of ${cap}`,
        title: item ? item.movement : wod.name,
        detail: item ? `${item.prescription} ${item.exercise.name}` : wod.structure,
        durationSeconds: 60, completes: m === cap - 1 ? all : [],
      });
    });
  }
  return [step({
    kind: "for-time", label: `For time, ${cap} min cap`, title: wod.name, detail: wod.structure,
    durationSeconds: cap * 60, countUp: true, completes: all,
  })];
}

export function buildTimeline(workout) {
  const style = workout.inputs.style;
  const main = workout.wod ? wodSteps(workout)
    : style === "circuit" ? circuitSteps(workout)
      : style === "mobility" ? mobilitySteps(workout)
        : liftingSteps(workout);
  const steps = [...warmupSteps(workout), ...main];

  // What's next, skipping rests: during a rest you want to see the next exercise.
  // If it's another set of the same exercise, say which one.
  return steps.map((s, i) => {
    const next = steps.slice(i + 1).find((later) => !isRest(later));
    const current = steps.slice(0, i + 1).findLast((earlier) => !isRest(earlier));
    let upNext = next?.title ?? null;
    if (next && current && next.title === current.title && next.label) {
      upNext = `${next.title}, ${next.label.charAt(0).toLowerCase()}${next.label.slice(1)}`;
    }
    return { ...s, upNext };
  });
}

// ── Engine ─────────────────────────────────────────────────────────

// Timer state: which step, when it started, and pause bookkeeping.
// Times are epoch milliseconds.
export function startTimer(now) {
  return { stepIndex: 0, stepStartedAt: now, startedAt: now, pausedAt: null, pausedMs: 0, finishedAt: null };
}

const stepEndsAt = (s, timer) => timer.stepStartedAt + s.durationSeconds * 1000;

/**
 * Moves past any timed steps that have run out by `now`.
 * Returns the new timer and the indexes of steps that ended (to check off
 * cards and play cues).
 */
export function advanceTimer(timeline, timer, now) {
  if (timer.pausedAt != null || timer.finishedAt != null) return { timer, ended: [] };
  const next = { ...timer };
  const ended = [];
  while (next.stepIndex < timeline.length) {
    const current = timeline[next.stepIndex];
    if (current.durationSeconds == null) break;
    const endsAt = stepEndsAt(current, next);
    if (now < endsAt) break;
    ended.push(next.stepIndex);
    next.stepIndex += 1;
    next.stepStartedAt = endsAt; // chain from the exact end, so catch-up is precise
  }
  if (next.stepIndex >= timeline.length) next.finishedAt = next.stepStartedAt;
  return { timer: next, ended };
}

/** Ends the current step now (a finished set, or Skip) and starts the next. */
export function nextStep(timeline, timer, now) {
  const caughtUp = advanceTimer(timeline, timer, now);
  const t = { ...caughtUp.timer };
  if (t.stepIndex >= timeline.length) return caughtUp;
  const ended = [...caughtUp.ended, t.stepIndex];
  t.stepIndex += 1;
  t.stepStartedAt = now;
  if (t.pausedAt != null) t.pausedAt = now; // stays paused, at the start of the new step
  if (t.stepIndex >= timeline.length) t.finishedAt = now;
  return { timer: t, ended };
}

/** Goes back one step and restarts it. */
export function previousStep(timeline, timer, now) {
  const { timer: t } = advanceTimer(timeline, timer, now);
  return {
    ...t,
    stepIndex: Math.max(0, Math.min(t.stepIndex, timeline.length) - 1),
    stepStartedAt: now,
    pausedAt: t.pausedAt != null ? now : null,
    finishedAt: null,
  };
}

export function pauseTimer(timer, now) {
  if (timer.pausedAt != null || timer.finishedAt != null) return timer;
  return { ...timer, pausedAt: now };
}

export function resumeTimer(timer, now) {
  if (timer.pausedAt == null) return timer;
  const pausedFor = now - timer.pausedAt;
  return {
    ...timer,
    pausedAt: null,
    stepStartedAt: timer.stepStartedAt + pausedFor,
    pausedMs: timer.pausedMs + pausedFor,
  };
}

/** Everything the screen needs to draw the timer at `now`. */
export function timerView(timeline, timer, now) {
  const t = advanceTimer(timeline, timer, now).timer;
  const clock = t.finishedAt ?? t.pausedAt ?? now;
  const sessionSeconds = Math.floor((clock - t.startedAt - t.pausedMs) / 1000);
  const finished = t.stepIndex >= timeline.length;
  if (finished) {
    return { index: t.stepIndex, step: null, finished, paused: false, elapsedSeconds: 0, remainingSeconds: null, sessionSeconds };
  }
  const current = timeline[t.stepIndex];
  const elapsedMs = Math.max(0, clock - t.stepStartedAt);
  const remainingSeconds = current.durationSeconds == null
    ? null
    : Math.max(0, Math.ceil(current.durationSeconds - elapsedMs / 1000));
  return {
    index: t.stepIndex,
    step: current,
    finished,
    paused: t.pausedAt != null,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    remainingSeconds,
    sessionSeconds,
  };
}
