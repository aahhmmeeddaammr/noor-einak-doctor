import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePrescriptionDetail, useCancelPrescription } from '@/features/prescriptions/hooks';
import { useAuthStore } from '@/stores/authStore';
import { printPrescription } from '@/lib/prescriptionPrinter';
import {
  ArrowLeft, Printer, Edit, Trash2, Calendar, Clock,
  Eye, Pill, FileText, CheckCircle2, User, AlertCircle, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate, getInitials } from '@/lib/utils';
import { useState } from 'react';

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const { data: raw, isLoading, error } = usePrescriptionDetail(id!);
  const rx = (raw as any)?.data ?? raw;
  const cancelMutation = useCancelPrescription();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !rx) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center py-24 gap-4 p-8 bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl border border-slate-200 dark:border-slate-800 my-6 max-w-xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prescription Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          The prescription you are looking for does not exist or may have been removed.
        </p>
        <Button
          onClick={() => navigate('/patients')}
          className="mt-2 bg-primary text-white rounded-xl font-bold text-sm px-6"
        >
          Back to Patients
        </Button>
      </div>
    );
  }

  const patient = rx.patientId;
  const patientUser = patient?.user || {};
  const patientName = patientUser?.name || patient?.name || 'Patient';
  const patientIdVal = patient?._id || patient;
  const isCancelled = rx.status === 'cancelled';

  const handlePrint = () => {
    printPrescription({
      rx,
      patient,
      doctor: rx.doctorId || user,
    });
  };

  const handleCancel = () => {
    cancelMutation.mutate(rx._id, {
      onSuccess: () => setShowCancelConfirm(false),
    });
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto pb-16 px-2 sm:px-4 space-y-8">
      {/* Top Action & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (patientIdVal) navigate(`/patients/${patientIdVal}`);
              else navigate(-1);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all text-xs shadow-2xs group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {rx.title || 'Treatment Plan'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isCancelled
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
              }`}>
                {isCancelled ? 'Cancelled' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Calendar size={12} /> Issued {formatDate(rx.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="rounded-xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 gap-2 shadow-2xs"
          >
            <Printer size={15} />
            <span>Print Prescription</span>
          </Button>

          {!isCancelled && (
            <Button
              onClick={() => navigate(`/prescriptions/${rx._id}/edit`)}
              className="rounded-xl h-10 px-5 text-xs font-bold bg-[#3e4998] hover:bg-[#343d80] text-white shadow-sm gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Edit size={14} />
              <span>Edit Prescription</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Content (8 Cols) & Sidebar (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Composition Column (Left - 8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Prescribed Medications Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#3e4998]/10 text-[#3e4998] dark:text-blue-400 flex items-center justify-center font-bold">
                  <Pill size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Prescribed Medications</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {rx.medications?.length || 0} items prescribed in this regimen
                  </p>
                </div>
              </div>
            </div>

            {/* List of Medications */}
            <div className="space-y-4">
              {(rx.medications || []).map((med: any, index: number) => {
                const eyeBadge = med.eyeSide === 'right' 
                  ? { label: 'Right Eye (OD)', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40' }
                  : med.eyeSide === 'left'
                  ? { label: 'Left Eye (OS)', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40' }
                  : { label: 'Both Eyes (OU)', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40' };

                return (
                  <div
                    key={index}
                    className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                            {med.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">
                            {med.dosage} • <span className="capitalize">{med.type}</span>
                          </p>
                        </div>
                      </div>

                      {med.eyeSide && (
                        <span className={`self-start sm:self-auto text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${eyeBadge.color}`}>
                          {eyeBadge.label}
                        </span>
                      )}
                    </div>

                    {/* Frequency & Duration Row */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                        <Clock size={13} className="text-[#3e4998] dark:text-blue-400" />
                        <span>{med.frequency}x {med.frequencyUnit || 'daily'}</span>
                      </div>

                      {med.scheduleTimes?.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Times:</span>
                          <div className="flex flex-wrap gap-1">
                            {med.scheduleTimes.map((t: string, ti: number) => (
                              <span key={ti} className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {med.duration && (
                        <span className="ml-auto text-slate-500 font-semibold">
                          Duration: <strong className="text-slate-900 dark:text-white">{med.duration} Days</strong>
                        </span>
                      )}
                    </div>

                    {/* Special Instructions */}
                    {med.instructions && (
                      <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300 font-medium italic">
                        "{med.instructions}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Notes Card */}
          {rx.notes && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                <FileText size={15} className="text-[#3e4998] dark:text-blue-400" />
                <span>Doctor's Advice & Patient Instructions</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 italic">
                "{rx.notes}"
              </p>
            </div>
          )}

          {/* Primary Diagnosis */}
          {rx.diagnosis && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Primary Diagnosis</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">{rx.diagnosis}</p>
              </div>
              <Sparkles size={20} className="text-primary/40" />
            </div>
          )}
        </div>

        {/* Sidebar Column (Right - 4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Patient Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Patient Details</h4>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3e4998] to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-md shadow-primary/20 shrink-0">
                {getInitials(patientName)}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {patientName}
                </p>
                <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">
                  {patientUser?.gender ? patientUser.gender.toUpperCase() : 'PATIENT'} • {patientUser?.phone || patient?.phone || 'No phone'}
                </p>
              </div>
            </div>

            {patientIdVal && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/patients/${patientIdVal}`)}
                className="w-full text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 h-9"
              >
                View Patient Profile
              </Button>
            )}
          </div>

          {/* Prescription Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prescription Summary</h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Prescription ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  #{rx._id?.slice(-8)?.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Date Formulated</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatDate(rx.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isCancelled ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isCancelled ? 'Cancelled' : 'Active'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium">Medications Count</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {rx.medications?.length || 0}
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                onClick={handlePrint}
                className="w-full bg-[#3e4998] hover:bg-[#343d80] text-white rounded-xl font-bold text-xs h-10 gap-2 shadow-sm"
              >
                <Printer size={15} />
                <span>Print Document</span>
              </Button>
            </div>
          </div>

          {/* Danger Zone: Cancel */}
          {!isCancelled && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Management</h4>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40 font-bold text-xs transition-all"
              >
                <Trash2 size={14} /> Cancel Prescription
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowCancelConfirm(false)} />
          <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-5 text-rose-500">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Cancel Prescription</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed text-sm">
              Are you sure you want to cancel this prescription? Patients will no longer receive dosage alerts for this treatment regimen.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 rounded-xl h-10 font-bold text-xs"
              >
                Keep Active
              </Button>
              <Button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-10 font-bold text-xs"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
