const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, '..', 'outputs', 'route_store_crossref.json');
const out = path.join(__dirname, '..', 'outputs', 'unmatched_endpoints_prioritized.csv');

function load() {
  const raw = fs.readFileSync(input, 'utf8');
  return JSON.parse(raw);
}

function normalizeUsage(u) {
  if (!u || !u.raw) return null;
  // Replace :param tokens and query values to canonical form
  return u.raw.replace(/:param/g, ':id').replace(/:\w+/g, ':param');
}

function main() {
  const data = load();
  const report = data.report || [];
  const unmatched = {};

  for (const r of report) {
    if (!r.matched) {
      const usage = r.usage || {};
      const key = `${usage.method || 'GET'} ${usage.raw || ''}`;
      if (!unmatched[key]) unmatched[key] = { count: 0, examples: new Set(), files: new Set(), method: usage.method || '', raw: usage.raw || '' };
      unmatched[key].count += 1;
      if (usage.file) unmatched[key].examples.add(usage.file);
      unmatched[key].files.add(usage.file || '');
    }
  }

  const rows = Object.entries(unmatched)
    .map(([k, v]) => ({ endpoint: k, count: v.count, exampleFiles: Array.from(v.examples).slice(0,3).join(' | ') }))
    .sort((a,b) => b.count - a.count);

  const header = 'count,method,endpoint,exampleFiles\n';
  const lines = rows.map(r => `${r.count},"${r.endpoint.split(' ')[0]}","${r.endpoint.split(' ').slice(1).join(' ')}","${r.exampleFiles}"`);
  fs.writeFileSync(out, header + lines.join('\n'));
  console.log('Wrote', out);
}

main();
