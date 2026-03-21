import { app, BrowserWindow, ipcMain, globalShortcut, shell, Tray, Menu, clipboard, dialog } from 'electron';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as RPC from 'discord-rpc';
import { autoUpdater } from 'electron-updater';

const execAsync = promisify(exec);

let isQuitting = false;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 750,
    height: 550,
    icon: path.join(__dirname, '../build/LowWriteIco.ico'),
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true, // App de launcher background
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Decide if we are in dev mode (Vite running on 5173) or production mode
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Previne a destruição da janela (esconde em vez de fechar)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Esconde ao clicar fora (efeito Raycast/Spotlight perfeito)
  mainWindow.on('blur', () => {
    mainWindow.hide();
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});

let tray: Tray | null = null;

app.whenReady().then(() => {
  createWindow();

  // Configurações do Auto Updater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch(console.error);
  }

  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Atualização do Low Write Disponível!',
      message: 'Uma nova versão do Low Write foi baixada em segundo plano de forma silenciosa e está pronta para ser instalada. Deseja reiniciar o aplicativo para instalar e aproveitar agora?',
      buttons: ['Sim, Reiniciar', 'Mais Tarde'],
      defaultId: 0,
    }).then(result => {
      if (result.response === 0) {
        isQuitting = true;
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // Create System Tray
  try {
    const iconPath = process.platform === 'win32'
      ? path.join(__dirname, '../build/LowWriteIco.ico')
      : path.join(__dirname, '../build/icon.png');
      
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Mostrar/Esconder Low Write', 
        click: () => {
          const win = BrowserWindow.getAllWindows()[0];
          if (win) {
            if (win.isVisible() && win.isFocused()) win.hide();
            else { win.show(); win.focus(); }
          }
        } 
      },
      { type: 'separator' },
      { 
        label: 'Sair Completamente', 
        click: () => {
          isQuitting = true;
          app.quit();
        } 
      }
    ]);
    
    tray.setToolTip('Low Write - AI Assistant');
    tray.setContextMenu(contextMenu);

    // Left click behavior: Toggle visibility
    tray.on('click', () => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win) {
        if (win.isVisible() && win.isFocused()) {
          win.hide();
        } else {
          win.show();
          win.focus();
        }
      }
    });
  } catch (err) {
    console.error("Failed to initialize Tray:", err);
  }

  // Atalho global estilo Raycast / Spotlight
  globalShortcut.register('Alt+Space', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isVisible() && win.isFocused()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  });

  // Listener da Área de Transferência (Clipboard)
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      const text = clipboard.readText();
      if (text && text.trim()) {
        win.show();
        win.focus();
        win.webContents.send('clipboard-text', text);
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Responde ao IPC Request do frontend
ipcMain.handle('improve-text', async (event, { apiKey, text, tone, customInstruction, options }) => {
  try {
    if (!apiKey) throw new Error('Chave de API do Gemini não configurada. Preencha na aba Settings.');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const basePrompt = `Você é um refinador de textos impecável. Extraia ou reescreva o texto original com o tom ${tone}.`;
    const userInstruction = customInstruction && customInstruction.trim() !== '' 
      ? `\nINSTRUÇÕES PESSOAIS DO USUÁRIO OBRIGATÓRIAS: ${customInstruction}` 
      : `\nREGRA ESTRITA: NÃO use introduções como "Aqui está" ou "Com certeza!". NUNCA converse com o usuário. Apenas retorne DIRETAMENTE as opções ou o texto reescrito. Se houver mais de uma opção, separe com Markdown.`;
      
    const prompt = `${basePrompt}${userInstruction}\n\nTEXTO ORIGINAL:\n${text}`;
    
    const result = await model.generateContent({
       contents: [{ role: 'user', parts: [{ text: prompt }] }],
       generationConfig: {
         temperature: options?.temperature !== undefined ? Number(options.temperature) : 0.7,
       }
    });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Erro ao chamar a API Gemini:', error);
    throw new Error('Falha ao processar o texto via Google AI Studio. Verifique sua chave de API.');
  }
});

// Verifica a validade da API Key
ipcMain.handle('verify-api-key', async (event, apiKey) => {
  try {
    if (!apiKey) return { success: false, error: 'Chave ausente' };
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Check key quickly
    await model.generateContent("hello");
    return { success: true };
  } catch (error: any) {
    console.error('Verification API error:', error);
    return { success: false, error: error.message || 'Chave inválida' };
  }
});

// Responde ao IPC Request do Chat
ipcMain.handle('chat-message', async (event, { apiKey, history, newMessage, customInstruction, options }) => {
  try {
    if (!apiKey) throw new Error('Chave de API do Gemini não configurada. Preencha na aba Settings.');
    const genAI = new GoogleGenerativeAI(apiKey);
    // Para Gemini >1.5 podemos passar systemInstruction direto no modelo
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: customInstruction && customInstruction.trim() !== '' 
        ? customInstruction 
        : "Você é um assistente de IA prestativo e direto integrado a um aplicativo Desktop (Low Write). Retorne suas respostas em Markdown limpo e objetivo.",
      generationConfig: {
        temperature: options?.temperature !== undefined ? Number(options.temperature) : 0.7,
      }
    });
    
    // Inicia o chat apontando o histórico anterior
    const chat = model.startChat({ history });
    
    const result = await chat.sendMessage(newMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Erro no Chat da API Gemini:', error);
    throw new Error('Falha ao gerar a resposta do chat.');
  }
});

// Responde ao IPC Request de Auto-Launch
ipcMain.handle('get-auto-launch', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('set-auto-launch', (event, enable) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    openAsHidden: true
  });
});

// --- Search / File IPCs ---
ipcMain.handle('search-files', async (event, { query, filter }) => {
  try {
    const safeQuery = query.replace(/["'\\]/g, ''); 
    if (!safeQuery || safeQuery.length < 2) return [];
    
    let paths = `"$env:ProgramData\\Microsoft\\Windows\\Start Menu", "$env:APPDATA\\Microsoft\\Windows\\Start Menu", "$env:USERPROFILE\\Desktop"`;
    if (filter === 'documents') {
      paths = `"$env:USERPROFILE\\Documents", "$env:USERPROFILE\\Downloads"`;
    } else if (filter === 'all') {
       paths += `, "$env:USERPROFILE\\Documents", "$env:USERPROFILE\\Downloads"`;
    }

    const psScript = `
$ErrorActionPreference = 'SilentlyContinue';
$paths = @(${paths});
$validPaths = $paths | Where-Object { Test-Path $_ }
if ($validPaths.Count -eq 0) { Write-Output "[]"; exit }
Get-ChildItem -Path $validPaths -Recurse -Filter "*${safeQuery}*" -ErrorAction SilentlyContinue |
Where-Object { -not $_.PSIsContainer } |
Select-Object -First 20 -Property Name, FullName, Extension | 
ConvertTo-Json -Compress
`;
    // Encodes the script into base64 UTF16LE to safely execute via PowerShell bypassing quote limits
    const encodedCmd = Buffer.from(psScript, 'utf16le').toString('base64');
    const { stdout } = await execAsync(`powershell -NoProfile -EncodedCommand ${encodedCmd}`, { maxBuffer: 1024 * 1024 * 5 });
    
    if (!stdout.trim()) return [];
    let parsedResults = JSON.parse(stdout);
    if (!Array.isArray(parsedResults)) parsedResults = [parsedResults];
    
    // Fetch native system icons for each file
    const finalResults = await Promise.all(parsedResults.map(async (res: any) => {
       try {
          const icon = await app.getFileIcon(res.FullName, { size: 'normal' });
          res.Icon = icon.toDataURL();
       } catch (e) {
          res.Icon = null;
       }
       return res;
    }));
    return finalResults;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
});

ipcMain.handle('open-file', async (event, path) => {
  await shell.openPath(path);
});

ipcMain.handle('show-in-folder', async (event, path) => {
  shell.showItemInFolder(path);
});

// --- Discord RPC IPC ---
let rpcClient: any = null;

ipcMain.handle('set-discord-rpc', async (event, { clientId, details, state, enabled }) => {
  if (!enabled) {
    if (rpcClient) {
      try { rpcClient.destroy(); } catch (e) {}
      rpcClient = null;
    }
    return true;
  }
  
  if (rpcClient) {
    try { rpcClient.destroy(); } catch (e) {}
    rpcClient = null;
  }

  try {
     RPC.register(clientId);
     rpcClient = new RPC.Client({ transport: 'ipc' });
     
     await rpcClient.login({ clientId });
     rpcClient.setActivity({
        details: details || 'Using Low Write',
        state: state || 'Editing a document',
        startTimestamp: new Date(),
        instance: false,
     });
     return true;
  } catch (err) {
     console.error("Discord RPC Error:", err);
     rpcClient = null;
     return false;
  }
});

// IPC App Version & Manual Updates
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('invoke-check-updates', () => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch(console.error);
  }
});
