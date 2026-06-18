require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const API_KEY = process.env.VISUAL_CROSSING_KEY;

app.get("/weather/:location", async (req, res) => {
    try {
        const location = req.params.location;
        // Grab the unit dynamic parameter sent from the frontend if available, fallback to metric
        const unitGroup = req.query.unitGroup || 'metric';

        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=${unitGroup}&key=${API_KEY}&contentType=json`;

        const response = await fetch(url);
        const data = await response.json();

        res.json(data);
    } catch (err) {
        console.log("REAL ERROR:", err);
        res.status(500).json({ error: "Failed to fetch weather" });
    }
});

// VERCEL CONFIG COMPATIBILITY FIX:
// Only run app.listen locally. When deployed on Vercel, export the app module instead.
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log("Local Express server running on port 3000"));
}

module.exports = app;