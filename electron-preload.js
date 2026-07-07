const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    fullscreenToggle: () => ipcRenderer.send("fullscreen-toggle"),
    fullscreenEnter: () => ipcRenderer.send("fullscreen-enter"),
    fullscreenExit: () => ipcRenderer.send("fullscreen-exit"),
    onFullscreenChange: (cb) => ipcRenderer.on("fullscreen-changed", (e, isFs) => cb(isFs)),
    checkForUpdates: () => ipcRenderer.send("check-for-updates"),
    installUpdate: () => ipcRenderer.send("install-update"),
    onUpdateAvailable: (cb) => ipcRenderer.on("update-available", (e, v) => cb(v)),
    onUpdateProgress: (cb) => ipcRenderer.on("update-progress", (e, p) => cb(p)),
    onUpdateDownloaded: (cb) => ipcRenderer.on("update-downloaded", () => cb()),
    onUpdateNotAvailable: (cb) => ipcRenderer.on("update-not-available", () => cb()),
    onUpdateError: (cb) => ipcRenderer.on("update-error", (e, msg) => cb(msg)),
    counterFetch: (url) => ipcRenderer.invoke("counter-fetch", url)
});
