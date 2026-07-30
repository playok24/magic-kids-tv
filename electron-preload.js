const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  fullscreenToggle: function(){ ipcRenderer.send("fullscreen-toggle"); },
  fullscreenExit: function(){ ipcRenderer.send("fullscreen-exit"); },
  onFullscreenChange: function(cb){ ipcRenderer.on("fullscreen-change", function(e, isFs){ cb(isFs); }); },
  onUpdateAvailable: function(cb){ ipcRenderer.on("update-available", function(){ cb(); }); },
  onUpdateDownloaded: function(cb){ ipcRenderer.on("update-downloaded", function(){ cb(); }); },
  installUpdate: function(){ ipcRenderer.send("install-update"); }
});
