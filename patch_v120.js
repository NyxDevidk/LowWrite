const fs = require('fs');
let content = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

// =====================================================================
// 1. UPDATE TYPES
// =====================================================================
content = content.replace(
  `      execSystemCommand: (command: string) => Promise<boolean>;`,
  `` // already there, skip if already present
);

// Add execSystemCommand type if not there
if (!content.includes('execSystemCommand')) {
  content = content.replace(
    `      setDiscordRPC: (options: any) => Promise<boolean>;`,
    `      setDiscordRPC: (options: any) => Promise<boolean>;\n      execSystemCommand: (command: string) => Promise<boolean>;`
  );
}

// =====================================================================
// 2. ADD STATES
// =====================================================================
content = content.replace(
  `  const [appVersion, setAppVersion] = useState('');`,
  `  const [appVersion, setAppVersion] = useState('');
  const [snippets, setSnippets] = useState<{trigger: string; expansion: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('snippets') || '[]'); } catch { return []; }
  });
  const [newSnippetTrigger, setNewSnippetTrigger] = useState('');
  const [newSnippetExpansion, setNewSnippetExpansion] = useState('');
  const [refineHistory, setRefineHistory] = useState<{text: string; result: string; date: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('refineHistory') || '[]'); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);`
);

// =====================================================================
// 3. PERSIST SNIPPETS
// =====================================================================
content = content.replace(
  `useEffect(() => localStorage.setItem('geminiApiKey', geminiApiKey), [geminiApiKey]);`,
  `useEffect(() => localStorage.setItem('geminiApiKey', geminiApiKey), [geminiApiKey]);
  useEffect(() => localStorage.setItem('snippets', JSON.stringify(snippets)), [snippets]);
  useEffect(() => localStorage.setItem('refineHistory', JSON.stringify(refineHistory)), [refineHistory]);`
);

// =====================================================================
// 4. SNIPPET EXPANSION IN THE REFINE TEXT AREA KEYDOWN
// =====================================================================
// Look for the refine text area onChange handler to add snippet expansion
const textAreaTarget = `onChange={(e) => setText(e.target.value)}`;
const textAreaReplacement = `onChange={(e) => {
                    const val = e.target.value;
                    // Snippet expansion: check if last word matches a trigger
                    if (val.endsWith(' ') || val.endsWith('\\t')) {
                      const words = val.trimEnd().split(/\\s+/);
                      const lastWord = words[words.length - 1];
                      const snippet = snippets.find(s => s.trigger === lastWord);
                      if (snippet) {
                        words[words.length - 1] = snippet.expansion;
                        setText(words.join(' ') + ' ');
                        return;
                      }
                    }
                    setText(val);
                  }}`;
content = content.replace(textAreaTarget, textAreaReplacement);

// =====================================================================
// 5. SAVE TO HISTORY WHEN RESULT IS RECEIVED
// =====================================================================
content = content.replace(
  `setResult(response);`,
  `setResult(response);
        setRefineHistory(prev => {
          const newEntry = { text: text.substring(0, 100), result: response.substring(0, 200), date: new Date().toLocaleString('pt-BR') };
          return [newEntry, ...prev].slice(0, 20); // keep last 20
        });`
);

// =====================================================================
// 6. SEARCH: SYSTEM COMMANDS + PASSWORD GENERATOR
// =====================================================================
// Find the math interceptor we added before and add system commands + password alongside it
const mathTarget = `// Mod Raycast: Math evaluation
      try {
        if (/^[0-9+\\-*/().\\s]+$/.test(searchQuery) && searchQuery.trim().length > 2) {`;

const systemCommandsPrefix = `
      // System Commands (lock, sleep, restart, shutdown)
      const sysCommands: Record<string, {label: string; icon: string; cmd: string}> = {
        lock: { label: 'Lock Screen', icon: '🔒', cmd: 'lock' },
        sleep: { label: 'Sleep Computer', icon: '😴', cmd: 'sleep' },
        restart: { label: 'Restart Computer', icon: '🔄', cmd: 'restart' },
        shutdown: { label: 'Shut Down Computer', icon: '⏻', cmd: 'shutdown' },
      };
      const sysKey = searchQuery.trim().toLowerCase();
      if (sysCommands[sysKey]) {
        const sc = sysCommands[sysKey];
        setSearchResults([{ Name: sc.label, FullName: 'syscmd:' + sc.cmd, Extension: 'syscmd', Icon: null }]);
        setIsSearching(false);
        setSelectedIndex(0);
        return;
      }

      // Password Generator (e.g. "password 16")
      const pwdMatch = searchQuery.trim().match(/^password (\\d+)$/i);
      if (pwdMatch) {
        const len = Math.min(Math.max(parseInt(pwdMatch[1]), 4), 128);
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
        const pw = Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        setSearchResults([{ Name: pw, FullName: 'password', Extension: 'password', Icon: null }]);
        setIsSearching(false);
        setSelectedIndex(0);
        return;
      }

`;

content = content.replace(mathTarget, systemCommandsPrefix + mathTarget);

// =====================================================================
// 7. HANDLE ENTER KEY FOR SYSTEM COMMANDS AND PASSWORD
// =====================================================================
content = content.replace(
  `if (e.key === 'Enter' && searchResults.length > 0) {
                      const item = searchResults[selectedIndex];
                      if (item.Extension !== 'math') {
                        window.electron.openFile(item.FullName);
                      } else {
                        navigator.clipboard.writeText(item.Name.replace('= ', ''));
                        setSearchQuery('');
                      }
                    }`,
  `if (e.key === 'Enter' && searchResults.length > 0) {
                      const item = searchResults[selectedIndex];
                      if (item.Extension === 'math') {
                        navigator.clipboard.writeText(item.Name.replace('= ', ''));
                        setSearchQuery('');
                      } else if (item.Extension === 'syscmd') {
                        const cmd = item.FullName.replace('syscmd:', '');
                        window.electron?.execSystemCommand?.(cmd);
                        setSearchQuery('');
                      } else if (item.Extension === 'password') {
                        navigator.clipboard.writeText(item.Name);
                        setSearchQuery('');
                        setSearchResults([]);
                      } else {
                        window.electron.openFile(item.FullName);
                      }
                    }`
);

// =====================================================================
// 8. RENDER SPECIAL ICONS FOR SYSTEM COMMANDS AND PASSWORD
// add icon rendering text for syscmd/password in the result list rendering
// =====================================================================
content = content.replace(
  `{res.Extension === 'math' ? <Calculator className={\`w-5 h-5 \${curTheme.text}\`} /> : res.Icon ?`,
  `{res.Extension === 'syscmd' ? <span className="text-xl">{res.Name.includes('Lock') ? '🔒' : res.Name.includes('Sleep') ? '😴' : res.Name.includes('Restart') ? '🔄' : '⏻'}</span> :
                            res.Extension === 'password' ? <span className="text-xl">🔑</span> :
                            res.Extension === 'math' ? <Calculator className={\`w-5 h-5 \${curTheme.text}\`} /> : res.Icon ?`
);

// Fix the closing bracket count: additional ternaries need one more parenthesis at the end
// Find the existing closing and add extra )
content = content.replace(
  `<FileText className="w-5 h-5 text-gray-400" />)}
                        </div>`,
  `<FileText className="w-5 h-5 text-gray-400" />))}
                        </div>`
);

// =====================================================================
// 9. ADD SECONDARY INFO LINE FOR SPECIAL RESULTS
// =====================================================================
content = content.replace(
  `<p className={\`text-[11px] text-gray-500\`}>{res.Extension || 'File'}</p>`,
  `<p className={\`text-[11px] text-gray-500\`}>{
                                res.Extension === 'syscmd' ? 'Press Enter to execute' :
                                res.Extension === 'password' ? 'Press Enter to copy' :
                                res.Extension === 'math' ? 'Press Enter to copy' :
                                res.Extension || 'File'
                              }</p>`
);

fs.writeFileSync('c:/LowWrite/src/App.tsx', content, 'utf8');
console.log('Phase 1 patched — System Commands, Password, Snippets states, History states');
