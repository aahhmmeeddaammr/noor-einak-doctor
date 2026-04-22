import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Bell, Check, Trash2, Clock, Info, MessageSquare, AlertCircle } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';

import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => apiClient.get('/notifications', { params: { page, limit: 10 } }),
  });

  const notifications = (notifData as any)?.data || [];
  const meta = (notifData as any)?.meta;

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
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
      toast.success('Notification deleted');
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_MESSAGE': return <MessageSquare className="w-5 h-5 text-primary-500" />;
      case 'TEST_UPLOADED': return <Info className="w-5 h-5 text-indigo-500" />;
      case 'APPOINTMENT_REMINDER': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
          <Bell size={18} />
          <span>System Alerts</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => markAllReadMutation.mutate()}
          disabled={notifications.length === 0 || markAllReadMutation.isPending}
          className="rounded-xl font-bold text-xs text-primary transition-all hover:bg-primary/5"
        >
          Mark all as read
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="All caught up!"
            description="You don't have any new notifications at the moment."
            className="mt-4"
          />
        ) : (
          <>
            <div className="space-y-4">
              {notifications.map((notif: any) => (
                <div 
                  key={notif._id}
                  className={cn(
                    "group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5",
                    !notif.isRead && "border-l-4 border-l-primary-500 bg-primary-50/10"
                  )}
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={cn("text-sm font-bold tracking-tight", notif.isRead ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white")}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{notif.message}</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0 mt-1">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                        {!notif.isRead && (
                          <button 
                            onClick={() => markReadMutation.mutate(notif._id)}
                            className="text-[10px] font-black uppercase tracking-widest text-[#3e4998] hover:text-[#2e3774] flex items-center gap-1.5 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Mark as read
                          </button>
                        )}
                        <button 
                          onClick={() => deleteMutation.mutate(notif._id)}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors ml-auto opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Pagination
              currentPage={page}
              totalPages={meta?.pages || 0}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
