const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', service: 'SIH TeamHub API', timestamp: new Date().toISOString() });
});

module.exports = app;
