const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    fullscreenToggle: () => ipcRenderer.send("fullscreen-toggle"),
    fullscreenEnter: () => ipcRenderer.send("fullscreen-enter"),
    fullscreenExit: () => ipcRenderer.send("fullscreen-exit"),
    onFullscreenChange: (cb) => ipcRenderer.on("fullscreen-changed", (e, isFs) => cb(isFs)),
    onUpdateNotAvailable: (cb) => ipcRenderer.on("update-not-available", cb),
    checkForUpdates: () => ipcRenderer.send("check-for-updates"),
    installUpdate: () => {},
    counterFetch: (url) => ipcRenderer.invoke("counter-fetch", url)
});
