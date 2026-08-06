const { ipcMain } = require("electron");
const os = require("os");
const mdnsLib = require("multicast-dns");
const { Client, DefaultMediaReceiver } = require("castv2-client");

let mainWindow = null;
let mdns = null;
let discovered = [];
let seenIds = {};
let currentClient = null;
let currentPlayer = null;
let currentDevice = null;

function setMainWindow(win) {
  mainWindow = win;
}

function sendStatus(status) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("cast-status", status);
  }
}

function startDiscovery() {
  if (mdns) return;
  mdns = mdnsLib();
  const handlePacket = function (packet) {
    const records = (packet.answers || []).concat(packet.additionals || []);
    const srvMap = {};
    records.forEach(function (a) {
      if (a.type === "SRV" && a.name && /_googlecast\._tcp\.local$/.test(a.name)) {
        srvMap[a.name] = { host: String(a.data.target).replace(/\.$/, ""), port: a.data.port };
      }
    });
    const devices = {};
    records.forEach(function (a) {
      if (a.type === "TXT" && a.name && /_googlecast\._tcp\.local$/.test(a.name)) {
        const srv = srvMap[a.name] || {};
        const txt = {};
        (a.data || []).forEach(function (b) {
          const s = String(b);
          const i = s.indexOf("=");
          if (i > 0) txt[s.slice(0, i).toLowerCase()] = s.slice(i + 1);
        });
        const id = txt.id || a.name;
        devices[id] = {
          id: id,
          name: txt.fn || id,
          host: srv.host || "",
          port: srv.port || 8009,
          model: txt.md || "",
          status: txt.st || ""
        };
      }
    });
    Object.keys(devices).forEach(function (id) {
      const dev = devices[id];
      if (dev.host && !seenIds[id]) {
        seenIds[id] = true;
        discovered.push(dev);
        console.log("cast device found:", dev.name, dev.host + ":" + dev.port);
        sendStatus({ type: "device", device: dev, devices: discovered });
      }
    });
  };
  mdns.on("response", handlePacket);
  mdns.on("query", handlePacket);
  const query = function () {
    if (mdns) {
      try { mdns.query([{ name: "_googlecast._tcp.local", type: "PTR" }]); } catch (e) {}
    }
  };
  query();
  setTimeout(query, 1500);
  setInterval(query, 4000);
}

function stopDiscovery() {
  if (mdns) {
    try { mdns.destroy(); } catch (e) {}
    mdns = null;
  }
}

function closeSession(cb) {
  const done = function () {
    if (currentClient) {
      try { currentClient.close(); } catch (e) {}
      currentClient = null;
    }
    currentPlayer = null;
    currentDevice = null;
    if (cb) cb();
  };
  if (currentPlayer) {
    const player = currentPlayer;
    try {
      player.stop(function () { done(); });
    } catch (e) { done(); }
  } else {
    done();
  }
}

function findDevice(deviceId) {
  if (deviceId) {
    const hit = discovered.filter(function (d) { return d.id === deviceId || d.name === deviceId; })[0];
    if (hit) return hit;
  }
  return discovered[0];
}

function castPlay(deviceId, url, contentType, cb) {
  console.log("castPlay called, deviceId=", deviceId, "url=", url);
  closeSession(function () {
    console.log("castPlay: session closed, searching device");
    const device = findDevice(deviceId);
    if (!device || !device.host) {
      console.log("castPlay: no device found");
      if (cb) cb(new Error("No se encontro ningun dispositivo Chromecast en la red."));
      return;
    }
    console.log("castPlay: connecting to", device.name, device.host + ":" + (device.port || 8009));
    currentDevice = device;
    const client = new Client();
    currentClient = client;
    sendStatus({ type: "connecting", device: device });
    client.on("error", function (err) {
      console.log("cast client error:", err.message);
      if (cb) cb(err);
    });
    client.on("close", function () {
      if (currentClient === client) {
        currentClient = null;
        currentPlayer = null;
        sendStatus({ type: "stopped" });
      }
    });
    client.connect({ host: device.host, port: device.port || 8009 }, function () {
      console.log("castPlay: connected, launching receiver");
      sendStatus({ type: "connected", device: device });
      client.launch(DefaultMediaReceiver, function (err, player) {
        if (err) {
          console.log("castPlay: launch error", err.message);
          if (cb) cb(err);
          return;
        }
        console.log("castPlay: receiver launched, loading media");
        currentPlayer = player;
        player.on("status", function () {});
        player.on("close", function () {
          if (currentPlayer === player) {
            currentPlayer = null;
            sendStatus({ type: "stopped" });
          }
        });
        const media = {
          contentId: url,
          contentType: contentType || "application/x-mpegURL",
          streamType: "LIVE"
        };
        player.load(media, { autoplay: true, currentTime: 0 }, function (loadErr) {
          if (loadErr) {
            console.log("castPlay: load error", loadErr.message);
            if (cb) cb(loadErr);
            return;
          }
          console.log("castPlay: playing!");
          sendStatus({ type: "playing", device: device });
          if (cb) cb(null, device);
        });
      });
    });
  });
}

function castStop(cb) {
  closeSession(function () {
    sendStatus({ type: "stopped" });
    if (cb) cb();
  });
}

function refreshDiscovery(done) {
  if (mdns) {
    try { mdns.query([{ name: "_googlecast._tcp.local", type: "PTR" }]); } catch (e) {}
  }
  setTimeout(done || function () {}, 2500);
}

function getLanIp() {
  try {
    const ifs = os.networkInterfaces();
    for (const name in ifs) {
      const arr = ifs[name];
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        const iface = arr[i];
        if (iface.family === "IPv4" && !iface.internal) return iface.address;
      }
    }
  } catch (e) {}
  return "127.0.0.1";
}

function setupIpc() {
  ipcMain.handle("cast:get-stream-url", function () {
    return "http://" + getLanIp() + ":12345/hls/playlist.m3u8";
  });
  ipcMain.handle("cast:discover", function () {
    return new Promise(function (resolve) {
      refreshDiscovery(function () {
        resolve(discovered.slice());
      });
    });
  });
  ipcMain.handle("cast:play", function (event, url, contentType, deviceId) {
    return new Promise(function (resolve, reject) {
      castPlay(deviceId, url, contentType, function (err, device) {
        if (err) reject({ message: err.message });
        else resolve({ ok: true, device: device });
      });
    });
  });
  ipcMain.handle("cast:stop", function () {
    return new Promise(function (resolve) {
      castStop(function () { resolve({ ok: true }); });
    });
  });
}

module.exports = {
  setMainWindow: setMainWindow,
  startDiscovery: startDiscovery,
  stopDiscovery: stopDiscovery,
  setupIpc: setupIpc
};
