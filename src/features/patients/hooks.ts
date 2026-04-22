import { useQuery } from '@tanstack/react-query';
import { patientsApi } from './api';

export function usePatients(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientsApi.getAll(params),
  });
}

export function usePatientDetail(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId],
    queryFn: () => patientsApi.getById(patientId),
    enabled: !!patientId,
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useTogglePermission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, type, enabled }: { id: string; type: 'chat' | 'test'; enabled: boolean }) =>
      patientsApi.togglePermission(id, type, enabled),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['patients', id] });
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
