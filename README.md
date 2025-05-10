# 🧵 Thread Dump Visualizer

A simple and powerful Node.js + HTML/JS web app that lets you upload and analyze Java thread dumps visually.

It groups threads by name and TID, shows how their state and stack traces change over time, and lets you inspect each stack trace with a click.

---

## 📦 Features

- 📁 Upload multiple thread dump `.txt` files at once
- 🧵 Threads grouped by name and TID
- 📊 Timeline table showing state and method changes
- 🎨 Color-coded by thread state and stack hash
- 🔍 Click any cell to view full stack trace (with TID/NID)
- ✨ Highlight selected thread cell for better navigation
- 📈 Analyze threads stuck in same stack/state for a given period
- ♻️ Reset and re-analyze easily

---

## 🚀 How to Run

### 1. Clone the Repository

```bash
git clone https://github.com/niranRameshPeiris/thread-viz-by-peiris.git
cd thread-viz-by-peiris
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
npm start
```

Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

---

## 📤 Upload Format

- Upload any number of plain text thread dumps
- Files should be named like:
  ```
  thread_dump_2025-05-10-11:57:03.txt
  thread_dump_2025-05-10-11:58:15.txt
  ```

---

## 🔄 Reset Button

Click the "Reset" button to:
- Clear uploaded dumps
- Delete the output JSON
- Reset the UI

---

## 🧪 Analyze Stuck Threads

Visit `/analysis.html` to:
- 🔍 Detect threads stuck in the same **stack trace** or **state** over time
- ⏱ Input a minimum duration (e.g., 10 seconds)
- 📃 View formatted results with thread name, TID, NID
- 🧹 Reset the analysis view easily

> ⚠️ You must run an initial **Analyze** from the main page to generate `grouped_threads.json`
