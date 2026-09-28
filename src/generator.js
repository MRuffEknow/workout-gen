// Pure workout-generation logic: inputs + library in, workout object out.
// No DOM or storage access, so everything here runs under `node --test`.

import { EXERCISES } from "./data/exercises.js";
import { WODS } from "./data/wods.js";
import {
  AVAILABLE_EQUIPMENT, FOCUS_PRESETS, LONG_SESSION_MINUTES, MUSCLES,
  OPENING_TIER_ORDER, PATTERN_GROUPS, REPEAT_TIER_ORDER, STYLE_PRESETS, WARMUP_MINUTES,
} from "./config.js";

// Go over the requested time by at most this much.
const OVERRUN = 1.1;
// Below this share of the requested time, explain why the workout is short.
const UNDERFILL_WARNING = 0.75;

// ── Randomness ─────────────────────────────────────────────────────

// mulberry32: tiny seeded PRNG, so a seed always reproduces the same workout.
export function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, items) => items[Math.floor(rng() * items.length)];

function shuffle(rng, items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Shared helpers ─────────────────────────────────────────────────

function resolveOptions(options = {}, workout = {}) {
  return {
    library: options.library ?? EXERCISES,
    wods: options.wods ?? WODS,
    // Swaps reuse the equipment the workout was generated with.
    equipment: options.equipment ?? workout.equipment ?? AVAILABLE_EQUIPMENT,
    seed: options.seed ?? Math.floor(Math.random() * 2 ** 32),
    wodId: options.wodId,
  };
}

const isAvailable = (exercise, equipment) =>
  exercise.equipment.every((eq) => eq === "bodyweight" || equipment.includes(eq));

const hitsMuscles = (exercise, muscles) =>
  exercise.primaryMuscles.some((m) => muscles.includes(m));

function targetMuscles({ focus, muscles }) {
  return focus === "custom" ? (muscles ?? []) : FOCUS_PRESETS[focus];
}

const minutesFromSeconds = (seconds) => Math.round((seconds / 60) * 10) / 10;

// Longer sessions use the top of the set range instead of piling on exercises.
function setsFor(preset, minutes) {
  const [short, long] = preset.sets;
  return minutes >= LONG_SESSION_MINUTES ? long : short;
}

function prescribe(exercise, preset, sets) {
  let reps = exercise.measure === "time" ? preset.holdReps : preset.reps;
  if (exercise.unilateral) reps += preset.roundRestSeconds ? " (switch sides halfway)" : " each side";
  // Unilateral work in lifting styles takes twice as long: one set per side.
  const work = exercise.unilateral && !preset.roundRestSeconds ? preset.workSeconds * 2 : preset.workSeconds;
  return {
    exercise,
    sets,
    reps,
    restSeconds: preset.restSeconds,
    estimatedSeconds: sets * (work + preset.restSeconds),
  };
}

function totalSeconds(workout) {
  const sum = (items) => items.reduce((acc, item) => acc + item.estimatedSeconds, 0);
  return sum(workout.warmup) + sum(workout.main) + sum(workout.cooldown) + circuitRestSeconds(workout);
}

// ── Warm-up ────────────────────────────────────────────────────────

// ~5 minutes: an easy cardio piece to raise heart rate, then dynamic drills
// for the muscles about to be trained.
function buildWarmup(muscles, library, equipment, rng) {
  const drills = library.filter((e) => e.warmup && isAvailable(e, equipment));
  const cardio = drills.filter((e) => e.pattern === "conditioning");
  const mobility = drills.filter((e) => e.pattern === "mobility");

  const targeted = shuffle(rng, mobility.filter((e) => hitsMuscles(e, muscles)));
  const others = shuffle(rng, mobility.filter((e) => !hitsMuscles(e, muscles)));
  const total = WARMUP_MINUTES * 60;

  if (cardio.length > 0) {
    // Prefer the bike: it's lower impact than jumping jacks for a first move.
    const first = cardio.find((e) => e.id === "bike-easy") ?? pick(rng, cardio);
    const chosen = [...targeted, ...others].slice(0, 2);
    const cardioSeconds = total - chosen.length * 90;
    return [
      { exercise: first, prescription: `${cardioSeconds / 60} min`, estimatedSeconds: cardioSeconds },
      ...chosen.map((exercise) => ({ exercise, prescription: "90 s", estimatedSeconds: 90 })),
    ];
  }

  const chosen = [...targeted, ...others].slice(0, 3);
  if (chosen.length === 0) return [];
  const each = total / chosen.length;
  return chosen.map((exercise) => ({ exercise, prescription: `${Math.round(each)} s`, estimatedSeconds: each }));
}

// ── Main selection ─────────────────────────────────────────────────

// Yields tiers in the order the generator should fill them:
// the opening sequence once, then the repeat order forever.
function* tierOrder() {
  yield* OPENING_TIER_ORDER;
  while (true) yield* REPEAT_TIER_ORDER;
}

// Picks one exercise from a pattern group, favoring the group's least-used
// pattern so a second push is vertical if the first was horizontal (rule 4).
function pickFromGroup(group, remaining, chosen, rng) {
  const options = remaining.filter((e) => group.patterns.includes(e.pattern));
  if (options.length === 0) return null;
  const uses = (pattern) => chosen.filter((e) => e.pattern === pattern).length;
  const openPatterns = [...new Set(options.map((e) => e.pattern))];
  const fewest = Math.min(...openPatterns.map(uses));
  const leastUsed = options.filter((e) => uses(e.pattern) === fewest);
  return pick(rng, leastUsed);
}

// Walks the tiers, visiting each pattern group once per tier pass, until time
// runs out, the style's exercise cap is hit, or the candidates are exhausted.
function selectExercises(candidates, { budget, cap, costOf, rng }) {
  const chosen = [];
  let remaining = [...candidates];
  let used = 0;
  const costNow = costOf;
  // Time used only grows, so an exercise that doesn't fit now never will.
  // Dropping it lets a shorter option in the same group take the slot (e.g., a
  // goblet squat when a split squat, timed per side, would run over).
  const dropOverruns = () => {
    remaining = remaining.filter((e) => used + costNow(e) <= budget * OVERRUN);
  };

  dropOverruns();
  for (const tier of tierOrder()) {
    if (remaining.length === 0 || chosen.length >= cap || used >= budget) break;
    const groups = shuffle(rng, PATTERN_GROUPS.filter((g) => g.tier === tier));
    for (const group of groups) {
      if (chosen.length >= cap || used >= budget) break;
      const exercise = pickFromGroup(group, remaining, chosen, rng);
      if (!exercise) continue;
      used += costNow(exercise);
      chosen.push(exercise);
      remaining = remaining.filter((e) => e !== exercise);
      dropOverruns();
    }
    // Stop if no pattern group has candidates left, instead of looping forever.
    if (!PATTERN_GROUPS.some((g) => remaining.some((e) => g.patterns.includes(e.pattern)))) break;
  }
  return chosen;
}

// Compounds first, then isolation (rule 3). Stable, so selection order holds otherwise.
const compoundsFirst = (items) =>
  [...items].sort((a, b) => (a.exercise.type === "compound" ? 0 : 1) - (b.exercise.type === "compound" ? 0 : 1));

function candidatesFor(style, muscles, library, equipment) {
  const preset = STYLE_PRESETS[style];
  return library.filter((e) =>
    isAvailable(e, equipment)
    && e.styles.includes(style)
    && hitsMuscles(e, muscles)
    && (!preset.compoundsOnly || e.type === "compound"));
}

function describeFocus({ focus, muscles }) {
  return focus === "custom" ? muscles.join(", ") : focus;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Builds a workout.
 * @param {{minutes: number, style: string, focus: string, muscles?: string[]}} inputs
 * @param {{seed?: number, library?: object[], wods?: object[], equipment?: string[], wodId?: string}} [options]
 */
export function generateWorkout(inputs, options = {}) {
  const opts = resolveOptions(options);
  const rng = createRng(opts.seed);
  const muscles = targetMuscles(inputs);
  const base = {
    createdAt: new Date().toISOString(),
    seed: opts.seed,
    equipment: opts.equipment,
    inputs: { minutes: inputs.minutes, style: inputs.style, focus: inputs.focus, muscles },
    warmup: [],
    main: [],
    cooldown: [],
    messages: [],
  };

  if (inputs.style === "wod") return buildWod(base, opts, rng);
  if (inputs.style === "circuit") return buildCircuit(base, opts, rng);

  const preset = STYLE_PRESETS[inputs.style];
  const sets = setsFor(preset, inputs.minutes);
  const warmup = preset.skipWarmup ? [] : buildWarmup(muscles, opts.library, opts.equipment, rng);
  const warmupSeconds = warmup.reduce((acc, item) => acc + item.estimatedSeconds, 0);

  const candidates = candidatesFor(inputs.style, muscles, opts.library, opts.equipment);
  const chosen = selectExercises(candidates, {
    // The warm-up counts against the requested time.
    budget: inputs.minutes * 60 - warmupSeconds,
    cap: preset.maxExercises,
    costOf: (exercise) => prescribe(exercise, preset, sets).estimatedSeconds,
    rng,
  });

  const workout = {
    ...base,
    warmup,
    main: compoundsFirst(chosen.map((exercise) => prescribe(exercise, preset, sets))),
  };

  const total = totalSeconds(workout);
  workout.estimatedTotalMinutes = minutesFromSeconds(total);
  workout.messages = shortfallMessages(workout, candidates, total);
  return workout;
}

// Rule 8: explain a short or empty workout rather than failing silently.
function shortfallMessages(workout, candidates, total) {
  const { minutes, style } = workout.inputs;
  const focus = describeFocus(workout.inputs);
  if (candidates.length === 0) {
    return [`No ${style} exercises match "${focus}" with your equipment.`];
  }
  if (workout.main.length === 0) {
    return [`${minutes} minutes isn't enough time for a single ${style} exercise after the warm-up.`];
  }
  if (workout.main.length === candidates.length && total < minutes * 60 * UNDERFILL_WARNING) {
    return [
      `Only ${candidates.length} ${style} exercise${candidates.length === 1 ? "" : "s"} match "${focus}" `
      + `with your equipment, so this workout runs about ${Math.round(total / 60)} of ${minutes} minutes.`,
    ];
  }
  return [];
}

/**
 * Replaces one main exercise (rule 7). Returns a new workout; never mutates.
 * For WODs, cycles that movement to its next available option.
 */
export function swapExercise(workout, index, options = {}) {
  const opts = resolveOptions(options, workout);
  const rng = createRng(opts.seed);
  if (workout.wod) return swapWodMovement(workout, index, opts);

  const current = workout.main[index];
  const { style } = workout.inputs;
  const preset = STYLE_PRESETS[style];
  const usedIds = new Set(workout.main.map((item) => item.exercise.id));
  const pool = opts.library.filter((e) =>
    !usedIds.has(e.id)
    && isAvailable(e, opts.equipment)
    && e.styles.includes(style)
    && (!preset.compoundsOnly || e.type === "compound"));

  const samePattern = pool.filter((e) => e.pattern === current.exercise.pattern);
  const sameMuscle = pool.filter((e) => hitsMuscles(e, current.exercise.primaryMuscles));
  const replacement = samePattern.length > 0 ? pick(rng, samePattern)
    : sameMuscle.length > 0 ? pick(rng, sameMuscle)
      : null;

  if (!replacement) {
    return { ...workout, messages: [...workout.messages, `No replacement found for ${current.exercise.name}.`] };
  }
  const replacementItem = prescribe(replacement, preset, current.sets);
  if (current.block !== undefined) replacementItem.block = current.block;
  const main = workout.main.map((item, i) => (i === index ? replacementItem : item));
  const swapped = { ...workout, main };
  swapped.estimatedTotalMinutes = minutesFromSeconds(totalSeconds(swapped));
  return swapped;
}

// ── Circuits ───────────────────────────────────────────────────────

// Time for one circuit: every exercise once per round, plus rest between rounds.
function circuitSeconds(preset, size, rounds) {
  const station = preset.workSeconds + preset.restSeconds;
  return rounds * size * station + (rounds - 1) * preset.roundRestSeconds;
}

// Rest between rounds and between circuits isn't tied to any one exercise.
function circuitRestSeconds(workout) {
  if (!workout.blocks) return 0;
  const betweenRounds = workout.blocks.reduce((acc, b) => acc + (b.rounds - 1) * workout.roundRestSeconds, 0);
  return betweenRounds + (workout.blocks.length - 1) * workout.circuitChangeSeconds;
}

// Most rounds of `size` exercises that fit (up to `maxRounds`), across `count` circuits.
function roundsThatFit(preset, size, budget, count = 1, maxRounds = Infinity) {
  let rounds = 0;
  const cost = (r) => count * circuitSeconds(preset, size, r) + (count - 1) * preset.circuitChangeSeconds;
  while (rounds < maxRounds && cost(rounds + 1) <= budget * OVERRUN) rounds++;
  return rounds;
}

// Decides the shape of the session:
// 1. If one circuit of 5 would need more than maxSingleCircuitRounds, split
//    into two circuits of 3 rather than making one long, monotonous circuit.
// 2. Otherwise one circuit, dropping an exercise (down to 3) before dropping
//    below minRounds.
// 3. Very short sessions: 3 exercises for however many rounds fit (at least 1).
function planCircuit(preset, budget, available) {
  const most = Math.min(preset.maxPerCircuit, available);
  const fewest = Math.min(3, most);
  const splitSize = preset.splitCircuitSize;

  const canSplit = most === preset.maxPerCircuit && available >= splitSize * 2;
  if (canSplit && roundsThatFit(preset, most, budget) > preset.maxSingleCircuitRounds) {
    const rounds = roundsThatFit(preset, splitSize, budget, 2, preset.maxSplitRounds);
    return [{ size: splitSize, rounds }, { size: splitSize, rounds }];
  }
  for (let size = most; size >= fewest; size--) {
    const rounds = roundsThatFit(preset, size, budget);
    if (rounds >= preset.minRounds) return [{ size, rounds }];
  }
  return [{ size: fewest, rounds: Math.max(roundsThatFit(preset, fewest, budget), 1) }];
}

const LOWER = ["squat", "lunge", "hinge", "isolation-lower"];
const UPPER = ["push-horizontal", "push-vertical", "pull-horizontal", "pull-vertical", "isolation-upper"];
const region = (e) => (LOWER.includes(e.pattern) ? 0 : UPPER.includes(e.pattern) ? 1 : 2);

// Deals exercises into two circuits so each gets a mix: sort by body region
// (and pattern within it), then alternate. A knee lift and a hinge end up in
// different circuits, as do a push and a pull.
function splitIntoCircuits(exercises) {
  const ordered = [...exercises].sort((a, b) =>
    region(a) - region(b) || a.pattern.localeCompare(b.pattern));
  return [ordered.filter((_, i) => i % 2 === 0), ordered.filter((_, i) => i % 2 === 1)];
}

function buildCircuit(base, opts, rng) {
  const preset = STYLE_PRESETS.circuit;
  const { minutes, muscles } = base.inputs;
  const warmup = buildWarmup(muscles, opts.library, opts.equipment, rng);
  const budget = minutes * 60 - warmup.reduce((acc, item) => acc + item.estimatedSeconds, 0);
  const candidates = candidatesFor("circuit", muscles, opts.library, opts.equipment);

  const plan = planCircuit(preset, budget, candidates.length);
  const total = plan.reduce((acc, b) => acc + b.size, 0);
  const chosen = selectExercises(candidates, { budget: Infinity, cap: total, costOf: () => 0, rng });
  const groups = plan.length === 2 ? splitIntoCircuits(chosen) : [chosen];

  const blocks = plan.map((b, i) => ({ rounds: b.rounds, size: groups[i].length }));
  const main = groups.flatMap((group, block) =>
    compoundsFirst(group.map((exercise) => prescribe(exercise, preset, plan[block].rounds)))
      .map((item) => ({ ...item, block })));

  const workout = {
    ...base,
    warmup,
    main,
    blocks,
    roundRestSeconds: preset.roundRestSeconds,
    circuitChangeSeconds: preset.circuitChangeSeconds,
  };
  const seconds = totalSeconds(workout);
  workout.estimatedTotalMinutes = minutesFromSeconds(seconds);
  workout.messages = shortfallMessages(workout, candidates, seconds);
  return workout;
}

// ── WODs ───────────────────────────────────────────────────────────

const wodMidpoint = (wod) => (wod.estimatedMinutes[0] + wod.estimatedMinutes[1]) / 2;

const availableOptions = (movement, library, equipment) =>
  movement.options.filter((o) => {
    const exercise = library.find((e) => e.id === o.exerciseId);
    return exercise && isAvailable(exercise, equipment);
  });

function wodItem(movement, option, library) {
  const item = {
    movement: movement.name,
    exercise: library.find((e) => e.id === option.exerciseId),
    prescription: option.prescription ?? movement.prescription,
    estimatedSeconds: 0, // WOD time is tracked for the whole workout, not per movement
  };
  if (!option.rx) item.replaces = movement.name;
  if (option.note) item.note = option.note;
  return item;
}

// Picks a WOD whose typical duration fits the time left after the warm-up,
// preferring ones that use at least half of it so a 60-minute slot doesn't get Fran.
function chooseWod(doable, minutesAvailable, rng) {
  const fits = doable.filter((w) => wodMidpoint(w) <= minutesAvailable);
  const substantial = fits.filter((w) => wodMidpoint(w) >= minutesAvailable / 2);
  if (substantial.length > 0) return { wod: pick(rng, substantial) };
  if (fits.length > 0) return { wod: pick(rng, fits) };
  const shortest = [...doable].sort((a, b) => wodMidpoint(a) - wodMidpoint(b))[0];
  return {
    wod: shortest,
    message: `No WOD fits in ${minutesAvailable} minutes after the warm-up; ${shortest.name} is the shortest.`,
  };
}

function buildWod(base, opts, rng) {
  const doable = opts.wods.filter((w) =>
    w.movements.every((m) => availableOptions(m, opts.library, opts.equipment).length > 0));
  const warmup = buildWarmup(MUSCLES, opts.library, opts.equipment, rng);
  const minutesAvailable = base.inputs.minutes - WARMUP_MINUTES;

  const { wod, message } = opts.wodId
    ? { wod: doable.find((w) => w.id === opts.wodId) }
    : chooseWod(doable, minutesAvailable, rng);
  if (!wod) {
    return { ...base, warmup, estimatedTotalMinutes: WARMUP_MINUTES, messages: ["No WOD can be done with your equipment."] };
  }

  const main = wod.movements.map((m) => wodItem(m, availableOptions(m, opts.library, opts.equipment)[0], opts.library));
  const { id, name, category, format, timeCapMinutes, estimatedMinutes, original, structure, notes } = wod;
  return {
    ...base,
    wod: { id, name, category, format, timeCapMinutes, estimatedMinutes, original, structure, notes },
    warmup,
    main,
    estimatedTotalMinutes: WARMUP_MINUTES + wodMidpoint(wod),
    messages: message ? [message] : [],
  };
}

function swapWodMovement(workout, index, opts) {
  const wod = opts.wods.find((w) => w.id === workout.wod.id);
  const movement = wod.movements[index];
  const options = availableOptions(movement, opts.library, opts.equipment);
  if (options.length < 2) {
    return { ...workout, messages: [...workout.messages, `No other option for ${movement.name} with your equipment.`] };
  }
  const currentIndex = options.findIndex((o) => o.exerciseId === workout.main[index].exercise.id);
  const next = options[(currentIndex + 1) % options.length];
  const main = workout.main.map((item, i) => (i === index ? wodItem(movement, next, opts.library) : item));
  return { ...workout, main };
}
