const {app, BrowserWindow, ipcMain} = require("electron");
const path = require("path");
const http = require("http");
const os = require("os");
const fs = require("fs");
const {spawn} = require("child_process");
const {autoUpdater} = require("electron-updater");
const castService = require("./cast-service");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let mainWindow;
let proxyServer = null;
let hlsProc = null;
const PROXY_PORT = 12345;
const STREAM_URL = "https://183.bozztv.com/giatv/giatv-magicplus/magicplus/chunks.m3u8";
const HLS_DIR = path.join(os.tmpdir(), "magickids_hls");

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function getFfmpegPath(){
  try {
    var p = require("ffmpeg-static");
    if(p && require("fs").existsSync(p)) return p;
  } catch(e){}
  return "ffmpeg";
}

function getLanIp(){
  try {
    var ifs = os.networkInterfaces();
    for (var name in ifs) {
      var arr = ifs[name];
      if (!arr) continue;
      for (var i = 0; i < arr.length; i++) {
        var iface = arr[i];
        if (iface.family === "IPv4" && !iface.internal) return iface.address;
      }
    }
  } catch(e){}
  return "127.0.0.1";
}

function ensureHlsDir(){
  try { fs.mkdirSync(HLS_DIR, {recursive: true}); } catch(e){}
}

function startHlsReencode(){
  if (hlsProc) return;
  ensureHlsDir();
  var ffmpegPath = getFfmpegPath();
  var seg = path.join(HLS_DIR, "seg_%d.ts");
  var playlist = path.join(HLS_DIR, "playlist.m3u8");
  var args = [
    "-reconnect", "1",
    "-reconnect_streamed", "1",
    "-reconnect_delay_max", "5",
    "-i", STREAM_URL,
    "-c", "copy",
    "-f", "hls",
    "-hls_time", "4",
    "-hls_list_size", "6",
    "-hls_flags", "delete_segments+independent_segments",
    "-hls_segment_filename", seg,
    playlist
  ];
  hlsProc = spawn(ffmpegPath, args, {stdio: ["ignore", "pipe", "pipe"]});
  hlsProc.stderr.on("data", function(){});
  hlsProc.on("error", function(err){ console.log("hls ffmpeg error:", err.message); });
  hlsProc.on("close", function(){ hlsProc = null; });
}

function serveFile(file, res, contentType){
  fs.readFile(file, function(err, data){
    if (err || !data){
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {"Content-Type": contentType});
    res.end(data);
  });
}

function serveHlsFile(file, res, contentType, tries){
  var attempts = tries || 0;
  fs.readFile(file, function(err, data){
    if (!err && data){
      res.writeHead(200, {"Content-Type": contentType});
      res.end(data);
      return;
    }
    if (attempts > 40){
      res.writeHead(404);
      res.end();
      return;
    }
    setTimeout(function(){ serveHlsFile(file, res, contentType, attempts + 1); }, 500);
  });
}

function startProxy(){
  return new Promise(function(resolve){
    if(proxyServer){ resolve(); return; }
    proxyServer = http.createServer(function(req, res){
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Access-Control-Allow-Origin", "*");
      var url = req.url.split("?")[0];
      if(url === "/hls/playlist.m3u8"){
        console.log("hls: playlist requested from", req.socket.remoteAddress);
        startHlsReencode();
        serveHlsFile(path.join(HLS_DIR, "playlist.m3u8"), res, "application/vnd.apple.mpegurl");
        return;
      }
      if(url.indexOf("/hls/seg_") === 0){
        console.log("hls: segment requested", path.basename(url), "from", req.socket.remoteAddress);
        startHlsReencode();
        serveHlsFile(path.join(HLS_DIR, path.basename(url)), res, "video/m2ts");
        return;
      }
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
    proxyServer.listen(PROXY_PORT, "0.0.0.0", function(){
      console.log("proxy ok ffmpeg=yes port=" + PROXY_PORT + " lan=" + getLanIp());
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
    backgroundColor: "#0a0a1a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "electron-preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.once("ready-to-show", function(){
    if(mainWindow) mainWindow.show();
  });
  setTimeout(function(){
    if(mainWindow && !mainWindow.isVisible()) mainWindow.show();
  }, 4000);
  mainWindow.loadFile("prueba.html");
  mainWindow.setMenuBarVisibility(false);
  castService.setMainWindow(mainWindow);

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
  castService.setupIpc();
  castService.startDiscovery();
  startProxy().then(createWindow);
});
app.on("window-all-closed", function(){ app.quit(); });
