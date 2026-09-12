import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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

export function useExportPatientData() {
  return useMutation({
    mutationFn: ({ id }: { id: string; fileName?: string }) => patientsApi.exportData(id),
    onSuccess: (blob: any, { fileName }) => {
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `patient_report_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Patient data downloaded');
    },
    onError: () => {
      toast.error('Failed to download patient data');
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
