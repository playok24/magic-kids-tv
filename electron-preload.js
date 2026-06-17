const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    fullscreenToggle: ()=> ipcRenderer.send("fullscreen-toggle"),
    fullscreenEnter: ()=> ipcRenderer.send("fullscreen-enter"),
    fullscreenExit: ()=> ipcRenderer.send("fullscreen-exit"),
    onUpdateAvailable: (cb)=> ipcRenderer.on("update-available", (e, v)=> cb(v)),
    onUpdateProgress: (cb)=> ipcRenderer.on("update-progress", (e, pct)=> cb(pct)),
    onUpdateDownloaded: (cb)=> ipcRenderer.on("update-downloaded", cb),
    installUpdate: ()=> ipcRenderer.send("install-update"),
    checkForUpdates: ()=> ipcRenderer.send("check-for-updates"),
    counterFetch: (url)=> ipcRenderer.invoke("counter-fetch", url)
});
