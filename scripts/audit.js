const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../docs/lektionen');
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'));
const licenseFile = path.join(__dirname, '../docs/licenses.md');

let licenseText = '';
try {
    licenseText = fs.readFileSync(licenseFile, 'utf8');
} catch (e) {
    console.error("Warning: docs/licenses.md not found.");
}

console.log(`Auditing ${files.length} files in ${targetDir}...\n`);

const patterns = {
    'HTML Tags': /<[a-z][\s\S]*?>/gi,
    '<b> tags': /<b>/gi,
    '<i> tags': /<i>/gi,
    '<p> tags': /<p>/gi,
    '<br> tags': /<br\s*\/?>/gi,
    '&nbsp; entities': /&nbsp;/gi,
    'Empty Tables': /<table>\s*<\/table>/gi,
    'Script tags': /<script/gi
};

const report = {};
const allImages = new Set();
const missingImages = [];

files.forEach(file => {
    const content = fs.readFileSync(path.join(targetDir, file), 'utf8');
    const fileIssues = {};
    
    // Check patterns
    Object.keys(patterns).forEach(pName => {
        const matches = content.match(patterns[pName]);
        if (matches) {
            fileIssues[pName] = matches.length;
        }
    });

    // Check images
    const imgRegex = /!\[.*?\]\(\/images\/(.*?)\)/g;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
        const imgName = match[1];
        allImages.add(imgName);
        if (!licenseText.includes(imgName)) {
            missingImages.push({ file, img: imgName });
        }
    }

    if (Object.keys(fileIssues).length > 0) {
        report[file] = fileIssues;
    }
});

console.log('--- AUDIT REPORT ---\n');
Object.keys(report).sort().forEach(file => {
    console.log(`[${file}]`);
    Object.keys(report[file]).forEach(issue => {
        console.log(`  - ${issue}: ${report[file][issue]}`);
    });
});

if (missingImages.length > 0) {
    console.log('\n--- MISSING LICENSES ---');
    missingImages.forEach(m => console.log(`  - ${m.img} in ${m.file}`));
}

const totalIssues = Object.values(report).reduce((acc, issues) => {
    Object.values(issues).forEach(v => acc += v);
    return acc;
}, 0);

console.log(`\nTotal problematic files: ${Object.keys(report).length}`);
console.log(`Total occurrences: ${totalIssues}`);
console.log(`Total unique images used: ${allImages.size}`);
console.log(`Images missing in licenses.md: ${missingImages.length}`);

// Export as JSON for further processing
fs.writeFileSync(path.join(__dirname, 'audit_results.json'), JSON.stringify({ report, missingImages, allImages: Array.from(allImages) }, null, 2));
console.log(`\nFull report saved to scripts/audit_results.json`);
