# VS Code Marketplace Publishing Guide

Follow these steps to make **AI Log Analyzer** publicly searchable and installable by anyone in VS Code.

## Phase 1: Create a Publisher Account
1. **Sign in** to the [Visual Studio Marketplace Management Portal](https://marketplace.visualstudio.com/manage).
2. **Create a Publisher**: If you don't have one, create a new publisher. 
   - Note the **ID** (e.g., `logpulse`). This must match the `"publisher"` field in your `package.json`.

## Phase 2: Generate a Security Token (PAT)
1. Go to [Azure DevOps](https://dev.azure.com/).
2. Click **User Settings** (icon next to your profile picture) > **Personal Access Tokens**.
3. Select **New Token**:
   - **Name**: `vsce-publisher`
   - **Organization**: `All accessible organizations`
   - **Scopes**: Select `Custom defined` and toggle **View all scopes** at the bottom.
   - **Marketplace Section**: Check **Acquire** and **Manage**.
4. **Copy the PAT**. You will only see it once!

## Phase 3: Login via CLI
Open your terminal in the `extension` folder and run:
```bash
# Install the VSCE tool
npm install -g @vscode/vsce

# Login with your Publisher ID and PAT
vsce login [your-publisher-id]
```
*Paste your PAT when prompted.*

## Phase 4: Final Validation
Before publishing, ensure your extension is polished:
- **Icon**: Ensure `media/icon.svg` looks good (Done ✅).
- **README**: Detailed features and usage (Done ✅).
- **Version**: Increment the version in `package.json` for every new release.

## Phase 5: Publish
Run the following command to bundle and upload to the store:
```bash
vsce publish
```
*Note: Your extension will be 'Verifying' for a few minutes before it appears in the public search results.*

## Pro-Tip: Incremental Releases
To update your extension later:
```bash
vsce publish patch   # 1.0.0 -> 1.0.1
vsce publish minor   # 1.0.0 -> 1.1.0
vsce publish major   # 1.0.0 -> 2.0.0
```
