# workout-gen

A mobile-first workout generator for my home gym. See [PLAN.md](PLAN.md) for the full plan.

## Status

Milestone 1 (generator + exercise library) is done. There's no UI yet.

## Try it from Node

```sh
node --test          # run the tests
node -e '
import("./src/generator.js").then(({ generateWorkout }) => {
  const w = generateWorkout({ minutes: 45, style: "hypertrophy", focus: "upper" });
  console.log(w.main.map((i) => `${i.exercise.name}: ${i.sets} x ${i.reps}`).join("\n"));
});'
```

Inputs: `minutes`, `style` (`strength` | `hypertrophy` | `circuit` | `mobility` | `wod`),
`focus` (`full-body` | `upper` | `lower` | `push` | `pull` | `custom` with `muscles: [...]`).
Options: `seed` (repeatable workouts), `equipment`, `wodId`.

## Editing

- **Exercises:** `src/data/exercises.js`. Tags are validated by `tests/data.test.js`.
- **WODs:** `src/data/wods.js`.
- **Equipment I own:** `AVAILABLE_EQUIPMENT` in `src/config.js`. Add `"trx"` or `"pull-up-bar"` when they're set up; exercises and WOD options for them are already in the library.
- **Sets / reps / rest per style:** `STYLE_PRESETS` in `src/config.js`.
