import { useState } from 'react';
import { Activity, Lock, Mail, ArrowRight, Loader2, ShieldCheck, UserPlus } from 'lucide-react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      
      const response = await axios.post(`${API_URL}${endpoint}`, {
        email,
        password
      });

      const { token, user } = response.data;
      
      // Store token globally
      localStorage.setItem('logpulse_token', token);
      localStorage.setItem('logpulse_user', JSON.stringify(user));

      onLogin(token);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication sequence failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center selection:bg-brand-500/30 font-sans relative overflow-hidden">
      
      {/* Background Ambience Elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none opacity-50"></div>

      <div className="w-full max-w-[92%] sm:max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Logo and Header */}
        <div className="text-center mb-6 md:mb-10 space-y-3 md:space-y-4">
          <div className="inline-flex justify-center items-center p-3 md:p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl relative group cursor-default">
            <div className="absolute inset-0 bg-brand-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <Activity className="w-8 h-8 md:w-10 md:h-10 text-brand-400 relative z-10 transition-transform duration-500 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">LogPulse Engine</h1>
            <p className="text-[10px] md:text-sm font-bold text-zinc-500 tracking-widest uppercase mt-1 md:mt-2">Secure Access Gateway</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="backdrop-blur-xl bg-zinc-900/60 p-6 md:p-8 rounded-3xl border border-zinc-800/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500 opacity-50"></div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            
            <div className="space-y-3 md:space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-[11px] font-black text-zinc-400 uppercase tracking-widest pl-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-brand-400 transition-colors">
                    <Mail className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-3 md:py-3.5 pl-11 md:pl-12 pr-4 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-zinc-700 text-sm md:text-base font-medium"
                    placeholder="operator@logpulse.io"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center pr-1">
                  <label className="text-[10px] md:text-[11px] font-black text-zinc-400 uppercase tracking-widest pl-1">Target Hash</label>
                  {!isRegistering && <a href="#" className="text-[9px] md:text-[10px] font-bold text-brand-400 hover:text-brand-300 transition-colors">Recover?</a>}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-brand-400 transition-colors">
                    <Lock className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-3 md:py-3.5 pl-11 md:pl-12 pr-4 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-zinc-700 text-sm md:text-base font-medium"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 animate-in slide-in-from-top-2">
                <div className="text-red-400 mt-0.5"><ShieldCheck className="w-4 h-4"/></div>
                <p className="text-sm font-medium text-red-200">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full relative overflow-hidden group py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-base transition-all duration-300
                ${isLoading ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5'}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isRegistering ? 'Registering...' : 'Authenticating...'}
                </>
              ) : (
                <>
                  {isRegistering ? 'Create Operator Account' : 'Initialize Session'}
                  {isRegistering ? <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </button>
            
            <div className="text-center mt-6">
               <button 
                 type="button" 
                 onClick={() => setIsRegistering(!isRegistering)}
                 className="text-xs font-bold text-zinc-500 hover:text-white transition-colors tracking-wide underline decoration-zinc-700 underline-offset-4"
               >
                 {isRegistering ? 'Return to Login Sequence' : 'Request New Operator Access'}
               </button>
            </div>
            
          </form>
        </div>
        
        {/* Footer info */}
        <p className="text-center text-xs font-medium text-zinc-600 mt-8">
          Authorized personnel only. Sessions are perpetually monitored.
        </p>

      </div>
    </div>
  );
};

export default Login;
