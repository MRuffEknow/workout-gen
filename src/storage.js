// localStorage helpers. Every access is wrapped: storage can be missing,
// blocked (some private-browsing modes throw on access), full, or corrupt,
// and the app must keep working in all of those cases.

const PREFIX = "workout-gen:";

/**
 * @param {() => Storage} getBackend returns the storage object; may throw.
 */
export function createStore(getBackend = () => globalThis.localStorage) {
  const backend = () => {
    try {
      return getBackend() ?? null;
    } catch {
      return null;
    }
  };

  return {
    load(key, fallback) {
      try {
        const raw = backend()?.getItem(PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    save(key, value) {
      try {
        backend()?.setItem(PREFIX + key, JSON.stringify(value));
      } catch {
        // Nothing to do: the app just won't remember this value.
      }
    },
    remove(key) {
      try {
        backend()?.removeItem(PREFIX + key);
      } catch {
        // Same as above.
      }
    },
  };
}
