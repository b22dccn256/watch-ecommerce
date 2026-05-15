#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const exts = new Set(['.js','.jsx','.ts','.tsx','.html','.md','.json']);

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

const replacements = [
  [/'â‚«'/g, '₫'],
  [/â‚«/g, '₫'],
  [/â€”/g, '—'],
  [/â€“/g, '–'],
  [/â€¢/g, '•'],
  [/â€¦/g, '…'],
  [/Tá»•ng/g, 'Tổng'],
  [/Táº¥t/g, 'Tất'],
  [/sáº£n pháº©m/g, 'sản phẩm'],
  [/KhĂ´ng/g, 'Không'],
  [/KhĂ´ng tĂ¬m tháº¥y/g, 'Không tìm thấy'],
  [/Äang/g, 'Đang'],
  [/Ä‘/g, 'đ'],
  [/Ä/g, 'Đ'],
  [/TĂ¬m/g, 'Tìm'],
  [/Táº¡m/g, 'Tạm'],
  [/Nháº­p/g, 'Nhập'],
  [/Kiá»ƒm/g, 'Kiểm'],
  [/KĂª/g, 'Kê'],
  [/Lá»‹ch/g, 'Lịch'],
  [/Sáº£n/g, 'Sản'],
  [/pháº©m/g, 'phẩm'],
  [/giĂ¡/g, 'giá'],
  [/trá»‹/g, 'trị'],
  [/GiĂ¡/g, 'Giá'],
  [/Ä‘ang/g, 'đang'],
  [/xĂ¡c/g, 'xác'],
  [/xĂ¡c nháº­n/g, 'xác nhận'],
  [/Äang xá»­ lĂ½/g, 'Đang xử lý'],
  [/Äang xá»­ lĂ½.../g, 'Đang xử lý...'],
  [/Äang gá»­i.../g, 'Đang gửi...'],
  [/LÆ°u/g, 'Lưu'],
  [/Tá»‰nh\/ThĂ nh phá»‘/g, 'Tỉnh/Thành phố'],
  [/Tiáº¿p tá»¥c/g, 'Tiếp tục'],
  [/â€”/g, '—']
  // additional common mojibake sequences
  ,[/Æ¡/g, 'ơ']
  ,[/Æ‘/g, 'ơ']
  ,[/Ă¡/g, 'á']
  ,[/Ă /g, 'à']
  ,[/Ă£/g, 'ã']
  ,[/Ă¢/g, 'â']
  ,[/Ă¨/g, 'è']
  ,[/Ă©/g, 'é']
  ,[/Ăª/g, 'ê']
  ,[/Ă­/g, 'í']
  ,[/Ă¬/g, 'ì']
  ,[/Ăµ/g, 'õ']
  ,[/Ă´/g, 'ô']
  ,[/Ă¹/g, 'ù']
  ,[/Ăº/g, 'ú']
  ,[/Ă»/g, 'û']
  ,[/Ă´/g, 'ô']
  ,[/Ä/g, 'Đ']
  ,[/Ä‘/g, 'đ']
  ,[/Ã¡/g, 'á']
  ,[/Ã©/g, 'é']
  ,[/Ã¨/g, 'è']
  ,[/Ã´/g, 'ô']
  ,[/Ãµ/g, 'õ']
  ,[/\u00A0/g, ' ']
];

const targets = [
  path.join(__dirname, '..', 'frontend', 'src'),
  path.join(__dirname, '..', 'frontend', 'tests'),
  path.join(__dirname, '..', 'backend')
];

let files = [];
for (const target of targets) {
  if (fs.existsSync(target)) {
    files = files.concat(walk(target));
  } else {
    console.warn(target + ' not found');
  }
}
let changed = [];
for (const f of files) {
  try {
    let txt = fs.readFileSync(f, 'utf8');
    let orig = txt;
    for (const [pat, rep] of replacements) txt = txt.replace(pat, rep);
    if (txt !== orig) {
      fs.writeFileSync(f, txt, 'utf8');
      changed.push(f);
    }
  } catch (err) {
    console.warn('skip', f, err.message);
  }
}

console.log('Replacements done. Files changed:', changed.length);
changed.forEach(x=>console.log(' -', x));
