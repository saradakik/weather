require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const API_KEY = process.env.VISUAL_CROSSING_KEY;

// SUPPORT MULTIPLE PATHS: 
// Matches normal frontend calls, vercel functions, and stripped route paths smoothly.
app.get(["/api/weather/:location", "/weather/:location", "/:location"], async (req, res) => {
    try {
        const location = req.params.location;
        // Capture the unit group passed by your app.js (?unitGroup=us or metric)
        const unitGroup = req.query.unitGroup || 'metric';

        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=${unitGroup}&key=${API_KEY}&contentType=json`;

        const response = await fetch(url);
        
        if (!response.ok) {
            return res.status(response.status).json({ error: "Failed fetching data from Visual Crossing" });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.log("REAL ERROR:", err);
        res.status(500).json({ error: "Failed to fetch weather" });
    }
});

// Avoid port binding lockups on Vercel production environments
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log("Local server running on port 3000"));
}

module.exports = app;