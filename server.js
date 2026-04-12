/**
 * SmartVenue — Express Server
 * Lightweight static file server for Google Cloud Run deployment
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 8080;

// Serve all static files from the current directory
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
  maxAge: '1h'
}));

// SPA fallback — always serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ SmartVenue server running on port ${PORT}`);
  console.log(`   Open: http://localhost:${PORT}`);
});
