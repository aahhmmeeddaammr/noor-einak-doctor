import { motion } from 'framer-motion';
import { Briefcase, MapPin, Phone, Mail, Users2, Microscope, FileText, Zap, Edit3, Star, Globe, ChevronRight, BookOpen, Building2, Plus } from 'lucide-react';
import { useDoctorProfile } from '@/features/doctors/hooks';
import { useDashboard } from '@/features/dashboard/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { cn, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';

function RotatingAd({ ads, side }: { ads: any[], side: 'left' | 'right' }) {
    const [index, setIndex] = useState(side === 'left' ? 0 : Math.max(0, ads.length - 1));

    useEffect(() => {
        if (ads.length <= 2) return;

        const interval = setInterval(() => {
            setIndex((prev) => (prev + 2) % ads.length);
        }, 7000);

        return () => clearInterval(interval);
    }, [ads.length]);

    if (ads.length === 0) return null;

    // If only 1 ad, both sides show it. If 2, each shows one. 
    // If >2, they rotate and we offset the right side to show different ones.
    const currentAd = ads[index] || ads[0];

    return (
        <div className="sticky top-0 h-[calc(100vh-9rem)] hidden xl:block w-40 shrink-0">
            <motion.div
                key={currentAd._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.8 }}
                className="h-full flex flex-col"
            >
                <div className="flex-1 relative group cursor-pointer overflow-hidden rounded-4xl border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-[#3e4998]/20 transition-all duration-500">
                    <a href={currentAd.targetUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                        <img
                            src={currentAd.imageUrl}
                            alt={currentAd.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute bottom-6 left-4 right-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{currentAd.companyName}</p>
                            <p className="text-[11px] font-black text-white leading-tight">{currentAd.title}</p>
                        </div>
                    </a>
                </div>
            </motion.div>
        </div>
    );
}

export default function DashboardPage() {
    const { data: profileData, isLoading: isProfileLoading } = useDoctorProfile();
    const { data: dashboardData, isLoading: isDashboardLoading } = useDashboard();
    const user = useAuthStore((s) => s.user);

    const doctor = (profileData as any)?.data;
    const stats = (dashboardData as any)?.data;
    const articles = stats?.latestArticles || [];

    if (isProfileLoading || isDashboardLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="w-full h-64 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
                <div className="max-w-5xl mx-auto -mt-20 px-8 space-y-8">
                    <div className="flex items-end gap-6">
                        <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white" />
                        <div className="space-y-3 flex-1">
                            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
                        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-8 bg-slate-50/30 dark:bg-slate-950/30">
            {/* Left Sidebar Ad */}
            <RotatingAd ads={stats?.ads || []} side="left" />

            {/* Main Command Center Workspace */}
            <div className="flex-1 min-w-0">
                {/* Premium Cover Section - Lightened */}
                <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-4xl shadow-xl group/cover">
                    <img
                        src={doctor?.coverUrl || "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2070&auto=format&fit=crop"}
                        alt="Clinic Cover"
                        className="w-full h-full object-cover scale-105 group-hover/cover:scale-100 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />

                    {/* Quick Action Overlay */}
                    <div className="absolute top-6 right-6 flex gap-3">
                        <Link to="/profile">
                            <Button className="bg-white/90 backdrop-blur-md text-[#3e4998] hover:bg-white border-none gap-2 rounded-2xl h-10 px-5 font-bold shadow-xl transition-all hover:scale-105 active:scale-95">
                                <Edit3 size={16} />
                                <span>Manage profile</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Profile Identity Section - Compact & Professional */}
                <div className="w-full flex flex-col md:flex-row items-end gap-6 mb-10 -mt-16 relative z-40 px-6">
                    {/* Professional Avatar */}
                    <div className="relative group shrink-0">
                        <Avatar className="w-36 h-36 border-[5px] bg-white border-white dark:border-slate-950 shadow-xl relative">
                            <AvatarImage src={doctor?.avatarUrl || user?.avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-primary/5 text-primary text-3xl font-black">
                                {user?.name?.[0] || 'D'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-950 shadow-lg" />
                    </div>

                    {/* Identity Info - Compact Alignment */}
                    <div className="text-center md:text-left flex-1 pb-2">
                        <h1 className="text-3xl font-black text-white md:text-slate-900 md:dark:text-white tracking-tight mb-2">
                            Dr. {user?.name}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <p className="text-sm font-bold text-[#3e4998] flex items-center gap-2">
                                <Briefcase size={16} />
                                {doctor?.specialization || 'Clinical Specialist'}
                            </p>
                            <div className="w-1 h-1 rounded-full bg-slate-300 hidden md:block" />
                            <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                <MapPin size={16} />
                                {doctor?.clinic?.name || 'Principal Practice'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-8">
                    {/* Statistics Overview - Enhanced with financial & growth data */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 bg-white dark:bg-slate-900 rounded-4xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl" />

                                {[
                                    { label: 'Total patients', value: stats?.totalPatients ?? 0, trend: '+12% this month', icon: Users2, color: 'text-blue-500', bg: 'bg-blue-50' },
                                    { label: 'Pending reviews', value: stats?.pendingTestReviews ?? 0, trend: 'Action required', icon: Microscope, color: 'text-rose-500', bg: 'bg-rose-50' },
                                    { label: 'Total prescriptions', value: stats?.totalPrescriptions ?? 0, trend: 'High adherence', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                    { label: 'Portal reach', value: stats?.portalReach ? `${(stats.portalReach / 1000).toFixed(1)}k` : '0', trend: 'Global engagement', icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                                ].map((stat, i) => (
                                    <div key={i} className="flex flex-col space-y-2 relative">
                                        {stat.label === 'Pending reviews' && stats?.unreadMessages > 0 && (
                                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg">
                                                {stats.unreadMessages}
                                            </div>
                                        )}
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm", stat.bg)}>
                                            <stat.icon size={28} className={stat.color} />
                                        </div>
                                        <h4 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stat.value}</h4>
                                        <div className="space-y-1 mt-1">
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                                            <p className="text-[10px] font-bold text-emerald-500">{stat.trend}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                    {/* Patient Management Pulse (Replaces Bio) */}
                    <div className="bg-white dark:bg-slate-900 rounded-4xl p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                                <span className="w-2 h-10 bg-[#3e4998] rounded-full" />
                                Clinical dashboard overview
                            </h2>
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 px-6 py-2 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Connected Active Session</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* Upcoming Appointments (Actionable) */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent patients</h3>
                                        <div className="space-y-3">
                                            {stats?.recentPatients?.length > 0 ? stats.recentPatients.map((pt: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[1.25rem] border border-slate-100 dark:border-white/5 group hover:border-[#3e4998]/30 transition-all cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                                            <AvatarImage src={pt.avatarUrl} />
                                                            <AvatarFallback className="bg-white text-xs font-black text-[#3e4998]">
                                                                {pt.name?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{pt.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">Joined {formatDate(pt.joinedAt)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex -space-x-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <EmptyState
                                                  icon={Users2}
                                                  title="No recent activity"
                                                  description="No patient activity recorded recently."
                                                  className="p-8 border-dashed"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Efficiency Metrics */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Performance KPIs</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="p-5 bg-linear-to-br from-[#3e4998] to-primary-700 rounded-2xl shadow-xl relative overflow-hidden">
                                                <Star className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
                                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Patient Satisfaction</p>
                                                <p className="text-3xl font-black text-white leading-none mb-4 tracking-tight">{stats?.satisfactionScore || "5.0"}<span className="text-sm">/5</span></p>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className={cn("fill-amber-400", s <= Math.floor(stats?.satisfactionScore || 5) ? "text-amber-400" : "text-white/20")} />)}
                                                    <span className="text-[10px] font-bold text-white/80 ml-2">Based on adherence</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-[#3e4998]/5 border border-[#3e4998]/10 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#3e4998] shadow-sm">
                                                        <Zap size={14} className="fill-[#3e4998]" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">Digital efficiency</span>
                                                </div>
                                                <span className="text-sm font-black text-[#3e4998]">{stats?.efficiencyRate || 100}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                    {/* Latest Knowledge Publications */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between px-6">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                                <BookOpen className="text-[#3e4998]" size={28} />
                                Medical publications
                            </h2>
                            <Link to="/articles" className="text-xs font-black text-[#3e4998] uppercase tracking-widest hover:underline transition-all">
                                View all health publications
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                                    {articles.length > 0 ? articles.map((article: any) => (
                                        <Link key={article._id} to={`/articles/${article.slug}`} className="group/card">
                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 h-full flex flex-col">
                                                <div className="relative h-44 w-full overflow-hidden rounded-3xl mb-6">
                                                    <img
                                                        src={article.coverImage || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop"}
                                                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                                                        alt={article.title}
                                                    />
                                                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black text-[#3e4998] uppercase tracking-wider">
                                                        {article.category}
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-3 line-clamp-2">{article.title}</h3>
                                                <p className="text-sm font-bold text-slate-500 line-clamp-2 mb-6 flex-1 italic">"{article.summary}"</p>
                                                <div className="flex items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-800">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(article.createdAt)}</span>
                                                    <span className="text-xs font-black text-[#3e4998] flex items-center gap-1 group-hover/card:translate-x-1 transition-all">Read publication <ChevronRight size={14} /></span>
                                                </div>
                                            </div>
                                        </Link>
                                    )) : (
                                        <div className="md:col-span-2 2xl:col-span-3">
                                          <EmptyState
                                            icon={BookOpen}
                                            title="No health articles"
                                            description="Start sharing your medical expertise with patients."
                                            action={{
                                              label: "Create first article",
                                              onClick: () => window.location.href = '/articles',
                                              icon: Plus
                                            }}
                                            className="border-dashed"
                                          />
                                        </div>
                                    )}
                                </div>
                            </div>
                    {/* Sidebar components moved to bottom grid for more space */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Practice Location */}
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group/card">
                            {/* Decorative Gradient Background */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 transition-transform duration-700 group-hover/card:scale-110" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-[#3e4998] rounded-full" />
                                            Clinical Practice
                                        </h3>
                                        <div className="p-2 bg-[#3e4998]/5 rounded-xl">
                                            <Building2 size={20} className="text-[#3e4998]" />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Primary Location Card */}
                                        <div className="relative overflow-hidden p-6 bg-linear-to-br from-[#3e4998] to-[#4c59b0] rounded-4xl shadow-xl shadow-[#3e4998]/20 group/site">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />

                                            <div className="relative z-10">
                                                <h4 className="text-xl font-black text-white mb-2 leading-tight">
                                                    {doctor?.clinic?.name || "Private clinical practice"}
                                                </h4>

                                                <div className="flex items-start justify-between gap-6">
                                                    <p className="text-sm font-medium text-white/80 leading-relaxed max-w-[70%]">
                                                        {doctor?.clinic?.address || "Address details not provided"}
                                                    </p>

                                                    {doctor?.clinic?.addressLink && (
                                                        <a
                                                            href={doctor.clinic.addressLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-12 h-12 bg-white text-[#3e4998] rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 group-hover/site:rotate-6"
                                                            title="Get Directions"
                                                        >
                                                            <MapPin size={22} strokeWidth={2.5} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Details List */}
                                        <div className="grid grid-cols-1 gap-4 pt-4">
                                            {[
                                                { icon: Phone, label: 'Patient Support', value: doctor?.clinic?.phone || user?.phone || "N/A", color: 'text-indigo-500', bg: 'bg-indigo-50' },
                                                { icon: Mail, label: 'Clinical Email', value: user?.email || "clinical@pharco.com", color: 'text-sky-500', bg: 'bg-sky-50' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-default">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", item.bg)}>
                                                        <item.icon size={18} className={item.color} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">{item.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        {/* Digital Performance Hub */}
                        <div className="bg-white dark:bg-slate-900 rounded-4xl p-10 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group flex flex-col justify-center">
                            <div className="absolute -right-8 -top-8 w-48 h-48 bg-[#3e4998]/5 rounded-full blur-3xl" />
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-10 flex items-center gap-4">
                                <Zap size={24} className="text-[#3e4998] fill-[#3e4998]" />
                                Professional analytics
                            </h3>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strength index</span>
                                            <span className="text-sm font-black text-[#3e4998]">{stats?.strengthIndex || 0}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                                            <div
                                                className="h-full bg-linear-to-r from-[#3e4998] to-[#476eb3] rounded-full transition-all duration-1000"
                                                style={{ width: `${stats?.strengthIndex || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-relaxed font-bold">
                                            You are in the <span className="underline">top 5%</span> of ophthalmologists in your region this quarter.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <RotatingAd ads={stats?.ads || []} side="right" />
            </div>
    );
}
