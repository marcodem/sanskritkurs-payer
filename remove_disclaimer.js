const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const docsPath = path.join(__dirname, 'docs');
walkDir(docsPath, function(filePath) {
  if (filePath.endsWith('.md')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern 1: With the [!INFO] header
    const pattern1 = /> \[!INFO\] Zitierweise & Rechte\n> Dieses Kapitel ist Teil des Sanskritkurses\. Details zum Copyright und zur Zitierweise der Ursprungsfassung siehe: \[Impressum & Copyright\]\(\/impressum\)\n?/g;
    // Pattern 2: Without the header
    const pattern2 = /> Dieses Kapitel ist Teil des Sanskritkurses\. Details zum Copyright und zur Zitierweise der Ursprungsfassung siehe: \[Impressum & Copyright\]\(\/impressum\)\n?/g;
    // Pattern 3: English version
    const pattern3 = /> \[!INFO\] Citation & Rights\n> This chapter is part of the Sanskrit course\. For details regarding copyright and citation of the original version, see: \[Imprint & Copyright\]\(\/en\/impressum\)\n?/g;
    // Pattern 4: English version without header
    const pattern4 = /> This chapter is part of the Sanskrit course\. For details regarding copyright and citation of the original version, see: \[Imprint & Copyright\]\(\/en\/impressum\)\n?/g;

    content = content.replace(pattern1, '');
    content = content.replace(pattern2, '');
    content = content.replace(pattern3, '');
    content = content.replace(pattern4, '');

    // Trim any extra leading newlines that might have been left at top of file
    content = content.replace(/^\s+/, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
