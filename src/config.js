// Settings and presets. Edit these values to tune the generator without
// touching generator.js.

// Every equipment ID the library may reference.
export const ALL_EQUIPMENT = [
  "bodyweight",
  "dumbbells",
  "bench",
  "kettlebell",
  "spin-bike",
  "outdoor-run",
  "trx",
  "pull-up-bar",
  "weight-vest",
];

// What I can actually use right now. The generator skips any exercise that
// needs equipment not in this list. Add "trx" once it's anchored, and
// "pull-up-bar" / "weight-vest" once they're bought.
export const AVAILABLE_EQUIPMENT = [
  "bodyweight",
  "dumbbells",
  "bench",
  "kettlebell",
  "spin-bike",
  "outdoor-run",
];

export const MUSCLES = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "calves", "core",
];

export const PATTERNS = [
  "push-horizontal", "push-vertical", "pull-horizontal", "pull-vertical",
  "squat", "hinge", "lunge", "carry", "core",
  "isolation-upper", "isolation-lower", "conditioning", "mobility",
];

// Styles an exercise can be tagged with. "wod" isn't here: WODs are
// fixed workouts from data/wods.js, not built from tagged exercises.
export const EXERCISE_STYLES = ["strength", "hypertrophy", "circuit", "mobility"];

export const STYLES = ["strength", "hypertrophy", "circuit", "mobility", "wod"];

// Minutes set aside for the warm-up (not used by mobility, which is its own warm-up).
export const WARMUP_MINUTES = 5;

// Sessions this long or longer use the upper end of each set range.
export const LONG_SESSION_MINUTES = 45;

// Per-style prescriptions. Rest is kept to ~1 min across the board: most
// sessions are short on time, so they're meant to be fast-paced.
//   sets: [short session, long session]
//   workSeconds: rough time to perform one set (used only for time estimates)
//   restSeconds: rest after each set (for circuits: between exercises)
//   maxExercises: cap so long sessions add sets rather than endless exercises
//   (circuits have their own settings, described below)
export const STYLE_PRESETS = {
  strength: {
    label: "Strength",
    sets: [4, 5],
    reps: "3–6",
    holdReps: "20–30 s",
    workSeconds: 30,
    restSeconds: 60,
    compoundsOnly: true,
    maxExercises: 6,
  },
  hypertrophy: {
    label: "Hypertrophy",
    sets: [3, 4],
    reps: "8–12",
    holdReps: "30–45 s",
    workSeconds: 40,
    restSeconds: 60,
    maxExercises: 8,
  },
  // Circuits add rounds rather than exercises: a round of more than 5 moves
  // is hard to keep track of mid-workout. When one circuit of 5 would need
  // more than maxSingleCircuitRounds, the session splits into two circuits
  // of splitCircuitSize (A then B), each done for all its rounds.
  circuit: {
    label: "Circuit",
    reps: "40 s on / 20 s off",
    holdReps: "40 s on / 20 s off",
    workSeconds: 40,
    restSeconds: 20,
    roundRestSeconds: 60,
    maxPerCircuit: 5,
    minRounds: 3,
    maxSingleCircuitRounds: 5,
    splitCircuitSize: 3,
    maxSplitRounds: 8,
    circuitChangeSeconds: 120,
  },
  mobility: {
    label: "Mobility",
    sets: [2, 2],
    reps: "45–60 s",
    holdReps: "45–60 s",
    workSeconds: 60,
    restSeconds: 15,
    skipWarmup: true,
    maxExercises: Infinity,
  },
};

// Focus presets map to target muscles.
export const FOCUS_PRESETS = {
  "full-body": MUSCLES,
  upper: ["chest", "back", "shoulders", "biceps", "triceps"],
  lower: ["quads", "hamstrings", "glutes", "calves"],
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps"],
};

// Movement patterns are grouped so the generator can balance a workout:
// a full-body day should get a knee-dominant lift, a hinge, a push and a pull
// before it doubles up on anything. Within a group, the least-used pattern
// goes first (e.g., a second push is vertical if the first was horizontal).
//   tier 1: main lifts   tier 2: trunk and conditioning   tier 3: isolation
export const PATTERN_GROUPS = [
  { id: "knee", tier: 1, patterns: ["squat", "lunge"] },
  { id: "hinge", tier: 1, patterns: ["hinge"] },
  { id: "push", tier: 1, patterns: ["push-horizontal", "push-vertical"] },
  { id: "pull", tier: 1, patterns: ["pull-horizontal", "pull-vertical"] },
  { id: "mobility", tier: 1, patterns: ["mobility"] },
  { id: "trunk", tier: 2, patterns: ["core", "carry"] },
  { id: "conditioning", tier: 2, patterns: ["conditioning"] },
  { id: "arms", tier: 3, patterns: ["isolation-upper"] },
  { id: "legs", tier: 3, patterns: ["isolation-lower"] },
];

// The order tiers are visited in. The main lifts come twice before trunk work
// so short sessions stay compound-heavy; isolation is slotted in after the
// first pass so hypertrophy days get some arm/leg accessory work. After this
// opening sequence, the generator repeats REPEAT_TIER_ORDER until time runs out.
export const OPENING_TIER_ORDER = [1, 3, 1, 2, 3];
export const REPEAT_TIER_ORDER = [1, 2, 3];
