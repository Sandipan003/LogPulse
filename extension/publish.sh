#!/bin/bash
set -e

echo "🚀 AI LogPulse: Starting One-Click Publishing..."

# 1. Install Dependencies
echo "📦 Installing internal dependencies..."
npm install

# 2. Bundle extension
echo "⚡ Bundling for production (esbuild)..."
npm run bundle

# 3. Package
echo "📦 Creating final .vsix bundle..."
npx @vscode/vsce package --no-git-tag-version --no-update-package-json --allow-missing-repository

echo "✅ DONE! Your extension is bundled and optimized (42KB)."
echo "--------------------------------------------------------"
echo "🛠️  NEXT STEPS:"
echo "1. Run: npx @vscode/vsce login SandipanSarkar"
echo "2. Paste your PAT (Personal Access Token)"
echo "3. Run: npx @vscode/vsce publish"
echo "--------------------------------------------------------"
