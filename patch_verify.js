const fs = require('fs');

let content = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

// 1. Imports
content = content.replace(
  `import { Sparkles, MessageSquare, Settings, Check, Send, Copy, Trash2, Edit3, Type, Zap, Bot, PaintBucket, Search, Folder, AppWindow, FileText, ChevronRight, ExternalLink, Gamepad2 } from 'lucide-react';`,
  `import { Sparkles, MessageSquare, Settings, Check, Send, Copy, Trash2, Edit3, Type, Zap, Bot, PaintBucket, Search, Folder, AppWindow, FileText, ChevronRight, ExternalLink, Gamepad2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';`
);

// 2. Types
content = content.replace(
  `showInFolder: (path: string) => Promise<void>;`,
  `showInFolder: (path: string) => Promise<void>;\n      verifyApiKey: (apiKey: string) => Promise<{success: boolean, error?: string}>;`
);

// 3. States
content = content.replace(
  `const [customInstruction, setCustomInstruction] = useState(() => localStorage.getItem('customInstruction') || '');`,
  `const [customInstruction, setCustomInstruction] = useState(() => localStorage.getItem('customInstruction') || '');\n  const [keyStatus, setKeyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');\n  const [keyError, setKeyError] = useState('');`
);

// 4. Effects
const verifyEffect = `
  useEffect(() => {
    if (!geminiApiKey || geminiApiKey.length < 10) {
      setKeyStatus('idle');
      setKeyError('');
      return;
    }
    setKeyStatus('checking');
    const delay = setTimeout(async () => {
      try {
        const res = await window.electron.verifyApiKey(geminiApiKey);
        if (res.success) {
           setKeyStatus('valid');
           setKeyError('');
        } else {
           setKeyStatus('invalid');
           setKeyError(res.error || 'Invalid API Key');
        }
      } catch (err: any) {
         setKeyStatus('invalid');
         setKeyError(err.message || 'Error parsing key');
      }
    }, 800);
    return () => clearTimeout(delay);
  }, [geminiApiKey]);
`;

content = content.replace(
  `useEffect(() => localStorage.setItem('geminiApiKey', geminiApiKey), [geminiApiKey]);`,
  `useEffect(() => localStorage.setItem('geminiApiKey', geminiApiKey), [geminiApiKey]);\n${verifyEffect}`
);

// 5. Settings UI HTML
const searchTarget = `<p className="text-[10px] text-gray-500 mt-2 ml-1">Your key is stored locally on your machine and sent directly to Google. We do not track or save your keys.</p>`;

const appendUI = `
                 {keyStatus !== 'idle' && (
                   <div className={\`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-medium transition-all \${
                     keyStatus === 'checking' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                     keyStatus === 'valid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                     'bg-red-500/10 border-red-500/20 text-red-400'
                   }\`}>
                     {keyStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
                     {keyStatus === 'valid' && <CheckCircle2 className="w-4 h-4" />}
                     {keyStatus === 'invalid' && <XCircle className="w-4 h-4 shrink-0" />}
                     <span className="truncate">
                       {keyStatus === 'checking' && 'Verificando chave e conectando ao Google...'}
                       {keyStatus === 'valid' && 'API Key Válida! Conectado com sucesso.'}
                       {keyStatus === 'invalid' && \`Erro: \${keyError}\`}
                     </span>
                   </div>
                 )}
`;

content = content.replace(searchTarget, searchTarget + '\\n' + appendUI);

fs.writeFileSync('c:/LowWrite/src/App.tsx', content, 'utf8');
console.log("App.tsx patched for API Verification.");
