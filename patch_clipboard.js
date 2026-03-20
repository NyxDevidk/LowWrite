const fs = require('fs');

let content = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

// 1. Add Type for the window.electron function
content = content.replace(
  `verifyApiKey: (apiKey: string) => Promise<{success: boolean, error?: string}>;`,
  `verifyApiKey: (apiKey: string) => Promise<{success: boolean, error?: string}>;\n      onClipboardText: (callback: (text: string) => void) => void;`
);

// 2. Add the Hook
const effectHtml = `
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
`;

content = content.replace(
  `useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isChatting]);`,
  `useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isChatting]);\n${effectHtml}`
);

fs.writeFileSync('c:/LowWrite/src/App.tsx', content, 'utf8');
console.log("App.tsx patched for Clipboard Listener.");
