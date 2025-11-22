'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { UploadButton } from '@uploadthing/react';
import { Upload, Loader2, X, AlertCircle, ImageUp } from 'lucide-react';
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
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function PhotoUpload({
  endpoint,
  currentPhoto,
  onPhotoUpdate,
  onUploadBegin,
  onUploadComplete,
  onUploadError,
  className = '',
  placeholder = 'Click to upload photo',
  disabled = false,
  showRemoveButton = true,
  onRemove,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.85,
}: PhotoUploadProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, [previewUrl]);

  // Compress and resize image
  const compressImage = useCallback(
    (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions maintaining aspect ratio
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  reject(new Error('Canvas to Blob conversion failed'));
                }
              },
              'image/jpeg',
              quality
            );
          };
          img.onerror = () => reject(new Error('Image load failed'));
        };
        reader.onerror = () => reject(new Error('File read failed'));
      });
    },
    [maxWidth, maxHeight, quality]
  );

  // Upload file to UploadThing
  const uploadFile = useCallback(
    async (file: File) => {
      setUploadStatus('uploading');
      setError('');
      onUploadBegin?.();

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      try {
        // Use UploadThing's startUpload method
        // Replace with actual implementation:
        // const { startUpload } = useUploadThing(endpoint);
        // const res = await startUpload([file]);
        
        // Simulated upload for demonstration
        await new Promise(resolve => setTimeout(resolve, 2000));
        const simulatedUrl = URL.createObjectURL(file);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadStatus('success');
        
        onPhotoUpdate?.(simulatedUrl);
        onUploadComplete?.(simulatedUrl);

        // Reset status after a brief success indication
        uploadTimeoutRef.current = setTimeout(() => {
          setUploadStatus('idle');
          setUploadProgress(0);
        }, 1500);
        
      } catch (err) {
        clearInterval(progressInterval);
        setUploadStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        onUploadError?.(errorMessage);
        
        // Reset error after 3 seconds
        uploadTimeoutRef.current = setTimeout(() => {
          setUploadStatus('idle');
          setError('');
        }, 3000);
      }
    },
    [endpoint, onPhotoUpdate, onUploadComplete, onUploadError, onUploadBegin]
  );

  // Handle file selection with instant preview + background upload
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // Clean up previous preview
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        // Create instant preview
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
        setError('');

        // Compress and upload in background
        const compressed = await compressImage(file);
        await uploadFile(compressed);
        
      } catch (err) {
        setError('Failed to process image');
        console.error(err);
      }

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [previewUrl, compressImage, uploadFile]
  );

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setUploadStatus('idle');
    setUploadProgress(0);
    setError('');
    onRemove?.();
    onPhotoUpdate?.('');
  }, [previewUrl, onRemove, onPhotoUpdate]);

  const displayPhoto = previewUrl || currentPhoto;
  const showUploadIndicator = uploadStatus === 'uploading';
  const showSuccessIndicator = uploadStatus === 'success';

  return (
    <div className="relative">
      <div
        className={cn(
          'relative w-full h-full border-2 border-dashed rounded-lg overflow-hidden transition-all duration-200',
          isHovering && !disabled ? 'border-purple-900 bg-purple-50' : 'border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-400',
          className
        )}
        onMouseEnter={() => !disabled && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Current Photo or Preview Display */}
        {displayPhoto ? (
          <div className="relative w-full h-full">
            <img
              src={displayPhoto}
              alt="Uploaded photo"
              className="w-full h-full object-cover"
            />
            
            {/* Upload Progress Overlay */}
            {showUploadIndicator && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <div className="text-xs">{Math.round(uploadProgress)}%</div>
                </div>
              </div>
            )}

            {/* Success Indicator */}
            {showSuccessIndicator && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center pointer-events-none">
                <div className="bg-green-500 text-white rounded-full p-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Hover Overlay */}
            {!showUploadIndicator && !showSuccessIndicator && (
              <div
                className={cn(
                  'absolute inset-0 bg-black  flex items-center justify-center transition-all duration-200',
                 isHovering ? 'bg-black/60' : 'bg-transparent' 
                )}
              >
                <div
                  className={cn(
                    'text-center text-white transition-opacity duration-200',
                    isHovering ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <ImageUp className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Change Photo</div>
                </div>
              </div>
            )}

            {/* Remove button */}
            {showRemoveButton && !showUploadIndicator && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering file input
                  handleRemove();
                }}
                className={cn(
                  "absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all shadow-lg z-10",
                  isHovering ? "opacity-100 scale-100" : "opacity-0 scale-90"
                )}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* Placeholder when no photo */
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-6">
            <ImageUp className="w-10 h-10 mb-3 text-gray-400" />
            {/* <div className="text-sm text-center font-medium text-gray-600">{placeholder}</div> */}
            <div className="text-[10px] text-gray-400 mt-2">JPG, PNG, WEBP up to 3MB</div>
          </div>
        )}

        {/* Hidden File Input */}
        {!disabled && (
          <input
            ref={fileInputRef}
            type="file"
            title=''
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            disabled={disabled || uploadStatus === 'uploading'}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        )}
      </div>

      {/* Error Message - Subtle toast style */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}