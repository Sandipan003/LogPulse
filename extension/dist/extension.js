"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));
var readline = __toESM(require("readline"));

// src/analyzer/logParser.ts
var LOG_FORMATS = [
  {
    name: "json",
    detect: (line) => line.trim().startsWith("{") && line.trim().endsWith("}"),
    parse: (line) => {
      try {
        const j = JSON.parse(line);
        return {
          timestamp: j.timestamp || j.time || j.date || null,
          severity: (j.level || j.severity || j.status || "INFO").toUpperCase(),
          message: j.message || j.msg || j.error || j.log || Object.values(j).join(" ")
        };
      } catch (e) {
        return null;
      }
    }
  },
  {
    name: "web",
    regex: /^(\S+) \S+ \S+ \[(.*?)\] "(\S+) (\S+) \S+" (\d{3}) (\d+|-)/,
    parse: (match) => ({
      timestamp: match[2],
      severity: parseInt(match[5]) >= 400 ? "ERROR" : "INFO",
      message: `${match[3]} ${match[4]} returned ${match[5]}`
    })
  },
  {
    name: "spring",
    regex: /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\s+(ERROR|WARN|INFO|DEBUG|TRACE)\s+\[(.*?)\]\s+(.*?)\s+:\s+(.*)/,
    parse: (match) => ({
      timestamp: match[1],
      severity: match[2],
      message: match[5]
    })
  },
  {
    name: "generic",
    regex: /^\[(.*?)\]\s+(ERROR|WARN|INFO|DEBUG|FATAL|CRITICAL)\b(.*?):\s*(.*)/i,
    parse: (match) => ({
      timestamp: match[1],
      severity: match[2].toUpperCase(),
      message: match[4]
    })
  }
];
function generateSignature(message) {
  const exceptionMatch = message.match(/([a-zA-Z0-9.]+Exception|Error):/);
  if (exceptionMatch) return exceptionMatch[1];
  let sig = message;
  sig = sig.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "<IP>");
  sig = sig.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig, "<UUID>");
  sig = sig.replace(/\b\d+\b/g, "<NUM>");
  return sig.trim().substring(0, 150);
}

// src/analyzer/errorCluster.ts
function updateClusters(clusters, message, severity, timestamp) {
  if (severity === "ERROR" || severity === "WARN") {
    const signature = generateSignature(message);
    if (!clusters[signature]) {
      clusters[signature] = {
        pattern: signature,
        count: 0,
        severity,
        latestTimestamp: timestamp || (/* @__PURE__ */ new Date()).toISOString(),
        samples: []
      };
    }
    clusters[signature].count++;
    if (timestamp) clusters[signature].latestTimestamp = timestamp;
    if (clusters[signature].samples.length < 5) {
      clusters[signature].samples.push(message.substring(0, 500));
    }
    return clusters[signature];
  }
  return null;
}

// src/analyzer/summaryGenerator.ts
async function generateOfflineSummary(clusters, stats) {
  const topError = clusters[0];
  const totalErrors = stats.errorCount;
  let rootCause = "Stable environment detected.";
  let technicalDetails = "No critical patterns found in the analyzed log batch.";
  let impact = "Minimal risk to production services.";
  let recommendedFix = ["Continue monitoring system health."];
  if (totalErrors > 0 && topError) {
    rootCause = `High-frequency of ${topError.pattern} detected.`;
    technicalDetails = `We observed ${topError.count} occurrences of this issue. Error samples suggest potential failures in ${inferSystemArea(topError.samples[0])}.`;
    impact = `Potential degradation in ${inferImpactArea(topError.pattern)}. High count suggests systematic failure rather than transient error.`;
    recommendedFix = [
      `Check ${inferSystemArea(topError.samples[0])} configuration and status.`,
      `Investigate logs around ${topError.latestTimestamp} for correlation.`,
      `Validate network connectivity if timeout or connection errors persist.`
    ];
  }
  return { rootCause, technicalDetails, impact, recommendedFix };
}
function inferSystemArea(message) {
  if (/sql|db|database|query|connection/i.test(message)) return "Database Layer";
  if (/auth|jwt|token|login|unauthorized/i.test(message)) return "Security & Auth";
  if (/timeout|network|socket|refused/i.test(message)) return "Network Infrastructure";
  if (/memory|null|pointer|stack/i.test(message)) return "Application Runtime";
  return "Core System";
}
function inferImpactArea(pattern) {
  if (/db|sql/i.test(pattern)) return "Data Integrity and Availability";
  if (/timeout/i.test(pattern)) return "Service Latency and Throughput";
  return "Application Stability";
}

// src/extension.ts
function activate(context) {
  let disposable = vscode.commands.registerCommand("ai-log-analyzer.analyzeFile", async (uri) => {
    if (!uri) {
      vscode.window.showErrorMessage("Please right-click a file to analyze.");
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      "logAnalysis",
      `Analysis: ${path.basename(uri.fsPath)}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "media"))]
      }
    );
    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);
    const stats = { totalLogs: 0, errorCount: 0, warnCount: 0, infoCount: 0, unstructuredCount: 0 };
    const timeline = {};
    const clusters = {};
    const fileStream = fs.createReadStream(uri.fsPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    let lineCount = 0;
    const MAX_LINES = 15e3;
    panel.webview.postMessage({ type: "STATUS", message: "Analyzing logs..." });
    for await (const line of rl) {
      if (!line.trim() || lineCount >= MAX_LINES) continue;
      let parsed = null;
      for (const format of LOG_FORMATS) {
        if (format.detect && format.detect(line)) {
          parsed = format.parse(line);
          break;
        } else if (format.regex) {
          const match = line.match(format.regex);
          if (match) {
            parsed = format.parse(match);
            break;
          }
        }
      }
      const severity = parsed ? parsed.severity : "UNSTRUCTURED";
      const timestamp = parsed ? parsed.timestamp : null;
      const message = (parsed ? parsed.message : line).trim();
      stats.totalLogs++;
      if (severity === "ERROR") stats.errorCount++;
      else if (severity === "WARN") stats.warnCount++;
      else if (["INFO", "DEBUG", "TRACE"].includes(severity)) stats.infoCount++;
      else stats.unstructuredCount++;
      const bucket = timestamp ? timestamp.substring(0, 16) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 16);
      if (!timeline[bucket]) timeline[bucket] = { total: 0, errors: 0 };
      timeline[bucket].total++;
      if (severity === "ERROR") timeline[bucket].errors++;
      updateClusters(clusters, message, severity, timestamp);
      lineCount++;
      if (lineCount % 500 === 0) {
        panel.webview.postMessage({ type: "PROGRESS", progress: lineCount / MAX_LINES * 100 });
      }
    }
    const clustersArray = Object.values(clusters).sort((a, b) => b.count - a.count).slice(0, 10);
    const aiSummary = await generateOfflineSummary(clustersArray, stats);
    panel.webview.postMessage({
      type: "RESULT",
      stats,
      clusters: clustersArray,
      aiSummary,
      timeline
    });
  });
  context.subscriptions.push(disposable);
  const sidebarProvider = new LogInsightProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("log-insight-sidebar", sidebarProvider)
  );
}
var LogInsightProvider = class {
  constructor(_extensionUri) {
    this._extensionUri = _extensionUri;
  }
  resolveWebviewView(webviewView) {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = `<!DOCTYPE html>
        <html lang="en">
        <body>
            <div style="padding: 10px; font-size: 11px; color: var(--vscode-descriptionForeground);">
                <p><strong>Log Insight Engine Active</strong></p>
                <p>Right-click any .log or .txt file and select "Analyze Logs" to view the deep-dive dashboard.</p>
                <button style="width: 100%; padding: 8px; background: var(--vscode-button-background); color: white; border: none; cursor: pointer; border-radius: 4px;" onclick="vscode.postMessage({command: 'openSearch'})">
                    Manual Search
                </button>
            </div>
        </body>
        </html>`;
  }
};
function getWebviewContent(webview, extensionUri) {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "script.js"));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "styles.css"));
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <title>AI LogPulse Dashboard</title>
    </head>
    <body>
        <div id="loading" class="overlay">
            <div class="loader"></div>
            <p id="status-text">Initializing local engine...</p>
        </div>

        <div class="header">
            <h1>Log Insight Dashboard</h1>
            <div id="stats-grid" class="stats-grid">
               <div class="stat-card"><h3>Total Logs</h3><p id="stat-total">0</p></div>
               <div class="stat-card error"><h3>Errors</h3><p id="stat-errors">0</p></div>
               <div class="stat-card warn"><h3>Unique Failures</h3><p id="stat-unique">0</p></div>
            </div>
        </div>

        <div class="main-content">
            <div class="summary-section">
                <h2>AI Prescription (Local)</h2>
                <div id="ai-summary" class="ai-box">
                    <p>Analysis pending...</p>
                </div>
            </div>

            <div class="chart-section">
                <h2>Incident Density</h2>
                <canvas id="timelineChart"></canvas>
            </div>

            <div class="clusters-section">
                <h2>Top Failure Signatures</h2>
                <div id="clusters-list"></div>
            </div>
        </div>

        <script src="${scriptUri}"></script>
    </body>
    </html>`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
