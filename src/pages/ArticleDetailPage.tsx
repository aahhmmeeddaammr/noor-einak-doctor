import { useParams, useNavigate } from 'react-router-dom';
import { useArticleDetail, useDeleteArticle, useUpdateArticle } from '@/features/articles/hooks';
import {
  ArrowLeft, Edit, Trash2, Clock, Eye, Tag, Globe,
  BookOpen, Archive, CheckCircle, X, Share2, Check, FileText, User2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';

// Helper: Strip HTML tags for clean text snippets and word count
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Helper: Safely sanitize and format article rich text content
function cleanAndFormatContent(content: string): string {
  if (!content) return '<p class="text-slate-400 italic">No content available for this article.</p>';

  // Check if content already contains HTML tags (e.g. from ReactQuill)
  const hasHtml = /<\/?(p|div|h[1-6]|ul|ol|li|blockquote|strong|em|br|span|a|img|b|i|table)[^>]*>/i.test(content);

  if (hasHtml) {
    // Sanitize scripts and inline event handlers to prevent XSS
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript\s*:/gi, '');
  }

  // If plain markdown or plain text, convert to proper semantic HTML
  return content
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<div class="h-4"></div>';
      if (trimmed.startsWith('# ')) return `<h1>${trimmed.slice(2)}</h1>`;
      if (trimmed.startsWith('## ')) return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith('### ')) return `<h3>${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return `<ul><li>${trimmed.slice(2)}</li></ul>`;
      return `<p>${trimmed}</p>`;
    })
    .join('');
}

// Calculate reading time based on word count
function calculateReadTime(text: string): string {
  const plainText = stripHtml(text || '');
  const words = plainText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: raw, isLoading, error } = useArticleDetail(id!);
  const article = (raw as any)?.data ?? raw;
  const user = useAuthStore(s => s.user);

  const deleteMutation = useDeleteArticle();
  const updateMutation = useUpdateArticle();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Article link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const doctorId = user?.doctor?.id || (user?.doctor as any)?._id || (user as any)?._id;
  const isOwner = article && (
    article.doctorId === doctorId || 
    article.doctorId?._id === doctorId ||
    article.doctorId?.userId?._id === (user as any)?._id ||
    article.doctorId?.userId === (user as any)?._id
  );

  const handleDelete = () => {
    deleteMutation.mutate(article._id, {
      onSuccess: () => {
        toast.success('Article deleted successfully');
        navigate('/articles');
      },
    });
  };

  const handleStatusToggle = () => {
    const newStatus = article.status === 'published' ? 'archived' : 'published';
    updateMutation.mutate(
      { id: article._id, data: { status: newStatus } },
      { onSuccess: () => toast.success(`Article status changed to ${newStatus}`) }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="h-full animate-fadeIn flex flex-col items-center justify-center py-24 gap-4 p-8 bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl border border-slate-200 dark:border-slate-800 my-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Article not found</h2>
        <p className="text-sm text-slate-500 max-w-md text-center">
          The article you are looking for may have been deleted, archived, or is temporarily unavailable.
        </p>
        <button
          onClick={() => navigate('/articles')}
          className="mt-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          Back to Articles
        </button>
      </div>
    );
  }

  const doctor = article.doctorId;
  const authorUser = doctor?.userId;
  
  const authorName = doctor 
    ? (authorUser?.name || doctor?.name || 'Medical Specialist')
    : 'Noor Einak Expert';
    
  const authorSpec = doctor?.specialization || 'Ophthalmology Specialist';
  const initials = doctor 
    ? (authorName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase())
    : 'NE';

  const categoryMap: Record<string, string> = {
    'Information': 'General Information',
    'Research': 'Clinical Research',
    'Tips': 'Health Tips',
    'Technology': 'MedTech'
  };
  const categoryDisplay = categoryMap[article.category] || article.category;

  const hasCover = Boolean(article.coverImage);

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-2">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2.5 text-xs">
          <button
            onClick={() => navigate('/articles')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all shadow-2xs group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Articles
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            {categoryDisplay}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs"
            title="Copy article link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          {isOwner && (
            <>
              <button
                onClick={handleStatusToggle}
                disabled={updateMutation.isPending}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs",
                  article.status === 'published'
                    ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100"
                    : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100"
                )}
              >
                {article.status === 'published' ? (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Publish</span>
                  </>
                )}
              </button>

              <button
                onClick={() => navigate(`/articles/${article._id}/edit`)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-sm shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero Header Area */}
      {hasCover ? (
        /* Layout with Cover Image */
        <div className="space-y-6 mb-8">
          <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-md group">
            <img 
              src={article.coverImage} 
              alt={article.title} 
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            
            {/* Category & Views overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white text-xs font-medium">
              <span className="px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 font-bold uppercase tracking-wider text-[11px]">
                {categoryDisplay}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-semibold">
                <Eye className="w-3.5 h-3.5" /> {(article.viewsCount || 0).toLocaleString()} Views
              </span>
            </div>
          </div>

          {/* Title & Metadata directly below cover */}
          <div className="space-y-3 px-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={cn(
                "px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                article.status === 'published' 
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40" 
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40"
              )}>
                {article.status || 'draft'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {calculateReadTime(article.content)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <User2 className="w-3.5 h-3.5 text-primary" />
                {doctor ? `Dr. ${authorName}` : authorName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(article.createdAt)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Refined Editorial Banner without Cover Image */
        <div className="relative w-full rounded-3xl overflow-hidden mb-8 p-7 sm:p-10 bg-gradient-to-br from-[#1b2149] via-[#26316e] to-[#3e4998] text-white shadow-lg border border-indigo-900/30">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute top-4 right-6 p-4 opacity-10 pointer-events-none hidden sm:block">
            <BookOpen className="w-36 h-36" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/15 backdrop-blur-md border border-white/20 text-white">
                {categoryDisplay}
              </span>
              <span className={cn(
                "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
                article.status === 'published' 
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" 
                  : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
              )}>
                {article.status || 'draft'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-100/90 pt-3 border-t border-white/10">
              <span className="flex items-center gap-1.5 font-medium">
                <User2 className="w-3.5 h-3.5 text-indigo-200" />
                {doctor ? `Dr. ${authorName}` : authorName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-200" />
                {formatDate(article.createdAt)}
              </span>
              <span>•</span>
              <span>{calculateReadTime(article.content)}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-200" />
                {(article.viewsCount || 0).toLocaleString()} Views
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Content (8 Cols) & Sidebar (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Content Column */}
        <main className="lg:col-span-8 space-y-6">
          
          {/* Executive Summary / Key Takeaways Box */}
          {article.summary && (
            <div className="rounded-2xl p-6 bg-gradient-to-r from-primary/5 via-blue-50/40 to-transparent dark:from-primary/10 dark:via-slate-900/40 dark:to-transparent border-l-4 border-primary border-y border-r border-slate-200/60 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Clinical Summary & Key Points</span>
              </div>
              <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {stripHtml(article.summary)}
              </p>
            </div>
          )}

          {/* Article Main Body */}
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            {/* Rich HTML Content */}
            <div
              className="medical-article-content max-w-none"
              dangerouslySetInnerHTML={{ __html: cleanAndFormatContent(article.content) }}
            />

            {/* Article Footer Metadata */}
            <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{categoryDisplay}</span>
                <span>•</span>
                <span>Noor Einak Health Portal</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-3.5 h-3.5" />
                <span>Last updated {formatDate(article.updatedAt || article.createdAt)}</span>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar Column */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          
          {/* Author Profile Card */}
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Published By</h4>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-md shadow-primary/20 shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {doctor ? `Dr. ${authorName}` : authorName}
                </p>
                <p className="text-xs font-semibold text-primary truncate mt-0.5">{authorSpec}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2.5 rounded-xl text-xs font-bold justify-center border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Noor Einak Verified Doctor</span>
            </div>
          </div>

          {/* Article Info & Metrics Card */}
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Article Details</h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Category
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{categoryDisplay}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Read Time
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{calculateReadTime(article.content)}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-400" /> Views
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{(article.viewsCount || 0).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Status
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                  article.status === 'published'
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                )}>
                  {article.status || 'draft'}
                </span>
              </div>
            </div>
          </div>

          {/* Management Quick Actions (for Author) */}
          {isOwner && (
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Management</h4>
              
              <button
                onClick={() => navigate(`/articles/${article._id}/edit`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Article
              </button>

              <button
                onClick={handleStatusToggle}
                disabled={updateMutation.isPending}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all border",
                  article.status === 'published'
                    ? "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                    : "bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                )}
              >
                {article.status === 'published' ? (
                  <>
                    <Archive className="w-3.5 h-3.5" /> Move to Archive
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" /> Publish to Patients
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40 font-bold text-xs transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Story
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowDeleteConfirm(false)} />
          <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setShowDeleteConfirm(false)} 
              className="absolute top-5 right-5 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-5">
              <Trash2 className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete Article</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed text-sm">
              Are you sure you want to permanently delete <span className="text-slate-900 dark:text-white font-bold">"{article.title}"</span>? This action cannot be reversed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
