import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi } from './api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export function useDoctorProfile() {
  return useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorsApi.getMe(),
  });
}

export function useUpdateDoctorProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => doctorsApi.updateProfile(data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
      
      const updatedData = response.data;
      if (updatedData) {
        const currentUser = useAuthStore.getState().user;
        updateUser({
           name: updatedData.userId?.name || currentUser?.name,
           avatarUrl: updatedData.avatarUrl || updatedData.userId?.avatarUrl || currentUser?.avatarUrl,
           doctor: updatedData
        });
      }
      
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to update profile');
    },
  });
}
