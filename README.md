# Team USA Archetype API

Backend API for USA Archetype — a fan-facing sports RPG powered by Google Gemini 2.5 Flash and 120 years of Team USA Olympic and Paralympic data.

## Setup

1. Clone the repo
2. Run `npm install`
3. Create a `.env` file with your Gemini API key: `GEMINI_API_KEY=your_key_here`
4. Run `node index.js`
5. Server runs on port 8080

## Endpoints

POST /archetype — Submit a user profile and receive their archetype assignment from Gemini

GET /health — Returns server status

## Deployment

Deployed on Google Cloud Run. All AI processing runs through Gemini 2.5 Flash via the Google GenAI SDK.

## License

Apache 2.0
