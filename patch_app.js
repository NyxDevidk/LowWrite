const fs = require('fs');

let content = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

// 1. Imports
content = content.replace(
  `import { Sparkles, MessageSquare, Settings, Check, Send, Copy, Trash2, Edit3, Type, Zap, Bot, PaintBucket } from 'lucide-react';`,
  `import { Sparkles, MessageSquare, Settings, Check, Send, Copy, Trash2, Edit3, Type, Zap, Bot, PaintBucket, Search, Folder, AppWindow, FileText, ChevronRight, ExternalLink } from 'lucide-react';`
);

// 2. Types
content = content.replace(
  `setAutoLaunch: (enable: boolean) => Promise<void>;`,
  `setAutoLaunch: (enable: boolean) => Promise<void>;
      searchFiles: (query: string, filter: string) => Promise<any[]>;
      openFile: (path: string) => Promise<void>;
      showInFolder: (path: string) => Promise<void>;`
);

// 3. activeTab
content = content.replace(
  `const [activeTab, setActiveTab] = useState<'refine' | 'chat' | 'settings'>('refine');`,
  `const [activeTab, setActiveTab] = useState<'search' | 'refine' | 'chat' | 'settings'>('search');`
);

// 4. Search State
content = content.replace(
  `// Chat State`,
  `// Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'apps' | 'documents'>('apps');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Chat State`
);

// 5. Effects Focus
content = content.replace(
  `if (activeTab === 'refine') setTimeout(() => inputRef.current?.focus(), 50);
    else if (activeTab === 'chat') setTimeout(() => chatInputRef.current?.focus(), 50);`,
  `if (activeTab === 'refine') setTimeout(() => inputRef.current?.focus(), 50);
    else if (activeTab === 'chat') setTimeout(() => chatInputRef.current?.focus(), 50);
    else if (activeTab === 'search') setTimeout(() => searchInputRef.current?.focus(), 50);`
);

content = content.replace(
  `if (activeTab === 'refine') inputRef.current?.focus();
       else if (activeTab === 'chat') chatInputRef.current?.focus();`,
  `if (activeTab === 'search') searchInputRef.current?.focus();
       else if (activeTab === 'refine') inputRef.current?.focus();
       else if (activeTab === 'chat') chatInputRef.current?.focus();`
);

content = content.replace(
  `if (e.key === '1') { e.preventDefault(); setActiveTab('refine'); }
        if (e.key === '2') { e.preventDefault(); setActiveTab('chat'); }
        if (e.key === '3') { e.preventDefault(); setActiveTab('settings'); }`,
  `if (e.key === '1') { e.preventDefault(); setActiveTab('search'); }
        if (e.key === '2') { e.preventDefault(); setActiveTab('refine'); }
        if (e.key === '3') { e.preventDefault(); setActiveTab('chat'); }
        if (e.key === '4') { e.preventDefault(); setActiveTab('settings'); }`
);

content = content.replace(
  `else if (activeTab === 'settings') setActiveTab('refine');`,
  `else if (activeTab === 'search' && searchQuery.length > 0) { setSearchQuery(''); setSearchResults([]); }
        else if (activeTab === 'settings') setActiveTab('search');`
);

// 6. Actions
content = content.replace(
  `// Actions
  const toggleAutoLaunch = async () => {`,
  `// Actions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await window.electron.searchFiles(searchQuery, searchFilter);
        setSearchResults(res || []);
      } catch (err) { console.error(err); }
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchFilter]);

  const handleOpenFile = (path: string) => {
     window.electron.openFile(path);
  };
  const handleShowInFolder = (path: string, e: React.MouseEvent) => {
     e.stopPropagation();
     window.electron.showInFolder(path);
  };

  const toggleAutoLaunch = async () => {`
);

// 7. Nav Tabs
const oldNav = `<div className="flex shrink-0 border-b border-white/[0.06] bg-black/40" style={{ WebkitAppRegion: 'drag' } as any}>
            <button onClick={() => setActiveTab('refine')} title="Ctrl+1" className={\`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 \${activeTab === 'refine' ? \`\${curTheme.text} border-b-2 border-current bg-white/[0.04] shadow-[inset_0_2px_10px_rgba(255,255,255,0.01)]\` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}\`} style={{ WebkitAppRegion: 'no-drag' } as any}>
              <Sparkles className="w-4 h-4 opacity-80" strokeWidth={2} />Refine
            </button>
            <button onClick={() => setActiveTab('chat')} title="Ctrl+2" className={\`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 \${activeTab === 'chat' ? \`\${curTheme.text} border-b-2 border-current bg-white/[0.04] shadow-[inset_0_2px_10px_rgba(255,255,255,0.01)]\` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}\`} style={{ WebkitAppRegion: 'no-drag' } as any}>
              <MessageSquare className="w-4 h-4 opacity-80" strokeWidth={2} />Chat
            </button>
            <button onClick={() => setActiveTab('settings')} title="Ctrl+3" className={\`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 \${activeTab === 'settings' ? \`\${curTheme.text} border-b-2 border-current bg-white/[0.04] shadow-[inset_0_2px_10px_rgba(255,255,255,0.01)]\` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}\`} style={{ WebkitAppRegion: 'no-drag' } as any}>
              <Settings className="w-4 h-4 opacity-80" strokeWidth={2} />Settings
            </button>
        </div>`;

const newNav = `<div className="flex shrink-0 border-b border-white/[0.06] bg-black/40" style={{ WebkitAppRegion: 'drag' } as any}>
            <button onClick={() => setActiveTab('search')} title="Ctrl+1" className={\`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 \${activeTab === 'search' ? \`\${curTheme.text} border-b-2 border-current bg-white/[0.04] shadow-[inset_0_2px_10px_rgba(255,255,255,0.01)]\` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}\`} style={{ WebkitAppRegion: 'no-drag' } as any}>
              <Search className="w-4 h-4 opacity-80" strokeWidth={2} />Search
            </button>
            <button onClick={() => setActiveTab('refine')} title="Ctrl+2" className={\`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 \${activeTab === 'refine' ? \`\${curTheme.text} border-b-2 border-current bg-white/[0.04] shadow-[inset_0_2px_10px_rgba(255,255,255,0.01)]\` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}\`} style={{ WebkitAppRegion: 'no-drag' } as any}>
              <Sparkles className="w-4 h-4 opacity-80" strokeWidth={2} />Refine
            </button>
            <button onClick={() => setActiveTab('chat')} title="Ctrl+3" className={\`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 \${activeTab === 'chat' ? \`\${curTheme.text} border-b-2 border-current bg-white/[0.04] shadow-[inset_0_2px_10px_rgba(255,255,255,0.01)]\` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}\`} style={{ WebkitAppRegion: 'no-drag' } as any}>
              <MessageSquare className="w-4 h-4 opacity-80" strokeWidth={2} />Chat
            </button>
            <button onClick={() => setActiveTab('settings')} title="Ctrl+4" className={\`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 \${activeTab === 'settings' ? \`\${curTheme.text} border-b-2 border-current bg-white/[0.04] shadow-[inset_0_2px_10px_rgba(255,255,255,0.01)]\` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}\`} style={{ WebkitAppRegion: 'no-drag' } as any}>
              <Settings className="w-4 h-4 opacity-80" strokeWidth={2} />Settings
            </button>
        </div>`;

content = content.replace(oldNav, newNav);

// 8. Search UI Tab
const searchTabUI = \`
        {/* -------------------- SEARCH TAB -------------------- */}
        {activeTab === 'search' && (
          <div className="flex flex-col h-[420px] animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ WebkitAppRegion: 'no-drag' } as any}>
            
            <div className="flex items-center px-6 py-5 border-b border-white/[0.06] bg-black/10 transition-all duration-300">
               <Search className={\`w-6 h-6 \${curTheme.text} mr-4 opacity-80\`} strokeWidth={2} />
               <input
                 ref={searchInputRef}
                 className="flex-1 bg-transparent text-2xl font-light text-white outline-none placeholder-gray-500/80"
                 placeholder="Search for apps, files..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 spellCheck={false}
               />
               {isSearching && <div className={\`w-5 h-5 border-2 \${curTheme.border} border-t-current \${curTheme.text} rounded-full animate-spin\`}></div>}
            </div>

            <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.04] bg-gradient-to-b from-white/[0.03] to-transparent">
               <button onClick={()=>setSearchFilter('all')} className={\`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md transition-all \${searchFilter === 'all' ? \`\${curTheme.bgLight} \${curTheme.text} \${curTheme.border} border\` : 'bg-white/5 text-gray-500 hover:text-gray-300'}\`}>All</button>
               <button onClick={()=>setSearchFilter('apps')} className={\`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md transition-all \${searchFilter === 'apps' ? \`\${curTheme.bgLight} \${curTheme.text} \${curTheme.border} border\` : 'bg-white/5 text-gray-500 hover:text-gray-300'}\`}>Apps</button>
               <button onClick={()=>setSearchFilter('documents')} className={\`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md transition-all \${searchFilter === 'documents' ? \`\${curTheme.bgLight} \${curTheme.text} \${curTheme.border} border\` : 'bg-white/5 text-gray-500 hover:text-gray-300'}\`}>Documents</button>
            </div>

            <div className="flex-1 overflow-y-auto bg-black/30 p-2">
               {searchResults.length === 0 && searchQuery.length > 0 && !isSearching ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-60">
                     <Search className="w-10 h-10 mb-4 text-gray-500" />
                     <p className="text-sm font-medium text-gray-400">No results found.</p>
                  </div>
               ) : searchResults.length === 0 && searchQuery.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-60">
                     <div className={\`w-16 h-16 \${curTheme.bgLight} \${curTheme.text} rounded-full flex items-center justify-center mb-4 \${curTheme.border} shadow-inner\`}>
                       <AppWindow className="w-8 h-8" strokeWidth={1.5} />
                     </div>
                     <p className="text-sm font-medium text-gray-300 tracking-wide">Type to search your system</p>
                  </div>
               ) : (
                 <div className="flex flex-col gap-1 px-3 py-2">
                   {searchResults.map((res: any, idx: number) => (
                     <button
                        key={idx}
                        onClick={() => handleOpenFile(res.FullName)}
                        className="group flex flex-col items-start px-4 py-3 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/5"
                     >
                        <div className="flex items-center w-full justify-between">
                           <div className="flex items-center gap-3">
                              {res.Extension === '.lnk' || res.Extension === '.exe' ? <AppWindow className={\`w-5 h-5 \${curTheme.text}\`} /> : 
                               res.Extension === '' ? <Folder className={\`w-5 h-5 text-yellow-500\`} /> : 
                               <FileText className="w-5 h-5 text-gray-400" />}
                              <span className="text-[14px] font-semibold text-gray-200">{res.Name.replace('.lnk', '')}</span>
                           </div>
                           <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                              <span onClick={(e) => handleShowInFolder(res.FullName, e)} className="text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded bg-black/40 border border-white/10 flex items-center gap-1" title="Show in Folder">
                                 <ExternalLink className="w-3 h-3" /> Show
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                           </div>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 ml-8 truncate max-w-[90%] text-left font-mono">{res.FullName}</span>
                     </button>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}
\n        {/* -------------------- REFINE TAB -------------------- */}
\`;

content = content.replace(\`{/* -------------------- REFINE TAB -------------------- */}\`, searchTabUI);

fs.writeFileSync('c:/LowWrite/src/App.tsx', content, 'utf8');
console.log('App.tsx patched successfully for Search tab');
