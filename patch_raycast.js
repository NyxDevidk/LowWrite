const fs = require('fs');

let content = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

// 1. Add selectedIndex state
content = content.replace(
  `const [isSearching, setIsSearching] = useState(false);`,
  `const [isSearching, setIsSearching] = useState(false);\n  const [selectedIndex, setSelectedIndex] = useState(0);`
);

// 2. Reset selectedIndex when results change or query changes
const searchEffectTarget = `setSearchResults(results);
          setIsSearching(false);
        } catch (error) {`;

content = content.replace(searchEffectTarget, `setSearchResults(results);\n          setSelectedIndex(0);\n          setIsSearching(false);\n        } catch (error) {`);

// 3. Math evaluation interceptor before calling Electron IPC
const beforeSearchTarget = `setIsSearching(true);
      const delay = setTimeout(async () => {`;

const mathInterceptor = `
      // Mod Raycast: Math evaluation
      try {
        if (/^[0-9+\\-*/().\\s]+$/.test(searchQuery) && searchQuery.trim().length > 2) {
          const mathResult = new Function('return ' + searchQuery)();
          if (Number.isFinite(mathResult)) {
            setSearchResults([{
              Name: \`= \${mathResult}\`,
              FullName: 'math',
              Extension: 'math',
              Icon: null
            }]);
            setIsSearching(false);
            setSelectedIndex(0);
            return;
          }
        }
      } catch(e) {}
`;

content = content.replace(beforeSearchTarget, beforeSearchTarget + '\\n' + mathInterceptor);

// 4. Input KeyDown Handler
const inputHtmlTarget = `onChange={(e) => setSearchQuery(e.target.value)}
                  spellCheck={false}`;

const keydownHandler = `onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1)); }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, 0)); }
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      const item = searchResults[selectedIndex];
                      if (item.Extension !== 'math') {
                        window.electron.openFile(item.FullName);
                      } else {
                        navigator.clipboard.writeText(item.Name.replace('= ', ''));
                        setSearchQuery('');
                      }
                    }
                  }}
                  spellCheck={false}`;

content = content.replace(inputHtmlTarget, keydownHandler);

// 5. Render item highlight based on index
const mapTarget = `searchResults.map((res, i) => (
                   <div key={i}`;

const newMapTarget = `searchResults.map((res, i) => (
                   <div key={i} className={\`\${selectedIndex === i ? 'bg-white/10 border-l-2 border-white' : 'border-l-2 border-transparent hover:bg-white/5'} transition-all\`}`;

content = content.replace(mapTarget, newMapTarget);

// Add instruction for math
const mathIconFallback = `<div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                           {res.Extension === 'math' ? <Calculator className={\`w-5 h-5 \${curTheme.text}\`} /> :`;

content = content.replace(
  `import { Sparkles, MessageSquare, Settings, Check, Send, Copy, Trash2, Edit3, Type, Zap, Bot, PaintBucket, Search, Folder, AppWindow, FileText, ChevronRight, ExternalLink, Gamepad2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';`,
  `import { Sparkles, MessageSquare, Settings, Check, Send, Copy, Trash2, Edit3, Type, Zap, Bot, PaintBucket, Search, Folder, AppWindow, FileText, ChevronRight, ExternalLink, Gamepad2, CheckCircle2, XCircle, Loader2, Calculator } from 'lucide-react';`
);

content = content.replace(
  `<div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                           {res.Icon ? <img src={res.Icon} alt="icon" className="w-6 h-6 object-contain drop-shadow-md" /> :`,
  `<div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                           {res.Extension === 'math' ? <Calculator className={\`w-5 h-5 \${curTheme.text}\`} /> :
                            res.Icon ? <img src={res.Icon} alt="icon" className="w-6 h-6 object-contain drop-shadow-md" /> :`
);

// close the ternary
content = content.replace(
  `<FileText className="w-5 h-5 text-gray-400" />)}
                        </div>`,
  `<FileText className="w-5 h-5 text-gray-400" />)}
                        </div>`
); // already handled nicely with nested ternaries if we add the trailing bracket properly.
// wait, the previous code was:
// {res.Icon ? ... : (res.Extension === '.lnk' ? ... : res.Extension === '' ? ... : <FileText />)}

// Let's precisely patch the icon logic using regex
const iconRegex = /{res\.Icon \? <img src=\{res\.Icon\}.*?<\/FileText className="w-5 h-5 text-gray-400" \/>\)\}/s;
const newIconLogic = `{res.Extension === 'math' ? <Calculator className={\`w-5 h-5 \${curTheme.text}\`} /> : res.Icon ? <img src={res.Icon} alt="icon" className="w-6 h-6 object-contain drop-shadow-md" /> : (res.Extension === '.lnk' || res.Extension === '.exe' ? <AppWindow className={\`w-5 h-5 \${curTheme.text}\`} /> : res.Extension === '' ? <Folder className={\`w-5 h-5 text-yellow-500\`} /> : <FileText className="w-5 h-5 text-gray-400" />)}`;
content = content.replace(iconRegex, newIconLogic);


fs.writeFileSync('c:/LowWrite/src/App.tsx', content, 'utf8');
console.log("App.tsx Raycast Keyboard and Math successfully patched!");
