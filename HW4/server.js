import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import * as url from "node:url";
import "dotenv/config";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Initialize Gemini AI
const ai = new GoogleGenAI({
  // TODO: Put your API key here.
  // Refer to Slide CS 3744 10-1.pdf to see how to obtain Google Gemini API Key.
  apiKey: process.env.GEMINI_API_KEY,
});

// Load personas
let personas = null;
try {
  // TODO: Read the JSON file and store the data in `personas`
} catch (error) {
  // TODO: Log `error` using `console.error(...)`
}

// MIME types
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
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
    // TODO: Return personas.json as JSON
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

        // TODO: Create a string variable `conversationContext` to store context of agent persona and chat history

        // Get response from Gemini
        const response = await ai.models.generateContent({
          // TODO: Specify Gemini model and refer to `conversationContext` as contents to prompt the LLM.
        });

        const agentResponse =
          response.text || "I'm not sure how to respond to that.";

        // TODO: Respond as JSON following the structure `{ response: agentResponse }`
        // Set HTTP response code as 200
      } catch (error) {
        console.error("Error in chat endpoint:", error);
        // TODO: Respond as JSON following the structure `{ error: 'Internal server error' }`
        // Set HTTP response code as 500
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
        let helperContext = null;

        // TODO: Add context to `helperContext` with agent persona and chat history.

        // Use helper prompt from persona configuration
        const helperPrompt = helperAgent.helperPrompt || "";
        helperContext += helperPrompt.replace("{message}", message);

        // Get suggestions from Gemini
        const response = await ai.models.generateContent({
          // TODO: Set model and context contents to prompt the LLM.
        });

        const suggestionsText = response.text || "";
        // TODO: Split suggestions by newlines and filter empty lines
        // Hint: Look at personas.json helperPrompt to see the response structure. Make sure to keep the first 3 suggestions.
        const suggestions = [];

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ suggestions }));
      } catch (error) {
        console.error("Error in AI helper endpoint:", error);
        // TODO: Return error in JSON structure `{ error: 'Internal server error' }`
        // Use response header HTTP code 500
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
      // TODO: When no error, return file content with response code 200.
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
