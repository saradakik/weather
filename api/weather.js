// api/weather.js
export default async function handler(req, res) {
    // Handle CORS setup headers natively
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Vercel automatically extracts wildcard tokens and queries into req.query
        // It reads both /api/weather/:location and ?unitGroup=us effortlessly
        const { location, unitGroup } = req.query;
        
        // Grab the key from Vercel's secure environment vault
        const API_KEY = process.env.VISUAL_CROSSING_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: "Server Configuration Error: API Key missing." });
        }

        // Clean up fallback defaults if parameters match directory names
        let targetLocation = location || req.url.split('/').pop().split('?')[0];
        if (!targetLocation || targetLocation === "weather") {
            targetLocation = "London";
        }

        const units = unitGroup || 'metric';
        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(targetLocation)}?unitGroup=${units}&key=${API_KEY}&contentType=json`;

        const response = await fetch(url);
        
        if (!response.ok) {
            return res.status(response.status).json({ error: `Visual Crossing API error: ${response.statusText}` });
        }
        
        const data = await response.json();
        return res.status(200).json(data);

    } catch (err) {
        console.error("Runtime Crash:", err);
        return res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
}