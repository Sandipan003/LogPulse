# AI Log Analyzer for VS Code

Transform noisy logs into actionable SRE intelligence directly within VS Code. No cloud, no APIs—just raw local processing.

## Features

- **🚀 Instant Analysis**: Right-click any `.log`, `.txt`, `.json`, or `.csv` file in the explorer.
- **🔍 Pattern Clustering**: Groups thousands of log lines into unique, actionable failure signatures.
- **📈 Timeline Density**: Visualizes error spikes over time to pinpoint exact crash moments.
- **💊 AI Prescription**: Provides a local, rule-based diagnosis and remediation guide.
- **🛡️ 100% Local**: Uses your machine's CPU/RAM. Your logs never leave your device.

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- [VS Code](https://code.visualstudio.com/) 1.75.0 or newer.

### Build from Source
1. Navigate to the `extension` folder:
   ```bash
   cd extension
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the project:
   ```bash
   npm run compile
   ```
4. Package the extension:
   ```bash
   npm install -g @vscode/vsce
   vsce package
   ```
   This will generate a file named `ai-log-analyzer-1.0.0.vsix`.

### Install Extension
1. Open VS Code.
2. Go to the Extensions view (`Ctrl+Shift+X`).
3. Click the `...` menu in the top right.
4. Select **Install from VSIX...**.
5. Choose the `ai-log-analyzer-1.0.0.vsix` file.

## Usage
- Open any log file.
- Right-click anywhere in the editor or explorer and select **Analyze Logs with AI LogPulse**.
- View the dashboard in the panel that opens.
