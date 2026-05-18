import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { 
  Bell, Check, Trash2, Clock, Info, MessageSquare, 
  Calendar, AlertCircle, Megaphone, CheckCircle2, SlidersHorizontal,
  Layers, Inbox, Eye
} from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';

type NotificationType = 'SYSTEM_ANNOUNCEMENT' | 'TEST_UPLOADED' | 'NEW_MESSAGE' | 'APPOINTMENT_REMINDER' | string;

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications', page, filter],
    queryFn: () => apiClient.get('/notifications', { 
      params: { 
        page, 
        limit: 15,
        ...(filter === 'unread' ? { isRead: false } : {}) 
      } 
    }),
  });

  const notifications = (notifData as any)?.data || [];
  const meta = (notifData as any)?.meta;

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All cleared', { icon: '✨' });
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Dismissed');
    }
  });

  const getNotificationConfig = (type: NotificationType) => {
    switch (type) {
      case 'NEW_MESSAGE': 
        return { icon: MessageSquare, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20', label: 'Message' };
      case 'TEST_UPLOADED': 
        return { icon: Info, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20', label: 'Report' };
      case 'APPOINTMENT_REMINDER': 
        return { icon: Calendar, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20', label: 'Appointment' };
      case 'SYSTEM_ANNOUNCEMENT': 
        return { icon: Megaphone, color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20', label: 'System' };
      default: 
        return { icon: Bell, color: 'text-slate-600 bg-slate-50 dark:bg-slate-500/10 border-slate-100 dark:border-slate-500/20', label: 'Alert' };
    }
  };

  // Group by Date helper
  const groupNotificationsByDate = (notifs: any[]) => {
    const groups: Record<string, any[]> = { Today: [], Yesterday: [], Earlier: [] };
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    notifs.forEach(n => {
      const d = new Date(n.createdAt).toDateString();
      if (d === today) groups.Today.push(n);
      else if (d === yesterdayStr) groups.Yesterday.push(n);
      else groups.Earlier.push(n);
    });
    return groups;
  };

  const grouped = groupNotificationsByDate(notifications);
  const hasGroupedItems = Object.values(grouped).some(arr => arr.length > 0);

  return (
    <div className="min-h-[calc(100vh-10rem)] space-y-8 animate-fadeIn w-full pb-20">
      
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold tracking-wide text-xs uppercase mb-1">
            <Bell size={14} className="animate-pulse" />
            <span>Inbox Hub</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Stay up to date with events, messages, and system status.</p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm h-fit">
          <button 
            onClick={() => { setFilter('all'); setPage(1); }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              filter === 'all' 
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md shadow-slate-200 dark:shadow-none" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Layers size={16} />
            <span>All</span>
          </button>
          <button 
            onClick={() => { setFilter('unread'); setPage(1); }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              filter === 'unread' 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none" 
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10"
            )}
          >
            <Inbox size={16} />
            <span>Unread</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
         <div className="flex items-center gap-2 text-xs text-slate-500 font-bold tracking-wide">
           <SlidersHorizontal size={12} />
           <span>SHOWING {filter.toUpperCase()} </span>
         </div>
         
         {notifications.length > 0 && (
           <Button 
              variant="ghost" 
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="rounded-full h-8 px-4 font-bold text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 transition-all flex gap-2 items-center"
            >
              <CheckCircle2 size={14} />
              Mark all read
            </Button>
         )}
      </div>

      <div className="space-y-10">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : !hasGroupedItems ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2.5rem] p-12 shadow-sm flex justify-center items-center">
            <EmptyState
              icon={Bell}
              title={filter === 'unread' ? "Zero pending alerts" : "Notification stream empty"}
              description={filter === 'unread' ? "You've read through everything! Take a break." : "Important updates will land here."}
            />
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([groupName, items]) => {
              if (items.length === 0) return null;
              
              return (
                <div key={groupName} className="space-y-4">
                  <div className="flex items-center gap-4 px-2">
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 shrink-0">{groupName}</h3>
                    <div className="h-[1px] w-full bg-gradient-to-r from-slate-200/60 dark:from-slate-800 to-transparent" />
                  </div>

                  <div className="grid gap-3">
                    {items.map((notif: any) => {
                      const config = getNotificationConfig(notif.type);
                      const Icon = config.icon;

                      return (
                        <div 
                          key={notif._id}
                          className={cn(
                            "group relative bg-white dark:bg-slate-900/80 border transition-all duration-300 rounded-[1.75rem] p-6",
                            !notif.isRead 
                              ? "border-slate-200 dark:border-slate-800 shadow-[0_10px_30px_-15px_rgba(79,70,229,0.15)] dark:shadow-none hover:shadow-[0_15px_35px_-10px_rgba(79,70,229,0.2)]" 
                              : "border-slate-100 dark:border-slate-800/50 opacity-85 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          )}
                        >
                          {/* Read dot */}
                          {!notif.isRead && (
                             <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20 animate-pulse" />
                          )}

                          <div className="flex flex-col sm:flex-row gap-5">
                            
                            {/* Icon Section */}
                            <div className={cn(
                              "w-14 h-14 shrink-0 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-105 duration-300",
                              config.color
                            )}>
                              <Icon size={24} strokeWidth={2.2} />
                            </div>

                            {/* Content Body */}
                            <div className="flex-1 space-y-1.5 pr-4">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                                  config.color, "border-0 bg-opacity-100"
                                )}>
                                  {config.label}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                                  {timeAgo(notif.createdAt)}
                                </span>
                              </div>

                              <h4 className={cn(
                                "text-[15px] font-bold tracking-tight leading-tight", 
                                notif.isRead ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"
                              )}>
                                {notif.title}
                              </h4>
                              
                              <p className={cn(
                                "text-sm leading-relaxed font-medium break-words",
                                notif.isRead ? "text-slate-500/80" : "text-slate-600 dark:text-slate-400"
                              )}>
                                {notif.body} {/* FIXED: use body instead of message */}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 sm:flex-col sm:justify-between shrink-0 mt-2 sm:mt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                              {!notif.isRead ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markReadMutation.mutate(notif._id)}
                                  className="w-9 h-9 rounded-xl text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all dark:text-indigo-400"
                                  title="Mark Read"
                                >
                                  <Eye size={18} />
                                </Button>
                              ) : (
                                <div className="hidden sm:block w-9" /> 
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate(notif._id)}
                                className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-50 group-hover:opacity-100"
                                title="Delete Notification"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={meta?.pages || 0}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
