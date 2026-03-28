import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, HardDrive, Inbox, Settings, Loader2, Database, Home } from 'lucide-react';

export default function Sidebar({ onSelectSession, activeSessionId, activeView, onNavigate, isOpen, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await axios.get(`${API_URL}/api/logs`);
      if (!Array.isArray(res.data)) throw new Error("Invalid API response format");
      setSessions(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch sessions from MySQL", err);
      setError("Database Offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // In a real app we might set up a socket or polling here if it constantly updates
  }, []);

  // Expose a refresh method to the parent via a custom event or callback 
  // (for simplicity, we'll just re-fetch every time Sidebar mounts, or we can use a React Context)
  // To handle the new upload trigger, we'll listen for a custom window event
  useEffect(() => {
    const handleNewUpload = () => fetchSessions();
    window.addEventListener('logpulse-refresh-sidebar', handleNewUpload);
    return () => window.removeEventListener('logpulse-refresh-sidebar', handleNewUpload);
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}
      
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col pt-4 lg:pt-6 shrink-0 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-[20px_0_60px_rgba(0,0,0,0.8)]' : '-translate-x-full'}`}
      >
      
      <div className="px-6 pb-4 border-b border-zinc-800/50 mt-4 mb-4">
        <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Workspace Control</h2>
        <nav className="space-y-1.5">
          <button 
            onClick={() => { onNavigate('home'); onClose?.(); }}
            className={`w-full flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg transition-all ${activeView === 'home' ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}>
            <Home className="w-5 h-5 text-brand-400" />
            <span className="font-bold text-sm">Home</span>
          </button>
          <button 
            onClick={() => { onNavigate('upload'); onClose?.(); }}
            className={`w-full flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg transition-all ${activeView === 'upload' || activeView === 'dashboard' ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}>
            <Inbox className="w-5 h-5 text-brand-400" />
            <span className="font-bold text-sm">New Analysis</span>
          </button>
          <button 
            onClick={() => { onNavigate('history'); onClose?.(); }}
            className={`w-full flex items-center justify-start gap-3 px-3 py-3 lg:py-2.5 rounded-lg transition-all ${activeView === 'history' ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}>
            <Database className="w-5 h-5 text-brand-400" />
            <span className="font-bold text-sm">MySQL History</span>
          </button>
          <button 
            onClick={() => { onNavigate('settings'); onClose?.(); }}
            className={`w-full justify-start flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg transition-all ${activeView === 'settings' ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}>
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm text-left">Settings</span>
          </button>
        </nav>
      </div>

      <div className="px-6 pt-2 mt-2 flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Previous Artifacts</h2>
          <button onClick={fetchSessions} className="text-zinc-600 hover:text-brand-400 transition-colors">
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20 text-center">
            {error}. Check MySQL connection.
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-xs text-zinc-500 text-center py-4">No MySQL records found.</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((item) => {
              const isActive = activeSessionId === item._id;
              
              // Light logic to color-code status based on errors
              let statusText = "Stable";
              let statusStyle = "bg-zinc-800 text-zinc-400";
              const errors = item.stats?.errorCount || 0;
              
              if (item.aiSummary?.rootCause && item.aiSummary.rootCause !== "No Critical Issues Detected") {
                 statusText = "Critical";
                 statusStyle = "bg-red-500/10 text-red-500 border border-red-500/20";
              } else if (errors > 0) {
                 statusText = "Warning";
                 statusStyle = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
              }

              return (
                <div 
                  key={item._id} 
                  onClick={() => {
                     onSelectSession(item._id);
                     onNavigate('dashboard');
                     onClose?.();
                  }}
                  className={`group cursor-pointer p-2.5 -mx-2.5 rounded-lg transition-all duration-200 ${(activeSessionId === item._id && activeView === 'dashboard') ? 'bg-brand-500/10 border border-brand-500/30' : 'hover:bg-zinc-800/50'}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <HardDrive className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-zinc-500 group-hover:text-brand-400'}`} />
                    <span className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                      {item.fileName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {new Date(item.uploadDate).toLocaleDateString()}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${statusStyle}`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <span className="text-xs font-bold text-zinc-300 tracking-wide">MySQL Connected</span>
        </div>
      </div>
    </aside>
    </>
  );
}
