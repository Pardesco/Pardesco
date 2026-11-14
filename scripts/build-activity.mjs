// Builds assets/activity.svg from the GitHub contribution calendar, in the studio.pardesco.com palette.
// Run: GITHUB_TOKEN=... node scripts/build-activity.mjs   (the daily workflow does this)
import { writeFileSync } from "node:fs";

const LOGIN = process.env.GH_LOGIN || "Pardesco";
const DAYS = 31;
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is not set");

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "profile-activity-graph" },
  body: JSON.stringify({
    query: `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`,
    variables: { login: LOGIN },
  }),
});
const json = await res.json();
const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
if (!res.ok || !cal) throw new Error(`GitHub API: ${res.status} ${JSON.stringify(json).slice(0, 300)}`);

const all = cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, n: d.contributionCount }));
const days = all.slice(-DAYS);
const sum = days.reduce((a, d) => a + d.n, 0);
const peak = days.reduce((a, d) => (d.n > a.n ? d : a), days[0]);
// Streak: consecutive active days ending today, or yesterday if today is still empty.
let streak = 0;
for (let i = all.length - 1; i >= 0; i--) {
  if (all[i].n > 0) streak++;
  else if (i !== all.length - 1) break;
}

const C = { black: "#000000", line: "#29252f", grid: "#1b1820", ink: "#f0edf5", muted: "#aaa5b6", mint: "#9de3c2", violet: "#a78bfa", lavender: "#d5c2ff" };
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";
const W = 880, H = 318, L = 58, R = 856, T = 66, B = 226;
const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500].find((s) => s * 4 >= Math.max(peak.n, 4));
const top = step * 4;
const X = (i) => L + (i * (R - L)) / (DAYS - 1);
const Y = (n) => B - (n / top) * (B - T);
const f = (v) => +v.toFixed(1);
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const label = (iso) => `${MON[+iso.slice(5, 7) - 1]} ${iso.slice(8)}`;

const pts = days.map((d, i) => `${f(X(i))} ${f(Y(d.n))}`);
const line = `M${pts.join("L")}`;
const area = `${line}L${R} ${B}L${L} ${B}Z`;
const grid = [0, 1, 2, 3, 4].map((k) => {
  const y = f(Y(k * step));
  return `<path d="M${L} ${y}H${R}" stroke="${k ? C.grid : C.line}"/><text x="${L - 12}" y="${y + 3.5}" class="a" text-anchor="end">${k * step}</text>`;
}).join("\n");
const ticks = days.map((d, i) => ((DAYS - 1 - i) % 5 === 0 ? `<text x="${f(X(i))}" y="${B + 20}" class="a" text-anchor="${i === 0 ? "start" : i === DAYS - 1 ? "end" : "middle"}">${label(d.date)}</text>` : "")).join("");
const dots = days.map((d, i) => (d.n ? `<rect x="${f(X(i) - 2)}" y="${f(Y(d.n) - 2)}" width="4" height="4" fill="${d === peak ? C.lavender : C.mint}"/>` : "")).join("");
const pi = days.indexOf(peak);
const peakTag = peak.n ? `<text x="${f(X(pi))}" y="${f(Y(peak.n) - 10)}" class="a" text-anchor="${pi < 2 ? "start" : pi > DAYS - 3 ? "end" : "middle"}" style="fill:${C.lavender}">${peak.n}</text>` : "";
const stats = [["LAST 12 MONTHS", cal.totalContributions.toLocaleString("en-US"), C.mint], [`LAST ${DAYS} DAYS`, sum.toLocaleString("en-US"), C.lavender], ["BEST DAY", `${peak.n} · ${label(peak.date)}`, C.lavender], ["STREAK", `${streak}d`, C.lavender]];
const colW = (W - 48) / stats.length;
const footer = stats.map(([k, v, c], i) => {
  const x = 24 + i * colW;
  return (i ? `<path d="M${x - 16} ${H - 52}V${H - 20}" stroke="${C.line}"/>` : "") +
    `<text x="${x}" y="${H - 40}" class="a">${k}</text><text x="${x}" y="${H - 22}" class="v" style="fill:${c}">${v}</text>`;
}).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
<title id="t">Contribution activity: ${sum} contributions in the last ${DAYS} days, ${cal.totalContributions} in the last 12 months.</title>
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.violet}" stop-opacity=".42"/><stop offset="1" stop-color="${C.violet}" stop-opacity="0"/></linearGradient></defs>
<style>
text{font-family:${MONO}}
.k{font-size:11px;letter-spacing:.14em;fill:${C.mint}}
.a{font-size:10px;fill:${C.muted};letter-spacing:.04em}
.v{font-size:15px}
.ln{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 1.8s ease-out .2s forwards}
.fade{opacity:0;animation:in .7s ease-out 1.5s forwards}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes in{to{opacity:1}}
@media(prefers-reduced-motion:reduce){.ln,.fade{animation:none;stroke-dashoffset:0;opacity:1}}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="${C.black}" stroke="${C.line}"/>
<path d="M1 18V1H18M${W - 18} ${H - 1}H${W - 1}V${H - 18}" fill="none" stroke="${C.mint}" stroke-width="2"/>
<text x="24" y="36" class="k"><tspan fill="${C.muted}">03 /</tspan> CONTRIBUTION ACTIVITY</text>
<text x="${W - 24}" y="36" class="a" text-anchor="end">github.com/${LOGIN} · updated daily</text>
${grid}
${ticks}
<g class="fade"><path d="${area}" fill="url(#g)"/>${dots}${peakTag}</g>
<path class="ln" pathLength="1" d="${line}" fill="none" stroke="${C.mint}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M24 ${H - 64}H${W - 24}" stroke="${C.line}"/>
${footer}
</svg>
`;
writeFileSync(new URL("../assets/activity.svg", import.meta.url), svg);
console.log(`activity.svg: ${sum} in ${DAYS}d, ${cal.totalContributions} in 12 months, peak ${peak.n} on ${peak.date}, streak ${streak}d`);
