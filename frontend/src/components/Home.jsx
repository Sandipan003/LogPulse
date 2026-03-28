import { useState } from 'react';
import { Rocket, ShieldCheck, Zap, BarChart3, ArrowRight, Layers, Database, Activity, SearchCode, Inbox, BrainCircuit } from 'lucide-react';
import UploadZone from './UploadZone';

export default function Home({ onGetStarted, onLoginClick, onUpload, isProcessing }) {
  const [heroMode, setHeroMode] = useState('visual'); // 'visual' or 'upload'
  return (
    <div className="min-h-screen bg-[#121416] text-white selection:bg-brand-500/30 overflow-x-hidden font-sans">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#121416]/80 backdrop-blur-md border-b border-zinc-800/50 px-6 py-4">
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto overflow-hidden">
        {/* Glows */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 animate-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest">
               <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span> NEXT-GEN SRE ENGINE
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter">
              Log Analysis at the <span className="text-[#00f2ff]">Speed of Thought</span>
            </h1>
            
            <p className="text-zinc-400 text-lg md:text-xl max-w-lg leading-relaxed font-medium">
              Transform noisy logs into actionable SRE intelligence with Google Gemini 1.5 Flash. Predict failures before they cascade.
            </p>

            <div className="flex items-center gap-4">
              <button 
                onClick={onGetStarted}
                className="px-8 py-4 bg-[#00f2ff] hover:bg-[#74f5ff] text-black font-black rounded-xl shadow-[0_0_30px_rgba(0,242,255,0.2)] transition-all hover:-translate-y-1"
              >
                Launch Engine
              </button>
              <button 
                onClick={() => document.getElementById('precision-section').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-zinc-800/50 hover:bg-zinc-800 text-white font-bold rounded-xl border border-zinc-700 transition-all"
              >
                View Features
              </button>
            </div>
          </div>

          <div className="relative animate-in slide-in-from-right-8 duration-1000 min-h-[500px] flex items-center justify-center">
            {heroMode === 'visual' ? (
              /* Kinetic Data Prism - Advanced 3D Component */
              <div className="relative w-full aspect-square max-w-lg mx-auto overflow-visible [perspective:1200px] group">
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
                   onClick={() => setHeroMode('upload')}
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

      {/* Precision Monitoring Section */}
      <section id="precision-section" className="px-6 py-32 bg-[#1a1c1e] relative">
         <div className="max-w-7xl mx-auto space-y-16">
            <div className="space-y-4">
               <h2 className="text-4xl md:text-5xl font-black">Precision Monitoring</h2>
               <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Engineered for architecture-aware SRE workflows</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                  { title: "AI Diagnostics", desc: "Powered by Gemini, identifies absolute root causes and generates remediation.", icon: BrainCircuit, color: "text-brand-400", bg: "bg-brand-500/10" },
                  { title: "Multi-Format Ingestion", desc: "Native support for Nginx, Spring Boot, and JSON. No complex regex required.", icon: Inbox, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { title: "SQL Persistence", desc: "Every analysis is permanently registered for historical auditing and comparison.", icon: Database, color: "text-blue-400", bg: "bg-blue-500/10" },
                  { title: "Evidence Visualization", desc: "Interactive density charts specifically mapped for precise incident visibility.", icon: BarChart3, color: "text-indigo-400", bg: "bg-indigo-500/10" }
               ].map((f, i) => (
                  <div key={i} className="bg-[#121416] p-8 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all hover:-translate-y-2 group">
                     <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <f.icon className={`w-6 h-6 ${f.color}`} />
                     </div>
                     <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                     <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* The Kinetic Pipeline */}
      <section className="px-6 py-32 max-w-7xl mx-auto text-center space-y-24">
         <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">The Kinetic Pipeline</h2>
            <p className="text-zinc-500 text-sm font-medium">From raw data to remediation in three phases.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            <div className="hidden md:block absolute top-[44px] left-[20%] right-[20%] h-px bg-zinc-800"></div>
            
            <div className="flex flex-col items-center space-y-6">
               <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center shadow-2xl relative z-10">
                  <Inbox className="w-10 h-10 text-brand-400" />
               </div>
               <div>
                  <h4 className="text-xl font-bold mb-1">Drop</h4>
                  <p className="text-zinc-500 text-sm">Upload raw log files or pending analytics for instant processing.</p>
               </div>
            </div>

            <div className="flex flex-col items-center space-y-6">
               <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center shadow-2xl relative z-10">
                  <BrainCircuit className="w-10 h-10 text-emerald-400" />
               </div>
               <div>
                  <h4 className="text-xl font-bold mb-1">Cluster</h4>
                  <p className="text-zinc-500 text-sm">AI groups disparate failures into logical pattern-hushed SRE components.</p>
               </div>
            </div>

            <div className="flex flex-col items-center space-y-6">
               <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center shadow-2xl relative z-10">
                  <ShieldCheck className="w-10 h-10 text-blue-400" />
               </div>
               <div>
                  <h4 className="text-xl font-bold mb-1">Resolve</h4>
                  <p className="text-zinc-500 text-sm">Receive generated bash fix scripts and remediation steps immediately.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-32 bg-zinc-950/80 border-t border-zinc-900">
         <div className="max-w-4xl mx-auto text-center space-y-12">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-tight">Ready to reduce your <span className="text-brand-400">MTTD?</span></h2>
            <p className="text-zinc-400 text-lg opacity-80">Join high-velocity engineering teams using LogPulse to maintain zero-downtime environments.</p>
            <button 
              onClick={onGetStarted}
              className="px-12 py-5 bg-[#74f5ff] hover:bg-[#00f2ff] text-black font-black text-lg rounded-full shadow-[0_0_50px_rgba(0,242,255,0.3)] transition-all hover:scale-105 active:scale-95"
            >
               Get Started Now
            </button>
         </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-zinc-900">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2 grayscale group-hover:grayscale-0 transition-all">
               <Activity className="w-5 h-5 text-zinc-500" />
               <span className="text-zinc-500 font-black uppercase text-sm tracking-tighter">LogPulse</span>
            </div>
            
            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-600">
               <button className="hover:text-zinc-400">Privacy Policy</button>
               <button className="hover:text-zinc-400">Terms of Service</button>
               <button className="hover:text-zinc-400">API Status</button>
               <button className="hover:text-zinc-400">Twitter</button>
            </div>

            <p className="text-[10px] font-black text-zinc-700 tracking-widest uppercase">© 2026 LOGPULSE INC. ATHLETICS FOR DATA.</p>
         </div>
      </footer>
    </div>
  );
}
