// Builds assets/stack.svg: the Stack + Tools panel in the studio.pardesco.com palette.
// Icon paths (24x24) live in scripts/icons.json. Run: node scripts/build-stack.mjs
import { readFileSync, writeFileSync } from "node:fs";

const icons = JSON.parse(readFileSync(new URL("./icons.json", import.meta.url)));
const C = { black: "#000000", panel: "#0b0911", line: "#29252f", chip: "#3a3147", ink: "#f0edf5", muted: "#aaa5b6", mint: "#9de3c2", violet: "#a78bfa", lavender: "#d5c2ff" };
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";

const stack = [
  ["typescript", "TypeScript"], ["python", "Python"], ["react", "React"], ["nextjs", "Next.js"], ["threejs", "Three.js"],
  ["electron", "Electron"], ["supabase", "Supabase"], ["cloudflare", "Cloudflare"], ["n8n", "n8n"], ["mcp", "MCP"], ["blender", "Blender"],
];
const tools = [["claude", "Claude", "Claude Code"], ["openai", "GPT", "Codex CLI"], ["antigravity", "AGY", "Antigravity"]];

const W = 880, PAD = 24, GAP = 8, TILE_H = 78, CUT = 7;
const tileW = (W - PAD * 2 - GAP * (stack.length - 1)) / stack.length;
// Rectangle with the top-right and bottom-left corners cut, like the chips on the site.
const cut = (x, y, w, h, c = CUT) => `M${x} ${y}H${x + w - c}L${x + w} ${y + c}V${y + h}H${x + c}L${x} ${y + h - c}Z`;
const icon = (key, x, y, size, fill) => `<path transform="translate(${x} ${y}) scale(${size / 24})" fill="${fill}" fill-rule="evenodd" d="${icons[key]}"/>`;
const kicker = (y, n, label) => `<text x="${PAD}" y="${y}" class="k"><tspan fill="${C.muted}">${n} /</tspan> ${label}</text>`;

const y1 = 58;
const tiles = stack.map(([key, label], i) => {
  const x = PAD + i * (tileW + GAP);
  return `<path d="${cut(x, y1, tileW, TILE_H)}" fill="${C.panel}" stroke="${C.chip}"/>` +
    icon(key, x + tileW / 2 - 14, y1 + 14, 28, C.lavender) +
    `<text x="${x + tileW / 2}" y="${y1 + 64}" class="l" text-anchor="middle">${label}</text>`;
}).join("\n");

const y2 = y1 + TILE_H + 56, CHIP_H = 52, chipW = 196;
const chips = tools.map(([key, name, sub], i) => {
  const x = PAD + i * (chipW + GAP);
  return `<path d="${cut(x, y2, chipW, CHIP_H)}" fill="${C.panel}" stroke="${C.chip}"/>` +
    icon(key, x + 16, y2 + 13, 26, C.mint) +
    `<text x="${x + 56}" y="${y2 + 23}" class="n">${name}</text>` +
    `<text x="${x + 56}" y="${y2 + 39}" class="l">${sub}</text>`;
}).join("\n");
const noteX = PAD + tools.length * (chipW + GAP) + 16;
const H = y2 + CHIP_H + PAD;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
<title id="t">Stack: ${stack.map((s) => s[1]).join(", ")}. Tools: Claude Code, GPT (Codex CLI), Antigravity.</title>
<style>
text{font-family:${MONO}}
.k{font-size:11px;letter-spacing:.14em;fill:${C.mint}}
.l{font-size:10.5px;fill:${C.muted}}
.n{font-size:13px;fill:${C.ink}}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="${C.black}" stroke="${C.line}"/>
<path d="M1 18V1H18M${W - 18} ${H - 1}H${W - 1}V${H - 18}" fill="none" stroke="${C.mint}" stroke-width="2"/>
${kicker(36, "01", "STACK")}
${tiles}
${kicker(y2 - 22, "02", "TOOLS")}
${chips}
<text x="${noteX}" y="${y2 + 23}" class="l">Three model families,</text>
<text x="${noteX}" y="${y2 + 39}" class="l">in the loop daily<tspan fill="${C.violet}">_</tspan></text>
</svg>
`;
writeFileSync(new URL("../assets/stack.svg", import.meta.url), svg);
console.log(`stack.svg ${W}x${H}`);
