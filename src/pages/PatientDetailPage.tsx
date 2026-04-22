import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText, MessageSquare, Plus, ChevronRight,
  ShieldAlert, Mail, Phone, Calendar, Zap, Clock,
  Eye, ClipboardCheck, LayoutDashboard, Pill, Activity, Bell, ExternalLink, Loader2,
  TrendingUp, Table as TableIcon, Filter, Info, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { usePatientDetail, useTogglePermission, usePatientReminders, useUpdateMedicalInfo } from '@/features/patients/hooks';
import { getInitials, formatDate, formatDateTime, formatTime, cn, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line, ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

const tabs = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'IOP Tracking', icon: TrendingUp },
  { label: 'Prescriptions', icon: Pill },
  { label: 'Electronic Medical Records', icon: Activity },
  { label: 'Medication Reminders', icon: Bell }
];

export default function PatientDetailPage() {
  const { patientId } = useParams();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = usePatientDetail(patientId!);
  const patient = (data as any)?.data;
  const [reminderPage, setReminderPage] = useState(1);
  const [allReminders, setAllReminders] = useState<any[]>([]);
  const [selectedRx, setSelectedRx] = useState<any>(null);

  const { data: remindersData, isLoading: isLoadingReminders } = usePatientReminders(patientId!, {
    page: reminderPage,
    limit: 10
  });

  const [allergies, setAllergies] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [iopEyeFilter, setIopEyeFilter] = useState<'both' | 'od' | 'os'>('both');
  const [iopTimeFilter, setIopTimeFilter] = useState<'week' | 'month' | 'three_months' | 'all'>('month');
  const updateMutation = useUpdateMedicalInfo();

  useEffect(() => {
    if (patient) {
      setAllergies(patient.allergies || '');
      setMedicalNotes(patient.medicalNotes || '');
    }
  }, [patient]);

  const handleUpdateProfile = () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    updateMutation.mutate({
      id: patientId!,
      data: { allergies, medicalNotes }
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  // Append new reminders to the list
  useEffect(() => {
    if (remindersData?.data) {
      setAllReminders((prev: any[]) => {
        const existingIds = new Set(prev.map((r: any) => r._id));
        const newItems = remindersData.data.filter((r: any) => !existingIds.has(r._id));
        return [...prev, ...newItems];
      });
    }
  }, [remindersData]);

  // Process IOP Data for Analytics - Combine records and tests
  const rawIopData = [
    ...(patient?.medicalRecords || []),
    ...(patient?.medicalTests || [])
  ];

  // Map and de-duplicate (prefer medicalRecords as they represent approved tests)
  const iopRecordsMap = rawIopData
    .filter((r: any) => r.testType === 'Intraocular Pressure' || r.testType === 'iop')
    .reduce((acc: any, r: any) => {
      const id = r.medicalTestId || r._id;
      const readingDate = r.testDate || r.createdAt;
      
      // If we don't have this reading yet, or if the current one is an approved record (medicalRecord)
      // replace the pending test one.
      const isApprovedRecord = !!r.category && r.category === 'test_result';
      
      if (!acc[id] || isApprovedRecord) {
          acc[id] = {
            ...r,
            od: r.iopOD || 0,
            os: r.iopOS || 0,
            date: readingDate ? new Date(readingDate) : new Date(),
            formattedDate: dayjs(readingDate).format('MMM DD'),
            fullDate: dayjs(readingDate).format('MMMM DD, YYYY'),
            isPending: r.status === 'pending'
          };
      }
      return acc;
    }, {});

  const iopRecords = Object.values(iopRecordsMap)
    .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

  const filteredIopRecords = iopRecords.filter((r: any) => {
    if (iopTimeFilter === 'all') return true;
    const itemDay = dayjs(r.date);
    const now = dayjs();
    
    if (iopTimeFilter === 'week') return itemDay.isAfter(now.subtract(7, 'days'));
    if (iopTimeFilter === 'month') return itemDay.isAfter(now.subtract(30, 'days'));
    if (iopTimeFilter === 'three_months') return itemDay.isAfter(now.subtract(90, 'days'));
    return true;
  });

  // Calculate stats for IOP - Use filtered records for stats
  const lastIop: any = filteredIopRecords[filteredIopRecords.length - 1];
  const avgOD = filteredIopRecords.length ? Math.round(filteredIopRecords.reduce((acc: number, r: any) => acc + (r.od || 0), 0) / filteredIopRecords.filter((r:any) => r.od > 0).length) || 0 : 0;
  const avgOS = filteredIopRecords.length ? Math.round(filteredIopRecords.reduce((acc: number, r: any) => acc + (r.os || 0), 0) / filteredIopRecords.filter((r:any) => r.os > 0).length) || 0 : 0;

  // Sort collections by date
  const sortedRecords = [...(patient?.medicalRecords || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="w-full h-48 bg-gray-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Refined Patient Hero */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-7 shadow-xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden group">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors duration-1000" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Avatar Section */}
          <div className="shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-600 font-bold text-3xl shadow-inner border border-slate-100 dark:border-slate-700 transition-transform duration-500 group-hover:rotate-3">
              {patient?.user?.avatarUrl ? (
                <img src={patient.user.avatarUrl} alt="" className="w-full h-full rounded-3xl object-cover" />
              ) : (
                getInitials(patient?.user?.name)
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none mb-2">
                {patient?.user?.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-xs transition-colors hover:text-primary-500">
                  <Mail size={14} className="opacity-70" />
                  <span>{patient?.user?.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-xs transition-colors hover:text-primary-500">
                  <Phone size={14} className="opacity-70" />
                  <span>{patient?.user?.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {patient?.eyeConditions?.map((tag: any) => (
                <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black tracking-wide border border-slate-200/50 dark:border-slate-700/50">
                  {tag}
                </span>
              ))}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black border border-emerald-100/50 dark:border-emerald-900/50">
                <Calendar size={12} className="opacity-80" />
                <span>Registered {formatDate(patient?.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link 
              to={user?.doctor?.verificationStatus === 'verified' ? `/prescriptions/create/${patientId}` : '#'}
              className={cn(user?.doctor?.verificationStatus !== 'verified' && "cursor-not-allowed opacity-60")}
              onClick={(e) => {
                if (user?.doctor?.verificationStatus !== 'verified') {
                  e.preventDefault();
                  toast.error('Account verification required to issue prescriptions');
                }
              }}
            >
              <Button 
                disabled={user?.doctor?.verificationStatus !== 'verified'}
                className="h-12 px-7 bg-primary text-white shadow-lg shadow-primary/10 rounded-2xl font-bold gap-2 hover:scale-[1.02] cursor-pointer transition-all border-none"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Issue Prescription</span>
              </Button>
            </Link>
            <Link to={`/messaging`}>
              <Button variant="outline" className="h-12 px-6 gap-2 rounded-2xl font-bold text-slate-600 dark:text-slate-300 border-slate-200 cursor-pointer dark:border-slate-800 hover:bg-slate-50 transition-all">
                <MessageSquare size={18} />
                <span>Chat</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs System */}
      <Tabs defaultValue="Overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-[1.25rem] overflow-x-auto overflow-y-hidden max-w-full custom-scrollbar flex flex-nowrap">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.label}
                value={tab.label}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg shadow-primary/5 cursor-pointer font-bold transition-all data-[state=active]:text-primary dark:data-[state=active]:text-blue-400 shrink-0"
              >
                <tab.icon size={16} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="Overview" className="mt-0 space-y-6">
          {/* Top Row: Clinical Pulse Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FileText} label="Medications" value={patient?.prescriptionCount ?? 0} color="text-primary-600 bg-primary/10" />
            <StatCard icon={ShieldAlert} label="Archival Records" value={patient?.medicalRecordCount ?? 0} color="text-amber-600 bg-amber-100/60" />
            <StatCard icon={Clock} label="Past Doses" value={patient?.pastCount ?? 0} color="text-emerald-600 bg-emerald-100/60" />
            <StatCard icon={Zap} label="Overall Adherence" value={typeof patient?.adherenceRate === 'number' ? `${Math.round(patient.adherenceRate * 100)}%` : 'N/A'} color="text-rose-600 bg-rose-100/60" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Documentation Workspace (2/3) */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-4xl p-8 shadow-sm flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs">Clinical Workspace</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Documentation & Assessment</p>
                  </div>
                </div>

                <div className="space-y-6 flex-1 flex flex-col">
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 text-[10px] font-black text-rose-500 pl-1">
                      <ShieldAlert size={12} />
                      Allergies & Contraindications
                    </label>
                    <textarea
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      readOnly={!isEditing}
                      placeholder="None recorded..."
                      className={cn(
                        "w-full px-5 py-3 rounded-2xl border transition-all outline-none resize-none text-sm font-bold",
                        isEditing
                          ? "bg-white dark:bg-slate-900 border-rose-300 ring-4 ring-rose-500/5 text-slate-700 dark:text-slate-300"
                          : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-default"
                      )}
                      rows={1}
                    />
                  </div>

                  <div className="space-y-2.5 flex-1 flex flex-col">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 pl-1">
                      <Activity size={12} />
                      Medical Narrative
                    </label>
                    <textarea
                      value={medicalNotes}
                      onChange={(e) => setMedicalNotes(e.target.value)}
                      readOnly={!isEditing}
                      placeholder="Document clinical status..."
                      className={cn(
                        "w-full flex-1 px-5 py-4 rounded-2xl border transition-all outline-none resize-none text-sm font-bold",
                        isEditing
                          ? "bg-white dark:bg-slate-900 border-primary ring-4 ring-primary/5 text-slate-700 dark:text-slate-300"
                          : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-default"
                      )}
                      rows={6}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    {isEditing && (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="h-11 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updateMutation.isPending}
                      className={cn(
                        "h-11 px-6 rounded-xl font-bold text-xs transition-all gap-2.5 flex items-center justify-center cursor-pointer",
                        isEditing
                          ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95"
                          : "bg-secondary text-white shadow-lg shadow-secondary/10 hover:scale-[1.02] active:scale-95"
                      )}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isEditing ? (
                        <ClipboardCheck size={16} />
                      ) : (
                        <Zap size={16} className="text-white" />
                      )}
                      {updateMutation.isPending
                        ? 'Synchronizing...'
                        : isEditing
                          ? 'Commit Assessment'
                          : 'Edit Medical Profile'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Context & Controls (1/3) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Identity Baseline */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-4xl p-8 shadow-sm">
                <h3 className="font-black text-slate-900 dark:text-white mb-6 text-xs">Patient Context</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 shadow-inner border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] font-bold">Date of Birth</span>
                    <span className="text-slate-900 dark:text-white text-sm font-black">{patient?.user?.dateOfBirth ? formatDate(patient.user.dateOfBirth) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 shadow-inner border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] font-bold">Gender</span>
                    <span className="text-slate-900 dark:text-white text-sm font-black capitalize">{patient?.user?.gender || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* System Permissions */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-4xl p-8 shadow-sm">
                <h3 className="font-black text-slate-900 dark:text-white mb-6 text-xs">Digital Reach</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                      <h4 className="text-[11px] font-black text-slate-900 dark:text-white">Messaging</h4>
                      <p className="text-[9px] text-slate-400 font-bold">Direct Chat Access</p>
                    </div>
                    <PermissionToggle id={patientId!} type="chat" enabled={patient?.canChat} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                      <h4 className="text-[11px] font-black text-slate-900 dark:text-white">Diagnostics</h4>
                      <p className="text-[9px] text-slate-400 font-bold">Self-Upload Uploads</p>
                    </div>
                    <PermissionToggle id={patientId!} type="test" enabled={patient?.canUploadTests} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Prescriptions">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-4xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Prescription History</h3>
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-[10px] font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 rounded-lg">
                {patient?.prescriptions?.length || 0} TOTAL CASES
              </span>
            </div>

            {patient?.prescriptions?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {patient.prescriptions.map((rx: any) => (
                  <button
                    key={rx._id || rx.id}
                    onClick={() => setSelectedRx(rx)}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm transition-all hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1 flex flex-col text-left"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                        <Calendar size={10} className="text-slate-400" strokeWidth={3} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">{formatDate(rx.createdAt)}</span>
                      </div>
                      {rx.medications?.[0]?.eyeSide && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-pharco-orange bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-lg uppercase">
                          <Eye size={10} strokeWidth={3} />
                          {rx.medications[0].eyeSide}
                        </span>
                      )}
                    </div>

                    {/* Treatment Core Information */}
                    <div className="mb-6 flex-1">
                      <div className="mb-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Treatment Title</p>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                          {rx.title || 'Untitled Treatment'}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {rx.diagnosis && (
                          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/20">
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1.5">Clinical Diagnosis</p>
                            <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 capitalize">
                              {rx.diagnosis}
                            </p>
                          </div>
                        )}

                        {rx.notes && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Additional Notes</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed">
                              "{rx.notes}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-5 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <Pill size={12} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{rx.medications?.length || 0} Meds</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="text-slate-300" size={24} />
                </div>
                <p className="text-slate-400 font-bold">No prescriptions recorded yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="Electronic Medical Records">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-4xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Archival Health Records</h3>
              <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950 text-[10px] font-black text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900 rounded-lg">
                {sortedRecords.length} DOCUMENTS
              </span>
            </div>

            {sortedRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {sortedRecords.map((item: any) => (
                  <div key={item._id || item.id} className="p-6 rounded-4xl border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-primary/5 transition-all group flex flex-col h-full bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Issued: {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 mb-6">
                      <h4 className="font-black text-slate-900 dark:text-white text-lg leading-snug group-hover:text-primary-500 transition-colors">
                        {item.testType || item.title || 'Medical Record'}
                      </h4>
                      {item.eye && (
                        <span className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-2xl text-xs font-black shadow-md shadow-secondary/20 shrink-0 transition-transform hover:scale-105">
                          <Eye size={16} strokeWidth={3} />
                          {item.eye} Eye
                        </span>
                      )}
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Patient Narrative</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                          "{item.description || 'No description provided by patient.'}"
                        </p>
                      </div>

                      {item.doctorNotes && (
                        <div className="p-4 rounded-2xl bg-amber-50/30 dark:bg-amber-500/5 border border-amber-100/50 dark:border-amber-900/50 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 opacity-10">
                            <ClipboardCheck size={40} />
                          </div>
                          <p className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <ClipboardCheck size={10} />
                            Clinical Evaluation
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
                            {item.doctorNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <ShieldAlert size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase leading-none mb-1">
                            {item.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">
                            {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : 'Secured'}
                          </span>
                        </div>
                      </div>

                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                        <button className="h-10 px-5 bg-primary/5 hover:bg-primary/10 text-primary-600 rounded-2xl border border-primary/10 flex items-center gap-2.5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
                          <span className="text-[10px] font-black uppercase tracking-widest">Open File</span>
                          <ExternalLink size={14} strokeWidth={3} />
                        </button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50/50 rounded-full flex items-center justify-center mx-auto border border-dashed border-slate-200">
                  <ShieldAlert className="text-slate-200" size={24} />
                </div>
                <p className="text-slate-400 font-bold text-sm tracking-tight text-center max-w-xs mx-auto">
                  No archival health records found.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="IOP Tracking" className="mt-0 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Analytics Header & Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shadow-inner">
                    <TrendingUp size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">Intraocular Pressure (IOP) Tracking</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Clinical Trend Analysis</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                   {/* Eye Selector */}
                   <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    {[
                      { id: 'od', label: 'OD (Right)', icon: Eye },
                      { id: 'os', label: 'OS (Left)', icon: Eye },
                      { id: 'both', label: 'Both', icon: Activity }
                    ].map((eye) => (
                      <button
                        key={eye.id}
                        onClick={() => setIopEyeFilter(eye.id as any)}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2",
                          iopEyeFilter === eye.id 
                            ? "bg-white dark:bg-slate-900 text-primary shadow-sm" 
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                      >
                        {eye.label}
                      </button>
                    ))}
                  </div>

                  {/* Timeframe Selector */}
                  <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    {[
                      { id: 'week', label: '1W' },
                      { id: 'month', label: '1M' },
                      { id: 'three_months', label: '3M' },
                      { id: 'all', label: 'All' }
                    ].map((time) => (
                      <button
                        key={time.id}
                        onClick={() => setIopTimeFilter(time.id as any)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all",
                          iopTimeFilter === time.id 
                            ? "bg-white dark:bg-slate-900 text-primary shadow-sm" 
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                      >
                        {time.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stat Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <IopStat 
                  label="Latest OD (Right)" 
                  value={lastIop?.od || 'N/A'} 
                  sub="mmHg" 
                  color="blue"
                  icon={ArrowUpRight}
                  trend={lastIop && lastIop.od > 21 ? 'high' : lastIop && lastIop.od > 0 ? 'normal' : undefined}
                />
                <IopStat 
                  label="Latest OS (Left)" 
                  value={lastIop?.os || 'N/A'} 
                  sub="mmHg" 
                  color="purple"
                  icon={ArrowDownRight}
                  trend={lastIop && lastIop.os > 21 ? 'high' : lastIop && lastIop.os > 0 ? 'normal' : undefined}
                />
                <IopStat 
                  label="Average OD" 
                  value={avgOD} 
                  sub="mmHg" 
                  color="indigo"
                  icon={Activity}
                />
                <IopStat 
                  label="Average OS" 
                  value={avgOS} 
                  sub="mmHg" 
                  color="cyan"
                  icon={Activity}
                />
              </div>

              {/* Main Graph Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <TrendingUp size={16} />
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Pressure Timeline</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      {iopEyeFilter !== 'os' && <div className="flex items-center gap-2 text-[10px] font-black text-blue-500"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> OD</div>}
                      {iopEyeFilter !== 'od' && <div className="flex items-center gap-2 text-[10px] font-black text-purple-500"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" /> OS</div>}
                    </div>
                  </div>

                  <div className="h-[350px] w-full" key={`${iopTimeFilter}-${iopEyeFilter}`}>
                    {filteredIopRecords.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredIopRecords}>
                          <defs>
                            <linearGradient id="colorOD" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOS" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="formattedDate" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            dx={-10}
                            domain={[10, 'auto']}
                          />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl shadow-2xl flex flex-col gap-2">
                                    <p className="text-[10px] font-black text-slate-400 mb-1">{payload[0].payload.fullDate}</p>
                                    {payload.map((p: any) => (
                                      <div key={p.dataKey} className="flex items-center justify-between gap-6">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                          <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase">{p.dataKey === 'od' ? 'OD Right' : 'OS Left'}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 dark:text-white">{p.value} mmHg</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine y={21} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'right', value: 'Abnormal (21+)', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} />
                          {iopEyeFilter !== 'os' && (
                            <Area 
                              type="monotone" 
                              dataKey="od" 
                              stroke="#3b82f6" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorOD)" 
                              animationDuration={1500}
                            />
                          )}
                          {iopEyeFilter !== 'od' && (
                            <Area 
                              type="monotone" 
                              dataKey="os" 
                              stroke="#a855f7" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorOS)" 
                              animationDuration={1500}
                              animationBegin={300}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                        <TrendingUp size={48} className="opacity-10" />
                        <p className="font-bold text-sm">Insufficient data for charting</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                        <TableIcon size={16} />
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Recent Logs</h4>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar -mx-4 px-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-50 dark:border-slate-800 text-left">
                            <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">OD</th>
                            <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">OS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...filteredIopRecords].reverse().map((r: any, i) => (
                            <tr key={i} className="border-b border-slate-50/50 dark:border-slate-800/50 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                <div className="flex flex-col">
                                  <span>{r.formattedDate}</span>
                                  {r.isPending && <span className="text-[8px] text-amber-500 font-bold uppercase">Pending Review</span>}
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                <span className={cn(
                                  "text-[11px] font-black",
                                  r.od > 21 ? "text-rose-500" : "text-slate-900 dark:text-white"
                                )}>{r.od || '-'}</span>
                              </td>
                              <td className="py-3 text-center">
                                <span className={cn(
                                  "text-[11px] font-black",
                                  r.os > 21 ? "text-rose-500" : "text-slate-900 dark:text-white"
                                )}>{r.os || '-'}</span>
                              </td>
                            </tr>
                          ))}
                          {filteredIopRecords.length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-20 text-center text-[10px] font-bold text-slate-400 italic">No logs in this range</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="flex gap-3">
                        <Info size={16} className="text-primary shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                          Normal Intraocular Pressure (IOP) typically ranges from <span className="text-primary font-black">10 to 21 mmHg</span>. Readings consistently above 21 may indicate ocular hypertension or risk of glaucoma.
                        </p>
                      </div>
                    </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="Medication Reminders">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-4xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Reminder History</h3>
              {typeof patient?.adherenceRate === 'number' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Overall Adherence:</span>
                  <span className="text-sm font-black text-primary-500">{Math.round(patient.adherenceRate * 100)}%</span>
                </div>
              )}
            </div>

            {allReminders.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-4">
                  {allReminders.map((reminder: any) => {
                    const isPast = new Date(reminder.scheduledAt) < new Date();
                    return (
                      <div key={reminder._id || reminder.id} className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 transition-all flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                            reminder.status === 'taken' ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10" :
                              reminder.status === 'skipped' ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10" :
                                isPast ? "bg-amber-50 text-amber-500 dark:bg-amber-500/10" : "bg-slate-50 text-slate-400 dark:bg-slate-800"
                          )}>
                            {reminder.status === 'taken' ? <Plus size={20} strokeWidth={3} /> : <Clock size={20} strokeWidth={2.5} />}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white text-sm">{reminder.medicationName || "Prescribed Medication"}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                              {reminder.dosage} • Scheduled for {new Date(reminder.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                            reminder.status === 'taken' ? "bg-emerald-500 text-white" :
                              reminder.status === 'skipped' ? "bg-rose-500 text-white" :
                                isPast ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                          )}>
                            {reminder.status === 'taken' ? 'Taken' :
                              reminder.status === 'skipped' ? 'Skipped' :
                                isPast ? 'Missed' : 'Upcoming'}
                          </span>
                          {reminder.respondedAt && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                              Responded at {formatDateTime(reminder.respondedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(remindersData as any)?.meta?.page < (remindersData as any)?.meta?.pages && (
                  <div className="pt-8 flex justify-center">
                    <Button
                      onClick={() => setReminderPage((prev: number) => prev + 1)}
                      disabled={isLoadingReminders}
                      className="bg-primary-500 hover:bg-primary-400 text-white h-10 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all gap-2 shadow-lg shadow-primary-500/20 active:scale-95 cursor-pointer"
                    >
                      {isLoadingReminders ? 'Loading...' : 'Load Older Reminders'}
                      {!isLoadingReminders && <ChevronRight size={14} />}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="text-slate-300" size={24} />
                </div>
                <p className="text-slate-400 font-bold">No medication reminders found</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRx} onOpenChange={() => setSelectedRx(null)}>
        <DialogContent className="max-w-2xl rounded-4xl p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          {selectedRx && (
            <div className="flex flex-col">
              {/* Streamlined Clinical Header */}
              <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight truncate">
                    {selectedRx.title || selectedRx.diagnosis}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-slate-400">
                    <p className="text-[11px] font-bold flex items-center gap-1.5 capitalize">
                      <Calendar size={12} strokeWidth={3} /> Issued {formatDate(selectedRx.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* High-Density treatment review */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
                {/* Diagnosis & Notes summary info block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRx.diagnosis && (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/20">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1.5">Primary Diagnosis</p>
                      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {selectedRx.diagnosis}
                      </p>
                    </div>
                  )}
                  {selectedRx.notes && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Clinical Note</p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed line-clamp-2">
                        "{selectedRx.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Treatment Regimen Table-like List */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Treatment Regimen</p>
                  
                  <div className="space-y-3">
                    {selectedRx.medications?.map((med: any, idx: number) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                          <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-primary flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                                <Pill size={18} strokeWidth={2.5} />
                             </div>
                             <div className="min-w-0">
                               <div className="flex items-center gap-2 mb-1">
                                 <h5 className="font-black text-slate-900 dark:text-white text-base leading-none">{med.name}</h5>
                                 {med.eyeSide && (
                                   <span className="flex items-center gap-1 text-[8px] font-black text-white bg-pharco-orange px-2 py-0.5 rounded-lg uppercase tracking-wider shadow-sm shadow-orange-500/20">
                                      <Eye size={8} strokeWidth={3} />
                                      {med.eyeSide} Eye
                                   </span>
                                 )}
                               </div>
                               <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                  {med.dosage} {med.type} • {med.frequency}x {med.frequencyUnit}
                               </p>
                             </div>
                          </div>

                          <div className="flex flex-wrap items-center sm:justify-end gap-3 shrink-0">
                            {med.scheduleTimes?.length > 0 && (
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner">
                                <Clock size={12} className="text-slate-400" />
                                <div className="flex gap-1.5">
                                  {med.scheduleTimes.map((t: string) => (
                                    <span key={t} className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                                      {formatTime(t)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-[10px] font-black text-primary rounded-xl border border-indigo-100/30">
                              {med.duration ? `${med.duration} days` : 'Indefinite'}
                            </div>
                          </div>
                        </div>

                        {med.instructions && (
                          <div className="pt-3 border-t border-slate-50 dark:border-slate-800/50">
                            <div className="flex items-start gap-2.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                               <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed">
                                "{med.instructions}"
                               </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Simplified Footer */}
              <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">End of Record</p>
                <Button
                  onClick={() => setSelectedRx(null)}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl px-10 font-bold text-sm h-11 shadow-lg shadow-primary/10 transition-all hover:scale-[1.02]"
                >
                  Close Review
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IopStat({ label, value, sub, color, icon: Icon, trend }: { label: string; value: any; sub: string; color: string; icon: any; trend?: 'high' | 'normal' }) {
  const colors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-100/50 dark:border-blue-800/50",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/30 border-purple-100/50 dark:border-purple-800/50",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100/50 dark:border-indigo-800/50",
    cyan: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 border-cyan-100/50 dark:border-cyan-800/50",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm group hover:scale-[1.02] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors[color])}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        {trend && (
          <span className={cn(
            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
            trend === 'high' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
          )}>
            {trend === 'high' ? 'High Risk' : 'Healthy'}
          </span>
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
          <span className="text-[10px] font-black text-slate-400 uppercase">{sub}</span>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  const [textColor, bgColor] = color.split(' ');
  return (
    <div className={cn("flex gap-5 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none bg-white dark:bg-slate-900 group")}>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", textColor, bgColor)}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1.5">
          {value}
        </p>
        <p className="text-[10px] font-bold text-slate-400">
          {label}
        </p>
      </div>
    </div>
  );
}

function PermissionToggle({ id, type, enabled }: { id: string; type: 'chat' | 'test'; enabled: boolean }) {
  const { mutate, isPending } = useTogglePermission();

  return (
    <Switch
      checked={enabled}
      onCheckedChange={(val) => mutate({ id, type, enabled: val })}
      disabled={isPending}
    />
  );
}
