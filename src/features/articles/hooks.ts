import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from './api';
import toast from 'react-hot-toast';

export function useArticles(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => articlesApi.getAll(params),
  });
}

export function useMyArticles(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['my-articles', params],
    queryFn: () => articlesApi.getMine(params),
  });
}

export function useArticleDetail(id: string) {
  return useQuery({
    queryKey: ['articles', id],
    queryFn: () => articlesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => articlesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      toast.success('Article created successfully');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to create article');
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      articlesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      toast.success('Article updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to update article');
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      toast.success('Article deleted');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to delete article');
    },
  });
}
