const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  fullscreenToggle: function(){ ipcRenderer.send("fullscreen-toggle"); },
  fullscreenExit: function(){ ipcRenderer.send("fullscreen-exit"); },
  onFullscreenChange: function(cb){ ipcRenderer.on("fullscreen-change", function(e, isFs){ cb(isFs); }); },
  onUpdateAvailable: function(cb){ ipcRenderer.on("update-available", function(){ cb(); }); },
  onUpdateDownloaded: function(cb){ ipcRenderer.on("update-downloaded", function(){ cb(); }); },
  installUpdate: function(){ ipcRenderer.send("install-update"); }
});

contextBridge.exposeInMainWorld("castAPI", {
  discover: function(){ return ipcRenderer.invoke("cast:discover"); },
  getStreamUrl: function(){ return ipcRenderer.invoke("cast:get-stream-url"); },
  play: function(url, contentType, deviceId){ return ipcRenderer.invoke("cast:play", url, contentType, deviceId); },
  stop: function(){ return ipcRenderer.invoke("cast:stop"); },
  onStatus: function(cb){ ipcRenderer.on("cast-status", function(e, status){ cb(status); }); }
});
