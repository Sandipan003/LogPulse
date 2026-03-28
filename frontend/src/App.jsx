import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { Activity, LayoutDashboard, BrainCircuit, SearchCode, Database, Settings as SettingsIcon, Trash2, HardDrive, Download, Search } from 'lucide-react';
import Sidebar from './components/Sidebar';
import UploadZone from './components/UploadZone';
import TimelineChart from './components/TimelineChart';
import SeverityChart from './components/SeverityChart';
import AnalysisPanel from './components/AnalysisPanel';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // High-level navigation view
  const [activeView, setActiveView] = useState('upload'); // 'upload', 'dashboard', 'history', 'settings'
  
  // Dashboard sub-tabs
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'deepdive', 'intelligence'
  const [dbStatus, setDbStatus] = useState('Idle');
  
  const [historyData, setHistoryData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [proEnabled, setProEnabled] = useState(false);

  // Fetch history specifically for the History tab
  const loadHistoryView = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await axios.get(`${API_URL}/api/logs`);
      setHistoryData(res.data);
    } catch (err) {
      toast.error("Failed to load history list");
    }
  };

  useEffect(() => {
    if (activeView === 'history') {
      loadHistoryView();
    }
  }, [activeView]);

  const handleFileUpload = async (payload, type = 'file') => {
    setIsProcessing(true);
    setError(null);
    setAnalysisResult(null);
    setDbStatus('Uploading to MySQL...');
    
    const loadingToast = toast.loading('Syncing with MySQL...', {
      style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' }
    });

    try {
      let response;
      const API_URL = import.meta.env.VITE_API_URL || '';
      
      if (type === 'text') {
         response = await axios.post(`${API_URL}/api/logs/raw`, { text: payload }, {
            headers: { 'Content-Type': 'application/json' }
         });
      } else {
         const formData = new FormData();
         formData.append('file', payload);
         response = await axios.post(`${API_URL}/api/logs`, formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
         });
      }
      
      const data = response.data;
      
      if (data.summary.totalLogs === 0) {
        setError("Payload was successfully parsed but contained zero identifiable logging sequences.");
      } else {
        setAnalysisResult(data);
        setActiveTab('dashboard'); 
        setActiveView('dashboard');
        window.dispatchEvent(new Event('logpulse-refresh-sidebar'));
        toast.success("Saved to MySQL", { id: loadingToast });
      }
      
    } catch (err) {
      console.error("Upload error:", err);
      toast.error('MySQL Sync Failed', { id: loadingToast });
      setError("Failed to process the payload. Ensure MySQL and the NodeJS backend are running.");
    } finally {
      setIsProcessing(false);
      setDbStatus('Idle');
    }
  };

  const handleFetchSession = async (sessionId) => {
    if (!sessionId) {
      setAnalysisResult(null);
      setError(null);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setDbStatus('Fetching from MySQL...');
    setSearchQuery(''); // Reset search when loading new session
    
    const loadingToast = toast.loading('Retrieving Document...', {
      style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' }
    });

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${API_URL}/api/logs/${sessionId}`);
      setAnalysisResult(response.data);
      setActiveTab('dashboard');
      setActiveView('dashboard');
      toast.success("Document Loaded", { id: loadingToast });
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error('Failed to retrieve document', { id: loadingToast });
      setError("Failed to retrieve the past session from MySQL.");
      setAnalysisResult(null);
    } finally {
      setIsProcessing(false);
      setDbStatus('Idle');
    }
  };

  const handleWipeDatabase = async () => {
    const confirmation = window.confirm("Are you sure you want to completely obliterate your MySQL session history?");
    if (!confirmation) return;
    
    const loadingToast = toast.loading('Wiping cluster...', {
      style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' }
    });

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      await axios.delete(`${API_URL}/api/logs`);
      toast.success('Memory wiped successfully', { id: loadingToast });
      setAnalysisResult(null);
      setActiveView('upload');
      setHistoryData([]);
      window.dispatchEvent(new Event('logpulse-refresh-sidebar'));
    } catch (err) {
      toast.error('Failed to wipe database', { id: loadingToast });
    }
  };

  const handleDeleteIndividualRow = async (id, e) => {
    e.stopPropagation(); // prevent triggering the <tr> load click
    const loadingToast = toast.loading('Deleting document...', {
      style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' }
    });

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      await axios.delete(`${API_URL}/api/logs/${id}`);
      toast.success('Record Deleted', { id: loadingToast });
      loadHistoryView(); // refresh the table
      window.dispatchEvent(new Event('logpulse-refresh-sidebar'));
      
      // If we are currently holding this result in state, clear it to be safe
      if (analysisResult && analysisResult._id === id) {
         setAnalysisResult(null);
      }
    } catch (err) {
      toast.error("Failed to delete record", { id: loadingToast });
    }
  };

  const handleExportJSON = () => {
    if (!analysisResult) return;
    
    const bundle = {
       exportDate: new Date().toISOString(),
       logpulseVersion: '1.0.0',
       application: analysisResult.fileName,
       aiDiagnostics: analysisResult.aiSummary,
       keyMetrics: analysisResult.summary,
       extractedSignatures: analysisResult.clusters // Including signatures for security teams
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LogPulse_Intelligence_Report_${analysisResult.fileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Intelligence Report Exported!");
  };

  // Filtered clusters logic
  const displayedClusters = analysisResult?.clusters?.filter(c => 
    c.pattern.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.severity.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-slate-200 font-sans selection:bg-brand-500/30">
      <Toaster position="bottom-right" />
      
      <Sidebar 
        onSelectSession={handleFetchSession} 
        activeSessionId={analysisResult?._id}
        activeView={activeView}
        onNavigate={setActiveView}
      />
      
      <main className="flex-1 overflow-y-auto w-full relative pb-20">
        <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 p-5 px-10 flex justify-between items-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4">
            <div className="bg-brand-500/20 p-2.5 rounded-xl border border-brand-500/30">
              <Activity className="w-7 h-7 text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">LogPulse Engine</h1>
              <p className="text-sm text-zinc-400 font-bold tracking-widest uppercase mt-0.5">MySQL Persistent Edition</p>
            </div>
          </div>
          
          {activeView === 'dashboard' && analysisResult && (
            <div className="flex p-1 bg-zinc-900/80 rounded-xl border border-zinc-800/50">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'deepdive', label: 'Deep Dive', icon: SearchCode },
                { id: 'intelligence', label: 'Intelligence', icon: BrainCircuit }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${isActive ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'}`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : ''}`} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <Database className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-zinc-300">Port 27017</span>
             </div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          
          {activeView === 'upload' && (
            <div className="min-h-[70vh] flex flex-col justify-center items-center">
              <div className="text-center mb-12 max-w-3xl mx-auto space-y-4">
                <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 tracking-tight leading-tight">
                  <Database className="w-12 h-12 inline relative -top-2 text-brand-500 mr-4" />
                  MERN Native Logging.
                </h2>
                <p className="text-xl text-zinc-400 font-medium">
                  Upload raw logs to instantly parse, aggregate, and persist structural data straight into MySQL for historic analysis.
                </p>
              </div>
              <UploadZone onUpload={handleFileUpload} isProcessing={isProcessing} />
              {error && (
                <div className="mt-10 p-5 border-l-4 border-red-500 bg-red-500/10 rounded-xl text-red-200 flex items-center gap-4 animate-in slide-in-from-bottom-4">
                  <div className="bg-red-500/20 p-3 rounded-full"><Database className="w-6 h-6 text-red-500" /></div>
                  <div>
                    <h4 className="font-bold text-lg">System Failure</h4>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'dashboard' && analysisResult && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                    {analysisResult.fileName}
                  </h2>
                  <p className="text-zinc-400 font-mono text-sm">
                    Analyzed on {new Date(analysisResult.uploadDate).toLocaleString()} (Document ID: {analysisResult._id})
                  </p>
                </div>
              </div>

              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="grid grid-cols-4 gap-6">
                    <div className="glass-card p-6 border-t-2 border-t-zinc-600/50">
                      <div className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">Logs Digested</div>
                      <div className="text-4xl font-black text-white">{analysisResult.summary.totalLogs.toLocaleString()}</div>
                    </div>
                    <div className="glass-card p-6 border-t-2 border-t-red-500/80 bg-red-500/5">
                      <div className="text-red-400 text-sm font-bold uppercase tracking-widest mb-2">Errors</div>
                      <div className="text-4xl font-black text-red-400">{analysisResult.summary.errorCount.toLocaleString()}</div>
                    </div>
                    <div className="glass-card p-6 border-t-2 border-t-amber-500/80 bg-amber-500/5">
                      <div className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-2">Warnings</div>
                      <div className="text-4xl font-black text-amber-500">{analysisResult.summary.warnCount.toLocaleString()}</div>
                    </div>
                    <div className="glass-card p-6 border-t-2 border-t-indigo-500/80 bg-brand-500/5">
                      <div className="text-brand-400 text-sm font-bold uppercase tracking-widest mb-2">Unstructured</div>
                      <div className="text-4xl font-black text-brand-400">{analysisResult.summary.unstructuredCount?.toLocaleString() || 0}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                     <div className="xl:col-span-1 glass-panel p-8 flex flex-col items-center justify-center">
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-widest self-start">Severity Split</h3>
                        <div className="h-64 w-full">
                           <SeverityChart summary={analysisResult.summary} />
                        </div>
                     </div>
                     <div className="xl:col-span-3 glass-panel p-8">
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-widest border-b border-zinc-800 pb-4">Log Density Timeline</h3>
                        <div className="h-80"><TimelineChart timelineData={analysisResult.timeline} /></div>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'deepdive' && (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  <div className="glass-panel overflow-hidden">
                    <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/80 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white tracking-wide">Extracted Signatures (Smart Clusters)</h3>
                      <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-700 w-72">
                         <Search className="w-5 h-5 text-zinc-500" />
                         <input 
                           type="text" 
                           placeholder="Filter signatures or severities..."
                           className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-zinc-600 font-mono"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                         />
                      </div>
                    </div>
                    {analysisResult.clusters.length === 0 ? (
                       <div className="p-10 text-center text-zinc-400">
                          <SearchCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="font-bold text-lg">No anomalies tracked in MySQL.</p>
                       </div>
                    ) : (
                      <div className="divide-y divide-zinc-800/80 p-2">
                        {displayedClusters.map((cluster) => (
                          <div key={cluster.id} className="p-5 hover:bg-zinc-800/60 rounded-xl transition-colors flex items-center gap-6">
                            <div className={`p-3 rounded-full ${cluster.severity === 'ERROR' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'}`}>
                                <SearchCode className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-base font-mono font-medium text-zinc-100 mb-2 truncate bg-zinc-950 p-2 rounded-lg border border-zinc-800 shadow-inner">
                                 {cluster.pattern}
                              </p>
                              <p className="text-xs font-bold text-zinc-400 tracking-wider">
                                LATEST: <span className="text-zinc-200">{cluster.latestTimestamp || 'N/A'}</span>
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className="inline-flex items-center px-5 py-3 rounded-xl text-2xl font-black bg-zinc-950 text-white border border-zinc-700 shadow-2xl">
                                {cluster.count} <span className="ml-1 text-xs font-bold text-brand-500 tracking-widest">HITS</span>
                              </span>
                            </div>
                          </div>
                        ))}
                        {displayedClusters.length === 0 && (
                          <div className="p-8 text-center text-zinc-500 font-bold">
                             No signatures matched your filter criteria.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'intelligence' && (
                <div className="animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto">
                   <div className="p-8 glass-panel bg-gradient-to-b from-zinc-900 to-indigo-950/20">
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800/80">
                        <div className="flex items-center gap-4">
                           <div className="p-4 bg-brand-500/20 rounded-2xl border border-brand-500/50">
                              <BrainCircuit className="w-8 h-8 text-brand-400" />
                           </div>
                           <div>
                              <h2 className="text-2xl font-black text-white">AI Diagnostics</h2>
                              <p className="text-zinc-400 font-medium">Heuristic evaluation based on cluster density arrays.</p>
                           </div>
                        </div>
                        <button onClick={handleExportJSON} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl border border-zinc-600 transition font-bold shadow-lg">
                           <Download className="w-4 h-4" /> Export JSON
                        </button>
                     </div>
                     <AnalysisPanel aiSummary={analysisResult.aiSummary} />
                   </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'history' && (
             <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-6xl mx-auto">
               <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800">
                 <div className="space-y-1">
                   <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                     <Database className="w-8 h-8 text-brand-500" /> MySQL History
                   </h2>
                   <p className="text-zinc-400 font-medium text-sm">
                     A permanent registry of all logs ever processed.
                   </p>
                 </div>
               </div>

               <div className="glass-panel overflow-hidden">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-zinc-900/80 border-b border-zinc-800">
                       <th className="p-5 text-sm font-black text-zinc-400 uppercase tracking-widest">Target Log</th>
                       <th className="p-5 text-sm font-black text-zinc-400 uppercase tracking-widest">Upload Date</th>
                       <th className="p-5 text-sm font-black text-zinc-400 uppercase tracking-widest">Total Rows</th>
                       <th className="p-5 text-sm font-black text-zinc-400 uppercase tracking-widest">Root Cause</th>
                       <th className="p-5 text-right font-black text-zinc-400 uppercase tracking-widest">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-800/50">
                     {historyData.map(item => (
                       <tr key={item._id} className="hover:bg-zinc-800/30 transition border-zinc-800/40">
                         <td className="p-5">
                            <div className="flex items-center gap-3">
                               <div className="bg-brand-500/20 p-2 rounded-lg"><HardDrive className="w-5 h-5 text-brand-400"/></div>
                               <span className="font-bold text-white">{item.fileName}</span>
                            </div>
                         </td>
                         <td className="p-5 font-mono text-sm text-zinc-400">{new Date(item.uploadDate).toLocaleString()}</td>
                         <td className="p-5 font-black text-zinc-300">{item.stats?.totalLogs?.toLocaleString() || 0}</td>
                         <td className="p-5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${item.aiSummary?.rootCause === 'No Critical Issues Detected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                               {item.aiSummary?.rootCause || 'Unstructured Data Anomaly'}
                            </span>
                         </td>
                         <td className="p-5 text-right">
                           <div className="flex items-center justify-end gap-3">
                              <button onClick={() => handleFetchSession(item._id)} className="px-5 py-2 bg-brand-500 hover:bg-brand-400 text-white text-sm font-bold rounded-lg shadow-lg shadow-brand-500/20 transition hover:-translate-y-0.5">
                                Load View
                              </button>
                              <button onClick={(e) => handleDeleteIndividualRow(item._id, e)} className="p-2.5 text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-400 transition rounded-lg border border-red-500/20">
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                     {historyData.length === 0 && (
                       <tr><td colSpan="5" className="p-10 text-center text-zinc-500 font-medium">No history found in database.</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {activeView === 'settings' && (
             <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-4xl mx-auto">
               <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800">
                 <div className="space-y-1">
                   <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                     <SettingsIcon className="w-8 h-8 text-zinc-400" /> Platform Settings
                   </h2>
                   <p className="text-zinc-400 font-medium text-sm">
                     Manage your persistence cluster and API hooks.
                   </p>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="glass-panel p-8 border-l-4 border-l-red-500 hover:border-l-red-400 transition-colors">
                    <div className="flex justify-between items-start">
                       <div>
                          <h3 className="text-xl font-bold text-white mb-2">Wipe Database Memory</h3>
                          <p className="text-zinc-400 max-w-xl">
                            Permanently delete all historical logs, diagnostic artifacts, and statistical data stored in the MySQL Database. This action is irreversible.
                          </p>
                       </div>
                       <button onClick={handleWipeDatabase} className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-black rounded-lg shadow-lg shadow-red-500/20 transition hover:-translate-y-0.5">
                          <Trash2 className="w-5 h-5" /> Obliterate History
                       </button>
                    </div>
                 </div>

                 <div className="glass-panel p-8">
                    <div className="flex justify-between items-start">
                       <div>
                          <h3 className="text-xl font-bold text-white mb-2">Enable Data Compression (Pro)</h3>
                          <p className="text-zinc-400 max-w-xl">
                            Automatically compress all unhashed `.log` strings into zip artifacts before committing to Sequelize to save storage capacity.
                          </p>
                       </div>
                       <button 
                         onClick={() => {
                            setProEnabled(!proEnabled);
                            toast.success(`Data Compression ${!proEnabled ? 'Enabled' : 'Disabled'}`);
                         }}
                         className={`relative w-16 h-8 rounded-full transition-colors duration-300 border ${proEnabled ? 'bg-brand-500 border-brand-400' : 'bg-zinc-800 border-zinc-700'}`}
                       >
                         <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${proEnabled ? 'translate-x-8' : ''}`}></div>
                       </button>
                    </div>
                 </div>
               </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
