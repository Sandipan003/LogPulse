import { useState } from 'react';
import { Rocket, ShieldCheck, Zap, BarChart3, ArrowRight, Layers, Database, Activity, SearchCode, Inbox, BrainCircuit } from 'lucide-react';
import UploadZone from './UploadZone';

export default function Home({ onGetStarted, onLoginClick, onUpload, isProcessing }) {
  const [heroMode, setHeroMode] = useState('visual'); // 'visual' or 'upload'
  return (
    <div className="h-screen w-full bg-[#121416] text-white selection:bg-brand-500/30 overflow-hidden font-sans flex flex-col">
      {/* Navigation Bar */}
      <nav className="shrink-0 bg-[#121416]/80 backdrop-blur-md border-b border-zinc-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-brand-400 font-black" />
            <span className="text-xl font-black uppercase tracking-tighter">LogPulse</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {/* Navigation links removed as per request */}
          </div>

          <div className="flex items-center gap-4">
             <button onClick={onLoginClick} className="text-zinc-400 hover:text-white transition-colors">
                <SearchCode className="w-5 h-5" />
             </button>
             <button 
               onClick={onGetStarted}
               className="px-5 py-2 bg-brand-500 hover:bg-brand-400 text-black font-black text-xs uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all hover:scale-105"
             >
               Launch Engine
             </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Viewport Optimized */}
      <section className="relative flex-1 px-6 max-w-7xl mx-auto w-full flex items-center overflow-hidden">
        {/* Glows */}
        <div className="absolute top-1/4 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-brand-500/5 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-emerald-500/5 rounded-full blur-[100px]"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center justify-center relative z-10 w-full h-full pt-4 md:pt-0">
          <div className="space-y-4 md:space-y-8 animate-in slide-in-from-left-8 duration-1000 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest leading-none">
               <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span> NEXT-GEN SRE ENGINE
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black leading-[0.9] tracking-tighter">
              Don't Read Logs. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">Fix Them.</span>
            </h1>
            
            <p className="text-xs md:text-lg text-zinc-400 max-w-md md:max-w-lg font-medium leading-relaxed px-4 lg:px-0">
              Stop scrolling through millions of lines. Drop your logs, get a 3-second diagnosis, and receive an instant bash fix script. Built for high-velocity SREs.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 md:pt-4 w-full sm:w-auto px-6 sm:px-0">
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-3 md:py-4 bg-brand-500 hover:bg-brand-400 text-black font-black rounded-xl shadow-[0_0_30px_rgba(0,242,255,0.3)] transition-all hover:scale-105 active:scale-95 text-sm md:text-base"
              >
                Launch Engine
              </button>
              <button 
                onClick={() => {
                  const section = document.getElementById('precision-section');
                  if (section) section.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-3 md:py-4 bg-zinc-800/50 hover:bg-zinc-800 text-white font-bold rounded-xl border border-zinc-700 transition-all text-sm md:text-base"
              >
                View Features
              </button>
            </div>
          </div>

          <div className="relative animate-in slide-in-from-right-8 duration-1000 flex items-center justify-center h-full min-h-0 py-4 lg:py-0">
            {heroMode === 'visual' ? (
              /* Kinetic Data Prism - Advanced 3D Component */
              <div className="relative w-full aspect-square max-w-[260px] sm:max-w-md lg:max-w-lg mx-auto overflow-visible [perspective:1200px] group scale-[0.85] sm:scale-100">
                 {/* Radial Underglow */}
                 <div className="absolute inset-x-10 inset-y-10 bg-brand-500/10 rounded-full blur-[80px] animate-pulse"></div>
                 
                 {/* Back Holographic Panel */}
                 <div className="absolute top-10 left-10 right-10 bottom-10 bg-zinc-800/20 border border-zinc-700/30 rounded-3xl [transform:translateZ(-100px)_rotateX(5deg)] skew-y-6 rotate-3 backdrop-blur-sm"></div>
                 
                 {/* Floating Data Nodes (Decorative) */}
                 <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center animate-bounce duration-[3000ms] [transform:translateZ(50px)]">
                    <Activity className="w-8 h-8 text-brand-400 opacity-50" />
                 </div>
                 <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center animate-bounce duration-[4000ms] [transform:translateZ(80px)]">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 opacity-50" />
                 </div>

                 {/* The Interactive Core Card */}
                 <div 
                   onClick={onGetStarted}
                   className="absolute inset-0 bg-gradient-to-br from-zinc-800/90 via-zinc-900 to-black border border-zinc-700/80 rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden [transform:rotateX(2deg)_rotateY(-10deg)] group-hover:[transform:rotateX(0deg)_rotateY(0deg)] transition-all duration-700 cursor-pointer flex items-center justify-center z-20"
                 >
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20"></div>
                    
                    {/* Animated Data Core */}
                    <div className="relative p-12 text-center space-y-6">
                       <div className="relative w-28 h-28 mx-auto">
                          {/* Rotating Rings */}
                          <div className="absolute inset-0 border-2 border-brand-500/30 rounded-2xl animate-[spin_10s_linear_infinite]"></div>
                          <div className="absolute inset-2 border border-brand-500/20 rounded-2xl animate-[spin_7s_linear_infinite_reverse]"></div>
                          
                          <div className="absolute inset-0 bg-brand-500/20 rounded-2xl flex items-center justify-center border border-brand-500/30 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
                             <BarChart3 className="w-12 h-12 text-brand-400 animate-pulse" />
                          </div>
                       </div>
                       
                       <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-brand-400 tracking-[0.5em] animate-pulse">Live Data Core</p>
                          <h3 className="text-xl font-black text-white px-4">CLICK TO INGEST LOGS</h3>
                       </div>
                    </div>
                    
                    {/* Glass Shine */}
                    <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    {/* Meta Info Overlays */}
                    <div className="absolute top-8 right-8 px-3 py-1.5 bg-brand-500/20 border border-brand-500/40 rounded-full text-[10px] font-black text-brand-400 flex items-center gap-2 [transform:translateZ(120px)]">
                       <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-ping"></div> SRE ACTIVE
                    </div>
                    <div className="absolute bottom-8 left-8 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-[10px] font-black text-zinc-400 flex items-center gap-2 [transform:translateZ(80px)]">
                       <Database className="w-3 h-3 text-brand-400" /> SQL REGISTRY
                    </div>
                 </div>
              </div>
            ) : (
              <div className="w-full animate-in zoom-in-95 duration-500">
                <div className="flex justify-end mb-4">
                  <button 
                    onClick={() => setHeroMode('visual')}
                    className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180" /> Back to Visual
                  </button>
                </div>
                <UploadZone onUpload={onUpload} isProcessing={isProcessing} />
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

