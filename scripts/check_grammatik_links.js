const fs = require('fs');
const path = require('path');

const grammatikFile = path.join(__dirname, '../docs/grammatik.md');
const lektionenDir = path.join(__dirname, '../docs/lektionen');

const content = fs.readFileSync(grammatikFile, 'utf8');
const files = fs.readdirSync(lektionenDir).filter(f => f.startsWith('lektion') && f.endsWith('.md'));

console.log(`Checking ${files.length} lessons...`);

const missing = [];
files.forEach(file => {
    const lektName = file.replace('.md', '');
    if (!content.includes(lektName)) {
        missing.push(lektName);
    }
});

if (missing.length === 0) {
    console.log("SUCCESS: All lessons are referenced in grammatik.md!");
} else {
    console.log(`MISSING LESSONS: ${missing.length}`);
    console.log(missing.join(', '));
}
