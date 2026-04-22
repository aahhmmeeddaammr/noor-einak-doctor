import { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './Button';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  value?: string | File;
  onChange: (value: File | string) => void;
  label?: string;
  className?: string;
}

export default function ImageUpload({ value, onChange, label, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof value === 'string') {
      setPreview(value);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onChange(file);
  };

  const removeImage = () => {
    onChange('');
    setPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      <div className="relative group">
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 aspect-video bg-slate-50 dark:bg-slate-900">
            <img src={preview} alt="Uploaded content" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="rounded-full shadow-xl"
                onClick={removeImage}
              >
                <X size={18} />
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl aspect-video flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#3e4998] hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
          >
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-[#3e4998]/10 transition-colors">
              <Upload className="h-6 w-6 text-slate-400 group-hover:text-[#3e4998]" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to select media</p>
              <p className="text-[10px] font-medium text-slate-400">PNG, JPG or WebP (Max 5MB)</p>
            </div>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
