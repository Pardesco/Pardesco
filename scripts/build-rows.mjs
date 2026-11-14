// Builds one SVG card per project into assets/rows/ (studio.pardesco.com palette) and rewrites the
// Shipped / Open source blocks of README.md between the "rows" markers. Each card is its own image so
// it can carry its own link. Star counts are read live. Run: GITHUB_TOKEN=... node scripts/build-rows.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const token = process.env.GITHUB_TOKEN;
async function stars(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { "user-agent": "profile-rows", ...(token ? { authorization: `bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`stars ${repo}: ${res.status}`);
  return (await res.json()).stargazers_count;
}

const shipped = [
  { id: "hypernovum", name: "HYPERNOVUM", href: "https://github.com/Pardesco/hypernovum", text: "Turns your notes into a 3D city you can walk, then puts a fleet of AI coding agents to work inside it — and lets you watch them", tag: `${await stars("Pardesco/hypernovum")}★ · desktop` },
  { id: "reshoot", name: "Reshoot", href: "https://superhivemarket.com/products/reshoot", text: "Relight and re-render a 3D scene with AI without leaving the app", tag: "$39 · 3D tool" },
  { id: "polytope-engine", name: "4D Polytope Engine", href: "https://pardesco.com/products/4d-polytope-engine", text: "Brings a class of geometry into 3D software that nothing else on the market handles", tag: "$29 · 3D tool" },
  { id: "vessellab", name: "VesselLab", href: "https://superhivemarket.com/products/vessellab", text: "Design vases, lampshades and planters by dragging sliders; exports print-ready files", tag: "$29 · 3D tool" },
  { id: "ornament-studio", name: "Ornament Studio", href: "https://laserburnai.com/tools/ornament-studio", text: "Generates intricate geometric patterns as cut-ready vector files", tag: "$29 · browser" },
  { id: "laserburn-tools", name: "LaserBurnAI tools", href: "https://laserburnai.com/tools", text: "Free and client-side — nothing uploaded, nothing tracked: layered slicer, sheet nesting, image→3D, box generator", tag: "free · browser" },
];
const second = "Get a second and third opinion on your code from a different AI model family, then have the first one triage the findings";
const open = [
  { id: "algorithmic-art-skill", name: "algorithmic-art-skill", href: "https://github.com/Pardesco/algorithmic-art-skill", text: "An AI agent skill for generative art — reproducible from a seed, self-critiques its own output, exports to print, video and machine formats" },
  { id: "codex-review", name: "codex-review", href: "https://github.com/Pardesco/claude-codex-review-skill", text: second },
  { id: "agy-bug-search", name: "agy-bug-search", href: "https://github.com/Pardesco/claude-agy-bug-search-skill", text: second },
  { id: "4d-polytope-viewer", name: "4d-polytope-viewer", href: "https://github.com/Pardesco/4d-polytope-viewer", text: "Browser-based interactive geometry viewer. 1,700+ shapes, WebGL, no install" },
  { id: "envelope-extrusion-explorer", name: "envelope-extrusion-explorer", href: "https://github.com/Pardesco/envelope-extrusion-explorer", text: "Independent replication of a published result, including the identity its examples actually relied on" },
];

const C = { black: "#000000", line: "#29252f", ink: "#f0edf5", body: "#bcb6c6", muted: "#aaa5b6", mint: "#9de3c2", lavender: "#d5c2ff" };
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";
const W = 880, NAME_X = 24, TEXT_X = 262, CUT = 9, LINE_H = 18;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function wrap(text, max) {
  const lines = [];
  let cur = "";
  for (const word of text.split(" ")) {
    if (cur && (cur + " " + word).length > max) { lines.push(cur); cur = word; } else cur = cur ? cur + " " + word : word;
  }
  lines.push(cur);
  return lines;
}

function card(row, kind) {
  // Mono at 11.5px is about 6.95px per character; the tag column takes the right 150px when present.
  const lines = wrap(row.text, row.tag ? 60 : 80);
  const H = Math.max(56, 38 + lines.length * LINE_H);
  const y0 = H / 2 - ((lines.length - 1) * LINE_H) / 2 + 4;
  const text = lines.map((l, i) => `<text x="${TEXT_X}" y="${y0 + i * LINE_H}" class="d">${esc(l)}</text>`).join("");
  const tag = row.tag ? `<text x="${W - 46}" y="${H / 2 + 4}" class="t" text-anchor="end">${esc(row.tag)}</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
<title id="t">${esc(row.name)}: ${esc(row.text)}${row.tag ? ` (${esc(row.tag)})` : ""}</title>
<style>
text{font-family:${MONO}}
.n{font-size:${kind === "open" ? 13 : 14}px;fill:${C.ink}}
.d{font-size:11.5px;fill:${C.body}}
.t{font-size:11px;fill:${C.mint};letter-spacing:.03em}
.a{font-size:15px;fill:${C.lavender}}
</style>
<path d="M.5 .5H${W - CUT}L${W - .5} ${CUT}V${H - .5}H.5Z" fill="${C.black}" stroke="${C.line}"/>
<path d="M1 14V1H14" fill="none" stroke="${C.mint}" stroke-width="2"/>
<text x="${NAME_X}" y="${H / 2 + 5}" class="n">${esc(row.name)}</text>
${text}
${tag}
<text x="${W - 22}" y="${H / 2 + 5}" class="a" text-anchor="end">↗</text>
</svg>
`;
}

mkdirSync(new URL("../assets/rows/", import.meta.url), { recursive: true });
const block = (rows, kind) => {
  const imgs = rows.map((r) => {
    writeFileSync(new URL(`../assets/rows/${r.id}.svg`, import.meta.url), card(r, kind));
    const alt = esc(`${r.name}: ${r.text}${r.tag ? ` (${r.tag})` : ""}`);
    return `  <a href="${r.href}"><img src="assets/rows/${r.id}.svg" width="100%" alt="${alt}" /></a>`;
  });
  return `<p align="center">\n${imgs.join("\n")}\n</p>`;
};
const body = `<!-- rows:start (generated by scripts/build-rows.mjs) -->\n### Shipped\n\n${block(shipped, "shipped")}\n\n### Open source\n\n${block(open, "open")}\n<!-- rows:end -->`;

const readmeUrl = new URL("../README.md", import.meta.url);
const readme = readFileSync(readmeUrl, "utf8");
const marked = /<!-- rows:start[\s\S]*?<!-- rows:end -->/;
const first = /### Shipped[\s\S]*?(?=### Stack)/; // first run: replaces the original markdown tables
if (!marked.test(readme) && !first.test(readme)) throw new Error("README: no place to put the rows");
const next = marked.test(readme) ? readme.replace(marked, () => body) : readme.replace(first, () => body + "\n\n");
if (next !== readme) writeFileSync(readmeUrl, next);
console.log(`rows: ${shipped.length} shipped, ${open.length} open source; ${shipped[0].tag}`);
