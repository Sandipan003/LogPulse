import { BrainCircuit, Link2Off, Eye, Lightbulb, Workflow } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnalysisPanel({ aiSummary }) {
  if (!aiSummary) return null;

  const handleGenerateScript = () => {
    if (!aiSummary || !aiSummary.recommendedFix) return;

    const scriptHeader = `#!/bin/bash
# ==============================================================================
# LogPulse Auto-Fix Script
# Generated: ${new Date().toISOString()}
# Root Cause: ${aiSummary.rootCause}
# Technical Details: ${aiSummary.technicalDetails || "N/A"}
# ==============================================================================

echo "Initializing LogPulse Remediation Protocol..."
echo "Targeting: ${aiSummary.impact}"
echo ""
`;
    
    const scriptBody = aiSummary.recommendedFix.split('\n')
      .filter(step => step.trim())
      .map((step, idx) => {
        const cleanStep = step.replace(/^\d+\.\s*/, '');
        return `# Step ${idx + 1}: ${cleanStep}\necho "-> Executing: ${cleanStep}..."\n# TODO: Add specific CLI remediation commands here\nsleep 1\n`;
      })
      .join('\n');

    const scriptFooter = `\necho ""\necho "Remediation Script Execution Complete."\n`;
    
    const fullScript = scriptHeader + scriptBody + scriptFooter;

    const blob = new Blob([fullScript], { type: 'text/x-sh' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = aiSummary.rootCause.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    a.download = `logpulse_remediation_${safeName}.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Auto-Fix Bash Script Generated!");
  };

  return (
    <div className="h-full flex flex-col justify-between space-y-6">
      <div className="glass-panel p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-indigo-950/20 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
        
        <div className="w-16 h-16 bg-zinc-950 border-2 border-brand-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 mb-4 z-10 relative">
          <BrainCircuit className="w-8 h-8 text-brand-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-1 z-10">AI Diagnostic Complete</h3>
        <p className="text-sm text-zinc-400 z-10">Found the primary failure cascade.</p>
      </div>

      <div className="glass-panel overflow-hidden border-zinc-700/50">
        
        {/* Root Cause */}
        <div className="p-5 border-b border-zinc-800/80 bg-red-500/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="flex items-start gap-3 relative z-10">
            <div className="mt-1 bg-red-500/20 p-1.5 rounded-md text-red-500">
              <Link2Off className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400/80 mb-1">Root Cause</h4>
              <p className="text-white font-medium">{aiSummary.rootCause}</p>
            </div>
          </div>
        </div>
        
        {/* Technical Details */}
        {aiSummary.technicalDetails && (
          <div className="p-5 border-b border-zinc-800/80 bg-brand-500/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
            <div className="flex items-start gap-3 relative z-10">
              <div className="mt-1 bg-brand-500/20 p-1.5 rounded-md text-brand-500">
                <Workflow className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400/80 mb-1">Technical Deep Dive</h4>
                <p className="text-zinc-300 text-sm leading-relaxed italic">"{aiSummary.technicalDetails}"</p>
              </div>
            </div>
          </div>
        )}


        {/* Impact */}
        <div className="p-5 border-b border-zinc-800/80 bg-amber-500/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <div className="flex items-start gap-3 relative z-10">
            <div className="mt-1 bg-amber-500/20 p-1.5 rounded-md text-amber-500">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500/80 mb-1">System Impact</h4>
              <p className="text-zinc-300 text-sm leading-relaxed">{aiSummary.impact}</p>
            </div>
          </div>
        </div>

        {/* Fix */}
        <div className="p-5 bg-emerald-500/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex items-start gap-3 relative z-10">
            <div className="mt-1 bg-emerald-500/20 p-1.5 rounded-md text-emerald-500">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="w-full">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500/80 mb-2">Recommended Fix</h4>
              <ul className="space-y-2">
                {aiSummary.recommendedFix.split('\n').map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-300 bg-zinc-900/50 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-emerald-500 font-mono text-xs mt-0.5">{`>`}</span>
                    <span className="leading-tight">{step.replace(/^\d+\.\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      <button onClick={handleGenerateScript} className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer">
        <Workflow className="w-4 h-4 opacity-80 group-hover:rotate-12 transition-transform" />
        Generate Auto-Fix Script
      </button>

    </div>
  );
}
