// Sound, vibration and screen wake lock for the timer. Browser-only, and
// every call is safe to make when the feature isn't supported: iPhones
// don't vibrate from the web, and some browsers lack the wake lock API.

let audio = null;

// Browsers only allow sound after a tap, so call this from the Start button.
export function unlockAudio() {
  try {
    const AudioContextClass = window.AudioContext ?? window["webkitAudioContext"]; // older Safari
    audio ??= new AudioContextClass();
    audio.resume();
  } catch {
    audio = null;
  }
}

function tone(frequency, ms, delayMs = 0, volume = 0.25) {
  if (!audio) return;
  const start = audio.currentTime + delayMs / 1000;
  const end = start + ms / 1000;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.value = frequency;
  // Short attack and release so beeps don't click.
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.setValueAtTime(volume, end - 0.02);
  gain.gain.linearRampToValueAtTime(0, end);
  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(end);
}

function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Not supported (e.g., iPhone): sound only.
  }
}

// Distinct cues so you can tell what's happening without looking.
export const cues = {
  countdown: () => tone(880, 90),                                    // 3, 2, 1
  go: () => { tone(1320, 400); vibrate([120, 60, 120]); },           // work starts
  rest: () => { tone(660, 400); vibrate(250); },                     // rest starts
  halfway: () => { tone(990, 110); tone(990, 110, 180); vibrate([80, 60, 80]); }, // switch sides
  done: () => { tone(880, 150); tone(1100, 150, 180); tone(1320, 400, 360); vibrate([150, 80, 150, 80, 300]); },
};

let wakeLock = null;

// Keeps the screen on while the timer runs. The browser drops the lock when
// the page is hidden, so this is called again when it becomes visible.
export async function keepScreenOn(on) {
  try {
    if (on && !wakeLock && "wakeLock" in navigator && document.visibilityState === "visible") {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    wakeLock = null;
  }
}
