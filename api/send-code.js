const crypto = require("crypto");

const ADMIN_EMAILS = ["hgastonsanchez@gmail.com"];
const PROJECT_ID = "contadores-magic";
const CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certCache = null;
let certCacheAt = 0;

function b64urlDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64").toString("utf8");
}

function b64urlBuf(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

function pemFromCert(b64) {
  const body = (b64.match(/.{1,64}/g) || []).join("\n");
  return "-----BEGIN CERTIFICATE-----\n" + body + "\n-----END CERTIFICATE-----\n";
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getCerts() {
  const now = Date.now();
  if (certCache && now - certCacheAt < 3600000) return certCache;
  const resp = await fetch(CERT_URL);
  if (!resp.ok) return certCache;
  certCache = await resp.json();
  certCacheAt = now;
  return certCache;
}

async function verifyIdToken(idToken) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) return null;
  let header;
  try {
    header = JSON.parse(b64urlDecode(parts[0]));
  } catch (e) {
    return null;
  }
  if (!header || header.alg !== "RS256") return null;
  let payload;
  try {
    payload = JSON.parse(b64urlDecode(parts[1]));
  } catch (e) {
    return null;
  }
  if (!payload) return null;
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) return null;
  if (payload.aud !== PROJECT_ID) return null;
  if (payload.iss !== "https://securetoken.google.com/" + PROJECT_ID) return null;
  const certs = await getCerts();
  const cert = certs && certs[header.kid];
  if (!cert) return null;
  const pem = pemFromCert(cert);
  try {
    const ok = crypto.verify("RSA-SHA256", Buffer.from(parts[0] + "." + parts[1]), pem, b64urlBuf(parts[2]));
    if (!ok) return null;
  } catch (e) {
    return null;
  }
  return payload;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const body = req.body || {};
  const idToken = body.idToken;
  if (!idToken) return res.status(401).json({ ok: false, error: "No autorizado" });

  const payload = await verifyIdToken(idToken);
  if (!payload) return res.status(401).json({ ok: false, error: "Token invalido" });

  const email = (payload.email || "").toLowerCase();
  if (ADMIN_EMAILS.indexOf(email) === -1) {
    return res.status(403).json({ ok: false, error: "No tenes permisos de administrador" });
  }

  const to = (body.to || "").trim();
  const code = (body.code || "").trim();
  const message = (body.message || "").trim();

  if (!to || to.indexOf("@") === -1) return res.status(400).json({ ok: false, error: "Email del usuario invalido" });
  if (!code) return res.status(400).json({ ok: false, error: "Falta la clave" });

  const API_KEY = process.env.BREVO_API_KEY;
  if (!API_KEY) return res.status(500).json({ ok: false, error: "API key de email no configurada en Vercel" });

  const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || email;
  const SENDER_NAME = process.env.BREVO_SENDER_NAME || "Magic Kids TV";

  const safeCode = esc(code);
  const safeMessage = esc(message).replace(/\n/g, "<br>");

  const html =
    "<p>Hola!</p>" +
    "<p>Te enviamos tu clave de acceso a <b>Magic Kids TV</b>:</p>" +
    "<p style=\"font-size:26px;font-weight:700;letter-spacing:4px;color:#7c3aed;font-family:monospace\">" + safeCode + "</p>" +
    (safeMessage ? "<p>" + safeMessage + "</p>" : "") +
    "<p>Ingresala cuando la app te la pida. Guardala en un lugar seguro.</p>";

  const text =
    "Hola!\n\nTe enviamos tu clave de acceso a Magic Kids TV:\n\n" +
    code +
    (message ? "\n\n" + message : "") +
    "\n\nIngresala cuando la app te la pida. Guardala en un lugar seguro.";

  try {
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        to: [{ email: to }],
        subject: "Tu clave de acceso - Magic Kids TV",
        htmlContent: html,
        textContent: text
      })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.log("Brevo error:", resp.status, errText);
      return res.status(502).json({ ok: false, error: "Error al enviar el email" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.log("Send error:", err.message);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
};
