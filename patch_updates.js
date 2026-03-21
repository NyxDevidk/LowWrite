const fs = require('fs');

// PATCH MAIN.TS
let mainContent = fs.readFileSync('c:/LowWrite/electron/main.ts', 'utf8');
const updateHandlers = `
// IPC App Version & Manual Updates
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('invoke-check-updates', () => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch(console.error);
  }
});
`;
mainContent = mainContent + '\\n' + updateHandlers;
fs.writeFileSync('c:/LowWrite/electron/main.ts', mainContent, 'utf8');


// PATCH PRELOAD.TS
let preloadContent = fs.readFileSync('c:/LowWrite/electron/preload.ts', 'utf8');
preloadContent = preloadContent.replace(
  `getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),`,
  `getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),\n  getAppVersion: () => ipcRenderer.invoke('get-app-version'),\n  checkForUpdates: () => ipcRenderer.invoke('invoke-check-updates'),`
);
fs.writeFileSync('c:/LowWrite/electron/preload.ts', preloadContent, 'utf8');


// PATCH APP.TSX
let appContent = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

// 1. Types
appContent = appContent.replace(
  `getAutoLaunch: () => Promise<boolean>;`,
  `getAutoLaunch: () => Promise<boolean>;\n      getAppVersion: () => Promise<string>;\n      checkForUpdates: () => Promise<void>;`
);

// 2. States
appContent = appContent.replace(
  `const [discordRpcState, setDiscordRpcState] = useState(() => localStorage.getItem('discordRpcState') || 'Editing a document');`,
  `const [discordRpcState, setDiscordRpcState] = useState(() => localStorage.getItem('discordRpcState') || 'Editing a document');\n  const [appVersion, setAppVersion] = useState('');`
);

// 3. Effect for Version
const versionEffect = `
  useEffect(() => {
    if (window.electron?.getAppVersion) {
       window.electron.getAppVersion().then(v => setAppVersion(v)).catch(()=>{});
    }
  }, []);
`;
appContent = appContent.replace(
  `useEffect(() => localStorage.setItem('geminiApiKey', geminiApiKey), [geminiApiKey]);`,
  `useEffect(() => localStorage.setItem('geminiApiKey', geminiApiKey), [geminiApiKey]);\n${versionEffect}`
);

// 4. UI Component
const discordBlock = `<div className="mt-8 flex flex-col gap-2">
                 <span className="text-white text-[10px] font-bold uppercase tracking-widest px-1">Discord Integration</span>`;

const updateUI = `
                 {/* ABOUT & UPDATES */}
                 <div className="flex flex-col gap-2">
                   <span className="text-white text-[10px] font-bold uppercase tracking-widest px-1">About & Updates</span>
                   <div className={\`flex items-center justify-between p-4 rounded-xl border \${curTheme.border} bg-white/5\`}>
                     <div className="flex items-center gap-4">
                       <Zap className={\`w-6 h-6 \${curTheme.text} drop-shadow-md\`} />
                       <div>
                         <div className="text-white text-sm font-semibold">Low Write</div>
                         <div className="text-gray-400 text-xs">Version \${appVersion || '1.1.0'}</div>
                       </div>
                     </div>
                     <button
                       onClick={() => {
                          if (window.electron?.checkForUpdates) window.electron.checkForUpdates();
                       }}
                       className={\`px-4 py-2 rounded-lg bg-white/10 hover:\${curTheme.bg} transition-all duration-300 text-xs text-white font-medium\`}
                     >
                       Check for Updates
                     </button>
                   </div>
                 </div>
                 
                 <div className="w-full h-px bg-white/10 my-4" />
`;

appContent = appContent.replace(discordBlock, updateUI + '\\n                 ' + discordBlock);
fs.writeFileSync('c:/LowWrite/src/App.tsx', appContent, 'utf8');

console.log("Patch successfully applied for Updates Button & Versioning.");
