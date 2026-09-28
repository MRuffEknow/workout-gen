// Validates the hand-edited data files so a typo in a tag fails loudly
// instead of silently hiding an exercise from the generator.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EXERCISES } from "../src/data/exercises.js";
import { WODS } from "../src/data/wods.js";
import {
  ALL_EQUIPMENT, AVAILABLE_EQUIPMENT, MUSCLES, PATTERNS, EXERCISE_STYLES,
} from "../src/config.js";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const byId = new Map(EXERCISES.map((e) => [e.id, e]));

test("exercise ids are unique kebab-case", () => {
  const ids = EXERCISES.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate exercise id");
  for (const id of ids) assert.match(id, KEBAB);
});

test("every exercise uses known tags", () => {
  for (const e of EXERCISES) {
    const where = `exercise ${e.id}`;
    assert.ok(e.name, `${where}: missing name`);
    assert.ok(e.equipment.length > 0, `${where}: no equipment`);
    for (const eq of e.equipment) assert.ok(ALL_EQUIPMENT.includes(eq), `${where}: unknown equipment ${eq}`);
    assert.ok(e.primaryMuscles.length > 0, `${where}: no primary muscle`);
    for (const m of [...e.primaryMuscles, ...e.secondaryMuscles]) {
      assert.ok(MUSCLES.includes(m), `${where}: unknown muscle ${m}`);
    }
    assert.ok(PATTERNS.includes(e.pattern), `${where}: unknown pattern ${e.pattern}`);
    assert.ok(["compound", "isolation"].includes(e.type), `${where}: bad type ${e.type}`);
    for (const s of e.styles) assert.ok(EXERCISE_STYLES.includes(s), `${where}: unknown style ${s}`);
    assert.equal(typeof e.unilateral, "boolean", `${where}: unilateral must be boolean`);
    assert.ok(["reps", "time"].includes(e.measure), `${where}: measure must be reps or time`);
  }
});

test("library has 40+ usable exercises with current equipment", () => {
  const usable = EXERCISES.filter((e) => e.equipment.every((eq) => AVAILABLE_EQUIPMENT.includes(eq)));
  assert.ok(usable.length >= 40, `only ${usable.length} usable exercises`);
});

test("warm-up drills exist for upper and lower body", () => {
  const warmups = EXERCISES.filter((e) => e.warmup);
  const hits = (muscles) => warmups.some((e) => e.primaryMuscles.some((m) => muscles.includes(m)));
  assert.ok(hits(["chest", "back", "shoulders"]), "no upper-body warm-up drill");
  assert.ok(hits(["quads", "hamstrings", "glutes"]), "no lower-body warm-up drill");
});

test("wod ids are unique kebab-case", () => {
  const ids = WODS.map((w) => w.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate wod id");
  for (const id of ids) assert.match(id, KEBAB);
});

test("every wod movement option points at a real exercise", () => {
  for (const w of WODS) {
    assert.ok(["for-time", "amrap", "emom", "rounds"].includes(w.format), `${w.id}: bad format`);
    assert.equal(w.estimatedMinutes.length, 2, `${w.id}: estimatedMinutes must be [min, max]`);
    assert.ok(w.movements.length > 0, `${w.id}: no movements`);
    for (const m of w.movements) {
      assert.ok(m.name, `${w.id}: movement missing name`);
      assert.ok(m.options.length > 0, `${w.id}/${m.name}: no options`);
      for (const o of m.options) assert.ok(byId.has(o.exerciseId), `${w.id}/${m.name}: unknown exercise ${o.exerciseId}`);
    }
  }
});

test("every wod is doable with current equipment", () => {
  const available = (id) => byId.get(id).equipment.every((eq) => AVAILABLE_EQUIPMENT.includes(eq));
  for (const w of WODS) {
    for (const m of w.movements) {
      assert.ok(m.options.some((o) => available(o.exerciseId)), `${w.id}/${m.name}: no option with current equipment`);
    }
  }
});
