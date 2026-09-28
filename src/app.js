// UI wiring: renders the build, workout and timer screens and handles taps.
// Workout logic lives in generator.js and timing in timer.js; this file only calls them.

import { generateWorkout, swapExercise } from "./generator.js";
import { MUSCLES } from "./config.js";
import { createStore } from "./storage.js";
import {
  cardLabel, circuitLetter, circuitSummary, formatClock, formatMinutes, formatRest, prescriptionLine,
  workoutTitle, wodFormatLabel,
} from "./format.js";
import {
  advanceTimer, buildTimeline, isRest, nextStep, pauseTimer, previousStep, resumeTimer, startTimer, timerView,
} from "./timer.js";
import { cues, keepScreenOn, unlockAudio } from "./cues.js";

const TIME_CHOICES = [20, 30, 45, 60];
const MIN_MINUTES = 5;
const MAX_MINUTES = 120;

const STYLE_CHOICES = [
  { id: "strength", name: "Strength", desc: "Heavy compound lifts, 4–5 sets of 3–6" },
  { id: "hypertrophy", name: "Hypertrophy", desc: "Muscle building, 3–4 sets of 8–12" },
  { id: "circuit", name: "Circuit", desc: "Back to back, 40 s on / 20 s off" },
  { id: "mobility", name: "Mobility", desc: "Stretches and drills" },
  { id: "wod", name: "WOD", desc: "A named CrossFit-style workout, like Murph" },
];

const FOCUS_CHOICES = [
  { id: "full-body", name: "Full body" },
  { id: "upper", name: "Upper" },
  { id: "lower", name: "Lower" },
  { id: "push", name: "Push" },
  { id: "pull", name: "Pull" },
  { id: "custom", name: "Pick muscles" },
];

const DEFAULT_SETTINGS = { minutes: 30, customTime: false, style: "hypertrophy", focus: "full-body", muscles: [] };

const store = createStore();
const root = document.getElementById("app");

// ── State ──────────────────────────────────────────────────────────

const saved = store.load("current", null);
const state = {
  settings: { ...DEFAULT_SETTINGS, ...store.load("settings", {}) },
  workout: saved?.workout ?? null,
  done: new Set(saved?.done ?? []),
  timer: saved?.timer ?? null,
  // Reopen straight into a running timer (e.g., after the browser reloads mid-set).
  showTimer: Boolean(saved?.timer && !saved.timer.finishedAt),
  sound: store.load("sound", true),
  status: "",
  // Which action is waiting for a confirming second tap ("regenerate", "new", "end").
  confirming: null,
};

function saveCurrent() {
  if (state.workout) store.save("current", { workout: state.workout, done: [...state.done], timer: state.timer });
  else store.remove("current");
}

function update(changes) {
  Object.assign(state, changes);
  render();
}

function updateSettings(changes) {
  state.settings = { ...state.settings, ...changes };
  store.save("settings", state.settings);
  render();
}

// ── Actions ────────────────────────────────────────────────────────

function canBuild({ minutes, focus, muscles, style }) {
  const minutesOk = Number.isFinite(minutes) && minutes >= MIN_MINUTES && minutes <= MAX_MINUTES;
  const focusOk = style === "wod" || focus !== "custom" || muscles.length > 0;
  return minutesOk && focusOk;
}

function resetWorkout(workout) {
  state.workout = workout;
  state.done = new Set();
  state.timer = null;
  state.showTimer = false;
  state.status = "";
  state.confirming = null;
  clearTimeout(confirmTimer);
  saveCurrent();
  syncTicking();
  render();
  window.scrollTo(0, 0);
}

function build() {
  const { minutes, style, focus, muscles } = state.settings;
  // WODs ignore focus; send full body so the warm-up covers everything.
  const inputs = style === "wod"
    ? { minutes, style, focus: "full-body" }
    : { minutes, style, focus, muscles };
  resetWorkout(generateWorkout(inputs));
}

// A stray tap shouldn't wipe out a workout in progress: the first tap arms
// the button ("Tap again") and a second tap within 4 seconds confirms.
let confirmTimer;
function confirmed(key) {
  if (state.confirming === key) return true;
  clearTimeout(confirmTimer);
  update({ confirming: key });
  confirmTimer = setTimeout(() => update({ confirming: null }), 4000);
  return false;
}

const hasProgress = () => state.done.size > 0 || state.timer != null;

function regenerate() {
  if (hasProgress() && !confirmed("regenerate")) return;
  const { minutes, style, focus, muscles } = state.workout.inputs;
  resetWorkout(generateWorkout({ minutes, style, focus, muscles }));
}

function newWorkout() {
  if (hasProgress() && !confirmed("new")) return;
  resetWorkout(null);
}

function toggleDone(index) {
  if (state.done.has(index)) state.done.delete(index);
  else state.done.add(index);
  saveCurrent();
  render();
}

let statusTimer;
function showStatus(message) {
  clearTimeout(statusTimer);
  update({ status: message });
  statusTimer = setTimeout(() => update({ status: "" }), 3500);
}

function swap(index) {
  const before = state.workout;
  const after = swapExercise(before, index);
  // The generator reports "no replacement" by appending a message. Show it
  // briefly instead of keeping it on the workout.
  const newMessages = after.messages.slice(before.messages.length);
  state.workout = { ...after, messages: before.messages };
  if (newMessages.length > 0) {
    showStatus(newMessages.at(-1));
  } else {
    state.done.delete(index);
    showStatus(`Swapped in ${after.main[index].exercise.name}.`);
  }
  saveCurrent();
}

// ── Timer ──────────────────────────────────────────────────────────

const timeline = () => buildTimeline(state.workout);

function startWorkout() {
  unlockAudio(); // must happen inside a tap for sound to work
  state.timer = startTimer(Date.now());
  state.showTimer = true;
  state.confirming = null;
  if (state.sound) cues.go();
  saveCurrent();
  syncTicking();
  render();
  window.scrollTo(0, 0);
}

function openTimer() {
  unlockAudio();
  update({ showTimer: true });
  syncTicking();
  window.scrollTo(0, 0);
}

function closeTimer() {
  update({ showTimer: false });
  syncTicking();
}

// Checks off cards for steps that just ended, and plays the cue for what's starting.
function afterSteps(steps, ended, timer) {
  for (const i of ended) steps[i].completes.forEach((index) => state.done.add(index));
  state.timer = timer;
  if (ended.length > 0 && state.sound) {
    const next = steps[timer.stepIndex];
    if (!next) cues.done();
    else if (isRest(next)) cues.rest();
    else cues.go();
  }
  saveCurrent();
  syncTicking();
  render();
}

function timerNext() {
  const steps = timeline();
  const { timer, ended } = nextStep(steps, state.timer, Date.now());
  afterSteps(steps, ended, timer);
}

function timerBack() {
  state.timer = previousStep(timeline(), state.timer, Date.now());
  saveCurrent();
  syncTicking();
  render();
}

function togglePause() {
  const now = Date.now();
  state.timer = state.timer.pausedAt != null ? resumeTimer(state.timer, now) : pauseTimer(state.timer, now);
  saveCurrent();
  render();
}

function endWorkout() {
  if (!confirmed("end")) return;
  state.timer = null;
  state.showTimer = false;
  state.confirming = null;
  saveCurrent();
  syncTicking();
  render();
}

function closeFinished() {
  state.timer = null;
  state.showTimer = false;
  saveCurrent();
  render();
}

function addRound(change) {
  state.timer = { ...state.timer, rounds: Math.max(0, (state.timer.rounds ?? 0) + change) };
  saveCurrent();
  render();
}

function toggleSound() {
  state.sound = !state.sound;
  store.save("sound", state.sound);
  if (state.sound) unlockAudio();
  render();
}

// A 4-per-second tick drives auto-advance and cues. Between step changes it
// only updates the numbers on screen; a full re-render could swap out a
// button under your thumb mid-tap.
let tickHandle = null;
let lastCue = null;

function syncTicking() {
  const running = Boolean(state.workout && state.timer && !state.timer.finishedAt);
  if (running && !tickHandle) tickHandle = setInterval(tick, 250);
  if (!running && tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
  keepScreenOn(running && state.showTimer);
}

function tick() {
  if (!state.workout || !state.timer) return syncTicking();
  const steps = timeline();
  const now = Date.now();
  const { timer, ended } = advanceTimer(steps, state.timer, now);
  if (ended.length > 0) {
    afterSteps(steps, ended, timer);
    return;
  }
  const view = timerView(steps, state.timer, now);
  playCountdownCues(view);
  updateLiveNumbers(view);
}

function playCountdownCues(view) {
  const s = view.step;
  if (!state.sound || !s || view.paused || s.durationSeconds == null) return;
  const remaining = s.durationSeconds - view.elapsedSeconds;
  let key = null;
  let play = null;
  if (s.durationSeconds >= 10 && remaining >= 1 && remaining <= 3) {
    key = `${view.index}:${remaining}`;
    play = cues.countdown;
  } else if (s.halfwayCue && view.elapsedSeconds === Math.floor(s.durationSeconds / 2)) {
    key = `${view.index}:half`;
    play = cues.halfway;
  }
  if (key && key !== lastCue) {
    lastCue = key;
    play();
  }
}

function clockText(view) {
  const s = view.step;
  if (s.countUp || view.remainingSeconds == null) return formatClock(view.elapsedSeconds);
  return formatClock(view.remainingSeconds);
}

function updateLiveNumbers(view) {
  const set = (bind, text) => {
    const el = root.querySelector(`[data-bind="${bind}"]`);
    if (el && el.textContent !== text) el.textContent = text;
  };
  set("session", formatClock(view.sessionSeconds));
  if (!view.step) return;
  set("clock", clockText(view));
  set("resume", `Resume ${clockText(view)}`);
  const bar = root.querySelector('[data-bind="bar"]');
  if (bar && view.step.durationSeconds) {
    bar.style.width = `${Math.min(100, (view.elapsedSeconds / view.step.durationSeconds) * 100)}%`;
  }
}

document.addEventListener("visibilitychange", () => {
  // Timers don't run while the screen is locked; catch up when it's back.
  if (document.visibilityState === "visible" && state.timer) {
    tick();
    syncTicking();
  }
});

// ── Rendering helpers ──────────────────────────────────────────────

// Tiny element builder: h("button", { class: "x", onclick }, "Label").
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else if (key === "class") el.className = value;
    else if (key === "html") el.innerHTML = value; // only used for static SVG
    else el.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

const SWAP_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/></svg>`;

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Re-rendering replaces the DOM, so remember which control had focus
// (by its data-key) and restore it afterwards for keyboard users.
function render() {
  const focusedKey = document.activeElement?.dataset?.key;
  const timerOpen = Boolean(state.workout && state.timer && state.showTimer);
  const screen = timerOpen ? renderTimer(state.workout)
    : state.workout ? renderWorkout(state.workout)
      : renderBuild(state.settings);
  if (!timerOpen) delete document.body.dataset.mode;
  document.body.dataset.style = state.workout ? state.workout.inputs.style : state.settings.style;
  root.replaceChildren(...screen.flat(Infinity).filter(Boolean));
  if (focusedKey) root.querySelector(`[data-key="${focusedKey}"]`)?.focus();
  document.title = state.workout ? `${workoutTitle(state.workout)} · Home Gym` : "Home Gym";
}

// ── Build screen ───────────────────────────────────────────────────

function renderBuild(settings) {
  const { minutes, customTime, style, focus, muscles } = settings;

  const timeButtons = TIME_CHOICES.map((m) =>
    h("button", {
      type: "button", class: "time", "data-key": `time-${m}`,
      "aria-pressed": String(!customTime && minutes === m),
      "aria-label": `${m} minutes`,
      onclick: () => updateSettings({ minutes: m, customTime: false }),
    }, m, h("small", {}, "min")));

  const otherButton = h("button", {
    type: "button", class: "time", "data-key": "time-other",
    "aria-pressed": String(customTime),
    onclick: () => updateSettings({ customTime: true }),
  }, "…", h("small", {}, "other"));

  const customInput = customTime && h("label", { class: "custom-time" },
    h("input", {
      type: "number", inputmode: "numeric", min: MIN_MINUTES, max: MAX_MINUTES, step: 5,
      value: minutes, "data-key": "time-input", "aria-label": "Minutes",
      // Save without re-rendering on each keystroke so typing isn't interrupted.
      oninput: (e) => {
        state.settings = { ...state.settings, minutes: Number(e.target.value) };
        store.save("settings", state.settings);
        const button = root.querySelector('[data-key="build"]');
        button.disabled = !canBuild(state.settings);
      },
    }),
    `minutes (${MIN_MINUTES}–${MAX_MINUTES})`);

  const styleButtons = STYLE_CHOICES.map((s) =>
    h("button", {
      type: "button", class: "style-option", "data-style": s.id, "data-key": `style-${s.id}`,
      "aria-pressed": String(style === s.id),
      onclick: () => updateSettings({ style: s.id }),
    },
    h("span", { class: "plate", "aria-hidden": "true" }),
    h("span", { class: "style-name" }, s.name),
    h("span", { class: "style-desc" }, s.desc)));

  const focusButtons = FOCUS_CHOICES.map((f) =>
    h("button", {
      type: "button", class: "chip", "data-key": `focus-${f.id}`,
      "aria-pressed": String(focus === f.id),
      onclick: () => updateSettings({ focus: f.id }),
    }, f.name));

  const muscleButtons = MUSCLES.map((m) =>
    h("button", {
      type: "button", class: "chip", "data-key": `muscle-${m}`,
      "aria-pressed": String(muscles.includes(m)),
      onclick: () => updateSettings({
        muscles: muscles.includes(m) ? muscles.filter((x) => x !== m) : [...muscles, m],
      }),
    }, capitalize(m)));

  const focusField = style !== "wod" && h("fieldset", { class: "field" },
    h("legend", {}, "Focus"),
    h("div", { class: "chips" }, focusButtons),
    focus === "custom" && h("div", { class: "muscles" },
      h("div", { class: "chips", role: "group", "aria-label": "Muscles" }, muscleButtons),
      muscles.length === 0 && h("p", { class: "hint" }, "Pick at least one muscle.")));

  return [
    h("p", { class: "app-title" }, "Home Gym"),
    h("fieldset", { class: "field" },
      h("legend", {}, "How long?"),
      h("div", { class: "times" }, timeButtons, otherButton),
      customInput),
    h("fieldset", { class: "field" },
      h("legend", {}, "What kind?"),
      h("div", { class: "styles" }, styleButtons)),
    focusField,
    h("div", { class: "actions" },
      h("div", { class: "actions-inner" },
        h("button", {
          type: "button", class: "btn btn-primary", "data-key": "build",
          disabled: !canBuild(settings), onclick: build,
        }, "Build workout"))),
  ];
}

// ── Workout screen ─────────────────────────────────────────────────

function renderWorkout(workout) {
  const total = workout.main.length;
  const doneCount = state.done.size;

  const band = h("header", { class: "band" },
    h("h1", {}, workoutTitle(workout)),
    h("div", { class: "band-stats" },
      h("span", { class: "band-time" }, formatMinutes(workout.estimatedTotalMinutes)),
      total > 0 && h("span", { class: "band-progress", "aria-live": "polite" },
        doneCount === total ? "All done" : `${doneCount} of ${total} done`)),
    workout.blocks && h("p", { class: "band-detail" }, circuitSummary(workout)),
    workout.wod && h("p", { class: "band-detail" }, wodFormatLabel(workout.wod)),
    workout.wod && h("p", { class: "band-detail" }, workout.wod.structure),
    workout.wod && h("details", { class: "original" },
      h("summary", {}, "Original workout"),
      h("p", {}, workout.wod.original),
      workout.wod.notes && h("p", {}, workout.wod.notes)));

  const messages = workout.messages.map((m) => h("p", { class: "notice" }, m));

  const warmup = workout.warmup.length > 0 && [
    h("h2", { class: "section-title" }, "Warm-up"),
    h("ul", { class: "warmup" }, workout.warmup.map((item) =>
      h("li", {},
        h("span", {}, item.exercise.name),
        h("span", { class: "amount" }, item.prescription)))),
  ];

  const main = total > 0
    ? renderSections(workout)
    : h("p", { class: "empty" }, "Nothing to do yet. Try a different focus or more time.");

  const timerRunning = state.timer && !state.timer.finishedAt;
  const confirmButton = (key, label, onclick) => h("button", {
    type: "button",
    class: `btn btn-secondary btn-small${state.confirming === key ? " confirming" : ""}`,
    "data-key": key,
    onclick,
  }, state.confirming === key ? "Tap again" : label);

  return [
    band,
    messages,
    warmup,
    main,
    h("p", { class: "status", role: "status", "aria-live": "polite" }, state.status),
    h("div", { class: "actions" },
      h("div", { class: "actions-inner" },
        confirmButton("new", "New", newWorkout),
        confirmButton("regenerate", "Regenerate", regenerate),
        total > 0 && h("button", {
          type: "button", class: "btn btn-primary btn-start", "data-key": "start",
          onclick: timerRunning ? openTimer : startWorkout,
        }, timerRunning ? h("span", { "data-bind": "resume" }, "Resume") : "Start workout"))),
  ];
}

// Split circuits get a section each; everything else is one list.
function renderSections(workout) {
  const cards = workout.main.map((item, i) => renderCard(item, i, workout));
  if (!workout.blocks || workout.blocks.length < 2) {
    return [
      h("h2", { class: "section-title" }, workout.wod ? "Movements" : "Workout"),
      h("ol", { class: "exercises" }, cards),
    ];
  }
  return workout.blocks.map((block, b) => [
    h("h2", { class: "section-title" },
      `Circuit ${circuitLetter(b)}`,
      h("span", { class: "section-note" }, block.rounds === 1 ? "1 round" : `${block.rounds} rounds`)),
    h("ol", { class: "exercises" }, cards.filter((_, i) => workout.main[i].block === b)),
  ]);
}

// The card being worked on, or during a rest, the one coming up.
function currentExerciseIndex() {
  if (!state.timer || state.timer.finishedAt) return null;
  const steps = timeline();
  const view = timerView(steps, state.timer, Date.now());
  return steps.slice(view.index).find((s) => s.exerciseIndex != null)?.exerciseIndex ?? null;
}

function renderCard(item, index, workout) {
  const isDone = state.done.has(index);
  const isCurrent = currentExerciseIndex() === index;
  const { exercise } = item;
  const showRest = !workout.wod && !workout.blocks;

  return h("li", { class: `card${isDone ? " is-done" : ""}${isCurrent ? " is-current" : ""}` },
    h("button", {
      type: "button", class: "card-main", "data-key": `card-${index}`,
      "aria-pressed": String(isDone),
      onclick: () => toggleDone(index),
    },
    h("span", { class: "num", "aria-hidden": "true" }, isDone ? "✓" : cardLabel(item, index, workout)),
    h("span", { class: "card-text" },
      h("span", { class: "card-name" }, exercise.name),
      h("span", { class: "card-rx" }, prescriptionLine(item, workout)),
      showRest && h("span", { class: "card-meta" }, `Rest ${formatRest(item.restSeconds)}`),
      item.replaces && h("span", { class: "card-meta" }, `Instead of ${item.replaces.toLowerCase()}`),
      (item.note ?? exercise.notes) && h("span", { class: "card-note" }, item.note ?? exercise.notes),
      h("span", { class: "visually-hidden" }, isDone ? "Done. Tap to undo." : "Tap when done."))),
    h("button", {
      type: "button", class: "swap", "data-key": `swap-${index}`,
      "aria-label": `Swap ${exercise.name}`,
      onclick: () => swap(index),
      html: SWAP_ICON,
    }, "Swap"));
}

// ── Timer screen ───────────────────────────────────────────────────

function renderTimer(workout) {
  const steps = timeline();
  const view = timerView(steps, state.timer, Date.now());
  if (view.finished) return renderFinished(workout, view);

  const s = view.step;
  // The whole screen changes color: plate color while working, dark while
  // resting, neutral for the warm-up — readable from across the room.
  document.body.dataset.mode = isRest(s) ? "rest" : s.kind === "warmup" ? "warmup" : "work";

  const isSet = s.kind === "set";
  const isWod = ["amrap", "emom", "for-time"].includes(s.kind);
  const showWodList = isWod && !(s.kind === "emom" && workout.wod.rotate);
  const paused = view.paused;

  const topBar = h("header", { class: "timer-top" },
    h("button", { type: "button", class: "timer-link", "data-key": "timer-list", onclick: closeTimer }, "Workout"),
    h("p", { class: "timer-session" },
      h("span", { "data-bind": "session" }, formatClock(view.sessionSeconds)),
      h("span", { class: "timer-session-of" }, ` of ~${formatMinutes(workout.estimatedTotalMinutes)}`)),
    h("button", {
      type: "button", class: "timer-link", "data-key": "sound", "aria-pressed": String(state.sound), onclick: toggleSound,
    }, state.sound ? "Beeps on" : "Beeps off"));

  // Sets wait for a tap, so their clock is just a small "time on this set".
  const clock = isSet
    ? h("p", { class: "timer-clock is-small", "aria-hidden": "true" },
      h("span", { "data-bind": "clock" }, clockText(view)), " on this set")
    : h("p", { class: "timer-clock", "data-bind": "clock", "aria-hidden": "true" }, clockText(view));

  const body = h("div", { class: "timer-main" },
    h("p", { class: "timer-label" }, paused ? "Paused" : s.label),
    isSet ? null : clock,
    h("h1", { class: "timer-title" }, s.title),
    s.detail && h("p", { class: "timer-detail" }, s.detail),
    isSet && clock,
    showWodList && h("ul", { class: "timer-wod" }, workout.main.map((item) =>
      h("li", {}, h("strong", {}, item.prescription), " ", item.exercise.name))),
    s.kind === "amrap" && h("div", { class: "rounds" },
      h("button", { type: "button", class: "round-btn", "data-key": "round-minus", "aria-label": "Remove a round", onclick: () => addRound(-1) }, "−1"),
      h("p", { class: "rounds-count", "aria-live": "polite" }, `${state.timer.rounds ?? 0} rounds`),
      h("button", { type: "button", class: "round-btn", "data-key": "round-plus", onclick: () => addRound(1) }, "+1 round")),
    s.durationSeconds != null && h("div", { class: "timer-bar", "aria-hidden": "true" },
      h("span", { "data-bind": "bar", style: `width:${Math.min(100, (view.elapsedSeconds / s.durationSeconds) * 100)}%` })),
    s.upNext && h("p", { class: "timer-next" }, `Next: ${s.upNext}`));

  const primaryLabel = isSet ? "Done set" : s.kind === "for-time" ? "Finish" : null;

  const controls = h("div", { class: "timer-controls" },
    primaryLabel && h("button", { type: "button", class: "btn btn-go", "data-key": "timer-primary", onclick: timerNext }, primaryLabel),
    h("div", { class: "timer-row" },
      h("button", { type: "button", class: "btn btn-ghost", "data-key": "timer-back", onclick: timerBack }, "Back"),
      h("button", { type: "button", class: "btn btn-ghost", "data-key": "timer-pause", onclick: togglePause }, paused ? "Resume" : "Pause"),
      h("button", { type: "button", class: "btn btn-ghost", "data-key": "timer-skip", onclick: timerNext }, "Skip")),
    h("button", {
      type: "button", class: `timer-end${state.confirming === "end" ? " confirming" : ""}`, "data-key": "timer-end", onclick: endWorkout,
    }, state.confirming === "end" ? "Tap again to end" : "End workout"));

  return [h("section", { class: "timer", "aria-label": "Workout timer" }, topBar, body, controls)];
}

function renderFinished(workout, view) {
  document.body.dataset.mode = "work";
  const rounds = workout.wod?.format === "amrap" ? `${state.timer.rounds ?? 0} rounds of ${workout.wod.name}. ` : "";
  return [h("section", { class: "timer timer-finished", "aria-label": "Workout complete" },
    h("div", { class: "timer-main" },
      h("p", { class: "timer-label" }, workoutTitle(workout)),
      h("h1", { class: "timer-title" }, "Workout complete"),
      h("p", { class: "timer-clock" }, formatClock(view.sessionSeconds)),
      h("p", { class: "timer-detail" }, `${rounds}Total time, not counting pauses.`)),
    h("div", { class: "timer-controls" },
      h("button", { type: "button", class: "btn btn-go", "data-key": "finished-close", onclick: closeFinished }, "Back to workout"),
      h("button", { type: "button", class: "btn btn-ghost", "data-key": "finished-new", onclick: () => resetWorkout(null) }, "New workout")))];
}

render();
syncTicking();

// Offline support. Skipped on localhost so edits show up on reload while
// developing; add ?sw to the URL to test offline behavior locally.
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
if ("serviceWorker" in navigator && (!isLocal || new URLSearchParams(location.search).has("sw"))) {
  navigator.serviceWorker.register("sw.js").catch(() => {
    // The app works fine without it; it just won't be available offline.
  });
}
