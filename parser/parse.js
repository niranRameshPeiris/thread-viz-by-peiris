const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Directory containing thread dump .txt files
const DUMP_DIR = path.join(__dirname, '../data/dumps');

// Output JSON file where processed thread info is stored
const OUTPUT_FILE = path.join(__dirname, '../data/grouped_threads.json');

// Generate SHA-1 hash from a stack trace array
function hashStack(stackLines) {
  return crypto.createHash('sha1').update(stackLines.join('\n')).digest('hex');
}

// Parse a block of thread dump and extract useful metadata
function parseThreadBlock(block) {
  const nameMatch = block.match(/^"([^"]+)"/);                        // Match thread name from the first line
  const stateMatch = block.match(/\s+java.lang.Thread.State: (\w+)/); // Match thread state (e.g., RUNNABLE, BLOCKED)
  const tidMatch = block.match(/tid=(0x[0-9a-f]+)/);                  // Match TID
  const nidMatch = block.match(/nid=(0x[0-9a-f]+)/);                  // Match NID

  const lines = block.split('\n');                                    // Split the thread block into lines
  const startIndex = lines.findIndex(line =>
    line.includes('java.lang.Thread.State:')
  );                                                                  // Find the start of the stack trace

  if (!nameMatch || !tidMatch || startIndex === -1) return null;      // Skip malformed blocks

  // Extract full stack trace lines (including state and lock lines)
  const fullStack = lines.slice(startIndex)
    .map(line => line.trim())
    .filter(Boolean);                                                 // Remove empty lines

  return {
    name: nameMatch[1],
    tid: tidMatch[1],
    nid: nidMatch ? nidMatch[1] : null,
    state: stateMatch ? stateMatch[1] : 'UNKNOWN',
    stack: fullStack
  };
}

// Main function to group all thread dumps by thread name + TID
function groupThreadsByNameAndTid() {
  const files = fs.readdirSync(DUMP_DIR).filter(f => f.endsWith('.txt')); // Get all .txt dump files
  const grouped = {}; // Object to hold threads grouped by "name__tid"

  for (const file of files) {
    const content = fs.readFileSync(path.join(DUMP_DIR, file), 'utf-8');
    const timestamp = file.match(/\d{4}-\d{2}-\d{2}_\d{2}:\d{2}:\d{2}/)?.[0] || file;

    // Split file into individual thread blocks
    const blocks = content.split(/\n(?=")/); // Each thread block starts with a quote =

    for (const block of blocks) {
      const thread = parseThreadBlock(block);
      if (!thread) continue;

      const key = `${thread.name}__${thread.tid}`; // Unique identifier
      const stackHash = hashStack(thread.stack);   // Identify stack state across time

      if (!grouped[key]) grouped[key] = [];

      grouped[key].push({
        timestamp,
        state: thread.state,
        stack: thread.stack,
        stackHash,
        tid: thread.tid,
        nid: thread.nid
      });
    }
  }

  // Sort thread keys alphabetically and write to output JSON
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(
      Object.fromEntries(
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
      ),
      null,
      2
    )
  );

  // Clean up processed dump files
  for (const file of files) {
    fs.unlinkSync(path.join(DUMP_DIR, file));
  }
}

// Export for external usage (e.g., from server.js)
module.exports = { groupThreadsByNameAndTid };