const fs = require('fs');
const path = require('path');

const traverseDir = (dir, callback) => {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            traverseDir(fullPath, callback);
        } else if (fullPath.endsWith('.jsx')) {
            callback(fullPath);
        }
    });
};

const srcDir = path.join(__dirname, 'frontend', 'src');

traverseDir(srcDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Emerald to Luxury Gold
    content = content.replace(/text-emerald-400/g, 'text-luxury-gold');
    content = content.replace(/text-emerald-500/g, 'text-luxury-gold');
    content = content.replace(/text-emerald-300/g, 'text-luxury-gold');
    content = content.replace(/text-emerald-600/g, 'text-luxury-gold');

    content = content.replace(/bg-emerald-600/g, 'bg-luxury-gold text-luxury-dark font-semibold');
    content = content.replace(/bg-emerald-500/g, 'bg-luxury-gold text-luxury-dark font-semibold');
    content = content.replace(/hover:bg-emerald-700/g, 'hover:bg-luxury-gold-light');
    content = content.replace(/hover:bg-emerald-600/g, 'hover:bg-luxury-gold-light');

    content = content.replace(/focus:ring-emerald-[0-9]{3}/g, 'focus:ring-luxury-gold');
    content = content.replace(/focus:border-emerald-[0-9]{3}/g, 'focus:border-luxury-gold');

    // Gray to Luxury Dark
    content = content.replace(/bg-gray-800/g, 'bg-luxury-darker');
    content = content.replace(/bg-gray-900/g, 'bg-luxury-dark');
    content = content.replace(/bg-gray-700/g, 'bg-luxury-border/30');
    content = content.replace(/hover:bg-gray-[0-9]{3}/g, 'hover:bg-luxury-border/50');
    content = content.replace(/divide-gray-[0-9]{3}/g, 'divide-luxury-border');

    // Text Gray
    content = content.replace(/text-gray-[345]00/g, 'text-luxury-text-muted');
    content = content.replace(/text-gray-[2]00/g, 'text-luxury-text-light');

    // Border Gray
    content = content.replace(/border-gray-[678]00/g, 'border-luxury-border');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
});
