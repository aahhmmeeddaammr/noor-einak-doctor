import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useConversations, useMessages, useSendMessage } from '@/features/messaging/hooks';
import { cn, getInitials, timeAgo } from '@/lib/utils';
import { Send, Search, Paperclip, Play, CheckCheck, Smile, ArrowUpRight, ExternalLink, Users2, Loader2, X, FileText, Download } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { uploadApi } from '@/features/upload/api';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/Dialog';

export default function MessagingPage() {
  const [search, setSearch] = useState('');
  const { data: convData, isLoading: isLoadingConvs } = useConversations(search);
  const conversations = (convData as any)?.data || [];
  const [selectedId, setSelectedId] = useState<string>('');

  const [page, setPage] = useState(1);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const { data: msgData, isLoading: isLoadingMessages } = useMessages(selectedId, { page, limit: 15 });
  const sendMutation = useSendMessage(selectedId);

  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<any>(null);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollHeightBeforeUpdate = useRef<number>(0);

  // Reset and clear when switching conversations
  useEffect(() => {
    setAllMessages([]);
    setPage(1);
    lastMessageIdRef.current = '';
  }, [selectedId]);

  // Handle incoming data
  useEffect(() => {
    if (msgData?.data) {
      // Capture scroll height before prepending older messages
      if (page > 1 && scrollContainerRef.current) {
        scrollHeightBeforeUpdate.current = scrollContainerRef.current.scrollHeight;
      }

      setAllMessages(prev => {
        const newMsgs = msgData.data;
        const existingIds = new Set(prev.map(m => m._id || m.id));
        const filteredNew = newMsgs.filter((m: any) => !existingIds.has(m._id || m.id));

        if (page === 1) {
          // On first page, just set (or append if poll)
          return [...prev, ...filteredNew].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else {
          // On later pages, these are older messages, prepend them
          return [...filteredNew, ...prev].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
      });
    }
  }, [msgData, page]);

  // Adjust scroll position after prepending older messages
  useLayoutEffect(() => {
    if (page > 1 && scrollContainerRef.current && scrollHeightBeforeUpdate.current > 0) {
      const container = scrollContainerRef.current;
      const oldBehavior = container.style.scrollBehavior;
      container.style.scrollBehavior = 'auto';
      container.scrollTop = container.scrollHeight - scrollHeightBeforeUpdate.current;
      container.style.scrollBehavior = oldBehavior;
      scrollHeightBeforeUpdate.current = 0;
    }
  }, [allMessages.length]);

  const lastScrolledId = useRef<string>('');

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
    }
  };

  // 1. Initial Scroll to bottom on conversation selection & first data load
  useEffect(() => {
    if (selectedId && allMessages.length > 0 && page === 1 && lastScrolledId.current !== selectedId) {
      const timer = setTimeout(() => {
        scrollToBottom(true);
        lastScrolledId.current = selectedId;
      }, 150); // Small delay to ensure render
      return () => clearTimeout(timer);
    }
  }, [selectedId, allMessages.length]);

  // 2. Clear tracking when reset
  useEffect(() => {
    if (!selectedId) lastScrolledId.current = '';
  }, [selectedId]);

  const lastMessageIdRef = useRef<string>('');

  // 3. Scroll when NEW message is sent/received
  useEffect(() => {
    if (page === 1 && allMessages.length > 0 && lastScrolledId.current === selectedId) {
      const lastMsg = allMessages[allMessages.length - 1];
      const lastId = lastMsg?._id || lastMsg?.id;
      
      // Only scroll if the last message is actually new
      if (lastId !== lastMessageIdRef.current) {
        const isOwn = lastMsg?.senderId === user?.id || lastMsg?.sender === user?.id;
        
        if (isOwn) {
          scrollToBottom();
        }
        lastMessageIdRef.current = lastId;
      }
    }
  }, [allMessages, page]);

  const [activeConv, setActiveConv] = useState<any>(null);

  useEffect(() => {
    const found = conversations.find((c: any) => (c._id || c.id) === selectedId);
    if (found) {
      setActiveConv(found);
    }
  }, [conversations, selectedId]);

  const selectedConv = activeConv;

  const handleSend = () => {
    if ((!input.trim() && !pendingFile) || !selectedId) return;

    if (pendingFile) {
      sendMutation.mutate({
        type: pendingFile.type.startsWith('image/') ? 'image' : pendingFile.type.startsWith('video/') ? 'video' : 'file',
        content: input.trim() || pendingFile.name,
        fileUrl: pendingFile.url,
        fileName: pendingFile.name,
        mimeType: pendingFile.type,
        thumbnailUrl: pendingFile.thumbnailUrl,
      });
      setPendingFile(null);
    } else {
      sendMutation.mutate({ type: 'text', content: input });
    }
    
    setInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;

    try {
      setIsUploading(true);
      const { url, fileName, mimeType, thumbnailUrl } = await uploadApi.uploadFile(file);
      
      setPendingFile({
        url,
        name: fileName,
        type: mimeType,
        thumbnailUrl
      });
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderMessageContent = (msg: any) => {
    if (msg.type === 'image') {
      return (
        <div 
          onClick={() => setPreviewFile(msg)}
          className="mt-1 mb-1 group relative overflow-hidden rounded-xl border border-black/10 dark:border-white/10 shadow-sm cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <img src={msg.fileUrl} alt={msg.fileName} className="max-w-60 w-full h-auto max-h-80 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <Search className="text-white opacity-0 group-hover:opacity-100 w-6 h-6" />
          </div>
        </div>
      );
    }
    if (msg.type === 'video') {
      return (
        <div 
          onClick={() => setPreviewFile(msg)}
          className="relative mt-1 mb-1 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-sm bg-black/40 group max-w-60 cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <video src={msg.fileUrl} className="w-full h-auto max-h-80" poster={msg.thumbnailUrl} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        </div>
      );
    }

    if (msg.type === 'file') {
      return (
        <div 
          onClick={() => setPreviewFile(msg)}
          className="mt-1 mb-1 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 cursor-pointer group hover:border-pharco-orange transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-pharco-orange/5 flex items-center justify-center text-pharco-orange group-hover:bg-pharco-orange group-hover:text-white transition-colors">
            <FileText size={20} />
          </div>
          <div className="flex flex-col min-w-0 pr-4">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-40">{msg.fileName || 'Document'}</p>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tight">Clinical Attachment</p>
          </div>
          <Download size={14} className="text-slate-300 group-hover:text-pharco-orange transition-colors" />
        </div>
      );
    }

    return <p className="leading-snug whitespace-pre-wrap font-medium">{msg.content}</p>;
  };

  return (
    <div className="h-full animate-fadeIn bg-slate-50/30 dark:bg-slate-950/30">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden flex h-full">

        {/* Clinical Sidebar: Patient Directory */}
        <div className="w-80 border-r border-slate-50 dark:border-slate-800 flex flex-col shrink-0 bg-slate-50/30 dark:bg-slate-950/40">
          <div className="p-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-pharco-orange transition-colors" />
              <input
                type="text"
                placeholder="Find patient record..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-pharco-orange/5 transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
            {isLoadingConvs ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-6 h-6 text-pharco-orange animate-spin" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Syncing Patients...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-50 dark:border-slate-700 shadow-sm">
                  <Smile className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No active cases</p>
              </div>
            ) : (
              conversations.map((conv: any) => {
                const other = conv.otherUser;
                const isSelected = (conv._id || conv.id) === selectedId;
                return (
                  <button
                    key={conv._id || conv.id}
                    onClick={() => {
                      const cid = conv._id || conv.id;
                      setSelectedId(selectedId === cid ? '' : cid);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-3xl transition-all duration-300 text-left border relative group',
                      isSelected
                        ? 'bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-100 dark:border-slate-700'
                        : 'border-transparent hover:bg-white/60 dark:hover:bg-slate-900/40 hover:border-slate-100 dark:hover:border-slate-800'
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-slate-900 shadow-sm">
                        <AvatarImage src={other?.avatarUrl} />
                        <AvatarFallback className="bg-pharco-orange/5 text-pharco-orange font-black text-[9px] uppercase">
                          {getInitials(other?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900",
                        isSelected ? "bg-pharco-orange" : "bg-emerald-500"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={cn('text-[12px] truncate leading-none', isSelected ? 'font-black text-pharco-orange' : 'font-bold text-slate-700 dark:text-slate-200')}>
                          {other?.name}
                        </span>
                        <span className="text-[8px] font-black text-slate-300 uppercase whitespace-nowrap">
                          {conv.lastMessage?.createdAt ? timeAgo(conv.lastMessage.createdAt).replace(' ago', '') : ''}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate font-medium italic leading-none">
                        {conv.lastMessage?.content || 'Consultation started'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Diagnostic Canvas: Case Management */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 relative">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center bg-slate-50/20 dark:bg-slate-950/10">
              <div className="text-center max-w-sm px-8">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-4xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-pharco-orange/5 border border-slate-50 dark:border-slate-700 transform rotate-6">
                  <ExternalLink className="w-8 h-8 text-pharco-orange/40 -rotate-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">Case Correspondence</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-6">Secured Diagnostic Vault</p>
                <div className="h-px w-8 bg-slate-100 dark:bg-slate-800 mx-auto mb-6" />
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic px-4">
                  Select a clinical record from the directory to review patient-reported symptoms and exchange evaluative notes.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-10 h-10 shadow-sm border-0 ring-0">
                      <AvatarImage src={selectedConv?.otherUser?.avatarUrl} />
                      <AvatarFallback className="bg-pharco-orange/5 text-pharco-orange font-black uppercase text-[10px]">
                        {getInitials(selectedConv?.otherUser?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {selectedConv?.otherUser?.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-wider">
                      {selectedConv?.otherUser?.phone || selectedConv?.otherUser?.phoneNumber || 'No phone recorded'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Link to={`/patients/${selectedConv?.otherUser?.patient?._id || selectedConv?.otherUser?.patient?.id || selectedConv?.otherUser?._id}`}>
                    <button className="hidden sm:flex items-center gap-2 h-9 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-pharco-orange transition-all text-slate-500 hover:text-white rounded-xl border border-slate-100 dark:border-slate-700 group/link">
                      <span className="text-[9px] font-black uppercase tracking-widest">Medical Record</span>
                      <ArrowUpRight size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pt-2 pb-0 md:px-6 md:pt-3 space-y-3 bg-slate-50/20 dark:bg-slate-950/10 custom-scrollbar scroll-smooth" ref={scrollContainerRef}>
                <div className="flex flex-col items-center gap-2 mb-2">
                  {(msgData as any)?.meta?.page < (msgData as any)?.meta?.pages && (
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={isLoadingMessages}
                      className="text-[11px] font-bold text-pharco-orange hover:text-pharco-orange/90 capitalize px-6 py-2 bg-pharco-orange/5 hover:bg-pharco-orange/10 rounded-xl transition-all border border-pharco-orange/10 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoadingMessages ? 'Synchronizing Archives...' : 'Load historical context'}
                    </button>
                  )}
                </div>

                {allMessages.map((msg: any, idx: number) => {
                  const isOwn = msg.senderId === user?.id || msg.sender === user?.id;
                  const prevMsg = allMessages[idx - 1];
                  const isPrevOwn = prevMsg && (prevMsg.senderId === user?.id || prevMsg.sender === user?.id);
                  const isFirstInSeries = !prevMsg || isPrevOwn !== isOwn;

                  // Check if this message is the first one of the day
                  let showDate = false;
                  if (idx === 0) {
                    showDate = true;
                  } else {
                    const prevDate = new Date(prevMsg.createdAt).toDateString();
                    const currDate = new Date(msg.createdAt).toDateString();
                    if (prevDate !== currDate) {
                      showDate = true;
                    }
                  }

                  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
                  const msgTime = new Date(msg.createdAt).toLocaleTimeString([], timeOptions);

                  return (
                    <div key={msg._id || msg.id} className="flex flex-col gap-2">
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="px-4 py-1.5 bg-white shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700 text-[10px] font-bold text-slate-500 uppercase tracking-widest rounded-full">
                            {new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                      <div className={cn('flex items-end gap-2 transition-all animate-slideIn', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                        {!isOwn && (
                          <div className={cn("w-8 h-8 rounded-full overflow-hidden shrink-0 self-end mb-1 border border-slate-100 shadow-sm transition-opacity", !isFirstInSeries ? "opacity-0 invisible" : "opacity-100")}>
                            <Avatar className="w-full h-full ring-0 border-0">
                              <AvatarImage src={selectedConv?.otherUser?.avatarUrl} />
                              <AvatarFallback className="text-[10px] bg-pharco-orange/10 text-pharco-orange">{getInitials(selectedConv?.otherUser?.name)}</AvatarFallback>
                            </Avatar>
                          </div>
                        )}

                        <div className={cn(
                          'relative max-w-[75%] flex flex-col',
                          isOwn ? 'items-end' : 'items-start'
                        )}>
                          <div className={cn(
                            'px-3.5 py-2 text-[13px] shadow-sm relative wrap-break-word',
                            isOwn
                              ? cn('bg-pharco-orange text-white', isFirstInSeries ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl', !isFirstInSeries && 'mt-0')
                              : cn('bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 border', isFirstInSeries ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl', !isFirstInSeries && 'mt-0')
                          )}>

                            <div className="flex flex-col">
                              {renderMessageContent(msg)}

                              <div className={cn(
                                'flex items-center gap-1 text-[10px] opacity-80 mt-1 self-end ml-4 -mb-1',
                                isOwn ? 'text-white/90' : 'text-slate-400'
                              )}>
                                <span className="pt-px">{msgTime}</span>
                                {isOwn && <CheckCheck className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-4xl mx-auto flex flex-col gap-3">
                  {/* Pending File Preview */}
                  {pendingFile && (
                    <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 w-fit animate-slideIn">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-50 dark:border-slate-700 bg-slate-50 shrink-0">
                        {pendingFile.type.startsWith('image/') ? (
                          <img src={pendingFile.url} className="w-full h-full object-cover" />
                        ) : pendingFile.type.startsWith('video/') ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                            <Play className="w-5 h-5 text-slate-400" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                            <FileText className="w-5 h-5 text-pharco-orange" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 pr-4">
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-37.5">{pendingFile.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">Ready to send</p>
                      </div>
                        <button 
                          onClick={() => setPendingFile(null)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-500 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 px-5 h-12 shadow-sm focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Write a message..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium h-full text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                      accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="text-slate-400 hover:text-primary ml-2 transition-colors outline-none shrink-0"
                    >
                      <Paperclip size={20} />
                    </button>
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={(!input.trim() && !pendingFile) || sendMutation.isPending}
                    className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:shadow-none text-white shadow-md shadow-primary/20 shrink-0 transition-transform active:scale-95 flex items-center justify-center p-0 outline-none border-none"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} className="-ml-1" />
                    )}
                  </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl [&>button]:text-slate-400 [&>button]:hover:text-pharco-orange [&>button]:z-[100] [&>button]:bg-white/10 [&>button]:backdrop-blur-md [&>button]:rounded-full [&>button]:p-1">
          <DialogHeader className="absolute top-6 left-6 z-50 p-0">
             <div className="flex flex-col gap-1 border-l-4 border-pharco-orange pl-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md py-1 pr-6 rounded-r-xl">
                <DialogTitle className="text-[#3e4998] dark:text-pharco-orange text-sm font-black uppercase tracking-wider">{previewFile?.fileName || 'Media Preview'}</DialogTitle>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Clinical Diagnostic File</p>
             </div>
          </DialogHeader>
          <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center p-4 pt-20">
            {previewFile?.type === 'image' ? (
              <img 
                src={previewFile.fileUrl} 
                alt="" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" 
              />
            ) : previewFile?.type === 'video' ? (
              <video 
                src={previewFile?.fileUrl} 
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" 
                controls 
                autoPlay
              />
            ) : previewFile?.fileType?.includes('pdf') ? (
              <iframe 
                src={previewFile.fileUrl} 
                className="w-full h-[80vh] rounded-lg border-none"
                title="Clinical Document"
              />
            ) : (
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-white">
                  <FileText size={40} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-white">{previewFile?.fileName}</h3>
                  <p className="text-white/50 text-sm mt-2">This file type cannot be previewed directly.</p>
                </div>
                <a 
                  href={previewFile?.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-8 py-3 bg-pharco-orange text-white rounded-2xl font-bold hover:scale-105 transition-transform"
                >
                  <Download size={18} />
                  Download Document
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
