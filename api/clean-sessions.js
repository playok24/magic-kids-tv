const https = require("https");

const DB_URL = "https://contadores-magic-default-rtdb.firebaseio.com";
const STALE_MS = 120000;

function fbGet(path) {
  return new Promise((resolve, reject) => {
    https.get(DB_URL + path + ".json", (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve(null); }
      });
    }).on("error", reject);
  });
}

function fbDelete(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(DB_URL + path + ".json");
    const req = https.request({ hostname: url.hostname, path: url.pathname, method: "DELETE" }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(d));
    });
    req.on("error", reject);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const sessions = await fbGet("/sessions");
    if (!sessions || typeof sessions !== "object") {
      return res.json({ ok: true, removed: 0, remaining: 0 });
    }

    const now = Date.now();
    const keys = Object.keys(sessions);
    let removed = 0;
    let remaining = 0;

    for (const key of keys) {
      const s = sessions[key];
      const ts = (s && s.localTs) || 0;
      if (ts === 0 || (now - ts) > STALE_MS || (ts - now) > STALE_MS) {
        await fbDelete("/sessions/" + key);
        removed++;
      } else {
        remaining++;
      }
    }

    return res.json({ ok: true, removed, remaining, checked: keys.length });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
