'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import useToast from '@/lib/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  onClear?: () => void;
  accept?: string[];
  maxSize?: number;
  className?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'free';
  disabled?: boolean;
}

const aspectRatioMap = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  free: 'min-h-[160px]',
};

export default function ImageUpload({
  value,
  onChange,
  onClear,
  accept = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxSize = 10 * 1024 * 1024,
  className,
  placeholder = 'Drop an image here, or click to upload',
  aspectRatio = 'free',
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      onChange?.(data.data.url);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadFile(acceptedFiles[0]);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
    disabled: disabled || uploading,
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        toast.error(`File is too large. Maximum ${maxSize / 1024 / 1024}MB allowed`);
      } else if (error?.code === 'file-invalid-type') {
        toast.error('Invalid file type. Please upload an image');
      }
    },
  });

  if (value) {
    return (
      <div className={cn('relative group rounded-xl overflow-hidden', aspectRatioMap[aspectRatio], className)}>
        <img
          src={value}
          alt="Uploaded"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = accept.join(',');
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) uploadFile(file);
              };
              input.click();
            }}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <Upload size={16} />
          </button>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
        'flex flex-col items-center justify-center gap-3 p-6 text-center',
        aspectRatioMap[aspectRatio],
        isDragActive
          ? 'border-indigo-500/60 bg-indigo-500/5'
          : 'border-[var(--border-default)] hover:border-indigo-500/40 hover:bg-white/2',
        (disabled || uploading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <>
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <p className="text-sm text-gray-400">Uploading...</p>
        </>
      ) : (
        <>
          <div className={cn(
            'p-3 rounded-xl transition-colors',
            isDragActive ? 'bg-indigo-500/20' : 'bg-white/5'
          )}>
            {isDragActive ? (
              <Upload size={24} className="text-indigo-400" />
            ) : (
              <ImageIcon size={24} className="text-gray-500" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-400">{placeholder}</p>
            <p className="text-xs text-gray-600 mt-1">
              PNG, JPG, WebP, GIF up to {maxSize / 1024 / 1024}MB
            </p>
          </div>
        </>
      )}
    </div>
  );
}
