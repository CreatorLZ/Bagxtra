'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadButton, UploadDropzone } from '@uploadthing/react';
import { Loader2, X, AlertCircle, ImageUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

interface PhotoUploadProps {
  endpoint: keyof OurFileRouter;
  // Single photo mode
  currentPhoto?: string;
  onPhotoUpdate?: (url: string) => void;
  onUploadComplete?: (url: string) => void;
  // Multiple photos mode
  currentPhotos?: string[];
  onPhotosUpdate?: (urls: string[]) => void;
  onMultipleUploadComplete?: (urls: string[]) => void;
  // Common props
  onUploadBegin?: () => void;
  onUploadError?: (error: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  showRemoveButton?: boolean;
  onRemove?: () => void;
  multiple?: boolean;
  maxFiles?: number;
}

export function PhotoUpload({
  endpoint,
  currentPhoto,
  onPhotoUpdate,
  currentPhotos = [],
  onPhotosUpdate,
  onUploadBegin,
  onUploadComplete,
  onMultipleUploadComplete,
  onUploadError,
  className = '',
  placeholder = '',
  disabled = false,
  showRemoveButton = true,
  onRemove,
  multiple = false,
  maxFiles = 3,
}: PhotoUploadProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

    if (res && res.length > 0) {
      if (multiple) {
        // Multiple files: collect all URLs and merge with existing
        const newUrls = res.map(file => file.url).filter(url => url);
        if (newUrls.length > 0) {
          setUploadStatus('success');
          const updatedPhotos = [...currentPhotos, ...newUrls].slice(0, maxFiles);
          onPhotosUpdate?.(updatedPhotos);
          onMultipleUploadComplete?.(newUrls);

          successTimeoutRef.current = setTimeout(() => {
            setUploadStatus('idle');
            setUploadProgress(0);
          }, 1500);
        } else {
          handleUploadError(new Error('No URLs returned from upload'));
        }
      } else {
        // Single file mode
        if (res[0]?.url) {
          const fileUrl = res[0].url;
          setUploadStatus('success');
          onPhotoUpdate?.(fileUrl);
          onUploadComplete?.(fileUrl);

          successTimeoutRef.current = setTimeout(() => {
            setUploadStatus('idle');
            setUploadProgress(0);
          }, 1500);
        } else {
          handleUploadError(new Error('No URL returned from upload'));
        }
      }
    } else {
      handleUploadError(new Error('No files returned from upload'));
    }
  };

  const handleUploadError = (err: Error) => {
    setUploadStatus('error');
    const msg = err.message || 'Upload failed';
    setError(msg);
    onUploadError?.(msg);

    setTimeout(() => {
      setUploadStatus('idle');
      setError('');
    }, 3000);
  };

  const handleRemove = (index?: number) => {
    if (multiple && index !== undefined) {
      // Remove specific photo from array
      const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
      onPhotosUpdate?.(updatedPhotos);
    } else {
      // Single photo mode
      setUploadStatus('idle');
      setUploadProgress(0);
      setError('');
      onRemove?.();
      onPhotoUpdate?.('');
    }
  };

  const showUploadIndicator = uploadStatus === 'uploading';
  const showSuccessIndicator = uploadStatus === 'success';
  
  // Check if we can upload more files
  const canUploadMore = multiple ? currentPhotos.length < maxFiles : !currentPhoto;
  const remainingSlots = multiple ? maxFiles - currentPhotos.length : 1;

  // Render multiple photos grid
  if (multiple) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="grid grid-cols-3 gap-3">
          {/* Render slots up to maxFiles */}
          {Array.from({ length: maxFiles }).map((_, index) => {
            const hasPhoto = currentPhotos[index];
            const isUploadSlot = index === currentPhotos.length && currentPhotos.length < maxFiles;

            if (hasPhoto) {
              // Existing photo slot
              return (
                <div
                  key={index}
                  className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden group transition-all duration-200 hover:border-purple-900 hover:bg-purple-50"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <img
                    src={hasPhoto}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover overlay for existing photos */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <ImageUp className="w-6 h-6 text-white" />
                  </div>
                  
                  {showRemoveButton && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(index);
                      }}
                      className="absolute top-2 right-2 z-20 p-1.5 bg-red-500 text-white rounded-full shadow-lg transition-all duration-200 hover:bg-red-600 hover:scale-110 opacity-0 group-hover:opacity-100"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            } else if (isUploadSlot) {
              // Active upload slot
              return (
                <div
                  key={index}
                  className={cn(
                    'relative aspect-square border-2 border-dashed rounded-lg overflow-hidden transition-all duration-200 bg-white dark:bg-slate-950',
                    isDragging ? 'border-purple-900 bg-purple-100 dark:bg-purple-900/20 scale-105' : 'border-gray-300 dark:border-gray-700',
                    isHovering && !isDragging && !disabled ? 'border-purple-900 bg-purple-50 dark:bg-purple-900/10' : '',
                    disabled && 'opacity-50 cursor-not-allowed',
                    error && 'border-red-500',
                  )}
                  onMouseEnter={() => !disabled && setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  {showUploadIndicator ? (
                    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-20">
                      <Loader2 className="w-8 h-8 text-purple-900 animate-spin mb-2" />
                      <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
                    </div>
                  ) : null}

                  {/* Drag overlay */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-purple-900/10 flex items-center justify-center z-15 pointer-events-none">
                      <div className="text-center">
                        <ImageUp className="w-10 h-10 text-purple-900 mx-auto mb-2 animate-bounce" />
                        <p className="text-sm font-semibold text-purple-900">Drop to upload</p>
                      </div>
                    </div>
                  )}

                  {!disabled && (
                    <div 
                      className="absolute inset-0 w-full h-full [&_.ut-button]:hidden [&_.ut-allowed-content]:hidden"
                      onDragEnter={() => setIsDragging(true)}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={() => setIsDragging(false)}
                    >
                      <UploadDropzone<OurFileRouter, typeof endpoint>
                        endpoint={endpoint}
                        onUploadBegin={() => {
                          setUploadStatus('uploading');
                          setUploadProgress(0);
                          setIsDragging(false);
                          onUploadBegin?.();
                        }}
                        onUploadProgress={(progress) => {
                          setUploadProgress(progress);
                        }}
                        onClientUploadComplete={handleUploadComplete}
                        onUploadError={handleUploadError}
                        onDrop={() => setIsDragging(true)}
                        disabled={disabled || uploadStatus === 'uploading'}
                        config={{
                          mode: "auto",
                        }}
                        appearance={{
                          container: "w-full h-full border-0 bg-transparent p-0",
                          uploadIcon: "hidden",
                          label: "hidden",
                          allowedContent: "hidden",
                          button: "hidden",
                        }}
                        content={{
                          uploadIcon: () => (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2">
                              <ImageUp className={cn(
                                "w-8 h-8 mb-2 transition-colors duration-200",
                                isHovering || isDragging ? "text-purple-900" : "text-gray-400"
                              )} />
                              <p className={cn(
                                "text-xs font-medium text-center transition-colors duration-200",
                                isHovering || isDragging ? "text-purple-900" : "text-gray-600"
                              )}>
                                {placeholder || `Photo ${index + 1}`}
                              </p>
                            </div>
                          ),
                          label: () => null,
                          allowedContent: () => null,
                          button: () => null,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            } else {
              // Empty placeholder slot (not yet active)
              return (
                <div
                  key={index}
                  className="relative aspect-square border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-900"
                >
                  <div className="w-full h-full flex flex-col items-center justify-center p-2">
                    <ImageUp className="w-8 h-8 mb-2 text-gray-300" />
                    <p className="text-xs font-medium text-gray-400 text-center">
                      Photo {index + 1}
                    </p>
                  </div>
                </div>
              );
            }
          })}
        </div>

        {/* Info text */}
        <p className="text-xs text-gray-500 text-center">
          {currentPhotos.length} of {maxFiles} photos uploaded
          {canUploadMore && ` • Click or drag to add more`}
        </p>

        {/* Error Toast */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Single photo mode (original behavior with UploadButton)
  return (
    <div className={cn("relative group", className)}>
      <div
        className={cn(
          'relative w-full h-full border-2 border-dashed rounded-lg overflow-hidden transition-all duration-200 bg-white dark:bg-slate-950',
          'focus-within:ring-2 focus-within:ring-purple-900 focus-within:border-purple-900 focus-within:ring-offset-2',
          isHovering && !disabled ? 'border-purple-900 bg-purple-50 dark:bg-purple-900/10' : 'border-gray-300 dark:border-gray-700',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500',
        )}
        onMouseEnter={() => !disabled && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {currentPhoto ? (
          <div className="relative w-full h-full">
            <img
              src={currentPhoto}
              alt="Uploaded content"
              className="w-full h-full object-cover"
            />
            
            {showUploadIndicator && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-30">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                <span className="text-xs text-white font-medium">{Math.round(uploadProgress)}%</span>
              </div>
            )}

            {showSuccessIndicator && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-30">
                <div className="bg-green-500 text-white rounded-full p-2 shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

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
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            {showUploadIndicator ? (
               <div className="flex flex-col items-center">
                 <Loader2 className="w-8 h-8 text-purple-900 animate-spin mb-2" />
                 <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
               </div>
            ) : (
              <>
                <ImageUp className={cn("w-10 h-10 mb-3", isHovering ? "text-purple-900" : "text-gray-400")} />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{placeholder}</p>
                <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP</p>
              </>
            )}
          </div>
        )}

        {showRemoveButton && currentPhoto && !showUploadIndicator && (
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

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 animate-in slide-in-from-top-2 fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}