import fs from 'fs';

let content = fs.readFileSync('src/lib/api/telemetry.js', 'utf8');

// Replace crypto.randomUUID
const regexToReplace = /id: crypto\.randomUUID \? crypto\.randomUUID\(\) : Math\.random\(\)\.toString\(36\)\.substring\(2, 9\),/g;
const newStr = `id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),`;

content = content.replace(regexToReplace, newStr);

fs.writeFileSync('src/lib/api/telemetry.js', content);
