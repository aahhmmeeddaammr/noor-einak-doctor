import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from './api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (response: any) => {
      setAuth({
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
      toast.success('Welcome back!');
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Invalid credentials');
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.registerDoctor,
    onSuccess: (_response: any, variables: any) => {
      toast.success('Registration successful! Please verify your email.');
      navigate('/otp', { state: { target: variables.email, purpose: 'registration' } });
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Registration failed');
    },
  });
}

export function useVerifyOtp() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: (response: any) => {
      if (response.data.accessToken) {
        setAuth({
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        });
        navigate('/');
      }
      toast.success('Verification successful!');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Invalid OTP');
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: authApi.resendOtp,
    onSuccess: () => {
      toast.success('OTP resent successfully');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to resend OTP');
    },
  });
}

export function useForgotPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (_: any, variables: any) => {
      toast.success('Reset code sent!');
      navigate('/otp', { state: { target: variables.identifier, purpose: 'password_reset' } });
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to send reset code');
    },
  });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success('Password reset successful!');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to reset password');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to change password');
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  return useMutation({
    mutationFn: () => authApi.logout({ refreshToken: refreshToken || '' }),
    onSettled: () => {
      logout();
      window.location.href = '/login';
    },
  });
}
