const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, '..', 'outputs', 'route_store_crossref.json');
const out = path.join(__dirname, '..', 'outputs', 'rematch_unmatched_report.csv');

function load() {
  const raw = fs.readFileSync(input, 'utf8');
  return JSON.parse(raw);
}

function normalizePath(p) {
  if (!p) return '';
  // Remove query strings and normalize param names to :param
  return p.replace(/:\w+/g, ':param').replace(/\?[^\s]*/g, '').replace(/\/+/g, '/');
}

function main() {
  const data = load();
  const backend = data.backendRoutes || [];
  const report = data.report || [];

  const backendSet = new Set();
  backend.forEach((r) => {
    const full = (r.prefix || '') + (r.route || '');
    const key = `${(r.method||'GET').toUpperCase()} ${normalizePath(full)}`;
    backendSet.add(key);
  });

  // Also consider prefixless backend (some scripts may register without prefix)
  backend.forEach((r) => {
    const full = r.route || '';
    const key = `${(r.method||'GET').toUpperCase()} ${normalizePath(full)}`;
    backendSet.add(key);
  });

  const results = [];
  let wouldMatch = 0;
  for (const rep of report) {
    if (rep.matched) continue;
    const usage = rep.usage || {};
    const raw = usage.raw || '';
    const method = (usage.method || 'GET').toUpperCase();

    const candidates = [];
    // Try with /api prefix (common axios baseURL)
    candidates.push(`${method} ${normalizePath('/api' + raw)}`);
    // Try raw
    candidates.push(`${method} ${normalizePath(raw)}`);
    // Try replacing /orders/track/:param -> /api/orders/track/:param etc (already covered)

    let matched = false;
    for (const c of candidates) {
      if (backendSet.has(c)) { matched = true; break; }
    }

    results.push({ method, raw, matched });
    if (matched) wouldMatch++;
  }

  // write CSV
  const lines = ['wouldMatch,method,raw'];
  results.forEach(r => lines.push(`${r.matched?1:0},${r.method},"${r.raw}"`));
  fs.writeFileSync(out, lines.join('\n'));
  console.log('Wrote', out, `(${wouldMatch}/${results.length} would match with /api heuristic)`);
}

main();
