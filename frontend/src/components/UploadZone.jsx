import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, Database, Code } from 'lucide-react';

export default function UploadZone({ onUpload, isProcessing }) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'paste'
  const [rawText, setRawText] = useState('');

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsHovered(false);
      if (isProcessing) return;
      const file = e.dataTransfer.files[0];
      if (file) {
        onUpload(file, 'file');
      }
    },
    [onUpload, isProcessing]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    if (!isProcessing) setIsHovered(true);
  }, [isProcessing]);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsHovered(false);
  }, []);

  const handleFileInput = (e) => {
    if (isProcessing) return;
    const file = e.target.files[0];
    if (file) {
      onUpload(file, 'file');
    }
  };

  const handlePasteSubmit = () => {
    if (isProcessing || !rawText.trim()) return;
    onUpload(rawText, 'text');
  };

  return (
    <div className="w-full max-w-3xl glass-panel relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 shadow-2xl">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 transition-opacity duration-500 pointer-events-none"
        style={{ opacity: isHovered ? 1 : 0 }}
      />
      
      {/* Dynamic Scan Line indicating active backend readiness */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50 scanner-line"></div>

      <div className="flex border-b border-zinc-800/80">
         <button 
           onClick={() => setActiveTab('upload')} 
           className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-zinc-900 border-b-2 border-brand-500 text-brand-400' : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'}`}
         >
           <UploadCloud className="w-4 h-4" /> Drop File
         </button>
         <button 
           onClick={() => setActiveTab('paste')} 
           className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition flex items-center justify-center gap-2 ${activeTab === 'paste' ? 'bg-zinc-900 border-b-2 border-brand-500 text-brand-400' : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'}`}
         >
           <Code className="w-4 h-4" /> Paste Terminal Logs
         </button>
      </div>

      <div className="p-12">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-500">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900/50">
                <div className="absolute inset-0 border border-brand-500/30 rounded-full animate-ping"></div>
                <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  <Database className="w-8 h-8 animate-pulse" />
                </div>
              </div>
            </div>
            
            <h3 className="mt-8 text-2xl font-black text-white tracking-tight">AI Engine Active</h3>
            <p className="mt-2 font-mono text-zinc-400 text-sm overflow-hidden whitespace-nowrap border-r-2 border-brand-500 animate-typing">
              {'> Extracting structural sequences...'}
            </p>
            
            <div className="mt-8 w-64 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div className="h-full bg-brand-500 rounded-full w-1/2 animate-shimmer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] animate-[shimmer_1.5s_infinite]"></div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {activeTab === 'upload' ? (
              <label 
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`
                  flex flex-col items-center justify-center py-14 px-4 
                  border-2 border-dashed rounded-2xl cursor-pointer 
                  transition-all duration-300
                  ${isHovered 
                    ? 'border-brand-500 bg-brand-500/5 scale-[1.02]' 
                    : 'border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/30'}
                `}
              >
                <div className={`
                  p-5 rounded-full mb-6 transition-all duration-300
                  ${isHovered ? 'bg-brand-500/20 text-brand-400 scale-110' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 shadow-inner'}
                `}>
                  <UploadCloud className="w-10 h-10" />
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2 selection:bg-brand-500/30">Drop your server file here</h3>
                <p className="text-zinc-500 font-medium mb-8">Securely processes massive structural logs locally without crashing.</p>
                
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-widest"><FileText className="w-3.5 h-3.5 text-brand-500" /> .log</span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-widest"><FileText className="w-3.5 h-3.5 text-emerald-500" /> .txt</span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-widest"><Code className="w-3.5 h-3.5 text-amber-500" /> .json</span>
                </div>
                
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".log,.txt,.csv,.json"
                  onChange={handleFileInput}
                />
              </label>
            ) : (
              <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                 <textarea 
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste your terrifying application crash logs in here... [Supports Raw Apache, Multi-line traces, JSON]"
                    className="w-full h-64 bg-zinc-950 text-brand-100 font-mono text-xs p-6 rounded-2xl border border-zinc-800 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 outline-none resize-none shadow-inner custom-scrollbar"
                 ></textarea>
                 <button 
                   onClick={handlePasteSubmit}
                   disabled={!rawText.trim()}
                   className="w-full py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-black uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-brand-400/50"
                 >
                    Analyze Paste Stream
                 </button>
              </div>
            )}
           </div>
        )}
      </div>
    </div>
  );
}
