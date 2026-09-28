// Guards offline use: the service worker's precache list must cover every
// file the app loads, or that file will be missing when there's no signal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

function precacheList() {
  const sw = readFileSync(join(ROOT, "sw.js"), "utf8");
  const match = sw.match(/const PRECACHE = \[([\s\S]*?)\];/);
  assert.ok(match, "sw.js must define const PRECACHE = [...]");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function filesUnder(dir, ext) {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const rel = `${dir}/${name}`;
    if (statSync(join(ROOT, rel)).isDirectory()) return filesUnder(rel, ext);
    return name.endsWith(ext) ? [rel] : [];
  });
}

test("every precached file exists", () => {
  for (const path of precacheList()) {
    const file = path === "./" ? "index.html" : path;
    assert.ok(existsSync(join(ROOT, file)), `sw.js precaches missing file ${path}`);
  }
});

test("every file the app loads is precached", () => {
  const list = precacheList();
  const needed = [
    "./", "index.html", "styles.css", "manifest.json",
    ...filesUnder("src", ".js"),
    ...filesUnder("fonts", ".woff2"),
    ...filesUnder("icons", ".png"),
  ];
  for (const path of needed) assert.ok(list.includes(path), `sw.js doesn't precache ${path}`);
});

test("the manifest uses relative paths (the site lives under /workout-gen/)", () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  for (const icon of manifest.icons) {
    assert.ok(!icon.src.startsWith("/"), `absolute icon path ${icon.src}`);
    assert.ok(existsSync(join(ROOT, icon.src)), `missing icon ${icon.src}`);
  }
});

test("index.html loads nothing from other sites", () => {
  // Anything off-site won't be available offline.
  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  assert.doesNotMatch(html, /(href|src)="https?:/);
});
