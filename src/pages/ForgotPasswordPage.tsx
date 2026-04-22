import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useForgotPassword } from '@/features/auth/hooks';

const forgotSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const forgotMutation = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = (data: ForgotForm) => {
    forgotMutation.mutate(data);
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-primary">Forgot Password</h2>
        <p className="text-text-secondary mt-2">
          Enter your email or phone number and we'll send you a verification code
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Email or Phone</label>
          <input
            {...register('identifier')}
            type="text"
            placeholder="doctor@clinic.com"
            className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
          {errors.identifier && <p className="text-danger-500 text-xs mt-1">{errors.identifier.message}</p>}
        </div>

        <button
          type="submit"
          disabled={forgotMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary-500/25 disabled:opacity-60"
        >
          {forgotMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Reset Code <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-8">
        Remember your password?{' '}
        <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">Sign In</Link>
      </p>
    </div>
  );
}
