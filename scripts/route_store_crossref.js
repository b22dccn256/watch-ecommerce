#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  list.forEach((d) => {
    const res = path.resolve(dir, d.name);
    if (d.isDirectory()) results = results.concat(walk(res));
    else results.push(res);
  });
  return results;
}

function readFiles(globDir) {
  try {
    return walk(globDir).filter(
      (f) =>
        f.endsWith(".js") ||
        f.endsWith(".ts") ||
        f.endsWith(".jsx") ||
        f.endsWith(".tsx"),
    );
  } catch (err) {
    return [];
  }
}

function extractFrontendEndpoints(files) {
  const endpoints = new Set();
  const usages = [];
  const axiosRegex =
    /axios\.(get|post|put|patch|delete)\s*\(\s*([`'\"])([\s\S]*?)\2/gm;

  files.forEach((file) => {
    const src = fs.readFileSync(file, "utf8");
    let m;
    while ((m = axiosRegex.exec(src)) !== null) {
      const method = m[1].toUpperCase();
      const raw = m[3];
      // normalize template literals by removing ${...}
      const cleaned = raw.replace(/\${[^}]+}/g, ":param").trim();
      endpoints.add(`${method} ${cleaned}`);
      usages.push({
        file: path.relative(process.cwd(), file),
        method,
        raw: cleaned,
      });
    }
  });
  return { endpoints: Array.from(endpoints).sort(), usages };
}

function extractBackendRoutes(files) {
  const routes = [];
  const routerRegex =
    /router\.(get|post|put|patch|delete)\s*\(\s*([`'\"])(.*?)\2/gm;
  files.forEach((file) => {
    const src = fs.readFileSync(file, "utf8");
    let m;
    while ((m = routerRegex.exec(src)) !== null) {
      const method = m[1].toUpperCase();
      const routePath = m[3];
      routes.push({
        file: path.relative(process.cwd(), file),
        method,
        route: routePath,
      });
    }
  });
  return routes;
}

function mapAppUses(serverFiles) {
  // find app.use('/prefix', require('./routes/xxx')) patterns
  const mapping = {};
  const useRegex =
    /app\.use\s*\(\s*([`'\"])(.*?)\1\s*,\s*require\(\s*([`'\"])(.*?routes\/?(.*?))\3\s*\)\s*\)/gm;
  serverFiles.forEach((file) => {
    const src = fs.readFileSync(file, "utf8");
    let m;
    while ((m = useRegex.exec(src)) !== null) {
      const prefix = m[2];
      const reqPath = m[4];
      const filename = path.basename(reqPath).replace(/\.js$/, "") + ".js";
      mapping[filename] = prefix;
    }
  });
  return mapping;
}

function findServerFiles() {
  const candidates = [
    path.resolve("backend", "server.js"),
    path.resolve("backend", "index.js"),
    path.resolve("server.js"),
    path.resolve("index.js"),
  ];
  return candidates.filter((p) => fs.existsSync(p));
}

function main() {
  console.log("Scanning frontend stores for axios calls...");
  const frontendDir = path.resolve("frontend", "src");
  const frontendFiles = fs.existsSync(frontendDir)
    ? readFiles(frontendDir)
    : [];
  const { endpoints, usages } = extractFrontendEndpoints(frontendFiles);

  console.log("Scanning backend route files...");
  const backendRoutesDir = path.resolve("backend", "routes");
  const backendFiles = fs.existsSync(backendRoutesDir)
    ? readFiles(backendRoutesDir)
    : readFiles(path.resolve("backend"));
  const backendRoutes = extractBackendRoutes(backendFiles);

  const serverFiles = findServerFiles();
  const appUseMap = mapAppUses(serverFiles);

  // attach prefix if we can
  const backendWithPrefix = backendRoutes.map((r) => {
    const file = path.basename(r.file);
    return { ...r, prefix: appUseMap[file] || "" };
  });

  // map frontend usages to backend
  const report = usages.map((u) => {
    const entry = backendWithPrefix.find((b) => {
      const candidate =
        `${b.method} ${path.posix.join(b.prefix || "", b.route)}`.replace(
          /\\/g,
          "/",
        );
      // simple contains match
      return u.raw && candidate.includes(u.raw.split("?")[0]);
    });
    return { usage: u, matched: entry || null };
  });

  const outDir = path.resolve("outputs");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const jsonPath = path.join(outDir, "route_store_crossref.json");
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      { endpoints, backendRoutes: backendWithPrefix, report },
      null,
      2,
    ),
  );
  console.log("Wrote", jsonPath);

  // simple CSV
  const csvPath = path.join(outDir, "route_store_crossref.csv");
  const csvLines = [
    "frontend_file,method,frontend_endpoint,backend_file,backend_method,backend_route,backend_prefix",
  ];
  report.forEach((r) => {
    const f = r.usage.file.replace(/,/g, "%2C");
    const fm = r.usage.method;
    const fe = (r.usage.raw || "").replace(/,/g, "%2C");
    if (r.matched) {
      csvLines.push(
        [
          f,
          fm,
          fe,
          r.matched.file,
          r.matched.method,
          r.matched.route,
          r.matched.prefix,
        ].join(","),
      );
    } else {
      csvLines.push([f, fm, fe, "", "", "", ""].join(","));
    }
  });
  fs.writeFileSync(csvPath, csvLines.join("\n"));
  console.log("Wrote", csvPath);
  console.log(
    "Scan complete. Open outputs/route_store_crossref.json for details.",
  );
}

main();
