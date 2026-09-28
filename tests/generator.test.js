import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateWorkout, swapExercise } from "../src/generator.js";
import { FOCUS_PRESETS, AVAILABLE_EQUIPMENT } from "../src/config.js";

const SEEDS = Array.from({ length: 25 }, (_, i) => i + 1);
const TIMES = [20, 30, 45, 60];
const GENERATED_STYLES = ["strength", "hypertrophy", "circuit", "mobility"];

const ids = (workout) => workout.main.map((item) => item.exercise.id);
const patterns = (workout) => workout.main.map((item) => item.exercise.pattern);

// Small hand-built exercise, so fixture libraries stay readable.
function ex(id, pattern, primaryMuscles, overrides = {}) {
  return {
    id, name: id, equipment: ["bodyweight"], primaryMuscles, secondaryMuscles: [],
    pattern, type: "compound", styles: ["strength", "hypertrophy", "circuit"],
    unilateral: false, measure: "reps", ...overrides,
  };
}

describe("time budget", () => {
  test("never runs more than 10% over the requested time", () => {
    for (const style of GENERATED_STYLES) {
      for (const minutes of TIMES) {
        for (const seed of SEEDS) {
          const w = generateWorkout({ minutes, style, focus: "full-body" }, { seed });
          assert.ok(
            w.estimatedTotalMinutes <= minutes * 1.1,
            `${style} ${minutes}min seed ${seed}: ${w.estimatedTotalMinutes} min`,
          );
        }
      }
    }
  });

  test("fills at least 75% of the time for full-body strength/hypertrophy/circuit", () => {
    for (const style of ["strength", "hypertrophy", "circuit"]) {
      for (const minutes of TIMES) {
        const w = generateWorkout({ minutes, style, focus: "full-body" }, { seed: 7 });
        assert.ok(
          w.estimatedTotalMinutes >= minutes * 0.75,
          `${style} ${minutes}min: only ${w.estimatedTotalMinutes} min`,
        );
      }
    }
  });

  test("includes a ~5 minute warm-up for lifting styles", () => {
    const w = generateWorkout({ minutes: 45, style: "hypertrophy", focus: "upper" }, { seed: 1 });
    assert.ok(w.warmup.length >= 2 && w.warmup.length <= 3);
    const seconds = w.warmup.reduce((sum, item) => sum + item.estimatedSeconds, 0);
    assert.equal(seconds, 5 * 60);
  });

  test("mobility sessions skip the separate warm-up", () => {
    const w = generateWorkout({ minutes: 20, style: "mobility", focus: "full-body" }, { seed: 1 });
    assert.equal(w.warmup.length, 0);
  });
});

describe("selection rules", () => {
  test("no duplicate exercises within a workout", () => {
    for (const style of GENERATED_STYLES) {
      for (const seed of SEEDS) {
        const w = generateWorkout({ minutes: 60, style, focus: "full-body" }, { seed });
        assert.equal(new Set(ids(w)).size, w.main.length, `${style} seed ${seed}: ${ids(w)}`);
      }
    }
  });

  test("every exercise matches the chosen style", () => {
    for (const style of GENERATED_STYLES) {
      const w = generateWorkout({ minutes: 45, style, focus: "full-body" }, { seed: 3 });
      for (const item of w.main) assert.ok(item.exercise.styles.includes(style), `${item.exercise.id} not tagged ${style}`);
    }
  });

  test("every exercise hits a target muscle", () => {
    for (const focus of ["upper", "lower", "push", "pull"]) {
      for (const seed of SEEDS) {
        const w = generateWorkout({ minutes: 45, style: "hypertrophy", focus }, { seed });
        for (const item of w.main) {
          assert.ok(
            item.exercise.primaryMuscles.some((m) => FOCUS_PRESETS[focus].includes(m)),
            `${focus}: ${item.exercise.id} misses target muscles`,
          );
        }
      }
    }
  });

  test("custom focus uses the chosen muscles", () => {
    const w = generateWorkout({ minutes: 30, style: "hypertrophy", focus: "custom", muscles: ["biceps", "triceps"] }, { seed: 2 });
    assert.ok(w.main.length > 0);
    for (const item of w.main) {
      assert.ok(item.exercise.primaryMuscles.some((m) => ["biceps", "triceps"].includes(m)), item.exercise.id);
    }
  });

  test("only uses available equipment", () => {
    for (const seed of SEEDS) {
      const w = generateWorkout({ minutes: 60, style: "hypertrophy", focus: "pull" }, { seed });
      for (const item of [...w.warmup, ...w.main]) {
        for (const eq of item.exercise.equipment) assert.ok(AVAILABLE_EQUIPMENT.includes(eq), `${item.exercise.id} needs ${eq}`);
      }
    }
  });

  test("uses newly available equipment when it's passed in", () => {
    const equipment = [...AVAILABLE_EQUIPMENT, "pull-up-bar", "trx"];
    const used = new Set();
    for (const seed of SEEDS) {
      const w = generateWorkout({ minutes: 60, style: "hypertrophy", focus: "pull" }, { seed, equipment });
      for (const item of w.main) item.exercise.equipment.forEach((eq) => used.add(eq));
    }
    assert.ok(used.has("pull-up-bar") || used.has("trx"));
  });

  test("strength workouts are all compound lifts", () => {
    for (const seed of SEEDS) {
      const w = generateWorkout({ minutes: 60, style: "strength", focus: "full-body" }, { seed });
      for (const item of w.main) assert.equal(item.exercise.type, "compound", item.exercise.id);
    }
  });

  test("compounds come before isolation", () => {
    for (const seed of SEEDS) {
      const w = generateWorkout({ minutes: 60, style: "hypertrophy", focus: "upper" }, { seed });
      const types = w.main.map((item) => item.exercise.type);
      const firstIsolation = types.indexOf("isolation");
      if (firstIsolation !== -1) {
        assert.ok(!types.slice(firstIsolation).includes("compound"), `seed ${seed}: ${types}`);
      }
    }
  });
});

describe("pattern balance", () => {
  test("full body gets knee, hinge, push and pull before repeating any", () => {
    const groups = {
      knee: ["squat", "lunge"],
      hinge: ["hinge"],
      push: ["push-horizontal", "push-vertical"],
      pull: ["pull-horizontal", "pull-vertical"],
    };
    for (const style of ["strength", "hypertrophy", "circuit"]) {
      for (const minutes of [45, 60]) {
        for (const seed of SEEDS) {
          const w = generateWorkout({ minutes, style, focus: "full-body" }, { seed });
          const first4 = patterns(w).slice(0, 4);
          for (const [name, pats] of Object.entries(groups)) {
            assert.ok(first4.some((p) => pats.includes(p)), `${style} ${minutes}min seed ${seed}: no ${name} in ${first4}`);
          }
        }
      }
    }
  });

  test("upper body uses both push and both pull variations before doubling up", () => {
    for (const seed of SEEDS) {
      const w = generateWorkout({ minutes: 60, style: "hypertrophy", focus: "upper" }, { seed });
      const pats = patterns(w);
      const pushes = pats.filter((p) => p.startsWith("push"));
      const pulls = pats.filter((p) => p.startsWith("pull"));
      assert.ok(pushes.length >= 2 && pulls.length >= 2, `seed ${seed}: ${pats}`);
      assert.equal(new Set(pushes).size, 2, `seed ${seed}: ${pushes}`);
      assert.equal(new Set(pulls).size, 2, `seed ${seed}: ${pulls}`);
    }
  });
});

describe("randomness", () => {
  test("the same seed gives the same workout", () => {
    const a = generateWorkout({ minutes: 45, style: "hypertrophy", focus: "full-body" }, { seed: 42 });
    const b = generateWorkout({ minutes: 45, style: "hypertrophy", focus: "full-body" }, { seed: 42 });
    assert.deepEqual(ids(a), ids(b));
  });

  test("different seeds give different workouts", () => {
    const seen = new Set(SEEDS.map((seed) =>
      ids(generateWorkout({ minutes: 45, style: "hypertrophy", focus: "full-body" }, { seed })).join(","),
    ));
    assert.ok(seen.size > SEEDS.length / 2, `only ${seen.size} distinct workouts`);
  });
});

describe("output shape", () => {
  test("includes inputs, timestamp and per-exercise prescriptions", () => {
    const w = generateWorkout({ minutes: 30, style: "hypertrophy", focus: "push" }, { seed: 1 });
    assert.deepEqual(w.inputs, { minutes: 30, style: "hypertrophy", focus: "push", muscles: FOCUS_PRESETS.push });
    assert.ok(!Number.isNaN(Date.parse(w.createdAt)));
    for (const item of w.main) {
      assert.ok(item.sets > 0);
      assert.equal(typeof item.reps, "string");
      assert.ok(item.restSeconds >= 0);
      assert.ok(item.estimatedSeconds > 0);
    }
  });

  test("timed exercises get a duration instead of a rep range", () => {
    const library = [
      ex("plank", "core", ["core"], { measure: "time", styles: ["hypertrophy"] }),
    ];
    const w = generateWorkout({ minutes: 20, style: "hypertrophy", focus: "full-body" }, { seed: 1, library });
    assert.match(w.main[0].reps, /s$/);
  });

  test("circuits list rounds and rest between rounds", () => {
    const w = generateWorkout({ minutes: 30, style: "circuit", focus: "full-body" }, { seed: 1 });
    assert.ok(w.rounds >= 3);
    assert.ok(w.roundRestSeconds > 0);
  });
});

describe("fallback", () => {
  test("returns what it can, with a message, when the library is too small", () => {
    const library = [ex("squat", "squat", ["quads"]), ex("push-up", "push-horizontal", ["chest"])];
    const w = generateWorkout({ minutes: 60, style: "hypertrophy", focus: "full-body" }, { seed: 1, library });
    assert.equal(w.main.length, 2);
    assert.ok(w.messages.length > 0);
    assert.match(w.messages[0], /exercise/i);
  });

  test("returns an empty workout with a message when nothing matches", () => {
    const library = [ex("squat", "squat", ["quads"])];
    const w = generateWorkout({ minutes: 30, style: "hypertrophy", focus: "pull" }, { seed: 1, library });
    assert.equal(w.main.length, 0);
    assert.ok(w.messages.length > 0);
  });

  test("has no messages when the workout fills normally", () => {
    const w = generateWorkout({ minutes: 45, style: "hypertrophy", focus: "full-body" }, { seed: 1 });
    assert.deepEqual(w.messages, []);
  });
});

describe("swapExercise", () => {
  test("replaces with the same pattern and no duplicates", () => {
    for (const seed of SEEDS) {
      const w = generateWorkout({ minutes: 45, style: "hypertrophy", focus: "full-body" }, { seed });
      const swapped = swapExercise(w, 0, { seed: seed + 100 });
      const before = w.main[0].exercise;
      const after = swapped.main[0].exercise;
      assert.notEqual(after.id, before.id);
      const sharesMuscle = after.primaryMuscles.some((m) => before.primaryMuscles.includes(m));
      assert.ok(after.pattern === before.pattern || sharesMuscle, `${before.id} -> ${after.id}`);
      assert.equal(new Set(ids(swapped)).size, swapped.main.length);
      assert.ok(after.styles.includes("hypertrophy"));
    }
  });

  test("keeps the rest of the workout unchanged and doesn't mutate the input", () => {
    const w = generateWorkout({ minutes: 45, style: "hypertrophy", focus: "full-body" }, { seed: 9 });
    const original = ids(w);
    const swapped = swapExercise(w, 2, { seed: 1 });
    assert.deepEqual(ids(w), original);
    assert.deepEqual(ids(swapped).filter((_, i) => i !== 2), original.filter((_, i) => i !== 2));
  });

  test("prefers the same pattern over the same muscle", () => {
    const library = [
      ex("goblet-squat", "squat", ["quads"]),
      ex("front-squat", "squat", ["glutes"]),
      ex("step-up", "lunge", ["quads"]),
    ];
    const w = generateWorkout({ minutes: 20, style: "hypertrophy", focus: "lower" }, { seed: 1, library });
    const single = { ...w, main: w.main.filter((item) => item.exercise.id === "goblet-squat") };
    const swapped = swapExercise(single, 0, { seed: 1, library });
    assert.equal(swapped.main[0].exercise.id, "front-squat");
  });

  test("falls back to the same primary muscle when no pattern match is left", () => {
    const library = [
      ex("goblet-squat", "squat", ["quads"]),
      ex("step-up", "lunge", ["quads"]),
    ];
    const w = generateWorkout({ minutes: 20, style: "hypertrophy", focus: "lower" }, { seed: 1, library });
    // Keep only the squat so the lunge is free to be the replacement.
    const single = { ...w, main: w.main.filter((item) => item.exercise.id === "goblet-squat") };
    const swapped = swapExercise(single, 0, { seed: 1, library });
    assert.equal(swapped.main[0].exercise.id, "step-up");
  });

  test("leaves the workout as-is with a message when there's no replacement", () => {
    const library = [ex("goblet-squat", "squat", ["quads"])];
    const w = generateWorkout({ minutes: 20, style: "hypertrophy", focus: "lower" }, { seed: 1, library });
    const swapped = swapExercise(w, 0, { seed: 1, library });
    assert.equal(swapped.main[0].exercise.id, "goblet-squat");
    assert.ok(swapped.messages.some((m) => /no replacement/i.test(m)));
  });
});
