require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { Readable } = require('stream');
const multer = require('multer');
const fs = require('fs');
const readline = require('readline');
const os = require('os');
const path = require('path');
const { LogSession, sequelize } = require('./models/LogSession');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3001;

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// MySQL Connection
sequelize.sync({ alter: true })
  .then(() => console.log('✅ Connected to MySQL and synced schema'))
  .catch(err => console.error('❌ MySQL Connection Error:', err));

app.use(cors());
app.use(express.json());

const upload = multer({ 
  dest: os.tmpdir(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

function generateSignature(message) {
  // If it's a stack trace, extract the exception name
  const exceptionMatch = message.match(/([a-zA-Z0-9.]+Exception|Error):/);
  if (exceptionMatch) return exceptionMatch[1];

  let sig = message;
  sig = sig.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '<IP>');
  sig = sig.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig, '<UUID>');
  sig = sig.replace(/\b\d+\b/g, '<NUM>');
  return sig.trim().substring(0, 150);
}

async function generateRealAISummary(clusters, stats) {
  if (!genAI) {
    console.warn("⚠️ No GEMINI_API_KEY found, falling back to heuristic summary.");
    return generateHeuristicSummary(clusters, stats.unstructuredCount);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Enrich top clusters with their raw samples for deeper AI context
    const topClustersContext = clusters.slice(0, 8).map(c => {
      const samplesText = (c.samples || []).map(s => `      - RAW SAMPLE: ${s}`).join('\n');
      return `- CLUSTER [${c.severity}]: ${c.pattern} (${c.count} occurrences)\n${samplesText}`;
    }).join('\n\n');
    
    const prompt = `
      You are an expert DevOps SRE and Principal Engineer. Analyze these log error clusters and provide a high-precision incident report.
      
      CONTEXT:
      - Total Logs Processed: ${stats.totalLogs}
      - Total Error Count: ${stats.errorCount}
      - Period Analyzed: Last batch of logs.
      
      TARGET ERROR DATA (CLUSTERS & EVIDENCE SAMPLES):
      ${topClustersContext}
      
      TASK:
      1. Identify the absolute Root Cause by correlating the patterns and samples. If multiple issues exist, identify the primary one.
      2. provide a detailed technical insight into WHY this is happening (e.g., specific library, database, or network failure).
      3. Predict the downstream impact if not resolved.
      4. Provide a concrete, step-by-step remediation guide.
      
      RESPONSE FORMAT (STRICT JSON ONLY):
      {
        "rootCause": "A comprehensive, high-level summary of the issue (15-20 words)",
        "technicalDetails": "Detailed engineering-level explanation of the failure mechanism based on the raw samples",
        "impact": "Specific system-wide implications (latency, data loss, downtime risk)",
        "recommendedFix": "Numbered list of actionable technical fixes"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Clean JSON if Gemini wraps it in markdown blocks
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return generateHeuristicSummary(clusters, stats.unstructuredCount);
  }
}

function generateHeuristicSummary(clusters, unstructuredCount) {
  const errorClusters = clusters.filter(c => c.severity === 'ERROR');
  
  if (errorClusters.length === 0) {
    if (unstructuredCount > 0) {
      return {
        rootCause: "Unstructured Data Anomaly",
        impact: `Found ${unstructuredCount} lines of non-standard log formatting. Standard monitoring logic is heavily blind to these unknown events.`,
        recommendedFix: "1. Enforce a structured JSON logging policy across all microservices.\n2. Add parsing fallback templates if these are necessary legacy formats."
      };
    }
    return {
      rootCause: "No Critical Issues Detected",
      impact: "System operating within normal parameters. No significant structured errors found.",
      recommendedFix: "No immediate action required. Continue active monitoring."
    };
  }

  const combinedPatterns = errorClusters.map(c => c.pattern.toLowerCase()).join(' ');

  if (combinedPatterns.includes('timeout') || combinedPatterns.includes('pool')) {
    return {
      rootCause: "Resource Pool Exhaustion",
      impact: `Detected ${errorClusters[0].count} resource drop-offs critically impacting API availability.`,
      recommendedFix: "1. Increase the max connection pool size in config.\n2. Check for leaked db connections.\n3. Verify network threshold limits."
    };
  }

  if (combinedPatterns.includes('memory') || combinedPatterns.includes('oom')) {
    return {
      rootCause: "Memory Leak Detected",
      impact: "JVM or Node process breached RAM limits causing OOM-Kills.",
      recommendedFix: "1. Scale nodes horizontally.\n2. Enable heap dump on OOM.\n3. Increase container memory requests/limits."
    };
  }

  return {
    rootCause: "Application Runtime Exception",
    impact: `Primary issue in ${errorClusters[0].pattern} affecting stability.`,
    recommendedFix: `1. Review recent deployments for regressions.\n2. Validate input sanitization on affected endpoint.\n3. Increase log level to DEBUG.`
  };
}

const LOG_FORMATS = [
  // 1. JSON
  {
    name: 'json',
    detect: (line) => line.trim().startsWith('{') && line.trim().endsWith('}'),
    parse: (line) => {
      try {
        const j = JSON.parse(line);
        return {
          timestamp: j.timestamp || j.time || j.date || null,
          severity: (j.level || j.severity || j.status || 'INFO').toUpperCase(),
          message: j.message || j.msg || j.error || j.log || Object.values(j).join(' ')
        };
      } catch (e) { return null; }
    }
  },
  // 2. Nginx/Apache Combined
  {
    name: 'web',
    regex: /^(\S+) \S+ \S+ \[(.*?)\] "(\S+) (\S+) \S+" (\d{3}) (\d+|-)/,
    parse: (match) => ({
      timestamp: match[2],
      severity: parseInt(match[5]) >= 400 ? 'ERROR' : 'INFO',
      message: `${match[3]} ${match[4]} returned ${match[5]}`
    })
  },
  // 3. Spring Boot / Logback
  {
    name: 'spring',
    regex: /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\s+(ERROR|WARN|INFO|DEBUG|TRACE)\s+\[(.*?)\]\s+(.*?)\s+:\s+(.*)/,
    parse: (match) => ({
      timestamp: match[1],
      severity: match[2],
      message: match[5]
    })
  },
  // 4. Generic [Timestamp] Severity
  {
    name: 'generic',
    regex: /^\[(.*?)\]\s+(ERROR|WARN|INFO|DEBUG|FATAL|CRITICAL)\b(.*?):\s*(.*)/i,
    parse: (match) => ({
      timestamp: match[1],
      severity: match[2].toUpperCase(),
      message: match[4]
    })
  }
];

function parseTimestamp(ts) {
  if (!ts) return null;
  // Handle Nginx format: 28/Mar/2026:12:06:01 +0530
  if (ts.includes('/') && ts.includes(':')) {
    const parts = ts.split(/[\/:]/);
    if (parts.length >= 4) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      const hour = parts[3];
      const min = parts[4];
      const sec = parts[5];
      // Reformat to something Date() likes: "Mar 28 2026 12:06:01"
      return new Date(`${month} ${day} ${year} ${hour}:${min}:${sec}`);
    }
  }
  return new Date(ts);
}

function parseLine(line, stats, timeline, clusters, state = { lastSeverity: 'INFO' }) {
  let parsed = null;
  
  for (const format of LOG_FORMATS) {
    if (format.detect && format.detect(line)) {
      parsed = format.parse(line);
      if (parsed) break;
    } else if (format.regex) {
      const match = line.match(format.regex);
      if (match) {
        parsed = format.parse(match);
        if (parsed) break;
      }
    }
  }

  // Handle Multi-line stack traces
  if (!parsed && line.match(/^\s+(at|causetby|---)/i)) {
    if (state.lastCluster) {
      state.lastCluster.pattern += "\n" + line.trim();
      return;
    }
  }

  const severity = parsed ? parsed.severity : 'UNSTRUCTURED';
  let timestamp = parsed ? parsed.timestamp : null;
  const message = (parsed ? parsed.message : line).trim();

  // Normalize Severity
  let finalSeverity = severity;
  if (finalSeverity === 'WARNING') finalSeverity = 'WARN';
  if (['FATAL', 'CRITICAL', 'SEVERE', 'ALERT'].includes(finalSeverity)) finalSeverity = 'ERROR';

  if (finalSeverity === 'UNSTRUCTURED' && /exception|failed|timeout|crash|traceback|panic/i.test(message)) {
    finalSeverity = 'ERROR';
  }

  state.lastSeverity = finalSeverity;

  // Update stats
  stats.totalLogs++;
  if (finalSeverity === 'ERROR') stats.errorCount++;
  else if (finalSeverity === 'WARN') stats.warnCount++;
  else if (finalSeverity === 'INFO' || finalSeverity === 'DEBUG' || finalSeverity === 'TRACE') stats.infoCount++;
  else stats.unstructuredCount++;

  // Record timeline
  let dateObj = parseTimestamp(timestamp);
  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date(); // Fallback to current ingestion time
  }
  
  const bucket = dateObj.toISOString().slice(0, 16);
  if (!timeline[bucket]) {
    timeline[bucket] = { total: 0, errors: 0, warnings: 0, unstructured: 0 };
  }
  timeline[bucket].total++;
  if (finalSeverity === 'ERROR') timeline[bucket].errors++;
  else if (finalSeverity === 'WARN') timeline[bucket].warnings++;
  else if (finalSeverity === 'UNSTRUCTURED') timeline[bucket].unstructured++;

  // Clustering
  if (finalSeverity === 'ERROR' || finalSeverity === 'WARN') {
    const signature = generateSignature(message);
    if (!clusters[signature]) {
      clusters[signature] = {
        pattern: signature,
        count: 0,
        severity: finalSeverity,
        latestTimestamp: timestamp || new Date().toISOString(),
        samples: []
      };
    }
    clusters[signature].count++;
    if (timestamp) clusters[signature].latestTimestamp = timestamp;
    if (clusters[signature].samples.length < 5) {
      clusters[signature].samples.push(message.substring(0, 500));
    }
    state.lastCluster = clusters[signature];
  } else {
    state.lastCluster = null;
  }
}

// REST ENDPOINTS

// 1. Fetch all previous sessions (metadata only for Sidebar)
app.get('/api/logs', async (req, res) => {
  try {
    const sessions = await LogSession.findAll({
      attributes: ['_id', 'fileName', 'uploadDate', 'stats', 'aiSummary'],
      order: [['uploadDate', 'DESC']]
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// 2. Fetch a specific session by ID
app.get('/api/logs/:id', async (req, res) => {
  try {
    const session = await LogSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    // Format to match what the frontend expects for active state
    res.json({
      _id: session._id,
      fileName: session.fileName,
      uploadDate: session.uploadDate,
      summary: session.stats,
      aiSummary: session.aiSummary,
      clusters: session.clusters,
      timeline: session.timeline
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

// 3. Upload and Analyze a new Log File
app.post('/api/logs', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileName = req.file.originalname;
  let rawContentBuffer = "";

  const stats = { totalLogs: 0, errorCount: 0, warnCount: 0, infoCount: 0, unstructuredCount: 0 };
  const timeline = {};
  const clusters = {};
  const state = { lastSeverity: 'INFO', lastCluster: null };

  const rl = readline.createInterface({
    input: fs.createReadStream(req.file.path),
    crlfDelay: Infinity
  });

  const MAX_LINES = 10000;
  let truncated = false;

  for await (const line of rl) {
    if (!line.trim()) continue;
    
    if (stats.totalLogs < MAX_LINES) {
      rawContentBuffer += line + "\n";
      parseLine(line, stats, timeline, clusters, state);
    } else {
      truncated = true;
      break; 
    }
  }

  // Cleanup temp file
  fs.unlink(req.file.path, (err) => {
    if (err) console.error("Failed to delete temp log file", err);
  });

  const clustersArray = Object.values(clusters)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const sortedBuckets = Object.keys(timeline).sort();
  
  // Add padding if range is too narrow (for better chart rendering)
  if (sortedBuckets.length === 1) {
    const single = sortedBuckets[0];
    const d = new Date(single + ":00Z");
    const before = new Date(d.getTime() - 60000).toISOString().slice(0, 16);
    const after = new Date(d.getTime() + 60000).toISOString().slice(0, 16);
    timeline[before] = { total: 0, errors: 0, warnings: 0, unstructured: 0 };
    timeline[after] = { total: 0, errors: 0, warnings: 0, unstructured: 0 };
    sortedBuckets.unshift(before);
    sortedBuckets.push(after);
  }

  const finalBuckets = sortedBuckets.slice(-60);
  const timelineFormatted = {
    labels: finalBuckets,
    datasets: [
      {
        label: "Total Logs",
        data: finalBuckets.map(b => timeline[b].total || 0),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)"
      },
      {
        label: "Errors",
        data: sortedBuckets.map(b => timeline[b].errors || 0),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.2)"
      },
      {
        label: "Warnings",
        data: sortedBuckets.map(b => timeline[b].warnings || 0),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.2)"
      },
      {
        label: "Unstructured",
        data: sortedBuckets.map(b => timeline[b].unstructured || 0),
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.2)"
      }
    ]
  };

  const aiSummary = await generateRealAISummary(clustersArray, stats);
  stats.truncated = truncated;

  try {
    const savedSession = await LogSession.create({
      fileName,
      rawContent: rawContentBuffer, 
      stats,
      aiSummary,
      clusters: clustersArray,
      timeline: timelineFormatted
    });

    res.status(201).json({
      _id: savedSession._id,
      fileName,
      uploadDate: savedSession.uploadDate,
      summary: stats,
      aiSummary,
      clusters: clustersArray,
      timeline: timelineFormatted
    });
  } catch (dbError) {
    console.error("MySQL Save Error:", dbError);
    res.status(500).json({ error: "Failed to save analysis to database." });
  }
});

// 3.5. NEW API ENDPOINT - Process Direct Pasted Raw Text (Multi-format)
app.post('/api/logs/raw', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No log string provided in payload request." });
    }

    const stats = { totalLogs: 0, errorCount: 0, warnCount: 0, infoCount: 0, unstructuredCount: 0 };
    const timeline = {};
    const clusters = {};
    const state = { lastSeverity: 'INFO', lastCluster: null };

    const fileStream = Readable.from([text]);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const MAX_LINES = 10000;
    let truncated = false;

    for await (const line of rl) {
      if (!line.trim()) continue;
      
      if (stats.totalLogs < MAX_LINES) {
        parseLine(line, stats, timeline, clusters, state);
      } else {
        truncated = true;
        break;
      }
    }

    const clustersArray = Object.values(clusters)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const sortedBuckets = Object.keys(timeline).sort();
    
    // Add padding if range is too narrow (for better chart rendering)
    if (sortedBuckets.length === 1) {
      const single = sortedBuckets[0];
      const d = new Date(single + ":00Z");
      const before = new Date(d.getTime() - 60000).toISOString().slice(0, 16);
      const after = new Date(d.getTime() + 60000).toISOString().slice(0, 16);
      timeline[before] = { total: 0, errors: 0, warnings: 0, unstructured: 0 };
      timeline[after] = { total: 0, errors: 0, warnings: 0, unstructured: 0 };
      sortedBuckets.unshift(before);
      sortedBuckets.push(after);
    }

    const finalBuckets = sortedBuckets.slice(-60);
    const timelineFormatted = {
      labels: finalBuckets,
      datasets: [
        {
          label: "Total Logs",
          data: finalBuckets.map(b => timeline[b].total || 0),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.2)"
        },
        {
          label: "Errors",
          data: finalBuckets.map(b => timeline[b].errors || 0),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.2)"
        },
        {
          label: "Warnings",
          data: finalBuckets.map(b => timeline[b].warnings || 0),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.2)"
        },
        {
          label: "Unstructured",
          data: finalBuckets.map(b => timeline[b].unstructured || 0),
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.2)"
        }
      ]
    };

    const aiSummary = await generateRealAISummary(clustersArray, stats);
    stats.truncated = truncated;

    const savedDoc = await LogSession.create({
      fileName: 'Pasted Raw Data',
      rawContent: text.substring(0, 50000), 
      stats,
      timeline: timelineFormatted,
      clusters: clustersArray,
      aiSummary
    });
    res.json({
      _id: savedDoc._id,
      fileName: savedDoc.fileName,
      uploadDate: savedDoc.uploadDate,
      summary: savedDoc.stats,
      aiSummary: savedDoc.aiSummary,
      clusters: savedDoc.clusters,
      timeline: savedDoc.timeline
    });

  } catch (error) {
    console.error("Paste Error:", error);
    res.status(500).json({ error: "Failed to ingest pasted terminal snippet." });
  }
});

// 4. Wipe massive database memory (ALL)
app.delete('/api/logs', async (req, res) => {
  try {
    await LogSession.destroy({ where: {} });
    res.json({ message: 'MySQL table wiped clean.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to obliterate database.' });
  }
});

// 5. Granular specific deletion (Individual)
app.delete('/api/logs/:id', async (req, res) => {
  try {
    const deletedSession = await LogSession.destroy({ where: { _id: req.params.id } });
    if (!deletedSession) return res.status(404).json({ error: 'Session not found for deletion' });
    res.json({ message: 'Successfully removed session from cluster.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete specific document.' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const frontEndPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontEndPath));
  
  // Catch-all route to serve React's index.html for unknown routes (React Router support)
  app.use((req, res) => {
    res.sendFile(path.resolve(frontEndPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`LogPulse Mongoose API running on port ${port}`);
});
