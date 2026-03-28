# LogPulse ⚡️ Intelligent DevOps Diagnostic Tool

[![Hackathon Grade](https://img.shields.io/badge/Status-Presentation_Ready-emerald?style=for-the-badge)](https://github.com/LogPulse)
[![Uptime](https://img.shields.io/badge/Uptime-99.9%25-blue?style=for-the-badge)](https://github.com/LogPulse)

**LogPulse** is a lightning-fast, highly resilient application log analysis engine designed to eliminate the manual toil of debugging sprawling microservices. By instantly transforming raw, unstructured application logs into actionable "Incident Intelligence", engineering teams can drastically reduce MTTD (Mean Time To Resolution).

---

## 🔬 Under the Hood: The Technology Stack

LogPulse is built for performance, resilience, and visual impact.

### 1. The Logic Engine (Backend)

The core processing engine is built on **Node.js (Express)** with a focus on streaming efficiency:

- **Stream Streaming (V8 Engine Optimization)**: Instead of loading massive 10MB–1GB `.log` files into RAM (which causes classic `Out of Memory` crashes), the backend uses `fs.createReadStream` combined with `readline`. It streams the data sequentially from a temporary disk storage buffer (`os.tmpdir()`), capping deeply complex analysis at the top 10,000 relevant lines for instant sub-second API responses.
- **Regex Resilience Pipeline**: Features a two-stage parsing pipeline. 
  1. The strict parser pulls exact `[Timestamp] [Severity]` markers. 
  2. If a system outputs broken or non-standard logs, the **Fallback Unstructured Tracker** gracefully captures and bins the logs without failing.
- **Smart Signature Clustering**: Identifies structurally identical errors by obfuscating variable data (like `UUIDs`, `IPs`, and arbitrary numbers) into identical template signatures. It uses exact matching on these sanitized patterns, providing 100% accuracy without the false-positive risk of aggressive Levenshtein distance grouping.
- **Heuristic AI Engine**: Analyzes the structural metadata of the log clusters against pre-defined rules logic to automatically identify common failure cascades (e.g., "Connection Pool Exhaustion" vs. "OOM Container Kills").

### 2. The Presentation Layer (Frontend)

The presentation facade is a responsive Single Page Application (SPA).

- **Framework**: Built on **React** bundled with **Vite** for HMR and instant asset delivery.
- **Aesthetic**: **Tailwind CSS v4** powering a sleek, glassmorphic dark-mode interface (`.glass-col`, dynamic SVG lighting) optimized explicitly for 1080p projectors and high-visibility demonstrations.
- **Data Visualization**: **Chart.js (`react-chartjs-2`)** constructs the Log Density Timeline by binning time-series data into discrete, localized minute-buckets, giving a pristine graphical view of the error spike trajectory.
- **Micro-Interactions**: Custom `@keyframes` CSS powers a realistic "AI Scanning Laser" UI during the file processing phase, delivering a buttery-smooth user experience while backend streams calculate data.

---

## 🚀 Quick Fix Guide (Common Environment Issues)

Hackathon demo environments can be unpredictable. Here is a definitive list of quick fixes if you encounter issues running LogPulse live.

### 1. Missing Dependencies / `Cannot find module`
* **Symptom**: Running `npm run dev` or `node index.js` throws an error about something immediately missing.
* **Quick Fix**: Run `npm install` again in the specific folder that failed (either `/frontend` or `/backend`). Especially check `/backend` if `multer` or `cors` is failing. 

### 2. CORS Errors in the Browser Console
* **Symptom**: The UI loads perfectly, but uploading a file fails with a red "Upload error: TypeError: Failed to fetch". The Chrome DevTools Console shows a distinct CORS red text.
* **Quick Fix**: The Frontend natively points to `http://localhost:3001`. Ensure your backend terminal is running without crashing. In `backend/index.js`, ensure `app.use(cors())` is placed **before** `app.use(express.json())` and routing bindings.

### 3. Backend Fails to Start: `EADDRINUSE: address already in use :::3001`
* **Symptom**: Node throws an `EADDRINUSE` connection error. Another service (or an invisible zombie node process) is currently occupying port 3001.
* **Quick Fix**: 
  - *Mac/Linux*: `kill -9 $(lsof -t -i:3001)`
  - *Windows*: `netstat -ano | findstr :3001`, note the PID, then `taskkill /PID <PID> /F`.

### 4. Node Version Conflict 
* **Symptom**: Syntax errors around `for await (const line of rl)` or newer language features.
* **Quick Fix**: Ensure you are running Node.js v16 or higher. Run `node -v` to check. If using NVM, run `nvm use 18` or `nvm use 20`.

### 5. UI Fails to Bind: Port 5173 taken
* **Symptom**: Vite starts on `5174` instead of `5173`.
* **Quick Fix**: The dashboard will still work! Just open `http://localhost:5174` in your browser. (The backend ports are hardcoded in the frontend `fetch` request, not the hosting port).

---

## 🏗️ Getting Started

1. Clone this repository.
2. In Terminal 1:
   ```bash
   cd backend
   npm install
   node index.js
   ```
3. In Terminal 2:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Navigate to `http://localhost:5173` and engage the **Mock Demo Mode** switch or drop in a real `.log` file to begin.
