'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OpenDisputeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  orderId: string;
}

export function OpenDisputeModal({
  isOpen,
  onOpenChange,
  orderId,
}: OpenDisputeModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    // TODO: Implement dispute creation logic
    console.log('Creating dispute for order:', orderId, { reason, description, amount });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open Dispute for Order {orderId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="item-not-as-described">Item not as described</SelectItem>
                <SelectItem value="late-delivery">Late delivery</SelectItem>
                <SelectItem value="damaged-item">Damaged item</SelectItem>
                <SelectItem value="wrong-item">Wrong item</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="amount">Disputed Amount (optional)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Submit Dispute</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}