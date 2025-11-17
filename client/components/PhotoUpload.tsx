'use client';

import { useState, useRef, useCallback } from 'react';
import { UploadButton } from '@uploadthing/react';
import { Upload, Loader2, X } from 'lucide-react';
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
  placeholder = 'Click to upload photo',
  disabled = false,
  showRemoveButton = false,
  onRemove,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string>('');

  const handleUploadComplete = useCallback(
    async (res: any) => {
      setIsUploading(false);
      setError('');

      if (res && res[0]) {
        const url = res[0].url;
        onPhotoUpdate?.(url);
        onUploadComplete?.(url);
      }
    },
    [onPhotoUpdate, onUploadComplete]
  );

  const handleUploadError = useCallback(
    (error: Error) => {
      setIsUploading(false);
      const errorMessage = `Upload failed: ${error.message}`;
      setError(errorMessage);
      onUploadError?.(errorMessage);
    },
    [onUploadError]
  );

  const handleUploadBegin = useCallback(() => {
    setIsUploading(true);
    setError('');
    onUploadBegin?.();
  }, [onUploadBegin]);

  const handleRemove = useCallback(() => {
    onRemove?.();
    onPhotoUpdate?.('');
  }, [onRemove, onPhotoUpdate]);

  return (
    <div
      className={cn(
        'relative w-full h-full border-2 border-dashed rounded-lg overflow-hidden',
        isHovering && !disabled ? 'border-purple-800 bg-purple-50' : 'border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
        error && 'border-red-400 bg-red-50',
        className
      )}
      onMouseEnter={() => !disabled && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Current Photo Display */}
      {currentPhoto ? (
        <div className="relative w-full h-full">
          <img
            src={currentPhoto}
            alt="Uploaded photo"
            className="w-full h-full object-cover"
          />
          {/* Overlay for actions */}
          <div
            className={cn(
              'absolute inset-0 bg-black bg-opacity-0 flex items-center justify-center transition-all duration-200',
              (isHovering || isUploading) && 'bg-opacity-40'
            )}
          >
            {isUploading ? (
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <div className="text-sm">Uploading...</div>
              </div>
            ) : (
              <div className={cn("text-center text-white transition-opacity", (isHovering || isUploading) ? "opacity-100" : "opacity-0")}>
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm">Change Photo</div>
              </div>
            )}
          </div>

          {/* Remove button */}
          {showRemoveButton && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Placeholder when no photo */
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 mb-2 animate-spin text-purple-600" />
              <div className="text-sm">Uploading...</div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 mb-2" />
              <div className="text-sm text-center">{placeholder}</div>
              <div className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 4MB</div>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-2 text-center">
          {error}
        </div>
      )}

      {/* Hidden Upload Button */}
      {!disabled && (
        <UploadButton<OurFileRouter, typeof endpoint>
          endpoint={endpoint}
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onUploadBegin={handleUploadBegin}
          disabled={isUploading || disabled}
          content={{
            button: () => null,
            allowedContent: () => null,
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      )}
    </div>
  );
}