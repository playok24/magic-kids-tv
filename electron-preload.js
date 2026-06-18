const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    fullscreenToggle: ()=> ipcRenderer.send("fullscreen-toggle"),
    fullscreenEnter: ()=> ipcRenderer.send("fullscreen-enter"),
    fullscreenExit: ()=> ipcRenderer.send("fullscreen-exit"),
    onFullscreenChange: (cb)=> ipcRenderer.on("fullscreen-changed", (e, isFs)=> cb(isFs)),
    onUpdateAvailable: (cb)=> ipcRenderer.on("update-available", (e, v)=> cb(v)),
    onUpdateProgress: (cb)=> ipcRenderer.on("update-progress", (e, pct)=> cb(pct)),
    onUpdateDownloaded: (cb)=> ipcRenderer.on("update-downloaded", cb),
    onUpdateError: (cb)=> ipcRenderer.on("update-error", (e, msg)=> cb(msg)),
    installUpdate: ()=> ipcRenderer.send("install-update"),
    checkForUpdates: ()=> ipcRenderer.send("check-for-updates"),
    counterFetch: (url)=> ipcRenderer.invoke("counter-fetch", url)
});
