import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { Activity, LayoutDashboard, BrainCircuit, SearchCode, Database, Settings as SettingsIcon, Trash2, HardDrive, Download, Search, Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import UploadZone from './components/UploadZone';
import TimelineChart from './components/TimelineChart';
import SeverityChart from './components/SeverityChart';
import AnalysisPanel from './components/AnalysisPanel';
import Login from './components/Login';
import Home from './components/Home';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [isLanding, setIsLanding] = useState(true);
  
  // High-level navigation view
  const [activeView, setActiveView] = useState('upload'); // 'upload', 'dashboard', 'history', 'settings'
  
  // Dashboard sub-tabs
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'deepdive', 'intelligence'
  const [dbStatus, setDbStatus] = useState('Idle');
  
  const [historyData, setHistoryData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClusterId, setExpandedClusterId] = useState(null);

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
    const token = localStorage.getItem('logpulse_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'history') {
      loadHistoryView();
    }
  }, [activeView]);

  const handleLogout = () => {
    localStorage.removeItem('logpulse_token');
    localStorage.removeItem('logpulse_user');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setAnalysisResult(null);
    setHistoryData([]);
    setActiveView('upload');
    toast.success('Session Terminated');
  };

  const handleFileUpload = async (payload, type = 'file') => {
    setIsProcessing(true);
    setError(null);
    setAnalysisResult(null);
    setDbStatus('Uploading to MySQL...');
    
    if (!isAuthenticated) {
      setPendingUpload({ payload, type });
      setShowLogin(true);
      toast.error("Login required to process logs", {
        icon: '🔒',
        onClose: () => setIsProcessing(false)
      });
      setIsProcessing(false);
      return;
    }

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

  // Root render logic: ALWAYS show Home first on fresh load
  if (isLanding && !isAuthenticated && !showLogin) {
    return (
      <>
        <Toaster position="bottom-right" />
        <Home 
          onGetStarted={() => setShowLogin(true)} 
          onLoginClick={() => setShowLogin(true)} 
          onUpload={handleFileUpload}
          isProcessing={isProcessing}
        />
      </>
    );
  }

  if (isLanding && isAuthenticated) {
    return (
      <>
        <Toaster position="bottom-right" />
        <Home 
          onGetStarted={() => {
            setIsLanding(false);
            setActiveView('upload');
          }} 
          onLoginClick={() => {
            setIsLanding(false);
            setActiveView('upload');
          }} 
          onUpload={(payload, type) => {
            setIsLanding(false);
            handleFileUpload(payload, type);
          }}
          isProcessing={isProcessing}
        />
      </>
    );
  }

  if (!isAuthenticated && showLogin) {
    return (
      <div className="relative min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <Toaster position="bottom-right" />
        <div className="absolute top-6 right-6 z-50">
           <button 
             onClick={() => setShowLogin(false)}
             className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-full border border-zinc-800 transition shadow-2xl"
           >
              <X className="w-6 h-6" />
           </button>
        </div>
        <Login onLogin={(token) => {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setIsAuthenticated(true);
          setShowLogin(false);
          setIsLanding(false);
          
          if (pendingUpload) {
            handleFileUpload(pendingUpload.payload, pendingUpload.type);
            setPendingUpload(null);
          } else {
            setActiveView('upload');
          }
        }} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-slate-200 font-sans selection:bg-brand-500/30">
      <Toaster position="bottom-right" />
      
      <Sidebar 
        onSelectSession={handleFetchSession} 
        activeSessionId={analysisResult?._id}
        activeView={activeView}
        onNavigate={setActiveView}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <main className="flex-1 overflow-y-auto w-full relative pb-20">
        <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 p-4 md:p-5 md:px-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="w-full md:w-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-4 truncate">
              <button 
                onClick={() => setIsMobileMenuOpen(true)} 
                className="lg:hidden p-1.5 text-zinc-400 hover:text-white bg-zinc-900 rounded-lg border border-zinc-800 transition shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="bg-brand-500/20 p-1.5 md:p-2.5 rounded-xl border border-brand-500/30 shrink-0">
                <Activity className="w-5 h-5 md:w-7 md:h-7 text-brand-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-black text-white tracking-tight truncate">LogPulse Engine</h1>
                <p className="text-[10px] md:text-sm text-zinc-400 font-bold tracking-widest uppercase mt-0.5 truncate">MySQL EDITION</p>
              </div>
            </div>
          </div>
          
          {activeView === 'dashboard' && analysisResult && (
            <div className="flex w-full lg:w-auto overflow-x-auto p-1 bg-zinc-900/80 rounded-xl border border-zinc-800/50 custom-scrollbar mb-1 lg:mb-0 no-scrollbar select-none">
              {[
                { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                { id: 'deepdive', label: 'Dive', icon: SearchCode },
                { id: 'intelligence', label: 'AI', icon: BrainCircuit }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-6 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-all duration-300 ${isActive ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'}`}
                  >
                    <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-brand-400' : ''}`} />
                    <span className="md:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="hidden sm:flex items-center gap-3">
             <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <span className="text-[11px] font-black text-zinc-300 tracking-wider uppercase">SQL Cluster</span>
             </div>
             
             <button 
               onClick={handleLogout}
               className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all shadow-lg hover:shadow-red-500/10"
               title="Logout"
             >
                <Database className="w-4 h-4 rotate-180" />
             </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8">
          
          {activeView === 'upload' && (
            <div className="min-h-[50vh] lg:min-h-[70vh] flex flex-col justify-center items-center px-4">
              <div className="text-center mb-8 lg:mb-12 max-w-3xl mx-auto space-y-3 md:space-y-4">
                <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 tracking-tight leading-tight">
                  <Database className="w-8 h-8 md:w-12 md:h-12 inline relative -top-1 md:-top-2 text-brand-500 mr-2 md:mr-4" />
                  MERN Native Logging.
                </h2>
                <p className="text-base md:text-xl text-zinc-400 font-medium px-4">
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
              <div className="flex flex-col sm:flex-row items-center justify-between mb-6 md:mb-8 pb-4 md:pb-6 border-b border-zinc-800 gap-4">
                <div className="space-y-1 w-full min-w-0 text-center sm:text-left">
                  <h2 className="text-xl md:text-3xl font-black tracking-tight text-white flex items-center justify-center sm:justify-start gap-3 truncate">
                    {analysisResult.fileName}
                  </h2>
                  <p className="text-zinc-500 font-mono text-[10px] md:text-sm truncate">
                    Analyzed on {new Date(analysisResult.uploadDate).toLocaleString()} <span className="hidden lg:inline">(Document ID: {analysisResult._id})</span>
                  </p>
                </div>
              </div>

              {activeTab === 'dashboard' && (
                <div className="space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    <div className="glass-card p-4 md:p-6 border-t-2 border-t-zinc-600/50">
                      <div className="text-zinc-400 text-[10px] md:text-sm font-bold uppercase tracking-widest mb-1 md:mb-2 truncate">Logs Digested</div>
                      <div className="text-2xl md:text-4xl font-black text-white">{analysisResult.summary.totalLogs.toLocaleString()}</div>
                    </div>
                    <div className="glass-card p-4 md:p-6 border-t-2 border-t-red-500/80 bg-red-500/5 hover:bg-red-500/10 transition-all cursor-default group">
                      <div className="text-red-400/80 text-[10px] md:text-sm font-bold uppercase tracking-widest mb-1 md:mb-2 truncate group-hover:text-red-400 transition-colors">Detected Errors</div>
                      <div className="text-2xl md:text-4xl font-black text-red-500 group-hover:scale-105 transition-transform origin-left">{analysisResult.summary.errorCount.toLocaleString()}</div>
                    </div>
                    <div className="glass-card p-4 md:p-6 border-t-2 border-t-amber-500/80 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-default group">
                      <div className="text-amber-400/80 text-[10px] md:text-sm font-bold uppercase tracking-widest mb-1 md:mb-2 truncate group-hover:text-amber-400 transition-colors">Warnings</div>
                      <div className="text-2xl md:text-4xl font-black text-amber-500 group-hover:scale-105 transition-transform origin-left">{analysisResult.summary.warnCount.toLocaleString()}</div>
                    </div>
                    <div className="glass-card p-4 md:p-6 border-t-2 border-t-indigo-500/80 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all cursor-default group">
                      <div className="text-indigo-400/80 text-[10px] md:text-sm font-bold uppercase tracking-widest mb-1 md:mb-2 truncate group-hover:text-indigo-400 transition-colors">Unstructured logs</div>
                      <div className="text-2xl md:text-4xl font-black text-indigo-400 group-hover:scale-105 transition-transform origin-left">{analysisResult.summary.unstructuredCount?.toLocaleString() || 0}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-8">
                     <div className="xl:col-span-1 glass-panel p-6 md:p-8 flex flex-col items-center justify-center">
                        <h3 className="text-sm md:text-lg font-bold text-white mb-4 md:mb-6 uppercase tracking-widest self-start">Severity Split</h3>
                        <div className="h-48 md:h-64 w-full">
                           <SeverityChart summary={analysisResult.summary} />
                        </div>
                     </div>
                     <div className="xl:col-span-3 glass-panel p-6 md:p-8">
                        <h3 className="text-sm md:text-lg font-bold text-white mb-4 md:mb-6 uppercase tracking-widest border-b border-zinc-800 pb-4">Log Density Timeline</h3>
                        <div className="h-64 md:h-80"><TimelineChart timelineData={analysisResult.timeline} /></div>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'deepdive' && (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  <div className="glass-panel overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-zinc-800/80 bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">Extracted Signatures</h3>
                      <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2.5 rounded-lg border border-zinc-800 w-full sm:w-72">
                         <Search className="w-4 h-4 text-zinc-500" />
                         <input 
                           type="text" 
                           placeholder="Filter signatures..."
                           className="bg-transparent border-none outline-none text-white text-xs md:text-sm w-full placeholder:text-zinc-700 font-mono"
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
                        {displayedClusters.map((cluster, idx) => (
                          <div key={idx} className="border-b border-zinc-800/40 last:border-0">
                            <div 
                              onClick={() => setExpandedClusterId(expandedClusterId === idx ? null : idx)}
                              className="p-5 hover:bg-zinc-800/60 transition-colors flex items-center gap-6 cursor-pointer group"
                            >
                              <div className={`p-3 rounded-full transition-colors ${cluster.severity === 'ERROR' ? 'bg-red-500/10 text-red-500 border border-red-500/20 group-hover:bg-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:bg-amber-500/20'}`}>
                                  <SearchCode className="w-5 h-5" />
                              </div>
                               <div className="flex-1 min-w-0 pr-2">
                                <p className="text-[10px] md:text-base font-mono font-medium text-zinc-100 mb-1.5 truncate bg-zinc-950 p-2 rounded-lg border border-zinc-800 shadow-inner group-hover:border-zinc-700 transition-colors">
                                   {cluster.pattern}
                                </p>
                                <p className="text-[9px] md:text-xs font-bold text-zinc-500 tracking-wider">
                                  LATEST: <span className="text-zinc-300">{cluster.latestTimestamp || 'N/A'}</span>
                                </p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span className="inline-flex items-center px-3 md:px-5 py-2 md:py-3 rounded-xl text-lg md:text-2xl font-black bg-zinc-950 text-white border border-zinc-700 shadow-2xl group-hover:border-brand-500/30 transition-colors">
                                  {cluster.count}<span className="ml-1 text-[8px] md:text-xs font-bold text-brand-500 tracking-widest uppercase hidden md:inline">Hits</span>
                                </span>
                              </div>
                            </div>
                            
                            {/* Expandable Samples Section */}
                            {expandedClusterId === idx && cluster.samples && (
                              <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
                                <div className="bg-zinc-950/80 rounded-xl border border-zinc-800 p-4 space-y-3">
                                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 px-1">Raw Evidence Samples</h4>
                                  <div className="space-y-2">
                                    {cluster.samples.map((sample, sIdx) => (
                                      <div key={sIdx} className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50 text-[11px] font-mono text-zinc-300 break-all leading-relaxed relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800"></div>
                                        {sample}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
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
                   <div className="p-5 md:p-8 glass-panel bg-gradient-to-b from-zinc-900 to-indigo-950/20">
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-zinc-800/80">
                        <div className="flex items-center gap-3 md:gap-4 text-left">
                           <div className="p-3 md:p-4 bg-brand-500/20 rounded-2xl border border-brand-500/50 shrink-0">
                              <BrainCircuit className="w-6 h-6 md:w-8 md:h-8 text-brand-400" />
                           </div>
                           <div>
                              <h2 className="text-xl md:text-2xl font-black text-white">AI Diagnostics</h2>
                              <p className="text-xs md:text-sm text-zinc-500 font-medium">Heuristic evaluation based on cluster patterns.</p>
                           </div>
                        </div>
                        <button onClick={handleExportJSON} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl border border-zinc-600 transition font-bold shadow-lg text-sm">
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
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b border-zinc-800 gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center justify-center sm:justify-start gap-3">
                      <Database className="w-6 h-6 md:w-8 md:h-8 text-brand-500" /> MySQL History
                    </h2>
                    <p className="text-zinc-500 font-medium text-xs md:text-sm">
                      A permanent registry of all logs ever processed by your account.
                    </p>
                  </div>
                </div>

               <div className="glass-panel overflow-hidden">
                 {/* Desktop Table View */}
                 <div className="hidden md:block overflow-x-auto custom-scrollbar">
                   <table className="w-full text-left border-collapse min-w-[800px]">
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

                 {/* Mobile Cards View */}
                 <div className="md:hidden flex flex-col divide-y divide-zinc-800/50">
                   {historyData.map(item => (
                     <div key={item._id} className="p-5 space-y-4 hover:bg-zinc-800/30 transition">
                       <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                         <div className="flex items-center gap-3">
                            <div className="bg-brand-500/20 p-2 rounded-lg"><HardDrive className="w-5 h-5 text-brand-400"/></div>
                            <span className="font-bold text-white tracking-wide truncate max-w-[140px]">{item.fileName}</span>
                         </div>
                         <span className="font-mono text-[10px] text-zinc-500">{new Date(item.uploadDate).toLocaleDateString()}</span>
                       </div>
                       
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Total Rows</span>
                          <span className="font-black text-zinc-300">{item.stats?.totalLogs?.toLocaleString() || 0}</span>
                       </div>

                       <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Root Cause</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${item.aiSummary?.rootCause === 'No Critical Issues Detected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'} max-w-[140px] truncate`}>
                            {item.aiSummary?.rootCause || 'Unstructured Data Anomaly'}
                          </span>
                       </div>

                       <div className="pt-2 flex items-center justify-between gap-3">
                          <button onClick={(e) => handleDeleteIndividualRow(item._id, e)} className="p-2.5 text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-400 transition rounded-lg border border-red-500/20">
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleFetchSession(item._id)} className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-sm font-bold rounded-lg transition text-center shadow-lg shadow-brand-500/20">
                            Load View
                          </button>
                       </div>
                     </div>
                   ))}
                   {historyData.length === 0 && (
                     <div className="p-10 text-center text-zinc-500 font-medium">No history found in database.</div>
                   )}
                 </div>
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
                 <div className="glass-panel p-6 md:p-8 border-l-4 border-l-zinc-500 hover:border-l-zinc-400 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 text-center sm:text-left">
                       <div>
                          <h3 className="text-lg md:text-xl font-bold text-white mb-2">Terminate Operator Session</h3>
                          <p className="text-zinc-500 text-xs md:text-sm max-w-xl">
                            Sign out securely and revoke the current device token.
                          </p>
                       </div>
                       <button onClick={handleLogout} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-lg shadow-lg shadow-zinc-900/20 transition hover:-translate-y-0.5 border border-zinc-700 text-sm">
                          <Activity className="w-5 h-5" /> Logout
                       </button>
                    </div>
                 </div>

                 <div className="glass-panel p-6 md:p-8 border-l-4 border-l-red-500 hover:border-l-red-400 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 text-center sm:text-left">
                       <div>
                          <h3 className="text-lg md:text-xl font-bold text-white mb-2">Wipe Database Memory</h3>
                          <p className="text-zinc-500 text-xs md:text-sm max-w-xl">
                            Permanently delete all historical logs owned by you.
                          </p>
                       </div>
                       <button onClick={handleWipeDatabase} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-black rounded-lg shadow-lg shadow-red-500/20 transition hover:-translate-y-0.5 text-sm">
                          <Trash2 className="w-5 h-5" /> Obliterate History
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
