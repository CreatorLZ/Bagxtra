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
  ChevronLeft,
  MapPin,
  CheckCircle,
  Pencil,
  Luggage,
  Loader2,
} from 'lucide-react';
import { DatePicker } from '@/components/DatePicker';
import { TimePicker } from '@/components/TimePicker';
import { PhotoUpload } from '@/components/PhotoUpload';
import { CountrySelect } from '@/components/ui/CountrySelect';
import {
  TRAVELER_DEPARTURE_COUNTRIES,
  TRAVELER_ARRIVAL_COUNTRIES,
} from '@/lib/constants/countries';
import { format, parse } from 'date-fns';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';

// FormField component
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
      <Label htmlFor={id} className='text-sm font-medium text-gray-700'>
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
    'departureCountry',
    'departureDate',
    'departureTime',
    'arrivalCountry',
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
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    year < 1900 ||
    year > 2100
  )
    return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  return date;
};

const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
  const date = parseDate(dateStr);
  if (!date) return null;
  const timeParts = timeStr.split(':');
  if (timeParts.length !== 2) return null;
  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  if (
    isNaN(hour) ||
    isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  )
    return null;
  date.setHours(hour, minute, 0, 0);
  return date;
};

// Main Modal Component
interface CreateTripModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface FormData {
  departureCountry: string;
  departureDate: string;
  departureTime: string;
  arrivalCountry: string;
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
  const queryClient = useQueryClient();
  const [view, setView] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    departureCountry: '',
    departureDate: '',
    departureTime: '',
    arrivalCountry: '',
    arrivalDate: '',
    arrivalTime: '',
    checkInSpace: '',
    carryOnSpace: '',
    ticketPhoto: '',
  });

  const [canCarryFragile, setCanCarryFragile] = useState(false);
  const [canHandleSpecialDelivery, setCanHandleSpecialDelivery] =
    useState(false);
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
          if (
            isValidDraft(parsed) &&
            Date.now() - parsed.timestamp <= THIRTY_DAYS_MS
          ) {
            const { timestamp, ...data } = parsed;
            // Convert old yyyy-MM-dd dates to MM/dd/yyyy
            const convertedData = { ...data };
            if (data.departureDate && !data.departureDate.includes('/')) {
              const parsedDate = parse(
                data.departureDate,
                'yyyy-MM-dd',
                new Date()
              );
              convertedData.departureDate = format(parsedDate, 'MM/dd/yyyy');
            }
            if (data.arrivalDate && !data.arrivalDate.includes('/')) {
              const parsedDate = parse(
                data.arrivalDate,
                'yyyy-MM-dd',
                new Date()
              );
              convertedData.arrivalDate = format(parsedDate, 'MM/dd/yyyy');
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
    if (isOpen && formData.departureCountry) {
      localStorage.setItem(
        'tripDraft',
        JSON.stringify({ ...formData, timestamp: Date.now() })
      );
    }
  }, [formData, isOpen]);

  // Safeguard to reset isSubmitting if it hangs
  useEffect(() => {
    if (isSubmitting) {
      const resetTimer = setTimeout(() => {
        setIsSubmitting(false);
        setSubmitError('Request timed out. Please try again.');
      }, 30000);
      return () => clearTimeout(resetTimer);
    }
  }, [isSubmitting]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: keyof FormData) => {
    const validation = validateForm(formData);
    setFieldErrors(prev => ({
      ...prev,
      [field]: validation.errors[field] || '',
    }));
  };

  const validateForm = (
    data: FormData
  ): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!data.departureCountry)
      errors.departureCountry = 'Departure country is required';
    if (!data.arrivalCountry)
      errors.arrivalCountry = 'Arrival country is required';
    if (!data.departureDate)
      errors.departureDate = 'Departure date is required';
    if (!data.arrivalDate) errors.arrivalDate = 'Arrival date is required';
    if (!data.departureTime)
      errors.departureTime = 'Departure time is required';
    if (!data.arrivalTime) errors.arrivalTime = 'Arrival time is required';
    if (!data.checkInSpace) errors.checkInSpace = 'Check-in space is required';
    if (!data.carryOnSpace) errors.carryOnSpace = 'Carry-on space is required';

    if (data.departureDate && !parseDate(data.departureDate)) {
      errors.departureDate = 'Invalid departure date format (MM/dd/yyyy)';
    }
    if (data.arrivalDate && !parseDate(data.arrivalDate)) {
      errors.arrivalDate = 'Invalid arrival date format (MM/dd/yyyy)';
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (data.departureTime && !timeRegex.test(data.departureTime)) {
      errors.departureTime =
        'Invalid departure time format. Use HH:mm (24-hour format)';
    }
    if (data.arrivalTime && !timeRegex.test(data.arrivalTime)) {
      errors.arrivalTime =
        'Invalid arrival time format. Use HH:mm (24-hour format)';
    }

    if (
      data.departureDate &&
      data.departureTime &&
      data.arrivalDate &&
      data.arrivalTime
    ) {
      const depDateTime = parseDateTime(data.departureDate, data.departureTime);
      const arrDateTime = parseDateTime(data.arrivalDate, data.arrivalTime);
      if (depDateTime && arrDateTime && arrDateTime <= depDateTime) {
        errors.arrivalDate =
          'Arrival date and time must be after departure date and time';
      }
    }

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
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const validation = validateForm(formData);
      if (!validation.isValid) {
        setFieldErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const tripData = {
        fromCountry: formData.departureCountry,
        toCountry: formData.arrivalCountry,
        departureDate: formData.departureDate,
        departureTime: formData.departureTime,
        arrivalDate: formData.arrivalDate,
        arrivalTime: formData.arrivalTime,
        timezone,
        availableCarryOnKg: parseFloat(formData.carryOnSpace),
        availableCheckedKg: parseFloat(formData.checkInSpace),
        ticketPhoto: formData.ticketPhoto || undefined,
        canCarryFragile,
        canHandleSpecialDelivery,
      };

      const tokenPromise = getToken();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Token retrieval timed out')), 10000)
      );

      let token: string | null;
      try {
        token = await Promise.race([tokenPromise, timeoutPromise]);
      } catch (error) {
        console.error('getToken error:', error);
        setSubmitError('Authentication failed. Please sign in again.');
        setIsSubmitting(false);
        return;
      }

      if (!token) {
        setSubmitError('Authentication required. Please sign in.');
        setIsSubmitting(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tripData),
        signal: controller.signal,
      });

      const result = await response.json();
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (result.code === 'INSUFFICIENT_LEAD_TIME') {
          throw new Error(
            `${result.message}. ${result.suggestion || ''}`.trim()
          );
        } else if (result.code === 'INVALID_ROLE') {
          throw new Error(
            `${result.message}. ${result.suggestion || ''}`.trim()
          );
        } else if (result.code === 'USER_NOT_FOUND') {
          throw new Error(
            `${result.message}. ${result.suggestion || ''}`.trim()
          );
        } else if (result.code === 'INVALID_DATES') {
          throw new Error(
            `${result.message}. ${result.suggestion || ''}`.trim()
          );
        } else if (result.code === 'INVALID_TIMEZONE') {
          throw new Error(
            `${result.message}. ${result.suggestion || ''}`.trim()
          );
        } else if (result.code === 'VALIDATION_ERROR') {
          const firstError = result.details?.[0];
          if (firstError) {
            throw new Error(`Validation Error: ${firstError.message}`);
          }
          throw new Error('Please check your input and try again');
        } else {
          throw new Error(
            result.message ||
              result.error ||
              'Failed to create trip. Please try again.'
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setView('success');

      setFormData({
        departureCountry: '',
        departureDate: '',
        departureTime: '',
        arrivalCountry: '',
        arrivalDate: '',
        arrivalTime: '',
        checkInSpace: '',
        carryOnSpace: '',
        ticketPhoto: '',
      });
      setCanCarryFragile(false);
      setCanHandleSpecialDelivery(false);
      localStorage.removeItem('tripDraft');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setSubmitError(
          'Request timed out. Please check your connection and try again.'
        );
      } else {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';
        setSubmitError(errorMessage);
      }
      console.error('Trip creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormView = () => (
    <>
      <DialogHeader className='sticky top-0 bg-white z-10 p-6 pb-4 border-b rounded-none'>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            className='p-1 rounded-full hover:bg-gray-100 transition-colors'
            onClick={() => onOpenChange(false)}
          >
            <ChevronLeft className='h-6 w-6' />
          </button>
          <DialogTitle className='text-lg font-semibold text-gray-900'>
            Travel Details
          </DialogTitle>
        </div>
        <p className='text-sm text-gray-600 mt-2'>
          BagXtra holds payment until successful delivery. Items are to be
          dropped at nearby stores shown upon arrival.
        </p>
      </DialogHeader>

      <div className='flex-1 overflow-y-auto p-6 space-y-5 rounded-none'>
        {/* Departure Country */}
        <FormField id='departure-country' label='Select Departure Country'>
          <CountrySelect
            countries={TRAVELER_DEPARTURE_COUNTRIES}
            value={formData.departureCountry}
            onValueChange={value =>
              handleInputChange('departureCountry', value)
            }
            placeholder='Select departure country'
            disabled={isSubmitting}
            aria-describedby={
              fieldErrors.departureCountry
                ? 'departure-country-error'
                : undefined
            }
            aria-required
          />
          {fieldErrors.departureCountry && (
            <p
              id='departure-country-error'
              className='text-red-500 text-sm mt-1'
              role='alert'
            >
              {fieldErrors.departureCountry}
            </p>
          )}
        </FormField>

        {/* Departure Date & Time */}
        <div className='grid grid-cols-2 gap-4'>
          <FormField id='departure-date' label='Departure Date'>
            <DatePicker
              date={parseDate(formData.departureDate) || undefined}
              onDateChange={date =>
                handleInputChange(
                  'departureDate',
                  date ? format(date, 'MM/dd/yyyy') : ''
                )
              }
              placeholder='12/11/2025'
            />
            {fieldErrors.departureDate && (
              <p
                id='departure-date-error'
                className='text-red-500 text-sm mt-1'
                role='alert'
              >
                {fieldErrors.departureDate}
              </p>
            )}
          </FormField>
          <FormField id='departure-time' label='Departure Time'>
            <TimePicker
              value={formData.departureTime}
              onChange={time => handleInputChange('departureTime', time)}
            />
            {fieldErrors.departureTime && (
              <p
                id='departure-time-error'
                className='text-red-500 text-sm mt-1'
                role='alert'
              >
                {fieldErrors.departureTime}
              </p>
            )}
          </FormField>
        </div>

        {/* Arrival Country */}
        <FormField id='arrival-country' label='Select Arrival Country'>
          <CountrySelect
            countries={TRAVELER_ARRIVAL_COUNTRIES}
            value={formData.arrivalCountry}
            onValueChange={value => handleInputChange('arrivalCountry', value)}
            placeholder='Select arrival country'
            disabled={isSubmitting}
            aria-describedby={
              fieldErrors.arrivalCountry ? 'arrival-country-error' : undefined
            }
            aria-required
          />
          {fieldErrors.arrivalCountry && (
            <p
              id='arrival-country-error'
              className='text-red-500 text-sm mt-1'
              role='alert'
            >
              {fieldErrors.arrivalCountry}
            </p>
          )}
        </FormField>

        {/* Arrival Date & Time */}
        <div className='grid grid-cols-2 gap-4'>
          <FormField id='arrival-date' label='Arrival Date'>
            <DatePicker
              date={parseDate(formData.arrivalDate) || undefined}
              onDateChange={date =>
                handleInputChange(
                  'arrivalDate',
                  date ? format(date, 'MM/dd/yyyy') : ''
                )
              }
              placeholder='12/11/2025'
            />
            {fieldErrors.arrivalDate && (
              <p
                id='arrival-date-error'
                className='text-red-500 text-sm mt-1'
                role='alert'
              >
                {fieldErrors.arrivalDate}
              </p>
            )}
          </FormField>
          <FormField id='arrival-time' label='Arrival Time'>
            <TimePicker
              value={formData.arrivalTime}
              onChange={time => handleInputChange('arrivalTime', time)}
            />
            {fieldErrors.arrivalTime && (
              <p
                id='arrival-time-error'
                className='text-red-500 text-sm mt-1'
                role='alert'
              >
                {fieldErrors.arrivalTime}
              </p>
            )}
          </FormField>
        </div>

        {/* Check-In Space */}
        <FormField
          id='check-in-space'
          label='Available luggage Space - Check In'
          icon={<Luggage className='h-5 w-5 mr-2 inline' />}
        >
          <div className='relative'>
            <input
              type='number'
              min='0.1'
              step='0.1'
              id='check-in-space'
              placeholder='e.g., 10.5'
              className='h-11 pl-3 pr-10 border rounded-md w-full transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
              value={formData.checkInSpace}
              onChange={e => handleInputChange('checkInSpace', e.target.value)}
              onBlur={() => handleBlur('checkInSpace')}
              disabled={isSubmitting}
            />
            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'>
              KG
            </span>
          </div>
          {fieldErrors.checkInSpace && (
            <p
              id='check-in-space-error'
              className='text-red-500 text-sm mt-1'
              role='alert'
            >
              {fieldErrors.checkInSpace}
            </p>
          )}
        </FormField>

        {/* Carry-On Space */}
        <FormField
          id='carry-on-space'
          label='Available luggage Space - Carry On'
          icon={<Luggage className='h-5 w-5 mr-2 inline' />}
        >
          <div className='relative'>
            <input
              type='number'
              min='0.1'
              step='0.1'
              id='carry-on-space'
              placeholder='e.g., 10.5'
              className='h-11 pl-3 pr-10 border rounded-md w-full transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
              value={formData.carryOnSpace}
              onChange={e => handleInputChange('carryOnSpace', e.target.value)}
              onBlur={() => handleBlur('carryOnSpace')}
              disabled={isSubmitting}
            />
            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'>
              KG
            </span>
          </div>
          {fieldErrors.carryOnSpace && (
            <p
              id='carry-on-space-error'
              className='text-red-500 text-sm mt-1'
              role='alert'
            >
              {fieldErrors.carryOnSpace}
            </p>
          )}
        </FormField>

        {/* Fragile Items Switch */}
        <div className='flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors'>
          <Label
            htmlFor='canCarryFragile'
            className='text-sm font-medium text-gray-700 cursor-pointer'
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
        <div className='flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors'>
          <Label
            htmlFor='canHandleSpecialDelivery'
            className='text-sm font-medium text-gray-700 cursor-pointer'
          >
            Can handle special delivery?
          </Label>
          <Switch
            id='canHandleSpecialDelivery'
            checked={canHandleSpecialDelivery}
            onCheckedChange={setCanHandleSpecialDelivery}
          />
        </div>

        {/* Ticket Photo */}
        <FormField
          id='ticket-photo'
          label='Ticket photo'
          className='min-h-[10rem]'
        >
          <PhotoUpload
            endpoint='ticketUploader'
            currentPhoto={formData.ticketPhoto}
            onPhotoUpdate={(url: string) =>
              handleInputChange('ticketPhoto', url)
            }
            placeholder='Upload ticket photo'
            className='w-full h-full'
          />
          {fieldErrors.ticketPhoto && (
            <p
              id='ticket-photo-error'
              className='text-red-500 text-sm mt-1'
              role='alert'
            >
              {fieldErrors.ticketPhoto}
            </p>
          )}
        </FormField>

        {/* Submit Button */}
        <div className='pt-4 mt-4 border-t'>
          {submitError && (
            <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  <svg
                    className='h-5 w-5 text-red-400'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>
                    Unable to Create Trip
                  </h3>
                  <div className='mt-2 text-sm text-red-700'>{submitError}</div>
                </div>
              </div>
            </div>
          )}
          <Button
            className='w-full bg-purple-900 hover:bg-purple-800 hover:cursor-pointer h-11 transition-all active:scale-[0.98]'
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
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

  const renderSuccessView = () => (
    <div className='flex flex-col items-center justify-center p-8 text-center h-full bg-white animate-in fade-in zoom-in-95'>
      <CheckCircle className='h-16 w-16 text-purple-900 mb-4 animate-in zoom-in' />
      <DialogTitle className='text-xl font-bold text-gray-900 mb-2'>
        Trip Saved!
      </DialogTitle>
      <p className='text-sm text-gray-600 mb-6'>
        You have 24 hours to edit or cancel your trip before it goes live to
        shoppers.
      </p>

      <div className='space-y-3 w-full max-w-xs'>
        <Button
          className='w-full bg-purple-900 hover:bg-purple-800 h-11 transition-all active:scale-[0.98]'
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
        <Button
          variant='outline'
          className='w-full h-11 border-purple-900 text-purple-900 hover:bg-purple-50 transition-all active:scale-[0.98]'
          onClick={() => setView('form')}
        >
          <Pencil className='h-4 w-4 mr-2' /> Edit Details
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-md lg:max-w-lg p-0 gap-0 flex ${
          view === 'form' ? 'flex-col max-h-[90vh] h-full' : 'max-h-[50vh]'
        } font-space-grotesk rounded-none`}
      >
        {view === 'form' && renderFormView()}
        {view === 'success' && renderSuccessView()}
      </DialogContent>
    </Dialog>
  );
}
