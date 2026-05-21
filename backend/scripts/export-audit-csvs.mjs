#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const reportPath = path.join(process.cwd(), 'backend', 'exports', 'audit-report.json');
if (!fs.existsSync(reportPath)) {
  console.error('audit-report.json not found. Run audit-data.mjs first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const outDir = path.join(process.cwd(), 'backend', 'exports', 'csv');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function writeCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const csvLines = rows.map(r => keys.map(k => {
    let v = r[k];
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) return '"' + JSON.stringify(v) + '"';
    return '"' + String(v).replace(/"/g, '""') + '"';
  }).join(','));
  const csv = [keys.join(',')].concat(csvLines).join('\n');
  fs.writeFileSync(path.join(outDir, filename), csv);
  console.log('Wrote', filename);
}

writeCSV('missing-image.csv', report.missingImage || []);
writeCSV('missing-category.csv', report.missingCategory || []);
writeCSV('inactive-not-deleted.csv', report.inactiveNotDeleted || []);
writeCSV('zero-stock-active.csv', report.zeroStockActive || []);
writeCSV('expired-active-coupons.csv', report.expiredActiveCoupons || []);

// duplicateSKUs and duplicateNames are arrays of groups; flatten them to rows
if (report.duplicateSKUs && report.duplicateSKUs.length) {
  const rows = report.duplicateSKUs.map(g => ({ sku: g.sku || '', count: g.count || 0, ids: JSON.stringify(g.ids || []) }));
  writeCSV('duplicate-skus.csv', rows);
}
if (report.duplicateNames && report.duplicateNames.length) {
  const rows = report.duplicateNames.map(g => ({ name: g.name || '', count: g.count || 0, ids: JSON.stringify(g.ids || []) }));
  writeCSV('duplicate-names.csv', rows);
}

console.log('Export complete. CSVs are in backend/exports/csv');
