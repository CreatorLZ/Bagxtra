'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, FileText, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PhotoUpload } from './PhotoUpload';

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: (receiptUrl: string) => void;
}

export function ReceiptUploadModal({
  isOpen,
  onOpenChange,
  onUploadSuccess,
}: ReceiptUploadModalProps) {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUploadComplete = (url: string) => {
    setUploadedUrl(url);
  };

  const handleSubmit = () => {
    if (uploadedUrl && onUploadSuccess) {
      onUploadSuccess(uploadedUrl);
      setShowSuccess(true);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setUploadedUrl(null);
    onOpenChange(false);
  };

  // Auto-close success view after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        handleCloseSuccess();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-0 gap-0 bg-[#F8F9FA] h-[95vh] flex flex-col overflow-auto rounded-3xl font-space-grotesk border-0 focus:outline-none'>
        {showSuccess ? (
          // Success View
          <div className='flex flex-col items-center justify-center p-8 text-center h-full bg-white'>
            <CheckCircle className='h-16 w-16 text-purple-900 mb-4' />
            <DialogTitle className='text-xl font-bold text-gray-900 mb-2'>
              Receipt Submitted
            </DialogTitle>
            <p className='text-sm text-gray-600 mb-6'>
              Thank you, receipt has been sent to the shopper. We at BagXtra
              wish you a safe journey!
            </p>

            {/* Action Buttons */}
            <div className='space-y-3 w-full max-w-xs'>
              <Button
                className='w-full bg-purple-900 hover:bg-purple-800 h-11'
                onClick={handleCloseSuccess}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* --- Header --- */}
            <div className='flex items-center gap-4 p-6 pb-2'>
              <button
                onClick={() => onOpenChange(false)}
                className='p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors'
              >
                <ChevronLeft className='h-6 w-6 text-gray-700' />
              </button>
              <DialogTitle className='text-xl font-semibold text-gray-700'>
                Product Receipt
              </DialogTitle>
            </div>

            {/* --- Scrollable Body --- */}
            <div className='flex-1 overflow-y-auto px-0 py-4 flex flex-col items-center'>
              {/* Icon & Description */}
              <div className='flex flex-col items-center text-center mb-8 mt-4'>
                <img src='/invoice.png' alt='invoice img' />
                <p className='text-sm text-gray-600 leading-relaxed max-w-xs'>
                  To help with trust on both ends, we encourage our travelers to
                  take photos of the receipt and upload here
                </p>
              </div>

              {/* Upload Area */}
              <PhotoUpload
                endpoint='documentUploader'
                currentPhoto={uploadedUrl || ''}
                onPhotoUpdate={url => setUploadedUrl(url || null)}
                onUploadComplete={handleUploadComplete}
                placeholder='Upload receipt photo'
                className='md:h-[300px] md:w-[90%] h-[250px] w-[90%]'
              />
            </div>

            {/* --- Footer Action --- */}
            <div className='p-6 bg-[#F8F9FA]'>
              <Button
                onClick={handleSubmit}
                disabled={!uploadedUrl}
                className='w-full h-14 text-base font-medium bg-[#5B2C6F] hover:bg-[#4a235a] text-white rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50'
              >
                Submit Receipt
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
