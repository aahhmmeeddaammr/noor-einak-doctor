import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ChevronRight, Loader2, Mail, Fingerprint, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useLogin } from '@/features/auth/hooks';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="animate-fadeIn space-y-10">
      <div className="space-y-3">
        <h2 className="text-3xl font-black tracking-tighter text-[#020617] dark:text-white">Doctor Login</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Enter your credentials to access your portal.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* identifier */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Email or Phone
            </label>
            <div className="relative group/input">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within/input:text-[#3e4998] transition-colors" size={20} />
              <Input
                {...register('identifier')}
                type="text"
                placeholder="doctor@clinic.com"
                className="h-14 pl-12 bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl text-base font-bold focus:ring-4 focus:ring-[#3e4998]/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
              />
            </div>
            {errors.identifier && (
              <p className="text-rose-500 text-xs font-bold mt-1 px-2">{errors.identifier.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Password
              </label>
              <Link to="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-[#3e4998] dark:text-blue-400 hover:opacity-80 transition-opacity">
                Forgot Password?
              </Link>
            </div>
            <div className="relative group/input">
              <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within/input:text-[#3e4998] transition-colors" size={20} />
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="h-14 pl-12 pr-12 bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl text-base font-bold focus:ring-4 focus:ring-[#3e4998]/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 hover:text-[#3e4998] transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-rose-500 text-xs font-bold mt-1 px-2">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group cursor-pointer transition-colors hover:border-[#3e4998]/30">
          <div className="relative flex items-center justify-center">
            <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-white/10 checked:bg-[#3e4998] checked:border-[#3e4998] transition-all cursor-pointer" />
            <ShieldCheck className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" size={14} />
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Remember me for 24 hours</span>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full h-14 bg-[#020617] dark:bg-[#3e4998] hover:bg-slate-900 dark:hover:bg-primary-600 text-white rounded-2xl font-black text-lg tracking-tight shadow-xl shadow-[#3e4998]/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loginMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span>Log In</span>
              <ChevronRight size={20} />
            </>
          )}
        </Button>
      </form>

      <div className="pt-8 border-t border-slate-100 dark:border-white/5 text-center px-8">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#3e4998] dark:text-blue-400 font-black">
            Register for access
          </Link>
        </p>
      </div>

      <div className="pt-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-relaxed">
          Protected by Noor Einak Secure Login. <br /> Use only authorized credentials.
        </p>
      </div>
    </div>
  );
}
