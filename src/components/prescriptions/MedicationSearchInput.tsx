import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Pill, Check, Search, ShieldCheck } from 'lucide-react';
import { prescriptionsApi } from '@/features/prescriptions/api';
import { cn } from '@/lib/utils';

interface MedicationSearchInputProps {
  value: string;
  onChange: (name: string, type?: string) => void;
  error?: string;
  className?: string;
}

export function MedicationSearchInput({ value, onChange, error, className }: MedicationSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      if (!searchTerm || searchTerm.trim().length === 0) {
        // Fetch default Pharco recommendations if search is empty
        try {
          const res: any = await prescriptionsApi.searchMedications('');
          if (active) {
            setResults(res?.data || res || []);
          }
        } catch {
          if (active) setResults([]);
        }
        return;
      }

      setLoading(true);
      try {
        const res: any = await prescriptionsApi.searchMedications(searchTerm.trim());
        if (active) {
          setResults(res?.data || res || []);
        }
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const handleSelect = (item: any) => {
    setSearchTerm(item.name);
    setIsOpen(false);

    // Auto-detect type
    const lower = item.name.toLowerCase();
    let detectedType = 'eyedrop';
    if (lower.includes('ointment')) detectedType = 'ointment';
    else if (lower.includes('tablet') || lower.includes('pill')) detectedType = 'tablet';
    else if (lower.includes('capsule')) detectedType = 'capsule';

    onChange(item.name, detectedType);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="e.g. Timolol 0.5% or Dorzolamol"
          className={cn(className, "pr-8")}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search size={16} />
        </div>
      </div>

      {error && <p className="text-rose-500 text-xs font-bold mt-1.5">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black tracking-wider text-slate-400 uppercase flex items-center justify-between">
            <span>Clinical Medication Catalog</span>
            {loading && <span className="text-primary font-bold">Searching...</span>}
          </div>

          {results.length > 0 ? (
            <div className="p-1 divide-y divide-slate-50 dark:divide-slate-800/40">
              {results.map((item, idx) => {
                const isPharco = item.source === 'pharco';
                const isSuggestion = item.suggestion;

                return (
                  <button
                    key={`${item.name}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        isPharco ? "bg-indigo-50 dark:bg-indigo-500/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}>
                        {isPharco ? <ShieldCheck size={16} /> : <Pill size={15} />}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block truncate group-hover:text-primary transition-colors">
                          {item.name}
                        </span>
                        {isSuggestion && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
                            Pharco equivalent alternative
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      {isPharco ? (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-primary border border-indigo-100 dark:border-indigo-500/20">
                          Pharco Official
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Doctor History
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 font-medium">
              No matching Pharco medication. Press Enter to use "{searchTerm}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
