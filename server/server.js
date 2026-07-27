const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

const MERCADOPAGO_TOKEN = process.env.MP_ACCESS_TOKEN || "APP_USR-4724292899718526-072709-7c9154911b8ef56cb4a7bd2867f69607-24016621";
const PLAN_ID = "bf79a3ff88fb416d82052b8429521eda";

let viewerCount = 0;

app.get("/api/viewers", (req, res) => {
    res.json({ count: viewerCount });
});

app.post("/api/viewers/increment", (req, res) => {
    viewerCount++;
    res.json({ count: viewerCount });
});

app.post("/api/viewers/decrement", (req, res) => {
    if (viewerCount > 0) viewerCount--;
    res.json({ count: viewerCount });
});

app.post("/api/verify-subscription", async (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
        return res.status(400).json({ active: false, error: "Email invalido" });
    }
    const ADMIN_EMAILS = ["hgastonsanchez@gmail.com"];
    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
        return res.json({ active: true, admin: true });
    }
    try {
        const url = "https://api.mercadopago.com/preapproval/search?" + new URLSearchParams({
            payer_email: email,
            status: "authorized"
        });
        const resp = await fetch(url, {
            headers: { "Authorization": "Bearer " + MERCADOPAGO_TOKEN }
        });
        if (!resp.ok) {
            console.log("MercadoPago API error:", resp.status, await resp.text());
            return res.status(502).json({ active: false, error: "Error de MercadoPago" });
        }
        const data = await resp.json();
        const found = (data.results || []).some(function(r) {
            return r.preapproval_plan_id === PLAN_ID && r.status === "authorized";
        });
        res.json({ active: found });
    } catch (err) {
        console.log("Subscription verify error:", err.message);
        res.status(500).json({ active: false, error: "Error interno" });
    }
});

app.listen(PORT, () => {
    console.log(`Magic Kids TV Server running on port ${PORT}`);
});
