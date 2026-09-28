import { test } from "node:test";
import assert from "node:assert/strict";
import { generateWorkout, swapExercise } from "../src/generator.js";
import { WODS } from "../src/data/wods.js";
import { AVAILABLE_EQUIPMENT } from "../src/config.js";

const SEEDS = Array.from({ length: 25 }, (_, i) => i + 1);
const wodFor = (minutes, seed, equipment) =>
  generateWorkout({ minutes, style: "wod", focus: "full-body" }, { seed, equipment });

test("picks a WOD whose typical duration fits the time", () => {
  for (const minutes of [20, 30, 45, 60]) {
    for (const seed of SEEDS) {
      const w = wodFor(minutes, seed);
      assert.ok(w.wod, `${minutes}min seed ${seed}: no wod`);
      assert.ok(w.estimatedTotalMinutes <= minutes * 1.1, `${w.wod.id}: ${w.estimatedTotalMinutes} min for ${minutes}`);
    }
  }
});

test("offers variety across seeds", () => {
  const seen = new Set(SEEDS.map((seed) => wodFor(30, seed).wod.id));
  assert.ok(seen.size >= 3, `only ${[...seen]}`);
});

test("substitutes movements for missing equipment and says so", () => {
  const w = generateWorkout({ minutes: 60, style: "wod", focus: "full-body" }, { seed: 1, wodId: "murph" });
  const pull = w.main.find((item) => item.movement === "Pull-up");
  assert.notEqual(pull.exercise.id, "pull-up");
  assert.equal(pull.replaces, "Pull-up");
  for (const item of w.main) {
    for (const eq of item.exercise.equipment) assert.ok(AVAILABLE_EQUIPMENT.includes(eq));
  }
});

test("uses the original movement when the equipment is available", () => {
  const equipment = [...AVAILABLE_EQUIPMENT, "pull-up-bar"];
  const w = generateWorkout({ minutes: 60, style: "wod", focus: "full-body" }, { seed: 1, wodId: "murph", equipment });
  const pull = w.main.find((item) => item.movement === "Pull-up");
  assert.equal(pull.exercise.id, "pull-up");
  assert.equal(pull.replaces, undefined);
});

test("wod output includes the format, original and prescription", () => {
  const w = wodFor(30, 3);
  assert.ok(w.wod.name);
  assert.ok(w.wod.format);
  assert.ok(w.wod.original);
  for (const item of w.main) assert.ok(item.prescription, `${item.movement}: no prescription`);
});

test("swap on a WOD cycles to the next available option for that movement", () => {
  // With the TRX set up, pull-ups have two substitutes: TRX rows and DB rows.
  const equipment = [...AVAILABLE_EQUIPMENT, "trx"];
  const w = generateWorkout({ minutes: 60, style: "wod", focus: "full-body" }, { seed: 1, wodId: "murph", equipment });
  const index = w.main.findIndex((item) => item.movement === "Pull-up");
  const swapped = swapExercise(w, index, { seed: 1 });
  assert.notEqual(swapped.main[index].exercise.id, w.main[index].exercise.id);
  assert.equal(swapped.main[index].movement, "Pull-up");
  const again = swapExercise(swapped, index, { seed: 1 });
  assert.equal(again.main[index].exercise.id, w.main[index].exercise.id, "should cycle back");
});

test("swap on a WOD movement with one option leaves it with a message", () => {
  const w = generateWorkout({ minutes: 60, style: "wod", focus: "full-body" }, { seed: 1, wodId: "murph" });
  const index = w.main.findIndex((item) => item.movement === "Push-up");
  const swapped = swapExercise(w, index, { seed: 1 });
  assert.equal(swapped.main[index].exercise.id, "push-up");
  assert.ok(swapped.messages.length > 0);
});

test("falls back to the shortest WOD with a message when time is very short", () => {
  const w = wodFor(8, 1);
  assert.ok(w.wod);
  assert.ok(w.messages.length > 0);
});

test("every WOD in the library can be generated", () => {
  for (const wod of WODS) {
    const w = generateWorkout({ minutes: 60, style: "wod", focus: "full-body" }, { seed: 1, wodId: wod.id });
    assert.equal(w.wod.id, wod.id);
    assert.equal(w.main.length, wod.movements.length);
  }
});
