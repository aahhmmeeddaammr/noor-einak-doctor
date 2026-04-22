import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useVerifyOtp, useResendOtp } from '@/features/auth/hooks';
import { useState, useRef, useEffect } from 'react';

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type OtpForm = z.infer<typeof otpSchema>;

export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const target = (location.state as any)?.target || '';
  const purpose = (location.state as any)?.purpose || 'registration';
  const verifyMutation = useVerifyOtp();
  const resendMutation = useResendOtp();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(60);

  const { handleSubmit, setValue } = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    if (!target) navigate('/login');
  }, [target, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setValue('code', newDigits.join(''));

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    pastedData.split('').forEach((char, i) => {
      newDigits[i] = char;
    });

    setDigits(newDigits);
    setValue('code', newDigits.join(''));
    
    // Focus the appropriate input
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const onSubmit = () => {
    const code = digits.join('');
    verifyMutation.mutate({ target, code, purpose });
  };

  const handleResend = () => {
    resendMutation.mutate({ target, purpose });
    setCountdown(60);
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-primary">Verify OTP</h2>
        <p className="text-text-secondary mt-2">
          We've sent a 6-digit code to{' '}
          <span className="font-semibold text-text-primary">{target}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* OTP Inputs */}
        <div className="flex gap-3 justify-center">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-xl font-bold bg-surface rounded-lg border border-border focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={verifyMutation.isPending || digits.join('').length < 6}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary-500/25 disabled:opacity-60"
        >
          {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify <ArrowRight className="w-4 h-4" /></>}
        </button>

        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-sm text-text-muted">
              Resend code in <span className="font-semibold text-primary-500">{countdown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="text-sm text-primary-500 hover:text-primary-600 font-semibold"
            >
              Resend Code
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
