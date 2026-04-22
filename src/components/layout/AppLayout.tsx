import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const _hasHydrated = useAuthStore((s) => s._hasHydrated);
    const theme = useUIStore((s) => s.theme);
    const location = useLocation();

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        if (_hasHydrated && isAuthenticated && user) {
            const isAuthorized = user.role === 'doctor' || user.role === 'admin';

            if (!isAuthorized) {
                logout();
            }
        }
    }, [isAuthenticated, user, _hasHydrated, logout]);

    // Don't do anything until the store has hydrated
    if (!_hasHydrated) {
        return null;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Role protection - ensure only doctors/admins can access this portal
    if (user.role !== 'doctor' && user.role !== 'admin') {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950 text-foreground font-sans antialiased transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="p-8 flex-1 flex flex-col overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20 transition-colors duration-300">
                    {user?.role === 'doctor' && user.doctor?.verificationStatus !== 'verified' && (
                        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">Account Verification Pending</p>
                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-500/80">Some clinical features are restricted until your medical credentials are verified.</p>
                                </div>
                            </div>
                            <Button variant="outline" className="border-amber-200 text-amber-700 bg-white dark:bg-amber-950/50 dark:border-amber-800 text-xs h-9 font-bold px-4 rounded-xl" onClick={() => window.location.href = '/profile'}>
                                Complete Profile
                            </Button>
                        </div>
                    )}
                    <Outlet key={location.pathname} />
                </main>
            </div>
        </div>
    );
}
