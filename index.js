const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/archetype", async (req, res) => {
  const { height, weight, sport_preference, paralympic } = req.body;

  const prompt = `
    You are a Team USA sports analyst with 120 years of historical data.
    
    A fan has provided these physical traits:
    - Height: ${height}
    - Weight: ${weight}
    - Sport interest: ${sport_preference}
    - Paralympic athlete: ${paralympic ? "Yes" : "No"}
    
    Based on historical Team USA athlete data, identify which "Athlete Archetype" 
    this person's body type could align with (e.g. Powerhouse, Aerobic, Precision, Agile).
    
    Important rules:
    - Always use conditional language like "could align with" or "athletes with similar traits have historically"
    - Never guarantee performance results
    - Give equal analytical depth to Paralympic and Olympic archetypes
    - Keep response to 3 paragraphs max
    - End with 2-3 Team USA sports that could be a strong historical match
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ archetype: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gemini API error" });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
