const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const https = require("https");
const fs = require("fs");

let win;
const logPath = path.join(app.getPath("userData"), "mk-error.log");

function logErr(msg, err) {
  try {
    const s = new Date().toISOString() + " " + msg + (err ? " " + (err.stack || err.message || err) : "") + "\n";
    fs.appendFileSync(logPath, s);
  } catch (e) {}
}

app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    setTimeout(() => {
      if (win) win.webContents.send("update-not-available");
    }, 5000);
  });
}

function createWindow() {
  try {
    win = new BrowserWindow({
      width: 1380,
      height: 783,
      center: true,
      resizable: true,
      autoHideMenuBar: true,
      title: "",
      icon: path.join(__dirname, "icon.ico"),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        backgroundThrottling: false,
        preload: path.join(__dirname, "electron-preload.js")
      }
    });

    win.loadFile(path.join(__dirname, "prueba.html"));

    win.on("closed", () => {
      win = null;
    });

    win.on("enter-full-screen", () => {
      if (win) win.webContents.send("fullscreen-changed", true);
    });
    win.on("leave-full-screen", () => {
      if (win) win.webContents.send("fullscreen-changed", false);
    });

    win.webContents.on("before-input-event", (e, input) => {
      if (input.key === "F11") {
        e.preventDefault();
        if (win) win.setFullScreen(!win.isFullScreen());
      }
    });

    win.webContents.on("did-finish-load", () => {
      if (win) {
        win.show();
        win.focus();
      }
    });

    win.webContents.on("crashed", (event, killed) => {
      logErr("Renderer crashed", { killed });
    });

    win.webContents.on("unresponsive", () => {
      logErr("Renderer unresponsive");
    });
  } catch (e) {
    logErr("createWindow failed", e);
  }
}

ipcMain.on("fullscreen-toggle", () => {
  if (!win) return;
  win.setFullScreen(!win.isFullScreen());
});

ipcMain.on("fullscreen-enter", () => {
  if (!win) return;
  win.setFullScreen(true);
});

ipcMain.on("fullscreen-exit", () => {
  if (!win) return;
  win.setFullScreen(false);
});

ipcMain.on("check-for-updates", () => {
  setTimeout(() => {
    if (win) win.webContents.send("update-not-available");
  }, 1500);
});

ipcMain.handle("counter-fetch", async (event, url) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(null); }
      });
    }).on("error", () => resolve(null));
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (!win) createWindow();
});
