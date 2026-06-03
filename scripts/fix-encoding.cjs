#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const exts = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".html",
  ".css",
  ".md",
  ".json",
]);

function walk(dir) {
  let out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) out = out.concat(walk(p));
    else if (exts.has(path.extname(p))) out.push(p);
  }
  return out;
}

function countNonAscii(s) {
  let c = 0;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 127) c++;
  return c;
}

const frontendSrc = path.join(__dirname, "..", "frontend", "src");
if (!fs.existsSync(frontendSrc)) {
  console.error("frontend/src not found, aborting");
  process.exit(1);
}

const files = walk(frontendSrc);
let fixed = [];
for (const f of files) {
  try {
    const orig = fs.readFileSync(f, "utf8");
    // Try re-decoding by interpreting the current string as latin1 bytes
    const alt = Buffer.from(orig, "latin1").toString("utf8");
    // Heuristic: if alt contains more 'natural' non-ascii characters, keep it
    if (countNonAscii(alt) > countNonAscii(orig)) {
      fs.writeFileSync(f, alt, "utf8");
      fixed.push(f);
    }
  } catch (err) {
    console.warn("skip", f, err.message);
  }
}

console.log("Encoding fixer done. Files fixed:", fixed.length);
fixed.forEach((x) => console.log(" -", x));
