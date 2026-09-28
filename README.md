# workout-gen

A mobile-first workout generator for my home gym. See [PLAN.md](PLAN.md) for the full plan.

## Status

Milestones 1–3 are done (generator, phone UI, offline + installable). Next: the workout timer (Milestone 4).

## Use it on your phone

1. Open **https://mruffeknow.github.io/workout-gen/**
2. Add it to your home screen:
   - **iPhone (Safari):** Share button → *Add to Home Screen*.
   - **Android (Chrome):** ⋮ menu → *Add to Home screen* (or *Install app*).
3. Open it from the home screen icon. After the first load it works without a signal.

Your last choices and the workout in progress are saved on the phone, so a screen lock or reload doesn't lose your place.

## Deploying (GitHub Pages)

The site is served straight from the `main` branch — there's no build step.

- **One-time setup:** GitHub repo → *Settings* → *Pages* → *Build and deployment* → Source: *Deploy from a branch*, Branch: `main`, folder `/ (root)`.
- **To deploy a change:** push to `main`. GitHub publishes it within a minute or two.
- **Seeing the update on your phone:** the app loads instantly from its offline copy and fetches updates in the background, so a new version shows up on the *second* open after a deploy.

## Running it locally

The app uses ES modules, which browsers won't load from a `file://` page, so serve the folder:

```sh
npm start            # serves http://localhost:8000
npm test             # runs the tests (node --test)
```

Offline caching is off on `localhost` so edits show up on reload. Add `?sw` to the URL (`http://localhost:8000/?sw`) to test offline behavior.

## Editing

- **Exercises:** `src/data/exercises.js`. Every tag is checked by `tests/data.test.js`, so a typo fails `npm test`.
- **WODs:** `src/data/wods.js`. Each movement lists options in order of preference; `rx: true` marks the original movement.
- **Equipment I own:** `AVAILABLE_EQUIPMENT` in `src/config.js`. Add `"trx"` or `"pull-up-bar"` when they're set up; exercises and WOD options for them are already in the library.
- **Sets / reps / rest per style, circuit sizes:** `STYLE_PRESETS` in `src/config.js`.
- **Adding a new file the app loads** (e.g., a new module): add it to `PRECACHE` in `sw.js`. `tests/offline.test.js` fails until you do.

## Trying the generator from Node

```sh
node -e '
import("./src/generator.js").then(({ generateWorkout }) => {
  const w = generateWorkout({ minutes: 45, style: "hypertrophy", focus: "upper" });
  console.log(w.main.map((i) => `${i.exercise.name}: ${i.sets} x ${i.reps}`).join("\n"));
});'
```

Inputs: `minutes`, `style` (`strength` | `hypertrophy` | `circuit` | `mobility` | `wod`),
`focus` (`full-body` | `upper` | `lower` | `push` | `pull` | `custom` with `muscles: [...]`).
Options: `seed` (repeatable workouts), `equipment`, `wodId`.

## Credits

Fonts: [Barlow](https://github.com/jpt/barlow) by Jeremy Tribby, SIL Open Font License (`fonts/OFL.txt`).
