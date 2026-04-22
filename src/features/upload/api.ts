import apiClient from '@/lib/api-client';

export const uploadApi = {
  uploadFile: async (file: File): Promise<{
    url: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    publicId?: string;
    thumbnailUrl?: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload/chat-attachment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // The api-client interceptor may or may not unwrap the envelope.
    // Handle both cases defensively.
    const data = response.data?.data ?? response.data;
    if (!data?.url) {
      throw new Error('Upload failed: server did not return a file URL');
    }
    return data;
  },
};
