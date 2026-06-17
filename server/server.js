const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

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

app.listen(PORT, () => {
    console.log(`Magic Kids TV Server running on port ${PORT}`);
});
