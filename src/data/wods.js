// CrossFit-style named workouts, adapted to my equipment.
//
// Each movement lists `options` in order of preference. The generator uses
// the first option whose equipment is available. `rx: true` marks the
// original movement; anything else is shown as a substitution.
// An option's `prescription` overrides the movement's (e.g., bike time
// instead of run distance).
//
// estimatedMinutes is a rough [fast, slow] range for me, used to match a WOD
// to the time available. Tweak it after doing the workout.

export const WODS = [
  {
    id: "murph",
    name: "Murph",
    category: "hero",
    format: "for-time",
    timeCapMinutes: 70,
    estimatedMinutes: [40, 65],
    original: "For time: 1 mile run, 100 pull-ups, 200 push-ups, 300 air squats, 1 mile run. Wear a 20 lb vest.",
    structure: "Run, then partition the middle as 20 rounds of 5 / 10 / 15, then run.",
    movements: [
      { name: "Run", prescription: "1 mile", options: [
        { exerciseId: "run", rx: true },
        { exerciseId: "bike-ride", prescription: "8 min hard" },
      ] },
      { name: "Pull-up", prescription: "100 total (5 per round)", options: [
        { exerciseId: "pull-up", rx: true },
        { exerciseId: "trx-row" },
        { exerciseId: "db-bent-over-row", note: "Moderate dumbbells, strict reps." },
      ] },
      { name: "Push-up", prescription: "200 total (10 per round)", options: [{ exerciseId: "push-up", rx: true }] },
      { name: "Air squat", prescription: "300 total (15 per round)", options: [{ exerciseId: "air-squat", rx: true }] },
      { name: "Run", prescription: "1 mile", options: [
        { exerciseId: "run", rx: true },
        { exerciseId: "bike-ride", prescription: "8 min hard" },
      ] },
    ],
    notes: "Vest optional until you have one. Scale reps before scaling the run.",
  },
  {
    id: "half-murph",
    name: "Half Murph",
    category: "hero",
    format: "for-time",
    timeCapMinutes: 40,
    estimatedMinutes: [22, 38],
    original: "Murph at half volume: ½ mile run, 50 pull-ups, 100 push-ups, 150 air squats, ½ mile run.",
    structure: "Run, then 10 rounds of 5 / 10 / 15, then run.",
    movements: [
      { name: "Run", prescription: "½ mile", options: [
        { exerciseId: "run", rx: true },
        { exerciseId: "bike-ride", prescription: "4 min hard" },
      ] },
      { name: "Pull-up", prescription: "50 total (5 per round)", options: [
        { exerciseId: "pull-up", rx: true },
        { exerciseId: "trx-row" },
        { exerciseId: "db-bent-over-row", note: "Moderate dumbbells, strict reps." },
      ] },
      { name: "Push-up", prescription: "100 total (10 per round)", options: [{ exerciseId: "push-up", rx: true }] },
      { name: "Air squat", prescription: "150 total (15 per round)", options: [{ exerciseId: "air-squat", rx: true }] },
      { name: "Run", prescription: "½ mile", options: [
        { exerciseId: "run", rx: true },
        { exerciseId: "bike-ride", prescription: "4 min hard" },
      ] },
    ],
  },
  {
    id: "cindy",
    name: "Cindy",
    category: "girl",
    format: "amrap",
    timeCapMinutes: 20,
    estimatedMinutes: [20, 20],
    original: "AMRAP in 20 minutes: 5 pull-ups, 10 push-ups, 15 air squats.",
    structure: "As many rounds as possible in 20 minutes.",
    movements: [
      { name: "Pull-up", prescription: "5", options: [
        { exerciseId: "pull-up", rx: true },
        { exerciseId: "trx-row" },
        { exerciseId: "db-bent-over-row", prescription: "8", note: "Moderately heavy dumbbells." },
      ] },
      { name: "Push-up", prescription: "10", options: [{ exerciseId: "push-up", rx: true }] },
      { name: "Air squat", prescription: "15", options: [{ exerciseId: "air-squat", rx: true }] },
    ],
  },
  {
    id: "chelsea",
    name: "Chelsea",
    category: "girl",
    format: "emom",
    timeCapMinutes: 30,
    estimatedMinutes: [30, 30],
    original: "Every minute on the minute for 30 minutes: 5 pull-ups, 10 push-ups, 15 air squats.",
    structure: "Start a round every minute. If you can't finish a round within the minute, you're done — note the round.",
    movements: [
      { name: "Pull-up", prescription: "5", options: [
        { exerciseId: "pull-up", rx: true },
        { exerciseId: "trx-row" },
        { exerciseId: "db-bent-over-row", prescription: "6", note: "Moderate dumbbells." },
      ] },
      { name: "Push-up", prescription: "10", options: [{ exerciseId: "push-up", rx: true }] },
      { name: "Air squat", prescription: "15", options: [{ exerciseId: "air-squat", rx: true }] },
    ],
  },
  {
    id: "fran",
    name: "Fran",
    category: "girl",
    format: "for-time",
    timeCapMinutes: 12,
    estimatedMinutes: [5, 12],
    original: "21-15-9 reps for time: thrusters (95 lb barbell), pull-ups.",
    structure: "21 of each, then 15 of each, then 9 of each.",
    movements: [
      { name: "Thruster", prescription: "21-15-9", options: [
        { exerciseId: "db-thruster", note: "2 × 35 lb dumbbells." },
      ] },
      { name: "Pull-up", prescription: "21-15-9", options: [
        { exerciseId: "pull-up", rx: true },
        { exerciseId: "trx-row" },
        { exerciseId: "db-bent-over-row", note: "2 × 35 lb, same dumbbells as the thrusters." },
      ] },
    ],
  },
  {
    id: "grace",
    name: "Grace",
    category: "girl",
    format: "for-time",
    timeCapMinutes: 10,
    estimatedMinutes: [5, 10],
    original: "30 clean and jerks for time (135 lb barbell).",
    structure: "30 reps for time. Singles are fine.",
    movements: [
      { name: "Clean and jerk", prescription: "30", options: [
        { exerciseId: "db-clean-and-jerk", note: "Single 50 lb dumbbell, switch arms as you like." },
      ] },
    ],
  },
  {
    id: "helen",
    name: "Helen",
    category: "girl",
    format: "rounds",
    timeCapMinutes: 18,
    estimatedMinutes: [11, 16],
    original: "3 rounds for time: 400 m run, 21 kettlebell swings (53 lb), 12 pull-ups.",
    structure: "3 rounds for time.",
    movements: [
      { name: "Run", prescription: "400 m", options: [
        { exerciseId: "run", rx: true },
        { exerciseId: "bike-ride", prescription: "2 min hard" },
      ] },
      { name: "Kettlebell swing", prescription: "21", options: [
        { exerciseId: "kb-swing", rx: true, note: "40 lb (Rx is 53 lb; 40 is the heaviest setting)." },
      ] },
      { name: "Pull-up", prescription: "12", options: [
        { exerciseId: "pull-up", rx: true },
        { exerciseId: "trx-row" },
        { exerciseId: "db-bent-over-row", note: "2 × 40 lb." },
      ] },
    ],
  },
  {
    id: "dt",
    name: "DT",
    category: "hero",
    format: "rounds",
    timeCapMinutes: 20,
    estimatedMinutes: [10, 18],
    original: "5 rounds for time: 12 deadlifts, 9 hang power cleans, 6 push jerks (155 lb barbell).",
    structure: "5 rounds for time. Same dumbbells for everything; don't set them down mid-round if you can help it.",
    movements: [
      { name: "Deadlift", prescription: "12", options: [
        { exerciseId: "db-deadlift", note: "2 × 50 lb." },
      ] },
      { name: "Hang power clean", prescription: "9", options: [
        { exerciseId: "db-hang-clean", note: "2 × 50 lb." },
      ] },
      { name: "Push jerk", prescription: "6", options: [
        { exerciseId: "db-push-press", note: "2 × 50 lb." },
      ] },
    ],
  },
  {
    id: "jt",
    name: "J.T.",
    category: "hero",
    format: "for-time",
    timeCapMinutes: 18,
    estimatedMinutes: [10, 16],
    original: "21-15-9 reps for time: handstand push-ups, ring dips, push-ups.",
    structure: "21 of each, then 15 of each, then 9 of each.",
    movements: [
      { name: "Handstand push-up", prescription: "21-15-9", options: [
        { exerciseId: "pike-push-up", note: "Feet on the bench to make it harder." },
      ] },
      { name: "Ring dip", prescription: "21-15-9", options: [
        { exerciseId: "bench-dip" },
      ] },
      { name: "Push-up", prescription: "21-15-9", options: [{ exerciseId: "push-up", rx: true }] },
    ],
  },
  {
    id: "angie",
    name: "Angie",
    category: "girl",
    format: "for-time",
    timeCapMinutes: 35,
    estimatedMinutes: [20, 35],
    original: "For time: 100 pull-ups, 100 push-ups, 100 sit-ups, 100 air squats.",
    structure: "Finish all reps of each movement before moving on.",
    movements: [
      { name: "Pull-up", prescription: "100", options: [
        { exerciseId: "pull-up", rx: true },
        { exerciseId: "trx-row" },
        { exerciseId: "db-bent-over-row", note: "Moderate dumbbells." },
      ] },
      { name: "Push-up", prescription: "100", options: [{ exerciseId: "push-up", rx: true }] },
      { name: "Sit-up", prescription: "100", options: [{ exerciseId: "sit-up", rx: true }] },
      { name: "Air squat", prescription: "100", options: [{ exerciseId: "air-squat", rx: true }] },
    ],
  },
  {
    id: "kettlebell-20",
    name: "Kettlebell 20",
    category: "custom",
    format: "emom",
    timeCapMinutes: 20,
    estimatedMinutes: [20, 20],
    original: "Home-gym EMOM (not a CrossFit benchmark).",
    structure: "Every minute for 20 minutes, rotating through the four movements (5 rounds).",
    movements: [
      { name: "Kettlebell swing", prescription: "15", options: [{ exerciseId: "kb-swing", rx: true, note: "40 lb." }] },
      { name: "Goblet squat", prescription: "10", options: [{ exerciseId: "kb-goblet-squat", rx: true, note: "40 lb." }] },
      { name: "Single-arm press", prescription: "5 each arm", options: [{ exerciseId: "kb-single-arm-press", rx: true, note: "25–32.5 lb." }] },
      { name: "Burpee", prescription: "10", options: [{ exerciseId: "burpee", rx: true }] },
    ],
  },
  {
    id: "bike-and-burpees",
    name: "Bike & Burpees",
    category: "custom",
    format: "rounds",
    timeCapMinutes: 24,
    estimatedMinutes: [16, 22],
    original: "Home-gym conditioning (not a CrossFit benchmark).",
    structure: "5 rounds for time.",
    movements: [
      { name: "Bike", prescription: "2 min hard", options: [{ exerciseId: "bike-ride", rx: true }] },
      { name: "Burpee", prescription: "12", options: [{ exerciseId: "burpee", rx: true }] },
      { name: "Dumbbell snatch", prescription: "10 (alternating)", options: [{ exerciseId: "db-snatch", rx: true, note: "35–40 lb." }] },
    ],
  },
];
