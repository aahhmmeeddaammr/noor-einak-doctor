import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
// Using /logo.png directly
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  if (!_hasHydrated) {
    return null;
  }

  if (isAuthenticated) {
    const user = useAuthStore.getState().user;
    const isDoctorOrAdmin = user?.role === 'doctor' || user?.role === 'admin';
    
    if (isDoctorOrAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return (
    <div className="flex min-h-screen bg-[#020617] font-sans selection:bg-indigo-500/30">
      {/* Visual Brand Column */}
      <div className="hidden lg:flex flex-[1.2] relative overflow-hidden p-16 flex-col justify-between">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 z-0"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.15),transparent_50%)] z-0"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] bg-pharco-blue-deep/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[0%] left-[-10%] w-[500px] h-[500px] bg-pharco-orange/10 rounded-full blur-[100px] mix-blend-screen overflow-hidden"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 bg-white flex items-center justify-center p-1 shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)] rounded-xl overflow-hidden">
              <img src="/logo.png" alt="Noor Einak Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase">NOOR<span className="text-pharco-orange">EINAK</span></span>
          </div>

          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">
              <ShieldCheck size={14} className="text-indigo-400" />
              Doctor Portal Access
            </div>
            <h1 className="text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-white">
              Welcome to <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pharco-blue-light via-white to-pharco-orange">
                Noor Einak.
              </span>
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-lg">
              The professional medical platform for eye care specialists.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-8 pt-12 border-t border-white/5">
            <div>
              <p className="text-4xl font-black text-white leading-none">2.5k+</p>
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-2">Active Patients</p>
            </div>
            <div>
              <p className="text-4xl font-black text-white leading-none">100%</p>
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-2">Secure Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Column */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-[#020617] relative z-10 transition-colors duration-300">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex items-center justify-center p-1 border border-slate-200 shadow-sm">
              <img src="/logo.png" alt="Noor Einak Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black text-[#020617] dark:text-white uppercase tracking-tighter">NOOR<span className="text-pharco-orange">EINAK</span></span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
