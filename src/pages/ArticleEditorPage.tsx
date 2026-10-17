import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Save, BookOpen, Image as ImageIcon,
  FileText, Compass, AlignLeft, Loader2,
} from 'lucide-react';
import { useArticleDetail, useCreateArticle, useUpdateArticle } from '@/features/articles/hooks';
import { cn } from '@/lib/utils';
import ImageUpload from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const articleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['draft', 'published', 'archived']),
  coverImage: z.any().optional(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['image'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
  'list', 'bullet', 'image', 'color', 'background',
];

export default function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      summary: '',
      content: '',
      category: 'Information',
      coverImage: '',
      status: 'published',
    },
  });

  const { data: rawArticle, isLoading: isLoadingArticle } = useArticleDetail(id || '');
  const article = (rawArticle as any)?.data ?? rawArticle;

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();

  useEffect(() => {
    if (isEditMode && article) {
      reset({
        title: article.title || '',
        summary: article.summary || '',
        content: article.content || '',
        category: article.category || 'Information',
        coverImage: article.coverImage || '',
        status: article.status || 'published',
      });
    }
  }, [isEditMode, article, reset]);

  const handleFormSubmit = async (values: ArticleFormValues) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('content', values.content);
    formData.append('category', values.category);
    formData.append('status', values.status || 'published');
    if (values.summary) formData.append('summary', values.summary);

    if (values.coverImage instanceof File) {
      formData.append('thumbnail', values.coverImage);
    }

    if (isEditMode && id) {
      updateMutation.mutate(
        { id, data: formData as any },
        {
          onSuccess: () => {
            navigate(`/articles/${id}`);
          },
        }
      );
    } else {
      const slug = values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
      formData.append('slug', slug);
      createMutation.mutate(formData as any, {
        onSuccess: (res: any) => {
          const createdId = res?.data?._id || res?.data?.id || res?._id;
          if (createdId) {
            navigate(`/articles/${createdId}`);
          } else {
            navigate('/articles');
          }
        },
      });
    }
  };

  if (isEditMode && isLoadingArticle) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
          <div className="absolute inset-0 rounded-full border-4 border-[#3e4998] border-t-transparent animate-spin" />
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Article Details...</span>
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="animate-fadeIn text-slate-900 dark:text-slate-100 flex flex-col min-h-screen -mx-4 sm:-mx-6 -mt-6">
      {/* Sticky Top Header Bar (Admin Style) */}
      <div className="sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl h-9 w-9 p-0 text-slate-500 hover:text-[#3e4998] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => navigate(isEditMode && id ? `/articles/${id}` : '/articles')}
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 leading-tight">
              <BookOpen size={20} className="text-[#3e4998] dark:text-blue-400" />
              {isEditMode ? 'Edit Article' : 'New Article'}
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {isEditMode ? `Modifying article: ${article?.title || id}` : 'Share medical knowledge and scientific insights with patients'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl h-10 px-4 text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => navigate(isEditMode && id ? `/articles/${id}` : '/articles')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="rounded-xl h-10 px-5 text-xs font-bold bg-[#3e4998] hover:bg-[#343d80] text-white shadow-sm flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving changes...' : (isEditMode ? 'Save Changes' : 'Publish Article')}
          </Button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="p-4 sm:p-6 pb-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Composition Column (Left - 8 Cols / ~70%) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden flex flex-col min-h-[580px]">
              
              {/* Title Input field */}
              <div className="px-6 pt-6 pb-4 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Article Title *</label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="Enter a descriptive clinical title..."
                  className={cn(
                    "w-full bg-transparent text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white border-0 border-b border-slate-100 dark:border-slate-800 focus:border-[#3e4998] dark:focus:border-blue-400 outline-none pb-3 transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-700",
                    errors.title && "border-red-500 focus:border-red-500"
                  )}
                />
                {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
              </div>

              {/* Composition Body Header */}
              <div className="flex-1 flex flex-col">
                <div className="px-6 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={12} className="text-[#3e4998] dark:text-blue-400" />
                    Composition Body *
                  </span>
                </div>
                
                {/* ReactQuill Editor */}
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <div className="flex-1 flex flex-col">
                      <ReactQuill
                        theme="snow"
                        value={field.value}
                        onChange={field.onChange}
                        modules={QUILL_MODULES}
                        formats={QUILL_FORMATS}
                        className="flex-1 flex flex-col [&>.ql-toolbar]:border-0 [&>.ql-toolbar]:border-b [&>.ql-toolbar]:border-slate-100 [&>.ql-toolbar]:dark:border-slate-800/80 [&>.ql-toolbar]:bg-slate-50/40 [&>.ql-toolbar]:dark:bg-slate-900/30 [&>.ql-container]:border-0 [&>.ql-container]:flex-1 [&>.ql-container]:text-sm [&>.ql-editor]:min-h-[420px] [&>.ql-editor]:px-6 [&>.ql-editor]:py-4 [&>.ql-editor]:text-slate-800 [&>.ql-editor]:dark:text-slate-200 [&>.ql-editor]:leading-relaxed"
                        placeholder="Start typing your medical insights, clinical guidelines, or recommendations here..."
                      />
                    </div>
                  )}
                />
                {errors.content && (
                  <div className="px-6 pb-4">
                    <p className="text-xs text-red-500 font-medium">{errors.content.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Sidebar Column (Right - 4 Cols / ~30%) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Publication Settings Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-4">
              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={14} className="text-[#3e4998] dark:text-blue-400" />
                Publication Settings
              </h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category *</label>
                  <select
                    {...register('category')}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold focus:ring-2 focus:ring-[#3e4998]/20 focus:border-[#3e4998] outline-none transition-all cursor-pointer"
                  >
                    <option value="Information">General Information</option>
                    <option value="Research">Clinical Research</option>
                    <option value="Tips">Health Tips</option>
                    <option value="Technology">MedTech</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visibility Status *</label>
                  <select
                    {...register('status')}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold focus:ring-2 focus:ring-[#3e4998]/20 focus:border-[#3e4998] outline-none transition-all cursor-pointer"
                  >
                    <option value="published">Live Public</option>
                    <option value="draft">Internal Draft</option>
                    <option value="archived">Archived / Hidden</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cover Creative Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-3">
              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon size={14} className="text-[#3e4998] dark:text-blue-400" />
                Cover Media
              </h4>
              <div className="space-y-2">
                <Controller
                  name="coverImage"
                  control={control}
                  render={({ field }) => (
                    <ImageUpload
                      label=""
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                  Upload a high-quality cover photo to attract readers. Horizontal landscape images work best.
                </p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-3">
              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                <AlignLeft size={14} className="text-[#3e4998] dark:text-blue-400" />
                Executive Summary *
              </h4>
              <div className="space-y-2">
                <textarea
                  {...register('summary')}
                  rows={4}
                  className={cn(
                    "w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs font-medium focus:ring-2 focus:ring-[#3e4998]/20 focus:border-[#3e4998] outline-none leading-relaxed resize-none transition-all",
                    errors.summary && "border-red-500 focus:border-red-500"
                  )}
                  placeholder="Write a concise clinical summary (minimum 10 characters) outlining key takeaways..."
                />
                {errors.summary && <p className="text-xs text-red-500 font-medium">{errors.summary.message}</p>}
              </div>
            </div>

          </div>
        </div>
      </div>
    </form>
  );
}
