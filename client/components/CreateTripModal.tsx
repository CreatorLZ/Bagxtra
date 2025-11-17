'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  MapPin,
  CheckCircle,
  Pencil,
  Luggage,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { DatePicker } from '@/components/DatePicker';
import { TimePicker } from '@/components/TimePicker';
import { PhotoUpload } from '@/components/PhotoUpload';
import { format, parse } from 'date-fns';
import { useAuth } from '@clerk/nextjs';


// Assuming this FormField component is defined or imported globally if needed,
// but included here for self-contained functionality.
function FormField({
  id,
  label,
  children,
  className = '',
  icon,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`grid w-full items-center gap-1.5 ${className}`}>
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Validation function for trip draft
const isValidDraft = (obj: any): obj is FormData & { timestamp: number } => {
  if (typeof obj !== 'object' || obj === null) return false;
  const requiredFields: (keyof FormData)[] = [
    'departureCity',
    'departureDate',
    'departureTime',
    'arrivalCity',
    'arrivalDate',
    'arrivalTime',
    'checkInSpace',
    'carryOnSpace',
    'ticketPhoto',
  ];
  for (const key of requiredFields) {
    if (!(key in obj) || typeof obj[key] !== 'string') return false;
  }
  return typeof obj.timestamp === 'number';
};
// Helper functions for date/time parsing
const parseDate = (dateStr: string): Date | null => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
  const date = parseDate(dateStr);
  if (!date) return null;
  const timeParts = timeStr.split(':');
  if (timeParts.length !== 2) return null;
  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  date.setHours(hour, minute, 0, 0);
  return date;
};

// --- Main Modal Component ---
interface CreateTripModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface FormData {
  departureCity: string;
  departureDate: string;
  departureTime: string;
  arrivalCity: string;
  arrivalDate: string;
  arrivalTime: string;
  checkInSpace: string;
  carryOnSpace: string;
  ticketPhoto: string;
}

export function CreateTripModal({
  isOpen,
  onOpenChange,
}: CreateTripModalProps) {
  const { getToken } = useAuth();
  const [view, setView] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    departureCity: '',
    departureDate: '',
    departureTime: '',
    arrivalCity: '',
    arrivalDate: '',
    arrivalTime: '',
    checkInSpace: '',
    carryOnSpace: '',
    ticketPhoto: '',
  });

  const [canCarryFragile, setCanCarryFragile] = useState(false);
  const [canHandleSpecialDelivery, setCanHandleSpecialDelivery] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Reset view to 'form' when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('form');
      // Load draft from localStorage
      const draft = localStorage.getItem('tripDraft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (isValidDraft(parsed) && Date.now() - parsed.timestamp <= THIRTY_DAYS_MS) {
            const { timestamp, ...data } = parsed;
            // Convert old MM/dd/yyyy dates to yyyy-MM-dd
            const convertedData = { ...data };
            if (data.departureDate && data.departureDate.includes('/')) {
              const parsedDate = parse(data.departureDate, 'MM/dd/yyyy', new Date());
              convertedData.departureDate = format(parsedDate, 'yyyy-MM-dd');
            }
            if (data.arrivalDate && data.arrivalDate.includes('/')) {
              const parsedDate = parse(data.arrivalDate, 'MM/dd/yyyy', new Date());
              convertedData.arrivalDate = format(parsedDate, 'yyyy-MM-dd');
            }
            setFormData(convertedData);
          } else {
            localStorage.removeItem('tripDraft');
            console.warn('Discarded invalid or stale trip draft');
          }
        } catch (e) {
          localStorage.removeItem('tripDraft');
          console.warn('Failed to parse trip draft, discarded');
        }
      }
    }
  }, [isOpen]);

  // Auto-save draft
  useEffect(() => {
    if (isOpen && formData.departureCity) { // Only save if there's some data
      localStorage.setItem('tripDraft', JSON.stringify({ ...formData, timestamp: Date.now() }));
    }
  }, [formData, isOpen]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: keyof FormData) => {
    const validation = validateForm(formData);
    setFieldErrors(prev => ({ ...prev, [field]: validation.errors[field] || '' }));
  };

  const validateForm = (data: FormData): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // Check required fields
    if (!data.departureCity) errors.departureCity = 'Departure city is required';
    if (!data.arrivalCity) errors.arrivalCity = 'Arrival city is required';
    if (!data.departureDate) errors.departureDate = 'Departure date is required';
    if (!data.arrivalDate) errors.arrivalDate = 'Arrival date is required';
    if (!data.departureTime) errors.departureTime = 'Departure time is required';
    if (!data.arrivalTime) errors.arrivalTime = 'Arrival time is required';
    if (!data.checkInSpace) errors.checkInSpace = 'Check-in space is required';
    if (!data.carryOnSpace) errors.carryOnSpace = 'Carry-on space is required';

    // Validate dates
    if (data.departureDate) {
      if (!parseDate(data.departureDate)) {
        errors.departureDate = 'Invalid departure date format (YYYY-MM-DD)';
      }
    }
    if (data.arrivalDate) {
      if (!parseDate(data.arrivalDate)) {
        errors.arrivalDate = 'Invalid arrival date format (YYYY-MM-DD)';
      }
    }

    // Validate times
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (data.departureTime && !timeRegex.test(data.departureTime)) {
      errors.departureTime = 'Invalid departure time format. Use HH:mm (24-hour format)';
    }
    if (data.arrivalTime && !timeRegex.test(data.arrivalTime)) {
      errors.arrivalTime = 'Invalid arrival time format. Use HH:mm (24-hour format)';
    }

    // Validate that arrival is after departure
    if (data.departureDate && data.departureTime && data.arrivalDate && data.arrivalTime) {
      const depDateTime = parseDateTime(data.departureDate, data.departureTime);
      const arrDateTime = parseDateTime(data.arrivalDate, data.arrivalTime);
      if (depDateTime && arrDateTime && arrDateTime <= depDateTime) {
        errors.arrivalDate = 'Arrival date and time must be after departure date and time';
      }
    }

    // Validate spaces
    if (data.checkInSpace) {
      const num = parseFloat(data.checkInSpace);
      if (!isFinite(num) || num < 0.1 || num > 50) {
        errors.checkInSpace = 'Check-in space must be between 0.1 and 50 kg';
      }
    }
    if (data.carryOnSpace) {
      const num = parseFloat(data.carryOnSpace);
      if (!isFinite(num) || num < 0.1 || num > 50) {
        errors.carryOnSpace = 'Carry-on space must be between 0.1 and 50 kg';
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Validate form
      const validation = validateForm(formData);
      if (!validation.isValid) {
        setFieldErrors(validation.errors);
        return;
      }

      // Prepare data for API
      const tripData = {
        fromCountry: formData.departureCity,
        toCountry: formData.arrivalCity,
        departureDate: formData.departureDate,
        departureTime: formData.departureTime,
        arrivalDate: formData.arrivalDate,
        arrivalTime: formData.arrivalTime,
        availableCarryOnKg: parseFloat(formData.carryOnSpace),
        availableCheckedKg: parseFloat(formData.checkInSpace),
        ticketPhoto: formData.ticketPhoto || undefined,
        canCarryFragile,
        canHandleSpecialDelivery,
      };

      // Get Clerk token for authentication
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required. Please sign in to create a trip.');
      }

      // Make API call
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tripData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create trip');
      }

      // Success
      setView('success');

      // Reset form data after successful submission
      setFormData({
        departureCity: '',
        departureDate: '',
        departureTime: '',
        arrivalCity: '',
        arrivalDate: '',
        arrivalTime: '',
        checkInSpace: '',
        carryOnSpace: '',
        ticketPhoto: '',
      });
      setCanCarryFragile(false);
      setCanHandleSpecialDelivery(false);
      // Clear draft
      localStorage.removeItem('tripDraft');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      console.error('Trip creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renders the main form for entering trip details (matching the screenshot)
  const renderFormView = () => (
    <>
      <DialogHeader className="sticky top-0 bg-white z-10 p-6 pb-4 border-b rounded-t-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1 rounded-full hover:bg-gray-100"
            onClick={() => onOpenChange(false)} // Close modal
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Travel Details
          </DialogTitle>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          BagXtra holds payment until successful delivery. Items are to be dropped
          at nearby stores shown upon arrival.
        </p>
      </DialogHeader>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 rounded-b-xl">
        {/* 1. Departure City */}
        <FormField id="departure-city" label="Enter Departure city">
          <div className="relative">
            <Input
              id="departure-city"
              placeholder="Los Angeles, USA"
              className="h-11 pl-10"
              value={formData.departureCity}
              onChange={(e) => handleInputChange('departureCity', e.target.value)}
              onBlur={() => handleBlur('departureCity')}
              disabled={isSubmitting}
              aria-describedby={fieldErrors.departureCity ? 'departure-city-error' : undefined}
              aria-required="true"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {fieldErrors.departureCity && (
            <p id="departure-city-error" className="text-red-500 text-sm mt-1" role="alert">
              {fieldErrors.departureCity}
            </p>
          )}
        </FormField>

        {/* 2. Departure Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <FormField id="departure-date" label="Departure Date">
            <DatePicker
              date={formData.departureDate ? new Date(formData.departureDate) : undefined}
              onDateChange={(date) => handleInputChange('departureDate', date ? format(date, 'yyyy-MM-dd') : '')}
              placeholder="2025-12-11"
            />
          </FormField>
          <FormField id="departure-time" label="Departure Time">
            <TimePicker
              value={formData.departureTime}
              onChange={(time) => handleInputChange('departureTime', time)}
            />
          </FormField>
        </div>

        {/* 3. Arrival City */}
        <FormField id="arrival-city" label="Arrival City">
          <div className="relative">
            <Input
              id="arrival-city"
              placeholder="Port Harcourt, Nigeria"
              className="h-11 pl-10"
              value={formData.arrivalCity}
              onChange={(e) => handleInputChange('arrivalCity', e.target.value)}
              onBlur={() => handleBlur('arrivalCity')}
              disabled={isSubmitting}
              aria-describedby={fieldErrors.arrivalCity ? 'arrival-city-error' : undefined}
              aria-required="true"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {fieldErrors.arrivalCity && (
            <p id="arrival-city-error" className="text-red-500 text-sm mt-1" role="alert">
              {fieldErrors.arrivalCity}
            </p>
          )}
        </FormField>

        {/* 4. Arrival Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <FormField id="arrival-date" label="Arrival Date">
            <DatePicker
              date={formData.arrivalDate ? new Date(formData.arrivalDate) : undefined}
              onDateChange={(date) => handleInputChange('arrivalDate', date ? format(date, 'yyyy-MM-dd') : '')}
              placeholder="2025-12-11"
            />
          </FormField>
          <FormField id="arrival-time" label="Arrival Time">
            <TimePicker
              value={formData.arrivalTime}
              onChange={(time) => handleInputChange('arrivalTime', time)}
            />
          </FormField>
        </div>

        {/* 5. Available Check-In Luggage Space */}
        <FormField
          id="check-in-space"
          label="Available luggage Space - Check In"
          icon={<Luggage className="h-5 w-5 mr-2 inline" />}
        >
          <div className="relative">
            <input
              type="number"
              min="0.1"
              step="0.1"
              id="check-in-space"
              placeholder="e.g., 10.5"
              title="Enter available weight in kilograms (e.g., 5 for 5kg)"
              className="h-11 pl-3 pr-10 border rounded-md w-full"
              value={formData.checkInSpace}
              onChange={(e) => handleInputChange('checkInSpace', e.target.value)}
              onBlur={() => handleBlur('checkInSpace')}
              disabled={isSubmitting}
              aria-describedby={fieldErrors.checkInSpace ? 'check-in-space-error' : undefined}
              aria-required="true"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">KG</span>
          </div>
          {fieldErrors.checkInSpace && (
            <p id="check-in-space-error" className="text-red-500 text-sm mt-1" role="alert">
              {fieldErrors.checkInSpace}
            </p>
          )}
        </FormField>

        {/* 6. Available Carry-On Luggage Space */}
        <FormField
          id="carry-on-space"
          label="Available luggage Space - Carry On"
          icon={<Luggage className="h-5 w-5 mr-2 inline" />}
        >
          <div className="relative">
            <input
              type="number"
              min="0.1"
              step="0.1"
              id="carry-on-space"
              placeholder="e.g., 10.5"
              title="Enter available weight in kilograms (e.g., 5 for 5kg)"
              className="h-11 pl-3 pr-10 border rounded-md w-full"
              value={formData.carryOnSpace}
              onChange={(e) => handleInputChange('carryOnSpace', e.target.value)}
              onBlur={() => handleBlur('carryOnSpace')}
              disabled={isSubmitting}
              aria-describedby={fieldErrors.carryOnSpace ? 'carry-on-space-error' : undefined}
              aria-required="true"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">KG</span>
          </div>
          {fieldErrors.carryOnSpace && (
            <p id="carry-on-space-error" className="text-red-500 text-sm mt-1" role="alert">
              {fieldErrors.carryOnSpace}
            </p>
          )}
        </FormField>

        {/* Fragile Items Switch */}
        <div className='flex items-center justify-between'>
          <Label
            htmlFor='canCarryFragile'
            className='text-sm font-medium text-gray-700'
          >
            Can carry fragile items?
          </Label>
          <Switch
            id='canCarryFragile'
            checked={canCarryFragile}
            onCheckedChange={setCanCarryFragile}
          />
        </div>

        {/* Special Delivery Switch */}
        <div className='flex items-center justify-between'>
          <Label
            htmlFor='canHandleSpecialDelivery'
            className='text-sm font-medium text-gray-700'
          >
            Can handle special delivery?
          </Label>
          <Switch
            id='canHandleSpecialDelivery'
            checked={canHandleSpecialDelivery}
            onCheckedChange={setCanHandleSpecialDelivery}
          />
        </div>

        {/* 7. Ticket photo (Optional) */}
        <FormField id="ticket-photo" label="Ticket photo (Optional)" className="min-h-[10rem]">
          <PhotoUpload
            endpoint="ticketUploader"
            currentPhoto={formData.ticketPhoto}
            onPhotoUpdate={(url: string) => handleInputChange('ticketPhoto', url)}
            placeholder="Upload ticket photo"
            className="w-full h-full"
          />
        </FormField>

        {/* Submit Button */}
        <div className="pt-4 mt-4 border-t">
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {submitError}
            </div>
          )}
          <Button
            className="w-full bg-purple-900 hover:bg-purple-800 h-11"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Trip...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </div>
    </>
  );

  // Renders the success message view
  const renderSuccessView = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full bg-white">
      <CheckCircle className="h-16 w-16 text-purple-900 mb-4" />
      <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
        Trip Saved!
      </DialogTitle>
      <p className="text-sm text-gray-600 mb-6">
        You have 24 hours to edit or cancel your trip before it goes live to
        shoppers.
      </p>

      {/* Action Buttons */}
      <div className="space-y-3 w-full max-w-xs">
        <Button
          className="w-full bg-purple-900 hover:bg-purple-800 h-11"
          onClick={() => onOpenChange(false)} // Close the modal
        >
          Close
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 border-purple-900 text-purple-900 hover:bg-purple-50"
          onClick={() => setView('form')} // Go back to the form to edit
        >
          <Pencil className="h-4 w-4 mr-2" /> Edit Details
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        // Conditional styling for the success screen
        className={`sm:max-w-md lg:max-w-lg p-0 gap-0 flex ${
          view === 'form' ? 'flex-col max-h-[90vh] h-full' : 'max-h-[50vh]'
        } font-space-grotesk rounded-xl`}
      >
        {view === 'form' && renderFormView()}
        {view === 'success' && renderSuccessView()}
      </DialogContent>
    </Dialog>
  );
}