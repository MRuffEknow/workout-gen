import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildTimeline, startTimer, advanceTimer, timerView, pauseTimer, resumeTimer, nextStep, previousStep,
} from "../src/timer.js";
import { generateWorkout } from "../src/generator.js";
import { WODS } from "../src/data/wods.js";
import { STYLE_PRESETS } from "../src/config.js";

const exercise = (name, overrides = {}) => ({ name, unilateral: false, measure: "reps", ...overrides });
const warmupItem = { exercise: exercise("Easy Spin"), prescription: "2 min", estimatedSeconds: 120 };
const kinds = (timeline) => timeline.map((s) => s.kind);

const lifting = {
  inputs: { style: "hypertrophy" },
  warmup: [warmupItem],
  main: [
    { exercise: exercise("Row"), sets: 2, reps: "8–12", restSeconds: 60 },
    { exercise: exercise("Press"), sets: 2, reps: "8–12", restSeconds: 60 },
  ],
};

const circuit = {
  inputs: { style: "circuit" },
  warmup: [],
  main: [
    { exercise: exercise("Squat"), sets: 2, reps: "40 s on / 20 s off", block: 0 },
    { exercise: exercise("Row", { unilateral: true }), sets: 2, reps: "40 s on / 20 s off", block: 0 },
    { exercise: exercise("Push-up"), sets: 2, reps: "40 s on / 20 s off", block: 1 },
    { exercise: exercise("Swing"), sets: 2, reps: "40 s on / 20 s off", block: 1 },
  ],
  blocks: [{ rounds: 2, size: 2 }, { rounds: 2, size: 2 }],
  roundRestSeconds: 60,
  circuitChangeSeconds: 120,
};

const wodWorkout = (id) => generateWorkout({ minutes: 60, style: "wod", focus: "full-body" }, { seed: 1, wodId: id });

describe("buildTimeline: lifting", () => {
  const timeline = buildTimeline(lifting);

  test("warm-up, then each set with rest between, no rest after the final set", () => {
    assert.deepEqual(kinds(timeline), ["warmup", "set", "rest", "set", "rest", "set", "rest", "set"]);
  });

  test("warm-up steps are timed; sets wait for a tap", () => {
    assert.equal(timeline[0].durationSeconds, 120);
    assert.equal(timeline[1].durationSeconds, null);
    assert.equal(timeline[2].durationSeconds, 60);
  });

  test("sets are labeled and the last set completes the exercise", () => {
    assert.equal(timeline[1].label, "Set 1 of 2");
    assert.equal(timeline[1].title, "Row");
    assert.equal(timeline[1].detail, "8–12 reps");
    assert.deepEqual(timeline[1].completes, []);
    assert.deepEqual(timeline[3].completes, [0]);
    assert.deepEqual(timeline[7].completes, [1]);
  });

  test("every step knows what comes next", () => {
    assert.equal(timeline[4].upNext, "Press");
    assert.equal(timeline[0].upNext, "Row");
    assert.equal(timeline.at(-1).upNext, null);
  });

  test("the next set of the same exercise says which set", () => {
    assert.equal(timeline[1].upNext, "Row, set 2 of 2");
    assert.equal(timeline[2].upNext, "Row, set 2 of 2");
  });

  test("steps point back at their exercise card", () => {
    assert.equal(timeline[1].exerciseIndex, 0);
    assert.equal(timeline[5].exerciseIndex, 1);
    assert.equal(timeline[0].exerciseIndex, null);
  });
});

describe("buildTimeline: circuits", () => {
  const timeline = buildTimeline(circuit);
  const { workSeconds, restSeconds } = STYLE_PRESETS.circuit;

  test("work and rest per station, round rest between rounds, a changeover between circuits", () => {
    assert.deepEqual(kinds(timeline), [
      "work", "rest", "work", "round-rest", "work", "rest", "work",
      "circuit-change",
      "work", "rest", "work", "round-rest", "work", "rest", "work",
    ]);
  });

  test("uses the circuit timings", () => {
    assert.equal(timeline[0].durationSeconds, workSeconds);
    assert.equal(timeline[1].durationSeconds, restSeconds);
    assert.equal(timeline[3].durationSeconds, 60);
    assert.equal(timeline[7].durationSeconds, 120);
  });

  test("labels rounds and circuits", () => {
    assert.equal(timeline[0].label, "Circuit A, round 1 of 2");
    assert.equal(timeline[8].label, "Circuit B, round 1 of 2");
  });

  test("single circuits don't mention a letter", () => {
    const single = { ...circuit, main: circuit.main.slice(0, 2), blocks: [{ rounds: 2, size: 2 }] };
    assert.equal(buildTimeline(single)[0].label, "Round 1 of 2");
  });

  test("one-sided moves get a halfway cue to switch sides", () => {
    assert.equal(timeline[2].halfwayCue, true);
    assert.ok(!timeline[0].halfwayCue);
  });

  test("an exercise is completed on its last round", () => {
    assert.deepEqual(timeline[0].completes, []);
    assert.deepEqual(timeline[4].completes, [0]);
    assert.deepEqual(timeline[6].completes, [1]);
  });

  test("works on a generated circuit", () => {
    const w = generateWorkout({ minutes: 45, style: "circuit", focus: "full-body" }, { seed: 3 });
    const t = buildTimeline(w);
    const workSteps = t.filter((s) => s.kind === "work").length;
    assert.equal(workSteps, w.blocks.reduce((acc, b) => acc + b.rounds * b.size, 0));
    const completed = t.flatMap((s) => s.completes).sort((a, b) => a - b);
    assert.deepEqual(completed, w.main.map((_, i) => i));
  });
});

describe("buildTimeline: mobility", () => {
  const mobility = {
    inputs: { style: "mobility" },
    warmup: [],
    main: [
      { exercise: exercise("Pigeon", { unilateral: true }), sets: 2, reps: "45–60 s each side", restSeconds: 15 },
      { exercise: exercise("Cat-Cow"), sets: 1, reps: "45–60 s", restSeconds: 15 },
    ],
  };
  const timeline = buildTimeline(mobility);

  test("timed holds, both sides for one-sided stretches", () => {
    assert.deepEqual(kinds(timeline), ["hold", "hold", "rest", "hold", "hold", "rest", "hold"]);
    assert.equal(timeline[0].label, "Set 1 of 2, left side");
    assert.equal(timeline[1].label, "Set 1 of 2, right side");
    assert.equal(timeline[0].durationSeconds, STYLE_PRESETS.mobility.workSeconds);
  });
});

describe("buildTimeline: WODs", () => {
  test("AMRAP is one countdown for the time cap", () => {
    const w = wodWorkout("cindy");
    const main = buildTimeline(w).filter((s) => s.kind !== "warmup");
    assert.equal(main.length, 1);
    assert.equal(main[0].kind, "amrap");
    assert.equal(main[0].durationSeconds, 20 * 60);
    assert.deepEqual(main[0].completes, w.main.map((_, i) => i));
  });

  test("EMOM is a step per minute", () => {
    const main = buildTimeline(wodWorkout("chelsea")).filter((s) => s.kind !== "warmup");
    assert.equal(main.length, 30);
    assert.ok(main.every((s) => s.kind === "emom" && s.durationSeconds === 60));
    assert.equal(main[0].label, "Minute 1 of 30");
  });

  test("rotating EMOMs show that minute's movement", () => {
    const wod = WODS.find((w) => w.id === "kettlebell-20");
    const main = buildTimeline(wodWorkout("kettlebell-20")).filter((s) => s.kind !== "warmup");
    assert.equal(main[0].title, wod.movements[0].name);
    assert.equal(main[1].title, wod.movements[1].name);
    assert.equal(main[4].title, wod.movements[0].name);
  });

  test("for-time WODs are a stopwatch that stops at the time cap", () => {
    const main = buildTimeline(wodWorkout("fran")).filter((s) => s.kind !== "warmup");
    assert.equal(main.length, 1);
    assert.equal(main[0].kind, "for-time");
    assert.equal(main[0].countUp, true);
    assert.equal(main[0].durationSeconds, 12 * 60);
  });
});

describe("engine", () => {
  const timeline = buildTimeline(lifting);
  const T0 = 1_000_000;
  const at = (seconds) => T0 + seconds * 1000;

  test("starts on the first step", () => {
    const view = timerView(timeline, startTimer(T0), T0);
    assert.equal(view.index, 0);
    assert.equal(view.remainingSeconds, 120);
    assert.equal(view.finished, false);
  });

  test("timed steps count down", () => {
    const view = timerView(timeline, startTimer(T0), at(30));
    assert.equal(view.remainingSeconds, 90);
  });

  test("timed steps advance on their own, and stop at a manual step", () => {
    const { timer, ended } = advanceTimer(timeline, startTimer(T0), at(500));
    assert.equal(timer.stepIndex, 1);
    assert.deepEqual(ended, [0]);
    assert.equal(timerView(timeline, timer, at(500)).remainingSeconds, null);
  });

  test("catches up across several timed steps after a screen lock", () => {
    const circuitTimeline = buildTimeline(circuit);
    // 40 work + 20 rest + 40 work = 100 s, so at 110 s we're 10 s into the round rest.
    const { timer, ended } = advanceTimer(circuitTimeline, startTimer(T0), at(110));
    assert.equal(timer.stepIndex, 3);
    assert.deepEqual(ended, [0, 1, 2]);
    assert.equal(timerView(circuitTimeline, timer, at(110)).remainingSeconds, 50);
  });

  test("nextStep finishes a manual set and starts the rest", () => {
    let { timer } = advanceTimer(timeline, startTimer(T0), at(120));
    const result = nextStep(timeline, timer, at(200));
    assert.equal(result.timer.stepIndex, 2);
    assert.deepEqual(result.ended, [1]);
    assert.equal(timerView(timeline, result.timer, at(210)).remainingSeconds, 50);
  });

  test("pausing freezes the countdown; resuming picks up where it left off", () => {
    let timer = pauseTimer(startTimer(T0), at(30));
    assert.equal(timerView(timeline, timer, at(100)).remainingSeconds, 90);
    assert.equal(advanceTimer(timeline, timer, at(1000)).timer.stepIndex, 0);
    timer = resumeTimer(timer, at(100));
    assert.equal(timerView(timeline, timer, at(110)).remainingSeconds, 80);
  });

  test("session time leaves out pauses", () => {
    let timer = pauseTimer(startTimer(T0), at(30));
    timer = resumeTimer(timer, at(100));
    assert.equal(timerView(timeline, timer, at(110)).sessionSeconds, 40);
  });

  test("previousStep goes back and restarts that step", () => {
    const { timer } = nextStep(timeline, startTimer(T0), at(10));
    const back = previousStep(timeline, timer, at(20));
    assert.equal(back.stepIndex, 0);
    assert.equal(timerView(timeline, back, at(20)).remainingSeconds, 120);
  });

  test("previousStep stays on the first step", () => {
    assert.equal(previousStep(timeline, startTimer(T0), at(5)).stepIndex, 0);
  });

  test("finishes after the last step", () => {
    let timer = startTimer(T0);
    for (let i = 0; i < timeline.length; i++) timer = nextStep(timeline, timer, at(i)).timer;
    const view = timerView(timeline, timer, at(100));
    assert.equal(view.finished, true);
    assert.equal(view.step, null);
    assert.ok(timer.finishedAt);
  });

  test("finished session time stops counting", () => {
    let timer = startTimer(T0);
    for (let i = 0; i < timeline.length; i++) timer = nextStep(timeline, timer, at(i * 10)).timer;
    const first = timerView(timeline, timer, at(1000)).sessionSeconds;
    const later = timerView(timeline, timer, at(5000)).sessionSeconds;
    assert.equal(first, later);
  });

  test("count-up steps show elapsed time and end at the cap", () => {
    const fran = buildTimeline(wodWorkout("fran"));
    const start = { ...startTimer(T0), stepIndex: fran.findIndex((s) => s.kind === "for-time") };
    const view = timerView(fran, start, at(90));
    assert.equal(view.elapsedSeconds, 90);
    const { timer } = advanceTimer(fran, start, at(13 * 60));
    assert.equal(timerView(fran, timer, at(13 * 60)).finished, true);
  });

  test("doesn't mutate the timer it's given", () => {
    const timer = startTimer(T0);
    const copy = structuredClone(timer);
    advanceTimer(timeline, timer, at(500));
    nextStep(timeline, timer, at(5));
    pauseTimer(timer, at(5));
    assert.deepEqual(timer, copy);
  });
});
