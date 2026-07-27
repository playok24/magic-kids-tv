module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ active: false, error: "Method not allowed" });

  const { email } = req.body || {};
  if (!email || !email.includes("@")) {
    return res.status(400).json({ active: false, error: "Email invalido" });
  }

  const ADMIN_EMAILS = ["hgastonsanchez@gmail.com"];
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return res.json({ active: true, admin: true });
  }

  const TOKEN = process.env.MP_ACCESS_TOKEN;
  const PLAN_ID = "bf79a3ff88fb416d82052b8429521eda";

  try {
    const url = "https://api.mercadopago.com/preapproval/search?" + new URLSearchParams({
      payer_email: email,
      status: "authorized"
    });
    const resp = await fetch(url, {
      headers: { "Authorization": "Bearer " + TOKEN }
    });
    if (!resp.ok) {
      console.log("MercadoPago error:", resp.status);
      return res.status(502).json({ active: false, error: "Error de MercadoPago" });
    }
    const data = await resp.json();
    const found = (data.results || []).some(function(r) {
      return r.preapproval_plan_id === PLAN_ID && r.status === "authorized";
    });
    return res.json({ active: found });
  } catch (err) {
    console.log("Verify error:", err.message);
    return res.status(500).json({ active: false, error: "Error interno" });
  }
};
