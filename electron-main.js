const {app, BrowserWindow, ipcMain} = require("electron");
const path = require("path");
const http = require("http");
const {spawn} = require("child_process");
const {autoUpdater} = require("electron-updater");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("enable-features", "MediaRouter");
app.commandLine.appendSwitch("enable-features", "CastMediaRoute");

let mainWindow;
let proxyServer = null;
const PROXY_PORT = 12345;
const STREAM_URL = "https://183.bozztv.com/giatv/giatv-magicplus/magicplus/chunks.m3u8";

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function getFfmpegPath(){
  try {
    var p = require("ffmpeg-static");
    if(p && require("fs").existsSync(p)) return p;
  } catch(e){}
  return "ffmpeg";
}

function startProxy(){
  return new Promise(function(resolve){
    if(proxyServer){ resolve(); return; }
    proxyServer = http.createServer(function(req, res){
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Access-Control-Allow-Origin", "*");
      var url = req.url.split("?")[0];
      if(url !== "/stream"){
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, {"Content-Type": "video/mp2t"});
      var ffmpegPath = getFfmpegPath();
      var args = [
        "-reconnect", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
        "-i", STREAM_URL,
        "-c", "copy",
        "-f", "mpegts",
        "pipe:1"
      ];
      var proc = spawn(ffmpegPath, args, {stdio: ["ignore", "pipe", "pipe"]});
      proc.stdout.pipe(res);
      proc.stderr.on("data", function(){});
      proc.on("error", function(err){
        console.log("ffmpeg error:", err.message);
        try{res.end();}catch(e){}
      });
      proc.on("close", function(){
        try{res.end();}catch(e){}
      });
      req.on("close", function(){
        try{proc.kill("SIGTERM");}catch(e){}
      });
    });
    proxyServer.listen(PROXY_PORT, "127.0.0.1", function(){
      console.log("proxy ok ffmpeg=yes port=" + PROXY_PORT);
      resolve();
    });
    proxyServer.on("error", function(err){
      console.log("proxy error:", err.message);
      resolve();
    });
  });
}

function createWindow(){
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, "www", "Magic Kids Logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "electron-preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile("prueba.html");
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on("closed", function(){ mainWindow = null; });

  mainWindow.webContents.on("did-finish-load", function(){
    autoUpdater.checkForUpdates().catch(function(){});
  });

  mainWindow.webContents.setWindowOpenHandler(function(details){
    require("electron").shell.openExternal(details.url);
    return {action: "deny"};
  });

  mainWindow.webContents.on("will-navigate", function(event, url){
    if(url !== mainWindow.webContents.getURL()){
      event.preventDefault();
      require("electron").shell.openExternal(url);
    }
  });
}

ipcMain.on("fullscreen-toggle", function(){
  if(!mainWindow) return;
  if(mainWindow.isFullScreen()){
    mainWindow.setFullScreen(false);
    mainWindow.webContents.send("fullscreen-change", false);
  } else {
    mainWindow.setFullScreen(true);
    mainWindow.webContents.send("fullscreen-change", true);
  }
});

ipcMain.on("fullscreen-exit", function(){
  if(!mainWindow) return;
  if(mainWindow.isFullScreen()){
    mainWindow.setFullScreen(false);
    mainWindow.webContents.send("fullscreen-change", false);
  }
});

ipcMain.on("install-update", function(){
  autoUpdater.quitAndInstall();
});

autoUpdater.on("update-available", function(){
  if(mainWindow) mainWindow.webContents.send("update-available");
});

autoUpdater.on("update-downloaded", function(){
  if(mainWindow) mainWindow.webContents.send("update-downloaded");
});

app.whenReady().then(function(){
  startProxy().then(createWindow);
});
app.on("window-all-closed", function(){ app.quit(); });
