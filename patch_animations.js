const fs = require('fs');
let content = fs.readFileSync('c:/LowWrite/src/App.tsx', 'utf8');

// 1. Add pulsate-glow animation to styles (injected in the component)
const styleTarget = `@keyframes progress-indeterminate {`;
const styleReplacement = `@keyframes pulsate-glow {
                0% { box-shadow: 0 0 5px rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
                50% { box-shadow: 0 0 15px rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); }
                100% { box-shadow: 0 0 5px rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
              }
              .typing-glow:focus {
                animation: pulsate-glow 2s infinite ease-in-out;
              }
              @keyframes progress-indeterminate {`;

content = content.replace(styleTarget, styleReplacement);

// 2. Add typing indicator (3 dots) to Refine tab
// Find where the result area is and add the loading dots
const refineLoadingTarget = `<div className="flex-1 overflow-y-auto bg-black/40 p-5 flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                     <Loader2 className={\`w-10 h-10 \${curTheme.text} animate-spin opacity-80\`} />`;

const refineLoadingReplacement = `<div className="flex-1 overflow-y-auto bg-black/40 p-5 flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                     <div className="flex gap-2 mb-2">
                        <div className={\`w-3 h-3 \${curTheme.bgLight} rounded-full animate-bounce \${curTheme.border} border-2 shadow-[0_0_10px_currentColor]\`}></div>
                        <div className={\`w-3 h-3 \${curTheme.bgLight} rounded-full animate-bounce \${curTheme.border} border-2 shadow-[0_0_10px_currentColor]\`} style={{animationDelay: '0.2s'}}></div>
                        <div className={\`w-3 h-3 \${curTheme.bgLight} rounded-full animate-bounce \${curTheme.border} border-2 shadow-[0_0_10px_currentColor]\`} style={{animationDelay: '0.4s'}}></div>
                     </div>
                     <p className={\`text-xs font-bold uppercase tracking-widest \${curTheme.text} animate-pulse\`}>IA está escrevendo...</p>`;

content = content.replace(refineLoadingTarget, refineLoadingReplacement);

// 3. Add typing-glow class to textareas
content = content.replace(
  `className={\`w-full h-full bg-transparent text-gray-200 outline-none resize-none placeholder-gray-600 text-[15px] leading-relaxed\`} `,
  `className={\`w-full h-full bg-transparent text-gray-200 outline-none resize-none placeholder-gray-600 text-[15px] leading-relaxed typing-glow\`} `
);

// 4. Also add it to Chat input
content = content.replace(
  `className={\`flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none \${curTheme.ring} focus:bg-white/10 transition-all placeholder-gray-500\`} `,
  `className={\`flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none \${curTheme.ring} focus:bg-white/10 transition-all placeholder-gray-500 typing-glow\`} `
);

fs.writeFileSync('c:/LowWrite/src/App.tsx', content, 'utf8');
console.log('Animations and indicators patched.');
