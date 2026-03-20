const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function test() {
    let safeQuery = 'Discord';
    let paths = `"$env:ProgramData\\Microsoft\\Windows\\Start Menu", "$env:APPDATA\\Microsoft\\Windows\\Start Menu", "$env:USERPROFILE\\Desktop"`;
    
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
    const encodedCmd = Buffer.from(psScript, 'utf16le').toString('base64');
    
    try {
        const { stdout } = await execAsync(`powershell -NoProfile -EncodedCommand ${encodedCmd}`, { maxBuffer: 1024 * 1024 * 5 });
        console.log("OUT:", stdout);
    } catch (e) {
        console.log("ERR", e.message, e.stdout);
    }
}
test();
