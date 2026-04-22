import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Loader2, X } from 'lucide-react';
import { useCreatePrescription } from '@/features/prescriptions/hooks';
import { usePatientDetail } from '@/features/patients/hooks';
import { cn, getInitials } from '@/lib/utils';

const medicationSchema = z.object({
  name: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  dosage: z.string().min(1, 'Required'),
  frequency: z.number().min(1),
  frequencyUnit: z.string().min(1, 'Required'),
  scheduleTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)).min(1, 'At least one time is required'),
  duration: z.number().optional(),
  instructions: z.string().optional(),
  eyeSide: z.string().optional(),
});

const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Select a patient'),
  title: z.string().min(1, 'Title is required'),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  medications: z.array(medicationSchema).min(1, 'At least one medication'),
});

type PrescriptionForm = z.infer<typeof prescriptionSchema>;


import { Button } from '@/components/ui/Button';

export default function CreatePrescriptionPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const createMutation = useCreatePrescription();
  const { data: patientData } = usePatientDetail(patientId || '');
  const patient = (patientData as any)?.data;

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<PrescriptionForm>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patientId: patientId || '',
      medications: [{ name: '', type: 'eyedrop', dosage: '', frequency: 1, frequencyUnit: 'daily', scheduleTimes: ['08:00'], duration: 30, instructions: '', eyeSide: 'both' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'medications' });
  const watchedMedications = watch('medications');

  const onSubmit = (data: PrescriptionForm) => {
    createMutation.mutate(data, {
      onSuccess: () => navigate('/prescriptions'),
    });
  };

  const inputClass = "w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none placeholder:text-slate-400";
  const labelClass = "block text-[11px] font-bold text-slate-500 mb-2";

  return (
    <div className="animate-fadeIn space-y-8">
      {/* Sticky Action Bar */}
      <div className="sticky -top-8 z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 -mx-8 px-8 py-5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">New Prescription</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Formulate a clinical treatment plan</p>
          </div>
          {patient && (
            <>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
              <div className="hidden md:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                  {getInitials(patient?.user?.name)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {patient?.user?.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 capitalize">
                    {patient?.user?.dateOfBirth ? new Date().getFullYear() - new Date(patient.user.dateOfBirth).getFullYear() + ' yrs' : 'N/A'} • {patient?.user?.gender || 'N/A'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
            type="button"
            className="h-12 px-6 rounded-2xl border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Discard
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 gap-2 h-12 px-8 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] border-none"
          >
            {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            <span>Issue Prescription</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* General Information Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-sm">1</span>
              General Information
            </h3>
          </div>

          <div className="space-y-6">
            {!patientId && (
              <div>
                <label className={labelClass}>Patient ID</label>
                <input {...register('patientId')} placeholder="Enter patient identifier" className={inputClass} />
                {errors.patientId && <p className="text-rose-500 text-xs font-bold mt-2">{errors.patientId.message}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Treatment Title</label>
                <input {...register('title')} placeholder="e.g. Post-op Recovery Plan" className={inputClass} />
                {errors.title && <p className="text-rose-500 text-xs font-bold mt-2">{errors.title.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Clinical Diagnosis</label>
                <input {...register('diagnosis')} placeholder="e.g. Open-angle glaucoma" className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Additional Notes</label>
              <textarea {...register('notes')} rows={3} placeholder="Dietary instructions, follow-up warnings..." className={cn(inputClass, 'resize-none')} />
            </div>
          </div>
        </div>

        {/* Medications Loop */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-sm">2</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Prescribed Medications</h3>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm relative group transition-all hover:border-primary/30">
              
              {/* Header & Remove Action */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Medication #{index + 1}</h4>
                {fields.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => remove(index)} 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 font-bold text-xs transition-colors hover:bg-rose-100 dark:hover:bg-rose-500/20"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>Medication Name</label>
                    <input {...register(`medications.${index}.name`)} placeholder="e.g. Timolol 0.5%" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Administration Type</label>
                    <select {...register(`medications.${index}.type`)} className={inputClass}>
                      <option value="eyedrop">Eye Drops</option>
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="ointment">Ointment</option>
                      <option value="injection">Injection</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Dosage Per Admin</label>
                    <input {...register(`medications.${index}.dosage`)} placeholder="e.g. 1 drop, 500mg" className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className={labelClass}>Frequency</label>
                    <input {...register(`medications.${index}.frequency`, { valueAsNumber: true })} type="number" min={1} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Unit</label>
                    <select {...register(`medications.${index}.frequencyUnit`)} className={inputClass}>
                      <option value="daily">Daily</option>
                      <option value="hourly">Hourly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Eye Side (If Applicable)</label>
                    <select {...register(`medications.${index}.eyeSide`)} className={inputClass}>
                      <option value="both">Both Eyes</option>
                      <option value="left">Left Eye Only</option>
                      <option value="right">Right Eye Only</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Duration (Days)</label>
                    <input {...register(`medications.${index}.duration`, { valueAsNumber: true })} type="number" min={1} placeholder="Optional" className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <label className={labelClass}>Schedule Times</label>
                    <div className="flex flex-wrap items-center gap-3">
                      {watchedMedications[index]?.scheduleTimes?.map((_: string, tIdx: number) => (
                        <div key={tIdx} className="relative group/time">
                          <input 
                             type="time" 
                             {...register(`medications.${index}.scheduleTimes.${tIdx}`)} 
                             className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm outline-none ring-primary/20 focus:ring-4 cursor-pointer" 
                          />
                          {watchedMedications[index].scheduleTimes.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => {
                                const currentTimes = [...watchedMedications[index].scheduleTimes];
                                currentTimes.splice(tIdx, 1);
                                setValue(`medications.${index}.scheduleTimes`, currentTimes);
                              }}
                              className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover/time:opacity-100 transition-opacity"
                            >
                              <X size={10} strokeWidth={4} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const currentTimes = [...(watchedMedications[index].scheduleTimes || [])];
                          currentTimes.push('12:00');
                          setValue(`medications.${index}.scheduleTimes`, currentTimes);
                        }}
                        className="px-4 py-2.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl border border-primary/20 text-sm font-bold flex items-center gap-2 transition-colors"
                      >
                        <Plus size={16} /> Add Time
                      </button>
                    </div>
                    {errors.medications?.[index]?.scheduleTimes && <p className="text-rose-500 text-xs font-bold mt-2">{errors.medications[index]?.scheduleTimes?.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Special Instructions</label>
                    <input {...register(`medications.${index}.instructions`)} placeholder="e.g. Take after meals, shake well" className={inputClass} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => append({ name: '', type: 'eyedrop', dosage: '', frequency: 1, frequencyUnit: 'daily', scheduleTimes: ['08:00'], duration: 30, instructions: '', eyeSide: 'both' })}
            className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group"
          >
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-900 rounded-full flex items-center justify-center mb-3 transition-colors shadow-sm">
              <Plus size={24} strokeWidth={2.5} />
            </div>
            <span className="font-bold">Add Another Medication</span>
          </button>

          {errors.medications?.root && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <p className="text-rose-600 font-bold text-sm text-center">{errors.medications.root.message}</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
