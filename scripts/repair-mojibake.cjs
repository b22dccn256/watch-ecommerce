const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || 'frontend/src';
const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.md']);

const badPattern = /(Ã.|Æ.|Ä.|Å.|á»|áº|â‚«|ðŸ|�)/g;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (exts.has(path.extname(name))) out.push(full);
  }
  return out;
}

function score(text) {
  const m = text.match(badPattern);
  return m ? m.length : 0;
}

function repair(text) {
  return Buffer.from(text, 'latin1').toString('utf8');
}

let changed = 0;
let scanned = 0;
for (const file of walk(ROOT)) {
  const raw = fs.readFileSync(file, 'utf8');
  scanned++;
  const before = score(raw);
  if (before === 0) continue;
  const fixed = repair(raw);
  const after = score(fixed);
  if (after < before && !fixed.includes('\u0000')) {
    fs.writeFileSync(file, fixed, 'utf8');
    changed++;
    console.log(`fixed ${file} (${before} -> ${after})`);
  }
}
console.log(`scanned=${scanned} changed=${changed}`);
