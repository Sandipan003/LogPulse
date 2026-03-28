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

const app = express();
const port = process.env.PORT || 3001;

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
  let sig = message;
  sig = sig.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '<IP>');
  sig = sig.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig, '<UUID>');
  sig = sig.replace(/\b\d+\b/g, '<NUM>');
  return sig.trim();
}

function generateMockAISummary(clusters, unstructuredCount) {
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

  if (combinedPatterns.includes('timeout') && combinedPatterns.includes('connection')) {
    return {
      rootCause: "Database Connection Pool Exhaustion",
      impact: `Detected ${errorClusters[0].count} connection drop-offs critically impacting API latency.`,
      recommendedFix: "1. Increase the max connection pool size in 'db.config'.\n2. Track down orphaned transactions consuming idle connections.\n3. Verify network stability to the main cluster."
    };
  }

  if (combinedPatterns.includes('memory') || combinedPatterns.includes('oom')) {
    return {
      rootCause: "Out of Memory (OOM) Exception / Resource Leak",
      impact: "Critical memory threshholds breached causing automatic container kills and dropped active requests.",
      recommendedFix: "1. Horizontally scale the affected service node immediately to stop bleeding.\n2. Analyze heap profiles under load to find the exact memory leak.\n3. Elevate the container RAM allocation ceiling."
    };
  }
  
  if (combinedPatterns.includes('auth') || combinedPatterns.includes('token') || combinedPatterns.includes('unauthorized')) {
    return {
      rootCause: "Authentication Gateway Failure",
      impact: "Users are blocked from accessing secure endpoints due to widespread JWT/Token validation rejections.",
      recommendedFix: "1. Verify the core Identity Provider (IdP) service status.\n2. Ensure recent key rotations propagated cleanly to the API gateway.\n3. Check standard clock synchronization metrics (NTP)."
    };
  }

  return {
    rootCause: "Unknown Application Exception",
    impact: `Encountered consecutive unexpected errors indicating a disruption in standard operations.`,
    recommendedFix: `1. Deep dive into the top cluster: "${errorClusters[0].pattern}".\n2. Map occurrences directly to the latest deployment SHA to find regressions.\n3. Increase detailed tracing verbosity temporarily.`
  };
}

function parseLine(line, stats, timeline, clusters) {
  const timestampRegex = /\[(.*?)\]|^(20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)|^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/;
  const severityRegex = /\b(ERROR|WARN|WARNING|INFO|DEBUG|FATAL|CRITICAL)\b/i;

  let timestamp = null;
  let severity = 'UNSTRUCTURED';
  let message = line.trim();

  if (message.startsWith('{') && message.endsWith('}')) {
     try {
       const j = JSON.parse(message);
       message = j.message || j.msg || j.error || j.log || Object.values(j).join(' ');
       severity = (j.level || j.severity || 'UNSTRUCTURED').toUpperCase();
       timestamp = j.timestamp || j.time || j.date || null;
     } catch(e) { } 
  }

  const tsMatch = message.match(timestampRegex);
  if (tsMatch) {
    timestamp = tsMatch[1] || tsMatch[2] || tsMatch[0];
  }

  const sevMatch = message.match(severityRegex);
  if (sevMatch && severity === 'UNSTRUCTURED') {
    severity = sevMatch[0].toUpperCase();
    if (severity === 'WARNING') severity = 'WARN';
    if (severity === 'FATAL' || severity === 'CRITICAL') severity = 'ERROR';
  } else if (severity === 'UNSTRUCTURED') {
    // Basic heuristic: if it looks terrifying, mark it as ERROR
    if (/exception|failed|timeout|crash|traceback|panic/i.test(message)) severity = 'ERROR';
  }

  // Update stats
  stats.totalLogs++;
  if (severity === 'ERROR') stats.errorCount++;
  else if (severity === 'WARN') stats.warnCount++;
  else if (severity === 'INFO' || severity === 'DEBUG') stats.infoCount++;
  else stats.unstructuredCount++;

  // Record timeline for graph
  if (timestamp) {
    let dateObj = new Date(timestamp);
    if (!isNaN(dateObj.getTime())) {
      let bucket = dateObj.toISOString().slice(0, 16); // Group by YYYY-MM-DDTHH:mm
      timeline[bucket] = (timeline[bucket] || 0) + 1;
    }
  }

  // If severity implies it's an anomaly worth tracking
  if (severity === 'ERROR' || severity === 'WARN') {
    const signature = generateSignature(message);
    if (!clusters[signature]) {
      clusters[signature] = {
        pattern: signature,
        count: 0,
        severity: severity,
        latestTimestamp: timestamp || new Date().toISOString()
      };
    }
    clusters[signature].count++;
    if (timestamp) clusters[signature].latestTimestamp = timestamp; // Track the most recent hit
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
      parseLine(line, stats, timeline, clusters);
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

  const sortedBuckets = Object.keys(timeline).sort().slice(-60);
  const timelineFormatted = {
    labels: sortedBuckets,
    datasets: [
      {
        label: "Errors",
        data: sortedBuckets.map(b => timeline[b].errors || timeline[b] || 0), // handle generic increments
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.2)"
      },
      {
        label: "Warnings",
        data: sortedBuckets.map(b => timeline[b].warnings || 0),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.2)"
      }
    ]
  };

  const aiSummary = generateMockAISummary(clustersArray, stats.unstructuredCount);
  stats.truncated = truncated;

  try {
    // Save to MySQL
    const savedSession = await LogSession.create({
      fileName,
      rawContent: rawContentBuffer, 
      stats,
      aiSummary,
      clusters: clustersArray,
      timeline: timelineFormatted
    });

    // Respond with frontend compatible data
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
    console.error("MongoDB Save Error:", dbError);
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

    // Transform raw text into a memory-safe stream
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
        parseLine(line, stats, timeline, clusters);
      } else {
        truncated = true;
        break;
      }
    }

    const clustersArray = Object.values(clusters)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const sortedBuckets = Object.keys(timeline).sort().slice(-60);
    const timelineFormatted = {
      labels: sortedBuckets,
      datasets: [
        {
          label: "Errors",
          data: sortedBuckets.map(b => timeline[b].errors || timeline[b] || 0),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.2)"
        },
        {
          label: "Warnings",
          data: sortedBuckets.map(b => timeline[b].warnings || 0),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.2)"
        }
      ]
    };

    const aiSummary = generateMockAISummary(clustersArray, stats.unstructuredCount);
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
