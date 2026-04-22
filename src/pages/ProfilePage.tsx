import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDoctorProfile, useUpdateDoctorProfile } from '@/features/doctors/hooks';
import { Briefcase, MapPin, Phone, Award, Loader2, Save, Camera, Shield, User as UserIcon, Building2, FileText, ChevronRight, CheckCircle2, Info, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useChangePassword } from '@/features/auth/hooks';
import { Lock, KeyRound, Eye, EyeOff } from 'lucide-react';

const profileSchema = z.object({
  yearsOfExperience: z.number().min(0, 'Experience must be positive'),
  bio: z.string().optional(),
  clinic: z.object({
    name: z.string().min(2, 'Clinic name is required'),
    address: z.string().min(5, 'Clinic address is required'),
    phone: z.string().min(10, 'Clinic phone is required'),
    addressLink: z.string().optional(),
  }),
  phone: z.string().min(10, 'Personal phone is required'),
  avatarUrl: z.string().optional(),
  coverUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface DoctorProfile {
  _id: string;
  specialization?: string;
  yearsOfExperience?: number;
  bio?: string;
  clinic?: {
    name?: string;
    address?: string;
    phone?: string;
    addressLink?: string;
  };
  avatarUrl?: string;
  coverUrl?: string;
  doctorCode?: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
}

export default function ProfilePage() {
  const { data: profileData, isLoading } = useDoctorProfile();
  const updateMutation = useUpdateDoctorProfile();
  const doctor = (profileData as any)?.data as DoctorProfile;
  const user = useAuthStore((s) => s.user);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });

  const avatarUrl = watch('avatarUrl');
  const coverUrl = watch('coverUrl');
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);

  // Password Change Form
  const changePasswordMutation = useChangePassword();
  const { 
    register: regPass, 
    handleSubmit: handlePassSubmit, 
    reset: resetPass, 
    formState: { errors: passErrors } 
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = (values: PasswordFormValues) => {
    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    }, {
      onSuccess: () => resetPass(),
    });
  };

  useEffect(() => {
    if (doctor) {
      reset({
        yearsOfExperience: doctor?.yearsOfExperience || 0,
        bio: doctor?.bio || '',
        clinic: {
          name: doctor?.clinic?.name || '',
          address: doctor?.clinic?.address || '',
          phone: doctor?.clinic?.phone || '',
          addressLink: doctor?.clinic?.addressLink || '',
        },
        phone: doctor?.userId?.phone || '',
        avatarUrl: doctor?.avatarUrl || doctor?.userId?.avatarUrl || '',
        coverUrl: doctor?.coverUrl || '',
      });
    }
  }, [doctor, reset]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedAvatar(file);
    setValue('avatarUrl', URL.createObjectURL(file), { shouldDirty: true });
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedCover(file);
    setValue('coverUrl', URL.createObjectURL(file), { shouldDirty: true });
  };

  const onSubmit = (values: ProfileFormValues) => {
    // If no images are selected, we can send as plain JSON
    if (!selectedAvatar && !selectedCover) {
      updateMutation.mutate({ ...values, phone: values.phone, specialization: 'Ophthalmology' } as any);
      return;
    }

    // Otherwise use FormData for file upload
    const formData = new FormData();
    
    // For simple fields
    formData.append('specialization', 'Ophthalmology');
    formData.append('phone', values.phone);
    formData.append('yearsOfExperience', values.yearsOfExperience.toString());
    if (values.bio) formData.append('bio', values.bio);
    
    // For nested object, we should probably send individual fields or stringify
    // To match backend expectant layout, we use flat keys or nested-aware parser
    // Since we control both, let's flat map it for multer or send as JSON if possible
    // Actually, common multer-friendly way is sending strings for objects
    if (values.clinic) {
        formData.append('clinic[name]', values.clinic.name);
        formData.append('clinic[address]', values.clinic.address);
        formData.append('clinic[phone]', values.clinic.phone);
        if (values.clinic.addressLink) formData.append('clinic[addressLink]', values.clinic.addressLink);
    }

    if (selectedAvatar) {
      formData.append('avatar', selectedAvatar);
    }

    if (selectedCover) {
      formData.append('cover', selectedCover);
    }

    updateMutation.mutate(formData as any);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-8">
        <div className="w-full h-80 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-400 mx-auto">
            <div className="lg:col-span-2 h-150 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
            <div className="h-100 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fadeIn">
        <div className="max-w-400 mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              {/* Design System Header (Cover & Overlapping Avatar) */}
              <div className="relative group">
                   {/* Cover Photo */}
                   <div className="h-64 md:h-80 w-full relative overflow-hidden rounded-4xl shadow-xl border border-slate-200 dark:border-slate-800">
                      <img 
                        src={coverUrl || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop"} 
                        alt="Clinic Profile" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none" />
                      
                      {/* Centered Change Cover Button for better accessibility */}
                      <label className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 shadow-2xl px-6 py-3 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all z-30 border border-white/20 opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                          <Camera className="w-5 h-5 text-primary" />
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">Update cover photo</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                      </label>
                   </div>

                   {/* Avatar persona container */}
                   <div className="max-w-6xl mx-auto px-6 md:px-12 -mt-16 relative z-40 flex flex-col md:flex-row items-center md:items-end gap-6">
                      <div className="relative">
                          <Avatar className="w-40 h-40 border-[6px] bg-white border-white dark:border-slate-950 shadow-2xl">
                              <AvatarImage src={avatarUrl} className="object-cover" />
                              <AvatarFallback className="bg-primary/5 text-primary text-4xl font-bold">
                                  {user?.name?.charAt(0)}
                              </AvatarFallback>
                          </Avatar>
                          <label className="absolute bottom-2 right-2 p-3 bg-primary text-white rounded-xl shadow-xl cursor-pointer hover:bg-primary/90 transition-all border-4 border-white dark:border-slate-950">
                              <Camera className="w-5 h-5" />
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                          </label>
                      </div>
                      
                      <div className="text-center md:text-left md:pb-4 flex-1">
                          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                              Dr. {user?.name}
                          </h2>
                          <div className="flex items-center justify-center md:justify-start gap-4">
                              <span className="text-primary font-bold flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full text-xs uppercase tracking-wider">
                                  <Briefcase size={14} className="text-primary" />
                                  Ophthalmology
                              </span>
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                              <span className="text-slate-500 font-medium flex items-center gap-2 text-sm">
                                  <Award size={16} className="text-amber-500" />
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{doctor?.yearsOfExperience || 0}</span>
                                  <span>years experience</span>
                              </span>
                          </div>
                      </div>
                   </div>
              </div>

              {/* Content Body Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Main Information (8/12) */}
                  <div className="lg:col-span-8 space-y-6">
                      {/* Bio Section */}
                      <section className="bg-white dark:bg-slate-900 rounded-4xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                             <FileText size={20} className="text-primary" />
                             About your practice
                          </h3>
                          <div className="space-y-4">
                              <label className="text-xs font-semibold text-slate-500 block mb-1">Professional biography</label>
                              <textarea
                                  {...register('bio')}
                                  rows={5}
                                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-base text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none leading-relaxed"
                                  placeholder="Describe your clinical expertise and patient approach..."
                              />
                              <div className="flex items-start gap-2 text-slate-400 text-xs mt-2 px-1">
                                  <Info size={14} className="mt-0.5" />
                                  <span>This content is visible to patients in your public profile.</span>
                              </div>
                          </div>
                      </section>

                      {/* Clinic Details Section */}
                      <section className="bg-white dark:bg-slate-900 rounded-4xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                             <Building2 size={20} className="text-primary" />
                             Clinic and contact info
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-2">
                                   <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block px-1">
                                       Clinic name <span className="text-rose-500 font-bold">*</span>
                                   </label>
                                   <div className="relative">
                                       <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                       <input
                                           {...register('clinic.name')}
                                           className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                                           placeholder="e.g. City Eye Care"
                                       />
                                   </div>
                                   {errors.clinic?.name?.message && <p className="text-xs text-rose-500 font-medium px-1">{errors.clinic.name?.message}</p>}
                               </div>

                               <div className="space-y-2">
                                   <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block px-1">
                                       Clinic phone <span className="text-rose-500 font-bold">*</span>
                                   </label>
                                   <div className="relative">
                                       <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                       <input
                                           {...register('clinic.phone')}
                                           className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                                           placeholder="+20 1XX XXX XXXX"
                                       />
                                   </div>
                                   {errors.clinic?.phone?.message && <p className="text-xs text-rose-500 font-medium px-1">{errors.clinic.phone?.message}</p>}
                               </div>

                               <div className="space-y-2">
                                   <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block px-1">
                                       Physical address <span className="text-rose-500 font-bold">*</span>
                                   </label>
                                   <div className="relative">
                                       <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                       <input
                                           {...register('clinic.address')}
                                           className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                                           placeholder="Full address of your main practice"
                                       />
                                   </div>
                                   {errors.clinic?.address?.message && <p className="text-xs text-rose-500 font-medium px-1">{errors.clinic.address?.message}</p>}
                               </div>

                               <div className="space-y-2">
                                   <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block px-1">Maps location link (URL)</label>
                                   <div className="relative">
                                       <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                       <input
                                           {...register('clinic.addressLink')}
                                           className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                                           placeholder="HTTPS link to Google Maps or similar"
                                       />
                                   </div>
                               </div>
                           </div>
                     </section>

                    {/* Security Section (Change Password) */}
                    <section className="bg-white dark:bg-slate-900 rounded-4xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                           <Lock size={20} className="text-primary" />
                           Security settings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block px-1">Current password</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        {...regPass('currentPassword')}
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                                        placeholder="Enter your current password"
                                    />
                                </div>
                                {passErrors.currentPassword && <p className="text-xs text-rose-500 font-medium px-1">{passErrors.currentPassword.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block px-1">New password</label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        {...regPass('newPassword')}
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                                        placeholder="Min. 8 characters"
                                    />
                                </div>
                                {passErrors.newPassword && <p className="text-xs text-rose-500 font-medium px-1">{passErrors.newPassword.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block px-1">Confirm new password</label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        {...regPass('confirmPassword')}
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                                        placeholder="Repeat new password"
                                    />
                                </div>
                                {passErrors.confirmPassword && <p className="text-xs text-rose-500 font-medium px-1">{passErrors.confirmPassword.message}</p>}
                            </div>

                            <div className="md:col-span-2 pt-2">
                                <Button 
                                    type="button"
                                    onClick={handlePassSubmit(onPasswordSubmit)}
                                    disabled={changePasswordMutation.isPending}
                                    className="bg-[#3e4998] text-white rounded-xl h-12 px-8 font-bold text-xs shadow-lg shadow-[#3e4998]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                                >
                                    {changePasswordMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                    <span>Update password</span>
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>

                  {/* Sidebar (4/12) */}
                  <div className="lg:col-span-4 space-y-6">
                      {/* Expertise Card */}
                      <div className="bg-white dark:bg-slate-900 rounded-4xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                             <UserIcon size={20} className="text-primary" />
                             Personal Information
                          </h3>
                          <div className="space-y-6">
                              <div className="space-y-2">
                                  <label className="text-xs font-semibold text-slate-500 block px-1">
                                      Personal phone <span className="text-rose-500 font-bold">*</span>
                                  </label>
                                  <div className="relative">
                                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input
                                          {...register('phone')}
                                          className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary transition-all outline-none"
                                          placeholder="+20 1XX XXX XXXX"
                                      />
                                  </div>
                                  {errors.phone?.message && <p className="text-xs text-rose-500 font-medium px-1">{errors.phone?.message}</p>}
                              </div>


                              <div className="space-y-2">
                                  <label className="text-xs font-semibold text-slate-500 block px-1">
                                      Years of experience <span className="text-rose-500 font-bold">*</span>
                                  </label>
                                  <div className="relative">
                                      <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input
                                          type="number"
                                          {...register('yearsOfExperience', { valueAsNumber: true })}
                                          className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary transition-all outline-none"
                                      />
                                  </div>
                                  {errors.yearsOfExperience && <p className="text-xs text-rose-500 font-medium px-1">{errors.yearsOfExperience.message}</p>}
                              </div>
                          </div>
                      </div>

                      {/* Status Card - Highlighted Pharco Style */}
                      <div className="bg-[#3e4998]/3 dark:bg-[#3e4998]/8 rounded-4xl p-8 border border-[#3e4998]/10 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 opacity-[0.03] dark:opacity-[0.07] group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                            <Shield size={160} className="text-[#3e4998]" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-[#3e4998]">Account verification</h3>
                                <div className="p-2 bg-[#3e4998]/10 rounded-xl">
                                    <Shield className="text-[#3e4998]" size={20} />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-[#3e4998]/60 uppercase tracking-widest">Email address</p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{user?.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-[#3e4998]/60 uppercase tracking-widest">Verification ID</p>
                                    <p className="text-sm font-bold text-[#3e4998] font-mono">{doctor?.doctorCode || 'Pending'}</p>
                                </div>
                            </div>
                        </div>
                  </div>
                </div>
            </div>
          </form>
        </div>
      </div>

      {/* Compact Floating Control Bar - Bottom Right */}
      <div className={cn(
        "fixed bottom-8 right-8 z-100 flex items-center gap-3 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-[#3e4998]/20 shadow-[0_15px_40px_rgba(62,73,152,0.25)] transition-all duration-500 ease-out",
        (isDirty || selectedAvatar || selectedCover) ? "translate-y-0 opacity-100 scale-100" : "translate-y-16 opacity-0 scale-90 pointer-events-none"
      )}>
        <div className="items-center gap-2 pl-4 pr-3 border-r border-[#3e4998]/10 hidden sm:flex">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-[#3e4998]">Unsaved changes</span>
        </div>
        
        <div className="flex items-center gap-2">
            <Button 
                variant="ghost" 
                onClick={() => {
                    reset();
                    setSelectedAvatar(null);
                    setSelectedCover(null);
                }}
                disabled={updateMutation.isPending}
                className="rounded-xl h-10 px-4 text-xs font-bold text-slate-500 hover:text-[#3e4998] hover:bg-[#3e4998]/5"
            >
                Discard
            </Button>
            <Button 
                onClick={handleSubmit(onSubmit)}
                disabled={updateMutation.isPending}
                className="bg-[#3e4998] text-white rounded-xl h-10 px-6 font-bold text-xs shadow-lg shadow-[#3e4998]/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group border-none"
            >
                {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Sync profile</span>
            </Button>
        </div>
      </div>
    </>
  );
}
