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
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Test reviewed successfully');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to review test');
    },
  });
}
