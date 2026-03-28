const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const readline = require('readline');
const os = require('os');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Set up multer for disk storage in the OS temp directory
const upload = multer({ 
  dest: os.tmpdir(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for the hackathon "10MB+" requirement
});

// Helper functions for parsing and clustering
const strictLogPattern = /(?:\[)?(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)(?:\])?\s+(?:\[)?(ERROR|WARN|WARNING|INFO|DEBUG|TRACE)(?:\])?\s+(.*)/i;
const fallbackSeverityPattern = /(?:\[)?(ERROR|WARN|WARNING|INFO|DEBUG|TRACE)(?:\])?\s+(.*)/i;

function generateSignature(message) {
  let sig = message;
  // Strip IPs
  sig = sig.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '<IP>');
  // Strip UUIDs
  sig = sig.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig, '<UUID>');
  // Strip general numbers
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

  // Combine error patterns for keyword searching
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


app.post('/api/analyze', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Processing state variables
  let totalLogs = 0;
  let parsedStructured = 0;
  let unstructuredCount = 0;
  let errorCount = 0;
  let warnCount = 0;
  let infoCount = 0;

  const clusterMap = new Map();
  const timeBuckets = new Map();

  const rl = readline.createInterface({
    input: fs.createReadStream(req.file.path),
    crlfDelay: Infinity
  });

  const MAX_LINES = 10000;
  let truncated = false;

  for await (const line of rl) {
    if (!line.trim()) continue;
    
    totalLogs++;
    if (totalLogs > MAX_LINES) {
      truncated = true;
      break; 
    }

    let timestampStr = null;
    let severity = 'UNKNOWN';
    let message = line;
    let isStructured = false;

    // First try strict match
    const strictMatch = line.match(strictLogPattern);
    if (strictMatch) {
      timestampStr = strictMatch[1];
      severity = strictMatch[2].toUpperCase();
      message = strictMatch[3];
      isStructured = true;
    } else {
      // Fallback: look for severity blindly
      const fallbackMatch = line.match(fallbackSeverityPattern);
      if (fallbackMatch) {
        severity = fallbackMatch[1].toUpperCase();
        message = fallbackMatch[2];
      } else {
        severity = 'UNSTRUCTURED';
      }
    }

    if (severity === 'UNSTRUCTURED') {
      unstructuredCount++;
      continue; // We only trace and cluster severity-bound lines for the core UI, though we count them
    }

    parsedStructured++;

    let canonSev = severity;
    if (canonSev === 'WARNING') canonSev = 'WARN';
    if (canonSev === 'DEBUG' || canonSev === 'TRACE') canonSev = 'INFO';

    if (canonSev === 'ERROR') errorCount++;
    else if (canonSev === 'WARN') warnCount++;
    else infoCount++;

    // Timeline Aggregation
    if (timestampStr) {
      try {
        const ts = new Date(timestampStr);
        if (!isNaN(ts.getTime())) {
          // Use UTC hours and minutes to avoid timezone shifts skewing the analysis
          const hours = String(ts.getUTCHours()).padStart(2, '0');
          const minutes = String(ts.getUTCMinutes()).padStart(2, '0');
          const hourMin = `${hours}:${minutes}`;
          
          if (!timeBuckets.has(hourMin)) {
            timeBuckets.set(hourMin, { errors: 0, warnings: 0 });
          }
          
          if (canonSev === 'ERROR') timeBuckets.get(hourMin).errors++;
          if (canonSev === 'WARN') timeBuckets.get(hourMin).warnings++;
        }
      } catch(e) {}
    }

    // Smart Clustering
    if (canonSev === 'ERROR' || canonSev === 'WARN') {
      const signature = generateSignature(message);
      const clusterKey = `${canonSev}:${signature}`;
      
      if (!clusterMap.has(clusterKey)) {
        clusterMap.set(clusterKey, {
          id: `cluster-${clusterMap.size + 1}`,
          pattern: signature,
          count: 0,
          severity: canonSev,
          latestTimestamp: timestampStr || new Date().toISOString()
        });
      }
      
      const cluster = clusterMap.get(clusterKey);
      cluster.count++;
      if (timestampStr) {
        cluster.latestTimestamp = timestampStr;
      }
    }
  }

  // Cleanup temp file uploaded via multer immediately after parsing
  fs.unlink(req.file.path, (err) => {
    if (err) console.error("Failed to delete temp log file", err);
  });

  // Convert clusters to array and sort by frequency
  const clustersArray = Array.from(clusterMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Generate Timeline Data (Sort chronologically)
  // Limited to 60 buckets (1 hour of continuous minute coverage realistically)
  const sortedBuckets = Array.from(timeBuckets.keys()).sort().slice(-60);
  const timeline = {
    labels: sortedBuckets,
    datasets: [
      {
        label: "Errors",
        data: sortedBuckets.map(b => timeBuckets.get(b).errors),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.2)"
      },
      {
        label: "Warnings",
        data: sortedBuckets.map(b => timeBuckets.get(b).warnings),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.2)"
      }
    ]
  };

  const aiSummary = generateMockAISummary(clustersArray, unstructuredCount);

  res.json({
    summary: { totalLogs, errorCount, warnCount, infoCount, unstructuredCount, truncated },
    aiSummary,
    clusters: clustersArray,
    timeline
  });
});

app.listen(port, () => {
  console.log(`LogPulse Backend App API running on port ${port}`);
});
