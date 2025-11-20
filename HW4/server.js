import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import * as url from "node:url";
import "dotenv/config";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

let personas = null;
try {
  const personasPath = path.join(__dirname, "personas.json");
  const personasData = fs.readFileSync(personasPath, "utf8");
  personas = JSON.parse(personasData);
} catch (error) {
  console.error("Error loading personas:", error);
}

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

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === "/personas.json") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(personas));
    return;
  }

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

        let conversationContext = `${agent.persona}\n\n`;
        conversationContext += "Conversation history:\n";

        if (history && history.length > 0) {
          history.forEach((turn) => {
            const role = turn.sender === "user" ? "User" : agent.name;
            conversationContext += `${role}: ${turn.text}\n`;
          });
        }

        conversationContext += `User: ${message}\n${agent.name}:`;

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

        let helperContext = `${helperAgent.persona}\n\n`;

        helperContext += "Current conversation:\n";
        if (history && history.length > 0) {
          history.forEach((turn) => {
            const role = turn.sender === "user" ? "You" : "Match";
            helperContext += `${role}: ${turn.text}\n`;
          });
        }
        helperContext += "\n";

        const helperPrompt = helperAgent.helperPrompt || "";
        helperContext += helperPrompt.replace("{message}", message);

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: helperContext,
        });

        const suggestionsText = response.text || "";
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

  let filePath = pathname === "/" ? "/index.html" : pathname;
  filePath = path.resolve(__dirname, filePath.replace(/^\/+/, ""));

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

// test to ensure server is running
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
