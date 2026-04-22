import {
    LayoutDashboard, Users2, Microscope, MessageSquare,
    Newspaper, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { ScrollArea } from '../ui/ScrollArea';
import { motion } from 'framer-motion';

export default function Sidebar() {
    const location = useLocation();
    const user = useAuthStore((s) => s.user);
    const isVerified = user?.doctor?.verificationStatus === 'verified' || user?.role === 'admin';

    const navGroups = [
        {
            title: "Overview",
            items: [
                { label: 'Dashboard', icon: LayoutDashboard, path: '/', exact: true },
                { label: 'Patients', icon: Users2, path: '/patients' },
            ]
        },
        {
            title: "Medical Resources",
            items: [
                { label: 'Medical Tests', icon: Microscope, path: '/tests', requiresVerification: true },
            ]
        },
        {
            title: "Communication",
            items: [
                { label: 'Messages', icon: MessageSquare, path: '/messaging', requiresVerification: true },
                { label: 'Articles', icon: Newspaper, path: '/articles' },
            ]
        }
    ];

    return (
        <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen transition-all z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-hidden">
            {/* Header / Brand */}
            <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 shrink-0 relative overflow-hidden group">
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1 shadow-sm group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                        <img src="/logo.png" alt="Noor Einak Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-primary dark:text-blue-400 leading-none">
                            Noor<span className="text-pharco-orange">Einak</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold mt-1.5">
                            Eye Portal
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 custom-scrollbar">
                <nav className="py-6 flex flex-col gap-8">
                    {navGroups.map((group) => (
                        <div key={group.title} className="flex flex-col gap-1">
                            <h3 className="px-4 mt-2 mb-2 text-[10px] font-bold text-slate-400 tracking-wider">
                                {group.title}
                            </h3>
                            <div className="flex flex-col gap-1">
                                {group.items.map((item: any) => {
                                    const isActive = item.exact
                                        ? location.pathname === item.path
                                        : location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/');
                                    
                                    const isRestricted = item.requiresVerification && !isVerified;

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={isRestricted ? location.pathname : item.path}
                                            onClick={(e) => {
                                                if (isRestricted) {
                                                    e.preventDefault();
                                                    toast.error('Verification required for this feature');
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                                                isActive
                                                    ? "text-primary dark:text-blue-400"
                                                    : "text-slate-500 hover:text-primary dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900",
                                                isRestricted && "opacity-50 cursor-not-allowed"
                                            )}
                                            end={item.exact}
                                        >
                                            {/* Premium Background with Framer Motion */}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-pill"
                                                    className="absolute inset-0 z-0 rounded-xl bg-primary/8 dark:bg-blue-500/10 border border-primary/10 dark:border-blue-500/20"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                />
                                            )}

                                            {/* Refined Active Indicator */}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-indicator"
                                                    className="absolute left-0 w-1.5 h-6 bg-primary dark:bg-blue-400 rounded-r-full z-20"
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                    style={{ boxShadow: '0 0 12px rgba(62, 73, 152, 0.4)' }}
                                                />
                                            )}

                                            <div className="relative z-10 flex items-center gap-3.5 w-full">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500",
                                                    isActive ? "bg-primary dark:bg-blue-500 shadow-[0_4px_12px_rgba(62,73,152,0.3)]" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 dark:group-hover:bg-blue-500/20",
                                                    isRestricted && "bg-slate-200 dark:bg-slate-800 grayscale"
                                                )}>
                                                    <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} className={cn(
                                                        "transition-all duration-300",
                                                        isActive ? "text-white" : "text-slate-500 group-hover:text-primary dark:group-hover:text-blue-400"
                                                    )} />
                                                </div>
                                                <span className={cn(
                                                    "text-[13.5px] transition-all duration-300",
                                                    isActive ? "font-bold text-primary dark:text-blue-400" : "font-medium text-slate-600 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400"
                                                )}>{item.label}</span>

                                                {isRestricted && (
                                                    <div className="ml-auto text-slate-400">
                                                        <ShieldCheck size={12} />
                                                    </div>
                                                )}

                                                {isActive && !isRestricted && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="ml-auto"
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full bg-pharco-orange shadow-[0_0_8px_rgba(239, 125, 0, 0.4)]" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </ScrollArea>
        </aside>
    );
}
