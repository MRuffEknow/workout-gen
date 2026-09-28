import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatRest, formatMinutes, prescriptionLine, workoutTitle, wodFormatLabel, circuitSummary, cardLabel,
} from "../src/format.js";

test("formatRest reads naturally", () => {
  assert.equal(formatRest(45), "45 s");
  assert.equal(formatRest(60), "1 min");
  assert.equal(formatRest(90), "1 min 30 s");
  assert.equal(formatRest(120), "2 min");
});

test("formatMinutes rounds to whole minutes", () => {
  assert.equal(formatMinutes(44.6), "45 min");
  assert.equal(formatMinutes(20), "20 min");
});

test("prescriptionLine shows sets and reps for lifting styles", () => {
  const item = { sets: 4, reps: "8–12", restSeconds: 60 };
  assert.equal(prescriptionLine(item, { inputs: { style: "hypertrophy" } }), "4 sets × 8–12");
});

test("prescriptionLine shows just the interval for circuits (rounds are shown once, up top)", () => {
  const item = { sets: 3, reps: "40 s on / 20 s off", restSeconds: 20, block: 0 };
  const workout = { inputs: { style: "circuit" }, blocks: [{ rounds: 3 }], roundRestSeconds: 60 };
  assert.equal(prescriptionLine(item, workout), "40 s on / 20 s off");
});

test("circuitSummary describes one circuit", () => {
  const workout = { blocks: [{ rounds: 4, size: 5 }], roundRestSeconds: 60 };
  assert.equal(circuitSummary(workout), "4 rounds of 5. Rest 1 min between rounds.");
});

test("circuitSummary says 1 round, not 1 rounds", () => {
  const workout = { blocks: [{ rounds: 1, size: 3 }], roundRestSeconds: 60 };
  assert.equal(circuitSummary(workout), "1 round of 3.");
});

test("circuitSummary describes two circuits", () => {
  const workout = { blocks: [{ rounds: 5, size: 3 }, { rounds: 5, size: 3 }], roundRestSeconds: 60 };
  assert.equal(circuitSummary(workout), "Two circuits of 3, 5 rounds each. Finish all rounds of A before B. Rest 1 min between rounds.");
});

test("cardLabel numbers plainly for one circuit and uses A1/B1 for two", () => {
  const one = { blocks: [{ rounds: 4, size: 5 }] };
  const two = { blocks: [{ rounds: 5, size: 3 }, { rounds: 5, size: 3 }] };
  const items = [{ block: 0 }, { block: 0 }, { block: 0 }, { block: 1 }, { block: 1 }, { block: 1 }];
  assert.equal(cardLabel(items[2], 2, { main: items.slice(0, 5), ...one }), "3");
  assert.equal(cardLabel(items[0], 0, { main: items, ...two }), "A1");
  assert.equal(cardLabel(items[2], 2, { main: items, ...two }), "A3");
  assert.equal(cardLabel(items[3], 3, { main: items, ...two }), "B1");
  assert.equal(cardLabel(items[5], 5, { main: items, ...two }), "B3");
  assert.equal(cardLabel({}, 1, { main: [{}, {}] }), "2");
});

test("prescriptionLine uses the WOD prescription", () => {
  const item = { prescription: "21-15-9" };
  assert.equal(prescriptionLine(item, { inputs: { style: "wod" }, wod: {} }), "21-15-9");
});

test("workoutTitle describes focus and style in plain words", () => {
  assert.equal(workoutTitle({ inputs: { style: "hypertrophy", focus: "upper" } }), "Upper body hypertrophy");
  assert.equal(workoutTitle({ inputs: { style: "strength", focus: "full-body" } }), "Full body strength");
  assert.equal(workoutTitle({ inputs: { style: "circuit", focus: "push" } }), "Push circuit");
  assert.equal(
    workoutTitle({ inputs: { style: "hypertrophy", focus: "custom", muscles: ["biceps", "triceps"] } }),
    "Biceps and triceps hypertrophy",
  );
  assert.equal(
    workoutTitle({ inputs: { style: "mobility", focus: "custom", muscles: ["chest", "back", "core"] } }),
    "Chest, back and core mobility",
  );
  assert.equal(workoutTitle({ inputs: { style: "wod" }, wod: { name: "Murph" } }), "Murph");
});

test("wodFormatLabel spells out the format", () => {
  assert.equal(wodFormatLabel({ format: "for-time", timeCapMinutes: 12 }), "For time, 12 min cap");
  assert.equal(wodFormatLabel({ format: "amrap", timeCapMinutes: 20 }), "As many rounds as possible in 20 min");
  assert.equal(wodFormatLabel({ format: "emom", timeCapMinutes: 30 }), "Every minute on the minute for 30 min");
  assert.equal(wodFormatLabel({ format: "rounds", timeCapMinutes: 18 }), "Rounds for time, 18 min cap");
});
