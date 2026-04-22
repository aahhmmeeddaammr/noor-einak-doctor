import { Bell, Moon, Sun, LogOut, User2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '../ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogout } from '@/features/auth/hooks';

export default function Header() {
    const user = useAuthStore((s) => s.user);
    const { theme, toggleTheme } = useUIStore();
    const navigate = useNavigate();
    const location = useLocation();
    const logoutMutation = useLogout();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard Overview';
        if (path === '/profile') return 'Profile Settings';
        if (path.startsWith('/patients')) return 'Patient Management';
        if (path.startsWith('/prescriptions')) return 'Digital Prescriptions';
        if (path.startsWith('/tests')) return 'Clinical Tests';
        if (path.startsWith('/messaging')) return 'Communication Center';
        if (path.startsWith('/articles')) return 'Knowledge Base';
        if (path.startsWith('/notifications')) return 'Notifications';
        return 'Doctor Portal';
    };

    const handleLogout = () => {
        logoutMutation.mutate(undefined, {
            onSuccess: () => navigate('/login')
        });
    };

    return (
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-8 z-50 w-full transition-all duration-500 shadow-sm dark:bg-slate-950/70 dark:border-slate-800/50">
            {/* Page Title (Dynamic) */}
            <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                        {getPageTitle()}
                    </h2>
                </div>
            </div>

            {/* Tactical Actions */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-xl h-10 w-10 text-slate-500 hover:text-[#3e4998] hover:bg-white dark:hover:bg-slate-800 transition-all shadow-none"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/notifications')}
                        className="rounded-xl h-10 w-10 text-slate-500 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-800 transition-all relative shadow-none"
                    >
                        <Bell size={20} />

                    </Button>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800/50 mx-2 hidden sm:block"></div>

                {/* Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-12 rounded-2xl flex items-center gap-2 px-3 hover:bg-slate-100 dark:hover:bg-white/5 group transition-all cursor-pointer">
                            <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700 group-hover:border-primary transition-colors duration-300 shadow-sm">
                                <AvatarImage src={user?.avatarUrl} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                    {user?.name?.[0] || 'D'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start lg:flex">
                                Dr. {user?.name}
                                <span className="text-[11px] text-pharco-orange font-bold">
                                    {user?.doctor?.specialization || 'Ophthalmologist'}
                                </span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200" align="end" sideOffset={12}>
                        <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-xl flex items-center gap-3 px-3 py-2.5 font-medium transition-all cursor-pointer group hover:bg-slate-50 focus:bg-slate-50 active:scale-[0.98]">
                            <User2 className="h-4 w-4 text-slate-400 group-hover:text-primary group-focus:text-primary transition-colors" />
                            <span className="group-hover:text-primary group-focus:text-primary transition-colors">My profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="opacity-50" />
                        <DropdownMenuItem
                            className="rounded-xl flex items-center gap-3 px-3 py-2.5 font-bold text-xs text-rose-500 hover:bg-rose-50 focus:bg-rose-50 dark:hover:bg-rose-500/10 dark:focus:bg-rose-500/10 transition-all cursor-pointer group"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
