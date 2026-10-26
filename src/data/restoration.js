// Beginner Body Restoration (Conor Harris): the 8-week program as data.
//
// Only the structure is here (drill names, sets and amounts, video links)
// plus short cues in my own words. The guide itself is a paid product and
// this repo is public, so keep its text in the PDF, not in this file.
//
// Sets and amounts follow each phase's overview table. Where the overview
// and a drill's own page disagree on sides, the drill's page wins (noted
// inline).
//
// Drill fields:
//   id, name
//   sets          number of sets the timer runs
//   setsText      shown instead of `sets` when the guide gives a range ("2–3")
//   breaths       breath-paced drills: breaths per set (the timer runs ~10 s each)
//   reps          rep-based drills: text shown on the card; the timer waits for a tap
//   perSide       true = every set is done on the left, then the right
//   restSeconds   rest after each set
//   video         the guide's demo video
//   altVideo      { label, url } for a second video the guide offers
//   parts         for sequences: [{ name, video }] done in order within one set
//   purpose       one line on what the drill is for
//   checks        how you know you're doing it right
//   note          extra instruction (progressions, etc.)
//   optional      true = only if you have time (off by default)

const yt = (id) => `https://youtu.be/${id}`;

export const BREATH_SECONDS = 10; // about 5 s out, 5 s in

export const MATERIALS = ["Wall space", "A chair", "A foam roller", "A pillow (maybe two)"];

// Videos the guide asks you to watch before starting.
export const INTRO_VIDEOS = [
  { label: "How to use the program", url: yt("wq0HsRcLl28") },
  { label: "Why these drills work", url: yt("kd-Ram-Y6gc") },
  { label: "How to breathe", url: yt("bt6amVTDuxs") },
  { label: "Breathing with a balloon or straw", url: yt("7zycDnqkOcA") },
];

// The rules that apply to every session, in short.
export const SESSION_RULES = [
  "Easy effort: about 3 out of 10, never past 5. Trying harder is the most common mistake.",
  "Breathe out slowly through your mouth for about 5 s, then breathe in quietly for about 5 s. Feel your side abs, not your six-pack. Keep your neck relaxed.",
  "Do the drills in order, and finish every set of one before moving to the next.",
  "Aim for 3–4 sessions a week; 5 is even better. Splitting sets between morning and evening is fine.",
  "Stay in each phase for at least 14 days before moving on.",
];

export const PHASE_DAYS = 14;

export const PHASES = [
  {
    name: "Phase 1",
    weeks: "Weeks 1–2",
    playlist: "https://www.youtube.com/playlist?list=PLFq2zv7d_8BDgk987_f-zLZKe55iWJoQW",
    drills: [
      {
        id: "leg-foot-release",
        name: "Leg & Foot Release Sequence",
        sets: 1,
        reps: "15 slow rolls per technique, each leg",
        perSide: false,
        setSeconds: 480,
        restSeconds: 20,
        parts: [
          { name: "Inner leg roll", video: yt("_4RDS9xDS1E") },
          { name: "Outer leg roll", video: yt("SSIqhDVOKeI") },
          { name: "Inner foot roll", video: yt("tt0RQZSqHY0") },
          { name: "Outer foot roll", video: yt("4xBIa8_s408") },
          { name: "Front foot roll (optional)", video: yt("LbdTg3QvrfQ") },
        ],
        purpose: "Loosens tight tissue so the joints can rotate and move more freely.",
        checks: [
          "Your whole body stays as relaxed as you can manage",
          "You roll slowly, about an inch a second",
          "You stop where the video shows instead of rolling too far",
        ],
      },
      {
        id: "sidelying-half-rolling",
        name: "Sidelying 90/90 Half-Rolling",
        sets: 1,
        reps: "15 slow rolls",
        perSide: true,
        restSeconds: 20,
        video: yt("bVNYolybzlY"),
        purpose: "Gently opens space in the hips so the next drills work better.",
        checks: [
          "Your low back stays relaxed",
          "No pinching in your hip",
          "Your shoulders don't roll forward or back",
          "No tension anywhere in your legs",
        ],
      },
      {
        // The overview says "per side"; the drill's own page doesn't, and
        // the drill is done with both legs at once.
        id: "hip-lift",
        name: "90/90 Hip Lift with Ball Hold",
        sets: 2,
        breaths: 8,
        perSide: false,
        restSeconds: 20,
        video: yt("fBViIToMhKA"),
        purpose: "Teaches your hamstrings and abs to control pelvic tilt and takes pressure off the low back.",
        checks: [
          "You feel only your hamstrings (and a little inner thigh if you squeeze the ball)",
          "You don't feel your glutes",
          "Your low back stays relaxed",
        ],
      },
      {
        id: "quadruped-block-squeeze",
        name: "Quadruped Block Squeeze",
        sets: 2,
        breaths: 8,
        perSide: false,
        restSeconds: 20,
        video: yt("B5R0uVzCiBA"),
        purpose: "Opens the back of the pelvis and the spine and makes room for hip rotation.",
        checks: [
          "Your low back and neck stay relaxed",
          "A steady, mild stretch in your glutes",
          "Only your inner thighs work when you squeeze lightly",
        ],
      },
    ],
  },
  {
    name: "Phase 2",
    weeks: "Weeks 3–4",
    playlist: "https://www.youtube.com/playlist?list=PLFq2zv7d_8BCoZQ6CoSumuvI-SGoJlhHP",
    drills: [
      {
        id: "pronation-drill",
        name: "Introductory Pronation Drill",
        sets: 2,
        reps: "15–20 slow reps",
        perSide: true,
        restSeconds: 20,
        video: yt("u8ICj_n4VNc"),
        purpose: "Helps your foot settle into the ground and work with your new hip motion.",
        checks: [
          "Your arch lowers a little as your knee goes forward",
          "Heel, big-toe base and little-toe base stay on the ground",
          "Your foot stays relaxed",
          "No tension in the front knee (if there is, stay more upright and feel more heel)",
        ],
      },
      {
        // The overview says "2 x 8 breaths"; the drill's page says 5 breaths
        // per side. Done on both sides since the side test is skipped.
        id: "adductor-pullback",
        name: "Sidelying Adductor Pullback",
        sets: 2,
        breaths: 5,
        perSide: true,
        restSeconds: 20,
        video: yt("HRtWaxtyn-I"),
        purpose: "Improves inward hip rotation and opens the back of the pelvis.",
        checks: [
          "You feel only your top inner thigh (maybe a little outer glute)",
          "You don't feel the side of your top hip working",
          "Your low back and neck stay relaxed",
        ],
      },
      {
        id: "sidelying-glute-max",
        name: "Sidelying Glute Max",
        sets: 2,
        breaths: 8,
        perSide: true,
        restSeconds: 20,
        video: yt("w4DkkdHwc5U"),
        purpose: "Builds outward hip rotation and links your foot arch with your glute.",
        checks: [
          "You feel your top glute and bottom-side abs (maybe some bottom inner thigh)",
          "Your top foot's arch presses firmly into the wall",
          "Your neck and low back stay relaxed",
        ],
      },
      {
        id: "wall-supported-stack",
        name: "Wall Supported Stack",
        sets: 2,
        breaths: 8,
        perSide: false,
        restSeconds: 20,
        video: yt("RwQOYrYl_No"),
        purpose: "Shifts your weight back and retrains your head, ribs and pelvis to stack.",
        checks: [
          "The back of your pelvis rests gently on the wall, not forced",
          "Your mid and upper back expand as you breathe in",
          "Your neck is switched off",
        ],
      },
    ],
  },
  {
    name: "Phase 3",
    weeks: "Weeks 5–6",
    playlist: "https://www.youtube.com/playlist?list=PLFq2zv7d_8BDt-FcKDBmcKoI9hUfFr-mK",
    drills: [
      {
        id: "calf-raise-progression",
        name: "Calf Raise Progression",
        sets: 3,
        reps: "6–12 slow reps",
        perSide: true,
        restSeconds: 30,
        video: yt("8Z0I4RJRaeY"),
        purpose: "Strengthens the muscles that lift your arch and improves push-off.",
        note: "Start with progression 1. Move up once 2 sets of 15 perfect reps feel easy.",
        checks: [
          "Big-toe base and little-toe base stay down through the whole movement",
          "You feel your calves, with no pain in your foot or knee",
        ],
      },
      {
        id: "hinged-split-squat",
        name: "Front Foot Elevated Hinged Split Squat",
        sets: 3,
        setsText: "2–3",
        reps: "8–10 slow reps",
        perSide: true,
        restSeconds: 45,
        video: yt("kyeuRVoAbuo"),
        purpose: "Strengthens glutes and hamstrings and teaches you to shift into your hips without your low back taking over.",
        note: "Stop each set knowing you could do one more perfect rep.",
        checks: [
          "Heel, big-toe base and little-toe base stay down throughout",
          "A stretch in the back (maybe the side) of your hip, none in the front",
          "Your glutes clearly work as you stand up",
        ],
      },
      {
        id: "intro-abduct-shift",
        name: "Introductory Sidelying Abduct & Shift",
        sets: 3,
        breaths: 8,
        breathsText: "5–8",
        perSide: true,
        restSeconds: 20,
        video: yt("fyNs7lBsIGs"),
        purpose: "Starts teaching you to shift out of one side of your body and into the other.",
        checks: [
          "You feel your top glute and bottom-side abs (maybe some bottom inner thigh)",
          "Your neck and low back stay relaxed",
          "Your low ribs don't flare up",
        ],
      },
      {
        id: "short-kneeling-crossovers",
        name: "Short-Kneeling Alternating Crossovers",
        optional: true,
        sets: 2,
        breaths: 5,
        perSide: true,
        restSeconds: 20,
        video: yt("n_LPEA32rks"),
        altVideo: { label: "Alternative video", url: yt("x_h5eulT4YE") },
        purpose: "Improves trunk rotation and opens up the ribcage and shoulders.",
        checks: [
          "The back ribs on the back-reaching side open as you breathe in",
          "The front ribs on the front-reaching side open as you breathe in",
          "You feel the side abs on the side you're turning toward",
        ],
      },
    ],
  },
  {
    name: "Phase 4",
    weeks: "Weeks 7–8",
    playlist: "https://www.youtube.com/playlist?list=PLFq2zv7d_8BDDOz6UCu6CfIlCtkpPd2iR",
    drills: [
      {
        id: "banded-d2-flexion",
        name: "Supine Banded D2 Flexion",
        sets: 2,
        reps: "8 reps",
        perSide: true,
        restSeconds: 20,
        video: yt("mbQt8fjJrzQ"),
        altVideo: { label: "Cable version (needs a cable machine)", url: yt("HlLQ8TcJ5Jc") },
        purpose: "Trains the full arc of shoulder motion now that the body is better aligned.",
        checks: [
          "Your low back stays flat and relaxed the whole time",
          "You feel the muscles at the back of your lower shoulder blade working",
        ],
      },
      {
        id: "kickstand-hinge",
        name: "Kickstand Hinge",
        sets: 3,
        setsText: "2–3",
        reps: "8–10 slow reps",
        perSide: true,
        restSeconds: 45,
        video: yt("rvmBn23ej8I"),
        purpose: "Builds the ability to shift in and out of each hip with good glute control.",
        note: "Stop each set knowing you could do one more perfect rep.",
        checks: [
          "Heel, big-toe base and little-toe base stay down throughout",
          "A stretch in the back (maybe the side) of your hip, none in the front",
          "Your glutes clearly work as you stand up",
        ],
      },
      {
        id: "abduct-shift",
        name: "Sidelying Abduct & Shift",
        sets: 2,
        breaths: 8,
        breathsText: "5–8",
        perSide: true,
        restSeconds: 20,
        video: yt("8k7EST347Wg"),
        purpose: "The harder version of the phase 3 drill.",
        note: "Get the phase 3 version right before this one. Don't rush it.",
        checks: [
          "You feel your top glute and bottom-side abs (maybe some bottom inner thigh)",
          "Your neck and low back stay relaxed",
          "Your low ribs don't flare up",
        ],
      },
    ],
  },
];
