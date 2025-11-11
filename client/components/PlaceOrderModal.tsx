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
import Image from 'next/image';

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
  { name: 'Amazon', logo: '/amazon.png' },
  { name: 'Walmart', logo: '/walmart.png' },
  { name: 'Adidas', logo: '/adidas.png' },
  { name: 'Apples', logo: '/Apples.png' },
  { name: 'Ikea', logo: '/Ikea.png' },
  { name: 'Gucci', logo: '/gucci.png' },
  // ... other stores
];

// New Mock Data for Travelers
const travelers = [
  {
    id: 1,
    name: 'Adeshina Adewale',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
    rating: 5,
    origin: 'LA',
    originTime: '10:30 am',
    originDate: '12/12/25',
    dest: 'LAG',
    destTime: '12:40 pm',
    destDate: '12/12/25',
    duration: '2h10m',
    match: 90,
  },
  {
    id: 2,
    name: 'Adeshina Adewale',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
    rating: 5,
    origin: 'LA',
    originTime: '10:30 am',
    originDate: '12/12/25',
    dest: 'LAG',
    destTime: '12:40 pm',
    destDate: '12/12/25',
    duration: '2h10m',
    match: 70,
  },
];

// --- Helper Components ---
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

// Traveler Card Component
function TravelerCard({
  traveler,
}: {
  traveler: (typeof travelers)[0];
}) {
  const getMatchColor = (match: number) => {
    if (match >= 90) return 'text-purple-900';
    if (match >= 70) return 'text-purple-900';
    return 'text-red-600';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4 shadow-sm">
      {/* Top Section: Profile + Book Button */}
      <div className="flex justify-between items-center border-b border-b-gray-200 pb-2.5">
        <div className="flex flex-col items-left gap-3">
          <Image
            src={traveler.avatar}
            alt={traveler.name}
            width={80}
            height={10}
            className="rounded-lg bg-gray-200 h-24"
          />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 flex items-center justify-center gap-1 font-sans">
              {traveler.name}
              {/* <CheckCircle className="h-4 w-4 text-green-500" /> */}
              <img src="/verified.png" alt="check" className='h-4 w-4' />
            </h3>
            <div className="flex gap-0.5 justify-start">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < traveler.rating
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
          className="text-purple-900 border-purple-900 hover:bg-purple-50 hover:text-purple-800 cursor-pointer"
        >
          Book Traveler
        </Button>
      </div>

      {/* Middle Section: Flight Info */}
      <div className="flex justify-between items-center text-sm">
        <div className="text-left">
          <div className="text-lg font-bold text-gray-900">
            {traveler.origin}
          </div>
          <div className="text-gray-600 flex ">{traveler.originDate} <span className='pl-3'>--------</span></div>
          <div className="text-gray-600">{traveler.originTime}</div>
        </div>
        <div className="text-center text-gray-500">
          <Plane className="mx-auto" />
          <div className="mt-1">{traveler.duration}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{traveler.dest}</div>
          <div className="text-gray-600 flex"><span className='pr-3'>--------</span>{traveler.destDate}</div>
          <div className="text-gray-600">{traveler.destTime}</div>
        </div>
      </div>

      {/* Bottom Section: Match % */}
      <div className="flex justify-center">
        <div
          className={`text-center font-semibold px-3 py-1 rounded-none border-b border-b-purple-900 ${getMatchColor(traveler.match)}`}
        >
          {traveler.match}% Match
        </div>
      </div>
    </div>
  );
}

// --- Main Modal Component ---
interface PlaceOrderModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PlaceOrderModal({
  isOpen,
  onOpenChange,
}: PlaceOrderModalProps) {
  // Updated view state to include 'travelers'
  const [view, setView] = useState<
    'details' | 'stores' | 'delivery' | 'travelers'
  >('details');
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
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
          <Select>
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
            />
            <button
              type='button'
              onClick={() => setView('stores')}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-purple-700 hover:text-purple-800 cursor-pointer'
            >
              Browse Stores
            </button>
          </div>
        </FormField>

        {/* Product Name */}
        <FormField id='name' label='Enter Product Name'>
          <Input
            id='name'
            placeholder='Derma-cos skin-solve'
            className='h-11'
          />
        </FormField>

        {/* Product Colour */}
        <FormField id='colour' label='Enter Product Colour'>
          <Input id='colour' placeholder='Teal Green' className='h-11' />
        </FormField>

        {/* Product Weight */}
        <FormField id='weight' label='Enter Product Weight'>
          <Input
            id='weight'
            placeholder='e.g., 2kg or 0.5lbs'
            className='h-11'
          />
        </FormField>

        {/* Product Price */}
        <FormField id='price' label='Enter Product Price'>
          <div className='flex gap-2'>
            <Input id='price' placeholder='$250' className='h-11' />
            <Select defaultValue='USD'>
              <SelectTrigger className='w-[100px] h-11'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='USD'>USD</SelectItem>
                <SelectItem value='EUR'>EUR</SelectItem>
                <SelectItem value='GBP'>GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FormField>

        {/* Product Photos */}
        <FormField
          id='photos'
          label='Add Product Photos (Max. size of 3mb each)'
        >
          <div className='grid grid-cols-3 gap-3'>
            {[1, 2, 3].map(i => (
              <button
                key={i}
                type='button'
                className='aspect-square w-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-gray-400'
              >
                <Plus className='h-8 w-8' />
              </button>
            ))}
          </div>
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
              {quantity}
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
          <Switch id='fragile' />
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
          <Input placeholder="Search for stores" className="h-11 pl-10" />
        </div>

        {/* Store List */}
        <div className="space-y-2">
          {stores.map(store => (
            <button
              key={store.name}
              className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-32 h-10 rounded-none flex items-center justify-center overflow-hidden">
                  <Image
                    src={store.logo}
                    alt={store.name}
                    width={60}
                    height={40}
                  />
                  {/* <span className="text-xs">{store.name} Logo</span> */}
                </div>
                {/* <span className="font-medium">{store.name}</span> */}
              </div>
              <ExternalLink className="h-5 w-5 text-purple-900 " />
            </button>
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
          <Checkbox id="pickup-for-me" />
          <Label
            htmlFor="pickup-for-me"
            className="text-sm font-medium text-gray-800 font-sans"
          >
            Somebody will be picking up my item(s) for me
          </Label>
        </div>

        {/* Delivering To */}
        <FormField id="delivering-to" label="Delivering To">
          <div className="relative">
            <Input
              id="delivering-to"
              placeholder="Lagos, Nigeria"
              className="h-11 pl-10"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </FormField>

        {/* Delivery Date Range */}
        <FormField id="date-range" label="Delivery Date Range">
          <div className="relative">
            <Input
              id="date-range"
              placeholder="15th May, 2025 - 20th May, 2025"
              className="h-11 pl-10"
            />
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </FormField>

        {/* Additional Phone Number */}
        <FormField id="phone" label="Additional Phone Number">
          <div className="flex gap-2">
            <Select defaultValue="NG">
              <SelectTrigger className="w-[100px] h-11">
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
            />
          </div>
        </FormField>

        {/* How carried */}
        <div className="space-y-3">
          <Label>How do you want this product carried?</Label>
          <RadioGroup defaultValue="carry-on" className="space-y-2">
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
          <RadioGroup defaultValue="in-person" className="space-y-2">
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

        {/* Button */}
        <div className="pt-6 mt-4 border-t rounded-b-xl">
          <Button
            className="w-full bg-purple-900 hover:bg-purple-800"
            onClick={() => setView('travelers')} 
          >
            Find Traveler
          </Button>
        </div>
      </div>
    </>
  );

  // New "Find Traveler" view (Step 3)
  const renderTravelerView = () => (
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

        {/* Traveler List */}
        <div className="space-y-4">
          {travelers.map((traveler) => (
            <TravelerCard key={traveler.id} traveler={traveler} />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md lg:max-w-lg p-0 gap-0 flex flex-col max-h-[90vh] h-full font-space-grotesk rounded-xl">
        {/* Updated rendering logic */}
        {view === 'details' && renderDetailsView()}
        {view === 'stores' && renderStoresView()}
        {view === 'delivery' && renderDeliveryView()}
        {view === 'travelers' && renderTravelerView()}
      </DialogContent>
    </Dialog>
  );
}
