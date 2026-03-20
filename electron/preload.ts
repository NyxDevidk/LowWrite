import { contextBridge, ipcRenderer } from 'electron';

// Exposes functions to standard Window object in Renderer
contextBridge.exposeInMainWorld('electron', {
  onClipboardText: (callback: (text: string) => void) => {
    ipcRenderer.on('clipboard-text', (_event, text) => callback(text));
  },
  verifyApiKey: (apiKey: string) => ipcRenderer.invoke('verify-api-key', apiKey),
  improveText: (apiKey: string, text: string, tone: string, customInstruction?: string, options?: any) => ipcRenderer.invoke('improve-text', { apiKey, text, tone, customInstruction, options }),
  sendChatMessage: (apiKey: string, history: any[], newMessage: string, customInstruction?: string, options?: any) => ipcRenderer.invoke('chat-message', { apiKey, history, newMessage, customInstruction, options }),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke('set-auto-launch', enable),
  searchFiles: (query: string, filter: string) => ipcRenderer.invoke('search-files', { query, filter }),
  openFile: (path: string) => ipcRenderer.invoke('open-file', path),
  showInFolder: (path: string) => ipcRenderer.invoke('show-in-folder', path),
  setDiscordRPC: (options: any) => ipcRenderer.invoke('set-discord-rpc', options)
});
