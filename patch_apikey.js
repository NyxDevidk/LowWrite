const fs = require('fs');

let content = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

// 1. Add Type for the window.electron functions mapping
content = content.replace(
  `improveText: (text: string, tone: string, customInstruction?: string, options?: any) => Promise<string>;
      sendChatMessage: (history: ChatMessage[], newMessage: string, customInstruction?: string, options?: any) => Promise<string>;`,
  `improveText: (apiKey: string, text: string, tone: string, customInstruction?: string, options?: any) => Promise<string>;
      sendChatMessage: (apiKey: string, history: ChatMessage[], newMessage: string, customInstruction?: string, options?: any) => Promise<string>;`
);

// 2. Add State for the API Key
content = content.replace(
  `const [customInstruction, setCustomInstruction] = useState(() => localStorage.getItem('customInstruction') || '');`,
  `const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');\n  const [customInstruction, setCustomInstruction] = useState(() => localStorage.getItem('customInstruction') || '');`
);

// 3. Add Effect to Store the API Key
content = content.replace(
  `useEffect(() => localStorage.setItem('customInstruction', customInstruction), [customInstruction]);`,
  `useEffect(() => localStorage.setItem('geminiApiKey', geminiApiKey), [geminiApiKey]);\n  useEffect(() => localStorage.setItem('customInstruction', customInstruction), [customInstruction]);`
);

// 4. Update the IPC Calls to pass geminiApiKey
content = content.replace(
  `const improved = await window.electron.improveText(text, tone, customInstruction, { temperature: aiTemp });`,
  `const improved = await window.electron.improveText(geminiApiKey, text, tone, customInstruction, { temperature: aiTemp });`
);

content = content.replace(
  `const responseText = await window.electron.sendChatMessage(chatHistory, newMessage, customInstruction, { temperature: aiTemp });`,
  `const responseText = await window.electron.sendChatMessage(geminiApiKey, chatHistory, newMessage, customInstruction, { temperature: aiTemp });`
);

// 5. Add the Settings UI block
const apiKeyUI = `
            {/* Gemini API Key Configuration */}
            <div className="flex flex-col gap-3 p-5 bg-white/5 rounded-2xl border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 opacity-80" strokeWidth={2} />
                Google Gemini API Key
              </label>
              <div>
                 <span className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 flex justify-between">Secret Key <a href="javascript:void(0)" onClick={()=>handleOpenFile('https://aistudio.google.com/app/apikey')} className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer lowercase" title="Get your free API Key at Google AI Studio">(get free key)</a></span>
                 <input 
                   type="password"
                   className={\`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white outline-none focus:border-emerald-500/50 transition-colors placeholder-gray-600 font-mono\`}
                   value={geminiApiKey} 
                   onChange={(e)=>setGeminiApiKey(e.target.value.trim())} 
                   placeholder="AIzaSy..." 
                 />
                 <p className="text-[10px] text-gray-500 mt-2 ml-1">Your key is stored locally on your machine and sent directly to Google. We do not track or save your keys.</p>
              </div>
            </div>
`;
content = content.replace(`{/* Custom Instruction Box */}`, apiKeyUI + `\n            {/* Custom Instruction Box */}`);

fs.writeFileSync('c:/LowWrite/src/App.tsx', content, 'utf8');
console.log("App.tsx patched for API Key.");
