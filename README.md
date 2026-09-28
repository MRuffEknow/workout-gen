# workout-gen

A mobile-first workout generator for my home gym. See [PLAN.md](PLAN.md) for the full plan.

## Status

Milestones 1 (generator) and 2 (phone UI) are done. Next: offline support, home-screen install, and hosting.

## Run it

The app uses ES modules, which browsers won't load from a `file://` page, so serve the folder:

```sh
npm start            # serves http://localhost:8000
```

Your last choices and the workout in progress are saved in the browser, so a reload or screen lock doesn't lose your place.

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
