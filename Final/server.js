const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Routes
app.get('/items', (req, res) => {
  const items = JSON.parse(fs.readFileSync(path.join(__dirname, 'inventory', 'items.json'), 'utf8'));
  res.json(items);
});

app.get('/users/items', (req, res) => {
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
  res.json(users.find(user => user.userId == 1).items);
});

app.post('/users/items', (req, res) => {
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
  users.find(user => user.userId == 1).items.push(req.body);
  fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
  res.json(users.find(user => user.userId == 1).items);
});

app.delete('/users/items/:itemId', (req, res) => {
  const itemId = req.params.itemId;
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
  users.find(user => user.userId == 1).items = users.find(user => user.userId == 1).items.filter(item => item.id !== itemId);
  fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
  res.json(users.find(user => user.userId == 1).items);
});

app.put('/users/items/:itemId', (req, res) => {
  const itemId = req.params.itemId;
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
  users.find(user => user.userId == 1).items = users.find(user => user.userId == 1).items.map(item => item.id === itemId ? req.body : item);
  fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
  res.json(users.find(user => user.userId == 1).items);
});

  app.put('/users/cart', (req, res) => {
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
  users.find(user => user.userId == 1).items = req.body;
  fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
  res.json(users.find(user => user.userId == 1).items);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});