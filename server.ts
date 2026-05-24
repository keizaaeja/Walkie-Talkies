import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets in the AI Studio UI.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Route: Real-time Gemini Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, nearbyPlacesContext, userPreferences } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array is required" });
      }

      const ai = getGenAI();

      // Setup rich instructions that guide the chat and prevent LLM place hallucination
      const baseSystemInstruction = `You are "WalkieTalkies", an enthusiastic, friendly local travel AI expert.
Your goal is to provide exceptional, highly detailed walking-distance travel recommendations.
You help users discover cafes, museums, attractions, and outdoor activities within simple walking distance (~500m to 1.5km).

CRITICAL DIRECTIVES:
1. Ground your recommendations ONLY in the actual nearby places provided in the context below. Do NOT invent or hallucinate places that are not listed, and do NOT use pre-trained city listings if specific nearby context is supplied.
2. If no nearby context is provided yet, politely ask the user to share their location or type an address so you can identify real-time places of interest nearby!
3. Style your itineraries with extreme precision: give approximate walking times (e.g., "5-minute walk north", "800m east"), specific duration of stops (e.g., "Spend 45 mins browsing the exhibits"), and vivid, cozy descriptions of the atmosphere.
4. Keep your tone cheerful, encouraging, warm, and highly professional.
5. Provide detailed, customized itineraries tailored to the user's specific state of mind (e.g. relaxed, high-energy, historic, artistic, family-friendly) when asked.
6. Format your responses beautifully with Markdown headings (###, ##, #), bold titles, and bullet lists. Do not use plain, hard-to-read text blocks. EXCLUDE "####" or higher depth headings.

COORDINATES & NEARBY PLACES CONTEXT:
${nearbyPlacesContext || "The user has not shared their current location or nearby list of places of interest yet. Prompt them elegantly to click 'Share Location' or search for a starting location in the search bar."}

USER PROFILE / PREFERENCES:
${JSON.stringify(userPreferences || {})}
`;

      // Structure the conversation history
      // @google/genai expects contents: { role: 'user' | 'model', parts: [{ text: string }] }[]
      const formattedContents = messages.map((msg: any) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      // Generate content via Gemini-3.5-flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: baseSystemInstruction,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "I'm sorry, I couldn't process that.";
      return res.json({ text: replyText });
    } catch (error: any) {
      console.error("Gemini API Error in /api/chat:", error);
      return res.status(500).json({ 
        error: error.message || "An error occurred during content generation." 
      });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
