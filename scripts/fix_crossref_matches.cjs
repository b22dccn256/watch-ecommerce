const fs = require("fs");
const path = require("path");

const input = path.join(
  __dirname,
  "..",
  "outputs",
  "route_store_crossref.json",
);
const out = path.join(
  __dirname,
  "..",
  "outputs",
  "route_store_crossref_fixed.json",
);

function load() {
  return JSON.parse(fs.readFileSync(input, "utf8"));
}
function normalize(p) {
  return (p || "")
    .replace(/:\w+/g, ":param")
    .replace(/\?[^\s]*/g, "")
    .replace(/\/+/g, "/");
}

function main() {
  const data = load();
  const backend = data.backendRoutes || [];
  const report = data.report || [];

  const map = new Map();
  backend.forEach((r) => {
    const full = (r.prefix || "") + (r.route || "");
    const key = `${(r.method || "GET").toUpperCase()} ${normalize(full)}`;
    map.set(key, r);
    // also prefixless
    const k2 = `${(r.method || "GET").toUpperCase()} ${normalize(r.route || "")}`;
    if (!map.has(k2)) map.set(k2, r);
  });

  let fixed = 0;
  for (const rep of report) {
    if (rep.matched) continue;
    const usage = rep.usage || {};
    const method = (usage.method || "GET").toUpperCase();
    const raw = usage.raw || "";
    const candidates = [normalize("/api" + raw), normalize(raw)];
    let found = null;
    for (const c of candidates) {
      const key = `${method} ${c}`;
      if (map.has(key)) {
        found = map.get(key);
        break;
      }
    }
    if (found) {
      rep.matched = {
        backendFile: found.file,
        method: found.method,
        route: (found.prefix || "") + found.route,
        handlerName: found.handlerName || null,
        note: "matched-via-api-prefix-heuristic",
      };
      fixed++;
    }
  }

  fs.writeFileSync(out, JSON.stringify(data, null, 2));
  console.log("Wrote", out, `; fixed ${fixed} report entries`);
}

main();
