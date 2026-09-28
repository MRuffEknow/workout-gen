// UI wiring: renders the build and workout screens and handles taps.
// All workout logic lives in generator.js; this file only calls it.

import { generateWorkout, swapExercise } from "./generator.js";
import { MUSCLES } from "./config.js";
import { createStore } from "./storage.js";
import {
  cardLabel, circuitLetter, circuitSummary, formatMinutes, formatRest, prescriptionLine, workoutTitle, wodFormatLabel,
} from "./format.js";

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
  status: "",
  confirmingRegenerate: false,
};

function saveCurrent() {
  if (state.workout) store.save("current", { workout: state.workout, done: [...state.done] });
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

function build() {
  const { minutes, style, focus, muscles } = state.settings;
  // WODs ignore focus; send full body so the warm-up covers everything.
  const inputs = style === "wod"
    ? { minutes, style, focus: "full-body" }
    : { minutes, style, focus, muscles };
  state.workout = generateWorkout(inputs);
  state.done = new Set();
  state.status = "";
  state.confirmingRegenerate = false;
  saveCurrent();
  render();
  window.scrollTo(0, 0);
}

let confirmTimer;
function regenerate() {
  // A stray tap shouldn't wipe out a half-finished workout: ask for a second tap.
  if (state.done.size > 0 && !state.confirmingRegenerate) {
    update({ confirmingRegenerate: true });
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => update({ confirmingRegenerate: false }), 4000);
    return;
  }
  clearTimeout(confirmTimer);
  const { minutes, style, focus, muscles } = state.workout.inputs;
  state.workout = generateWorkout({ minutes, style, focus, muscles });
  state.done = new Set();
  state.status = "";
  state.confirmingRegenerate = false;
  saveCurrent();
  render();
  window.scrollTo(0, 0);
}

function newWorkout() {
  clearTimeout(confirmTimer);
  state.workout = null;
  state.done = new Set();
  state.status = "";
  state.confirmingRegenerate = false;
  saveCurrent();
  render();
  window.scrollTo(0, 0);
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
  const screen = state.workout ? renderWorkout(state.workout) : renderBuild(state.settings);
  root.dataset.style = state.workout ? state.workout.inputs.style : state.settings.style;
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

  const regenerateLabel = state.confirmingRegenerate ? "Tap again" : "Regenerate";

  return [
    band,
    messages,
    warmup,
    main,
    h("p", { class: "status", role: "status", "aria-live": "polite" }, state.status),
    h("div", { class: "actions" },
      h("div", { class: "actions-inner" },
        h("button", { type: "button", class: "btn btn-secondary", "data-key": "new", onclick: newWorkout }, "New workout"),
        h("button", {
          type: "button",
          class: `btn btn-secondary${state.confirmingRegenerate ? " confirming" : ""}`,
          "data-key": "regenerate",
          onclick: regenerate,
        }, regenerateLabel))),
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

function renderCard(item, index, workout) {
  const isDone = state.done.has(index);
  const { exercise } = item;
  const showRest = !workout.wod && !workout.blocks;

  return h("li", { class: `card${isDone ? " is-done" : ""}` },
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

render();

// Offline support. Skipped on localhost so edits show up on reload while
// developing; add ?sw to the URL to test offline behavior locally.
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
if ("serviceWorker" in navigator && (!isLocal || new URLSearchParams(location.search).has("sw"))) {
  navigator.serviceWorker.register("sw.js").catch(() => {
    // The app works fine without it; it just won't be available offline.
  });
}
