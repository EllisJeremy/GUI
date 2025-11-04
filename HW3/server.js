const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Serve the main page
app.use(express.static(__dirname));

// GET - Retrieve all applicants
app.get('/api/applicants', (req, res) => {

});

// POST - Add a new applicant
app.post('/api/applicants', (req, res) => {

});

// PUT - Update an existing applicant
app.put('/api/applicants/:id', (req, res) => {

});

// DELETE - Remove an applicant
app.delete('/api/applicants/:id', (req, res) => {

});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
