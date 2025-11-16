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
} from 'lucide-react';
import Image from 'next/image';
import { DatePicker } from '@/components/DatePicker';
import { TimePicker } from '@/components/TimePicker';
import { PhotoUpload } from '@/components/PhotoUpload';
import { format } from 'date-fns';
import { useAuth } from '@clerk/nextjs';


// Assuming this FormField component is defined or imported globally if needed,
// but included here for self-contained functionality.
function FormField({
  id,
  label,
  children,
  className = '',
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid w-full items-center gap-1.5 ${className}`}>
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      {children}
    </div>
  );
}

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

  // Reset view to 'form' when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('form');
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Validate required fields
      if (!formData.departureCity || !formData.arrivalCity || !formData.departureDate ||
          !formData.arrivalDate || !formData.departureTime || !formData.arrivalTime ||
          !formData.checkInSpace || !formData.carryOnSpace) {
        throw new Error('Please fill in all required fields');
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
        canCarryFragile: true, // Default values
        canHandleSpecialDelivery: true,
      };

      // Get Clerk token for authentication
      const token = await getToken();

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
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </FormField>

        {/* 2. Departure Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <FormField id="departure-date" label="Departure Date">
            <DatePicker
              date={formData.departureDate ? new Date(formData.departureDate) : undefined}
              onDateChange={(date) => handleInputChange('departureDate', date ? format(date, 'MM/dd/yyyy') : '')}
              placeholder="12/11/2025"
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
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </FormField>

        {/* 4. Arrival Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <FormField id="arrival-date" label="Arrival Date">
            <DatePicker
              date={formData.arrivalDate ? new Date(formData.arrivalDate) : undefined}
              onDateChange={(date) => handleInputChange('arrivalDate', date ? format(date, 'MM/dd/yyyy') : '')}
              placeholder="12/11/2025"
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
        >
          <Input
            id="check-in-space"
            placeholder="5KG"
            className="h-11"
            value={formData.checkInSpace}
            onChange={(e) => handleInputChange('checkInSpace', e.target.value)}
          />
        </FormField>

        {/* 6. Available Carry-On Luggage Space */}
        <FormField
          id="carry-on-space"
          label="Available luggage Space - Carry On"
        >
          <Input
            id="carry-on-space"
            placeholder="5KG"
            className="h-11"
            value={formData.carryOnSpace}
            onChange={(e) => handleInputChange('carryOnSpace', e.target.value)}
          />
        </FormField>

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
            {isSubmitting ? 'Creating Trip...' : 'Submit'}
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