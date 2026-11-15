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
let streamProcs = [];
const PROXY_PORT = 12345;
const STREAMS = [
  "https://183.giatvcdn.com/giatv/giatv-magicplus/magicplus/chunks.m3u8",
  "https://183.giatvcdn.com/giatv/giatv-iguana/iguana/chunks.m3u8",
  "https://183.giatvcdn.com/giatv/giatv-cgtveplus/cgtveplus/chunks.m3u8"
];
/* Default = indice 0 (magicplus / Magic Kids). Iguana (1) puede dar 404 cuando
   no hay transmision activa. El valor de arranque es fijo, no se sondea nada.
   El usuario puede elegir otro con los botones. */
let currentStreamIndex = 0;
function getCurrentStreamUrl(){
  return STREAMS[currentStreamIndex] || STREAMS[0];
}
const HLS_DIR = path.join(os.tmpdir(), "magickids_hls");

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function getFfmpegPath(){
  try {
    var fs = require("fs");
    var p = require("ffmpeg-static");
    if(!p) return "ffmpeg";
    if(p.indexOf('"') >= 0) p = p.replace(/"/g, "");
    /* Dentro de app.asar un ejecutable NO se puede lanzar: hay que apuntar a la
       copia real de app.asar.unpacked. Con la ruta del asar, ffmpeg no
       arrancaba, el pipe moria y el player caia al HLS remoto lento
       ("Cargando senal..." infinito). */
    if(p.indexOf("app.asar") >= 0){
      p = p.replace("app.asar.unpacked", "app.asar").replace("app.asar", "app.asar.unpacked");
    }
    if(fs.existsSync(p)) return p;
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

/* Borra el playlist y los segmentos de la corrida anterior. Sin esto, al
   cambiar de canal el player pide segmentos del canal viejo (o un playlist con
   una MEDIA-SEQUENCE que ya no existe) y se queda esperando / corta. */
function clearHlsDir(){
  try {
    var files = fs.readdirSync(HLS_DIR);
    for (var i = 0; i < files.length; i++) {
      if (files[i] === "playlist.m3u8" || files[i].indexOf("seg_") === 0) {
        try { fs.unlinkSync(path.join(HLS_DIR, files[i])); } catch(e) {}
      }
    }
  } catch(e) {}
}

var lastHlsStart = 0;
function startHlsReencode(){
  if (hlsProc) return;
  /* Si ffmpeg muere (canal caido), hls.js reintenta el playlist enseguida y
     cada pedido relanzaria ffmpeg. Se limita a uno cada 4s para no llenar el
     sistema de procesos. */
  if (Date.now() - lastHlsStart < 4000) return;
  lastHlsStart = Date.now();
  lastHlsRequest = Date.now();
  ensureHlsDir();
  clearHlsDir();
  var ffmpegPath = getFfmpegPath();
  var seg = path.join(HLS_DIR, "seg_%d.ts");
  var playlist = path.join(HLS_DIR, "playlist.m3u8");
  var args = [
    "-reconnect", "1",
    "-reconnect_streamed", "1",
    "-reconnect_delay_max", "5",
    "-re",
    "-i", getCurrentStreamUrl(),
    "-c", "copy",
    "-f", "hls",
    "-hls_time", "4",
    "-hls_list_size", "10",
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

function serveHlsFile(file, res, contentType, tries, maxTries){
  var attempts = tries || 0;
  var limit = (maxTries === undefined) ? 40 : maxTries;
  fs.readFile(file, function(err, data){
    if (!err && data){
      res.writeHead(200, {"Content-Type": contentType});
      res.end(data);
      return;
    }
    if (attempts > limit){
      res.writeHead(404);
      res.end();
      return;
    }
    setTimeout(function(){ serveHlsFile(file, res, contentType, attempts + 1, limit); }, 500);
  });
}

/* Vigila que el ffmpeg del HLS local siga escribiendo. Si el playlist no se
   actualiza en 30s, el proceso quedo colgado (RTMP caido / reconexion) y se lo
   mata: el proximo pedido del player lo relanza con la URL actual. Tambien lo
   corta si hace 60s que nadie pide nada (player cerrado o en pausa), para no
   seguir bajando el canal al pedo. */
var hlsWatchdog = null;
var lastHlsRequest = 0;
function startHlsWatchdog(){
  if (hlsWatchdog) return;
  hlsWatchdog = setInterval(function(){
    if (!hlsProc) return;
    if (lastHlsRequest && Date.now() - lastHlsRequest > 60000) {
      console.log("hls: sin pedidos hace 60s, deteniendo ffmpeg");
      try { hlsProc.removeAllListeners(); hlsProc.kill("SIGKILL"); } catch(e) {}
      hlsProc = null;
      return;
    }
    try {
      var st = fs.statSync(path.join(HLS_DIR, "playlist.m3u8"));
      if (Date.now() - st.mtimeMs > 30000) {
        console.log("hls: playlist congelado, reiniciando ffmpeg");
        try { hlsProc.removeAllListeners(); hlsProc.kill("SIGKILL"); } catch(e) {}
        hlsProc = null;
      }
    } catch(e) {}
  }, 5000);
  if (hlsWatchdog.unref) hlsWatchdog.unref();
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
        lastHlsRequest = Date.now();
        startHlsReencode();
        serveHlsFile(path.join(HLS_DIR, "playlist.m3u8"), res, "application/vnd.apple.mpegurl", 0, 30);
        return;
      }
      if(url.indexOf("/hls/seg_") === 0){
        lastHlsRequest = Date.now();
        startHlsReencode();
        /* Un segmento listado en el playlist ya existe en disco: si no esta, es
           que ffmpeg lo borro (o cambio de canal). No se espera 20s por el. */
        serveHlsFile(path.join(HLS_DIR, path.basename(url)), res, "video/m2ts", 0, 6);
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
        "-i", getCurrentStreamUrl(),
        "-c", "copy",
        "-f", "mpegts",
        "pipe:1"
      ];
      var proc = spawn(ffmpegPath, args, {stdio: ["ignore", "pipe", "pipe"]});
      streamProcs.push(proc);
      proc.stdout.pipe(res);
      proc.stderr.on("data", function(){});
      proc.on("error", function(err){
        console.log("ffmpeg error:", err.message);
        try{res.end();}catch(e){}
      });
      proc.on("close", function(){
        streamProcs = streamProcs.filter(function(p){ return p !== proc; });
        try{res.end();}catch(e){}
      });
      function killProc(){
        try{ proc.kill("SIGKILL"); }catch(e){}
        streamProcs = streamProcs.filter(function(p){ return p !== proc; });
      }
      req.on("close", killProc);
      res.on("close", killProc);
    });
    proxyServer.listen(PROXY_PORT, "0.0.0.0", function(){
      console.log("proxy ok ffmpeg=yes port=" + PROXY_PORT + " lan=" + getLanIp());
      startHlsWatchdog();
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
      nodeIntegration: false,
      backgroundThrottling: false
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

function shutdown(){
  try { if (hlsProc) { hlsProc.removeAllListeners(); hlsProc.kill("SIGKILL"); hlsProc = null; } } catch (e) {}
  try { streamProcs.slice().forEach(function(p){ try{ p.kill("SIGKILL"); }catch(e){} }); streamProcs = []; } catch (e) {}
  try { if (proxyServer) { proxyServer.close(); proxyServer.closeAllConnections && proxyServer.closeAllConnections(); proxyServer = null; } } catch (e) {}
  try { castService.stopDiscovery(); } catch (e) {}
}

ipcMain.on("install-update", function(){
  shutdown();
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle("app:get-version", function(){
  return app.getVersion();
});

autoUpdater.on("update-available", function(){
  if(mainWindow) mainWindow.webContents.send("update-available");
});

autoUpdater.on("update-downloaded", function(){
  if(mainWindow) mainWindow.webContents.send("update-downloaded");
});

ipcMain.on("stream:set", function(e, idx){
  var i = parseInt(idx, 10);
  if (!(i >= 0 && i < STREAMS.length)) return;
  currentStreamIndex = i;
  try { if (hlsProc) { hlsProc.removeAllListeners(); hlsProc.kill("SIGTERM"); hlsProc = null; } } catch (err) {}
  /* El playlist y los segmentos del canal anterior no sirven: si quedan en
     disco, el player los pide y se queda esperando archivos que ya no existen
     (o reproduce un pedazo del canal viejo). */
  clearHlsDir();
  lastHlsStart = 0;
  try { streamProcs.slice().forEach(function(p){ p.kill("SIGKILL"); }); streamProcs = []; } catch (err) {}
  if (mainWindow) mainWindow.webContents.send("stream-changed", currentStreamIndex);
});

ipcMain.handle("stream:get", function(){ return currentStreamIndex; });

app.whenReady().then(function(){
  castService.setupIpc();
  castService.startDiscovery();
  startProxy().then(createWindow);
});
app.on("window-all-closed", function(){
  shutdown();
  app.quit();
});
app.on("before-quit", function(){ shutdown(); });
app.on("will-quit", function(){ shutdown(); });
