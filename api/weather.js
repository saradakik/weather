require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const API_KEY = process.env.VISUAL_CROSSING_KEY;

// Using a wildcard catch-all ('*') ensures that no matter what sub-path 
// Vercel forwards to this file, Express will capture it.
app.all("*", async (req, res) => {
    try {
        // Fallback checks to extract the location variable from the URL string safely
        let location = req.params[0] || req.path.split("/").pop();
        
        // If the path parsing accidentally grabs "weather", clean it up
        if (location === "weather" || !location) {
            location = "London"; // Safe backup city
        }

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

if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log("Local server running on port 3000"));
}

module.exports = app;