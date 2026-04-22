import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useArticles, useMyArticles,
  useDeleteArticle, useCreateArticle, useUpdateArticle,
} from '@/features/articles/hooks';
import {
  Plus, Search, MoreVertical, Edit, Trash2, X,
  BookOpen, Clock, Archive, Globe, User2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import ImageUpload from '@/components/ui/ImageUpload';

const articleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['draft', 'published', 'archived']),
  coverImage: z.any().optional(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

type Tab = 'all' | 'mine';

import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';

export default function ArticlesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [allPage, setAllPage] = useState(1);
  const [myPage, setMyPage] = useState(1);

  // All published articles (read-only tab)
  const { data: allData, isLoading: allLoading } = useArticles({ 
    search: search || undefined,
    category: categoryFilter || undefined,
    status: statusFilter || undefined, // Though 'all' tab usually only shows published in service
    page: allPage,
    limit: 9
  });
  const allArticles = (allData as any)?.data || [];
  const allMeta = (allData as any)?.meta;

  // Doctor's own articles (editable tab)
  const { data: myData, isLoading: myLoading } = useMyArticles({ 
    search: search || undefined,
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
    page: myPage,
    limit: 9
  });
  const myArticles = (myData as any)?.data || [];
  const myMeta = (myData as any)?.meta;

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const deleteMutation = useDeleteArticle();


  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '', summary: '', content: '',
      category: 'Information', status: 'draft', coverImage: '',
    },
  });

  const openAddModal = () => {
    reset({ title: '', summary: '', content: '', category: 'Information', status: 'draft', coverImage: '' });
    setIsAddModalOpen(true);
  };

  const openEditModal = (article: any) => {
    setEditingArticle(article);
    reset({
      title: article.title,
      summary: article.summary || '',
      content: article.content,
      category: article.category,
      status: article.status || 'draft',
      coverImage: article.coverImage || '',
    });
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (values: ArticleFormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key !== 'coverImage' && value !== undefined) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    if (values.coverImage instanceof File) {
      formData.append('thumbnail', values.coverImage);
    }
    
    formData.append('slug', values.title.toLowerCase().replace(/ /g, '-'));

    createMutation.mutate(formData as any, { onSuccess: () => setIsAddModalOpen(false) });
  };

  const handleEditSubmit = async (values: ArticleFormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key !== 'coverImage' && value !== undefined) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    if (values.coverImage instanceof File) {
      formData.append('thumbnail', values.coverImage);
    }

    updateMutation.mutate(
      { id: editingArticle._id, data: formData as any },
      { onSuccess: () => setIsEditModalOpen(false) }
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'archived' : 'published';
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  const isLoading = activeTab === 'all' ? allLoading : myLoading;
  const articles = activeTab === 'all' ? allArticles : myArticles;
  const meta = activeTab === 'all' ? allMeta : myMeta;
  const page = activeTab === 'all' ? allPage : myPage;
  const setPage = activeTab === 'all' ? setAllPage : setMyPage;

  return (
    <div className="space-y-6 animate-fadeIn text-slate-700 dark:text-slate-300">
      
      {/* Primary Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val as Tab); setAllPage(1); setMyPage(1); }} className="w-full">
        <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-[1.25rem] h-auto">
          <TabsTrigger 
            value="all" 
            className="flex items-center gap-2 rounded-xl px-7 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg shadow-primary/5 cursor-pointer text-sm font-bold transition-all data-[state=active]:text-primary dark:data-[state=active]:text-blue-400"
          >
            <Globe size={14} />
            All articles
          </TabsTrigger>
          <TabsTrigger 
            value="mine" 
            className="flex items-center gap-2 rounded-xl px-7 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg shadow-primary/5 cursor-pointer text-sm font-bold transition-all data-[state=active]:text-primary dark:data-[state=active]:text-blue-400"
          >
            <User2 size={14} />
            My articles
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search + Filters Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row justify-between items-center gap-4">
          
          {/* Search Box (Left) */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Find articles..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setAllPage(1); setMyPage(1); }}
              className="w-full pl-11 pr-11 h-11 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-pharco-orange/10 focus:border-pharco-orange outline-none transition-all shadow-sm"
            />
            {search && (
              <button 
                onClick={() => { setSearch(''); setAllPage(1); setMyPage(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={14} className="text-slate-400" />
              </button>
            )}
          </div>

          {/* Filters + Action Group (Right) */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            
            <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setAllPage(1); setMyPage(1); }}
                className="h-9 bg-white dark:bg-slate-900 border-none rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer min-w-30"
              >
                <option value="">All Categories</option>
                <option value="Information">General Information</option>
                <option value="Research">Clinical Research</option>
                <option value="Tips">Health Tips</option>
                <option value="Technology">MedTech</option>
              </select>

              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setAllPage(1); setMyPage(1); }}
                className="h-9 bg-white dark:bg-slate-900 border-none rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer min-w-25"
              >
                <option value="">Any Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {activeTab === 'mine' && (
              <Button
                onClick={openAddModal}
                className="bg-pharco-orange text-white hover:bg-pharco-orange/90 shadow-md gap-2 h-11 px-6 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 border-none group shrink-0"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                <span className="text-sm font-bold">New Article</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl shadow-sm border border-border h-72 animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={activeTab === 'all' ? 'No articles published yet' : 'You haven\'t written any articles yet'}
          description={activeTab === 'all' ? 'Published articles from all doctors will appear here.' : 'Start sharing your medical expertise with patients.'}
          action={activeTab === 'mine' ? {
            label: 'Write your first article',
            onClick: openAddModal,
            icon: Plus
          } : undefined}
          className="mt-6"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article: any) => (
            <div
              key={article._id}
              onClick={() => navigate(`/articles/${article._id}`)}
              className="bg-card rounded-xl shadow-sm border border-border overflow-visible hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 cursor-pointer relative"
            >
              {/* Cover */}
              <div className="h-44 relative overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-t-xl">
                {article.coverImage ? (
                  <img
                    src={article.coverImage}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-[#3e4998]/20 dark:text-blue-400/20">
                    <span className="text-8xl font-black">{article.title?.[0]?.toUpperCase() || 'A'}</span>
                    <span className="absolute bottom-4 text-[10px] uppercase font-black tracking-widest text-[#3e4998]/40">
                      {article.category || 'Article'}
                    </span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm backdrop-blur-sm', getStatusColor(article.status || 'draft'))}>
                    {article.status || 'draft'}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-[#3e4998] transition-colors leading-snug">
                    {article.title}
                  </h3>

                  {/* Actions menu — only on My Articles tab */}
                  {activeTab === 'mine' && (
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border-none bg-transparent outline-none cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1.5 shadow-2xl z-50">
                          <DropdownMenuItem 
                            onClick={() => openEditModal(article)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:bg-[#3e4998] focus:text-white rounded-lg cursor-pointer transition-colors group outline-none"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-400 group-focus:text-white/80" /> Edit
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleStatusToggle(article._id, article.status)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:bg-[#3e4998] focus:text-white rounded-lg cursor-pointer transition-colors group outline-none"
                          >
                            <Archive className="w-3.5 h-3.5 text-slate-400 group-focus:text-white/80" />
                            {article.status === 'published' ? 'Archive' : 'Publish'}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1.5" />
                          
                          <DropdownMenuItem 
                            onClick={() => handleDelete(article._id)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-rose-500 focus:bg-rose-500 focus:text-white rounded-lg cursor-pointer font-bold transition-colors group outline-none"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500 group-focus:text-white" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-medium">
                  {article.summary || article.description}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(article.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pagination
            currentPage={page}
            totalPages={meta?.pages || 0}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Add Modal */}
      <ArticleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Draft New Article"
        onSubmit={handleSubmit(handleAddSubmit)}
        register={register}
        control={control}
        errors={errors}
        isSubmitting={createMutation.isPending}
        submitLabel="Publish Article"
      />

      {/* Edit Modal */}
      <ArticleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Article"
        onSubmit={handleSubmit(handleEditSubmit)}
        register={register}
        control={control}
        errors={errors}
        isSubmitting={updateMutation.isPending}
        submitLabel="Update Article"
        isPublished={!!editingArticle?.publishedAt}
      />
    </div>
  );
}

// ─── Shared Modal ─────────────────────────────────────────────────────────────

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  register: any;
  control: any;
  errors: any;
  isSubmitting: boolean;
  submitLabel: string;
  isPublished?: boolean;
}

function ArticleModal({ isOpen, onClose, title, onSubmit, register, control, errors, isSubmitting, submitLabel, isPublished }: ArticleModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none max-w-5xl bg-white dark:bg-slate-950 rounded-4xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
        
        {/* Modern Header */}
        <div className="bg-white dark:bg-slate-900 px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-500 shadow-sm border border-orange-100 dark:border-orange-900/10">
               <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">{title}</h2>
              <p className="text-[10px] font-bold text-slate-400">Authoring Environment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Studio Workspace */}
        <form onSubmit={onSubmit} className="flex-1 flex overflow-hidden">
          
          {/* Main Editor Pane (Left) */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950">
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Zen Title Input */}
              <div className="space-y-4">
                <textarea
                  {...register('title')}
                  rows={2}
                  className={cn(
                    'w-full text-3xl font-black bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-200 dark:placeholder:text-slate-800 resize-none leading-tight tracking-tight',
                    errors.title && 'text-rose-500'
                  )}
                  placeholder="Clinical Article Title..."
                />
                <div className="h-0.5 w-16 bg-pharco-orange/40 rounded-full" />
                {errors.title && <p className="text-[10px] text-rose-500 font-bold">{errors.title.message}</p>}
              </div>

              {/* Content Area */}
              <div className="space-y-4 pt-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pharco-orange" />
                  Documentation Body *
                </label>
                <textarea
                  {...register('content')}
                  className={cn(
                    'w-full min-h-120 rounded-2xl border-none focus:outline-none focus:ring-0 p-0 text-base leading-relaxed font-semibold bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-800 resize-none',
                    errors.content && 'text-rose-500'
                  )}
                  placeholder="Draft your medical insights here... (Markdown supported)"
                />
                {errors.content && <p className="text-[10px] text-rose-500 font-bold">{errors.content.message}</p>}
              </div>
            </div>
          </div>

          {/* Settings Sidebar (Right) */}
          <div className="w-90 bg-slate-50/50 dark:bg-slate-900/30 border-l border-slate-100 dark:border-slate-800 p-7 overflow-y-auto custom-scrollbar space-y-8 shrink-0">
            
            {/* Meta Group 1: Configuration */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">Classification</h3>
                 <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800/50" />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 pl-1">Category *</label>
                  <select
                    {...register('category')}
                    className="w-full h-10 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-xs font-bold focus:ring-4 focus:ring-pharco-orange/5 focus:border-pharco-orange outline-none transition-all shadow-xs"
                  >
                    <option value="Information">General Information</option>
                    <option value="Research">Clinical Research</option>
                    <option value="Tips">Health Tips</option>
                    <option value="Technology">MedTech</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 pl-1">Status *</label>
                  <select
                    {...register('status')}
                    className="w-full h-10 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-xs font-bold focus:ring-4 focus:ring-pharco-orange/5 focus:border-pharco-orange outline-none transition-all shadow-xs"
                  >
                    {!isPublished && <option value="draft">Internal Draft</option>}
                    <option value="published">Live Public</option>
                    <option value="archived">Archived / Hidden</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Meta Group 2: Presentation */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">Context & Assets</h3>
                 <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800/50" />
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 pl-1">Article Summary *</label>
                    <textarea
                      {...register('summary')}
                      rows={4}
                      className={cn(
                        'w-full p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold focus:ring-4 focus:ring-pharco-orange/5 focus:border-pharco-orange outline-none transition-all shadow-xs resize-none leading-relaxed placeholder:font-medium',
                        errors.summary && 'border-rose-500 ring-rose-500/10'
                      )}
                      placeholder="Describe the clinical impact and key takeaways..."
                    />
                  {errors.summary && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wide">{errors.summary.message}</p>}
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Cover Image</label>
                   <div className="rounded-xl overflow-hidden border border-slate-50 dark:border-slate-800 shadow-xs">
                    <Controller
                      name="coverImage"
                      control={control}
                      render={({ field }) => (
                        <ImageUpload label="" value={field.value} onChange={field.onChange} />
                      )}
                    />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Action Bar (Sticky Footer) */}
        <div className="bg-white dark:bg-slate-950 px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 h-10 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-10 h-10 bg-[#3e4998] hover:bg-[#393d8e] text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-primary/5 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? 'Processing...' : submitLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
