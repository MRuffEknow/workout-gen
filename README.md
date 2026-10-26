# workout-gen

A mobile-first workout generator for my home gym. See [PLAN.md](PLAN.md) for the full plan.

## Status

Milestones 1–4 are done (generator, phone UI, offline + installable, workout timer).

## Use it on your phone

1. Open **https://mruffeknow.github.io/workout-gen/**
2. Add it to your home screen:
   - **iPhone (Safari):** Share button → *Add to Home Screen*.
   - **Android (Chrome):** ⋮ menu → *Add to Home screen* (or *Install app*).
3. Open it from the home screen icon. After the first load it works without a signal.

Your last choices and the workout in progress are saved on the phone, so a screen lock or reload doesn't lose your place.

## Exercise videos

Not sure how a move goes? Tap **Video** on an exercise card (or next to a warm-up move, or under the exercise name on the timer screen). It opens a YouTube search for that exercise in a new tab, filtered to videos under 4 minutes so short demo clips come first. It needs a signal; the rest of the app still works offline.

## The workout timer

Tap **Start workout** on a workout to run it:

- **Lifting:** tap *Done set* after each set; the rest countdown starts on its own.
- **Circuits:** runs itself: 40 s on / 20 s off, rest between rounds, then circuit B. One-sided moves beep halfway to switch sides.
- **Mobility:** timed holds, left and right sides separately.
- **WODs:** AMRAP countdown with a round counter, EMOM minute-by-minute, or a stopwatch with the time cap for "for time" workouts.

The screen turns the style's color while you work and dark while you rest. Beeps count down the last 3 seconds and mark each change (tap *Beeps on/off* to mute); Android phones also vibrate. The screen stays awake while the timer runs. If the phone locks anyway, the timer catches up when you unlock it, and cards are checked off as you finish them.

## Body restoration

The **Body restoration** tab runs the 8-week *Beginner Body Restoration* program (Conor Harris) so you don't have to page through the PDF:

- **Today's session:** the current phase's drills, in order, with sets × reps or breaths. Each drill has the guide's demo video and an expandable "How you know it's right" checklist.
- **Start session** runs the timer. Breath drills count down the breaths with a *Breathe out / Breathe in* prompt (about 5 s each). Rep drills wait for *Done set*. One-sided drills do the left side, then the right.
- **Logging:** finishing every drill (or ticking every card) logs today. Tap a day in *Last 7 days* to log or unlog it by hand.
- **Phases:** each phase's 14 days start with your first session in it. After 14 days a *Start phase N* button appears. You can also change phase under *How to do the program*.
- Phase 3 has an optional drill, which is off by default; tap *Add the optional drill* to include it.

Only the program's structure and short cues in my own words are in this repo, in `src/data/restoration.js`. The guide's full text stays in the PDF, since this repo is public. The side-to-side self-assessment isn't included, so every one-sided drill is done on both sides, as the guide recommends by default.

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
- **Body restoration drills:** `src/data/restoration.js`. Checked by `tests/restore.test.js`.
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
