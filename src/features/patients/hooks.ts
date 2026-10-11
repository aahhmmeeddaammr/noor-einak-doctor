import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { patientsApi } from './api';

export function usePatients(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientsApi.getAll(params),
    refetchInterval: 30_000,
  });
}

export function usePatientDetail(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId],
    queryFn: () => patientsApi.getById(patientId),
    enabled: !!patientId,
    refetchInterval: 30_000,
  });
}

export function useTogglePermission() {
  const queryClient = useQueryClient();
  const permissionField = (type: 'chat' | 'test') => type === 'chat' ? 'canChat' : 'canUploadTests';
  
  return useMutation({
    mutationFn: ({ id, type, enabled }: { id: string; type: 'chat' | 'test'; enabled: boolean }) =>
      patientsApi.togglePermission(id, type, enabled),
    onMutate: async ({ id, type, enabled }) => {
      const queryKey = ['patients', id];
      await queryClient.cancelQueries({ queryKey, exact: true });
      const previous = queryClient.getQueryData<any>(queryKey);
      queryClient.setQueryData(queryKey, (current: any) => current?.data
        ? { ...current, data: { ...current.data, [permissionField(type)]: enabled } }
        : current);
      return { previousValue: previous?.data?.[permissionField(type)] as boolean | undefined };
    },
    onError: (_, { id, type }, context) => {
      if (context?.previousValue !== undefined) {
        queryClient.setQueryData(['patients', id], (current: any) => current?.data
          ? { ...current, data: { ...current.data, [permissionField(type)]: context.previousValue } }
          : current);
      }
    },
    onSuccess: (response: any, { id, type, enabled }) => {
      queryClient.setQueryData(['patients', id], (current: any) => current?.data
        ? { ...current, data: { ...current.data, [permissionField(type)]: response?.data?.[permissionField(type)] ?? enabled } }
        : current);
      queryClient.invalidateQueries({ queryKey: ['patients'], exact: true });
    },
  });
}
export function useBulkPermissions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { canChat?: boolean, canUploadTests?: boolean }) =>
      patientsApi.bulkPermissions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
export function usePatientReminders(patientId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['patients', patientId, 'reminders', params],
    queryFn: () => patientsApi.getReminders(patientId, params),
    enabled: !!patientId,
  });
}
export function useUpdateMedicalInfo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { allergies?: string; medicalNotes?: string } }) =>
      patientsApi.updateMedicalInfo(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['patients', id] });
    },
  });
}

export function useCreatePatientMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        titleAr: string;
        titleEn: string;
        description?: string;
        doctorNotes?: string;
        category: 'test_result';
        testType: string;
        testDate: string;
        fileUrl?: string;
        fileType?: string;
        fileSize?: number;
        eye: 'Left' | 'Right' | 'Both';
        iopOD?: number;
        iopOS?: number;
      };
    }) => patientsApi.createMedicalRecord(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['patients', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Analysis uploaded and approved');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to upload analysis');
    },
  });
}
