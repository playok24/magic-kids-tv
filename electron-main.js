const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const https = require("https");

let win;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow(){
    win = new BrowserWindow({
        width: 1380,
        height: 783,
        resizable: true,
        autoHideMenuBar: true,
        title: "",
        icon: path.join(__dirname, "icon.ico"),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "electron-preload.js")
        }
    });

    win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        const url = details.url;
        const isStream = url.includes('bozztv.com') || url.includes('.m3u8') || url.includes('.ts');
        if (!isStream) {
            details.requestHeaders['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            details.requestHeaders['Pragma'] = 'no-cache';
            details.requestHeaders['Expires'] = '0';
        }
        callback({ requestHeaders: details.requestHeaders });
    });

    win.loadFile(path.join(__dirname, "prueba.html"));

    win.on("closed", ()=>{
        win = null;
    });

    win.webContents.on("before-input-event", (e, input)=>{
        if(input.key === "F11"){
            e.preventDefault();
            win.setFullScreen(!win.isFullScreen());
        }
    });
}

ipcMain.on("fullscreen-toggle", ()=>{
    if(!win) return;
    win.setFullScreen(!win.isFullScreen());
});

ipcMain.on("fullscreen-enter", ()=>{
    if(!win) return;
    win.setFullScreen(true);
});

ipcMain.on("fullscreen-exit", ()=>{
    if(!win) return;
    win.setFullScreen(false);
});

ipcMain.handle("counter-fetch", async (event, url)=>{
    return new Promise((resolve)=>{
        https.get(url, (res)=>{
            let data = "";
            res.on("data", (chunk)=> data += chunk);
            res.on("end", ()=>{
                try { resolve(JSON.parse(data)); }
                catch(e) { resolve(null); }
            });
        }).on("error", ()=> resolve(null));
    });
});

app.whenReady().then(()=>{
    createWindow();
    setTimeout(()=>{ autoUpdater.checkForUpdates(); }, 5000);
});

setInterval(()=>{ autoUpdater.checkForUpdates(); }, 30 * 60 * 1000);

autoUpdater.on("update-available", (info)=>{
    if(win) win.webContents.send("update-available", info.version);
});

autoUpdater.on("download-progress", (d)=>{
    const pct = Math.round(d.percent);
    if(win) win.webContents.send("update-progress", pct);
});

autoUpdater.on("update-downloaded", ()=>{
    if(win) win.webContents.send("update-downloaded");
});

autoUpdater.on("error", (err)=>{
    console.log("Auto-updater error:", err.message);
});

ipcMain.on("install-update", ()=>{
    autoUpdater.quitAndInstall();
});

ipcMain.on("check-for-updates", ()=>{
    autoUpdater.checkForUpdates();
});

app.on("window-all-closed", ()=>{
    app.quit();
});

app.on("activate", ()=>{
    if(!win) createWindow();
});
