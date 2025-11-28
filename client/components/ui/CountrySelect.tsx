'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CountrySelectProps {
  countries: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
}

export function CountrySelect({
  countries,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  className = '',
  'aria-describedby': ariaDescribedBy,
  'aria-required': ariaRequired,
}: CountrySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={`h-11 ${className}`}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {countries.map(country => (
          <SelectItem key={country} value={country}>
            {country}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
