const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Configuration
app.use(cors());
app.use(express.json());

// API Route for System AI Completions
app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;
    
    // Fallback/Default Security Token Setup from Environment Variables
    const API_KEY = process.env.AI_API_KEY || 'YOUR_FALLBACK_OPENAI_KEY_IF_ANY';
    const ENDPOINT = "https://api.openai.com/v1/chat/completions";

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid context thread pipeline package." });
    }

    try {
        // Abort/Timeout handling via AbortController wrapper
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: messages
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upstream Provider Core Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error("Backend Gateway Exception Log:", error.message);
        if (error.name === 'AbortError') {
            res.status(504).json({ error: "Upstream gateway connection timeout (30s elapsed)." });
        } else {
            res.status(500).json({ error: "Internal Secure Server Exception Network Error: " + error.message });
        }
    }
});

// Start Server Runtime Engine
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` TBP AI v3.1 Professional Server Initialized `);
    console.log(` Secure Microservice Gateway Running on Port: ${PORT} `);
    console.log(`==================================================`);
});
