const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../docs/lektionen');
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'));

console.log(`Fixing links in ${files.length} files...\n`);

files.forEach(file => {
    let content = fs.readFileSync(path.join(targetDir, file), 'utf8');
    let original = content;

    // Replace /sanskritkurs/lektionXX.htm or /sanskritkurs/lektionXX with /lektionen/lektionXX
    // The previous conversion might have left some half-broken links
    content = content.replace(/\/sanskritkurs\/(lektion|uebung|schrift)(\d{2})(\.htm)?/gi, '/lektionen/$1$2');
    
    // Also handle relative links that might be broken
    content = content.replace(/\]\((lektion|uebung|schrift)(\d{2})(\.htm)?\)/gi, '](/lektionen/$1$2)');

    if (content !== original) {
        fs.writeFileSync(path.join(targetDir, file), content);
        console.log(`  - Fixed links in ${file}`);
    }
});

console.log('\nLink fix complete.');
