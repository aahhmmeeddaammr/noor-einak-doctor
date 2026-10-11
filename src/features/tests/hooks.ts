import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testsApi } from './api';
import toast from 'react-hot-toast';

export function useTests(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['tests', params],
    queryFn: () => testsApi.getAll(params),
  });
}

export function useTestDetail(id: string) {
  return useQuery({
    queryKey: ['tests', id],
    queryFn: () => testsApi.getById(id),
    enabled: !!id,
  });
}

export function useReviewTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: string; doctorNotes?: string }) =>
      testsApi.review(id, data),
    onSuccess: () => {
      toast.success('Test reviewed successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to review test');
    },
  });
}

export function useUploadTestForPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, data }: { patientId: string; data: FormData }) =>
      testsApi.uploadForPatient(patientId, data),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: ['patients', patientId] });
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Test added to the patient record');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || error.message || 'Failed to add test');
    },
  });
}
