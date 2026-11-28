// Generates the Guild Hall trust-graph samples described in design/guild-hall-svg.md.
// Mirrors the string format of gno.land/p/nt/svg/v0 (integer coordinates, attribute order)
// and the integer maths the realm will use, so render.gno can be checked against it.
// Run: node design/scripts-design/guild-hall-samples.mjs   (or: bun design/scripts-design/guild-hall-samples.mjs)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Integer square root (Newton), same contract as p/<ns>/hireling ISqrt.
export function isqrt(x) {
  if (x < 0) throw new Error("isqrt of negative");
  if (x < 2) return x;
  let r = x;
  let y = Math.floor((r + 1) / 2);
  while (y < r) {
    r = y;
    y = Math.floor((r + Math.floor(x / r)) / 2);
  }
  return r;
}

// (cos, sin) x 1000 for node k of n, starting at 12 o'clock, clockwise in screen space.
export const ANGLES = {};
for (let n = 1; n <= 12; n++) {
  ANGLES[n] = [];
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (2 * Math.PI * k) / n;
    ANGLES[n].push([Math.round(Math.cos(a) * 1000), Math.round(Math.sin(a) * 1000)]);
  }
}

const CX = 320, CY = 200, RX = 230, RY = 135, MAX_NODES = 12;

const attrs = (a = {}) => {
  const out = [];
  for (const k of ["id", "class", "style", "stroke", "stroke-width", "opacity", "transform", "visibility"]) {
    if (a[k] !== undefined && a[k] !== "") out.push(`${k}="${a[k]}"`);
  }
  return out.join(" ");
};
const rect = (x, y, w, h, rx, fill, a) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}" fill="${fill}" ${attrs(a)}/>`;
const circle = (cx, cy, r, fill, a) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${attrs(a)}/>`;
const path = (d, fill, a) => `<path d="${d}" fill="${fill}" ${attrs(a)}/>`;
const text = (x, y, t, fill, a) => `<text x="${x}" y="${y}" dx="0" dy="0" rotate="" fill="${fill}" ${attrs(a)}>${t}</text>`;

const radius = (stake, max) => 8 + Math.floor((14 * isqrt(Math.floor((stake * 10000) / max))) / 100);
const width = (stake, max) => 1 + Math.floor((5 * isqrt(Math.floor((stake * 10000) / max))) / 100);

// nodes: [{ addr, stake, kind: "owner" | "active" | "warmup" | "unbonding" }], owner first.
export function render({ score, nodes, hidden = 0, state = "ok", strikes = 0 }) {
  const shown = nodes.slice(0, hidden > 0 ? MAX_NODES - 1 : MAX_NODES);
  const n = shown.length + (hidden > 0 ? 1 : 0);
  const max = Math.max(...shown.map((s) => s.stake));
  const els = [];

  els.push(rect(0, 0, 640, 400, 24, "#03050F"));
  for (let i = 0; i < 32; i++) els.push(rect(20 * i, 0, 20, 400, 0, "#FFFFFF", { opacity: i % 2 ? "0.06" : "0.03" }));
  [[150, "0.06"], [115, "0.08"], [85, "0.10"], [60, "0.14"]].forEach(([r, o]) => els.push(circle(CX, CY, r, "#1660FF", { opacity: o })));

  const pos = shown.map((_, k) => {
    const [c, s] = ANGLES[n][k];
    return [CX + Math.round((RX * c) / 1000), CY + Math.round((RY * s) / 1000)];
  });

  const dim = state === "banned";
  shown.forEach((node, k) => {
    const [x, y] = pos[k];
    const a = { stroke: "#8FA2FF", "stroke-width": String(width(node.stake, max)), opacity: dim || node.kind === "unbonding" ? "0.25" : "0.7" };
    if (node.kind === "warmup") a.style = "stroke-dasharray:6 6";
    els.push(path(`M${CX} ${CY} L${x} ${y}`, "none", a));
  });

  shown.forEach((node, k) => {
    const [x, y] = pos[k];
    const r = radius(node.stake, max);
    if (node.kind === "owner") els.push(circle(x, y, r, "#FFFFFF"));
    else if (node.kind === "warmup") els.push(circle(x, y, r, "#03050F", { stroke: "#8FA2FF", "stroke-width": "2" }));
    else if (node.kind === "unbonding") els.push(circle(x, y, r, "#8FA2FF", { opacity: "0.4" }));
    else els.push(circle(x, y, r, "#8FA2FF"));
    els.push(text(x, y + r + 14, node.addr, "#C9D4F2", { class: "a" }));
  });

  if (hidden > 0) {
    const [c, s] = ANGLES[n][n - 1];
    const x = CX + Math.round((RX * c) / 1000), y = CY + Math.round((RY * s) / 1000);
    els.push(path(`M${CX} ${CY} L${x} ${y}`, "none", { stroke: "#8FA2FF", "stroke-width": "1", opacity: "0.4" }));
    els.push(circle(x, y, 16, "#1B2470", { stroke: "#8FA2FF", "stroke-width": "1" }));
    els.push(text(x, y + 4, `+${hidden}`, "#FFFFFF", { class: "a" }));
  }

  if (state === "ok") els.push(circle(CX, CY, 46, "#2233D9", { stroke: "#8FA2FF", "stroke-width": "2" }));
  else els.push(circle(CX, CY, 46, "#3A3F55", { stroke: state === "banned" ? "#FF7A7A" : "#9CA5D6", "stroke-width": state === "banned" ? "3" : "2" }));
  els.push(text(CX, CY + 9, String(state === "ok" ? score : 0), "#FFFFFF", { class: "s" }));
  els.push(text(CX, CY + 26, "trust score", "#C9D4F2", { class: "l" }));
  for (let i = 0; i < strikes; i++) els.push(circle(CX - 6 * (strikes - 1) + 12 * i, CY + 44, 4, "#FF7A7A"));
  if (shown.length === 1 && hidden === 0) els.push(text(CX, 330, "No backers yet", "#C9D4F2", { class: "l" }));

  const style =
    ".a{font:500 11px ui-monospace,SFMono-Regular,Menlo,monospace}" +
    ".l{font:500 10px system-ui,-apple-system,Segoe UI,sans-serif;letter-spacing:0}" +
    ".s{font:700 26px system-ui,-apple-system,Segoe UI,sans-serif}" +
    "text{text-anchor:middle}";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><style>${style}</style>${els.join("")}</svg>`;
}

const many = [
  { addr: "g1sint…a8x2", stake: 100, kind: "owner" },
  { addr: "g1bud1…7x2a", stake: 200, kind: "active" },
  { addr: "g1rina…k9q0", stake: 100, kind: "active" },
  { addr: "g1pc4w…uu1d", stake: 62, kind: "active" },
  { addr: "g1rr8e…k2a7", stake: 55, kind: "active" },
  { addr: "g1tt0n…9qe3", stake: 48, kind: "warmup" },
  { addr: "g1x9fa…a2m4", stake: 40, kind: "active" },
  { addr: "g1q8vv…3fz1", stake: 30, kind: "active" },
  { addr: "g1zz2k…v0k8", stake: 26, kind: "unbonding" },
  { addr: "g1m4yy…0dd5", stake: 22, kind: "active" },
  { addr: "g1aa7h…7hl2", stake: 18, kind: "active" },
];
const samples = {
  "guild-hall-sample.svg": render({ score: 397, nodes: many, hidden: 6 }),
  "guild-hall-sample-empty.svg": render({ score: 100, nodes: [many[0]] }),
  "guild-hall-sample-banned.svg": render({ score: 0, nodes: many.slice(0, 4), state: "banned", strikes: 3 }),
};
for (const [name, svg] of Object.entries(samples)) {
  writeFileSync(join(OUT, name), svg);
  console.log(`${name}  ${Buffer.byteLength(svg)} bytes`);
}
