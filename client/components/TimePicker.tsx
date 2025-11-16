'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  className,
}: TimePickerProps) {
  const [hour, setHour] = React.useState<string>('');
  const [minute, setMinute] = React.useState<string>('');

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHour(h || '');
      setMinute(m || '');
    } else {
      setHour('');
      setMinute('');
    }
  }, [value]);

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    const newTime = `${newHour}:${minute || '00'}`;
    onChange?.(newTime);
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    const newTime = `${hour || '00'}:${newMinute}`;
    onChange?.(newTime);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Clock className="h-4 w-4 text-gray-400" />
      <Select value={hour} onValueChange={handleHourChange}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span>:</span>
      <Select value={minute} onValueChange={handleMinuteChange}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}