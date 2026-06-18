require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const API_KEY = process.env.VISUAL_CROSSING_KEY;

app.get("/weather/:location", async (req, res) => {
    try {
        const location = req.params.location;

        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=metric&key=${API_KEY}&contentType=json`;

        const response = await fetch(url);
        const data = await response.json();

        res.json(data);
    } catch (err) {
    console.log("REAL ERROR:", err);
    res.status(500).json({ error: "Failed to fetch weather" });
}
});
console.log("API KEY:", process.env.VISUAL_CROSSING_KEY);
app.listen(3000, () => console.log("Server running on port 3000"));