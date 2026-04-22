import { useParams, useNavigate } from 'react-router-dom';
import { useArticleDetail, useDeleteArticle, useUpdateArticle } from '@/features/articles/hooks';
import {
  ArrowLeft, Edit, Trash2, Clock, Eye, Tag, Globe,
  BookOpen, Archive, CheckCircle, X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: raw, isLoading, error } = useArticleDetail(id!);
  const article = (raw as any)?.data ?? raw;
  const user = useAuthStore(s => s.user);

  const deleteMutation = useDeleteArticle();
  const updateMutation = useUpdateArticle();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const doctorId = user?.doctor?.id;
  const isOwner = article && (article.doctorId === doctorId || article.doctorId?._id === doctorId);

  const handleDelete = () => {
    deleteMutation.mutate(article._id, {
      onSuccess: () => {
        toast.success('Article deleted');
        navigate('/articles');
      },
    });
  };

  const handleStatusToggle = () => {
    const newStatus = article.status === 'published' ? 'archived' : 'published';
    updateMutation.mutate(
      { id: article._id, data: { status: newStatus } },
      { onSuccess: () => toast.success(`Article ${newStatus}`) }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="space-y-3">
          <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="h-full animate-fadeIn flex flex-col items-center justify-center py-24 gap-4 p-8 bg-slate-50/30 dark:bg-slate-950/30">
        <BookOpen className="w-16 h-16 text-slate-300" />
        <p className="text-xl font-black text-slate-900 dark:text-slate-100">Article not found</p>
        <button
          onClick={() => navigate('/articles')}
          className="px-5 py-2.5 bg-[#3e4998] text-white rounded-xl font-bold text-sm"
        >
          Back to Articles
        </button>
      </div>
    );
  }

  const doctor = article.doctorId;
  const authorUser = doctor?.userId;
  
  // Enhanced Publisher Resolution
  const authorName = doctor 
    ? (authorUser?.name || doctor?.name || 'Medical Specialist')
    : 'Pharco System Specialist';
    
  const authorSpec = doctor?.specialization || 'Clinical Operations';
  const initials = doctor 
    ? (authorName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase())
    : 'PS';

  // Category Mapping
  const categoryMap: Record<string, string> = {
    'Information': 'General Information',
    'Research': 'Clinical Research',
    'Tips': 'Health Tips',
    'Technology': 'MedTech'
  };
  const categoryDisplay = categoryMap[article.category] || article.category;

  return (
    <div className="bg-slate-50/30 dark:bg-slate-950/30 animate-fadeIn">
      {/* High-Resolution Hero Area (Full Width) */}
      <div className="relative w-full h-[50vh] overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-slate-900 shadow-2xl rounded-[3rem]">
        {article.coverImage && (
          <img 
            src={article.coverImage} 
            alt={article.title} 
            className="w-full h-full object-cover opacity-70" 
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        {/* Floating Interactions */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-50">
           <button
             onClick={() => navigate('/articles')}
             className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white font-bold hover:bg-white/20 transition-all group"
           >
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
             Journal
           </button>

           {isOwner && (
             <div className="flex items-center gap-3">
               <button
                 onClick={handleStatusToggle}
                 className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
               >
                 {article.status === 'published' ? 'Archive' : 'Publish'}
               </button>
               <button
                 onClick={() => navigate('/articles')}
                 className="px-6 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
               >
                 Edit Article
               </button>
             </div>
           )}
        </div>

        {/* Hero Title */}
        <div className="absolute bottom-12 left-12 right-12">
           <div className="flex items-center gap-4 mb-6">
              <span className={cn('px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white text-slate-900 shadow-xl')}>
                 {article.status || 'draft'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-primary backdrop-blur-lg border border-white/20 px-4 py-1.5 rounded-full">
                {categoryDisplay}
              </span>
           </div>
           <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white leading-tight tracking-tight max-w-6xl">
             {article.title}
           </h1>
        </div>
      </div>

      {/* Main Grid Layout (2 Column) */}
      <div className="w-full mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Main Content Column (col-span-8) */}
          <main className="col-span-1 lg:col-span-8 space-y-12">
            
            <div className="bg-white dark:bg-slate-900/40 p-8 lg:p-14 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-12">
              {/* Summary */}
              {article.summary && (
                <p className="text-2xl font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-8 border-primary/20 pl-8">
                  {article.summary}
                </p>
              )}

              {/* Content body */}
              <div className="prose prose-slate dark:prose-invert prose-xl max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed">
                 {article.content.split('\n').map((paragraph: string, i: number) => {
                    if (paragraph.startsWith('# ')) {
                      return <h2 key={i} className="text-4xl mt-12 mb-6">{paragraph.slice(2)}</h2>;
                    }
                    if (paragraph.startsWith('## ')) {
                      return <h3 key={i} className="text-2xl font-black text-primary mt-10 mb-4">{paragraph.slice(3)}</h3>;
                    }
                    if (!paragraph.trim()) return <div key={i} className="h-8" />;
                    return (
                      <p key={i} className="mb-6">
                        {paragraph}
                      </p>
                    );
                  })}
              </div>
            </div>

            {/* Simple Footer Metadata */}
            <div className="flex items-center justify-between px-10 py-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Classification</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">{categoryDisplay}</span>
               </div>
               <div className="flex items-center gap-3">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Published</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">{formatDate(article.createdAt)}</span>
               </div>
            </div>
          </main>

          {/* Sidebar Area (col-span-4) */}
          <aside className="col-span-1 lg:col-span-4 space-y-8 sticky top-12">
             
             {/* Author Profile */}
             <div className="p-8 bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-transparent">
                <div className="space-y-6">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Author</h4>
                   
                   <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-primary/20">
                        {initials}
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                          {doctor ? `Dr. ${authorName}` : authorName}
                        </p>
                        <p className="text-sm font-bold text-primary mt-1">{authorSpec}</p>
                      </div>
                   </div>

                   <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />
                   
                   <div className="flex items-center gap-3 text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl justify-center">
                      <CheckCircle size={16} />
                      <span className="text-xs uppercase tracking-widest font-black">PHARCO VERIFIED</span>
                   </div>
                </div>
             </div>

             {/* Simple Action Card */}
             {isOwner && (
               <div className="p-8 rounded-[2.5rem] bg-slate-900 dark:bg-slate-800 text-white shadow-2xl shadow-slate-900/20">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-6">Management</h4>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-rose-500 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                  >
                    <Trash2 size={16} /> Delete Story
                  </button>
               </div>
             )}
          </aside>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="bg-white dark:bg-slate-950 rounded-3xl p-10 max-w-md w-full shadow-2xl relative z-10 border dark:border-slate-800">
            <button onClick={() => setShowDeleteConfirm(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-6">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Confirm Deletion</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed text-base">
              Are you absolutely sure you want to permanently delete <span className="text-slate-900 dark:text-white font-bold">"{article.title}"</span>? This action cannot be reversed.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 px-6 py-3 text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-2xl transition-colors disabled:opacity-50"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
