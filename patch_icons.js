const fs = require('fs');

// Patch main.ts
let mainContent = fs.readFileSync('c:/LowWrite/electron/main.ts', 'utf8');

const oldSearchEnd = `    if (!stdout.trim()) return [];
    const results = JSON.parse(stdout);
    return Array.isArray(results) ? results : [results]; // ConvertTo-Json might return a single object instead of array`;

const newSearchEnd = `    if (!stdout.trim()) return [];
    let parsedResults = JSON.parse(stdout);
    if (!Array.isArray(parsedResults)) parsedResults = [parsedResults];
    
    // Fetch native system icons for each file
    const finalResults = await Promise.all(parsedResults.map(async (res: any) => {
       try {
          const icon = await app.getFileIcon(res.FullName, { size: 'normal' });
          res.Icon = icon.toDataURL();
       } catch (e) {
          res.Icon = null;
       }
       return res;
    }));
    return finalResults;`;

mainContent = mainContent.replace(oldSearchEnd, newSearchEnd);
fs.writeFileSync('c:/LowWrite/electron/main.ts', mainContent, 'utf8');

// Patch App.tsx
let appContent = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

const oldIcons = `{res.Extension === '.lnk' || res.Extension === '.exe' ? <AppWindow className={\`w-5 h-5 \${curTheme.text}\`} /> : 
                               res.Extension === '' ? <Folder className={\`w-5 h-5 text-yellow-500\`} /> : 
                               <FileText className="w-5 h-5 text-gray-400" />}`;

const newIcons = `{res.Icon ? <img src={res.Icon} alt="icon" className="w-6 h-6 object-contain drop-shadow-md" /> : 
                               (res.Extension === '.lnk' || res.Extension === '.exe' ? <AppWindow className={\`w-5 h-5 \${curTheme.text}\`} /> : 
                               res.Extension === '' ? <Folder className={\`w-5 h-5 text-yellow-500\`} /> : 
                               <FileText className="w-5 h-5 text-gray-400" />)}`;

appContent = appContent.replace(oldIcons, newIcons);
fs.writeFileSync('c:/LowWrite/src/App.tsx', appContent, 'utf8');
console.log("Icons patched.");
