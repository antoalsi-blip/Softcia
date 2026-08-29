import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parsing with generous limit for audio recordings
  app.use(express.json({ limit: "50mb" }));

  // API Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // API Endpoint to transcribe audio using Gemini AI
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioData, mimeType } = req.body;

      if (!audioData) {
        return res.status(400).json({ error: "No se proporcionaron datos de audio" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "Clave de Gemini API no configurada en el servidor",
        });
      }

      const cleanMimeType = mimeType ? mimeType.split(";")[0].trim() : "audio/webm";

      let transcription = "";

      try {
        // Try dedicated transcribe model first
        const response = await ai.models.generateContent({
          model: "gemini-3.5-transcribe",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: cleanMimeType,
                  data: audioData,
                },
              },
              {
                text: "Transcribe fielmente las palabras dichas en este audio en español, registrando el relato o descripción de la infracción o hechos sucedidos en el partido de pádel. Devuelve únicamente el texto transcrito directo y limpio sin comillas ni prefijos.",
              },
            ],
          },
        });
        transcription = response.text ? response.text.trim() : "";
      } catch (transcribeError) {
        console.warn("Primary transcribe model failed, falling back to gemini-3.7-flash:", transcribeError);
        // Fallback to gemini-3.7-flash
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: cleanMimeType,
                  data: audioData,
                },
              },
              {
                text: "Transcribe el audio fielmente al español. Devuelve solo el texto transcrito sin introducciones ni comentarios.",
              },
            ],
          },
        });
        transcription = response.text ? response.text.trim() : "";
      }

      return res.json({ text: transcription });
    } catch (error: any) {
      console.error("Error transcribing audio:", error);
      return res.status(500).json({
        error: error.message || "Error al procesar la transcripción de audio con IA",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
