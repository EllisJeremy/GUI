import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import * as url from "node:url";
import "dotenv/config";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Load personas
let personas = null;
try {
  const personasPath = path.join(__dirname, "personas.json");
  const personasData = fs.readFileSync(personasPath, "utf8");
  personas = JSON.parse(personasData);
} catch (error) {
  console.error("Error loading personas:", error);
}

// MIME types
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

// Create server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve personas.json
  if (pathname === "/personas.json") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(personas));
    return;
  }

  // Chat endpoint
  if (pathname === "/chat" && method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { agentId, message, history } = JSON.parse(body);
        const agent = personas.agents.find((a) => a.id === agentId);

        if (!agent) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Agent not found" }));
          return;
        }

        // Create conversation context with agent persona and chat history
        let conversationContext = `${agent.persona}\n\n`;
        conversationContext += "Conversation history:\n";

        if (history && history.length > 0) {
          history.forEach((turn) => {
            const role = turn.sender === "user" ? "User" : agent.name;
            conversationContext += `${role}: ${turn.text}\n`;
          });
        }

        conversationContext += `User: ${message}\n${agent.name}:`;

        // Get response from Gemini
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-lite",
          contents: conversationContext,
        });

        const agentResponse =
          response.text || "I'm not sure how to respond to that.";

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ response: agentResponse }));
      } catch (error) {
        console.error("Error in chat endpoint:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
    return;
  }

  // AI Helper endpoint
  if (pathname === "/ai-helper" && method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { message, history } = JSON.parse(body);
        const helperAgent = personas.agents.find((a) => a.role === "helper");

        if (!helperAgent) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Helper agent not found" }));
          return;
        }

        // Initialize context for helper
        let helperContext = `${helperAgent.persona}\n\n`;

        // Add chat history context
        helperContext += "Current conversation:\n";
        if (history && history.length > 0) {
          history.forEach((turn) => {
            const role = turn.sender === "user" ? "You" : "Match";
            helperContext += `${role}: ${turn.text}\n`;
          });
        }
        helperContext += "\n";

        // Use helper prompt from persona configuration
        const helperPrompt = helperAgent.helperPrompt || "";
        helperContext += helperPrompt.replace("{message}", message);

        // Get suggestions from Gemini
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: helperContext,
        });

        const suggestionsText = response.text || "";
        // Split suggestions by newlines and filter empty lines, keep first 3
        const suggestions = suggestionsText
          .split("\n")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .slice(0, 3);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ suggestions }));
      } catch (error) {
        console.error("Error in AI helper endpoint:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = pathname === "/" ? "/index.html" : pathname;
  // Resolve path and normalize to prevent directory traversal
  filePath = path.resolve(__dirname, filePath.replace(/^\/+/, ""));

  // Security: prevent directory traversal
  if (!filePath.startsWith(path.resolve(__dirname))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404);
        res.end("File not found");
      } else {
        res.writeHead(500);
        res.end("Server error");
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
