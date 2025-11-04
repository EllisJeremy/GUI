const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static("."));

// Serve the main page
app.use(express.static(__dirname));

// GET - Retrieve all applicants
app.get("/api/applicants", (req, res) => {
  try {
    const filePath = path.join(__dirname, "applicants.json");
    if (!fs.existsSync(filePath)) return res.json([]);
    const data = fs.readFileSync(filePath, "utf8").trim();
    if (!data) return res.json([]);
    const applicants = JSON.parse(data);
    if (!Array.isArray(applicants)) return res.json([]);
    res.json(applicants);
  } catch {
    res.json([]);
  }
});

// POST - Add a new applicant
app.post("/api/applicants", (req, res) => {
  const { name, email, song } = req.body || {};
  if (!name || !email || !song)
    return res
      .status(400)
      .json({ error: "name, email, and song are required." });

  const filePath = path.join(__dirname, "applicants.json");
  const id = Date.now();
  const timestamp = new Date().toISOString();
  const newApplicant = { id, name, email, song, timestamp };

  let applicants = [];
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (raw) applicants = JSON.parse(raw);
  }

  applicants.push(newApplicant);
  fs.writeFileSync(filePath, JSON.stringify(applicants, null, 4));
  res.status(201).json(newApplicant);
});

// PUT - Update an existing applicant
app.put("/api/applicants/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, song } = req.body || {};
  // this should be handled by the front end but just in case
  if (!name || !email || !song)
    return res
      .status(400)
      .json({ error: "name, email, and song are required." });

  const filePath = path.join(__dirname, "applicants.json");
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Applicant not found." });

  const data = fs.readFileSync(filePath, "utf8").trim();
  const applicants = data ? JSON.parse(data) : [];
  const idx = applicants.findIndex((a) => a.id == id);
  if (idx === -1)
    return res.status(404).json({ error: "Applicant not found." });

  const original = applicants[idx];
  applicants[idx] = {
    id: original.id,
    name,
    email,
    song,
    timestamp: original.timestamp,
  };

  fs.writeFileSync(filePath, JSON.stringify(applicants, null, 4));
  res.json(applicants[idx]);
});

// DELETE - Remove an applicant
app.delete("/api/applicants/:id", (req, res) => {
  const { id } = req.params;
  const filePath = path.join(__dirname, "applicants.json");
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Applicant not found." });

  const data = fs.readFileSync(filePath, "utf8").trim();
  const applicants = data ? JSON.parse(data) : [];
  const idx = applicants.findIndex((a) => a.id == id);
  if (idx === -1)
    return res.status(404).json({ error: "Applicant not found." });

  const [deleted] = applicants.splice(idx, 1);
  fs.writeFileSync(filePath, JSON.stringify(applicants, null, 4));
  res.json(deleted);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
