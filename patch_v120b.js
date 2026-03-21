const fs = require('fs');
let content = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

// ================================================================
// 1. ADD SNIPPETS SECTION IN SETTINGS TAB
// before the Discord section
// ================================================================
const discordSection = `            {/* Discord Rich Presence */}
            <div className="flex flex-col gap-3 p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20`;

const snippetsUI = `            {/* Snippets Manager */}
            <div className="flex flex-col gap-3 p-5 bg-white/5 rounded-2xl border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-2">
                <Type className="w-4 h-4 text-white opacity-80" strokeWidth={2} />
                Snippets / Text Shortcuts
              </label>
              <p className="text-[10px] text-gray-500 -mt-1">Type a trigger (e.g. <code className="bg-white/10 px-1 rounded">/email</code>) in the Refine box and press Space to expand.</p>
              <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                {snippets.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                    <code className={\`text-[11px] font-mono \${curTheme.text} shrink-0\`}>{s.trigger}</code>
                    <span className="text-gray-500 text-xs shrink-0">→</span>
                    <span className="text-gray-300 text-[11px] truncate flex-1">{s.expansion}</span>
                    <button onClick={() => setSnippets(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-xs font-bold shrink-0">✕</button>
                  </div>
                ))}
                {snippets.length === 0 && <p className="text-gray-600 text-[11px] ml-1">No snippets yet. Add one below!</p>}
              </div>
              <div className="flex gap-2 mt-1">
                <input
                  className="w-28 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-white outline-none focus:border-white/30 transition-colors placeholder-gray-600"
                  placeholder="/trigger"
                  value={newSnippetTrigger}
                  onChange={e => setNewSnippetTrigger(e.target.value)}
                />
                <input
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-white/30 transition-colors placeholder-gray-600"
                  placeholder="Expansion text..."
                  value={newSnippetExpansion}
                  onChange={e => setNewSnippetExpansion(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (!newSnippetTrigger.trim() || !newSnippetExpansion.trim()) return;
                    setSnippets(prev => [...prev, { trigger: newSnippetTrigger.trim(), expansion: newSnippetExpansion.trim() }]);
                    setNewSnippetTrigger('');
                    setNewSnippetExpansion('');
                  }}
                  className={\`px-4 py-2 rounded-lg \${curTheme.btn} text-white text-xs font-bold hover:opacity-90 transition-all\`}
                >Add</button>
              </div>
            </div>

`;

content = content.replace(discordSection, snippetsUI + discordSection);

// ================================================================
// 2. ADD HISTORY PANEL IN THE REFINE TAB (shows when showHistory=true)
// Find the result display area and add toggle button + history panel
// ================================================================
// First, add a History toggle button inside the refine tab header area
const refineHeaderTarget = `<button onClick={() => setResult('')} className="text-gray-500 hover:text-red-400 transition-colors" title="Clear">
                 <Trash2 className="w-4 h-4" strokeWidth={2} />
               </button>`;

const refineHeaderReplacement = `<button onClick={() => setShowHistory(h => !h)} className={\`transition-colors \${showHistory ? curTheme.text : 'text-gray-500 hover:text-white'}\`} title="History">
                 <Edit3 className="w-4 h-4" strokeWidth={2} />
               </button>
               <button onClick={() => setResult('')} className="text-gray-500 hover:text-red-400 transition-colors" title="Clear">
                 <Trash2 className="w-4 h-4" strokeWidth={2} />
               </button>`;

content = content.replace(refineHeaderTarget, refineHeaderReplacement);

// Add the history panel where results are shown (before the regular result)
const resultAreaStart = `{/* Result Display */}
           {result && !isRefining && (`;

const historyPanel = `{/* Refinement History Panel */}
           {showHistory && refineHistory.length > 0 && (
             <div className="p-4 flex flex-col gap-2 overflow-y-auto flex-1 animate-in fade-in duration-300">
               <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Recent Refinements</p>
               {refineHistory.map((h, i) => (
                 <button
                   key={i}
                   onClick={() => { setText(h.result); setResult(''); setShowHistory(false); }}
                   className="text-left w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.05] transition-all group"
                 >
                   <p className="text-[10px] text-gray-500 mb-1">{h.date}</p>
                   <p className="text-[12px] text-gray-300 truncate group-hover:text-white transition-colors">{h.result}</p>
                 </button>
               ))}
             </div>
           )}
           {showHistory && refineHistory.length === 0 && (
             <div className="flex-1 flex items-center justify-center">
               <p className="text-gray-600 text-sm">No history yet. Refine some text first!</p>
             </div>
           )}

           `;

content = content.replace(resultAreaStart, historyPanel + resultAreaStart);

fs.writeFileSync('c:/LowWrite/src/App.tsx', content, 'utf8');
console.log('Phase 2 done — Snippets Manager UI + Refine History panel injected.');
