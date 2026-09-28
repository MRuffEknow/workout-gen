// The exercise library. Edit freely: tests/data.test.js checks every tag
// against the lists in src/config.js, so typos fail `node --test`.
//
// Fields:
//   id               unique, kebab-case
//   equipment        ALL equipment required (see ALL_EQUIPMENT in config.js)
//   primaryMuscles   used for focus filtering
//   secondaryMuscles informational
//   pattern          movement pattern, used to balance workouts
//   type             "compound" | "isolation" (compounds are ordered first)
//   styles           which generated styles may use it
//   unilateral       one side at a time (time estimates double the work)
//   measure          "reps" | "time" (time = holds, carries, intervals)
//   warmup           optional; true if it's a good dynamic warm-up drill
//   notes            optional cue

export const EXERCISES = [
  // ── Push: horizontal ─────────────────────────────────────────────
  {
    id: "db-bench-press", name: "Dumbbell Bench Press", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "shoulders"],
    pattern: "push-horizontal", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-floor-press", name: "Dumbbell Floor Press", equipment: ["dumbbells"],
    primaryMuscles: ["chest"], secondaryMuscles: ["triceps"],
    pattern: "push-horizontal", type: "compound", styles: ["strength", "hypertrophy", "circuit"],
    unilateral: false, measure: "reps", notes: "Pause with elbows on the floor each rep.",
  },
  {
    id: "db-close-grip-press", name: "Close-Grip Dumbbell Press", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["triceps", "chest"], secondaryMuscles: ["shoulders"],
    pattern: "push-horizontal", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: false, measure: "reps", notes: "Dumbbells touching, elbows tucked.",
  },
  {
    id: "db-single-arm-bench-press", name: "Single-Arm Dumbbell Bench Press", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["chest"], secondaryMuscles: ["core", "triceps"],
    pattern: "push-horizontal", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: true, measure: "reps", notes: "Brace hard so you don't roll off the bench.",
  },
  {
    id: "push-up", name: "Push-Up", equipment: ["bodyweight"],
    primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "shoulders", "core"],
    pattern: "push-horizontal", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "decline-push-up", name: "Decline Push-Up", equipment: ["bodyweight", "bench"],
    primaryMuscles: ["chest", "shoulders"], secondaryMuscles: ["triceps"],
    pattern: "push-horizontal", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps", notes: "Feet on the bench.",
  },
  {
    id: "trx-chest-press", name: "TRX Chest Press", equipment: ["trx"],
    primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "core"],
    pattern: "push-horizontal", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },

  // ── Push: vertical ───────────────────────────────────────────────
  {
    id: "db-overhead-press", name: "Standing Dumbbell Overhead Press", equipment: ["dumbbells"],
    primaryMuscles: ["shoulders"], secondaryMuscles: ["triceps", "core"],
    pattern: "push-vertical", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-seated-shoulder-press", name: "Seated Dumbbell Shoulder Press", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["shoulders"], secondaryMuscles: ["triceps"],
    pattern: "push-vertical", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-push-press", name: "Dumbbell Push Press", equipment: ["dumbbells"],
    primaryMuscles: ["shoulders"], secondaryMuscles: ["triceps", "quads"],
    pattern: "push-vertical", type: "compound", styles: ["strength", "circuit"],
    unilateral: false, measure: "reps", notes: "Dip and drive with the legs.",
  },
  {
    id: "kb-single-arm-press", name: "Kettlebell Single-Arm Press", equipment: ["kettlebell"],
    primaryMuscles: ["shoulders"], secondaryMuscles: ["triceps", "core"],
    pattern: "push-vertical", type: "compound", styles: ["strength", "hypertrophy", "circuit"],
    unilateral: true, measure: "reps",
  },
  {
    id: "db-arnold-press", name: "Arnold Press", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["shoulders"], secondaryMuscles: ["triceps"],
    pattern: "push-vertical", type: "compound", styles: ["hypertrophy"],
    unilateral: false, measure: "reps",
  },
  {
    id: "pike-push-up", name: "Pike Push-Up", equipment: ["bodyweight"],
    primaryMuscles: ["shoulders"], secondaryMuscles: ["triceps"],
    pattern: "push-vertical", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps", notes: "Feet on the bench to make it harder.",
  },

  // ── Pull: horizontal ─────────────────────────────────────────────
  {
    id: "db-bent-over-row", name: "Dumbbell Bent-Over Row", equipment: ["dumbbells"],
    primaryMuscles: ["back"], secondaryMuscles: ["biceps", "shoulders"],
    pattern: "pull-horizontal", type: "compound", styles: ["strength", "hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-single-arm-row", name: "Single-Arm Dumbbell Row", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["back"], secondaryMuscles: ["biceps"],
    pattern: "pull-horizontal", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: true, measure: "reps", notes: "Knee and hand on the bench.",
  },
  {
    id: "db-chest-supported-row", name: "Chest-Supported Dumbbell Row", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["back"], secondaryMuscles: ["biceps", "shoulders"],
    pattern: "pull-horizontal", type: "compound", styles: ["hypertrophy"],
    unilateral: false, measure: "reps", notes: "Lie face-down on the flat bench.",
  },
  {
    id: "kb-single-arm-row", name: "Kettlebell Single-Arm Row", equipment: ["kettlebell"],
    primaryMuscles: ["back"], secondaryMuscles: ["biceps"],
    pattern: "pull-horizontal", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: true, measure: "reps",
  },
  {
    id: "renegade-row", name: "Renegade Row", equipment: ["dumbbells"],
    primaryMuscles: ["back", "core"], secondaryMuscles: ["chest", "biceps"],
    pattern: "pull-horizontal", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps", notes: "Wide feet; keep hips square.",
  },
  {
    id: "trx-row", name: "TRX Row", equipment: ["trx"],
    primaryMuscles: ["back"], secondaryMuscles: ["biceps"],
    pattern: "pull-horizontal", type: "compound", styles: ["strength", "hypertrophy", "circuit"],
    unilateral: false, measure: "reps", notes: "Walk feet forward to make it harder.",
  },

  // ── Pull: vertical ───────────────────────────────────────────────
  {
    id: "pull-up", name: "Pull-Up", equipment: ["pull-up-bar"],
    primaryMuscles: ["back"], secondaryMuscles: ["biceps"],
    pattern: "pull-vertical", type: "compound", styles: ["strength", "hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "chin-up", name: "Chin-Up", equipment: ["pull-up-bar"],
    primaryMuscles: ["back", "biceps"], secondaryMuscles: [],
    pattern: "pull-vertical", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: false, measure: "reps",
  },
  {
    id: "trx-assisted-pull-up", name: "TRX Assisted Pull-Up", equipment: ["trx"],
    primaryMuscles: ["back"], secondaryMuscles: ["biceps"],
    pattern: "pull-vertical", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps", notes: "Needs a high anchor. Use legs only as much as needed.",
  },
  {
    // Technically a single-joint move, but tagged compound: it works lats,
    // chest and triceps, and it's the only overhead pull without a bar.
    id: "db-pullover", name: "Dumbbell Pullover", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["back"], secondaryMuscles: ["chest", "triceps"],
    pattern: "pull-vertical", type: "compound", styles: ["hypertrophy"],
    unilateral: false, measure: "reps", notes: "Slight elbow bend; stretch the lats.",
  },

  // ── Squat ────────────────────────────────────────────────────────
  {
    id: "db-goblet-squat", name: "Dumbbell Goblet Squat", equipment: ["dumbbells"],
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["core"],
    pattern: "squat", type: "compound", styles: ["strength", "hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "kb-goblet-squat", name: "Kettlebell Goblet Squat", equipment: ["kettlebell"],
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["core"],
    pattern: "squat", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-front-squat", name: "Dumbbell Front Squat", equipment: ["dumbbells"],
    primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "core"],
    pattern: "squat", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: false, measure: "reps", notes: "Dumbbells on the shoulders.",
  },
  {
    id: "db-sumo-squat", name: "Dumbbell Sumo Squat", equipment: ["dumbbells"],
    primaryMuscles: ["glutes", "quads"], secondaryMuscles: ["hamstrings"],
    pattern: "squat", type: "compound", styles: ["hypertrophy"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-thruster", name: "Dumbbell Thruster", equipment: ["dumbbells"],
    primaryMuscles: ["quads", "shoulders"], secondaryMuscles: ["glutes", "triceps"],
    pattern: "squat", type: "compound", styles: ["circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "air-squat", name: "Air Squat", equipment: ["bodyweight"],
    primaryMuscles: ["quads"], secondaryMuscles: ["glutes"],
    pattern: "squat", type: "compound", styles: ["circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "jump-squat", name: "Jump Squat", equipment: ["bodyweight"],
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["calves"],
    pattern: "squat", type: "compound", styles: ["circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "trx-pistol-squat", name: "TRX Pistol Squat", equipment: ["trx"],
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["core"],
    pattern: "squat", type: "compound", styles: ["hypertrophy"],
    unilateral: true, measure: "reps",
  },

  // ── Lunge ────────────────────────────────────────────────────────
  {
    id: "db-bulgarian-split-squat", name: "Dumbbell Bulgarian Split Squat", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings"],
    pattern: "lunge", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: true, measure: "reps", notes: "Rear foot on the bench.",
  },
  {
    id: "db-reverse-lunge", name: "Dumbbell Reverse Lunge", equipment: ["dumbbells"],
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings"],
    pattern: "lunge", type: "compound", styles: ["strength", "hypertrophy", "circuit"],
    unilateral: true, measure: "reps",
  },
  {
    id: "db-walking-lunge", name: "Dumbbell Walking Lunge", equipment: ["dumbbells"],
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings", "core"],
    pattern: "lunge", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-step-up", name: "Dumbbell Step-Up", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: [],
    pattern: "lunge", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: true, measure: "reps", notes: "Make sure the bench is stable.",
  },
  {
    id: "db-lateral-lunge", name: "Dumbbell Lateral Lunge", equipment: ["dumbbells"],
    primaryMuscles: ["glutes", "quads"], secondaryMuscles: ["hamstrings"],
    pattern: "lunge", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: true, measure: "reps",
  },
  {
    id: "jumping-lunge", name: "Jumping Lunge", equipment: ["bodyweight"],
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["calves"],
    pattern: "lunge", type: "compound", styles: ["circuit"],
    unilateral: false, measure: "reps",
  },

  // ── Hinge ────────────────────────────────────────────────────────
  {
    id: "db-romanian-deadlift", name: "Dumbbell Romanian Deadlift", equipment: ["dumbbells"],
    primaryMuscles: ["hamstrings", "glutes"], secondaryMuscles: ["back"],
    pattern: "hinge", type: "compound", styles: ["strength", "hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-single-leg-rdl", name: "Dumbbell Single-Leg RDL", equipment: ["dumbbells"],
    primaryMuscles: ["hamstrings", "glutes"], secondaryMuscles: ["core"],
    pattern: "hinge", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: true, measure: "reps",
  },
  {
    id: "db-deadlift", name: "Dumbbell Deadlift", equipment: ["dumbbells"],
    primaryMuscles: ["glutes", "hamstrings"], secondaryMuscles: ["quads", "back"],
    pattern: "hinge", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-hip-thrust", name: "Dumbbell Hip Thrust", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings"],
    pattern: "hinge", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: false, measure: "reps", notes: "Upper back on the bench; pause at the top.",
  },
  {
    id: "kb-swing", name: "Kettlebell Swing", equipment: ["kettlebell"],
    primaryMuscles: ["glutes", "hamstrings"], secondaryMuscles: ["core", "back"],
    pattern: "hinge", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps", notes: "Snap the hips; arms just guide the bell.",
  },
  {
    id: "kb-deadlift", name: "Kettlebell Deadlift", equipment: ["kettlebell"],
    primaryMuscles: ["glutes", "hamstrings"], secondaryMuscles: ["back"],
    pattern: "hinge", type: "compound", styles: ["circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-hang-clean", name: "Dumbbell Hang Power Clean", equipment: ["dumbbells"],
    primaryMuscles: ["glutes", "hamstrings"], secondaryMuscles: ["back", "shoulders"],
    pattern: "hinge", type: "compound", styles: ["circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-snatch", name: "Dumbbell Snatch", equipment: ["dumbbells"],
    primaryMuscles: ["glutes", "shoulders"], secondaryMuscles: ["hamstrings", "back"],
    pattern: "hinge", type: "compound", styles: ["circuit"],
    unilateral: true, measure: "reps", notes: "Alternate arms each rep.",
  },
  {
    id: "db-clean-and-jerk", name: "Dumbbell Clean and Jerk", equipment: ["dumbbells"],
    primaryMuscles: ["glutes", "shoulders"], secondaryMuscles: ["quads", "triceps"],
    pattern: "hinge", type: "compound", styles: [],
    unilateral: false, measure: "reps", // WODs only (Grace), so no styles
  },
  {
    id: "glute-bridge", name: "Single-Leg Glute Bridge", equipment: ["bodyweight"],
    primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings"],
    pattern: "hinge", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: true, measure: "reps",
  },

  // ── Isolation: lower ─────────────────────────────────────────────
  {
    id: "db-calf-raise", name: "Single-Leg Dumbbell Calf Raise", equipment: ["dumbbells"],
    primaryMuscles: ["calves"], secondaryMuscles: [],
    pattern: "isolation-lower", type: "isolation", styles: ["hypertrophy"],
    unilateral: true, measure: "reps", notes: "Hold something for balance; full stretch at the bottom.",
  },
  {
    id: "wall-sit", name: "Wall Sit", equipment: ["bodyweight"],
    primaryMuscles: ["quads"], secondaryMuscles: [],
    pattern: "isolation-lower", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "time", notes: "Hold a dumbbell on your lap to make it harder.",
  },
  {
    id: "trx-hamstring-curl", name: "TRX Hamstring Curl", equipment: ["trx"],
    primaryMuscles: ["hamstrings"], secondaryMuscles: ["glutes"],
    pattern: "isolation-lower", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },

  // ── Isolation: upper ─────────────────────────────────────────────
  {
    id: "db-curl", name: "Dumbbell Curl", equipment: ["dumbbells"],
    primaryMuscles: ["biceps"], secondaryMuscles: [],
    pattern: "isolation-upper", type: "isolation", styles: ["hypertrophy"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-hammer-curl", name: "Hammer Curl", equipment: ["dumbbells"],
    primaryMuscles: ["biceps"], secondaryMuscles: [],
    pattern: "isolation-upper", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-overhead-triceps-extension", name: "Overhead Dumbbell Triceps Extension", equipment: ["dumbbells"],
    primaryMuscles: ["triceps"], secondaryMuscles: [],
    pattern: "isolation-upper", type: "isolation", styles: ["hypertrophy"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-skull-crusher", name: "Dumbbell Skull Crusher", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["triceps"], secondaryMuscles: [],
    pattern: "isolation-upper", type: "isolation", styles: ["hypertrophy"],
    unilateral: false, measure: "reps",
  },
  {
    id: "bench-dip", name: "Bench Dip", equipment: ["bodyweight", "bench"],
    primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "shoulders"],
    pattern: "isolation-upper", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-lateral-raise", name: "Dumbbell Lateral Raise", equipment: ["dumbbells"],
    primaryMuscles: ["shoulders"], secondaryMuscles: [],
    pattern: "isolation-upper", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "db-rear-delt-fly", name: "Dumbbell Rear Delt Fly", equipment: ["dumbbells"],
    primaryMuscles: ["shoulders", "back"], secondaryMuscles: [],
    pattern: "isolation-upper", type: "isolation", styles: ["hypertrophy"],
    unilateral: false, measure: "reps", notes: "Hinge over or lie face-down on the bench.",
  },
  {
    id: "db-fly", name: "Dumbbell Fly", equipment: ["dumbbells", "bench"],
    primaryMuscles: ["chest"], secondaryMuscles: ["shoulders"],
    pattern: "isolation-upper", type: "isolation", styles: ["hypertrophy"],
    unilateral: false, measure: "reps",
  },
  {
    id: "trx-bicep-curl", name: "TRX Biceps Curl", equipment: ["trx"],
    primaryMuscles: ["biceps"], secondaryMuscles: [],
    pattern: "isolation-upper", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "trx-face-pull", name: "TRX Face Pull", equipment: ["trx"],
    primaryMuscles: ["shoulders", "back"], secondaryMuscles: [],
    pattern: "isolation-upper", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },

  // ── Core ─────────────────────────────────────────────────────────
  {
    id: "plank", name: "Plank", equipment: ["bodyweight"],
    primaryMuscles: ["core"], secondaryMuscles: ["shoulders"],
    pattern: "core", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "time",
  },
  {
    id: "side-plank", name: "Side Plank", equipment: ["bodyweight"],
    primaryMuscles: ["core"], secondaryMuscles: [],
    pattern: "core", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: true, measure: "time",
  },
  {
    id: "dead-bug", name: "Dead Bug", equipment: ["bodyweight"],
    primaryMuscles: ["core"], secondaryMuscles: [],
    pattern: "core", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps", notes: "Low back pressed into the floor.",
  },
  {
    id: "hollow-hold", name: "Hollow Hold", equipment: ["bodyweight"],
    primaryMuscles: ["core"], secondaryMuscles: [],
    pattern: "core", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "time",
  },
  {
    id: "db-russian-twist", name: "Dumbbell Russian Twist", equipment: ["dumbbells"],
    primaryMuscles: ["core"], secondaryMuscles: [],
    pattern: "core", type: "isolation", styles: ["circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "sit-up", name: "Sit-Up", equipment: ["bodyweight"],
    primaryMuscles: ["core"], secondaryMuscles: [],
    pattern: "core", type: "isolation", styles: ["circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "v-up", name: "V-Up", equipment: ["bodyweight"],
    primaryMuscles: ["core"], secondaryMuscles: [],
    pattern: "core", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "kb-turkish-get-up", name: "Kettlebell Turkish Get-Up", equipment: ["kettlebell"],
    primaryMuscles: ["core", "shoulders"], secondaryMuscles: ["glutes"],
    pattern: "core", type: "compound", styles: ["strength", "hypertrophy"],
    unilateral: true, measure: "reps", notes: "Slow and controlled; eyes on the bell.",
  },
  {
    id: "hanging-knee-raise", name: "Hanging Knee Raise", equipment: ["pull-up-bar"],
    primaryMuscles: ["core"], secondaryMuscles: [],
    pattern: "core", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "toes-to-bar", name: "Toes-to-Bar", equipment: ["pull-up-bar"],
    primaryMuscles: ["core"], secondaryMuscles: ["back"],
    pattern: "core", type: "isolation", styles: ["circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "trx-knee-tuck", name: "TRX Knee Tuck", equipment: ["trx"],
    primaryMuscles: ["core"], secondaryMuscles: ["shoulders"],
    pattern: "core", type: "isolation", styles: ["hypertrophy", "circuit"],
    unilateral: false, measure: "reps",
  },

  // ── Carry ────────────────────────────────────────────────────────
  {
    id: "db-farmer-carry", name: "Dumbbell Farmer Carry", equipment: ["dumbbells"],
    primaryMuscles: ["core"], secondaryMuscles: ["back", "shoulders"],
    pattern: "carry", type: "compound", styles: ["strength", "hypertrophy", "circuit"],
    unilateral: false, measure: "time", notes: "Heaviest dumbbells you can hold with good posture.",
  },
  {
    id: "kb-suitcase-carry", name: "Kettlebell Suitcase Carry", equipment: ["kettlebell"],
    primaryMuscles: ["core"], secondaryMuscles: ["shoulders"],
    pattern: "carry", type: "compound", styles: ["hypertrophy", "circuit"],
    unilateral: true, measure: "time", notes: "Don't lean toward or away from the bell.",
  },

  // ── Conditioning ─────────────────────────────────────────────────
  {
    id: "bike-sprint", name: "Spin Bike Sprint", equipment: ["spin-bike"],
    primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "calves"],
    pattern: "conditioning", type: "compound", styles: ["circuit"],
    unilateral: false, measure: "time",
  },
  {
    id: "bike-ride", name: "Spin Bike (steady, hard)", equipment: ["spin-bike"],
    primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "calves"],
    pattern: "conditioning", type: "compound", styles: [],
    unilateral: false, measure: "time", // WODs only: rainy-day run substitute
  },
  {
    id: "bike-easy", name: "Easy Spin", equipment: ["spin-bike"],
    primaryMuscles: ["quads"], secondaryMuscles: [],
    pattern: "conditioning", type: "compound", styles: [],
    unilateral: false, measure: "time", warmup: true,
  },
  {
    id: "run", name: "Run", equipment: ["outdoor-run"],
    primaryMuscles: ["quads"], secondaryMuscles: ["calves", "hamstrings"],
    pattern: "conditioning", type: "compound", styles: [],
    unilateral: false, measure: "time", // WODs only
  },
  {
    id: "burpee", name: "Burpee", equipment: ["bodyweight"],
    primaryMuscles: ["chest", "quads"], secondaryMuscles: ["core", "shoulders"],
    pattern: "conditioning", type: "compound", styles: ["circuit"],
    unilateral: false, measure: "reps",
  },
  {
    id: "mountain-climber", name: "Mountain Climber", equipment: ["bodyweight"],
    primaryMuscles: ["core"], secondaryMuscles: ["shoulders", "quads"],
    pattern: "conditioning", type: "compound", styles: ["circuit"],
    unilateral: false, measure: "time",
  },
  {
    id: "jumping-jack", name: "Jumping Jack", equipment: ["bodyweight"],
    primaryMuscles: ["calves"], secondaryMuscles: ["shoulders"],
    pattern: "conditioning", type: "compound", styles: ["circuit"],
    unilateral: false, measure: "time", warmup: true,
  },
  {
    id: "broad-jump", name: "Broad Jump", equipment: ["bodyweight"],
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["calves"],
    pattern: "conditioning", type: "compound", styles: ["circuit"],
    unilateral: false, measure: "reps", notes: "Walk back between reps.",
  },

  // ── Mobility (warm-up drills and mobility sessions) ─────────────
  {
    id: "cat-cow", name: "Cat-Cow", equipment: ["bodyweight"],
    primaryMuscles: ["back"], secondaryMuscles: ["core"],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: false, measure: "time", warmup: true,
  },
  {
    id: "worlds-greatest-stretch", name: "World's Greatest Stretch", equipment: ["bodyweight"],
    primaryMuscles: ["glutes", "hamstrings"], secondaryMuscles: ["back", "quads"],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: true, measure: "time", warmup: true,
  },
  {
    id: "leg-swings", name: "Leg Swings", equipment: ["bodyweight"],
    primaryMuscles: ["hamstrings", "glutes"], secondaryMuscles: [],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: true, measure: "time", warmup: true, notes: "Front-to-back, then side-to-side.",
  },
  {
    id: "arm-circles", name: "Arm Circles", equipment: ["bodyweight"],
    primaryMuscles: ["shoulders"], secondaryMuscles: [],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: false, measure: "time", warmup: true,
  },
  {
    id: "inchworm", name: "Inchworm", equipment: ["bodyweight"],
    primaryMuscles: ["hamstrings", "shoulders"], secondaryMuscles: ["core"],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: false, measure: "time", warmup: true,
  },
  {
    id: "thoracic-open-book", name: "Thoracic Open Book", equipment: ["bodyweight"],
    primaryMuscles: ["back"], secondaryMuscles: ["chest"],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: true, measure: "time", warmup: true,
  },
  {
    id: "scapular-push-up", name: "Scapular Push-Up", equipment: ["bodyweight"],
    primaryMuscles: ["shoulders", "chest"], secondaryMuscles: [],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: false, measure: "time", warmup: true,
  },
  {
    id: "cossack-squat", name: "Cossack Squat", equipment: ["bodyweight"],
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings"],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: true, measure: "time", warmup: true,
  },
  {
    id: "squat-to-stand", name: "Squat to Stand", equipment: ["bodyweight"],
    primaryMuscles: ["hamstrings", "quads"], secondaryMuscles: ["glutes"],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: false, measure: "time", warmup: true,
  },
  {
    id: "hip-90-90", name: "90/90 Hip Switch", equipment: ["bodyweight"],
    primaryMuscles: ["glutes"], secondaryMuscles: [],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: false, measure: "time",
  },
  {
    id: "couch-stretch", name: "Couch Stretch", equipment: ["bodyweight", "bench"],
    primaryMuscles: ["quads"], secondaryMuscles: [],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: true, measure: "time", notes: "Back foot up on the bench.",
  },
  {
    id: "pigeon-stretch", name: "Pigeon Stretch", equipment: ["bodyweight"],
    primaryMuscles: ["glutes"], secondaryMuscles: [],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: true, measure: "time",
  },
  {
    id: "childs-pose", name: "Child's Pose", equipment: ["bodyweight"],
    primaryMuscles: ["back"], secondaryMuscles: ["shoulders"],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: false, measure: "time",
  },
  {
    id: "doorway-pec-stretch", name: "Doorway Pec Stretch", equipment: ["bodyweight"],
    primaryMuscles: ["chest"], secondaryMuscles: ["shoulders"],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: true, measure: "time",
  },
  {
    id: "standing-hamstring-stretch", name: "Standing Hamstring Stretch", equipment: ["bodyweight", "bench"],
    primaryMuscles: ["hamstrings"], secondaryMuscles: [],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: true, measure: "time", notes: "Heel on the bench, hinge from the hips.",
  },
  {
    id: "calf-stretch", name: "Wall Calf Stretch", equipment: ["bodyweight"],
    primaryMuscles: ["calves"], secondaryMuscles: [],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: true, measure: "time",
  },
  {
    id: "overhead-triceps-stretch", name: "Overhead Triceps Stretch", equipment: ["bodyweight"],
    primaryMuscles: ["triceps"], secondaryMuscles: ["shoulders"],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: true, measure: "time",
  },
  {
    id: "wall-biceps-stretch", name: "Wall Biceps Stretch", equipment: ["bodyweight"],
    primaryMuscles: ["biceps"], secondaryMuscles: ["chest"],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: true, measure: "time",
  },
  {
    id: "dead-hang", name: "Dead Hang", equipment: ["pull-up-bar"],
    primaryMuscles: ["back", "shoulders"], secondaryMuscles: [],
    pattern: "mobility", type: "isolation", styles: ["mobility"],
    unilateral: false, measure: "time",
  },
];
