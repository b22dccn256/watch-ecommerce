const fs = require('fs');
const path = require('path');

const walk = (dir, cb) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) walk(full, cb);
    else cb(full);
  });
};

const root = path.join(__dirname, '..', 'frontend', 'src');
let changed = 0;
walk(root, (file) => {
  if (!file.endsWith('.js') && !file.endsWith('.jsx') && !file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.json')) return;
  let s = fs.readFileSync(file, 'utf8');
  if (s.startsWith('\uFFFD')) {
    s = s.slice(1);
    fs.writeFileSync(file, s, 'utf8');
    console.log('Fixed', file);
    changed++;
  }
});
console.log('Done. Files changed:', changed);
