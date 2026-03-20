const fs = require('fs');
let content = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

const searchBarBlock = `<div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.04] bg-gradient-to-b from-white/[0.03] to-transparent">`;

const loadingBarHtml = `
            {/* PROGRESS BAR FEEDBACK */}
            <div className={\`h-1 w-full bg-black/50 overflow-hidden relative transition-opacity duration-300 \${isSearching ? 'opacity-100' : 'opacity-0'}\`}>
               <div className={\`absolute top-0 left-0 h-full \${curTheme.bg} animate-pulse shadow-[0_0_10px_currentColor] w-1/3 progress-indeterminate\`}></div>
            </div>
            
            <style>{\`
              @keyframes progress-indeterminate {
                0% { left: -35%; width: 35%; }
                100% { left: 100%; width: 35%; }
              }
              .progress-indeterminate {
                animation: progress-indeterminate 1.5s infinite linear;
              }
            \`}</style>
`;

content = content.replace(searchBarBlock, loadingBarHtml + "\\n            " + searchBarBlock);
fs.writeFileSync('c:/LowWrite/src/App.tsx', content, 'utf8');
console.log("App.tsx patched. Progress bar added.");
