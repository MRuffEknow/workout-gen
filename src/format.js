// Display text helpers. Kept out of app.js so they can be unit tested.

export function formatRest(seconds) {
  if (seconds < 60) return `${seconds} s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec ? `${min} min ${sec} s` : `${min} min`;
}

export const formatMinutes = (minutes) => `${Math.round(minutes)} min`;

// Circuits show rounds once in the header, so each card only needs the interval.
export function prescriptionLine(item, workout) {
  if (workout.wod) return item.prescription;
  if (workout.blocks) return item.reps;
  return `${item.sets} sets × ${item.reps}`;
}

const COUNT_WORDS = ["Zero", "One", "Two", "Three"];

export function circuitSummary({ blocks, roundRestSeconds }) {
  const rest = `Rest ${formatRest(roundRestSeconds)} between rounds.`;
  if (blocks.length === 1 && blocks[0].rounds === 1) return `1 round of ${blocks[0].size}.`;
  if (blocks.length === 1) return `${blocks[0].rounds} rounds of ${blocks[0].size}. ${rest}`;
  return `${COUNT_WORDS[blocks.length]} circuits of ${blocks[0].size}, ${blocks[0].rounds} rounds each. `
    + `Finish all rounds of A before B. ${rest}`;
}

export const circuitLetter = (block) => String.fromCharCode(65 + block);

// Plain numbers, except in split circuits, where gym-style A1, A2, B1… show
// which circuit an exercise belongs to.
export function cardLabel(item, index, workout) {
  if (!workout.blocks || workout.blocks.length < 2) return String(index + 1);
  const position = workout.main.slice(0, index).filter((other) => other.block === item.block).length + 1;
  return `${circuitLetter(item.block)}${position}`;
}

const FOCUS_NAMES = {
  "full-body": "Full body",
  upper: "Upper body",
  lower: "Lower body",
  push: "Push",
  pull: "Pull",
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function listOf(words) {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}

export function workoutTitle(workout) {
  if (workout.wod) return workout.wod.name;
  const { style, focus, muscles } = workout.inputs;
  const focusName = focus === "custom" ? capitalize(listOf(muscles)) : FOCUS_NAMES[focus];
  return `${focusName} ${style}`;
}

export function wodFormatLabel({ format, timeCapMinutes }) {
  switch (format) {
    case "amrap": return `As many rounds as possible in ${timeCapMinutes} min`;
    case "emom": return `Every minute on the minute for ${timeCapMinutes} min`;
    case "rounds": return `Rounds for time, ${timeCapMinutes} min cap`;
    default: return `For time, ${timeCapMinutes} min cap`;
  }
}
