import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, MessageSquare, Settings, Check, Send, Copy, Trash2, Edit3, Type, Zap, Bot, PaintBucket, Search, Folder, AppWindow, FileText, ChevronRight, ExternalLink, Gamepad2, CheckCircle2, XCircle, Loader2, Calculator } from 'lucide-react';

// --- Types & Config ---
type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

declare global {
  interface Window {
    electron: {
      improveText: (apiKey: string, text: string, tone: string, customInstruction?: string, options?: any) => Promise<string>;
      sendChatMessage: (apiKey: string, history: ChatMessage[], newMessage: string, customInstruction?: string, options?: any) => Promise<string>;
      getAutoLaunch: () => Promise<boolean>;
      getAppVersion: () => Promise<string>;
      checkForUpdates: () => Promise<void>;
      setAutoLaunch: (enable: boolean) => Promise<void>;
      searchFiles: (query: string, filter: string) => Promise<any[]>;
      openFile: (path: string) => Promise<void>;
      showInFolder: (path: string) => Promise<void>;
      verifyApiKey: (apiKey: string) => Promise<{success: boolean, error?: string}>;
      onClipboardText: (callback: (text: string) => void) => void;
      setDiscordRPC: (options: any) => Promise<boolean>;
      execSystemCommand: (command: string) => Promise<boolean>;
    };
  }
}

type ThemeConfig = {
  id: string;
  name: string;
  colorHex: string;
  text: string;
  bgLight: string;
  border: string;
  btn: string;
  btnHover: string;
  gradient: string;
  ring: string;
};

const themeOptions: ThemeConfig[] = [
  { id: 'blue', name: 'Midnight', colorHex: '#3b82f6', text: 'text-blue-400', bgLight: 'bg-blue-500/20', border: 'border-blue-500/30', btn: 'bg-blue-600/60', btnHover: 'hover:bg-blue-600/80', gradient: 'from-blue-400 to-indigo-400', ring: 'focus:border-blue-500/50 focus:ring-blue-500/50' },
  { id: 'purple', name: 'Amethyst', colorHex: '#a855f7', text: 'text-purple-400', bgLight: 'bg-purple-500/20', border: 'border-purple-500/30', btn: 'bg-purple-600/60', btnHover: 'hover:bg-purple-600/80', gradient: 'from-purple-400 to-fuchsia-400', ring: 'focus:border-purple-500/50 focus:ring-purple-500/50' },
  { id: 'emerald', name: 'Emerald', colorHex: '#10b981', text: 'text-emerald-400', bgLight: 'bg-emerald-500/20', border: 'border-emerald-500/30', btn: 'bg-emerald-600/60', btnHover: 'hover:bg-emerald-600/80', gradient: 'from-emerald-400 to-teal-400', ring: 'focus:border-emerald-500/50 focus:ring-emerald-500/50' },
  { id: 'rose', name: 'Rose', colorHex: '#f43f5e', text: 'text-rose-400', bgLight: 'bg-rose-500/20', border: 'border-rose-500/30', btn: 'bg-rose-600/60', btnHover: 'hover:bg-rose-600/80', gradient: 'from-rose-400 to-pink-400', ring: 'focus:border-rose-500/50 focus:ring-rose-500/50' },
  { id: 'amber', name: 'Amber', colorHex: '#f59e0b', text: 'text-amber-400', bgLight: 'bg-amber-500/20', border: 'border-amber-500/30', btn: 'bg-amber-600/60', btnHover: 'hover:bg-amber-600/80', gradient: 'from-amber-400 to-orange-400', ring: 'focus:border-amber-500/50 focus:ring-amber-500/50' },
  { id: 'zinc', name: 'Monochrome', colorHex: '#a1a1aa', text: 'text-zinc-300', bgLight: 'bg-zinc-500/20', border: 'border-zinc-500/30', btn: 'bg-zinc-600/60', btnHover: 'hover:bg-zinc-600/80', gradient: 'from-zinc-300 to-gray-400', ring: 'focus:border-zinc-500/50 focus:ring-zinc-500/50' },
  { id: 'rgb', name: 'RGB Gaming', colorHex: '#ff0000', text: 'animate-rgb', bgLight: 'animate-rgb-bg whitespace-nowrap', border: 'animate-rgb-border', btn: 'bg-white/20', btnHover: 'hover:bg-white/30', gradient: 'from-red-500 via-green-500 to-blue-500', ring: 'focus:border-white/50' },
];

const tones = ['Profissional', 'Casual', 'Acadêmico', 'Amigável', 'Criativo'];

// --- Hooks ---
const useTypingEffect = (text: string, speed = 10) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let index = 0;
    setDisplayed('');
    if (!text) return;
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, index));
      index += 3; 
      if (index > text.length + 3) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return displayed;
};

// --- App Component ---
const App: React.FC = () => {
  // Config States
  const [themeId, setThemeId] = useState(() => localStorage.getItem('appTheme') || 'blue');
  const [customColor, setCustomColor] = useState(() => localStorage.getItem('customThemeColor') || '#00e1ff');
  const [activeTab, setActiveTab] = useState<'search' | 'refine' | 'chat' | 'settings'>('search');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [customInstruction, setCustomInstruction] = useState(() => localStorage.getItem('customInstruction') || '');
  const [keyStatus, setKeyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [keyError, setKeyError] = useState('');
  const [discordEnabled, setDiscordEnabled] = useState(() => localStorage.getItem('discordEnabled') === 'true');
  const [discordClientId, setDiscordClientId] = useState(() => localStorage.getItem('discordClientId') || '13524680879483321');
  const [discordDetails, setDiscordDetails] = useState(() => localStorage.getItem('discordDetails') || 'Writing an Epic Novel');
  const [discordState, setDiscordState] = useState(() => localStorage.getItem('discordState') || 'Using Low Write App');
  const [aiTemp, setAiTemp] = useState(() => Number(localStorage.getItem('aiTemperature') || '0.7'));
  const [autoCopy, setAutoCopy] = useState(() => localStorage.getItem('autoCopy') === 'true');
  const [autoLaunch, setAutoLaunchState] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [snippets, setSnippets] = useState<{trigger: string; expansion: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('snippets') || '[]'); } catch { return []; }
  });
  const [newSnippetTrigger, setNewSnippetTrigger] = useState('');
  const [newSnippetExpansion, setNewSnippetExpansion] = useState('');
  const [refineHistory, setRefineHistory] = useState<{text: string; result: string; date: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('refineHistory') || '[]'); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'appearance' | 'ai' | 'snippets' | 'system'>('appearance');
  const [bgTransparency, setBgTransparency] = useState(() => Number(localStorage.getItem('bgTransparency') || '0.8'));
  
  // Custom Theme Generator
  const customThemeObj: ThemeConfig = {
      id: 'custom', name: 'Custom Color', colorHex: customColor,
      text: 'text-custom-theme',
      bgLight: 'bg-custom-theme-light',
      border: 'border-custom-theme-light',
      btn: 'bg-custom-theme-btn',
      btnHover: 'hover-custom-theme-btn',
      gradient: 'custom-theme-gradient',
      ring: 'custom-theme-ring'
  };
  const curTheme = [...themeOptions, customThemeObj].find(t => t.id === themeId) || themeOptions[0];

  // Refine State
  const [text, setText] = useState('');
  const [tone, setTone] = useState('Profissional');
  const [result, setResult] = useState('');
  const typedResult = useTypingEffect(result, 5);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState('');
  const [copied, setCopied] = useState(false);
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'apps' | 'documents'>('apps');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Lifecycles / Effects
  useEffect(() => {
    if (window.electron.getAutoLaunch) {
       window.electron.getAutoLaunch().then(setAutoLaunchState).catch(console.error);
    }
    
    if (activeTab === 'refine') setTimeout(() => inputRef.current?.focus(), 50);
    else if (activeTab === 'chat') setTimeout(() => chatInputRef.current?.focus(), 50);
    else if (activeTab === 'search') setTimeout(() => searchInputRef.current?.focus(), 50);
    
    const handleWindowFocus = () => {
       if (activeTab === 'search') searchInputRef.current?.focus();
       else if (activeTab === 'refine') inputRef.current?.focus();
       else if (activeTab === 'chat') chatInputRef.current?.focus();
    };
    window.addEventListener('focus', handleWindowFocus);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '1') { e.preventDefault(); setActiveTab('search'); }
        if (e.key === '2') { e.preventDefault(); setActiveTab('refine'); }
        if (e.key === '3') { e.preventDefault(); setActiveTab('chat'); }
        if (e.key === '4') { e.preventDefault(); setActiveTab('settings'); }
      }
      
      if (e.key === 'Escape') {
        if (activeTab === 'refine' && text.length > 0) { setText(''); setResult(''); } 
        else if (activeTab === 'chat' && chatInput.length > 0) { setChatInput(''); } 
        else if (activeTab === 'search' && searchQuery.length > 0) { setSearchQuery(''); setSearchResults([]); }
        else if (activeTab === 'settings') setActiveTab('search');
        else window.close(); // Retrai o Spotlight
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('focus', handleWindowFocus);
    }
  }, [activeTab, text, chatInput]);

  useEffect(() => localStorage.setItem('geminiApiKey', geminiApiKey), [geminiApiKey]);
  useEffect(() => localStorage.setItem('bgTransparency', bgTransparency.toString()), [bgTransparency]);
  useEffect(() => localStorage.setItem('appTheme', themeId), [themeId]);
  useEffect(() => localStorage.setItem('snippets', JSON.stringify(snippets)), [snippets]);
  useEffect(() => localStorage.setItem('refineHistory', JSON.stringify(refineHistory)), [refineHistory]);

  useEffect(() => {
    if (window.electron?.getAppVersion) {
       window.electron.getAppVersion().then(v => setAppVersion(v)).catch(()=>{});
    }
  }, []);


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

  useEffect(() => localStorage.setItem('customInstruction', customInstruction), [customInstruction]);
  useEffect(() => localStorage.setItem('discordEnabled', discordEnabled.toString()), [discordEnabled]);
  useEffect(() => localStorage.setItem('discordClientId', discordClientId), [discordClientId]);
  useEffect(() => localStorage.setItem('discordDetails', discordDetails), [discordDetails]);
  useEffect(() => localStorage.setItem('discordState', discordState), [discordState]);

  useEffect(() => {
    if (window.electron.setDiscordRPC) {
      window.electron.setDiscordRPC({ clientId: discordClientId, details: discordDetails, state: discordState, enabled: discordEnabled });
    }
  }, [discordEnabled, discordClientId, discordDetails, discordState]);
  useEffect(() => localStorage.setItem('appTheme', themeId), [themeId]);
  useEffect(() => localStorage.setItem('customThemeColor', customColor), [customColor]);
  useEffect(() => localStorage.setItem('aiTemperature', aiTemp.toString()), [aiTemp]);
  useEffect(() => localStorage.setItem('autoCopy', autoCopy.toString()), [autoCopy]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isChatting]);

  useEffect(() => {
    if (window.electron?.onClipboardText) {
      window.electron.onClipboardText((clipText: string) => {
        setActiveTab('refine');
        setText(clipText);
        setResult('');
        setTimeout(() => inputRef.current?.focus(), 100);
      });
    }
  }, []);


  // Actions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
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

  const toggleAutoLaunch = async () => {
    const newState = !autoLaunch;
    setAutoLaunchState(newState);
    if (window.electron.setAutoLaunch) {
       await window.electron.setAutoLaunch(newState);
    }
  };

  const handleImproveText = async () => {
    if (!text.trim()) return;
    setIsRefining(true); setRefineError(''); setResult(''); setCopied(false);
    try {
      const improved = await window.electron.improveText(geminiApiKey, text, tone, customInstruction, { temperature: aiTemp });
      setResult(improved);
      if (autoCopy) navigator.clipboard.writeText(improved);
    } catch (err: any) {
      setRefineError(err.message || 'Erro inesperado.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const newMessage = chatInput;
    setChatInput('');
    setIsChatting(true);
    setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: newMessage }] }]);
    
    try {
      const responseText = await window.electron.sendChatMessage(geminiApiKey, chatHistory, newMessage, customInstruction, { temperature: aiTemp });
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "**Erro:** Não foi possível contactar a IA. Verifique sua conexão." }] }]);
    } finally {
      setIsChatting(false);
      setTimeout(() => chatInputRef.current?.focus(), 50);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // UI Micro-Components
  const MarkdownRenderer = ({ content }: { content: string }) => (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed text-gray-200" {...props} />,
        strong: ({node, ...props}) => <strong className="font-bold text-white tracking-wide" {...props} />,
        em: ({node, ...props}) => <em className="italic text-gray-400" {...props} />,
        h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-white" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-4 mb-2 text-white" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-base font-bold mt-3 mb-2 text-white" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1 text-gray-300 marker:text-gray-500" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1 text-gray-300 marker:text-gray-500" {...props} />,
        li: ({node, ...props}) => <li className="pl-1" {...props} />,
        code: ({node, inline, ...props}: any) => 
          inline 
            ? <code className={`bg-white/10 px-1.5 py-0.5 rounded-md text-[13px] font-mono ${curTheme.text}`} {...props} />
            : <pre className="bg-[#101010]/80 p-4 rounded-xl overflow-x-auto my-3 border border-white/5 shadow-inner text-[13px] font-mono text-gray-300" {...props} />,
        blockquote: ({node, ...props}) => <blockquote className={`border-l-4 ${curTheme.border} pl-4 py-1 italic text-gray-400 bg-white/5 rounded-r-lg`} {...props} />
      }}
    >
      {content}
    </ReactMarkdown>
  );

  return (
    <div className="flex justify-center flex-col items-center min-h-screen bg-transparent p-4 font-sans text-gray-200 transition-all duration-300 ease-in-out">
      
      {/* Custom Theme Injection */}
      {themeId === 'custom' && (
        <style dangerouslySetInnerHTML={{ __html: `
          .text-custom-theme { color: ${customColor}; text-shadow: 0 0 10px ${customColor}33; }
          .bg-custom-theme-light { background-color: ${customColor}33; }
          .border-custom-theme-light { border-color: ${customColor}4D; }
          .bg-custom-theme-btn { background-color: ${customColor}3M; /* Wait, using 8C/CC */ } 
          .bg-custom-theme-btn { background-color: ${customColor}80; }
          .hover-custom-theme-btn:hover { background-color: ${customColor}B3; }
          .custom-theme-gradient { background-image: linear-gradient(to right, ${customColor}, #ffffff80); -webkit-background-clip: text; }
          .custom-theme-ring:focus { border-color: ${customColor}80; box-shadow: 0 0 0 2px ${customColor}40; }
        `}} />
      )}

      {/* App Container - Glassmorphism 2.0 */}
      <div 
        className="w-full max-w-3xl rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/80 ring-1 ring-black/50 flex flex-col overflow-hidden relative transform transition-all duration-500 ease-in-out" 
        style={{ 
          WebkitAppRegion: 'drag',
          backgroundColor: `rgba(22, 22, 24, ${bgTransparency})`,
          backdropBlur: '40px' 
        } as any}
      >
        
        {/* Navigation Tabs */}
        <div className="flex shrink-0 border-b border-white/[0.06] bg-black/40" style={{ WebkitAppRegion: 'drag' } as any}>
            <button onClick={() => setActiveTab('search')} title="Ctrl+1" className={`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'search' ? `${curTheme.text} border-b-2 border-current bg-white/[0.04] shadow-[inset_0_2px_10px_rgba(255,255,255,0.01)]` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}`} style={{ WebkitAppRegion: 'no-drag' } as any}>
              <Search className="w-4 h-4 opacity-80" strokeWidth={2} />Search
            </button>
            <button onClick={() => setActiveTab('refine')} title="Ctrl+2" className={`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'refine' ? `${curTheme.text} border-b-2 border-current bg-white/[0.04] shadow-[inset_0_2px_10px_rgba(255,255,255,0.01)]` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}`} style={{ WebkitAppRegion: 'no-drag' } as any}>
              <Sparkles className="w-4 h-4 opacity-80" strokeWidth={2} />Refine
            </button>
            <button onClick={() => setActiveTab('chat')} title="Ctrl+3" className={`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'chat' ? `${curTheme.text} border-b-2 border-current bg-white/[0.04] shadow-[inset_0_2px_10px_rgba(255,255,255,0.01)]` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}`} style={{ WebkitAppRegion: 'no-drag' } as any}>
              <MessageSquare className="w-4 h-4 opacity-80" strokeWidth={2} />Chat
            </button>
            <button onClick={() => setActiveTab('settings')} title="Ctrl+4" className={`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'settings' ? `${curTheme.text} border-b-2 border-current bg-white/[0.04] shadow-[inset_0_2px_10px_rgba(255,255,255,0.01)]` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}`} style={{ WebkitAppRegion: 'no-drag' } as any}>
              <Settings className="w-4 h-4 opacity-80" strokeWidth={2} />Settings
            </button>
        </div>

        {/* -------------------- SEARCH TAB -------------------- */}
        {activeTab === 'search' && (
          <div className="flex flex-col h-[420px] animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="flex items-center px-6 py-5 border-b border-white/[0.06] bg-black/10 transition-all duration-300">
               <Search className={`w-6 h-6 ${curTheme.text} mr-4 opacity-80`} strokeWidth={2} />
               <input
                 ref={searchInputRef}
                 className="flex-1 bg-transparent text-2xl font-light text-white outline-none placeholder-gray-500/80"
                 placeholder="Search for apps, files..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 spellCheck={false}
               />
               {isSearching && <div className={`w-5 h-5 border-2 ${curTheme.border} border-t-current ${curTheme.text} rounded-full animate-spin`}></div>}
            </div>

            
            {/* PROGRESS BAR FEEDBACK */}
            <div className={`h-1 w-full bg-black/50 overflow-hidden relative transition-opacity duration-300 ${isSearching ? 'opacity-100' : 'opacity-0'}`}>
               <div className={`absolute top-0 left-0 h-full ${curTheme.bgLight} animate-pulse shadow-[0_0_10px_currentColor] w-1/3 progress-indeterminate`}></div>
            </div>
            
            <style>{`
              @keyframes progress-indeterminate {
                0% { left: -35%; width: 35%; }
                100% { left: 100%; width: 35%; }
              }
              .progress-indeterminate {
                animation: progress-indeterminate 1.5s infinite linear;
              }
            `}</style>

            <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.04] bg-gradient-to-b from-white/[0.03] to-transparent">
               <button onClick={()=>setSearchFilter('all')} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md transition-all ${searchFilter === 'all' ? `${curTheme.bgLight} ${curTheme.text} ${curTheme.border} border` : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>All</button>
               <button onClick={()=>setSearchFilter('apps')} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md transition-all ${searchFilter === 'apps' ? `${curTheme.bgLight} ${curTheme.text} ${curTheme.border} border` : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>Apps</button>
               <button onClick={()=>setSearchFilter('documents')} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md transition-all ${searchFilter === 'documents' ? `${curTheme.bgLight} ${curTheme.text} ${curTheme.border} border` : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>Documents</button>
            </div>

            <div className="flex-1 overflow-y-auto bg-black/30 p-2">
               {searchResults.length === 0 && searchQuery.length > 0 && !isSearching ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-60">
                     <Search className="w-10 h-10 mb-4 text-gray-500" />
                     <p className="text-sm font-medium text-gray-400">No results found.</p>
                  </div>
               ) : searchResults.length === 0 && searchQuery.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-60">
                     <div className={`w-16 h-16 ${curTheme.bgLight} ${curTheme.text} rounded-full flex items-center justify-center mb-4 ${curTheme.border} shadow-inner`}>
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
                              {res.Icon ? <img src={res.Icon} alt="icon" className="w-6 h-6 object-contain drop-shadow-md" /> : 
                               (res.Extension === '.lnk' || res.Extension === '.exe' ? <AppWindow className={`w-5 h-5 ${curTheme.text}`} /> : 
                               res.Extension === '' ? <Folder className={`w-5 h-5 text-yellow-500`} /> : 
                               <FileText className="w-5 h-5 text-gray-400" />)}
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

        {/* -------------------- REFINE TAB -------------------- */}
        {activeTab === 'refine' && (
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center px-5 py-5 border-b border-white/[0.06] bg-black/10 transition-all duration-300">
              <Edit3 className={`w-6 h-6 ${curTheme.text} mr-4 opacity-80`} strokeWidth={1.5} />
              <textarea
                ref={inputRef}
                className="flex-1 bg-transparent text-2xl font-light text-white outline-none resize-none placeholder-gray-500/80 min-h-[40px]"
                style={{ WebkitAppRegion: 'no-drag' } as any}
                rows={1}
                placeholder="What do you want to improve?"
                value={text}
                onChange={(e) => {
                    const val = e.target.value;
                    // Snippet expansion: check if last word matches a trigger
                    if (val.endsWith(' ') || val.endsWith('\t')) {
                      const words = val.trimEnd().split(/\s+/);
                      const lastWord = words[words.length - 1];
                      const snippet = snippets.find(s => s.trigger === lastWord);
                      if (snippet) {
                        words[words.length - 1] = snippet.expansion;
                        setText(words.join(' ') + ' ');
                        return;
                      }
                    }
                    setText(val);
                  }}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleImproveText(); } }}
                onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }}
              />
              <button style={{ WebkitAppRegion: 'no-drag' } as any} onClick={handleImproveText} disabled={isRefining || !text.trim()} className={`ml-4 text-xs font-semibold text-white ${curTheme.btn} ${curTheme.btnHover} disabled:opacity-30 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border border-white/10 transition-all active:scale-95`}>
                 Ask AI <kbd className="bg-black/30 font-mono text-[9px] px-1.5 py-0.5 rounded border border-black/20 opacity-70">↵</kbd>
              </button>
            </div>

            {/* Tones Selection */}
            <div className="px-6 py-4 bg-gradient-to-b from-white/[0.04] to-transparent border-b border-white/[0.04]" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <div className="flex justify-between items-center mb-3">
                 <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Tones</div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">Auto-Copy <input type="checkbox" checked={autoCopy} onChange={(e)=>setAutoCopy(e.target.checked)} className={`accent-[#121212] w-3 h-3 rounded transition-colors`} /></div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {tones.map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 active:scale-95 ${tone === t ? `${curTheme.bgLight} ${curTheme.text} shadow-sm ${curTheme.border}` : 'bg-black/20 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'}`}
                  >
                    {tone === t && <div className={`w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse`}></div>}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Area */}
            <div className="px-6 py-6 min-h-[160px] max-h-[350px] overflow-y-auto bg-black/40" style={{ WebkitAppRegion: 'no-drag' } as any}>
                {isRefining ? (
                  <div className="flex items-center justify-center py-8">
                    <div className={`w-6 h-6 border-2 ${curTheme.border} border-t-current ${curTheme.text} rounded-full animate-spin`}></div>
                    <span className={`ml-4 text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r ${curTheme.gradient} animate-pulse tracking-wide`}>Crafting perfection...</span>
                  </div>
                ) : refineError ? (
                  <div className="text-sm px-5 py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl shadow-inner">{refineError}</div>
                ) : result ? (
                  <div className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`text-[10px] font-bold ${curTheme.text} uppercase tracking-widest`}>Output</div>
                          <span className="text-[10px] uppercase font-bold text-gray-500 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/5">{tone}</span>
                        </div>
                        <button onClick={copyToClipboard} className="text-[11px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg border border-white/10 transition-colors active:scale-95">
                          {copied ? 'Copied ✓' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-white/[0.04] p-5 rounded-2xl border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <MarkdownRenderer content={typedResult} />
                      </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                    <Type className="w-12 h-12 mb-3 opacity-20" strokeWidth={1} />
                    <p className="text-sm font-medium">Your refined text will appear here.</p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* -------------------- CHAT TAB -------------------- */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[420px] animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <div className="flex items-center justify-between px-6 bg-gradient-to-b from-white/[0.03] to-transparent py-2 border-b border-white/[0.04]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${chatHistory.length > 0 ? curTheme.bgLight : 'bg-gray-600'}`}></div> Memory Active
                </span>
                {chatHistory.length > 0 && (
                   <button onClick={() => { if(window.confirm('Clear conversation history?')) setChatHistory([]); }} title="Clear Chat History" className="text-gray-500 hover:text-red-400 p-1.5 rounded-md hover:bg-white/5 transition-colors">
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                   </button>
                )}
             </div>
             
             <div className="flex-1 px-6 py-5 overflow-y-auto bg-black/30 flex flex-col gap-5">
                {chatHistory.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center opacity-60">
                      <div className={`w-16 h-16 ${curTheme.bgLight} ${curTheme.text} rounded-full flex items-center justify-center mb-4 ${curTheme.border} shadow-inner`}>
                        <Bot className="w-8 h-8" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-gray-300 font-medium tracking-wide">Start a conversation...</p>
                      <p className="text-[11px] text-gray-500 mt-1">Chat history is preserved automatically.</p>
                   </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                       <span className={`text-[9px] mb-1.5 font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-gray-500 mr-1' : `${curTheme.text} opacity-80 ml-1`}`}>
                          {msg.role === 'user' ? 'You' : 'Ai Assistant'}
                       </span>
                       <div className={`py-3 px-4 rounded-3xl shadow-sm relative group ${msg.role === 'user' ? `${curTheme.bgLight} text-white border ${curTheme.border}` : 'bg-white/5 border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] text-gray-200'} ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                          {msg.role === 'model' ? <MarkdownRenderer content={msg.parts[0].text} /> : <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{msg.parts[0].text}</p>}
                          
                          {msg.role === 'model' && (
                             <button onClick={() => navigator.clipboard.writeText(msg.parts[0].text)} className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-[#161618] hover:bg-black p-1.5 rounded-lg border border-white/10 ${curTheme.text} hover:scale-105 transition-all backdrop-blur-xl shadow-lg`} title="Copy Response">
                                <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                             </button>
                          )}
                       </div>
                    </div>
                  ))
                )}
                
                {isChatting && (
                  <div className="self-start max-w-[80%] mt-1">
                     <div className="bg-white/5 py-3 px-4 rounded-3xl rounded-bl-sm border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center gap-2">
                        <div className="flex gap-2">
                          <div className={`w-1.5 h-1.5 ${curTheme.bgLight} rounded-full animate-bounce ${curTheme.border} border-2`}></div>
                          <div className={`w-1.5 h-1.5 ${curTheme.bgLight} rounded-full animate-bounce ${curTheme.border} border-2`} style={{animationDelay: '0.15s'}}></div>
                          <div className={`w-1.5 h-1.5 ${curTheme.bgLight} rounded-full animate-bounce ${curTheme.border} border-2`} style={{animationDelay: '0.3s'}}></div>
                        </div>
                     </div>
                  </div>
                )}
                <div ref={chatEndRef} />
             </div>
             
             {/* Chat Input */}
             <div className="p-4 bg-black/40 border-t border-white/[0.04] flex items-center gap-3">
               <input 
                 ref={chatInputRef}
                 className={`flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none ${curTheme.ring} focus:bg-white/10 transition-all placeholder-gray-500`}
                 placeholder="Message AI..."
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
               />
               <button onClick={handleSendChatMessage} disabled={!chatInput.trim() || isChatting} className={`${curTheme.btn} ${curTheme.btnHover} disabled:opacity-30 disabled:scale-100 text-white p-3 rounded-xl border border-white/10 transition-all cursor-pointer shadow-lg active:scale-95`}>
                 <Send className="w-5 h-5 ml-0.5" strokeWidth={2} />
               </button>
             </div>
          </div>
        )}

        {/* -------------------- SETTINGS TAB -------------------- */}
        {activeTab === 'settings' && (
          <div className="flex flex-col h-[420px] animate-in fade-in zoom-in-95 duration-300" style={{ WebkitAppRegion: 'no-drag' } as any}>
            
            {/* Settings Sub-Tabs */}
            <div className="flex shrink-0 border-b border-white/[0.04] bg-black/20 px-4">
                <button onClick={() => setSettingsTab('appearance')} className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest transition-all ${settingsTab === 'appearance' ? `${curTheme.text} border-b-2 border-current` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}`}>Appearance</button>
                <button onClick={() => setSettingsTab('ai')} className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest transition-all ${settingsTab === 'ai' ? `${curTheme.text} border-b-2 border-current` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}`}>AI Config</button>
                <button onClick={() => setSettingsTab('snippets')} className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest transition-all ${settingsTab === 'snippets' ? `${curTheme.text} border-b-2 border-current` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}`}>Snippets</button>
                <button onClick={() => setSettingsTab('system')} className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest transition-all ${settingsTab === 'system' ? `${curTheme.text} border-b-2 border-current` : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'}`}>System</button>
            </div>

            <div className="px-6 py-6 flex flex-col gap-5 bg-black/10 flex-1 overflow-y-auto">
            
            {/* Appearance Section */}
            {settingsTab === 'appearance' && (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-left-2 duration-300">
                {/* Visual Themes Card */}
               <div className="flex-1 flex flex-col gap-3 p-5 bg-white/5 rounded-2xl border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                 <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-2">
                   <PaintBucket className="w-4 h-4 text-white opacity-80" strokeWidth={2} />
                   Appearance
                 </label>
                 <div className="flex gap-3">
                    {themeOptions.map((t) => (
                       <button 
                          key={t.id}
                          onClick={() => setThemeId(t.id)}
                          title={t.name}
                          className={`w-7 h-7 rounded-full border border-white/20 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg`}
                          style={{ backgroundColor: t.colorHex, borderColor: themeId === t.id ? 'white' : '' }}
                       >
                          {themeId === t.id && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" strokeWidth={3} />}
                       </button>
                    ))}
                    
                    {/* Custom Theme Picker */}
                    <div title="Custom Color" className="relative group w-7 h-7 rounded-full border border-white/20 transition-all duration-300 hover:scale-110 flex items-center justify-center shadow-lg"
                         style={{ backgroundColor: themeId === 'custom' ? customColor : '#333', borderColor: themeId === 'custom' ? 'white' : '' }}
                    >
                       <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer" value={customColor} onChange={(e) => { setThemeId('custom'); setCustomColor(e.target.value); }} />
                       {themeId === 'custom' ? (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow-md pointer-events-none" strokeWidth={3} />
                       ) : (
                          <Edit3 className="w-3 h-3 text-white opacity-60 pointer-events-none" strokeWidth={2} />
                       )}
                    </div>
                 </div>
               </div>

                {/* Background Transparency Card */}
                <div className="flex flex-col gap-3 p-5 bg-white/5 rounded-2xl border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <label className="text-[10px] text-gray-400 flex justify-between uppercase tracking-widest font-bold items-center gap-2">
                    Background Transparency
                    <span className={`text-[10px] ${curTheme.text}`}>{Math.round(bgTransparency * 100)}%</span>
                  </label>
                  <input 
                    type="range" min="0.1" max="1" step="0.05" value={bgTransparency} onChange={(e) => setBgTransparency(Number(e.target.value))}
                    className="w-full mt-2 accent-white opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            )}

            {/* AI Config Section */}
            {settingsTab === 'ai' && (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-left-2 duration-300">
                {/* AI Temperature */}
                <div className="flex flex-col gap-3 p-5 bg-white/5 rounded-2xl border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <label className="text-[10px] text-gray-400 flex justify-between uppercase tracking-widest font-bold items-center gap-2">
                    Criatividade (Temp)
                    <span className={`text-[10px] ${curTheme.text}`}>{aiTemp.toFixed(1)}</span>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.1" value={aiTemp} onChange={(e) => setAiTemp(Number(e.target.value))}
                    className="w-full mt-2 accent-white opacity-80 hover:opacity-100 transition-opacity"
                    title="0 = Focado/Exato | 1 = Criativo/Aleatório"
                  />
                </div>

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
                      className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white outline-none focus:border-emerald-500/50 transition-colors placeholder-gray-600 font-mono`}
                      value={geminiApiKey} 
                      onChange={(e)=>setGeminiApiKey(e.target.value.trim())} 
                      placeholder="AIzaSy..." 
                    />
                    <p className="text-[10px] text-gray-500 mt-2 ml-1">Your key is stored locally on your machine and sent directly to Google. We do not track or save your keys.</p>
                    {keyStatus !== 'idle' && (
                      <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-medium transition-all ${
                        keyStatus === 'checking' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                        keyStatus === 'valid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {keyStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {keyStatus === 'valid' && <CheckCircle2 className="w-4 h-4" />}
                        {keyStatus === 'invalid' && <XCircle className="w-4 h-4 shrink-0" />}
                        <span className="truncate">
                          {keyStatus === 'checking' && 'Verificando chave e conectando ao Google...'}
                          {keyStatus === 'valid' && 'API Key Válida! Conectado com sucesso.'}
                          {keyStatus === 'invalid' && `Erro: ${keyError}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Instruction Box */}
                <div className="flex flex-col gap-3 p-5 bg-white/5 rounded-2xl border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-white opacity-80" strokeWidth={2} />
                    System Instructions (AI Persona)
                  </label>
                  <textarea
                    className={`w-full bg-black/40 rounded-xl p-4 text-gray-200 border border-white/10 outline-none ${curTheme.ring} transition-all resize-none placeholder-gray-600 text-[14px] leading-relaxed`}
                    placeholder="E.g: Always be direct. Provide bullet points. Act like a senior developer..."
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            
            {/* Snippets Manager */}
            {settingsTab === 'snippets' && (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex flex-col gap-3 p-5 bg-white/5 rounded-2xl border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-2">
                    <Type className="w-4 h-4 text-white opacity-80" strokeWidth={2} />
                    Snippets / Text Shortcuts
                  </label>
                  <p className="text-[10px] text-gray-500 -mt-1">Type a trigger (e.g. <code className="bg-white/10 px-1 rounded">/email</code>) in the Refine box and press Space to expand.</p>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {snippets.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                        <code className={`text-[11px] font-mono ${curTheme.text} shrink-0`}>{s.trigger}</code>
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
                      className={`px-4 py-2 rounded-lg ${curTheme.btn} text-white text-xs font-bold hover:opacity-90 transition-all`}
                    >Add</button>
                  </div>
                </div>
              </div>
            )}

            {/* System Section */}
            {settingsTab === 'system' && (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-left-2 duration-300">
                {/* Discord Rich Presence */}
                <div className="flex flex-col gap-3 p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => setDiscordEnabled(!discordEnabled)}>
                    <label className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-2 cursor-pointer">
                      <Gamepad2 className="w-4 h-4 text-indigo-400 opacity-80" strokeWidth={2} />
                      Discord Rich Presence
                    </label>
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${discordEnabled ? 'bg-indigo-500' : 'bg-black/50 border border-white/10'}`}>
                       <span className={`inline-block h-3 w-3 transform rounded-full transition-transform ${discordEnabled ? 'translate-x-5 bg-white shadow-md' : 'translate-x-1 bg-gray-500'}`} />
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
                         <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-gray-300 outline-none focus:border-indigo-500/50 transition-colors placeholder-gray-600" value={discordClientId} onChange={(e)=>setDiscordClientId(e.target.value.replace(/\D/g, ''))} placeholder="Client ID (e.g. 1234567890)" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* About & Updates */}
                <div className={`flex items-center justify-between p-5 bg-white/5 rounded-2xl border ${curTheme.border} shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]`}>
                   <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${curTheme.bgLight}`}>
                         <Zap className={`w-5 h-5 ${curTheme.text}`} strokeWidth={2} />
                      </div>
                      <div>
                         <div className="text-white text-sm font-bold">Low Write</div>
                         <div className="text-gray-400 text-[11px]">Version {appVersion || '1.3.0'}</div>
                      </div>
                   </div>
                   <button
                      onClick={() => window.electron?.checkForUpdates?.()}
                      className={`px-4 py-2 rounded-xl ${curTheme.bgLight} border ${curTheme.border} ${curTheme.text} hover:opacity-80 transition-all text-xs font-bold tracking-wide`}
                   >
                      Check for Updates
                   </button>
                </div>

                {/* System Actions */}
                <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-white mb-0.5">Start with Windows</span>
                      <span className="text-[11px] text-gray-400">Launch Low Write automatically in the background when you log in.</span>
                   </div>
                   <button onClick={toggleAutoLaunch} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoLaunch ? curTheme.bgLight : 'bg-black/50 border border-white/10'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full transition-transform ${autoLaunch ? 'translate-x-6 bg-white shadow-[0_0_10px_white]' : 'translate-x-1 bg-gray-500'}`} />
                   </button>
                </div>
              </div>
            )}
            
            </div>
          </div>
        )}

      </div>
      
      <p className="text-gray-500 text-xs mt-6 opacity-70 font-medium tracking-wide">
        Press <kbd className="bg-black/40 shadow-inner px-2 py-0.5 rounded border border-white/10 text-gray-300 font-mono">ESC</kbd> to hide or drag by the top edge.
      </p>
    </div>
  );
};

export default App;
