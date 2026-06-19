import fs from 'fs';

let content = fs.readFileSync('src/store/useAppStore.js', 'utf8');

// Replace crypto.randomUUID
const regexToReplace = /const id = crypto\.randomUUID \? crypto\.randomUUID\(\) : Math\.random\(\)\.toString\(36\)\.substring\(2, 9\) \+ Date\.now\(\)\.toString\(36\);/g;
const newStr = `const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9) + Date.now().toString(36);`;

content = content.replace(regexToReplace, newStr);

fs.writeFileSync('src/store/useAppStore.js', content);
