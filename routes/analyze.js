// routes/analyze.js or in server.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const OUTPUT_FILE = path.join(__dirname, '../data/grouped_threads.json');

function parseTimestamp(ts) {
  // Expected format: thread_dump_2025-05-10-11:57:03.txt
  const match = ts.match(/(\d{4})-(\d{2})-(\d{2})-(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [_, y, m, d, h, min, s] = match.map(Number);
  return new Date(y, m - 1, d, h, min, s);
}

router.get('/analyze', (req, res) => {
  const type = req.query.type; // 'stack' or 'state'
  const durationSec = parseInt(req.query.duration);

  if (!fs.existsSync(OUTPUT_FILE)) {
    return res.status(400).json({ error: 'grouped_threads.json not found. Please run the main analysis first.' });
  }

  const rawData = fs.readFileSync(OUTPUT_FILE, 'utf-8');
  const grouped = JSON.parse(rawData);
  const results = [];

  for (const threadKey of Object.keys(grouped)) {
    const entries = grouped[threadKey].sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));

    let current = entries[0];
    let startTime = parseTimestamp(current.timestamp);
    let last = current;

    for (let i = 1; i < entries.length; i++) {
      const entry = entries[i];
      const same = type === 'stack'
        ? entry.stackHash === current.stackHash
        : entry.state === current.state;

      if (same) {
        last = entry;
      } else {
        const endTime = parseTimestamp(last.timestamp);
        const elapsed = (endTime - startTime) / 1000; // in seconds
        if (elapsed >= durationSec) {
          results.push({
            thread: threadKey,
            tid: current.tid,
            nid: current.nid,
            start: current.timestamp,
            end: last.timestamp,
            value: type === 'stack' ? current.stackHash : current.state,
            duration: elapsed.toFixed(2) + 's'
          });
        }
        current = entry;
        startTime = parseTimestamp(current.timestamp);
        last = current;
      }
    }

    // Final segment check
    const endTime = parseTimestamp(last.timestamp);
    const elapsed = (endTime - startTime) / 1000;
    if (elapsed >= durationSec) {
      results.push({
        thread: threadKey,
        tid: current.tid,
        nid: current.nid,
        start: current.timestamp,
        end: last.timestamp,
        value: type === 'stack' ? current.stackHash : current.state,
        duration: elapsed.toFixed(2) + 's'
      });
    }
  }

  res.json({ type, duration: durationSec, results });
});

module.exports = router;