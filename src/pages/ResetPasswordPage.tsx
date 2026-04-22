import { useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useResetPassword } from '@/features/auth/hooks';

const resetSchema = z.object({
  newPassword: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs a number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const target = (location.state as any)?.target || '';
  const code = (location.state as any)?.code || '';
  const resetMutation = useResetPassword();

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = (data: ResetForm) => {
    resetMutation.mutate({ target, code, newPassword: data.newPassword });
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-primary">Reset Password</h2>
        <p className="text-text-secondary mt-2">Create a new secure password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">New Password</label>
          <div className="relative">
            <input {...register('newPassword')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && <p className="text-danger-500 text-xs mt-1">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Confirm Password</label>
          <input {...register('confirmPassword')} type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          {errors.confirmPassword && <p className="text-danger-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={resetMutation.isPending} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary-500/25 disabled:opacity-60">
          {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-8">
        <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">Back to Sign In</Link>
      </p>
    </div>
  );
}
