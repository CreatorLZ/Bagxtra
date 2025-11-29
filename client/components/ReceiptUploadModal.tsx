'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: (receiptUrl: string) => void;
}

export function ReceiptUploadModal({
  isOpen,
  onOpenChange,
  onUploadSuccess,
}: ReceiptUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // TODO: Upload to your file storage service (UploadThing, Cloudinary, etc.)
      // For now, simulate upload and return a mock URL
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful upload URL
      const mockReceiptUrl = `https://example.com/receipts/${Date.now()}-${
        selectedFile.name
      }`;

      onUploadSuccess(mockReceiptUrl);

      // Reset modal
      setSelectedFile(null);
      setPreviewUrl(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-0 gap-0 bg-[#F8F9FA] rounded-3xl font-space-grotesk border-0 focus:outline-none'>
        <DialogHeader className='sr-only'>
          <DialogTitle>Upload Receipt</DialogTitle>
        </DialogHeader>

        <div className='p-6 space-y-6'>
          {/* Header */}
          <div className='text-center'>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Upload Receipt
            </h2>
            <p className='text-gray-600 text-sm'>
              Please upload a photo of your purchase receipt
            </p>
          </div>

          {/* Upload Area */}
          <div className='space-y-4'>
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className='border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors'
              >
                <Upload className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600 mb-2'>Click to upload receipt</p>
                <p className='text-sm text-gray-500'>
                  Supports: JPEG, PNG, GIF, WebP (max 5MB)
                </p>
              </div>
            ) : (
              <div className='relative'>
                <div className='border border-gray-200 rounded-xl p-4 bg-white'>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt='Receipt preview'
                      className='w-full h-48 object-contain rounded-lg mb-4'
                    />
                  )}
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium text-gray-900'>
                        {selectedFile.name}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className='p-2 text-gray-400 hover:text-red-500 transition-colors'
                    >
                      <X className='h-5 w-5' />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              className='hidden'
            />
          </div>

          {/* Buttons */}
          <div className='flex space-x-3 pt-4'>
            <Button
              onClick={() => onOpenChange(false)}
              variant='outline'
              className='flex-1 h-12 rounded-lg border-gray-200'
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className='flex-1 h-12 bg-purple-900 hover:bg-purple-800 text-white rounded-lg disabled:opacity-50'
            >
              {isUploading ? 'Uploading...' : 'Upload Receipt'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
