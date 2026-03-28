import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import { LOG_FORMATS, LogEntry } from './analyzer/logParser';
import { updateClusters, ErrorCluster } from './analyzer/errorCluster';
import { generateOfflineSummary } from './analyzer/summaryGenerator';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('ai-log-analyzer.analyzeFile', async (uri: vscode.Uri) => {
        if (!uri) {
            vscode.window.showErrorMessage('Please right-click a file to analyze.');
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'logAnalysis',
            `Analysis: ${path.basename(uri.fsPath)}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );

        panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

        // Analysis Logic
        const stats = { totalLogs: 0, errorCount: 0, warnCount: 0, infoCount: 0, unstructuredCount: 0 };
        const timeline: any = {};
        const clusters: { [key: string]: ErrorCluster } = {};
        
        const fileStream = fs.createReadStream(uri.fsPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let lineCount = 0;
        const MAX_LINES = 15000;

        panel.webview.postMessage({ type: 'STATUS', message: 'Analyzing logs...' });

        for await (const line of rl) {
            if (!line.trim() || lineCount >= MAX_LINES) continue;
            
            // Re-using LogPulse logic locally
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

            const severity = parsed ? parsed.severity : 'UNSTRUCTURED';
            const timestamp = parsed ? parsed.timestamp : null;
            const message = (parsed ? parsed.message : line).trim();

            stats.totalLogs++;
            if (severity === 'ERROR') stats.errorCount++;
            else if (severity === 'WARN') stats.warnCount++;
            else if (['INFO', 'DEBUG', 'TRACE'].includes(severity)) stats.infoCount++;
            else stats.unstructuredCount++;

            // Timeline simple bucket
            const bucket = timestamp ? timestamp.substring(0, 16) : new Date().toISOString().slice(0, 16);
            if (!timeline[bucket]) timeline[bucket] = { total: 0, errors: 0 };
            timeline[bucket].total++;
            if (severity === 'ERROR') timeline[bucket].errors++;

            updateClusters(clusters, message, severity, timestamp);
            lineCount++;

            if (lineCount % 500 === 0) {
                panel.webview.postMessage({ type: 'PROGRESS', progress: (lineCount / MAX_LINES) * 100 });
            }
        }

        const clustersArray = (Object.values(clusters) as ErrorCluster[]).sort((a: ErrorCluster, b: ErrorCluster) => b.count - a.count).slice(0, 10);
        const aiSummary = await generateOfflineSummary(clustersArray, stats);

        panel.webview.postMessage({
            type: 'RESULT',
            stats,
            clusters: clustersArray,
            aiSummary,
            timeline
        });
    });

    context.subscriptions.push(disposable);

    // Sidebar Provider
    const sidebarProvider = new LogInsightProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('log-insight-sidebar', sidebarProvider)
    );
}

class LogInsightProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
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
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'script.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'styles.css'));

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
