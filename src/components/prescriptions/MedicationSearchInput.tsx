import React, { useState, useEffect, useRef } from 'react';
import { Pill, Search, ShieldCheck } from 'lucide-react';
import { prescriptionsApi } from '@/features/prescriptions/api';
import { cn } from '@/lib/utils';
import { getMedicationDefaults, searchMedicationCatalog, mergeMedicationResults } from '@/features/prescriptions/medicationCatalog';
import type { CatalogMedication, MedicationSearchResult } from '@/features/prescriptions/medicationCatalog';

interface MedicationSearchInputProps {
  value: string;
  onChange: (name: string, type?: string, catalog?: CatalogMedication) => void;
  error?: string;
  className?: string;
}

export function MedicationSearchInput({ value, onChange, error, className }: MedicationSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<MedicationSearchResult[]>([]);
  const [selected, setSelected] = useState<CatalogMedication>();
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

    const local = searchMedicationCatalog(searchTerm);
    setResults(local);
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res: any = await prescriptionsApi.searchMedications(searchTerm.trim());
        const remote = res?.data ?? res;
        if (active) setResults(mergeMedicationResults(local, Array.isArray(remote) ? remote : []));
      } catch {
        if (active) setResults(local);
      } finally {
        if (active) setLoading(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const handleSelect = (item: MedicationSearchResult) => {
    setSearchTerm(item.name);
    setIsOpen(false);

    setSelected(item.catalog);
    if (item.catalog) {
      onChange(item.name, getMedicationDefaults(item.catalog).type, item.catalog);
      return;
    }

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
    setSelected(undefined);
    setSearchTerm(val);
    onChange(val);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          aria-label="Medication name"
          autoComplete="off"
          onKeyDown={(event) => {
            if (event.key === 'Escape' || event.key === 'Enter') {
              event.preventDefault();
              setIsOpen(false);
            }
          }}
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

      {selected && value === selected.name && (
        <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
          <p>{selected.form}</p>
          <p dir="auto">{selected.doseText}</p>
          <p>Review the imported defaults and enter the patient’s schedule times.</p>
          {getMedicationDefaults(selected).frequencyConflict && (
            <p className="text-amber-700 dark:text-amber-400" role="status">
              Source frequency differs from the dose instructions. Enter the intended frequency.
            </p>
          )}
          {getMedicationDefaults(selected).staged && (
            <p className="text-amber-700 dark:text-amber-400">
              This regimen changes over time. The form holds one schedule; review the full instructions for later stages.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-rose-500 text-xs font-bold mt-1.5">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black tracking-wider text-slate-400 uppercase flex items-center justify-between">
            <span>Clinical Medication Catalog</span>
            {loading && <span className="text-primary font-bold dark:text-primary-300">Searching...</span>}
          </div>

          {results.length > 0 ? (
            <div className="p-1 divide-y divide-slate-50 dark:divide-slate-800/40">
              {results.map((item, idx) => {
                const isPharco = item.source === 'pharco';
                const isSuggestion = item.suggestion;
                const isCatalog = item.source === 'catalog';

                return (
                  <button
                    key={item.catalog?.id ?? `${item.name}-${idx}`}
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
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block truncate group-hover:text-primary transition-colors dark:group-hover:text-primary-300">
                          {item.name}
                        </span>
                        {item.catalog && (
                          <>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">{item.catalog.form}</span>
                            <span dir="auto" className="block text-xs text-slate-600 dark:text-slate-300 whitespace-normal">{item.catalog.doseText}</span>
                            <span dir="auto" className="block text-xs text-slate-500">{[item.catalog.frequencyText, item.catalog.durationText].filter(Boolean).join(' · ')}</span>
                          </>
                        )}
                        {isSuggestion && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
                            Pharco equivalent alternative
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      {isPharco ? (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-primary border border-indigo-100 dark:border-indigo-500/20 dark:text-primary-300">
                          Pharco Official
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          {isCatalog ? 'Drug List' : 'Doctor History'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 font-medium">
              No matching medication. Press Enter to use "{searchTerm}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
