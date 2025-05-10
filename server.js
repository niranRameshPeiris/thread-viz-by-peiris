const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { groupThreadsByNameAndTid } = require('./parser/parse');
const app = express();

const PORT = 3000;
const DUMP_DIR = path.join(__dirname, 'data/dumps');
const OUTPUT_FILE = path.join(__dirname, 'data/grouped_threads.json');

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Ensure dump directory exists
const dumpDir = path.join(__dirname, 'data/dumps');
fs.mkdirSync(dumpDir, { recursive: true });

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DUMP_DIR),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Upload and parse endpoint
app.post('/upload', upload.array('dumps'), (req, res) => {
  try {
    groupThreadsByNameAndTid();
    res.json({ success: true });
  } catch (err) {
    console.error('Parsing failed:', err);
    res.status(500).json({ error: 'Parsing failed' });
  }
});

app.post('/reset', (req, res) => {
    const outputFile = path.join(__dirname, 'data/grouped_threads.json');
    try {
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      res.json({ success: true });
    } catch (err) {
      console.error('Reset failed:', err);
      res.status(500).json({ success: false });
    }
  });

// Serve parsed JSON
app.get('/data/grouped_threads.json', (req, res) => {
  res.sendFile(OUTPUT_FILE);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
