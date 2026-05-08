const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// All 42 combo names
const COMBO_NAMES = {
  "Titan": {
    "The Strategist": "The Iron General",
    "Wildfire": "The Berserker",
    "Uplifter": "World Bearer",
    "The Catalyst": "The Wrecking Ball",
    "Locked In": "The Mountain",
    "The Orchestrator": "The War Machine"
  },
  "Silverswift": {
    "The Strategist": "The Shadow",
    "Wildfire": "The Lightning",
    "Uplifter": "The Glider",
    "The Catalyst": "The Ignition",
    "Locked In": "The Unyielding Blade",
    "The Orchestrator": "The Phantom of the Arena"
  },
  "The Tower": {
    "The Strategist": "The Frame",
    "Wildfire": "The Inferno Spire",
    "Uplifter": "The Beacon",
    "The Catalyst": "The Foundation",
    "Locked In": "The Monolith",
    "The Orchestrator": "The Shadow Tower"
  },
  "Dynamite": {
    "The Strategist": "The Explosive Terminal",
    "Wildfire": "The Detonator",
    "Uplifter": "The Amplifier",
    "The Catalyst": "The Spark Plug",
    "Locked In": "The Precision Strike",
    "The Orchestrator": "The Planned Destruction"
  },
  "Workhorse": {
    "The Strategist": "Chariot Leader",
    "Wildfire": "The Eternal Flame",
    "Uplifter": "The Backbone",
    "The Catalyst": "The Engine",
    "Locked In": "Bedrock",
    "The Orchestrator": "The Long Game"
  },
  "Navigator of the Skies": {
    "The Strategist": "The Pilot",
    "Wildfire": "The Storm",
    "Uplifter": "The Elevator",
    "The Catalyst": "Gale of Wind",
    "Locked In": "The Untouchable",
    "The Orchestrator": "The Cloud Conductor"
  },
  "Craftsman": {
    "The Strategist": "The Blueprint",
    "Wildfire": "The Furnace",
    "Uplifter": "The Mentor",
    "The Catalyst": "The Starting Piece",
    "Locked In": "The Surgeon",
    "The Orchestrator": "The Puppet Master"
  }
};

// Real USA Olympic athlete averages by sport (120 years of data)
const USA_SPORT_DATA = `
Alpine Skiing: avg height 173.2cm, avg weight 73.1kg
Archery: avg height 176.3cm, avg weight 71.7kg
Athletics: avg height 178.7cm, avg weight 72.8kg
Baseball: avg height 186.4cm, avg weight 89.4kg
Basketball: avg height 192.6cm, avg weight 87.1kg
Beach Volleyball: avg height 187.0cm, avg weight 81.5kg
Bobsleigh: avg height 181.6cm, avg weight 90.9kg
Boxing: avg height 175.0cm, avg weight 66.6kg
Cycling: avg height 176.8cm, avg weight 71.0kg
Diving: avg height 167.3cm, avg weight 62.3kg
Fencing: avg height 178.8cm, avg weight 73.5kg
Figure Skating: avg height 166.8cm, avg weight 58.9kg
Freestyle Skiing: avg height 172.3cm, avg weight 69.7kg
Gymnastics: avg height 163.4cm, avg weight 57.5kg
Ice Hockey: avg height 179.0cm, avg weight 81.6kg
Judo: avg height 174.6cm, avg weight 77.7kg
Rowing: avg height 185.1cm, avg weight 80.2kg
Rugby: avg height 179.1cm, avg weight 76.0kg
Sailing: avg height 179.4cm, avg weight 78.1kg
Shooting: avg height 175.9cm, avg weight 77.9kg
Snowboarding: avg height 172.5cm, avg weight 71.4kg
Softball: avg height 173.3cm, avg weight 75.9kg
Swimming: avg height 181.0cm, avg weight 73.7kg
Synchronized Swimming: avg height 167.4cm, avg weight 56.5kg
Taekwondo: avg height 179.3cm, avg weight 69.8kg
Tennis: avg height 181.7cm, avg weight 76.2kg
Triathlon: avg height 175.9cm, avg weight 64.3kg
Volleyball: avg height 188.3cm, avg weight 81.0kg
Water Polo: avg height 186.9cm, avg weight 86.8kg
Weightlifting: avg height 171.9cm, avg weight 90.6kg
Wrestling: avg height 173.7cm, avg weight 77.4kg
`;

// Rate limiting - max 10 requests per IP per hour
const requestCounts = {};
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  if (!requestCounts[ip]) requestCounts[ip] = [];
  requestCounts[ip] = requestCounts[ip].filter(t => now - t < 3600000);
  if (requestCounts[ip].length >= 10) {
    return res.status(429).json({ error: "Too many requests, try again later" });
  }
  requestCounts[ip].push(now);
  next();
}

app.post("/archetype", rateLimit, async (req, res) => {
  const { height, weight, age, strengths, sports_history, mental_strengths, mental_weaknesses } = req.body;

  const prompt = `
    You are a Team USA sports analyst with access to 120 years of Olympic and Paralympic historical data.
    
    Here are the real historical average physical stats for USA Olympic athletes by sport:
    ${USA_SPORT_DATA}
    
    A fan has submitted their profile:
    - Height: ${height}cm
    - Weight: ${weight}kg
    - Age: ${age}
    - Natural strengths: ${strengths}
    - Sports history/background: ${sports_history}
    - Mental strengths: ${mental_strengths}
    - Mental weaknesses: ${mental_weaknesses}
    
    Compare this fan's physical stats against the historical USA athlete averages above.
    Use this real data to identify which sports their body type historically aligns with.
    
    Assign them ONE physical archetype and ONE primary mental archetype from EXACTLY these options:
    
    PHYSICAL ARCHETYPES (use exact name):
    - Titan
    - Silverswift
    - The Tower
    - Dynamite
    - Workhorse
    - Navigator of the Skies
    - Craftsman
    
    MENTAL ARCHETYPES (use exact name):
    - The Strategist
    - Wildfire
    - Uplifter
    - The Catalyst
    - Locked In
    - The Orchestrator
    
    Your response must be in this exact JSON format and nothing else:
    {
      "physical_archetype": "[exact name from list]",
      "primary_mental_archetype": "[exact name from list]",
      "secondary_mental_archetype": "[exact name from list]",
      "physical_description": "[2 sentences about why this physical archetype fits based on real historical data]",
      "mental_description": "[2 sentences about their mental profile combining both archetypes]",
      "top_sports": ["sport1", "sport2", "sport3"],
      "paralympic_sports": ["sport1", "sport2"],
      "historical_olympics": "[which Olympics era they would have peaked at and why - use conditional language]",
      "synergy_archetypes": ["physical archetype they pair well with", "mental archetype they synergize with"],
      "tagline": "[one badass sentence that captures their full identity as a Team USA athlete]"
    }
    
    RULES:
    - Always use conditional language like "could align with" or "athletes with similar profiles have historically"
    - Never guarantee performance results
    - Give equal analytical depth to Paralympic and Olympic sports
    - Never reference specific real athletes by name
    - Return only valid JSON, no extra text
    - Use EXACT archetype names from the lists above
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Look up the combo name
    const comboName = COMBO_NAMES[parsed.physical_archetype]?.[parsed.primary_mental_archetype] || 
      `${parsed.physical_archetype} ${parsed.primary_mental_archetype}`;
    
    parsed.combo_name = comboName;
    
    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong, try again" });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
