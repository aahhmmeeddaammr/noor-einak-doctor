import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRegister } from '@/features/auth/hooks';

const registerSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(100),
  email: z.email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Needs uppercase')
    .regex(/[0-9]/, 'Needs a number'),
  confirmPassword: z.string(),
  clinic: z.object({
    name: z.string().min(2, 'Clinic name is required'),
    address: z.string().min(5, 'Clinic address is required'),
    phone: z.string().min(10, 'Clinic phone is required'),
    addressLink: z.string().optional(),
  }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const registerMutation = useRegister();

  const { register, handleSubmit, formState: { errors }, trigger } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const nextStep = async () => {
    const valid = await trigger(['name', 'email', 'phone', 'password', 'confirmPassword']);
    if (valid) setStep(2);
  };

  const onSubmit = (data: RegisterForm) => {
    const { confirmPassword: _, ...payload } = data;
    registerMutation.mutate({ ...payload, specialization: 'Ophthalmology' });
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-primary">Create Account</h2>
        <p className="text-text-secondary mt-2">Register as a doctor on Noor Einak</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-surface text-text-muted border border-border'}`}>1</div>
          <span className="text-sm font-medium text-text-primary hidden sm:block">Account Info</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-surface text-text-muted border border-border'}`}>2</div>
          <span className="text-sm font-medium text-text-secondary hidden sm:block">Professional</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Full Name <span className="text-danger-500">*</span>
              </label>
              <input {...register('name')} placeholder="Sarah Ahmed" className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Email <span className="text-danger-500">*</span>
              </label>
              <input {...register('email')} type="email" placeholder="doctor@clinic.com" className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              {errors.email && <p className="text-danger-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Phone <span className="text-danger-500">*</span>
              </label>
              <input {...register('phone')} type="tel" placeholder="+20 01XXXXXXXXX" className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              {errors.phone && <p className="text-danger-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Password <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-danger-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Confirm Password <span className="text-danger-500">*</span>
              </label>
              <input {...register('confirmPassword')} type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              {errors.confirmPassword && <p className="text-danger-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="button" onClick={nextStep} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary-500/25">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Clinic Name <span className="text-danger-500">*</span>
              </label>
              <input {...register('clinic.name')} placeholder="Cairo Eye Center" className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              {errors.clinic?.name && <p className="text-danger-500 text-xs mt-1">{errors.clinic.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Clinic Address <span className="text-danger-500">*</span>
              </label>
              <input {...register('clinic.address')} placeholder="Nile Street, Cairo, Egypt" className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              {errors.clinic?.address && <p className="text-danger-500 text-xs mt-1">{errors.clinic.address.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                        Clinic Phone <span className="text-danger-500">*</span>
                    </label>
                    <input {...register('clinic.phone')} type="tel" placeholder="+20212345678" className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                    {errors.clinic?.phone && <p className="text-danger-500 text-xs mt-1">{errors.clinic.phone.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Map Link (optional)</label>
                    <input {...register('clinic.addressLink')} placeholder="Google Maps URL" className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 px-4 py-3 bg-surface hover:bg-gray-100 text-text-primary rounded-lg text-sm font-semibold transition-all border border-border">
                Back
              </button>
              <button type="submit" disabled={registerMutation.isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary-500/25 disabled:opacity-60">
                {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-text-secondary mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">Sign In</Link>
      </p>
    </div>
  );
}
