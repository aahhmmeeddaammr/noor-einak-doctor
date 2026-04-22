import { useState } from 'react';
import { useTests, useReviewTest } from '@/features/tests/hooks';
import { cn, formatDate, formatDateTime, getStatusColor } from '@/lib/utils';
import { X, File as FileIcon, CheckCircle2, XCircle, RotateCcw, Loader2, Eye, ClipboardCheck, ChevronRight, Clock, ExternalLink } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent } from '@/components/ui/Dialog';

export default function MedicalTestsPage() {
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTests({ 
    status: statusFilter || undefined,
    page,
    limit: 12
  });
  const tests = (data as any)?.data || [];
  const meta = (data as any)?.meta;
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const reviewMutation = useReviewTest();

  const handleReview = (status: string) => {
    if (!reviewModal) return;
    reviewMutation.mutate(
      { id: reviewModal._id || reviewModal.id, status, doctorNotes: notes },
      { onSuccess: () => { setReviewModal(null); setNotes(''); } }
    );
  };

  const statusTabs = [
    { label: 'Pending Review', value: 'pending_review', icon: Clock, iconColor: 'text-amber-500' },
    { label: 'Approved', value: 'approved', icon: CheckCircle2, iconColor: 'text-emerald-500' },
    { label: 'Rejected', value: 'rejected', icon: XCircle, iconColor: 'text-rose-500' },
    { label: 'Re-upload Requested', value: 'reupload_requested', icon: RotateCcw, iconColor: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }} className="w-full">
        <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-[1.25rem] h-auto">
          {statusTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 rounded-xl px-7 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg shadow-primary/5 cursor-pointer text-sm font-bold transition-all data-[state=active]:text-primary dark:data-[state=active]:text-blue-400"
            >
              <tab.icon size={16} className={cn("transition-colors", tab.iconColor)} />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Tests Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl shadow-sm border border-border h-48 animate-pulse" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <EmptyState
          icon={FileIcon}
          title="No tests found"
          description={`There are currently no medical tests with the status "${statusTabs.find(t => t.value === statusFilter)?.label}".`}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tests.map((test: any) => (
            <div key={test._id || test.id} className="p-6 rounded-4xl border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-primary/5 transition-all group flex flex-col h-full bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Issued: {formatDateTime(test.createdAt || test.testDate)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 mb-6">
                <h4 className="font-black text-slate-900 dark:text-white text-lg leading-snug group-hover:text-primary-500 transition-colors">
                  {test.testType || test.title || 'Medical Record'}
                </h4>
                {test.eye && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-2xl text-xs font-black shadow-md shadow-secondary/20 shrink-0 transition-transform hover:scale-105">
                    <Eye size={16} strokeWidth={3} />
                    {test.eye} Eye
                  </span>
                )}
              </div>

              {test.patientId?.userId && (
                <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                   <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner">
                     {test.patientId.userId.name.charAt(0)}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{test.patientId.userId.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{test.patientId.userId.phone || test.patientId.userId.email || 'No Contact Info'}</span>
                   </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Patient Narrative</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                    "{test.description || 'No description provided by patient.'}"
                  </p>
                </div>

                {test.doctorNotes && (
                  <div className="p-4 rounded-2xl bg-amber-50/30 dark:bg-amber-500/5 border border-amber-100/50 dark:border-amber-900/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <ClipboardCheck size={40} />
                    </div>
                    <p className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <ClipboardCheck size={10} />
                      Clinical Evaluation
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
                      {test.doctorNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <span className={cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', getStatusColor(test.status))}>
                   {test.status?.replace(/_/g, ' ')}
                </span>

                {statusFilter === 'pending_review' ? (
                  <button
                    onClick={() => setReviewModal(test)}
                    className="flex items-center justify-center gap-2 h-10 px-6 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20 shrink-0"
                  >
                    Review Test
                  </button>
                ) : (
                  test.fileUrl && (
                    <a href={test.fileUrl} target="_blank" rel="noopener noreferrer">
                      <button className="h-10 px-5 bg-primary/5 hover:bg-primary/10 text-primary-600 rounded-2xl border border-primary/10 flex items-center gap-2.5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
                         <span className="text-[10px] font-black uppercase tracking-widest">Open File</span>
                         <ExternalLink size={14} strokeWidth={3} />
                      </button>
                    </a>
                  )
                )}
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

      {/* Review Dialog */}
      <Dialog open={!!reviewModal} onOpenChange={() => setReviewModal(null)}>
        <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          {reviewModal && (
            <div className="flex flex-col">
              {/* Identity Header (Mirrors Card) */}
              <div className="p-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Issued: {formatDateTime(reviewModal.createdAt || reviewModal.testDate)}
                  </span>
                  <span className={cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', getStatusColor(reviewModal.status))}>
                     {reviewModal.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1">Clinic Review Service</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                      {reviewModal.testType || reviewModal.title || 'Medical Record'}
                    </h3>
                  </div>
                  {reviewModal.eye && (
                    <span className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-2xl text-xs font-black shadow-md shadow-secondary/20 shrink-0">
                      <Eye size={16} strokeWidth={3} />
                      {reviewModal.eye} Eye
                    </span>
                  )}
                </div>
              </div>

              {/* Document Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20">
                <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Info</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {reviewModal.patientId?.userId?.name || 'Anonymous Patient'}
                      </p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Test Category</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {reviewModal.testType} • {reviewModal.eye} Eye
                      </p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient's Narrative</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                        "{reviewModal.description || 'No description provided.'}"
                      </p>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-3 opacity-40">Add Clinical Assessment</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Detailed evaluation for the patient..."
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-inner transition-all outline-none"
                      />
                   </div>
                </div>
              </div>

              {/* Actions Console */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                 <button
                   onClick={() => handleReview('approved')}
                   disabled={reviewMutation.isPending}
                   className="flex-1 flex items-center justify-center gap-2 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                 >
                   {reviewMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Approve</>}
                 </button>
                 
                 <button
                   onClick={() => handleReview('rejected')}
                   disabled={reviewMutation.isPending}
                   className="flex-1 flex items-center justify-center gap-2 h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
                 >
                   <XCircle size={16} /> Reject
                 </button>

                 <button
                   onClick={() => handleReview('reupload_requested')}
                   disabled={reviewMutation.isPending}
                   className="flex-1 flex items-center justify-center gap-2 h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                 >
                   <RotateCcw size={16} /> Re-upload
                 </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
