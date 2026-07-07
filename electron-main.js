const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const https = require("https");
const http = require("http");
const fs = require("fs");
const { spawn } = require("child_process");

let win;
const logPath = path.join(app.getPath("userData"), "mk-error.log");
function logErr(msg, err) {
  try {
    const s = new Date().toISOString() + " " + msg + (err ? " " + (err.stack || err.message || err) : "") + "\n";
    fs.appendFileSync(logPath, s);
  } catch (e) {}
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const MOBILE_UA = "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
app.userAgentFallback = MOBILE_UA;

const HLS_URL = "https://183.bozztv.com/giatv/giatv-magicplus/magicplus/chunks.m3u8";
const PROXY_PORT = 12345;

let ffmpegPath = null;
try { ffmpegPath = require("ffmpeg-static"); } catch (e) {}
if (ffmpegPath && app.isPackaged) {
  const unpackedDir = path.join(process.resourcesPath, "app.asar.unpacked");
  const p = path.join(unpackedDir, "node_modules", "ffmpeg-static", "ffmpeg.exe");
  if (fs.existsSync(p)) ffmpegPath = p;
  else logErr("ffmpeg unpacked not found at " + p);
}

function startStream(res) {
  if (!ffmpegPath) { logErr("ffmpeg not found"); if (!res.writableEnded) { res.writeHead(502); res.end("no_ffmpeg"); } return; }
  const proc = spawn(ffmpegPath, [
    "-user_agent", MOBILE_UA,
    "-analyzeduration", "500000",
    "-i", HLS_URL,
    "-c", "copy",
    "-bsf:a", "aac_adtstoasc",
    "-f", "mp4",
    "-movflags", "frag_keyframe+default_base_moof",
    "-"
  ], { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
  proc.stdout.pipe(res);
  let errBuf = "";
  proc.stderr.on("data", (d) => { errBuf += d; if (errBuf.length > 2000) errBuf = errBuf.slice(-2000); });
  proc.on("error", (e) => { logErr("spawn " + e.message); if (!res.writableEnded) res.end(); });
  proc.on("exit", (code, sig) => {
    logErr("ffmpeg exit=" + code + " sig=" + sig);
    if (!res.writableEnded) res.end();
  });
  res.on("close", () => { proc.kill(); });
}

function startServer() {
  const server = http.createServer((req, res) => {
    if (req.url === "/stream") {
      res.writeHead(200, { "Content-Type": "video/mp4", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache" });
      startStream(res);
    } else if (req.method === "OPTIONS") {
      res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET", "Access-Control-Allow-Headers": "*" });
      res.end();
    } else { res.writeHead(404); res.end(); }
  });
  server.on("error", (e) => logErr("server", e));
  server.listen(PROXY_PORT, "127.0.0.1", () => logErr("proxy ok ffmpeg=" + (ffmpegPath ? "yes" : "no")));
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit(); }
else {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });

  let updateTimer = null;
  function checkUpdates() {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      if (win) win.webContents.send("update-not-available");
      updateTimer = null;
    }, 15000);
    autoUpdater.checkForUpdates();
  }
  function onUpdateResult(handler) {
    return (...args) => {
      if (updateTimer) { clearTimeout(updateTimer); updateTimer = null; }
      handler(...args);
    };
  }

  app.whenReady().then(() => { startServer(); createWindow(); setTimeout(checkUpdates, 10000); });
  setInterval(checkUpdates, 30 * 60 * 1000);

  autoUpdater.on("update-available", onUpdateResult((info) => {
    if (win) win.webContents.send("update-available", info.version);
    autoUpdater.checkForUpdatesAndNotify();
  }));
  autoUpdater.on("download-progress", (d) => {
    const pct = Math.round(d.percent);
    if (win) win.webContents.send("update-progress", pct);
  });
  autoUpdater.on("update-downloaded", onUpdateResult(() => {
    if (win) win.webContents.send("update-downloaded");
  }));
  autoUpdater.on("error", onUpdateResult((err) => {
    if (win) win.webContents.send("update-error", err.message || "Error de conexion");
  }));
}

function createWindow() {
  try {
    win = new BrowserWindow({
      width: 1380, height: 783, center: true, resizable: true, autoHideMenuBar: true, title: "",
      icon: path.join(__dirname, "icon.ico"),
      webPreferences: { nodeIntegration: false, contextIsolation: true, webSecurity: false, backgroundThrottling: false, preload: path.join(__dirname, "electron-preload.js") }
    });
    win.loadFile(path.join(__dirname, "prueba.html"));
    win.on("closed", () => { win = null; });
    win.on("enter-full-screen", () => { if (win) win.webContents.send("fullscreen-changed", true); });
    win.on("leave-full-screen", () => { if (win) win.webContents.send("fullscreen-changed", false); });
    win.webContents.on("before-input-event", (e, input) => { if (input.key === "F11") { e.preventDefault(); if (win) win.setFullScreen(!win.isFullScreen()); } });
    win.webContents.on("did-finish-load", () => { if (win) { win.show(); win.focus(); } });
    win.webContents.on("crashed", (event, killed) => { logErr("crash", { killed }); });
    win.webContents.on("unresponsive", () => { logErr("unresponsive"); });
  } catch (e) { logErr("create", e); }
}

ipcMain.on("fullscreen-toggle", () => { if (win) win.setFullScreen(!win.isFullScreen()); });
ipcMain.on("fullscreen-enter", () => { if (win) win.setFullScreen(true); });
ipcMain.on("fullscreen-exit", () => { if (win) win.setFullScreen(false); });
ipcMain.on("check-for-updates", () => { checkUpdates(); });
ipcMain.on("install-update", () => { autoUpdater.quitAndInstall(); });
ipcMain.handle("counter-fetch", async (event, url) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch (e) { resolve(null); } });
    }).on("error", () => resolve(null));
  });
});
app.on("window-all-closed", () => { app.quit(); });
app.on("activate", () => { if (!win) createWindow(); });
