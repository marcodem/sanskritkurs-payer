const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const targetDir = path.join(__dirname, '../docs/lektionen');
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'));

console.log(`Cleaning up HTML fragments in ${files.length} files...\n`);

files.forEach(file => {
    let content = fs.readFileSync(path.join(targetDir, file), 'utf8');
    let original = content;

    // 1. Simple replacements for common clutter that shouldn't break anything
    content = content.replace(/&nbsp;/g, ' ');
    content = content.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    content = content.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    
    // 2. Clean up tables specifically but keep the structure
    // We use a regex to find <table>...</table> blocks and clean their internals
    content = content.replace(/<table>([\s\S]*?)<\/table>/gi, (match) => {
        // Remove <p> and </p> inside tables, replace <br> with <br />
        let table = match;
        table = table.replace(/<p>/gi, '');
        table = table.replace(/<\/p>/gi, '<br>');
        table = table.replace(/<br\s*\/?>/gi, '<br>');
        table = table.replace(/\s+/g, ' '); // collapse whitespace
        // Cleanup trailing <br> at end of cells
        table = table.replace(/<br><\/td>/gi, '</td>');
        return table;
    });

    if (content !== original) {
        fs.writeFileSync(path.join(targetDir, file), content);
        console.log(`  - Cleaned ${file}`);
    }
});

console.log('\nCleanup complete.');
