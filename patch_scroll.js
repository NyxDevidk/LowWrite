const fs = require('fs');

let content = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

content = content.replace(
  `{/* -------------------- SETTINGS TAB -------------------- */}
        {activeTab === 'settings' && (
          <div className="px-6 py-6 flex flex-col gap-5 bg-black/20 min-h-[350px] animate-in fade-in zoom-in-95 duration-300" style={{ WebkitAppRegion: 'no-drag' } as any}>`,
  `{/* -------------------- SETTINGS TAB -------------------- */}
        {activeTab === 'settings' && (
          <div className="px-6 py-6 flex flex-col gap-5 bg-black/20 h-[420px] overflow-y-auto animate-in fade-in zoom-in-95 duration-300" style={{ WebkitAppRegion: 'no-drag' } as any}>`
);

fs.writeFileSync('c:/LowWrite/src/App.tsx', content, 'utf8');
console.log('Scroll patched.');
