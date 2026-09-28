import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/storage.js";

// Minimal in-memory stand-in for window.localStorage.
function memoryBackend() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    data,
  };
}

test("saves and loads JSON values", () => {
  const backend = memoryBackend();
  const store = createStore(() => backend);
  store.save("settings", { minutes: 30, style: "circuit" });
  assert.deepEqual(store.load("settings", null), { minutes: 30, style: "circuit" });
});

test("returns the fallback when nothing is saved", () => {
  const backend = memoryBackend();
  const store = createStore(() => backend);
  assert.equal(store.load("settings", "fallback"), "fallback");
});

test("namespaces keys so other apps on the same site don't collide", () => {
  const backend = memoryBackend();
  const store = createStore(() => backend);
  store.save("settings", 1);
  assert.deepEqual([...backend.data.keys()], ["workout-gen:settings"]);
});

test("remove deletes a saved value", () => {
  const backend = memoryBackend();
  const store = createStore(() => backend);
  store.save("current", { a: 1 });
  store.remove("current");
  assert.equal(store.load("current", null), null);
});

test("returns the fallback for corrupt JSON", () => {
  const backend = memoryBackend();
  backend.setItem("workout-gen:settings", "{not json");
  const store = createStore(() => backend);
  assert.equal(store.load("settings", "fallback"), "fallback");
});

test("keeps working when storage is unavailable", () => {
  // Some private-browsing modes throw just from touching localStorage.
  const store = createStore(() => { throw new Error("SecurityError"); });
  assert.doesNotThrow(() => store.save("settings", { a: 1 }));
  assert.equal(store.load("settings", "fallback"), "fallback");
  assert.doesNotThrow(() => store.remove("settings"));
});

test("keeps working when storage is full", () => {
  const backend = { ...memoryBackend(), setItem: () => { throw new Error("QuotaExceededError"); } };
  const store = createStore(() => backend);
  assert.doesNotThrow(() => store.save("settings", { a: 1 }));
});
