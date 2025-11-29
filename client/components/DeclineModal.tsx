'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useRejectMatch } from '@/hooks/useMatchActions';

// --- Reasons ---
const reasons = [
  'Shopper is stressful',
  'Too many Items',
  'Uncomfortable with the items',
  'Compensation is too low',
  'Customs or Legal Concerns',
  "Can't meet timeline",
];

interface DeclineModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onDeclineSuccess: () => void;
}

export function DeclineModal({
  isOpen,
  onOpenChange,
  orderId,
  onDeclineSuccess,
}: DeclineModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');

  const rejectMatch = useRejectMatch();

  // Handle checkbox toggle
  const toggleReason = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  // Word count logic (simple split by whitespace)
  const wordCount = otherReason.trim().split(/\s+/).filter(Boolean).length;

  const isValid = selectedReasons.length > 0 || otherReason.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    let reason = selectedReasons.join(', ');
    if (otherReason.trim()) {
      reason += reason ? ' ' + otherReason.trim() : otherReason.trim();
    }

    rejectMatch.mutate(
      { matchId: orderId, reason },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDeclineSuccess();
          // Reset form
          setSelectedReasons([]);
          setOtherReason('');
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-0 gap-0 bg-[#F8F9FA] max-h-[95vh] flex flex-col overflow-hidden rounded-3xl font-space-grotesk border-0 focus:outline-none'>
        <DialogHeader className='sr-only'>
          <DialogTitle>Reasons for Declining</DialogTitle>
        </DialogHeader>

        {/* Header - Sticky */}
        <div className='flex items-center justify-between p-6 bg-[#F8F9FA]'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => onOpenChange(false)}
              className='p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors'
            >
              <ChevronLeft className='h-5 w-5 text-gray-700' />
            </button>
            <h1 className='text-xl font-semibold text-gray-900'>
              Reasons for Declining
            </h1>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className='flex-1 overflow-y-auto px-6 pb-6 space-y-6 min-h-0'>
          {/* Reasons List */}
          <div className='space-y-4'>
            {reasons.map(reason => (
              <div key={reason} className='flex items-center space-x-3'>
                <Checkbox
                  id={reason}
                  checked={selectedReasons.includes(reason)}
                  onCheckedChange={() => toggleReason(reason)}
                  className='h-6 w-6 rounded-md border-gray-300 data-[state=checked]:bg-purple-900 data-[state=checked]:border-[#5B2C6F]'
                />
                <Label
                  htmlFor={reason}
                  className='text-base font-normal text-gray-700 cursor-pointer'
                >
                  {reason}
                </Label>
              </div>
            ))}
          </div>

          {/* "If others" Textarea */}
          <div className='space-y-3'>
            <Label className='text-base font-normal text-gray-700'>
              If others, state reason here
            </Label>
            <div className='relative'>
              <Textarea
                placeholder="I don't just feel like"
                className='min-h-[140px] resize-none border-gray-200 rounded-xl bg-white p-4 text-base '
                value={otherReason}
                onChange={e => setOtherReason(e.target.value)}
                maxLength={500} // Optional character limit
              />
              <div className='absolute bottom-4 right-4 text-xs text-gray-500 font-medium'>
                {wordCount}/100 words
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className='flex-shrink-0 p-6 bg-white border-t border-gray-100'>
          <div className='flex space-x-3'>
            <Button
              onClick={() => onOpenChange(false)}
              variant='outline'
              className='flex-1 h-12 rounded-lg border-gray-200'
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || rejectMatch.isPending}
              className='flex-1 h-12 bg-purple-900 hover:bg-purple-800 text-white rounded-lg disabled:opacity-50'
            >
              {rejectMatch.isPending ? 'Declining...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
