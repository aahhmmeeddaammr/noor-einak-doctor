import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionsApi } from './api';
import toast from 'react-hot-toast';

export function usePrescriptions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['prescriptions', params],
    queryFn: () => prescriptionsApi.getAll(params),
  });
}

export function usePrescriptionDetail(id: string) {
  return useQuery({
    queryKey: ['prescriptions', id],
    queryFn: () => prescriptionsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => prescriptionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Prescription created successfully');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to create prescription');
    },
  });
}

export function useCancelPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => prescriptionsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success('Prescription cancelled');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to cancel prescription');
    },
  });
}
