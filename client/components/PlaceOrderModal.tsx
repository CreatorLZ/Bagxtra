'use client';

import { useState } from 'react';
import { useOrderStore } from '@/stores/orderStore';
import { useShopperRequestMatches } from '@/hooks/useShopperRequestMatches';
import { useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox'; // New
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // New
import {
  ChevronLeft,
  Search,
  Car,
  Baby,
  Shirt,
  HeartPulse,
  Gamepad2,
  Home,
  Package,
  Plus,
  Minus,
  ExternalLink,
  MapPin, // New
  CalendarDays, // New
  Info, // New
  Plane, // New
  Star, // New
  CheckCircle, // New
} from 'lucide-react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { DatePicker } from '@/components/DatePicker';
import NextImage from 'next/image';
import { format, parse } from 'date-fns';
import { parseDateTimeToUTC } from '@/lib/utils/dateUtils';

// --- Mock Data (from previous step, still needed) ---
const categories = [
  {
    name: 'Automotive & Travel Gear',
    desc: 'No heavy or large vehicle parts',
    icon: <Car className='h-5 w-5' />,
  },
  {
    name: 'Baby & Kids Essentials',
    desc: 'No large strollers or car seats',
    icon: <Baby className='h-5 w-5' />,
  },
  {
    name: 'Beauty & Personal Care',
    desc: 'No liquids above 100ml',
    icon: <Package className='h-5 w-5' />,
  },
  {
    name: 'Clothing & Accessories',
    desc: 'No replica items',
    icon: <Shirt className='h-5 w-5' />,
  },
  {
    name: 'Fitness & Outdoors',
    desc: 'No heavy dumbbells, bicycles, or tents',
    icon: <HeartPulse className='h-5 w-5' />,
  },
  {
    name: 'Gaming & Entertainment',
    desc: 'No arcade-sized gear or units',
    icon: <Gamepad2 className='h-5 w-5' />,
  },
  {
    name: 'Health & Wellness',
    desc: 'No liquids above 100ml',
    icon: <HeartPulse className='h-5 w-5' />,
  },
  {
    name: 'Home & Lifestyle',
    desc: 'No large appliances or furniture',
    icon: <Home className='h-5 w-5' />,
  },
];
const stores = [
  { name: 'Amazon', logo: '/amazon.png', url: 'https://www.amazon.com' },
  { name: 'Walmart', logo: '/walmart.png', url: 'https://www.walmart.com' },
  { name: 'Adidas', logo: '/adidas.png', url: 'https://www.adidas.com' },
  { name: 'Apple', logo: '/Apples.png', url: 'https://www.apple.com' },
  { name: 'IKEA', logo: '/Ikea.png', url: 'https://www.ikea.com' },
  { name: 'Gucci', logo: '/gucci.png', url: 'https://www.gucci.com' },
];



// --- Helper Components ---
function FormField({
  id,
  label,
  children,
  className = '',
}: {
  id: string;
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid w-full items-center gap-1.5 ${className}`}>
      <Label htmlFor={id} className='text-sm font-medium text-gray-700'>
        {label}
      </Label>
      {children}
    </div>
  );
}

// New Helper for Radio Options
function RadioOption({
  id,
  label,
  infoText,
}: {
  id: string;
  label: string;
  infoText: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value={id} id={id} />
        <Label htmlFor={id} className="font-medium text-gray-800">
          {label}
        </Label>
      </div>
      <button title={infoText}>
        <Info className="h-5 w-5 text-gray-400" />
      </button>
    </div>
  );
}

// Helper functions for date/time parsing
const parseDate = (dateStr: string): Date | null => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

// Traveler Card Component
function TravelerCard({
  match,
  onBookTraveler,
  isBooking,
}: {
  match: {
    _id: string;
    matchScore: number;
    travelerName: string;
    travelerAvatar: string | null;
    travelerRating: number;
    flightDetails: {
      from: string;
      to: string;
      departureDate: string;
      departureTime: string;
      arrivalDate: string;
      arrivalTime: string;
      timezone: string;
      airline: string;
    };
    capacityFit: {
      fitsCarryOn: boolean;
      availableCarryOnKg: number;
      availableCheckedKg: number;
    };
    rationale: string[];
  };
  onBookTraveler: (matchId: string) => void;
  isBooking: boolean;
}) {
  const getMatchColor = (matchScore: number) => {
    if (matchScore >= 90) return 'text-purple-900';
    if (matchScore >= 70) return 'text-purple-900';
    return 'text-red-600';
  };

  /**
   * Calculates the actual flight duration based on departure and arrival date/time.
   * @returns Duration in format "XhYm" (e.g., "2h30m")
   */
  const calculateDuration = (): string => {
    try {
      const depDateTime = parseDateTimeToUTC(match.flightDetails.departureDate, match.flightDetails.departureTime, match.flightDetails.timezone);
      const arrDateTime = parseDateTimeToUTC(match.flightDetails.arrivalDate, match.flightDetails.arrivalTime, match.flightDetails.timezone);

      const diffMs = arrDateTime.getTime() - depDateTime.getTime();
      if (diffMs < 0) return 'Invalid duration';

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h${minutes.toString().padStart(2, '0')}m`;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'Invalid duration';
    }
  };


  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4 shadow-sm">
      {/* Top Section: Profile + Book Button */}
      <div className="flex justify-between items-center border-b border-b-gray-200 pb-2.5">
        <div className="flex flex-col items-left gap-3">
          <NextImage
            src={match.travelerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop'}
            alt={match.travelerName}
            width={80}
            height={80}
            className="rounded-lg bg-gray-200 h-24 w-24 object-cover"
          />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 flex items-center justify-center gap-1 font-sans">
              {match.travelerName}
              <img src="/verified.png" alt="verified" className='h-4 w-4' />
            </h3>
            <div className="flex gap-0.5 justify-start">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(match.travelerRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-purple-900 border-purple-900 hover:bg-purple-50 hover:text-purple-800 cursor-pointer disabled:opacity-50"
          onClick={() => onBookTraveler(match._id)}
          disabled={isBooking}
        >
          {isBooking ? 'Booking...' : 'Book Traveler'}
        </Button>
      </div>

      {/* Middle Section: Flight Info */}
      <div className="flex justify-between items-center text-sm">
        <div className="text-left">
          <div className="text-lg font-bold text-gray-900">
            {match.flightDetails.from}
          </div>
          <div className="text-gray-600 flex">{match.flightDetails.departureDate} <span className='pl-3'>--------</span></div>
          <div className="text-gray-600">{match.flightDetails.departureTime}</div>
        </div>
        <div className="text-center text-gray-500">
          <Plane className="mx-auto" />
          <div className="mt-1">{calculateDuration()}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{match.flightDetails.to}</div>
          <div className="text-gray-600 flex"><span className='pr-3'>--------</span>{match.flightDetails.arrivalDate}</div>
          <div className="text-gray-600">{match.flightDetails.arrivalTime}</div>
        </div>
      </div>

      {/* Bottom Section: Match Score & Capacity Info */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {match.capacityFit.fitsCarryOn ? 'Carry-on friendly' : 'Checked baggage'}
        </div>
        <div
          className={`text-center font-semibold px-3 py-1 rounded-none border-b border-b-purple-900 ${getMatchColor(match.matchScore)}`}
        >
          {match.matchScore}% Match
        </div>
      </div>

      {/* Rationale */}
      {match.rationale && match.rationale.length > 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          {match.rationale[0]}
        </div>
      )}
    </div>
  );
}

// --- Main Modal Component ---
interface PlaceOrderModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onOrderPlaced?: (order: Order) => void;
}

interface Order {
  id: string;
  amount: string;
  item: string;
  details: string;
  timing: string | null;
  additionalInfo: string | null;
}

export function PlaceOrderModal({
  isOpen,
  onOpenChange,
  onOrderPlaced,
}: PlaceOrderModalProps) {
  // Updated view state to include 'travelers' and 'success'
  const [view, setView] = useState<
    'details' | 'stores' | 'delivery' | 'travelers' | 'success'
  >('details');

  // State for potential matches (before booking)
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [isFindingMatches, setIsFindingMatches] = useState(false);

  // Track which booking flow was used
  const [bookingFlow, setBookingFlow] = useState<'direct' | 'marketplace' | null>(null);

  // State for the current request ID (set when order is submitted)
  const [requestId, setRequestId] = useState<string | null>(null);

  // State for store search
  const [searchQuery, setSearchQuery] = useState('');

  // Form validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Use Zustand store for form state
  const {
    formData,
    updateProductDetails,
    updateDeliveryDetails,
    setQuantity,
    resetForm,
    submitOrder,
    isSubmitting,
    validateForm: validateStoreForm,
  } = useOrderStore();

  // Enhanced reset function
  const handleReset = () => {
    resetForm();
    setBookingFlow(null);
    setPotentialMatches([]);
    setRequestId(null);
    setFieldErrors({});
  };

  // Auth hook for API calls
  const { getToken } = useAuth();


  const handleQuantityChange = (amount: number) => {
    setQuantity(Math.max(1, formData.quantity + amount));
  };

  // Input change and blur handlers for validation
  const handleInputChange = (field: string, value: string) => {
    if (field in formData.productDetails) {
      updateProductDetails({ [field]: value });
    } else if (field in formData.deliveryDetails) {
      updateDeliveryDetails({ [field]: value });
    }
    // Clear error on change
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: string) => {
    // Use store validation and update field errors
    const isValid = validateStoreForm();
    // For now, we'll handle field-level validation in the store
    // TODO: Extract field-level errors from store validation
  };

  // Enhanced validation function for API submission
  const validateFormForSubmission = () => {
    const errors: Record<string, string> = {};

    // Product Details Validation
    if (!formData.productDetails.name?.trim()) errors.name = 'Product name is required';
    if (!formData.productDetails.price?.trim()) errors.price = 'Product price is required';

    // Price validation
    if (formData.productDetails.price) {
      const price = parseFloat(formData.productDetails.price);
      if (isNaN(price) || price <= 0) {
        errors.price = 'Price must be a positive number';
      }
    }

    // Weight validation (like CreateTripModal)
    if (formData.productDetails.weight) {
      const weight = parseFloat(formData.productDetails.weight);
      if (isNaN(weight) || weight <= 0 || weight > 50) {
        errors.weight = 'Weight must be between 0.1 and 50 kg';
      }
    } else {
      errors.weight = 'Weight is required';
    }

    // URL validation (required)
    if (!formData.productDetails.url?.trim()) {
      errors.url = 'Product URL is required';
    } else {
      try {
        new URL(formData.productDetails.url);
      } catch {
        errors.url = 'Please enter a valid URL';
      }
    }

    // Delivery Details Validation
    if (!formData.deliveryDetails.buyingFrom?.trim()) errors.buyingFrom = 'Buying location is required';
    if (!formData.deliveryDetails.deliveringTo?.trim()) errors.deliveringTo = 'Delivery destination is required';

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  // Photo handling functions
  const handlePhotoUpdate = (index: number, url: string) => {
    const currentPhotos = formData.productDetails.photos || [];
    const newPhotos = [...currentPhotos];
    newPhotos[index] = url;

    // Filter out empty slots
    const filteredPhotos = newPhotos.filter(url => url && url.trim() !== '');

    updateProductDetails({ photos: filteredPhotos });
  };

  const handlePhotoRemove = (index: number) => {
    const currentPhotos = formData.productDetails.photos || [];
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    updateProductDetails({ photos: newPhotos });
  };

  // Render the "Product Details" form
  const renderDetailsView = () => (
    <>
      <DialogHeader className='sticky top-0 bg-white z-10 p-6 pb-4 border-b rounded-t-xl'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              className='p-1 rounded-full hover:bg-gray-100'
              onClick={() => onOpenChange(false)}
            >
              <ChevronLeft className='h-6 w-6' />
            </button>
            <DialogTitle className='text-lg font-semibold text-gray-900'>
              Product Details
            </DialogTitle>
          </div>
          <span className='text-sm font-medium text-gray-500'>Step 1/3</span>
        </div>
      </DialogHeader>

      {/* Scrollable Form Content */}
      <div className='flex-1 overflow-y-auto p-6 space-y-5 rounded-b-xl'>
        {/* Product Category Select */}
        <FormField id='category' label='Enter Product Category'>
          <Select value={formData.productDetails.category} onValueChange={(value) => updateProductDetails({ category: value })}>
            <SelectTrigger className='w-full h-11'>
              <SelectValue placeholder='Select a category' />
            </SelectTrigger>
            <SelectContent>

              {categories.map(cat => (
                <SelectItem key={cat.name} value={cat.name}>
                  <div className='flex items-center gap-3 py-2'>
                    <div className='text-gray-500'>{cat.icon}</div>
                    <div>
                      <p className='font-medium text-gray-800'>{cat.name}</p>
                      <p className='text-xs text-gray-500'>{cat.desc}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* Product URL */}
        <FormField id='url' label='Enter Product URL'>
          <div className='relative'>
            <Input
              id='url'
              placeholder='www.amazon.com'
              className='h-11 pr-24'
              value={formData.productDetails.url || ''}
              onChange={(e) => handleInputChange('url', e.target.value)}
              onBlur={() => handleBlur('url')}
              disabled={isSubmitting}
              aria-describedby={fieldErrors.url ? 'url-error' : undefined}
              aria-required="true"
            />
            <button
              type='button'
              onClick={() => setView('stores')}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-purple-700 hover:text-purple-800 cursor-pointer'
              disabled={isSubmitting}
            >
              Browse Stores
            </button>
          </div>
          {fieldErrors.url && (
            <p id="url-error" className="text-red-500 text-sm mt-1" role="alert">
              {fieldErrors.url}
            </p>
          )}
        </FormField>

        {/* Product Name */}
        <FormField id='name' label='Enter Product Name'>
          <Input
            id='name'
            placeholder='Derma-cos skin-solve'
            className='h-11'
            value={formData.productDetails.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            disabled={isSubmitting}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            aria-required="true"
          />
          {fieldErrors.name && (
            <p id="name-error" className="text-red-500 text-sm mt-1" role="alert">
              {fieldErrors.name}
            </p>
          )}
        </FormField>

        {/* Product Colour */}
        <FormField id='colour' label='Enter Product Colour'>
          <Input
            id='colour'
            placeholder='Teal Green'
            className='h-11'
            value={formData.productDetails.colour || ''}
            onChange={(e) => updateProductDetails({ colour: e.target.value })}
          />
        </FormField>

        {/* Product Weight */}
        <FormField id='weight' label='Enter Product Weight'>
          <div className="relative">
            <input
              type="number"
              min="0.1"
              step="0.1"
              id="weight"
              placeholder="e.g., 2.5"
              title="Enter weight in kilograms"
              className="h-11 pl-3 pr-10 border rounded-md w-full"
              value={formData.productDetails.weight || ''}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              onBlur={() => handleBlur('weight')}
              disabled={isSubmitting}
              aria-describedby={fieldErrors.weight ? 'weight-error' : undefined}
              aria-required="true"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">KG</span>
          </div>
          {fieldErrors.weight && (
            <p id="weight-error" className="text-red-500 text-sm mt-1" role="alert">
              {fieldErrors.weight}
            </p>
          )}
        </FormField>

        {/* Product Price */}
        <FormField id='price' label='Enter Product Price'>
          <div className='flex gap-2'>
            <Input
              id='price'
              placeholder='$250'
              className='h-11'
              value={formData.productDetails.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              onBlur={() => handleBlur('price')}
              disabled={isSubmitting}
              aria-describedby={fieldErrors.price ? 'price-error' : undefined}
              aria-required="true"
            />
            <Select
              value={formData.productDetails.currency}
              onValueChange={(value) => updateProductDetails({ currency: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger className='w-[100px] h-11 py-[21px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='USD'>USD</SelectItem>
                {/* <SelectItem value='EUR'>EUR</SelectItem>
                <SelectItem value='GBP'>GBP</SelectItem> */}
              </SelectContent>
            </Select>
          </div>
          {fieldErrors.price && (
            <p id="price-error" className="text-red-500 text-sm mt-1" role="alert">
              {fieldErrors.price}
            </p>
          )}
        </FormField>

        {/* Product Photos */}
<FormField
  id='photos'
  label={<>Add Product Photos <span className="text-gray-400">(Max size of 3MB each)</span></>}
  className='font-sm'
>
  <PhotoUpload
    endpoint="productUploader"
    multiple={true}
    maxFiles={3}
    currentPhotos={formData.productDetails.photos || []}
    onPhotosUpdate={(urls) => updateProductDetails({ photos: urls })}
    placeholder="Add photos"
  />
</FormField>

        {/* Add Quantity */}
        <FormField id='quantity' label='Add Quantity'>
          <div className='flex items-center justify-center gap-4 w-full h-11'>
            <button
              type='button'
              onClick={() => handleQuantityChange(-1)}
              className='w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50'
            >
              <Minus className='h-5 w-5' />
            </button>
            <span className='text-lg font-semibold w-12 text-center'>
              {formData.quantity}
            </span>
            <button
              type='button'
              onClick={() => handleQuantityChange(1)}
              className='w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50'
            >
              <Plus className='h-5 w-5' />
            </button>
          </div>
        </FormField>

        {/* Fragile Item */}
        <div className='flex items-center justify-between'>
          <Label
            htmlFor='fragile'
            className='text-sm font-medium text-gray-700 font-sans'
          >
            Is this a very fragile item?
          </Label>
          <Switch
            id='fragile'
            checked={formData.productDetails.fragile}
            onCheckedChange={(checked) => updateProductDetails({ fragile: checked })}
          />
        </div>

        {/* Additional Information */}
        <FormField
          id='additional-info'
          label='Additional Information (Highly needed)'
          className='font-sans'
        >
          <Textarea
            id='additional-info'
            placeholder='Explain in details all you want the product to look like'
            rows={4}
            value={formData.productDetails.additionalInfo || ''}
            onChange={(e) => updateProductDetails({ additionalInfo: e.target.value })}
          />
        </FormField>

        {/* Buttons at the bottom of the form */}
        <div className='pt-6 mt-4 border-t gap-3 flex flex-col sm:flex-row sm:justify-between rounded-b-xl'>
          <Button variant='outline' className='w-full sm:w-auto'>
            Add another item
          </Button>
          <Button
            className='w-full sm:w-auto bg-purple-900 hover:bg-purple-800'
            onClick={() => setView('delivery')} // Updated onClick
          >
            Enter Delivery Details
          </Button>
        </div>
      </div>
    </>
  );

  // "Browse Stores"
  const renderStoresView = () => (
    <>
      <DialogHeader className="sticky top-0 bg-white z-10 p-6 pb-4 border-b rounded-t-xl">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setView('details')} // Bug Fix: Was 'delivery', now 'details'
            className="p-1 rounded-full hover:bg-gray-100 mr-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            What store will this product be from?
          </DialogTitle>
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 rounded-xl">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search for stores"
            className="h-11 pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Store List */}
        <div className="space-y-2">
          {stores.filter(store => store.name.toLowerCase().includes(searchQuery.toLowerCase())).map(store => (
            <a
              key={store.name}
              href={store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-32 h-10 rounded-none flex items-center justify-center overflow-hidden">
                  <NextImage
                    src={store.logo}
                    alt={store.name}
                    width={60}
                    height={40}
                  />
                  {/* <span className="text-xs">{store.name} Logo</span> */}
                </div>
                {/* <span className="font-medium">{store.name}</span> */}
              </div>
              <ExternalLink className="h-5 w-5 text-purple-900" />
            </a>
          ))}
        </div>
      </div>
    </>
  );

  // New "Delivery Details" view (Step 2)
  const renderDeliveryView = () => (
    <>
      <DialogHeader className="sticky top-0 bg-white z-10 p-6 pb-4 border-b rounded-t-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-1 rounded-full hover:bg-gray-100"
              onClick={() => setView('details')} // Goes back to details
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Delivery Details
            </DialogTitle>
          </div>
          <span className="text-sm font-medium text-gray-500">Step 2/3</span>
        </div>
      </DialogHeader>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 rounded-b-xl">
        <p className="text-sm text-gray-500 text-center border-b border-b-gray-200 pb-2.5 mb-8">
          Travelers have up to 24 hours after arrival to drop off items at our
          approved stores for you to pick up.
        </p>

        {/* Pickup Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="pickup-for-me"
            checked={formData.deliveryDetails.pickup}
            onCheckedChange={(checked) => updateDeliveryDetails({ pickup: checked === true })}
          />
          <Label
            htmlFor="pickup-for-me"
            className="text-sm font-medium text-gray-800 font-sans"
          >
            Somebody will be picking up my item(s) for me
          </Label>
        </div>

        {/* Buying From */}
        <FormField id="buying-from" label="Buying From">
          <div className="relative">
            <Input
              id="buying-from"
              placeholder="New York, USA"
              className="h-11 pl-10"
              value={formData.deliveryDetails.buyingFrom || ''}
              onChange={(e) => handleInputChange('buyingFrom', e.target.value)}
              onBlur={() => handleBlur('buyingFrom')}
              disabled={isSubmitting}
              aria-describedby={fieldErrors.buyingFrom ? 'buying-from-error' : undefined}
              aria-required="true"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {fieldErrors.buyingFrom && (
            <p id="buying-from-error" className="text-red-500 text-sm mt-1" role="alert">
              {fieldErrors.buyingFrom}
            </p>
          )}
        </FormField>

        {/* Delivering To */}
        <FormField id="delivering-to" label="Delivering To">
          <div className="relative">
            <Input
              id="delivering-to"
              placeholder="Lagos, Nigeria"
              className="h-11 pl-10"
              value={formData.deliveryDetails.deliveringTo}
              onChange={(e) => handleInputChange('deliveringTo', e.target.value)}
              onBlur={() => handleBlur('deliveringTo')}
              disabled={isSubmitting}
              aria-describedby={fieldErrors.deliveringTo ? 'delivering-to-error' : undefined}
              aria-required="true"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {fieldErrors.deliveringTo && (
            <p id="delivering-to-error" className="text-red-500 text-sm mt-1" role="alert">
              {fieldErrors.deliveringTo}
            </p>
          )}
        </FormField>

        {/* Delivery Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <FormField id="delivery-start-date" label="Earliest Delivery Date">
            <DatePicker
              date={parseDate(formData.deliveryDetails.deliveryStartDate || '') || undefined}
              onDateChange={(date) => updateDeliveryDetails({
                deliveryStartDate: date ? format(date, 'MM/dd/yyyy') : ''
              })}
              placeholder="Select start date"
            />
          </FormField>

          <FormField id="delivery-end-date" label="Latest Delivery Date">
            <DatePicker
              date={parseDate(formData.deliveryDetails.deliveryEndDate || '') || undefined}
              onDateChange={(date) => updateDeliveryDetails({
                deliveryEndDate: date ? format(date, 'MM/dd/yyyy') : ''
              })}
              placeholder="Select end date"
            />
          </FormField>
        </div>

        {/* Additional Phone Number */}
        <FormField id="phone" label="Additional Phone Number">
          <div className="flex gap-2 ">
            <Select value={formData.deliveryDetails.phoneCountry} onValueChange={(value) => updateDeliveryDetails({ phoneCountry: value })}>
              <SelectTrigger className="w-[100px] h-11 py-[21px]">
                <SelectValue placeholder="🇳🇬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NG">🇳🇬</SelectItem>
                <SelectItem value="US">🇺🇸</SelectItem>
                <SelectItem value="GB">🇬🇧</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="phone"
              type="tel"
              placeholder="910 000 0000"
              className="h-11"
              value={formData.deliveryDetails.phone || ''}
              onChange={(e) => updateDeliveryDetails({ phone: e.target.value })}
            />
          </div>
        </FormField>

        {/* How carried */}
        <div className="space-y-3">
          <Label>How do you want this product carried?</Label>
          <RadioGroup
            value={formData.deliveryDetails.carryOn ? 'carry-on' : 'check-in'}
            onValueChange={(value) => updateDeliveryDetails({ carryOn: value === 'carry-on' })}
            className="space-y-2"
          >
            <RadioOption
              id="carry-on"
              label="Carry-On"
              infoText="Item will be carried on the plane with the traveler."
            />
            <RadioOption
              id="check-in"
              label="Check-In"
              infoText="Item will be checked in as luggage."
            />
          </RadioGroup>
        </div>

        {/* How delivered */}
        <div className="space-y-3">
          <Label>How do you want this package delivered?</Label>
          <RadioGroup
            value={formData.deliveryDetails.storePickup ? 'store-pickup' : 'in-person'}
            onValueChange={(value) => updateDeliveryDetails({ storePickup: value === 'store-pickup' })}
            className="space-y-2"
          >
            <RadioOption
              id="in-person"
              label="In-person"
              infoText="Meet the traveler in person for drop-off."
            />
            <RadioOption
              id="store-pickup"
              label="BagXtra store pick-up"
              infoText="Pick up your item from a secure BagXtra partner store."
            />
          </RadioGroup>
        </div>

        {/* Buttons */}
        <div className="pt-6 mt-4 border-t rounded-b-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="w-full sm:flex-1 bg-purple-900 hover:bg-purple-800"
              onClick={handleFindTravelers}
              disabled={isFindingMatches}
            >
              {isFindingMatches ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding Travelers...
                </>
              ) : (
                'Find Traveler'
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full sm:flex-1 border-purple-900 text-purple-900 hover:bg-purple-50"
              onClick={handleGetProposals}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Marketplace Order...
                </>
              ) : (
                'Get proposals from travellers'
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  // Booking state
  const [bookingMatchId, setBookingMatchId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Handle finding travelers without creating database records
  const handleFindTravelers = async () => {
    if (isFindingMatches) return;

    setBookingError(null);

    // Validate form using our enhanced validation
    const validation = validateFormForSubmission();
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    try {
      setIsFindingMatches(true);
      const token = await getToken();
      if (!token) {
        setBookingError('Authentication required. Please log in again.');
        return;
      }

      // Find potential matches without creating database records
      const matchesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/shopper-requests/find-matches`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromCountry: formData.deliveryDetails.buyingFrom.trim(),
          toCountry: formData.deliveryDetails.deliveringTo.trim(),
          deliveryStartDate: formData.deliveryDetails.deliveryStartDate || undefined,
          deliveryEndDate: formData.deliveryDetails.deliveryEndDate || undefined,
          bagItems: [{
            productName: formData.productDetails.name.trim(),
            productLink: formData.productDetails.url?.trim() || undefined,
            price: parseFloat(formData.productDetails.price),
            currency: formData.productDetails.currency,
            weightKg: parseFloat(formData.productDetails.weight!),
            quantity: formData.quantity,
            isFragile: formData.productDetails.fragile,
            photos: formData.productDetails.photos || [],
            colour: formData.productDetails.colour || undefined,
            additionalInfo: formData.productDetails.additionalInfo || undefined,
            requiresSpecialDelivery: false,
            specialDeliveryCategory: undefined
          }]
        })
      });

      if (!matchesResponse.ok) {
        const errorData = await matchesResponse.json();
        if (errorData.details) {
          // Handle validation errors
          const validationMessages = errorData.details.map((detail: any) =>
            `${detail.field}: ${detail.message}`
          );
          setBookingError(`Please fix the following errors:\n${validationMessages.join('\n')}`);
        } else {
          setBookingError(errorData.message || 'Failed to find matches');
        }
        return;
      }

      const matchesData = await matchesResponse.json();
      setPotentialMatches(matchesData.data || []);

      // Set booking flow and navigate to travelers view
      setBookingFlow('direct');
      setView('travelers');
    } catch (error) {
      console.error('Matching error:', error);
      if (error instanceof Error) {
        setBookingError(error.message);
      } else {
        setBookingError('Network error occurred. Please check your connection and try again.');
      }
    } finally {
      setIsFindingMatches(false);
    }
  };

  // Handle getting proposals from travelers (marketplace)
  const handleGetProposals = async () => {
    if (isSubmitting) return;

    setBookingError(null);

    // Validate form using our enhanced validation
    const validation = validateFormForSubmission();
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setBookingError('Authentication required. Please log in again.');
        return;
      }

      // Create shopper request with marketplace status
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/shopper-requests`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromCountry: formData.deliveryDetails.buyingFrom.trim(),
          destinationCountry: formData.deliveryDetails.deliveringTo.trim(),
          deliveryStartDate: formData.deliveryDetails.deliveryStartDate || undefined,
          deliveryEndDate: formData.deliveryDetails.deliveryEndDate || undefined,
          pickup: formData.deliveryDetails.pickup || false,
          carryOn: formData.deliveryDetails.carryOn || false,
          storePickup: formData.deliveryDetails.storePickup || false,
          phone: formData.deliveryDetails.phone || '',
          phoneCountry: formData.deliveryDetails.phoneCountry || 'NG',
          bagItems: [{
            productName: formData.productDetails.name.trim(),
            productLink: formData.productDetails.url?.trim() || undefined,
            price: parseFloat(formData.productDetails.price),
            currency: formData.productDetails.currency,
            weightKg: parseFloat(formData.productDetails.weight!),
            quantity: formData.quantity,
            isFragile: formData.productDetails.fragile,
            photos: formData.productDetails.photos || [],
            colour: formData.productDetails.colour || undefined,
            additionalInfo: formData.productDetails.additionalInfo || undefined,
            requiresSpecialDelivery: false,
            specialDeliveryCategory: undefined
          }]
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        if (errorData.details) {
          const validationMessages = errorData.details.map((detail: any) =>
            `${detail.field}: ${detail.message}`
          );
          setBookingError(`Please fix the following errors:\n${validationMessages.join('\n')}`);
        } else {
          setBookingError(errorData.message || 'Failed to create marketplace request');
        }
        return;
      }

      const createData = await createResponse.json();
      const requestId = createData.data.id;

      // Publish the request with marketplace status (no automatic matching)
      const publishResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/shopper-requests/${requestId}/publish`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'marketplace' }) // Specify marketplace status
      });

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        throw new Error(errorData.message || 'Failed to publish marketplace request');
      }

      // Set booking flow and show success view
      setBookingFlow('marketplace');
      setView('success');
    } catch (error) {
      console.error('Marketplace creation error:', error);
      if (error instanceof Error) {
        setBookingError(error.message);
      } else {
        setBookingError('Network error occurred. Please check your connection and try again.');
      }
    }
  };

  // Handle booking a traveler (creates order and sends booking request)
  const handleBookTraveler = async (matchId: string) => {
    try {
      setBookingMatchId(matchId);
      setBookingError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // First, create the shopper request
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/shopper-requests`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromCountry: formData.deliveryDetails.buyingFrom.trim(),
          destinationCountry: formData.deliveryDetails.deliveringTo.trim(),
          deliveryStartDate: formData.deliveryDetails.deliveryStartDate || undefined,
          deliveryEndDate: formData.deliveryDetails.deliveryEndDate || undefined,
          pickup: formData.deliveryDetails.pickup || false,
          carryOn: formData.deliveryDetails.carryOn || false,
          storePickup: formData.deliveryDetails.storePickup || false,
          phone: formData.deliveryDetails.phone || '',
          phoneCountry: formData.deliveryDetails.phoneCountry || 'NG',
          bagItems: [{
            productName: formData.productDetails.name.trim(),
            productLink: formData.productDetails.url?.trim() || undefined,
            price: parseFloat(formData.productDetails.price),
            currency: formData.productDetails.currency,
            weightKg: parseFloat(formData.productDetails.weight!),
            quantity: formData.quantity,
            isFragile: formData.productDetails.fragile,
            photos: formData.productDetails.photos || [],
            colour: formData.productDetails.colour || undefined,
            additionalInfo: formData.productDetails.additionalInfo || undefined,
            requiresSpecialDelivery: false,
            specialDeliveryCategory: undefined
          }]
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Failed to create request');
      }

      const createData = await createResponse.json();
      const requestId = createData.data.id;

      // Publish the request
      const publishResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/shopper-requests/${requestId}/publish`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        throw new Error(errorData.message || 'Failed to publish request');
      }

      // Notify parent component with new order data for optimistic update
      const newOrder = {
        id: `temp_${Date.now()}`, // Temporary ID for optimistic updates
        amount: `$${(parseFloat(formData.productDetails.price || '0') * formData.quantity).toFixed(2)}`,
        item: formData.productDetails.name,
        details: 'Waiting for traveler approval',
        timing: null,
        additionalInfo: null
      };
      onOrderPlaced?.(newOrder);

      // Fetch the matches created by publish
      const matchesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/shopper-requests/${requestId}/matches`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!matchesResponse.ok) {
        const errorData = await matchesResponse.json();
        throw new Error(errorData.message || 'Failed to fetch matches');
      }

      const matchesData = await matchesResponse.json();
      const matches = matchesData.data || [];

      if (matches.length === 0) {
        throw new Error('No matches found for this request');
      }

      // Find the match with the correct tripId
      const selectedTripId = matchId.replace('temp_', ''); // Clean the ID
      const selectedMatch = potentialMatches.find(m => m._id === matchId);

      // Try multiple ways to find the correct match
      const targetMatch = matches.find((m: any) => {
        // Match by trip ID if available
        if (m.tripId === selectedTripId) return true;

        // Match by flight details
        if (selectedMatch && m.flightDetails) {
          return m.flightDetails.from === selectedMatch.flightDetails.from &&
                 m.flightDetails.to === selectedMatch.flightDetails.to;
        }

        return false;
      });

      if (!targetMatch) {
        throw new Error('Selected traveler match not found');
      }

      // Match found successfully - booking request sent
      // Match stays "Pending" for traveler to accept/reject

      // Set booking flow and show success view
      setBookingFlow('direct');
      setView('success');
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError(error instanceof Error ? error.message : 'Failed to book traveler');
    } finally {
      setBookingMatchId(null);
    }
  };

  // New "Find Traveler" view (Step 3)
  const renderTravelerView = () => {
    const matches = potentialMatches;

    return (
      <>
        <DialogHeader className="sticky top-0 bg-white z-10 p-6 pb-4 border-b rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-100"
                onClick={() => setView('delivery')} // Goes back to delivery
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Find Traveller
              </DialogTitle>
            </div>
            <span className="text-sm font-medium text-gray-500">Step 3/3</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 rounded-b-xl bg-gray-50">
          <p className="text-sm text-gray-500 border-b border-b-gray-200 pb-2.5 mb-8 text-center">
            Travelers have up to 24 hours after arrival to drop off items at our
            approved stores for you to pick up.
          </p>

          {/* Error Display */}
          {bookingError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{bookingError}</p>
            </div>
          )}

          {/* Loading State */}
          {isFindingMatches && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-900"></div>
              <span className="ml-2 text-gray-600">Finding travelers...</span>
            </div>
          )}

          {/* Error State */}
          {bookingError && !isFindingMatches && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Failed to load travelers</p>
              <p className="text-gray-500 text-sm">{bookingError}</p>
            </div>
          )}

          {/* No Matches */}
          {!isFindingMatches && !bookingError && matches.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-2">No travelers found for your request</p>
              <p className="text-gray-500 text-sm">Try adjusting your delivery preferences or check back later</p>
            </div>
          )}

          {/* Traveler List */}
          {!isFindingMatches && !bookingError && matches.length > 0 && (
            <div className="space-y-4">
              {matches.map((match) => (
                <TravelerCard
                  key={match._id}
                  match={match}
                  onBookTraveler={handleBookTraveler}
                  isBooking={bookingMatchId === match._id}
                />
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  // Success view - different content based on booking flow
  const renderSuccessView = () => {
    if (bookingFlow === 'marketplace') {
      // Marketplace success - offer posted
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-full bg-white">
          <CheckCircle className="h-16 w-16 text-purple-900 mb-4" />
          <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
            Offer Posted
          </DialogTitle>
          <p className="text-sm text-gray-600 mb-6">
            Travelers who are interested will send a proposal message and you can choose from them
          </p>

          {/* Action Buttons */}
          <div className="space-y-3 w-full max-w-xs">
            <Button
              className="w-full bg-purple-900 hover:bg-purple-800 h-11"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      );
    } else {
      // Direct booking success - request sent to traveler
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-full bg-white">
          <CheckCircle className="h-16 w-16 text-purple-900 mb-4" />
          <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
            Request has been sent to traveler
          </DialogTitle>
          <p className="text-sm text-gray-600 mb-6">
            We will send a notification once traveler accepts, after which payment can be made
          </p>

          {/* Action Buttons */}
          <div className="space-y-3 w-full max-w-xs">
            <Button
              className="w-full bg-purple-900 hover:bg-purple-800 h-11"
              onClick={() => {
                handleReset();
                setView('details');
              }}
            >
              Create New Order
            </Button>
            <Button
              variant="outline"
              className="w-full border-purple-900 text-purple-900 hover:bg-purple-50 h-11"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md lg:max-w-lg p-0 gap-0 flex ${view === 'success' ? 'max-h-[50vh]' : 'flex-col max-h-[90vh] h-full'} font-space-grotesk rounded-xl`}>
        {/* Updated rendering logic */}
        {view === 'details' && renderDetailsView()}
        {view === 'stores' && renderStoresView()}
        {view === 'delivery' && renderDeliveryView()}
        {view === 'travelers' && renderTravelerView()}
        {view === 'success' && renderSuccessView()}
      </DialogContent>
    </Dialog>
  );
}
