'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadButton } from '@uploadthing/react';
import { Loader2, X, AlertCircle, ImageUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

interface PhotoUploadProps {
  endpoint: keyof OurFileRouter;
  currentPhoto?: string;
  onPhotoUpdate?: (url: string) => void;
  onUploadBegin?: () => void;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  showRemoveButton?: boolean;
  onRemove?: () => void;
}

export function PhotoUpload({
  endpoint,
  currentPhoto,
  onPhotoUpdate,
  onUploadBegin,
  onUploadComplete,
  onUploadError,
  className = '',
  placeholder = '',
  disabled = false,
  showRemoveButton = true,
  onRemove,
}: PhotoUploadProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleUploadComplete = (res: any[]) => {
    setUploadProgress(100);
    
    if (res && res.length > 0 && res[0].url) {
      const fileUrl = res[0].url;
      setUploadStatus('success');
      onPhotoUpdate?.(fileUrl);
      onUploadComplete?.(fileUrl);

      // Reset success status after 1.5s
      successTimeoutRef.current = setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 1500);
    } else {
      handleUploadError(new Error('No URL returned from upload'));
    }
  };

  const handleUploadError = (err: Error) => {
    setUploadStatus('error');
    const msg = err.message || 'Upload failed';
    setError(msg);
    onUploadError?.(msg);

    // Clear error after 3s
    setTimeout(() => {
      setUploadStatus('idle');
      setError('');
    }, 3000);
  };

  const handleRemove = () => {
    setUploadStatus('idle');
    setUploadProgress(0);
    setError('');
    onRemove?.();
    onPhotoUpdate?.('');
  };

  const showUploadIndicator = uploadStatus === 'uploading';
  const showSuccessIndicator = uploadStatus === 'success';
  const displayPhoto = currentPhoto; 

  return (
    <div className={cn("relative group", className)}>
      <div
        className={cn(
          'relative w-full h-full border-2 border-dashed rounded-lg overflow-hidden transition-all duration-200 bg-white dark:bg-slate-950',
          // Focus rings for accessibility
          'focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 focus-within:ring-offset-2',
          isHovering && !disabled ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' : 'border-gray-300 dark:border-gray-700',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500',
        )}
        onMouseEnter={() => !disabled && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* 1. Image Display */}
        {displayPhoto ? (
          <div className="relative w-full h-full">
            <img
              src={displayPhoto}
              alt="Uploaded content"
              className="w-full h-full object-cover"
            />
            
            {/* Loading Overlay */}
            {showUploadIndicator && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-30">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                <span className="text-xs text-white font-medium">{Math.round(uploadProgress)}%</span>
              </div>
            )}

            {/* Success Overlay */}
            {showSuccessIndicator && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-30">
                <div className="bg-green-500 text-white rounded-full p-2 shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Hover/Change Overlay */}
            {!showUploadIndicator && !showSuccessIndicator && (
              <div className={cn(
                "absolute inset-0 bg-black/50 flex flex-col items-center justify-center transition-opacity duration-200 z-10",
                isHovering ? "opacity-100" : "opacity-0"
              )}>
                <ImageUp className="w-8 h-8 text-white mb-2" />
                <span className="text-sm font-medium text-white">Change Photo</span>
              </div>
            )}
          </div>
        ) : (
          /* 2. Empty State / Placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            {showUploadIndicator ? (
               <div className="flex flex-col items-center">
                 <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                 <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
               </div>
            ) : (
              <>
                <ImageUp className={cn("w-10 h-10 mb-3", isHovering ? "text-purple-500" : "text-gray-400")} />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{placeholder}</p>
                <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP</p>
              </>
            )}
          </div>
        )}

        {/* 3. The Remove Button */}
        {showRemoveButton && displayPhoto && !showUploadIndicator && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemove();
            }}
            className={cn(
              "absolute top-2 right-2 z-20 p-1.5 bg-red-500 text-white rounded-full shadow-lg transition-all duration-200 hover:bg-red-600 hover:scale-110",
              isHovering ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            )}
            title="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* 4. UploadThing Button (Invisible Overlay) */}
        {!disabled && (
          <div className="absolute inset-0 w-full h-full z-10 [&_label]:!text-[0px] [&_label]:leading-[0] [&_input]:!text-[0px]">
            <UploadButton<OurFileRouter, keyof OurFileRouter>
              endpoint={endpoint}
              onUploadBegin={() => {
                setUploadStatus('uploading');
                setUploadProgress(0);
                onUploadBegin?.();
              }}
              onUploadProgress={(progress) => {
                setUploadProgress(progress);
              }}
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              disabled={disabled || uploadStatus === 'uploading'}
              appearance={{
                button: "w-full h-full bg-transparent focus-within:ring-0 !text-transparent cursor-pointer",
                allowedContent: "!hidden",
                container: "w-full h-full"
              }}
              content={{
                button: ({ ready }) => null,
                allowedContent: () => null,
              }}
              className="w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 animate-in slide-in-from-top-2 fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}