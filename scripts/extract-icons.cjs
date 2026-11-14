// One-off: collects single-path 24x24 logo SVGs from a folder into scripts/icons.json.
// Sources: Simple Icons (CC0) and, for Antigravity, @lobehub/icons-static-svg (MIT).
// Usage: node scripts/extract-icons.cjs <folder-with-svgs>
const fs = require("fs");
const path = require("path");
const dir = process.argv[2];
const map = {
  typescript: "typescript", python: "python", react: "react", nextjs: "nextdotjs", threejs: "threedotjs",
  electron: "electron", cloudflare: "cloudflare", supabase: "supabase", n8n: "n8n", mcp: "modelcontextprotocol", blender: "blender",
  claude: "claude", openai: "simple-icons_15_icons_openai", antigravity: "antigravity",
};
const out = {};
for (const key in map) {
  const svg = fs.readFileSync(path.join(dir, map[key] + ".svg"), "utf8");
  const d = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  if (d.length !== 1) throw new Error(`${key}: expected one path, found ${d.length}`);
  out[key] = d[0];
}
fs.writeFileSync(path.join(__dirname, "icons.json"), JSON.stringify(out, null, 1));
console.log(Object.keys(out).length + " icons");
