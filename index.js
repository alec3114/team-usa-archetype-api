const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    
    A fan has submitted their profile:
    - Height: ${height}
    - Weight: ${weight}
    - Age: ${age}
    - Natural strengths: ${strengths}
    - Sports history/background: ${sports_history}
    - Mental strengths: ${mental_strengths}
    - Mental weaknesses: ${mental_weaknesses}
    
    Based on this profile, assign them ONE physical archetype and ONE primary + ONE secondary mental archetype from the following lists:
    
    PHYSICAL ARCHETYPES:
    - Titan: raw power, uses body mass and size as a weapon
    - Silverswift: top end speed, fluid movement, not explosive burst
    - The Tower: uses body length, wingspan, and leverage
    - Dynamite: acceleration and explosive fast twitch muscles, 0 to 100
    - Workhorse: pure endurance, cardiovascular machine, outlasts everyone
    - Navigator of the Skies: acrobatic, spatial awareness, body control
    - Craftsman: efficient mechanics, footwork, technique, gets more out of less
    
    MENTAL ARCHETYPES:
    - The Strategist: obsessive preparation, adapts fast, gets in opponents heads
    - Wildfire: feeds off emotion, risk taker, rises in clutch moments
    - Uplifter: teammate focused, composed, makes everyone around them better
    - The Catalyst: creative, explosive mental energy, thrives in fast competitions
    - Locked In: composed, efficient, marathon minded, never rattled
    - The Orchestrator: psychological warfare, improvisational, controls the game mentally
    
    Your response must be in this exact JSON format and nothing else:
    {
      "physical_archetype": "[name]",
      "physical_description": "[2 sentences about why this physical archetype fits them]",
      "primary_mental_archetype": "[name]",
      "secondary_mental_archetype": "[name]",
      "mental_description": "[2 sentences about their mental profile combining both archetypes]",
      "top_sports": ["sport1", "sport2", "sport3"],
      "paralympic_sports": ["sport1", "sport2"],
      "historical_olympics": "[which Olympics era they would have peaked at and why - use conditional language]",
      "synergy_archetypes": ["physical archetype they pair well with", "mental archetype they clash with"],
      "tagline": "[one badass sentence that captures their full identity as a Team USA athlete]"
    }
    
    RULES:
    - Always use conditional language like "could align with" or "athletes with similar profiles have historically"
    - Never guarantee performance results
    - Give equal analytical depth to Paralympic and Olympic sports
    - Never reference specific real athletes by name
    - Return only valid JSON, no extra text
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
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
