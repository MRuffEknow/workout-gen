# Home Gym Workout Generator — Project Plan

## Overview

A personal, mobile-first web app that stores the exercises available in my home gym and generates a workout based on:

- **Time available** (e.g., 20 / 30 / 45 / 60 minutes)
- **Workout style** (strength, hypertrophy, circuit/HIIT, mobility, WOD)
- **Focus areas** (full body, upper, lower, push, pull, or specific muscle groups)

It will mostly be used on my phone, in the gym, mid-workout. It should be fast, readable at a glance, and usable with one hand.

## Guiding principles

- **Keep it simple.** No framework, no build step. Plain HTML, CSS, and vanilla JavaScript (ES modules).
- **Static hosting.** The whole thing must run as static files so I can host it on my personal site or GitHub Pages.
- **Data is separate from logic.** The exercise library lives in its own file so I can edit it without touching the generator.
- **Generator is pure and testable.** The workout-building logic takes inputs + library and returns a workout object, with no DOM access, so it can be unit tested.
- **Ship v1 small, then iterate.** Don't build later-milestone features until v1 is working and I've used it.

## Tech stack

- HTML + CSS + vanilla JS (ES modules)
- `localStorage` for history and settings (wrapped in try/catch; app must work if storage is empty or unavailable)
- PWA basics (manifest + simple service worker) so it can be added to the phone home screen and work offline
- Node's built-in test runner (`node --test`) for generator tests; no other dev dependencies unless clearly justified

## Proposed file structure

```
/
├── index.html
├── styles.css
├── manifest.json
├── sw.js                  # service worker for offline use
├── icons/                 # home screen icons
├── fonts/                 # self-hosted Barlow fonts (works offline)
├── src/
│   ├── app.js             # UI wiring, rendering, event handlers
│   ├── generator.js       # pure workout-generation logic
│   ├── config.js          # style presets (sets/reps/rest/timing)
│   ├── storage.js         # localStorage helpers (history, settings)
│   ├── timer.js           # pure timer: workout → steps, and the step engine
│   ├── cues.js            # beeps, vibration, screen wake lock
│   ├── format.js          # display text helpers
│   └── data/
│       ├── exercises.js   # the exercise library
│       └── wods.js        # curated CrossFit-style WODs, adapted to my equipment
├── tests/
│   └── generator.test.js
├── README.md
└── PLAN.md
```

## My equipment

| Equipment ID    | What I have                                   | Status        | Notes                                         |
|-----------------|-----------------------------------------------|---------------|-----------------------------------------------|
| `dumbbells`     | PowerBlock adjustable dumbbells, 5–70 lb      | Available     | 5 lb increments; pair available               |
| `bench`         | Flat bench                                    | Available     | No incline/decline                            |
| `kettlebell`    | Adjustable kettlebell: 20, 25, 32.5, 40 lb    | Available     | Single bell; only these four settings         |
| `spin-bike`     | Spin bike                                     | Available     | Conditioning, warm-up, and rainy-day run sub  |
| `outdoor-run`   | Running outside                               | Available     | Used for WOD runs (e.g., Murph's miles)       |
| `bodyweight`    | —                                             | Available     | Always available                              |
| `trx`           | TRX suspension trainer                        | Not set up    | Owned; plan to anchor to the pull-up bar/joist |
| `pull-up-bar`   | —                                             | Planned       | Wall/joist-mounted (I can drill); top purchase |
| `weight-vest`   | —                                             | Considering   | Would load Murph and bodyweight work          |

**Not available:** barbell, rack, cables/machines, bands, box, rower. Exercises needing these must not be in the library.

**Owned equipment is a setting, not hard-coded.** `config.js` holds the list of available equipment IDs, and the generator only picks exercises whose equipment is all available. Exercises and WODs for `trx` (and any future gear) are still written into the library now, so setting up the TRX or buying something new is a one-line change.

**Implications for the library and generator**
- **Load ceiling:** 70 lb per dumbbell and a 40 lb kettlebell limit how heavy strength work can get, especially for lower body. Strength-style lower body will lean on unilateral work (split squats, single-leg RDLs) and tempo to stay challenging.
- **Kettlebell weights:** prescriptions must use 20 / 25 / 32.5 / 40 lb only (e.g., Rx 53 lb swings → 40 lb, scaled 35 lb → 32.5 lb).
- **Pulling is the weak spot:** until the pull-up bar/TRX are up, pulling is dumbbell/kettlebell rows, rear-delt work, and the dumbbell pullover (tagged `pull-vertical`/compound as the only overhead-pull stand-in). Pull-focused strength and circuit sessions come up short and say so.
- **Flat bench only:** incline pressing is out; use floor press, flat bench, and overhead press instead.

## Data model

### Exercise

```js
{
  id: "db-bench-press",              // unique, kebab-case
  name: "Dumbbell Bench Press",
  equipment: ["dumbbells", "bench"], // all required equipment
  primaryMuscles: ["chest"],
  secondaryMuscles: ["triceps", "shoulders"],
  pattern: "push-horizontal",        // see patterns below
  type: "compound",                  // "compound" | "isolation"
  styles: ["strength", "hypertrophy", "circuit"],
  unilateral: false,
  measure: "reps",                   // "reps" | "time" (holds, carries, intervals)
  warmup: false,                     // optional; true for dynamic warm-up drills
  notes: "Optional cue or form reminder"
}
```

**Muscle groups:** chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves, core

**Movement patterns:** push-horizontal, push-vertical, pull-horizontal, pull-vertical, squat, hinge, lunge, carry, core, isolation-upper, isolation-lower, conditioning, mobility

**Focus presets map to muscles/patterns:**
- Full body → all
- Upper → chest, back, shoulders, biceps, triceps
- Lower → quads, hamstrings, glutes, calves
- Push → chest, shoulders, triceps
- Pull → back, biceps
- Custom → user picks individual muscle groups

### Style presets (`config.js`)

Starting values; should be easy to tweak. Rest is ~1 minute everywhere because most sessions are short on time and meant to be fast-paced.

| Style       | Sets | Reps / Work        | Rest       | Notes                                   |
|-------------|------|--------------------|------------|-----------------------------------------|
| Strength    | 4–5  | 3–6                | 60 s       | Compounds only                          |
| Hypertrophy | 3–4  | 8–12               | 60 s       | Compounds first, then isolation         |
| Circuit     | 3+ rounds | 40 s on / 20 s off | 60 s between rounds | Max 5 per circuit; long sessions split into two circuits of 3 (A, then B) |
| Mobility    | 1–2  | 30–60 s holds/flows | minimal   | Uses mobility-tagged exercises          |
| WOD         | per workout | per workout  | per workout | CrossFit-style named workouts; see below |

### WODs (CrossFit-style)

WODs are fixed, named workouts (e.g., "Murph") rather than generated from the exercise pool, so they get their own data file (`src/data/wods.js`), not generated sets/reps.

- **Curated, not fetched.** The app is static and offline, so it can't pull from crossfit.com at runtime. A few benchmark WODs (Hero/Girl workouts and similar) are hand-adapted and stored in the data file.
- **Adapted to my equipment.** Each WOD records the original movements and my substitutions, e.g. Murph: pull-ups → TRX rows (or DB rows until the TRX is set up). The UI shows the substitution so it's clear what changed.
- **Fit the time budget.** Each WOD has an estimated duration range; the generator picks one whose midpoint fits the time after warm-up, preferring ones that use at least half of it. Scaled versions (e.g., "Half Murph") are their own entries.
- **Focus is a soft filter.** Most WODs are full body; focus applies only where there's a meaningful choice.

```js
{
  id: "murph",
  name: "Murph",
  format: "for-time",          // "for-time" | "amrap" | "emom" | "rounds"
  timeCapMinutes: 60,
  estimatedMinutes: [40, 70],
  original: "1 mi run, 100 pull-ups, 200 push-ups, 300 squats, 1 mi run (20 lb vest)",
  movements: [
    // Options in preference order; the first with available equipment is used.
    // `rx: true` marks the original movement; anything else shows as a substitution.
    { name: "Pull-up", prescription: "100 total", options: [
      { exerciseId: "pull-up", rx: true },
      { exerciseId: "trx-row" },
      { exerciseId: "db-bent-over-row", note: "Moderate dumbbells." },
    ] },
    { name: "Run", prescription: "1 mile", options: [
      { exerciseId: "run", rx: true },
      { exerciseId: "bike-ride", prescription: "8 min hard" },
    ] },
    // ...
  ],
  notes: "Partition as 20 rounds of 5/10/15."
}
```

### Circuits

Rounds of more than 5 exercises are hard to keep track of, so circuits add **rounds**, not exercises:

- One circuit of up to 5 (e.g., 30 min → 4 rounds of 5; 20 min → 3 rounds of 4). An exercise is dropped (down to 3) before dropping below 3 rounds.
- If one circuit of 5 would need more than 5 rounds, the session becomes **two circuits of 3** (A, then B), each done for all its rounds (e.g., 45 min → 5 rounds of A, then 5 rounds of B).
- Exercises are dealt into A and B so each circuit mixes upper and lower body. Cards are labeled A1–A3 / B1–B3.

### Generated workout (output of generator)

```js
{
  createdAt: "ISO timestamp",
  inputs: { minutes, style, focus },
  warmup: [ /* 2–3 items, ~5 min */ ],
  main: [
    { exercise, sets, reps, restSeconds, estimatedSeconds }
  ],
  cooldown: [ /* optional */ ],
  estimatedTotalMinutes
}
```

## Generator rules (v1)

1. **Estimate time per exercise** from the style preset (sets × (work time + rest)). Reserve ~5 min for warm-up. Add exercises until the time budget is filled without going over by more than ~10%.
2. **Filter the library** to exercises that match the chosen style and hit at least one target muscle.
3. **Order: compounds first, then isolation.** For strength, the workout should be mostly or entirely compounds.
4. **Balance movement patterns.** Don't repeat a movement pattern until the other relevant patterns for that focus have been used (e.g., full body should get a squat or lunge, a hinge, a push, and a pull before doubling up).
5. **No duplicate exercises** within a workout.
6. **Randomize within the rules** so regenerating gives a different but still sensible workout. Accept an optional seed so tests are deterministic.
7. **Swap a single exercise:** replace one exercise with another that has the same pattern (or same primary muscle as a fallback) and isn't already in the workout.
8. **Graceful fallback:** if there aren't enough matching exercises, return what's possible and include a message explaining why.

## UI (v1)

**Screen 1: Build a workout**
- Time: large tap targets (20 / 30 / 45 / 60, plus custom)
- Style: segmented buttons
- Focus: preset buttons, with an expandable "custom" muscle picker
- Big "Generate" button
- Remember last-used inputs

**Screen 2: Your workout**
- Warm-up, then numbered exercise cards showing name, sets × reps, rest, and optional note
- "Swap" button on each card
- "Regenerate" button for the whole workout
- Tap a card to mark it done (checkmark / dimmed)
- Estimated total time at the top
- "New workout" to go back

**Design notes**
- Mobile-first, large text, high contrast, thumb-reachable buttons
- Light and dark mode via `prefers-color-scheme`
- No horizontal scrolling on phone widths

## Milestones

### Milestone 1: Foundation
- Project scaffolding per the file structure above
- Exercise library populated from my equipment list (aim for 40–60 exercises, well tagged)
- `generator.js` implementing the v1 rules, plus swap
- Unit tests covering: time budget respected, no duplicates, pattern balance for full body, style filtering, swap returns a valid replacement, fallback when too few exercises

**Done when:** `node --test` passes and I can call the generator from Node and get sensible workouts.

### Milestone 2: Usable UI
- Build and workout screens as described above
- Remember last inputs in localStorage
- Works well on a phone-sized viewport

**Done when:** I can open `index.html` locally on my phone, generate a workout, swap exercises, and check them off.

### Milestone 3: Installable + hosted
- Manifest, icons, and service worker for offline/home-screen use
- README with instructions for editing the exercise library and deploying (hosted on GitHub Pages)

**Done when:** it's live at a URL and installed on my home screen.

### Milestone 4: Workout timer
A **Start workout** button that runs the session, so I can follow along instead of watching a clock. The timer adapts to the style:

- **Whole session:** elapsed time vs. the estimate, running from warm-up through the last exercise.
- **Strength / hypertrophy:** tap after each set to count it (e.g., "Set 2 of 4") and start the rest countdown; the card is marked done after the last set.
- **Circuits:** a full interval timer: 40 s on / 20 s off through each exercise, then rest between rounds, then circuit B. Shows the current exercise, what's next, and round X of Y.
- **Mobility:** a hold countdown per stretch, switching sides for one-sided stretches.
- **WODs:** a countdown for AMRAPs, a beep every minute for EMOMs, and a stopwatch with the time cap for "for time" workouts.
- **Cues:** a beep at the end of each work and rest period (plus a 3-2-1 lead-in), vibration where the phone supports it, and keep the screen awake while the timer runs.
- **Controls:** pause, skip, and go back one step, all within thumb reach.
- **Survives interruptions:** timer state is based on timestamps and saved, so a screen lock or reload doesn't lose it.

**Done when:** I can start a workout of each style and follow it start to finish from the timer alone.

### Later (don't build yet)
- Workout history, and avoiding muscles trained in the last 24–48 hours
- Logging weights/reps per set and showing last performance
- Save favorite workouts
- In-app editing of the exercise library
- Optional sync via Google Sheets or a small backend

## Instructions for Claude Code

1. Read this plan fully before writing code.
2. If the **My equipment** section still contains TODOs, ask me for my equipment list first.
3. Work one milestone at a time. At the end of each milestone, summarize what was built and anything I should review, then stop and wait for my go-ahead.
4. Prefer small, readable functions and comments explaining the "why" in the generator.
5. If a rule above turns out to be impractical or produces bad workouts, flag it and propose an alternative instead of silently changing it.
