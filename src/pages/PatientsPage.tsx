import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Users2, Calendar, Zap, Activity, Mail, Phone, 
  ChevronRight, MessageSquare, AlertTriangle, UserCheck, 
  Shield, FileStack, ShieldAlert, Sparkles, Settings2,
  Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { usePatients, useBulkPermissions } from '@/features/patients/hooks';
import { cn, getInitials, getAdherenceColor, getAdherenceLabel, formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/Button';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter, DialogTrigger 
} from '@/components/ui/Dialog';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import toast from 'react-hot-toast';

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePatients({ page, limit: 12, search: search || undefined });
  const { mutate: bulkUpdate, isPending: isUpdating } = useBulkPermissions();
  
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [permissions, setPermissions] = useState({
    canChat: true,
    canUploadTests: true
  });

  const patients = (data as any)?.data || [];
  const meta = (data as any)?.meta;
  const totalPages = meta?.pages || 0;

  const handleBulkUpdate = () => {
    bulkUpdate(permissions, {
      onSuccess: () => {
        toast.success("Successfully updated all patients' permissions");
        setIsBulkOpen(false);
      },
      onError: () => {
        toast.error("Failed to update bulk permissions");
      }
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Table Search & Global Actions */}
      {/* Header Search & Global Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Search Box (Left) */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Find patients by name or number..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 h-11 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-pharco-orange/10 focus:border-pharco-orange outline-none transition-all shadow-sm"
            />
          </div>

          {/* Quick Actions (Right) */}
          <Dialog open={isBulkOpen} onOpenChange={(open) => {
            if (!isUpdating) setIsBulkOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="h-10 px-6 bg-pharco-orange text-white hover:bg-pharco-orange/90 shadow-md gap-2 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 border-none group shrink-0">
                <Settings2 className="h-4 w-4 group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-sm font-bold">Quick Actions</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="h-7 w-7 text-primary-500" />
                </div>
                <DialogTitle>Global Permissions</DialogTitle>
                <DialogDescription>
                  Toggle accessibility features for all your patients at once.
                </DialogDescription>
              </DialogHeader>

              <div className="py-8 space-y-6">
                <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="space-y-1">
                    <Label className="text-base font-black text-slate-900 dark:text-white">Direct Messaging</Label>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Allow all patients to chat with you</p>
                  </div>
                  <Switch 
                    checked={permissions.canChat} 
                    onCheckedChange={(val) => setPermissions(p => ({ ...p, canChat: val }))} 
                  />
                </div>

                <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="space-y-1">
                    <Label className="text-base font-black text-slate-900 dark:text-white">Automated Tests</Label>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Allow all patients to upload results</p>
                  </div>
                  <Switch 
                    checked={permissions.canUploadTests} 
                    onCheckedChange={(val) => setPermissions(p => ({ ...p, canUploadTests: val }))} 
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsBulkOpen(false)}
                  className="rounded-xl font-bold h-12"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkUpdate} 
                  isLoading={isUpdating}
                  className="bg-[#3e4998] hover:bg-primary-700 text-white rounded-xl h-12 px-8 font-black"
                >
                  Apply to all patients
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Patient Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 animate-pulse h-64" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No patients found"
          description={search ? `No patients match your search for "${search}". Try a different name or number.` : "You don't have any patients in your clinical list yet."}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient: any) => {
              const adherence = patient.adherenceRate;
              return (
                <Link
                  key={patient.id || patient._id}
                  to={`/patients/${patient.id || patient._id}`}
                  className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group relative overflow-hidden flex flex-col"
                >
                  {/* Background Accents */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                  
                  {/* Header */}
                  <div className="flex items-start gap-5 mb-6 relative z-10">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-600 font-black text-xl border border-slate-100 dark:border-slate-700 transition-all duration-500 group-hover:scale-110 group-hover:bg-white overflow-hidden shadow-sm">
                        {patient.user?.avatarUrl ? (
                          <img src={patient.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(patient.user?.name)
                        )}
                      </div>
                      {typeof adherence === 'number' && (
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900",
                          adherence >= 0.8 ? "bg-emerald-500" : adherence >= 0.5 ? "bg-amber-500" : "bg-rose-500"
                        )} />
                      )}
                      
                      {patient.unreadMessages > 0 && (
                        <div className="absolute -top-2 -left-2 bg-rose-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg animate-bounce z-20">
                          {patient.unreadMessages}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white truncate group-hover:text-primary-500 transition-colors leading-tight">
                          {patient.user?.name}
                        </h3>
                        {patient.hasAllergies && (
                          <ShieldAlert size={16} className="text-rose-500 animate-pulse shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                          <Calendar size={12} strokeWidth={3} />
                          {patient.age ? `${patient.age} YRS` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Permissions & Alerts */}
                  <div className="flex items-center gap-2 mb-6">
                     <span className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors",
                        patient.canChat 
                           ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                           : "bg-slate-50 text-slate-400 border-slate-100"
                     )}>
                        <MessageSquare size={10} strokeWidth={3} />
                        Chat {patient.canChat ? 'On' : 'Off'}
                     </span>
                     <span className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors",
                        patient.canUploadTests 
                           ? "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20"
                           : "bg-slate-50 text-slate-400 border-slate-100"
                     )}>
                        <FileStack size={10} strokeWidth={3} />
                        Tests {patient.canUploadTests ? 'On' : 'Off'}
                     </span>
                     {patient.hasAllergies && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 ml-auto">
                           <AlertTriangle size={10} strokeWidth={3} /> Allergies
                        </span>
                     )}
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2 mb-8 relative z-10">
                    <div className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100/50 dark:border-slate-700/50 group/contact">
                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-primary-500 shadow-sm transition-transform group-hover/contact:scale-110 shrink-0">
                        <Mail size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Email Address</p>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{patient.user?.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100/50 dark:border-slate-700/50 group/contact">
                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-sm transition-transform group-hover/contact:scale-110 shrink-0">
                        <Phone size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Phone Number</p>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{patient.user?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Adherence Insight */}
                  <div className="mt-auto space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">adherence profile</span>
                      {typeof adherence === 'number' ? (
                        <span className={cn('text-[11px] font-black flex items-center gap-1', getAdherenceColor(adherence).split(' ')[0])}>
                           {Math.round(adherence * 100)}% {getAdherenceLabel(adherence)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                           No Data
                        </span>
                      )}
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                      {typeof adherence === 'number' ? (
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-1000 shadow-sm',
                            adherence >= 0.8 ? 'bg-linear-to-r from-emerald-400 to-emerald-500' : 
                            adherence >= 0.5 ? 'bg-linear-to-r from-amber-400 to-amber-500' : 
                            'bg-linear-to-r from-rose-400 to-rose-500'
                          )}
                          style={{ width: `${Math.round(adherence * 100)}%` }}
                        />
                      ) : (
                        <div className="h-full rounded-full bg-slate-200 dark:bg-slate-700 w-full opacity-50" />
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">last test</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {patient.lastTestDate ? formatDate(patient.lastTestDate) : 'No tests found'}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">history</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                           {patient.totalTests || 0} total tests
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
