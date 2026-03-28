import { Rocket, ShieldCheck, Zap, BarChart3, ArrowRight, Layers, Database, Activity } from 'lucide-react';

export default function Home({ onGetStarted }) {
  return (
    <div className="min-h-full overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,#00f2ff08,transparent_50%)]">
      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-24 md:pt-24 md:pb-32 text-center max-w-5xl mx-auto overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[120px] -translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[120px] translate-x-1/2 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-brand-400 text-[10px] font-black uppercase tracking-widest mb-6 animate-in slide-in-from-bottom-4">
            <Rocket className="w-3 h-3" /> System Version 2.0 Production
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.95] mb-8 animate-in fade-in zoom-in-95 duration-700">
            Log Analysis at the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">Speed of Thought</span>
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Transform high-velocity log streams into structured SRE intelligence. 
            Powered by Google Gemini 1.5 Flash for absolute root cause accuracy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-400 text-black font-black rounded-xl shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group"
            >
              Launch Engine <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-zinc-800/50 hover:bg-zinc-800 text-white font-bold rounded-xl border border-zinc-700 transition-all hover:bg-zinc-700/50 flex items-center justify-center gap-2">
              View Repository
            </button>
          </div>
        </div>

        {/* 3D-effect Card Preview */}
        <div className="mt-20 relative px-4 perspective-[1000px]">
          <div className="max-w-4xl mx-auto bg-zinc-900/50 rounded-2xl border border-zinc-800 p-2 shadow-2xl transition-all duration-1000 transform hover:scale-[1.02]">
            <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-zinc-800/50 group relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#00f2ff10,transparent_70%)] group-hover:opacity-100 opacity-0 transition-opacity"></div>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                        <BarChart3 className="w-8 h-8 text-brand-400 animate-pulse" />
                    </div>
                    <span className="text-zinc-600 font-black text-xs uppercase tracking-[0.3em]">Neural Interface Ready</span>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24 bg-zinc-950/50 relative border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Core SRE Suite</h2>
            <div className="w-20 h-1 bg-brand-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-8 text-left hover:border-brand-500/50 transition-colors group">
              <div className="w-12 h-12 bg-brand-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Rocket className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Diagnostics</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Integrated Gemini 1.5 Flash identifies root causes and generates remediation scripts in absolute real-time.
              </p>
            </div>

            <div className="glass-panel p-8 text-left hover:border-emerald-500/50 transition-colors group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Format Ingestion</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Native support for Nginx, Spring Boot, Syslogs, and JSON. No custom regex required.
              </p>
            </div>

            <div className="glass-panel p-8 text-left hover:border-brand-400/50 transition-colors group">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">MySQL Persistence</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Every analysis is permanently registered in the central MySQL hub for long-term historical auditing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <div className="glass-panel p-12 text-center rounded-[2rem]">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-12">The Kinetic Pipeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                {/* Connector Lines (Desktop) */}
                <div className="hidden md:block absolute top-[45px] left-[30%] right-[30%] h-px bg-zinc-800"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl">
                        <span className="text-brand-400 font-black">01</span>
                    </div>
                    <p className="text-white font-bold mb-2">Drop Logs</p>
                    <p className="text-zinc-500 text-xs">Ingest raw text or .log artifacts</p>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl">
                        <span className="text-emerald-400 font-black">02</span>
                    </div>
                    <p className="text-white font-bold mb-2">AI Clustering</p>
                    <p className="text-zinc-500 text-xs">Signatures are hashed and analyzed</p>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-brand-500 border border-brand-400 flex items-center justify-center mb-4 shadow-2xl">
                        <span className="text-black font-black">03</span>
                    </div>
                    <p className="text-white font-bold mb-2">Resolve</p>
                    <p className="text-zinc-500 text-xs">Execute auto-generated fix steps</p>
                </div>
            </div>
        </div>
      </section>

      <footer className="px-6 py-12 border-t border-zinc-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-brand-500" />
            <span className="text-white font-black uppercase tracking-tighter text-xl">LogPulse</span>
        </div>
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">© 2026 High-Velocity Analytics Corp</p>
      </footer>
    </div>
  );
}
