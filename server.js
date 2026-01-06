const express = require('express');
const path = require('path');
const app = express();

// Serve all static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Azure provides PORT automatically
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Static site running on port ${port}`);
});