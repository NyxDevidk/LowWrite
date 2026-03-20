const fs = require('fs');

let content = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

// 1. Imports
content = content.replace(
  `import { Sparkles, MessageSquare, Settings, Check, Send, Copy, Trash2, Edit3, Type, Zap, Bot, PaintBucket, Search, Folder, AppWindow, FileText, ChevronRight, ExternalLink } from 'lucide-react';`,
  `import { Sparkles, MessageSquare, Settings, Check, Send, Copy, Trash2, Edit3, Type, Zap, Bot, PaintBucket, Search, Folder, AppWindow, FileText, ChevronRight, ExternalLink, Gamepad2 } from 'lucide-react';`
);

// 2. Types
content = content.replace(
  `showInFolder: (path: string) => Promise<void>;`,
  `showInFolder: (path: string) => Promise<void>;\n      setDiscordRPC: (options: any) => Promise<boolean>;`
);

// 3. States
content = content.replace(
  `const [customInstruction, setCustomInstruction] = useState(() => localStorage.getItem('customInstruction') || '');`,
  `const [customInstruction, setCustomInstruction] = useState(() => localStorage.getItem('customInstruction') || '');\n  const [discordEnabled, setDiscordEnabled] = useState(() => localStorage.getItem('discordEnabled') === 'true');\n  const [discordClientId, setDiscordClientId] = useState(() => localStorage.getItem('discordClientId') || '13524680879483321');\n  const [discordDetails, setDiscordDetails] = useState(() => localStorage.getItem('discordDetails') || 'Writing an Epic Novel');\n  const [discordState, setDiscordState] = useState(() => localStorage.getItem('discordState') || 'Using Low Write App');`
);

// 4. Effects
content = content.replace(
  `useEffect(() => localStorage.setItem('customInstruction', customInstruction), [customInstruction]);`,
  `useEffect(() => localStorage.setItem('customInstruction', customInstruction), [customInstruction]);\n  useEffect(() => localStorage.setItem('discordEnabled', discordEnabled.toString()), [discordEnabled]);\n  useEffect(() => localStorage.setItem('discordClientId', discordClientId), [discordClientId]);\n  useEffect(() => localStorage.setItem('discordDetails', discordDetails), [discordDetails]);\n  useEffect(() => localStorage.setItem('discordState', discordState), [discordState]);\n\n  useEffect(() => {\n    if (window.electron.setDiscordRPC) {\n      window.electron.setDiscordRPC({ clientId: discordClientId, details: discordDetails, state: discordState, enabled: discordEnabled });\n    }\n  }, [discordEnabled, discordClientId, discordDetails, discordState]);`
);

// 5. Settings HTML
const discordUI = `
            {/* Discord Rich Presence */}
            <div className="flex flex-col gap-3 p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setDiscordEnabled(!discordEnabled)}>
                <label className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-2 cursor-pointer">
                  <Gamepad2 className="w-4 h-4 text-indigo-400 opacity-80" strokeWidth={2} />
                  Discord Rich Presence
                </label>
                <div className={\`relative inline-flex h-5 w-9 items-center rounded-full transition-colors \${discordEnabled ? 'bg-indigo-500' : 'bg-black/50 border border-white/10'}\`}>
                   <span className={\`inline-block h-3 w-3 transform rounded-full transition-transform \${discordEnabled ? 'translate-x-5 bg-white shadow-md' : 'translate-x-1 bg-gray-500'}\`} />
                </div>
              </div>
              
              {discordEnabled && (
                <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-3">
                     <div className="flex-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Details (Line 1)</span>
                        <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-indigo-500/50 transition-colors placeholder-gray-600" value={discordDetails} onChange={(e)=>setDiscordDetails(e.target.value)} placeholder="E.g. Writing an Epic Novel" />
                     </div>
                     <div className="flex-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">State (Line 2)</span>
                        <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-indigo-500/50 transition-colors placeholder-gray-600" value={discordState} onChange={(e)=>setDiscordState(e.target.value)} placeholder="E.g. Editing Chapter 4" />
                     </div>
                  </div>
                  <div>
                     <span className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 flex justify-between">Application Client ID <a href="javascript:void(0)" onClick={()=>handleOpenFile('https://discord.com/developers/applications')} className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer lowercase" title="Create your own app ID on Discord Developer Portal to add custom images">(create one)</a></span>
                     <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-gray-300 outline-none focus:border-indigo-500/50 transition-colors placeholder-gray-600" value={discordClientId} onChange={(e)=>setDiscordClientId(e.target.value.replace(/\\D/g, ''))} placeholder="Client ID (e.g. 1234567890)" />
                  </div>
                </div>
              )}
            </div>
            
            {/* System Actions */}`;

content = content.replace(`{/* System Actions */}`, discordUI);

fs.writeFileSync('c:/LowWrite/src/App.tsx', content, 'utf8');
console.log("App.tsx patched for Discord RPC.");
